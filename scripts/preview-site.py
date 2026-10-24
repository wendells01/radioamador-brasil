#!/usr/bin/env python3
"""Private preview of the publication, including its content-hashed resources."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent

class PreviewHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Production rewrites this exact URL to the solar branch. Use the local
        # snapshot in the private preview; no requests to a third-party service.
        if urlsplit(path).path == '/assets/data/solar.json':
            return str(ROOT / 'site/assets/data/solar.json')
        return super().translate_path(path)

    def end_headers(self):
        immutable = urlsplit(self.path).path.startswith('/assets/releases/')
        self.send_header('Cache-Control', 'public, max-age=31536000, immutable' if immutable else 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bind', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=18789)
    args = parser.parse_args()
    if not (ROOT / 'dist/index.html').is_file():
        parser.error('Execute npm run build antes de iniciar a prévia.')
    handler = partial(PreviewHandler, directory=str(ROOT / 'dist'))
    ThreadingHTTPServer((args.bind, args.port), handler).serve_forever()
