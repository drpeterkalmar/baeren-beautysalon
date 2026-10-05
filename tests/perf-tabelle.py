#!/usr/bin/env python3
"""DEV-TOOL: Messtabelle vorher/nachher aus tests/shots/deko/perf/*.json (Ausgabe: Markdown).
Mittelt Wiederholungen (…-r1, …-r2). Aufruf: python3 tests/perf-tabelle.py"""
import json, glob, os, re
from statistics import mean

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
