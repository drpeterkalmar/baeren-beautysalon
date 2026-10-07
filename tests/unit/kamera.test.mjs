// kamera.test.mjs — P2-1: nach Größen-/Stufenwechsel fährt die Kamera beim nächsten Stationswechsel wieder weich.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, ALL } from './harness.mjs';

// Abstand der aktuellen Kamera zur Ruhelage (Bildschirm-px eines Welt-Punkts am Rand)
function versatz(H) {
  const T = H.G.camRest, v = T.vp, X = 150, Y = 100, p = H.G.worldToScreen(X, Y);
  const rx = v.x + v.w / 2 + (X - T.cam.x) * T.cam.z, ry = v.y + v.h / 2 + (Y - T.cam.y) * T.cam.z;
  return Math.hypot(p[0] - rx, p[1] - ry);
}
function start() {
  const H = load({ files: ALL, seed: 2 });
  go(H, 'waschen');
  for (let i = 0; i < 90; i++) H.frame();            // Kamera in Ruhe
  assert.ok(versatz(H) < 0.01);
  return H;
}

test('Stationswechsel ohne Resize: Kamera fährt (Referenz)', () => {
  const H = start();
  go(H, 'zirkus'); for (let i = 0; i < 10; i++) H.frame();   // Fahrt dauert 0,7 s (langsamer Anfang)
  assert.ok(versatz(H) > 3, 'Kamera ist gesprungen');
  for (let i = 0; i < 60; i++) H.frame();
  assert.ok(versatz(H) < 0.01);
});

for (const [name, ausloeser] of [
  ['Fenster-Resize', (H) => H.ctx.dispatchEvent(new H.ctx.Event('resize'))],
  ['Drehung (andere Größe)', (H) => { H.wrap.clientWidth = 915; H.wrap.clientHeight = 412; H.ctx.dispatchEvent(new H.ctx.Event('resize')); }],
  ['Stufenwechsel der Automatik', (H) => { H.Fx.Q.tier = 1; H.ctx.dispatchEvent(new H.ctx.Event('resize')); }],
]) {
  test(`${name} → nächster Stationswechsel fährt weich statt zu springen`, () => {
    const H = start();
    ausloeser(H);
    H.frame();                                        // ein Bild nach dem Resize: schnappt unsichtbar aufs aktuelle Ziel
    assert.ok(versatz(H) < 0.01);
    go(H, 'zirkus'); for (let i = 0; i < 10; i++) H.frame();
    assert.ok(versatz(H) > 3, `Kamera springt nach ${name} (Versatz ${versatz(H).toFixed(2)} px)`);
    for (let i = 0; i < 60; i++) H.frame();
    assert.ok(versatz(H) < 0.01, 'Fahrt endet nicht in der Ruhelage');
    assert.deepEqual([...H.ctx.__errors], []);
  });
}
