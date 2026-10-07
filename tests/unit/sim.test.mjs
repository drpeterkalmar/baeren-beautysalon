// sim.test.mjs — P2-3: Stations-Simulation in S.update(dt), bildraten-unabhängig.
// (1) 60 Hz: neuer Code zeichnet Bild für Bild exakt wie der alte (Referenz tests/unit/fixtures/sim-ref-alt.json).
// (2) 60 vs. 120 Hz: nach derselben Zeit gleiche Positionen/Zähler (±1 %), Zufall dafür neutralisiert.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, load, go } from './harness.mjs';
import { SZENEN, spiele } from './sim-szenen.mjs';

const REF = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'unit', 'fixtures', 'sim-ref-alt.json'), 'utf8'));

for (const name of Object.keys(SZENEN)) {
  test(`${name}: 60 Hz zeichnet Bild für Bild wie der alte Code (${REF.rev})`, () => {
    const ref = REF.szenen[name], r = spiele(name, { mode: 'neu', hz: 60 });
    assert.equal(r.hashes.length, ref.hashes.length);
    const first = r.hashes.findIndex((h, i) => h !== ref.hashes[i]);
    assert.equal(first, -1, `erstes abweichendes Bild: ${first}`);
    assert.deepEqual(r.snaps, ref.snaps);
  });
}

// ---- 60 vs. 120 Hz ------------------------------------------------------------------------------
export const nah = (a, b, rel, abs = 1e-9) => Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));
export function lauf(st, hz, secs, { setup, random = () => 0.5, tick } = {}) {
  const H = load({ seed: 1, globals: { BSUI: { L: { port: true } } } });
  H.ctx.Math.random = random;
  go(H, st);
  if (setup) setup(H);
  const dt = 1 / hz, n = Math.round(secs * hz);
  for (let i = 0; i < n; i++) { H.tick(dt * 1000); H.S.update(dt); H.S.draw(H.g); if (tick) tick(H, (i + 1) * dt); }
  return H;
}

// Aquarium: feste Fische/Körner, Zufall neutral (0,5 → keine Idle-Wanderung, keine Zufallsblasen)
function aquaSetup(futter) {
  return (H) => {
    const aq = H.S.aqua;
    aq.fisch = [[200, 120, 41, 8], [420, 200, -35, -6], [560, 300, 28, 12], [300, 260, -50, 3], [480, 90, 20, -9], [650, 180, -22, 5]]
      .map(([x, y, vx, vy], i) => ({ x, y, vx, vy, c: '#ff8a5c', ph: i, s: 1.35, ziel: null }));
    if (futter) for (let i = 0; i < 8; i++) aq.futter.push({ x: 260 + i * 40, y: 40, vy: 25 + i * 3, ph: i });
  };
}
const fische = (H) => H.S.aqua.fisch.map((f) => [f.x, f.y]);

test('Aquarium: Fische schwimmen bei 60 und 120 Hz gleich weit (±1 %)', () => {
  const a = lauf('aquarium', 60, 2, { setup: aquaSetup(false) }), b = lauf('aquarium', 120, 2, { setup: aquaSetup(false) });
  const pa = fische(a), pb = fische(b);
  pa.forEach((p, i) => { assert.ok(nah(p[0], pb[i][0], 0.01) && nah(p[1], pb[i][1], 0.01), `Fisch ${i}: ${p} vs ${pb[i]}`); });
});

test('Aquarium: Füttern – Körner, Schnappen und Dose zeitgleich bei 60 und 120 Hz', () => {
  const stand = (H) => ({ futter: H.S.aqua.futter.length, fuetter: H.S.aqua.fuetter, fisch: fische(H) });
  const mit = (hz) => { const out = []; lauf('aquarium', hz, 2, { setup: (H) => { aquaSetup(true)(H); H.S.aqua.fuetter = 1.2; },
    tick: (H, t) => { if (Math.abs(t * 4 - Math.round(t * 4)) < 1e-9) out.push(stand(H)); } }); return out; };
  const a = mit(60), b = mit(120);
  assert.equal(a.length, 8);
  for (let i = 0; i < a.length; i++) {
    assert.equal(a[i].futter, b[i].futter, `t=${(i + 1) / 4}s Körner ${a[i].futter} vs ${b[i].futter}`);
    assert.ok(nah(a[i].fuetter, b[i].fuetter, 0.01, 1e-6), `Dose ${a[i].fuetter} vs ${b[i].fuetter}`);
  }
  // nach 1 s (Jagd aufs Futter, Schnappen): Fischpositionen auf ±1 % der Beckenbreite (620) gleich.
  // (Euler-Schritte: die Abweichung halbiert sich mit halber Schrittweite; 120 vs. 240 Hz ≈ 0,6 Einheiten)
  a[3].fisch.forEach((p, i) => assert.ok(Math.hypot(p[0] - b[3].fisch[i][0], p[1] - b[3].fisch[i][1]) <= 6.2, `Fisch ${i} ${p} vs ${b[3].fisch[i]}`));
});

test('Aquarium: Futterkorn sinkt in 1 s gleich tief (60/120 Hz, ±1 %)', () => {
  const y = (hz) => lauf('aquarium', hz, 1, { setup: (H) => { H.S.aqua.fisch = []; H.S.aqua.futter.push({ x: 300, y: 50, vy: 22, ph: 0 }); } }).S.aqua.futter[0].y;
  assert.ok(nah(y(60) - 50, y(120) - 50, 0.01), `${y(60)} vs ${y(120)}`);
});

test('Zauber: Spruch dauert bei 60 und 120 Hz gleich lang (≈1,67 s, ±1 %)', () => {
  const dauer = (hz) => {
    let ende = null;
    lauf('zauber', hz, 3, { setup: (H) => { H.S.zauber.fx = { art: 0, t: 0.001, d: 1.6, seed: 1 }; },
      tick: (H, t) => { if (ende === null && !H.S.zauber.fx) ende = t; } });
    return ende;
  };
  const a = dauer(60), b = dauer(120);
  assert.ok(nah(a, 100 / 60, 0.011), `60 Hz: ${a}`);     // wie früher: 100 Bilder à 1/60 s
  assert.ok(nah(a, b, 0.01), `${a} vs ${b}`);
});
