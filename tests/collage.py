#!/usr/bin/env python3
"""DEV-TOOL: Vorher/Nachher-Collage aus zwei Screenshot-Ordnern.
Aufruf: python3 tests/collage.py VORHER_DIR NACHHER_DIR AUSGABE.jpg [--names=01-menu,03-waschen-schaum] [--width=520]
Jede Zeile: links vorher, rechts nachher (gleiche Szene), Beschriftung oben."""
import sys, os
from PIL import Image, ImageDraw, ImageFont

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opts = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
vor, nach, out = args[0], args[1], args[2]
names = opts.get('names', '').split(',') if opts.get('names') else sorted(
    f[:-4] for f in os.listdir(vor) if f.endswith('.png') and os.path.exists(os.path.join(nach, f)))
tw = int(opts.get('width', '520'))
cols = int(opts.get('cols', '1'))  # Paare pro Zeile
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 26)
    small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 20)
except Exception:
    font = small = ImageFont.load_default()
pairs = []
for n in names:
    a = Image.open(os.path.join(vor, n + '.png')).convert('RGB')
    b = Image.open(os.path.join(nach, n + '.png')).convert('RGB')
    th = int(a.height * tw / a.width)
    pairs.append((n, a.resize((tw, th), Image.LANCZOS), b.resize((tw, th), Image.LANCZOS)))
th = pairs[0][1].height
head, gap = 40, 14
pw = 2 * tw + gap
rows = (len(pairs) + cols - 1) // cols
W = cols * pw + (cols - 1) * 30 + 2 * gap
H = rows * (th + head + gap) + gap
img = Image.new('RGB', (W, H), (38, 32, 36))
d = ImageDraw.Draw(img)
for i, (n, a, b) in enumerate(pairs):
    c, r = i % cols, i // cols
    x, y = gap + c * (pw + 30), gap + r * (th + head + gap)
    d.text((x, y + 6), 'vorher  ·  ' + n, fill=(235, 220, 225), font=small)
    d.text((x + tw + gap, y + 6), 'nachher (r20)', fill=(255, 214, 120), font=small)
    img.paste(a, (x, y + head))
    img.paste(b, (x + tw + gap, y + head))
img.save(out, quality=84, optimize=True)
print(out, img.size, os.path.getsize(out) // 1024, 'KiB')
