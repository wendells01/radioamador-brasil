#!/usr/bin/env python3
"""Atualiza snapshot estático HamQSL. Só consultar a origem uma vez por hora.

Fonte/condições: https://www.hamqsl.com/solar.html (XML/RSS feeds).
Python padrão, sem serviço HTTP ou dependências adicionais.
"""
import argparse
from datetime import datetime, timezone
import fcntl
import json
import math
from pathlib import Path
import re
import tempfile
import urllib.request
import xml.etree.ElementTree as ET

FEED = 'https://www.hamqsl.com/solarxml.php'
SOURCE = 'https://www.hamqsl.com/solar.html'
OUTPUT = Path(__file__).resolve().parents[1] / 'site/assets/data/solar.json'
BANDS = ('80m-40m', '30m-20m', '17m-15m', '12m-10m')
MONTHS = {month: i + 1 for i, month in enumerate('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}


def iso(value):
    return value.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')


def parse_feed(xml, fetched_at):
    if len(xml) > 100_000 or b'<!DOCTYPE' in xml.upper() or b'<!ENTITY' in xml.upper():
        raise ValueError('XML fora do formato permitido.')
    root = ET.fromstring(xml)
    if root.tag != 'solar' or len(root.findall('solardata')) != 1:
        raise ValueError('Resposta não contém dados solares válidos.')
    data = root.find('solardata')

    def text(tag):
        return (data.findtext(tag) or '').strip()

    updated = re.fullmatch(r'(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}) (\d{2})(\d{2}) GMT', text('updated'))
    if not updated:
        raise ValueError('Data de atualização da fonte inválida.')
    day, month, year, hour, minute = updated.groups()
    timestamp = datetime(int(year), MONTHS[month], int(day), int(hour), int(minute), tzinfo=timezone.utc)

    def numeric(tag, low, high):
        raw = text(tag)
        try:
            value = float(raw)
        except ValueError:
            return None
        return value if math.isfinite(value) and low <= value <= high else None

    def short(tag):
        value = text(tag)
        return value[:48] if value and value.lower() not in ('no report', 'norpt', 'n/a') else None

    conditions = {}
    for row in data.findall('calculatedconditions/band'):
        name, period = row.get('name'), row.get('time')
        if name not in BANDS or period not in ('day', 'night'):
            continue
        key = (name, period)
        if key in conditions:
            raise ValueError('Condição duplicada no feed.')
        value = (row.text or '').strip().lower()
        conditions[key] = value if value in ('good', 'fair', 'poor') else 'unknown'
    if not conditions:
        raise ValueError('Condições de propagação ausentes.')
    return {
        'version': 1, 'source': SOURCE, 'updatedAt': iso(timestamp), 'fetchedAt': iso(fetched_at),
        'indicators': {
            'flux': numeric('solarflux', 0, 1000), 'sunspots': numeric('sunspots', 0, 2000),
            'aIndex': numeric('aindex', 0, 400), 'kIndex': numeric('kindex', 0, 9),
            'wind': numeric('solarwind', 0, 5000), 'magneticField': numeric('magneticfield', -1000, 1000),
            'xray': short('xray'), 'geomag': short('geomagfield'), 'noise': short('signalnoise'),
        },
        'bands': [{'name': name, 'day': conditions.get((name, 'day'), 'unknown'), 'night': conditions.get((name, 'night'), 'unknown')} for name in BANDS],
    }


def atomic_write(path, payload):
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent, delete=False) as temp:
        temp.write(payload)
        temp_path = Path(temp.name)
    try:
        temp_path.chmod(0o644)
        temp_path.replace(path)
    finally:
        temp_path.unlink(missing_ok=True)


def fetch_source():
    request = urllib.request.Request(FEED, headers={
        'User-Agent': 'RadioamadorBrasil-Solar/1.0 (+https://radioamadorbrasil.site)',
        'Referer': 'https://radioamadorbrasil.site/', 'Accept': 'application/xml, text/xml',
    })
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read(100_001)


def update(output=OUTPUT, now=None, input_xml=None):
    now = now or datetime.now(timezone.utc)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    # Lock e tentativa ficam separados: uma falha também consome a janela horária.
    with (output.parent / '.solar-update.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        attempt = output.parent / '.solar-last-attempt'
        if input_xml is None and attempt.exists():
            try:
                elapsed = (now - datetime.fromisoformat(attempt.read_text().strip())).total_seconds()
                if elapsed < 3600:
                    return False
            except ValueError:
                pass
        if input_xml is None:
            atomic_write(attempt, iso(now))
        payload = parse_feed(input_xml if input_xml is not None else fetch_source(), now)
        atomic_write(output, json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
        # Importação de XML já baixado também registra a coleta, evitando nova chamada.
        if input_xml is not None:
            atomic_write(attempt, iso(now))
        return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, help='Importar XML já baixado, sem consultar novamente a fonte.')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    try:
        changed = update(args.output, input_xml=args.input.read_bytes() if args.input else None)
        print('Snapshot solar atualizado.' if changed else 'Cache preservado: última tentativa há menos de uma hora.')
    except (ValueError, KeyError, ET.ParseError, OSError) as error:
        parser.exit(1, f'Falha na atualização solar; snapshot anterior preservado: {error}\n')
