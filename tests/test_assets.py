import hashlib
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIP_PATH = ROOT / "sources" / "simulados.zip"
SIMULADOS_DIR = ROOT / "site" / "simulados"
LOGO_DEST = ROOT / "site" / "assets" / "logo-original.jpeg"
LOGO_SRC = Path("/tmp/46615F27-FE14-4DDA-9976-822C776B218E.jpeg")

# member name -> (destination, bytes, sha256)
HTML_FILES = {
    "simulado_radio_brasil_classe_c_2026_1000_questoes-3.html": (
        SIMULADOS_DIR / "classe-c.html", 245941,
        "98956cbb067464778ab8facb7ec5c94c31094a8eafb4bd7e7482ba7b4b1c436b"),
    "simulador_radio_brasil_classe_b_1000_questoes.html": (
        SIMULADOS_DIR / "classe-b.html", 245135,
        "358b05a666de3a2b02d6a5c553265d98f78aac642ee2bc682cfcf241dfd09b59"),
    "simulado_radio_brasil_classe_a_2026_1000_questoes.html": (
        SIMULADOS_DIR / "classe-a.html", 241871,
        "f2b480c4ab7bdafdda625ef0bb6d068d036ce4a61c07f3cd4d638e69cbea5a06"),
}

LOGO_SHA = "164f10fa00e4af8b5a83266b20d6590aa6477d93b1f9682743c1387beb2584c8"


def sha256_of(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class TestSimulados(unittest.TestCase):
    def test_html_integrity_and_zip_identity(self):
        with zipfile.ZipFile(ZIP_PATH) as z:
            for member, (dest, size, sha) in HTML_FILES.items():
                with self.subTest(member=member):
                    self.assertTrue(dest.exists(), f"{dest} missing")
                    data = dest.read_bytes()
                    self.assertEqual(len(data), size, f"{dest} size")
                    self.assertEqual(sha256_of(dest), sha, f"{dest} sha256")
                    self.assertEqual(data, z.read(member), f"{dest} differs from ZIP member")

    def test_simulados_dir_contents(self):
        htmls = sorted(p.name for p in SIMULADOS_DIR.iterdir() if p.suffix == ".html")
        self.assertEqual(htmls, ["classe-a.html", "classe-b.html", "classe-c.html"])
        sidecars = [p.name for p in SIMULADOS_DIR.iterdir() if p.name.startswith("._")]
        self.assertEqual(sidecars, [])

    def test_logo(self):
        self.assertTrue(LOGO_DEST.exists())
        self.assertEqual(sha256_of(LOGO_DEST), LOGO_SHA)
        if LOGO_SRC.exists():
            self.assertEqual(LOGO_DEST.read_bytes(), LOGO_SRC.read_bytes())
        else:
            self.skipTest("logo source in /tmp no longer available")


if __name__ == "__main__":
    unittest.main()
