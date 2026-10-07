#!/usr/bin/env python3
"""Version heben = ein Befehl: setzt alle ?v=… in index.html und den Rückfallwert in fx.js.

Aufruf:  python3 tools/bump-version.py 20.4          (schreibt)
         python3 tools/bump-version.py 20.4 --check  (nur prüfen: Exit 1, wenn nicht überall 20.4 steht)

BS_VERSION im Spiel liest die Query von fx.js?v=… (document.currentScript); der Wert in fx.js ist nur der
Rückfall, wird aber mitgezogen, damit nirgends eine alte Nummer stehen bleibt.
audio/salon.m4a?v=… in music.js ist eine eigene Datei-Version und bleibt unberührt.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VER_RE = re.compile(r'^[0-9A-Za-z][0-9A-Za-z.\-]*$')
SCRIPT_RE = re.compile(r'(<script\s+src="[^"?]+\.js\?v=)([^"&]+)(")')
FX_RE = re.compile(r"(var v=')([^']*)(';)")


def bump(version, root=ROOT, check=False):
    if not VER_RE.match(version):
        raise SystemExit('ungültige Version: %r' % version)
    html_p, fx_p = root / 'index.html', root / 'fx.js'
    html, fx = html_p.read_text(encoding='utf-8'), fx_p.read_text(encoding='utf-8')
    found = SCRIPT_RE.findall(html)
    if not found:
        raise SystemExit('keine <script src="…?v=…"> in index.html gefunden')
    if len(FX_RE.findall(fx)) != 1:
        raise SystemExit("fx.js: Rückfallwert var v='…'; nicht eindeutig gefunden")
    old = sorted({m[1] for m in found} | {FX_RE.search(fx).group(2)})
    if check:
        ok = old == [version]
        print(('ok: ' if ok else 'abweichend: ') + ', '.join(old))
        return ok
    html2 = SCRIPT_RE.sub(lambda m: m.group(1) + version + m.group(3), html)
    fx2 = FX_RE.sub(lambda m: m.group(1) + version + m.group(3), fx)
    html_p.write_text(html2, encoding='utf-8')
    fx_p.write_text(fx2, encoding='utf-8')
    print('Version %s → %s (%d Skript-Tags, fx.js-Rückfall)' % (', '.join(old), version, len(found)))
    return True


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1:
        raise SystemExit(__doc__)
    sys.exit(0 if bump(args[0], check='--check' in sys.argv) else 1)
