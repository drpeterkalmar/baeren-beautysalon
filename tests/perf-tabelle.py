#!/usr/bin/env python3
"""DEV-TOOL: Messtabelle vorher/nachher aus tests/shots/deko/perf/*.json (Ausgabe: Markdown).
Mittelt Wiederholungen (…-r1, …-r2). Aufruf: python3 tests/perf-tabelle.py
r21 (Technik-Nacht): python3 tests/perf-tabelle.py r21 [--vorher=r21-vorher] [--nachher=r21-nachher] [--dir=…]
  liest <prefix>-<hoch|quer>-t<2|1|0>[-rN].json (deko-check perf … --swraster [--land] --tier=T --voll) und druckt je Stufe
  und Format die p95 der Hauptthread-Zeit bis nach dem Malen (haupt; fehlt sie, die Bildabstände) vorher → nachher,
  dazu den Canvas-Speicher (MP) am Szenenende. Gate wie Koboldkeller: nachher ≤ vorher · 1,05 + 0,5 ms."""
import json, glob, os, re, sys
from statistics import mean, median

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots', 'deko', 'perf')
SC = ['menu', 'waschen', 'aquarium', 'finale']
NAME = {'menu': 'Menü', 'waschen': 'Waschen (Schaum, Rubbeln, Dusche)', 'aquarium': 'Aquarium (Füttern)', 'finale': 'Finale (Enthüllung + Feier)'}

def load(prefix):
    runs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(D, prefix + '*.json')))
            if re.fullmatch(re.escape(prefix) + r'(-r\d+)?\.json', os.path.basename(f))]
    if not runs: return None
    out = {}
    for s in SC:
        vals = [r['scenes'][s] for r in runs if s in r['scenes']]
        out[s] = {k: round(mean(v[k] for v in vals), 1) for k in ('p50', 'p95', 'p99', 'workP95')}
        out[s]['tierEnd'] = vals[-1]['tierEnd']; out[s]['n'] = len(vals)
    return out

def pct(a, b): return f'{(b - a) / a * 100:+.0f} %'

def table(title, alt, neu, extra=None):
    print(f'\n**{title}**\n')
    print('| Szene | vorher p50 | vorher p95 | nachher p50 | nachher p95 | Δ p95 |')
    print('|---|---|---|---|---|---|')
    for s in SC:
        a, n = alt[s], neu[s]
        print(f"| {NAME[s]} | {a['p50']} ms | {a['p95']} ms | {n['p50']} ms | {n['p95']} ms | **{pct(a['p95'], n['p95'])}** |")
    if extra: print(extra)

# ---------------------------------------------------------------- r21: Stufe × Format, haupt-p95, Speicher
FORMATE = ['hoch', 'quer']
STUFEN = [2, 1, 0]

def r21_laden(d, prefix, fmt, tier):
    """Mittel über die Wiederholungen je Szene: p95 (haupt bevorzugt), längstes Bild, Speicher in MP.
    Speicher = Bild-Leinwände (Bildschirm, Raum, Ersatz-Raum, Schnappschuss, Glow, WebGL-Puffer) OHNE Sprites: der alte
    Stand zählte Sprites nicht, so bleibt die Spalte vergleichbar. Ganze Sitzung mit Sprites: tests/speicher-check.mjs."""
    name = f'{prefix}-{fmt}-t{tier}'
    runs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(d, name + '*.json')))
            if re.fullmatch(re.escape(name) + r'(-r\d+)?\.json', os.path.basename(f))]
    if not runs: return None
    out = {}
    for s in SC:
        vals = [r['scenes'][s] for r in runs if s in r.get('scenes', {})]
        if not vals: continue
        haupt = all(v.get('hauptP95') is not None for v in vals)
        k95, kmax = ('hauptP95', 'hauptMax') if haupt else ('p95', 'p99')
        mem = [sum(x for k, x in v['mem'].items() if k not in ('sets', 'thumbs', 'sprites') and isinstance(x, (int, float)) and x > 1)
               for v in vals if v.get('mem')]
        out[s] = {'p95': round(median(v[k95] for v in vals), 1), 'max': round(max(v.get(kmax) or 0 for v in vals)),
                  'mem': round(mean(mem) / 1e6, 2) if mem else None, 'n': len(vals), 'groesse': 'haupt' if haupt else 'iv'}
    return out

def gate(a, b): return b <= a * 1.05 + 0.5

def r21_tabelle(d, vorher, nachher):
    zeilen, ok = [], True
    zeilen.append('| Stufe | Format | ' + ' | '.join(NAME[s].split(' (')[0] for s in SC) + ' | Bild-Leinwände (MP) |')
    zeilen.append('|---|---|' + '---|' * len(SC) + '---|')
    for t in STUFEN:
        for f in FORMATE:
            a, n = r21_laden(d, vorher, f, t), r21_laden(d, nachher, f, t)
            if not a or not n: continue
            zellen = []
            for s in SC:
                if s not in a or s not in n: zellen.append('–'); continue
                pa, pn = a[s]['p95'], n[s]['p95']
                g = gate(pa, pn); ok &= g
                zellen.append(f"{pa:.1f} → **{pn:.1f}** ({(pn - pa) / pa * 100:+.0f} %){'' if g else ' ✗'} [{a[s]['max']} → {n[s]['max']}]")
            ma = [a[s]['mem'] for s in SC if s in a and a[s]['mem'] is not None]
            mn = [n[s]['mem'] for s in SC if s in n and n[s]['mem'] is not None]
            sp = f"{max(ma):.2f} → {max(mn):.2f}" if ma and mn else '–'
            zeilen.append(f'| {t} | {f} | ' + ' | '.join(zellen) + f' | {sp} |')
    return zeilen, ok

if len(sys.argv) > 1 and sys.argv[1] == 'r21':
    opt = dict(a[2:].split('=', 1) for a in sys.argv[2:] if a.startswith('--') and '=' in a)
    zeilen, ok = r21_tabelle(opt.get('dir', D), opt.get('vorher', 'r21-vorher'), opt.get('nachher', 'r21-nachher'))
    print('p95 Hauptthread-Zeit je Bild bis nach dem Malen in ms, vorher → nachher (Änderung); [längstes Bild]; ✗ = Gate gerissen\n')
    print('\n'.join(zeilen))
    print('\nGate (nachher ≤ vorher · 1,05 + 0,5 ms):', 'bestanden' if ok else 'GERISSEN')
    sys.exit(0 if ok else 1)

alt2, neu2 = load('final-alt-sw-t2'), load('final-neu-sw-t2')
alt0, neu0 = load('final-alt-sw-t0'), load('final-neu-sw-t0')
table('Worst Case: Software-Raster, CPU 4× gedrosselt, höchste Qualitätsstufe (2) — Mittel aus 2 Läufen', alt2, neu2)
table('Niedrigste Qualitätsstufe (0), Software-Raster, CPU 4× gedrosselt — Mittel aus 2 Läufen', alt0, neu0)
aa, na = load('final-alt-sw-auto'), load('final-neu-sw-auto')
if aa and na:
    table('Auto-Drosselung aktiv (Stufe wählt sich selbst), Software-Raster, CPU 4×', aa, na,
          '\nEnd-Stufe vorher/nachher: ' + ', '.join(f"{s} {aa[s]['tierEnd']}/{na[s]['tierEnd']}" for s in SC))
ag, ng = load('final-alt-gpu-t2'), load('final-neu-gpu-t2')
if ag and ng:
    print('\n**Realistisch: GPU-Raster (Metal), CPU 4× gedrosselt, V-Sync, Stufe 2** (Bildzeit + JS-Arbeit je Bild)\n')
    print('| Szene | vorher p50 / p95 | nachher p50 / p95 | JS-Arbeit p95 vorher → nachher |')
    print('|---|---|---|---|')
    for s in SC:
        print(f"| {NAME[s]} | {ag[s]['p50']} / {ag[s]['p95']} ms | {ng[s]['p50']} / {ng[s]['p95']} ms | {ag[s]['workP95']} → {ng[s]['workP95']} ms |")
d0, rm = load('final-neu-deko0-sw-t2'), load('final-neu-reduced-sw-t2')
if d0 or rm:
    print('\n**Kontrollen (neuer Code, Software-Raster, CPU 4×, Stufe 2): p95**\n')
    print('| Szene | alt | neu `?deko=0` | neu „Bewegung reduzieren“ |')
    print('|---|---|---|---|')
    for s in SC:
        print(f"| {NAME[s]} | {alt2[s]['p95']} ms | {d0[s]['p95'] if d0 else '–'} ms | {rm[s]['p95'] if rm else '–'} ms |")
