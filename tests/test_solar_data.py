import importlib.util
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('solar_update', ROOT / 'scripts/update-solar-data.py')
solar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(solar)
XML = (ROOT / 'tests/fixtures/hamqsl.xml').read_bytes()
NOW = datetime(2026, 10, 23, 19, 10, tzinfo=timezone.utc)

class TestSolarData(unittest.TestCase):
    def test_real_feed_values_and_utc(self):
        data = solar.parse_feed(XML, NOW)
        self.assertEqual(data['updatedAt'], '2026-10-23T19:07:00Z')
        self.assertEqual(data['indicators']['flux'], 106)
        self.assertEqual(data['indicators']['magneticField'], -4.4)
        self.assertEqual(data['bands'][0], {'name':'80m-40m','day':'fair','night':'good'})
        self.assertEqual(len(data['bands']), 4)

    def test_missing_and_unknown_are_not_zero_or_good(self):
        xml = XML.replace(b'<solarflux>106</solarflux>', b'<solarflux>No Report</solarflux>').replace(b'>Fair</band>', b'>Unexpected</band>')
        data = solar.parse_feed(xml, NOW)
        self.assertIsNone(data['indicators']['flux'])
        self.assertEqual(data['bands'][0]['day'], 'unknown')

    def test_invalid_xml_and_date_rejected(self):
        for xml in [b'<html>Unavailable</html>', b'<solar>', b'<!DOCTYPE solar><solar/>', XML.replace(b'23 Oct 2026 1907 GMT',b'No Report')]:
            with self.subTest(xml=xml[:40]):
                with self.assertRaises((ValueError, solar.ET.ParseError)):
                    solar.parse_feed(xml, NOW)

    def test_hourly_limit_and_preservation_on_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'solar.json'
            self.assertTrue(solar.update(output, NOW, XML))
            initial = output.read_bytes()
            with patch.object(solar, 'fetch_source', return_value=XML) as fetch:
                self.assertFalse(solar.update(output, NOW + timedelta(minutes=59)))
                fetch.assert_not_called()
                self.assertTrue(solar.update(output, NOW + timedelta(hours=1)))
                fetch.assert_called_once()
            previous = output.read_bytes()
            with patch.object(solar, 'fetch_source', side_effect=OSError('offline')) as fetch:
                with self.assertRaises(OSError):
                    solar.update(output, NOW + timedelta(hours=2))
                self.assertEqual(output.read_bytes(), previous)
                self.assertFalse(solar.update(output, NOW + timedelta(hours=2, minutes=1)))
                fetch.assert_called_once()
            self.assertEqual(json.loads(initial)['indicators']['kIndex'], 2)

if __name__ == '__main__':
    unittest.main()
