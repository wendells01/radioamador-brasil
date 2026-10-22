import hashlib
import os
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
# Override só para provar que os testes abaixo realmente falham numa cópia
# scratch com o defeito injetado. O padrão é sempre o site de produção.
SITE = Path(os.environ.get("RADIOAMADOR_SITE_DIR", ROOT / "site")).resolve()

OWNED_PAGES = [
    "index.html",
    "simulados.html",
    "ferramentas.html",
    "referencia.html",
    "links.html",
    "ferramentas/antenas.html",
    "ferramentas/morse.html",
]

SIMULADOS = {
    "simulados/classe-c.html": "98956cbb067464778ab8facb7ec5c94c31094a8eafb4bd7e7482ba7b4b1c436b",
    "simulados/classe-b.html": "358b05a666de3a2b02d6a5c553265d98f78aac642ee2bc682cfcf241dfd09b59",
    "simulados/classe-a.html": "f2b480c4ab7bdafdda625ef0bb6d068d036ce4a61c07f3cd4d638e69cbea5a06",
}

EXPECTED_FILES = [
    "index.html",
    "simulados.html",
    "ferramentas.html",
    "referencia.html",
    "links.html",
    "ferramentas/antenas.html",
    "ferramentas/morse.html",
    "simulados/classe-c.html",
    "simulados/classe-b.html",
    "simulados/classe-a.html",
    "robots.txt",
    "assets/styles.css",
    "assets/app.js",
    "assets/favicon.svg",
    "assets/logo.webp",
    "assets/logo-original.jpeg",
    "assets/js/antenas.js",
    "assets/js/morse.js",
    "assets/js/morse-audio.js",
    "assets/js/referencia.js",
]

EXTERNAL_ROUTES = [
    "/simulados.html",
    "/ferramentas.html",
    "/referencia.html",
    "/links.html",
    "/ferramentas/antenas.html",
    "/ferramentas/morse.html",
    "/simulados/classe-c.html",
    "/simulados/classe-b.html",
    "/simulados/classe-a.html",
]


class TagCollector(HTMLParser):
    """Collect anchor (href, rel), other local refs (src/href on link/script/img),
    ids, and meta/title for validation."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.anchors = []      # (href, rel)
        self.refs = []         # local-ish src/href from link/script/img/source
        self.ids = set()
        self.metas = []        # dict of attrs
        self.links = []        # dict of attrs for <link>
        self.title = ""
        self._in_title = False
        self.iframes = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a":
            self.anchors.append((a.get("href", ""), a.get("rel", "")))
        if tag == "iframe":
            self.iframes += 1
        if tag in ("link", "script", "img", "source"):
            for key in ("href", "src"):
                if key in a:
                    self.refs.append(a[key])
        if tag == "link":
            self.links.append(a)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "meta":
            self.metas.append(a)
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def parse(rel_path):
    c = TagCollector()
    c.feed((SITE / rel_path).read_text(encoding="utf-8"))
    return c


def _is_external(value):
    return value.startswith("http://") or value.startswith("https://")


def _is_nonlocal(value):
    return (
        not value
        or value.startswith("#")
        or value.startswith("mailto:")
        or value.startswith("tel:")
        or value.startswith("data:")
        or value.startswith("javascript:")
    )


def resolve_local(value, base_in_site):
    """Return the site-relative path a local href/src points to, or None if it
    cannot be checked. Rejects traversal and absolute paths outside site."""
    if _is_nonlocal(value) or _is_external(value):
        return None
    path = urlsplit(value).path
    if not path:
        return None
    if ".." in Path(path).parts:
        raise AssertionError(f"path traversal rejected: {value}")
    if path.startswith("/"):
        rel = path.lstrip("/")
    else:
        # relative to the page's own directory
        rel = (Path(base_in_site).parent / path).as_posix()
    if rel == "":
        rel = "index.html"
    if rel.endswith("/"):
        rel += "index.html"
    candidate = (SITE / rel).resolve()
    try:
        candidate.relative_to(SITE.resolve())
    except ValueError:
        raise AssertionError(f"path escapes site root: {value}")
    return rel


class TestSite(unittest.TestCase):
    def test_expected_page_set_exists(self):
        for rel in EXPECTED_FILES:
            with self.subTest(rel=rel):
                self.assertTrue((SITE / rel).is_file(), f"{rel} missing")

    def test_local_refs_resolve_inside_site(self):
        for page in OWNED_PAGES:
            with self.subTest(page=page):
                c = parse(page)
                for value in c.refs + [h for h, _ in c.anchors]:
                    rel = resolve_local(value, page)
                    if rel is None:
                        continue
                    self.assertTrue((SITE / rel).is_file(),
                                    f"{page}: {value} -> {rel} does not exist")

    def test_same_page_anchors_exist(self):
        for page in OWNED_PAGES:
            with self.subTest(page=page):
                c = parse(page)
                for href, _ in c.anchors:
                    if href.startswith("#") and href != "#":
                        self.assertIn(href[1:], c.ids,
                                      f"{page}: anchor {href} has no id")

    def test_external_routes_resolve(self):
        for route in EXTERNAL_ROUTES:
            with self.subTest(route=route):
                rel = route.lstrip("/")
                self.assertTrue((SITE / rel).is_file(), f"{route} missing")

    def test_simulados_hashes(self):
        for rel, expected in SIMULADOS.items():
            with self.subTest(rel=rel):
                digest = hashlib.sha256((SITE / rel).read_bytes()).hexdigest()
                self.assertEqual(digest, expected)

    def test_owned_pages_have_no_fake_or_local_urls(self):
        forbidden = ["example.com", "localhost", "http://127.0.0.1",
                     "og:url", "canonical"]
        for page in OWNED_PAGES:
            text = (SITE / page).read_text(encoding="utf-8")
            for token in forbidden:
                with self.subTest(page=page, token=token):
                    self.assertNotIn(token, text)

    def test_robots_disallows_all(self):
        robots = (SITE / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Disallow: /", robots)

    def test_owned_pages_metadata(self):
        for page in OWNED_PAGES:
            with self.subTest(page=page):
                text = (SITE / page).read_text(encoding="utf-8")
                self.assertIn('lang="pt-BR"', text)
                c = parse(page)
                metas = c.metas
                self.assertTrue(any(m.get("name") == "viewport"
                                    and "width=device-width" in m.get("content", "")
                                    for m in metas), "viewport meta")
                self.assertTrue(c.title.strip(), "non-empty title")
                desc = [m.get("content", "") for m in metas if m.get("name") == "description"]
                self.assertTrue(any(d.strip() for d in desc), "non-empty description")
                self.assertTrue(any(m.get("rel") == "icon" and "favicon.svg" in m.get("href", "")
                                    for m in c.links), "favicon link")
                self.assertTrue(any(m.get("name") == "robots"
                                    and "noindex" in m.get("content", "")
                                    for m in metas), "noindex")

    def test_no_iframe_in_owned_pages(self):
        for page in OWNED_PAGES:
            with self.subTest(page=page):
                self.assertEqual(parse(page).iframes, 0)

    def test_no_legacy_anchor_targets(self):
        """Os catálogos saíram da home, então apontar para as âncoras antigas
        manda o visitante para o lugar errado (ou para lugar nenhum)."""
        legacy = ["/#simulados", "/#ferramentas"]
        for page in OWNED_PAGES:
            text = (SITE / page).read_text(encoding="utf-8")
            for token in legacy:
                with self.subTest(page=page, token=token):
                    self.assertNotIn(
                        token, text,
                        f"{page}: link legado {token} aponta para uma âncora removida",
                    )

    def test_cross_page_fragments_exist(self):
        """Valida fragmento de link local entre páginas, não só o que começa
        com '#': /referencia.html#termo precisa existir no destino."""
        for page in OWNED_PAGES:
            c = parse(page)
            for href, _ in c.anchors:
                parts = urlsplit(href)
                if not parts.fragment or href.startswith("#") or _is_external(href):
                    continue
                target = resolve_local(href, page)
                if target is None or not target.endswith(".html"):
                    continue
                if not (SITE / target).is_file():
                    continue
                with self.subTest(page=page, href=href):
                    self.assertIn(
                        parts.fragment, parse(target).ids,
                        f"{page}: {href} aponta para #{parts.fragment}, "
                        f"que não existe em {target}",
                    )

    def test_catalogue_links_include_html_extension(self):
        """`/ferramentas` e `/simulados` são diretórios reais em site/; sem
        .html o link colide com o diretório em vez de abrir o catálogo."""
        shadowed = ["/ferramentas", "/ferramentas/", "/simulados", "/simulados/"]
        for page in OWNED_PAGES:
            for href, _ in parse(page).anchors:
                path = urlsplit(href).path
                with self.subTest(page=page, href=href):
                    self.assertNotIn(
                        path, shadowed,
                        f"{page}: {href} precisa apontar para o .html do catálogo",
                    )

    def test_only_hamqsl_external_resource(self):
        """Uma única requisição externa é permitida: a imagem do painel solar
        na home. Nenhuma outra página pode buscar recurso externo."""
        allowed = {"https://www.hamqsl.com/solarn0nbh.php"}
        for page in OWNED_PAGES:
            for value in parse(page).refs:
                if not _is_external(value):
                    continue
                with self.subTest(page=page, value=value):
                    self.assertIn(value, allowed,
                                  f"{page}: recurso externo não permitido: {value}")
                    self.assertEqual(page, "index.html",
                                     f"{value} só é permitido na home")

    def test_external_links_https_and_safe_rel(self):
        for page in OWNED_PAGES:
            with self.subTest(page=page):
                for href, rel in parse(page).anchors:
                    if not href.startswith("http"):
                        continue
                    self.assertTrue(href.startswith("https://"),
                                    f"{page}: non-https external {href}")
                    relset = set(rel.lower().split())
                    self.assertIn("noopener", relset, f"{page}: {href} missing noopener")
                    self.assertIn("noreferrer", relset, f"{page}: {href} missing noreferrer")


if __name__ == "__main__":
    unittest.main()
