// eingabe.test.mjs — Zeiger-Eingabe über die echte game.js-Schleife (pointerdown/move/up auf dem Canvas):
// Ziehen in Stationen, deren Logik game.js und Station gemeinsam tragen (Zuckerwatte-Stab, Keks-Teig, Waschen).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, ALL } from './harness.mjs';

function spiel(st, opt = {}) {
  const H = load({ files: ALL, seed: 6, width: opt.width || 915, height: opt.height || 412 });   // quer: Bühne frei vom Tablett
  go(H, st);
  for (let i = 0; i < 60; i++) H.frame();                    // Kamera in Ruhe
  return H;
}
function zeiger(H, typ, wx, wy) {
  const p = H.G.worldToScreen(wx, wy);
  H.mainCanvas._l['pointer' + typ]({ clientX: p[0], clientY: p[1], pointerId: 1, pointerType: 'touch', preventDefault() {} });
}

test('Zuckerwatte: Stab antippen und ziehen → Watte folgt dem Finger, loslassen beendet', () => {
  const H = spiel('zuckerwatte');
  const S = H.S, x0 = S.watte.sx, y0 = S.watte.sy;
  zeiger(H, 'down', x0, y0 - 10);
  assert.equal(S._stabDrag, true, 'Stab nicht getroffen');
  zeiger(H, 'move', x0 - 60, y0 - 40); H.frame();
  assert.ok(Math.abs(S.watte.sx - (x0 - 60)) < 1e-6 && Math.abs(S.watte.sy - (y0 - 40)) < 1e-6);
  zeiger(H, 'up', x0 - 60, y0 - 40);
  assert.equal(S._stabDrag, false);
  // Wolle antippen = spinnen
  const s0 = S.watte.spin || 0;
  zeiger(H, 'down', S.VW * 0.5 - 170, S.VH * 0.55 + 60); zeiger(H, 'up', S.VW * 0.5 - 170, S.VH * 0.55 + 60);
  assert.ok(S.watte.spin > s0, 'Wolle nicht getroffen');
  assert.deepEqual([...H.ctx.__errors], []);
});
