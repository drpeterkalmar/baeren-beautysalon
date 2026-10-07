#!/usr/bin/env python3
"""DEV-TOOL: Pixel-Vergleich zweier Screenshot-Ordner (Umbau Schritt 8/10: „Pixel-Differenz je Bild < 1 %“).

Aufruf: python3 tests/pixel-diff.py VORHER_DIR NACHHER_DIR [--max=1.0] [--tol=24] [--json=out.json] [--diff=DIR]

Je gleichnamigem PNG: Anteil der Pixel (in %), deren größte Kanal-Abweichung > tol (0–255) ist. Kleine
Antialiasing-/Rundungsunterschiede (unter tol) zählen nicht. Exit 1, wenn ein Bild über --max liegt oder fehlt.
--diff=DIR schreibt Differenzbilder (abweichende Pixel rot auf grauem Original), praktisch für Collagen.
Animationen (Funkeln, Fische) vorher festhalten: Screenshots mit festem Zufall/fester Zeit aufnehmen.
"""
import json
import os
import sys

from PIL import Image, ImageChops


def diff_percent(a, b, tol=24):
    """Anteil abweichender Pixel in % (größte Kanal-Abweichung > tol). Größen müssen gleich sein."""
    a, b = a.convert('RGB'), b.convert('RGB')
    if a.size != b.size:
        raise ValueError('Bildgrößen verschieden: %s vs %s' % (a.size, b.size))
    d = ImageChops.difference(a, b)
    r, g, bl = d.split()
    m = ImageChops.lighter(ImageChops.lighter(r, g), bl)          # größte Kanal-Abweichung je Pixel
    hist = m.histogram()
    over = sum(hist[tol + 1:])
    return 100.0 * over / (a.size[0] * a.size[1]), m


def diff_image(a, mask, tol=24):
    grau = a.convert('L').convert('RGB')
    rot = Image.new('RGB', a.size, (255, 40, 40))
    sel = mask.point(lambda v: 255 if v > tol else 0)
    return Image.composite(rot, grau, sel)


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    opts = dict(a[2:].split('=', 1) for a in argv if a.startswith('--') and '=' in a)
    if len(args) != 2:
        print(__doc__)
        return 2
    vor, nach = args
    mx, tol = float(opts.get('max', '1.0')), int(opts.get('tol', '24'))
    names = sorted(f for f in os.listdir(vor) if f.endswith('.png'))
    res, schlecht = {}, []
    if opts.get('diff'):
        os.makedirs(opts['diff'], exist_ok=True)
    for n in names:
        p2 = os.path.join(nach, n)
        if not os.path.exists(p2):
            res[n] = None
            schlecht.append(n)
            print('%-40s FEHLT im Nachher-Ordner' % n)
            continue
        a, b = Image.open(os.path.join(vor, n)), Image.open(p2)
        pct, mask = diff_percent(a, b, tol)
        res[n] = round(pct, 3)
        flag = '' if pct <= mx else '  ← über %.2f %%' % mx
        if pct > mx:
            schlecht.append(n)
        print('%-40s %7.3f %%%s' % (n, pct, flag))
        if opts.get('diff'):
            diff_image(a, mask, tol).save(os.path.join(opts['diff'], n))
    if opts.get('json'):
        with open(opts['json'], 'w') as f:
            json.dump({'max': mx, 'tol': tol, 'bilder': res, 'ueber': schlecht}, f, indent=1)
    print('%d Bilder, %d über %.2f %% oder fehlend' % (len(names), len(schlecht), mx))
    return 1 if schlecht else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
