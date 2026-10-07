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
