// relief.test.mjs — r21 E2 Fell/Stoff mit Struktur (relief.js): Höhenfelder, Normalen-Licht, Lichtrichtungen, Einbindung.
// Nicht prüfbar ohne Browser (Heavy-Job): wie es aussieht (Collage ?fell=0 gegen ?fell=1), Backzeit auf echtem Raster.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, ALL } from './harness.mjs';

const R = (opt = {}) => load({ files: ['fx.js', 'relief.js'], ...opt });
const ARTEN = ['fell', 'frottee', 'samt', 'stoff'];
const mittel = (a) => a.reduce((x, y) => x + y, 0) / a.length;

test('Höhenfelder: 0…1, deterministisch, je Art verschieden', () => {
  const RF = R().ctx.BSRelief, N = 64;
  const felder = ARTEN.map((a) => RF.hoehe(a, N));
  for (const [i, h] of felder.entries()) {
    assert.equal(h.length, N * N);
    let mn = 1, mx = 0; for (const v of h) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
    assert.ok(mn === 0 && mx === 1, `${ARTEN[i]}: ${mn}…${mx}`);
    assert.deepEqual([...RF.hoehe(ARTEN[i], N)], [...h]);
  }
  for (let i = 1; i < felder.length; i++) assert.notDeepEqual([...felder[i]], [...felder[0]]);
});

test('Höhenfelder sind kachelbar (Naht nicht stärker als Nachbarn im Inneren)', () => {
  const RF = R().ctx.BSRelief, N = 128;
  for (const a of ARTEN) {
    const h = RF.hoehe(a, N);
    const d = (x0, x1) => { let s = 0; for (let y = 0; y < N; y++) s += Math.abs(h[y * N + x0] - h[y * N + x1]); return s / N; };
    const dv = (y0, y1) => { let s = 0; for (let x = 0; x < N; x++) s += Math.abs(h[y0 * N + x] - h[y1 * N + x]); return s / N; };
    const innen = mittel(Array.from({ length: N - 1 }, (_, x) => d(x, x + 1)));
    const innenV = mittel(Array.from({ length: N - 1 }, (_, y) => dv(y, y + 1)));
    assert.ok(d(N - 1, 0) < innen * 1.8 + 0.01, `${a}: Naht waagrecht ${d(N - 1, 0).toFixed(3)} gegen ${innen.toFixed(3)}`);
    assert.ok(dv(N - 1, 0) < innenV * 1.8 + 0.01, `${a}: Naht senkrecht ${dv(N - 1, 0).toFixed(3)} gegen ${innenV.toFixed(3)}`);
  }
});

test('Licht: flache Fläche = neutrales Grau 128; Mittel jeder Kachel 128 (soft-light verfärbt nicht)', () => {
  const RF = R().ctx.BSRelief, N = 64, L = RF.richtung(1, -1, 0, 0);
  const flach = RF.licht(new Float32Array(N * N).fill(0.5), N, L, 2);
  for (let i = 0; i < N * N; i++) assert.equal(flach[i * 4], 128);
  for (const [a, Z] of Object.entries(RF.ZIELE)) {
    const px = RF.licht(RF.hoehe(Z.art, N), N, L, Z.tiefe);
    const g = []; for (let i = 0; i < N * N; i++) { g.push(px[i * 4]); assert.equal(px[i * 4 + 3], 255); assert.equal(px[i * 4], px[i * 4 + 1]); }
    const m = mittel(g), sd = Math.sqrt(mittel(g.map((v) => (v - m) ** 2)));
    assert.ok(Math.abs(m - 128) < 1.5, `${a}: Mittel ${m.toFixed(2)}`);
    assert.ok(sd > 5 && sd < 45, `${a}: Streuung ${sd.toFixed(1)} (zu flach oder zu fleckig)`);
  }
});

test('Licht: ein Buckel ist auf der Lichtseite hell, auf der Gegenseite dunkel; Richtung umdrehen dreht das um', () => {
  const RF = R().ctx.BSRelief, N = 32, h = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) h[y * N + x] = Math.exp(-((x - 16) ** 2 + (y - 16) ** 2) / 20);
  const links = RF.licht(h, N, RF.richtung(-10, 0, 0, 0), 3), rechts = RF.licht(h, N, RF.richtung(10, 0, 0, 0), 3);
  const at = (px, x, y) => px[(y * N + x) * 4];
  assert.ok(at(links, 13, 16) > at(links, 19, 16) + 20, 'Licht von links: linke Flanke nicht heller');
  assert.ok(at(rechts, 19, 16) > at(rechts, 13, 16) + 20, 'Licht von rechts: rechte Flanke nicht heller');
  const oben = RF.licht(h, N, RF.richtung(0, -10, 0, 0), 3);
  assert.ok(at(oben, 16, 13) > at(oben, 16, 19) + 20, 'Licht von oben (y nach unten): obere Flanke nicht heller');
});

test('Lichtrichtungen: Fenster rechts oben – Regale links bekommen Licht von rechts, Sessel rechts von links; Bär oben links', () => {
  const RF = R().ctx.BSRelief, len = (v) => Math.hypot(...v);
  const regal = RF.fenster(148, 198), sessel = RF.fenster(1010, 450), bar = RF.KEY;
  assert.ok(regal[0] > 0.5 && sessel[0] < -0.5);
  assert.ok(sessel[1] < 0, 'Fenster liegt über dem Sessel');
  assert.ok(bar[0] < 0 && bar[1] < 0);
  for (const v of [regal, sessel, bar]) { assert.ok(Math.abs(len(v) - 1) < 1e-9); assert.ok(Math.abs(v[2] - Math.sin(38 * Math.PI / 180)) < 1e-9); }
  // 16 Richtungsstufen: Rundung höchstens eine halbe Stufe daneben
  for (let a = 0; a < 360; a += 7) {
    const L = RF.richtung(Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180), 0, 0), q = RF.ausStufe(RF.stufe(L));
    const cos = (L[0] * q[0] + L[1] * q[1]) / (Math.hypot(L[0], L[1]) * Math.hypot(q[0], q[1]));
    assert.ok(cos > Math.cos(Math.PI / 16) - 1e-9, `Winkel ${a}°`);
  }
});

test('Kacheln: alle Ziele in einer Richtung zusammen schnell gebacken (< 0,4 s), danach aus dem Cache', () => {
  const H = R(), RF = H.ctx.BSRelief;
  const t0 = performance.now();
  for (const z of Object.keys(RF.ZIELE)) RF.kachel(z, RF.KEY);
  const ms = performance.now() - t0;
  assert.ok(ms < 400, `${ms.toFixed(0)} ms`);
  const n = RF.anzahl();
  for (const z of Object.keys(RF.ZIELE)) RF.kachel(z, RF.richtung(-0.36, -0.44, 0.001, 0));   // gleiche Stufe
  assert.equal(RF.anzahl(), n);
});

test('auftragen: an = soft-light-Füllung mit Muster; ?fell=0 = kein einziger Aufruf; Stufe unter MIN_STUFE = aus', () => {
  const H = R({ record: true }), RF = H.ctx.BSRelief;
  RF.auftragen(H.g, 'frottee', RF.KEY, 0, 0, 40, 40);
  const ops = H.rec.map((e) => e[0]);
  assert.ok(ops.includes('createPattern') || ops.includes('fillRect'));
  assert.ok(H.rec.some((e) => e[0] === '=globalCompositeOperation' && e[1] === 'soft-light'));
  const H0 = R({ record: true, search: '?fell=0' });
  H0.ctx.BSRelief.auftragen(H0.g, 'frottee', H0.ctx.BSRelief.KEY, 0, 0, 40, 40);
  H0.ctx.BSRelief.flaeche(H0.g, 'polster', (g) => g.rect(0, 0, 9, 9), 0, 0, 9, 9);
  assert.equal(H0.rec.length, 0);
  H.rec.length = 0; RF.MIN_STUFE = 1; H.Fx.Q.tier = 0;
  RF.auftragen(H.g, 'fell', RF.KEY, 0, 0, 40, 40);
  assert.equal(H.rec.length, 0);
});

test('Einbindung: Bären-Teile backen Fell-Relief, der Raum Stoff-Kacheln; ?fell=0 backt keine', () => {
  const run = (search) => {
    const H = load({ files: ALL, seed: 3, search });
    go(H, 'waschen'); for (let i = 0; i < 90; i++) H.frame();
    go(H, 'zirkus'); for (let i = 0; i < 90; i++) H.frame();
    return H;
  };
  const H = run(''), RF = H.ctx.BSRelief;
  const keys = [...RF.schluessel()].map((k) => k.split('|')[0]);
  assert.ok(keys.includes('fell'), 'Fell-Kachel nicht beim Backen entstanden: ' + keys);
  assert.ok(keys.includes('vorhang') && keys.includes('teppich'), 'Stoff-Kacheln im Raum fehlen: ' + keys);
  assert.ok(RF.schluessel().includes('fell|' + RF.stufe(RF.KEY)), 'Fell nicht im Keylicht');
  assert.deepEqual([...H.ctx.__errors], []);
  const H0 = run('?fell=0');
  assert.equal(H0.ctx.BSRelief.anzahl(), 0);
  assert.deepEqual([...H0.ctx.__errors], []);
});
