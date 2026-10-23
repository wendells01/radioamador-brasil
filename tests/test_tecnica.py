import unittest
from pathlib import Path
from test_site import TagCollector

SITE = Path(__file__).resolve().parent.parent / 'site'
ROUTES = ['coaxiais', 'faixas', 'emergencias', 'flowerpot', 'chokes', 'exposicao-rf']

class TestTechnicalPages(unittest.TestCase):
    def test_pages_assets_and_catalogue(self):
        catalogue = (SITE / 'ferramentas.html').read_text()
        for route in ROUTES:
            with self.subTest(route=route):
                path = SITE / 'ferramentas' / (route + '.html')
                text = path.read_text()
                parser = TagCollector()
                parser.feed(text)
                self.assertIn(f'/ferramentas/{route}.html', catalogue)
                self.assertIn('lang="pt-BR"', text)
                self.assertIn('id="conteudo"', text)
                self.assertIn('aria-live="polite"', text)
                self.assertIn('type="module"', text)
                # All local script/style/image paths must resolve.
                import re
                for ref in re.findall(r'(?:src|href)="(/assets/[^"]+)"', text):
                    self.assertTrue((SITE / ref.lstrip('/')).is_file(), ref)

    def test_rf_unavailable_is_visible_without_javascript(self):
        text = (SITE / 'ferramentas/exposicao-rf.html').read_text()
        self.assertIn('Distância normativa indisponível', text)
        self.assertIn('parcialmente implementado', text)

if __name__ == '__main__':
    unittest.main()
