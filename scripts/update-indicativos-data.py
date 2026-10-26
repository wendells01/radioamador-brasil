#!/usr/bin/env python3
"""Publish a minimal, versioned radioamateur lookup from Anatel's public CSV.

Only the allowlisted display fields leave the import process. A failed collection
or validation leaves the last published manifest and its snapshot untouched.
"""
import argparse
import csv
import hashlib
import io
import json
import re
import shutil
import tempfile
import urllib.error
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

SOURCE = 'https://www.anatel.gov.br/dadosabertos/paineis_de_dados/outorga_e_licenciamento/estacoes_licenciadas.zip'
PANEL = 'https://informacoes.anatel.gov.br/paineis/outorga-e-licenciamento/estacoes-radioamador'
MEMBER = 'Estacoes_Radioamador.csv'
FIELDS = {
    'name': 'Nome da Entidade', 'class': 'COER', 'type': 'Tipo de Estação',
    'city': 'Município da Estação', 'state': 'UF da Estação',
    'firstLicensed': 'Data do Primeiro Licenciamento',
    'lastLicensed': 'Data do Último Licenciamento',
    'validUntil': 'Data de Validade da Estação', 'status': 'Status da Validade',
}
UNKNOWN = {'', 'N/I', 'N/A', 'NA', 'NULL'}

def stamp():
    return datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')

def json_text(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n'

def normalize_value(value):
    value = value.strip()
    return None if value.upper() in UNKNOWN else value

def collect_rows(stream):
    reader = csv.DictReader(stream, delimiter=';')
    required = {'Indicativo', *FIELDS.values()}
    if not reader.fieldnames or not required.issubset(reader.fieldnames):
        raise ValueError('Colunas esperadas ausentes no CSV oficial.')
    groups, dropped, records = defaultdict(lambda: defaultdict(list)), 0, 0
    for raw in reader:
        call = raw['Indicativo'].strip().upper()
        # Keep source spelling, including legacy hyphens/letters. Never turn a
        # malformed record into another person's normal-looking callsign.
        if not re.fullmatch(r'[^\W\d_]{2}[0-9](?:[^\W_]|-){1,6}', call, re.UNICODE):
            dropped += 1
            continue
        row = {key: normalize_value(raw[column]) for key, column in FIELDS.items()}
        if row['class'] not in {None, 'Classe A', 'Classe B', 'Classe C'}:
            raise ValueError('Classe COER inesperada no CSV.')
        if row['status'] not in {None, 'Ativa', 'Vencida'}:
            raise ValueError('Status de validade inesperado no CSV.')
        for key in ('firstLicensed', 'lastLicensed', 'validUntil'):
            if row[key]:
                datetime.strptime(row[key], '%d/%m/%Y')
        if row['state']:
            row['state'] = row['state'].upper()
        if row['state'] and not re.fullmatch('[A-Z ]{2,30}', row['state']):
            raise ValueError('UF inesperada no CSV.')
        if not row['name']:
            raise ValueError('Titular ausente em registro com indicativo.')
        groups[call[:3]][call].append(row)
        records += 1
    return dict(groups), records, dropped

def publish_zip(zip_path, output, source_modified=None, etag=None, minimum_records=10000):
    with zipfile.ZipFile(zip_path) as archive:
        info = archive.getinfo(MEMBER)
        if info.file_size > 100_000_000:
            raise ValueError('CSV excede o tamanho esperado.')
        raw = archive.read(MEMBER)
    digest = hashlib.sha256(raw).hexdigest()
    groups, records, dropped = collect_rows(io.StringIO(raw.decode('utf-8-sig')))
    calls = sum(len(group) for group in groups.values())
    if records < minimum_records or calls < minimum_records // 2:
        raise ValueError('Base vazia ou incompleta; publicação anterior preservada.')
    output = Path(output)
    old = json.loads((output / 'manifest.json').read_text()) if (output / 'manifest.json').exists() else None
    if old and records < old['records'] * .8:
        raise ValueError('Queda superior a 20% nos registros; exige revisão antes de publicar.')
    revision = digest[:20]
    moment = stamp()
    manifest = {
        'schema': 1, 'source': SOURCE, 'sourcePage': PANEL, 'sourceMember': MEMBER,
        'sourceLastModified': source_modified, 'sourceEtag': etag,
        'sourceCsvSha256': digest, 'revision': revision,
        'collectedAt': old['collectedAt'] if old and old.get('revision') == revision else moment,
        'checkedAt': moment, 'records': records, 'callsigns': calls, 'excludedRows': dropped,
        'prefixes': sorted(groups), 'fields': list(FIELDS),
    }
    output.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix='.indicativos-stage-', dir=output.parent))
    try:
        for prefix, group in groups.items():
            payload = {'schema': 1, 'revision': revision, 'prefix': prefix,
                       'calls': {call: group[call] for call in sorted(group)}}
            (stage / f'{prefix}.json').write_text(json_text(payload), encoding='utf-8')
        versions = output / 'versions'
        versions.mkdir(exist_ok=True)
        target = versions / revision
        # A digest-identical rerun also repairs missing/corrupted snapshot files.
        if target.exists():
            shutil.rmtree(target)
        stage.rename(target)
        temporary = output / '.manifest.tmp'
        temporary.write_text(json_text(manifest), encoding='utf-8')
        temporary.replace(output / 'manifest.json')
        # Retain the preceding revision for an in-flight lookup using its manifest.
        keep = {revision}
        if old:
            keep.add(old.get('revision'))
        for directory in versions.iterdir():
            if directory.is_dir() and directory.name not in keep:
                shutil.rmtree(directory)
    finally:
        if stage.exists():
            shutil.rmtree(stage)
    return manifest

def download_zip(path):
    request = urllib.request.Request(SOURCE, headers={'User-Agent': 'RadioamadorBrasil/1.0 (+https://radioamadorbrasil.site)'})
    with urllib.request.urlopen(request, timeout=60) as response, open(path, 'wb') as target:
        modified, etag = response.headers.get('Last-Modified'), response.headers.get('ETag')
        total = 0
        while block := response.read(1024 * 1024):
            total += len(block)
            if total > 800_000_000:
                raise ValueError('Arquivo oficial excede o limite de coleta.')
            target.write(block)
    return (parsedate_to_datetime(modified).isoformat().replace('+00:00', 'Z') if modified else None), etag

def update(output):
    output = Path(output)
    previous = output / 'manifest.json'
    if previous.exists():
        old = json.loads(previous.read_text())
        # Conditional HEAD avoids downloading ~215 MB when the source is unchanged.
        req = urllib.request.Request(SOURCE, method='HEAD')
        with urllib.request.urlopen(req, timeout=30) as response:
            etag = response.headers.get('ETag')
            if etag and etag == old.get('sourceEtag') and all((output / 'versions' / old['revision'] / f'{p}.json').is_file() for p in old['prefixes']):
                old['checkedAt'] = stamp()
                temp = output / '.manifest.tmp'
                temp.write_text(json_text(old), encoding='utf-8')
                temp.replace(previous)
                return old
    with tempfile.TemporaryDirectory(prefix='anatel-indicativos-') as directory:
        archive = Path(directory) / 'estacoes.zip'
        modified, etag = download_zip(archive)
        return publish_zip(archive, output, modified, etag)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--zip', type=Path, help='Importação local a partir do ZIP oficial já baixado.')
    args = parser.parse_args()
    metadata = publish_zip(args.zip, args.output) if args.zip else update(args.output)
    print(f"Base válida: {metadata['callsigns']} indicativos, {metadata['records']} registros; revisão {metadata['revision']}.")
