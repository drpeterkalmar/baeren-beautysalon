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

test('Keks: Finger über den Teig ziehen rollt aus, mit Förmchen antippen sticht aus', () => {
  const H = spiel('keks');
  const S = H.S, b = S.REG.keks.hit().teig;
  assert.ok(b, 'keine Teig-Hit-Box');
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  zeiger(H, 'down', cx - 60, cy);
  for (let i = 0; i < 30; i++) { zeiger(H, 'move', cx - 60 + (i % 10) * 12, cy + ((i % 2) ? 5 : -5)); if (i % 3 === 0) H.frame(); }
  zeiger(H, 'up', cx, cy);
  assert.ok(S.keks.teig > 0.6, 'Teig nicht ausgerollt: ' + S.keks.teig);
  assert.ok(S.REG.keks.hit().teig.h > b.h, 'Teig wird beim Ausrollen nicht größer');
  S.buttons.find((x) => /Stern/.test(x.label)).onTap();
  const t2 = S.REG.keks.hit().teig;
  zeiger(H, 'down', t2.x + t2.w / 2, t2.y + t2.h / 2); zeiger(H, 'up', t2.x + t2.w / 2, t2.y + t2.h / 2);
  assert.deepEqual({ ...S.keks.stich }, { form: 'stern', gebacken: 0 });
  assert.equal(S.REG.keks.hit().teig, null, 'nach dem Ausstechen keine Teig-Box mehr');
  assert.deepEqual([...H.ctx.__errors], []);
});
