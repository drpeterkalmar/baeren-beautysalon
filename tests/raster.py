#!/usr/bin/env python3
"""DEV-TOOL (r22): Bildfolge als Raster (Kontaktbogen) für die Sichtprüfung.
Aufruf: python3 tests/raster.py ORDNER AUSGABE.jpg [--cols=4] [--width=300] [--names=01-menu,02-einlauf]"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
args = [a for a in sys.argv[1:] if not a.startswith('--')]
opts = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
src, out = args[0], args[1]
cols, tw = int(opts.get('cols', '4')), int(opts.get('width', '300'))
names = opts['names'].split(',') if opts.get('names') else sorted(f[:-4] for f in os.listdir(src) if f.endswith('.png'))
try: font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 16)
except Exception: font = ImageFont.load_default()
ims = []
for n in names:
    im = Image.open(os.path.join(src, n + '.png')).convert('RGB'); ims.append((n, im.resize((tw, round(im.height * tw / im.width)))))
th = max(i.height for _, i in ims) + 24
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 8) + 8, rows * (th + 8) + 8), (40, 40, 44))
d = ImageDraw.Draw(sheet)
for k, (n, im) in enumerate(ims):
    x, y = 8 + (k % cols) * (tw + 8), 8 + (k // cols) * (th + 8)
    d.text((x + 4, y + 3), n, fill=(255, 255, 255), font=font); sheet.paste(im, (x, y + 24))
sheet.save(out, quality=85); print(out, sheet.size)
