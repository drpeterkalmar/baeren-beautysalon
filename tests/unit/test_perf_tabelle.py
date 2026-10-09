"""Unit-Test für tests/perf-tabelle.py r21 (unittest): python3 -m unittest discover -s tests/unit -p 'test_*.py'"""
import importlib.util
import json
import pathlib
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def modul():
    spec = importlib.util.spec_from_file_location('ptab', ROOT / 'tests' / 'perf-tabelle.py')
    m = importlib.util.module_from_spec(spec)
    alt = sys.argv
    sys.argv = ['perf-tabelle.py', 'nichts']          # nur laden, nicht den alten Bericht drucken
    try:
        try: spec.loader.exec_module(m)
        except (TypeError, KeyError): pass           # der alte Bericht unten braucht seine Dateien – die Funktionen stehen davor
    finally:
        sys.argv = alt
    return m


def lauf(p95, haupt=None, mem=1_000_000):
    sc = {}
    for s in ['menu', 'waschen', 'aquarium', 'finale']:
        sc[s] = {'p95': p95, 'p99': p95 * 1.5, 'hauptP95': haupt, 'hauptMax': (haupt or 0) * 2,
                 'mem': {'main': mem, 'room': mem, 'snap': 1, 'sprites': mem, 'sets': 5, 'thumbs': 3}}
    return {'scenes': sc}


class R21Tabelle(unittest.TestCase):
    def test_haupt_vor_bildabstand_und_gate(self):
        m = modul()
        with tempfile.TemporaryDirectory() as d:
            for r, (a, b) in enumerate([(40, 30), (44, 31)], 1):
                json.dump(lauf(80, a), open(f'{d}/v-hoch-t2-r{r}.json', 'w'))
                json.dump(lauf(80, b, mem=600_000), open(f'{d}/n-hoch-t2-r{r}.json', 'w'))
            zeilen, ok = m.r21_tabelle(d, 'v', 'n')
            self.assertTrue(ok)
            text = '\n'.join(zeilen)
            self.assertIn('42.0 → **30.5**', text)       # Median der haupt-p95, nicht die Bildabstände (80)
            self.assertIn('2.00 → 1.20', text)           # Speicher: Pixel > 1 ohne Zähler (sets/thumbs) und ohne Sprites (alt nicht gezählt), in MP

    def test_gate_reisst(self):
        m = modul()
        with tempfile.TemporaryDirectory() as d:
            json.dump(lauf(20, 10.0), open(f'{d}/v-quer-t0.json', 'w'))
            json.dump(lauf(20, 11.2), open(f'{d}/n-quer-t0.json', 'w'))    # +12 % > 5 % + 0,5 ms
            zeilen, ok = m.r21_tabelle(d, 'v', 'n')
            self.assertFalse(ok)
            self.assertIn('✗', '\n'.join(zeilen))
        self.assertTrue(m.gate(10.0, 11.0))              # 10 · 1,05 + 0,5 = 11,0


if __name__ == '__main__':
    unittest.main()
