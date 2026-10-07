"""Unit-Test für tools/bump-version.py (unittest, läuft auch unter pytest):
python3 -m unittest discover -s tests/unit -p 'test_*.py'
"""
import importlib.util
import pathlib
import shutil
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('bump', ROOT / 'tools' / 'bump-version.py')
bump = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bump)


class BumpVersion(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        for f in ('index.html', 'fx.js'):
            shutil.copy(ROOT / f, self.tmp / f)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_setzt_alle_stellen(self):
        self.assertTrue(bump.bump('99.1', root=self.tmp))
        html = (self.tmp / 'index.html').read_text(encoding='utf-8')
        fx = (self.tmp / 'fx.js').read_text(encoding='utf-8')
        n = len(bump.SCRIPT_RE.findall((ROOT / 'index.html').read_text(encoding='utf-8')))
        self.assertGreaterEqual(n, 9)
        self.assertEqual(html.count('?v=99.1"'), n)
        self.assertNotIn('?v=20.3', html)
        self.assertIn("var v='99.1';", fx)
        self.assertTrue(bump.bump('99.1', root=self.tmp, check=True))

    def test_check_meldet_abweichung(self):
        self.assertFalse(bump.bump('99.2', root=self.tmp, check=True))
        # --check schreibt nichts
        self.assertEqual((self.tmp / 'index.html').read_text(encoding='utf-8'),
                         (ROOT / 'index.html').read_text(encoding='utf-8'))

    def test_lehnt_unsinn_ab(self):
        for bad in ('', '20.4"', '../x', '20 4'):
            with self.assertRaises(SystemExit):
                bump.bump(bad, root=self.tmp)

    def test_repo_ist_einheitlich(self):
        # Im Repo stehen index.html und fx.js-Rückfall auf derselben Nummer
        html = (ROOT / 'index.html').read_text(encoding='utf-8')
        ver = bump.SCRIPT_RE.search(html).group(2)
        self.assertTrue(bump.bump(ver, root=ROOT, check=True))


if __name__ == '__main__':
    unittest.main()
