// accsprites.test.mjs — P2-5: Hut, Schleife, Kette, Lack und Eis-Waffel als gebackene Sprites.
// Pro Bild darf kein Weichzeichner-Schatten (shadowBlur) mehr gesetzt werden; gebacken wird je Art + Farbe + k einmal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { load, ROOT } from './harness.mjs';

const baer = () => ({ fellIdx: 2, frisur: 'lockig', haar: '#c0392b', acc: { hut: 0, schleife: 1, brille: null, kette: 2 },
  lack: { L0: '#e91e63', L1: '#f39c12', L2: '#9b59b6', R0: '#3498db', R1: '#2ecc71', R2: '#ffffff' },
  sticker: [], makeup: null, schaum: 0, fluff: 0, tropfen: [] });
const EIS = { waffel: 0, kugeln: [{ c: 1 }, { c: 3 }], leck: false };

// zeichnet zweimal (erstes Bild backt), zählt im zweiten Bild gesetzte Weichzeichner-Schatten
function blurImZweitenBild(sources) {
  const H = load({ seed: 5, record: true, sources });
  const b = baer();
  for (let i = 0; i < 2; i++) {
    H.rec.length = 0;
    H.g.setTransform(2, 0, 0, 2, 0, 0);
    H.Art.drawBear(H.g, b, { w: 900, h: 600 });
    for (const w of [0, 1, 2]) H.Art.drawEis(H.g, Object.assign({}, EIS, { waffel: w }), 450, 380, 1.4);
  }
  return { n: H.rec.filter(([k, v]) => k === '=shadowBlur' && v > 0).length, H };
}

test('gestylter Bär + Eis: im laufenden Bild kein shadowBlur mehr (alt: viele)', () => {
  let alt = null;                                     // Stand vor Schritt 8 (nur mit Git-Verlauf verfügbar)
  try { alt = execSync('git show 891a980:art.js', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (e) {}
  if (alt) { const vorher = blurImZweitenBild({ 'art.js': alt }).n; assert.ok(vorher >= 10, `alter Stand setzt je Bild ${vorher}× shadowBlur`); }
  const { n, H } = blurImZweitenBild();
  assert.equal(n, 0, `neu: ${n}× shadowBlur im zweiten Bild`);
  // Hut, Schleife, Kette, 6 Lackfarben, 3 Waffeln = 12 Sprites bei einer Auflösung
  assert.equal(H.Art.accCount(), 12);
});

test('Accessoire-Sprites: kleiner LRU (höchstens 16), Treffer backen nicht neu', () => {
  const H = load({ seed: 6 });
  const b = baer();
  for (const z of [0.5, 1, 1.5, 2, 2.5, 3]) {
    H.g.setTransform(z, 0, 0, z, 0, 0);
    H.Art.drawBear(H.g, b, { w: 900, h: 600 });
    assert.ok(H.Art.accCount() <= 16, `${H.Art.accCount()} Sprites`);
  }
  const n = H.Art.accCount();
  H.Art.drawBear(H.g, b, { w: 900, h: 600 });             // gleiche Auflösung: nur Treffer
  assert.equal(H.Art.accCount(), n);
});
