// stufen.test.mjs — P2-2: Qualitäts-Automatik Fx.Q.step bewertet JS-Arbeit und Grundperiode (30-Hz-Geräte).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, seeded } from './harness.mjs';

const { Fx } = load({ files: ['fx.js'] });

// alte Logik aus game.js tiers() (Stand 79d3ca7), wörtlich – als Vergleich
function altStep(sm, perf) {
  perf.warm += sm.dt; if (perf.warm < 2.5) return null;
  perf.ema += (Math.min(sm.ms, 60) - perf.ema) * 0.05;
  perf.work += (sm.work - perf.work) * 0.05;
  if (perf.ema > 20.5) perf.slow += sm.dt; else perf.slow = Math.max(0, perf.slow - sm.dt * 0.5);
  if (perf.slow > 1.3 && sm.tier > 0) { perf.slow = 0; perf.fast = 0; perf.flips++; return sm.tier - 1; }
  if (perf.ema < 17.4 && perf.work < 6) perf.fast += sm.dt; else perf.fast = 0;
  if (perf.fast > 8 && sm.tier < 2 && perf.flips < 2) { perf.fast = 0; return sm.tier + 1; }
  return null;
}
const altPerf = () => ({ ema: 16.7, work: 6, slow: 0, fast: 0, flips: 0, warm: 0 });

// Bildfolge: Abschnitte [Sekunden, hz, JS-Arbeit ms, Zittern ms]. Mit Bildsynchronisation: braucht ein Bild länger als
// eine Periode, dauert es die nächste ganze Zahl Perioden (wie requestAnimationFrame).
function folge(abschnitte, seed = 1) {
  const R = seeded(seed), out = [];
  for (const [secs, hz, work, jit = 0.3, vsync = true] of abschnitte) {
    const per = 1000 / hz;
    for (let t = 0; t < secs * 1000;) {
      const w = typeof work === 'function' ? work(R) : work * (0.85 + 0.3 * R());
      let ms = vsync ? Math.max(1, Math.ceil((w + 1) / per - 1e-9)) * per : Math.max(per, w + 1);
      ms += (R() - 0.5) * 2 * jit;
      out.push({ ms, work: w, dt: Math.min(0.05, ms / 1000) });
      t += ms;
    }
  }
  return out;
}
function spiele(f, stepFn, perf) {
  let tier = 2; const verlauf = [];
  f.forEach((sm, i) => { const nt = stepFn({ ...sm, tier }, perf); if (nt !== null) { tier = nt; verlauf.push([i, nt]); } });
  return { tier, verlauf };
}
const neu = (f) => spiele(f, Fx.Q.step, Fx.Q.newPerf());
const alt = (f) => spiele(f, altStep, altPerf());

test('(a) 60 Hz, 5 ms Arbeit → bleibt Stufe 2', () => {
  const f = folge([[20, 60, 5]]);
  assert.equal(neu(f).tier, 2); assert.equal(alt(f).tier, 2);
});

test('(b) 30 Hz, 5 ms Arbeit → bleibt Stufe 2 (vorher: 0)', () => {
  const f = folge([[20, 30, 5]]);
  assert.equal(neu(f).tier, 2);
  assert.equal(alt(f).tier, 0, 'alte Logik sollte hier auf 0 fallen (Beleg für den Fehler)');
});

test('(c) 60 Hz, 25 ms Arbeit → fällt (bis 0)', () => {
  const f = folge([[20, 60, 25]]);
  assert.equal(neu(f).tier, 0); assert.equal(alt(f).tier, 0);
});

test('(d) 120 Hz und 90 Hz, wenig Arbeit → bleibt Stufe 2', () => {
  for (const hz of [120, 90]) assert.equal(neu(folge([[20, hz, 4]])).tier, 2, hz + ' Hz');
});

test('(e) 30 Hz, aber 28 ms JS-Arbeit (am Limit) → fällt', () => {
  assert.ok(neu(folge([[20, 30, 28, 0.3]])).tier < 2);
});

test('(f) 60-Hz-Gerät wird nach dem Warmlauf langsam (33 ms, Grafik-Engpass) → fällt wie vorher', () => {
  const f = folge([[3, 60, 4], [15, 60, 20]]);
  assert.deepEqual(neu(f), alt(f));
  assert.equal(neu(f).tier, 0);
});

test('(g) Software-Raster gedrosselt, unruhig 40–100 ms (wenig JS-Arbeit) → landet auf 0 wie vorher', () => {
  const f = folge([[15, 1000, (R) => 3 + R() * 2, 0, false]]).map((s, i) => ({ ...s, ms: 40 + ((i * 37) % 61), dt: Math.min(0.05, (40 + ((i * 37) % 61)) / 1000) }));
  assert.equal(neu(f).tier, 0); assert.equal(alt(f).tier, 0);
});

test('(h) Software-Raster gedrosselt, Arbeit ≈ Abstand (44–100 ms) → landet auf 0 wie vorher', () => {
  const f = folge([[15, 1000, (R) => 40 + R() * 55, 0, false]]);
  assert.equal(neu(f).tier, 0);
  assert.deepEqual(neu(f), alt(f));
});

test('bei 60/90/120 Hz mit Lastspitzen: Stufenverlauf exakt wie die alte Logik', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const R = seeded(seed), hz = [60, 90, 120][seed % 3];
    const ab = [[3, hz, 4]];
    for (let k = 0; k < 6; k++) ab.push([1 + R() * 6, hz, [3, 8, 14, 19, 26, 40][Math.floor(R() * 6)]]);
    const f = folge(ab, seed);
    assert.deepEqual(neu(f), alt(f), 'Folge ' + seed);
  }
});

test('30-Hz-Gerät verlässt den Stromsparmodus → wieder normale Schwellen (danach Last bei 60 Hz → fällt)', () => {
  const f = folge([[10, 30, 5], [5, 60, 4], [10, 60, 25]]);
  const r = neu(f);
  const n30 = folge([[10, 30, 5]]).length;            // Bilder der 30-Hz-Phase
  assert.ok(r.verlauf.length > 0 && r.verlauf[0][0] > n30, 'fiel schon in der 30-Hz-Phase');
  assert.equal(r.tier, 0);
});

test('Hochstufen wie vorher: kurze Last, dann 8 s ruhig → zurück (höchstens 2 Wechsel)', () => {
  const f = folge([[3, 60, 4], [2.2, 60, 25], [12, 60, 3], [2.2, 60, 25], [12, 60, 3], [2.2, 60, 25], [12, 60, 3]]);
  assert.deepEqual(neu(f), alt(f));
  assert.ok(neu(f).verlauf.some(([, t]) => t === 2));
});

test('Mess-Werkzeuge frieren die Stufe ein (perf.warm = −1e9) → nie ein Wechsel', () => {
  const P = Fx.Q.newPerf(); P.warm = -1e9;
  assert.equal(spiele(folge([[20, 60, 30]]), Fx.Q.step, P).verlauf.length, 0);
});

test('game.js: 30-Hz-Schleife (10 s) bleibt auf Stufe 2, 60-Hz-Schleife mit 33-ms-Einbruch fällt', () => {
  const H = load({ files: ['fx.js', 'art.js', 'room.js', 'deko.js', 'salon.js', 'ui.js', 'game.js'], seed: 4 });
  for (let i = 0; i < 300; i++) H.frame(1000 / 30);
  assert.equal(H.Fx.Q.tier, 2);
  assert.equal(H.G.perf.base, 33.3);
  const H2 = load({ files: ['fx.js', 'art.js', 'room.js', 'deko.js', 'salon.js', 'ui.js', 'game.js'], seed: 4 });
  for (let i = 0; i < 180; i++) H2.frame(1000 / 60);
  for (let i = 0; i < 300; i++) H2.frame(1000 / 30);
  assert.equal(H2.G.perf.base, 16.7);
  assert.equal(H2.Fx.Q.tier, 0);
  assert.deepEqual([...H.ctx.__errors, ...H2.ctx.__errors], []);
});
