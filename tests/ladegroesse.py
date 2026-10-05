#!/usr/bin/env python3
"""DEV-TOOL: Ladegröße des Spiels (alles, was index.html lädt) roh + gzip -9.
Aufruf: python3 tests/ladegroesse.py [SPIEL-ORDNER]"""
import gzip, os, re, sys, json

root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..'))
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
files = ['index.html'] + [m.split('?')[0] for m in re.findall(r'src="([^"]+)"', html)]
# zur Laufzeit geladene Dateien (new Audio('…') usw.) aus den Skripten
for f in list(files[1:]):
    src = open(os.path.join(root, f), encoding='utf-8').read()
    for m in re.findall(r"""['"]((?:audio|img|assets)/[^'"?]+)""", src):
        if m not in files:
            files.append(m)
rows, raw_sum, gz_sum = [], 0, 0
for f in files:
    data = open(os.path.join(root, f), 'rb').read()
    gz = len(gzip.compress(data, 9))
    rows.append((f, len(data), gz)); raw_sum += len(data); gz_sum += gz
for f, r, g in rows:
    print(f'{f:28s} {r:9d} B  gzip {g:9d} B')
print(f'{"SUMME":28s} {raw_sum:9d} B  gzip {gz_sum:9d} B  ({gz_sum/1024:.1f} KiB)')
print(json.dumps({'roh': raw_sum, 'gzip': gz_sum, 'dateien': len(rows)}))
