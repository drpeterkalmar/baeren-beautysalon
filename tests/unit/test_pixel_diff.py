"""Unit-Test für tests/pixel-diff.py (unittest): python3 -m unittest discover -s tests/unit -p 'test_*.py'"""
import importlib.util
import pathlib
import tempfile
import unittest

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('pdiff', ROOT / 'tests' / 'pixel-diff.py')
pdiff = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pdiff)


def bild(punkte=0, rauschen=0):
    im = Image.new('RGB', (100, 100), (200, 150, 120))
    d = ImageDraw.Draw(im)
    for i in range(punkte):            # punkte × 1 % der Fläche hart anders
        d.rectangle([i * 10 % 100, (i // 10) * 10, i * 10 % 100 + 9, (i // 10) * 10 + 9], fill=(0, 0, 255))
    if rauschen:
        px = im.load()
        for x in range(0, 100, 3):
            r, g, b = px[x, 5]
            px[x, 5] = (r + rauschen, g, b)
    return im


class PixelDiff(unittest.TestCase):
    def test_gleich(self):
        self.assertEqual(pdiff.diff_percent(bild(), bild())[0], 0.0)

    def test_prozent(self):
        self.assertAlmostEqual(pdiff.diff_percent(bild(), bild(punkte=1))[0], 1.0)
        self.assertAlmostEqual(pdiff.diff_percent(bild(), bild(punkte=3))[0], 3.0)

    def test_toleranz_ignoriert_kleine_abweichung(self):
        self.assertEqual(pdiff.diff_percent(bild(), bild(rauschen=10), tol=24)[0], 0.0)
        self.assertGreater(pdiff.diff_percent(bild(), bild(rauschen=40), tol=24)[0], 0.0)

    def test_ordner_und_exitcode(self):
        with tempfile.TemporaryDirectory() as t:
            v, n = pathlib.Path(t, 'v'), pathlib.Path(t, 'n')
            v.mkdir(); n.mkdir()
            bild().save(v / 'a.png'); bild(punkte=0).save(n / 'a.png')
            bild().save(v / 'b.png'); bild(punkte=2).save(n / 'b.png')
            self.assertEqual(pdiff.main([str(v), str(n), '--max=1.0', '--json=' + str(pathlib.Path(t, 'r.json')), '--diff=' + str(pathlib.Path(t, 'd'))]), 1)
            self.assertEqual(pdiff.main([str(v), str(n), '--max=2.5']), 0)
            self.assertTrue(pathlib.Path(t, 'd', 'b.png').exists())


if __name__ == '__main__':
    unittest.main()
