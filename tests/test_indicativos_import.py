import csv
import hashlib
import importlib.util
import io
import json
import tempfile
import shutil
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('indicativos_import',ROOT/'scripts/update-indicativos-data.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class IndicativosImport(unittest.TestCase):
    def fixture(self, path, **changes):
        row={label:'N/I' for label in module.FIELDS.values()}
        row.update({'Indicativo':'PU2ABC','Nome da Entidade':'TITULAR FICTÍCIO DE TESTE','COER':'Classe C','Tipo de Estação':'Fixa','Município da Estação':'Cidade de teste','UF da Estação':'sp','Data de Validade da Estação':'31/12/2030','Status da Validade':'Ativa','Tipo de Identificação':'CPF','CNPJ ou CPF':'***12345**','Logradouro':'ENDERECO-QUE-NAO-DEVE-SAIR'})
        row.update(changes)
        text=io.StringIO();writer=csv.DictWriter(text,fieldnames=list(row),delimiter=';');writer.writeheader();writer.writerow(row)
        with zipfile.ZipFile(path,'w') as archive:archive.writestr(module.MEMBER,text.getvalue().encode('utf-8-sig'))

    def test_allowlist_source_fields_and_unicode(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);archive=root/'data.zip';self.fixture(archive);out=root/'output'
            meta=module.publish_zip(archive,out,minimum_records=1)
            payload=json.loads((out/'versions'/meta['revision']/'PU2.json').read_text())
            row=payload['calls']['PU2ABC'][0]
            self.assertEqual(set(row),set(module.FIELDS));self.assertEqual(row['state'],'SP');self.assertIsNone(row['firstLicensed'])
            all_output=''.join(p.read_text() for p in out.rglob('*.json'))
            self.assertEqual(row['document'],'***12345**');self.assertNotIn('ENDERECO-QUE-NAO-DEVE-SAIR',all_output)
            self.assertEqual(meta['records'],1);self.assertEqual(meta['callsigns'],1)

    def test_all_source_columns_are_published_and_cpf_stays_masked(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);archive=root/'data.zip'
            changes={label:f'campo {key}' for key,label in module.FIELDS.items() if key in {'fistel','service','stationNumber','holderState','stationName','frequencies'}}
            self.fixture(archive,**changes);out=root/'output';meta=module.publish_zip(archive,out,minimum_records=1)
            payload=json.loads((out/'versions'/meta['revision']/'PU2.json').read_text());row=payload['calls']['PU2ABC'][0]
            self.assertEqual(len(row),17)
            for key,label in module.FIELDS.items():
                if label in changes:self.assertEqual(row[key],changes[label])
            self.assertEqual(row['identificationType'],'CPF');self.assertEqual(row['document'],'***12345**')
            before=(out/'manifest.json').read_bytes();self.fixture(archive,**{'CNPJ ou CPF':'12345678901'})
            with self.assertRaisesRegex(ValueError,'máscara'):module.publish_zip(archive,out,minimum_records=1)
            self.assertEqual((out/'manifest.json').read_bytes(),before)

    def test_new_projection_reimports_even_when_source_etag_is_unchanged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);archive=root/'data.zip';self.fixture(archive);out=root/'output'
            with patch.object(module,'PROJECTION',1):old=module.publish_zip(archive,out,etag='same',minimum_records=1)
            class Response:
                headers={'ETag':'same'}
                def __enter__(self):return self
                def __exit__(self,*args):pass
            def download(path):shutil.copyfile(archive,path);return None,'same'
            original=module.publish_zip
            with patch.object(module.urllib.request,'urlopen',return_value=Response()),patch.object(module,'download_zip',side_effect=download) as mocked,patch.object(module,'publish_zip',side_effect=lambda *args:original(*args,minimum_records=1)):
                new=module.update(out);mocked.assert_called_once()
            self.assertEqual(new['projection'],2);self.assertNotEqual(new['revision'],old['revision']);self.assertEqual(new['sourceCsvSha256'],old['sourceCsvSha256'])
            self.assertTrue((out/'versions'/old['revision']/'PU2.json').is_file())

    def test_failed_import_preserves_previous_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);archive=root/'data.zip';self.fixture(archive);out=root/'output';module.publish_zip(archive,out,minimum_records=1)
            before={str(p.relative_to(out)):p.read_bytes() for p in out.rglob('*.json')}
            self.fixture(archive,**{'Status da Validade':'Unexpected'})
            with self.assertRaises(ValueError):module.publish_zip(archive,out,minimum_records=1)
            self.assertEqual(before,{str(p.relative_to(out)):p.read_bytes() for p in out.rglob('*.json')})

    def test_incomplete_or_changed_schema_is_rejected(self):
        with self.assertRaises(ValueError):module.collect_rows(io.StringIO('Indicativo;Nome\nPU2ABC;Teste\n'))
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);archive=root/'data.zip';self.fixture(archive)
            with self.assertRaises(ValueError):module.publish_zip(archive,root/'output')
            self.assertFalse((root/'output/manifest.json').exists())

    def test_identical_etag_skips_download_and_advances_check_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);archive=root/'data.zip';self.fixture(archive);out=root/'output';meta=module.publish_zip(archive,out,etag='same',minimum_records=1)
            class Response:
                headers={'ETag':'same'}
                def __enter__(self):return self
                def __exit__(self,*args):pass
            with patch.object(module.urllib.request,'urlopen',return_value=Response()),patch.object(module,'download_zip') as download,patch.object(module,'stamp',return_value='2026-10-27T12:00:00Z'):
                result=module.update(out);download.assert_not_called()
            self.assertEqual(result['collectedAt'],meta['collectedAt']);self.assertEqual(result['checkedAt'],'2026-10-27T12:00:00Z')

if __name__=='__main__':unittest.main()
