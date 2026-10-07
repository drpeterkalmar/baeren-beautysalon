// farbcache.test.mjs — P2-4: Farb-Cache bleibt begrenzt, Zauber baut keine neuen Farbstrings pro Bild.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, drawLog } from './harness.mjs';

test('Fx.parse: Cache wächst nie über 1.000 Einträge', () => {
  const { Fx } = load({ files: ['fx.js'] });
  for (let i = 0; i < 5000; i++) {
    const c = Fx.parse('rgba(1,2,3,' + (i / 5000) + ')');
    assert.equal(c[3], i / 5000);
    assert.ok(Fx.parseCacheSize() <= 1000);
  }
  // nach dem Leeren rechnet er weiter richtig
  assert.deepEqual([...Fx.parse('#102030')], [16, 32, 48, 1]);
});

test('Zauber: 100 Bilder je Zauber lassen den Farb-Cache nicht wachsen', () => {
  const H = load({ seed: 2 });
  go(H, 'zauber');
  for (const art of [0, 1, 2]) {
    H.S.zauber.art = art;
    H.S.zauber.fx = { art, t: 0.001, d: 1.6, seed: 1 };
    H.tick(16); H.S.draw(H.g);                      // erstes Bild darf die festen Farben einmal anlegen
    const n0 = H.Fx.parseCacheSize();
    for (let i = 0; i < 100; i++) { H.tick(1000 / 60); H.S.draw(H.g); }
    assert.equal(H.Fx.parseCacheSize(), n0, 'Zauber ' + art + ' legt pro Bild neue Farben an');
  }
});

test('Zauber: Alpha kommt aus globalAlpha, verblasst wie vorher (1−q bzw. 1−0,6q)', () => {
  const H = load({ seed: 2, record: true });
  go(H, 'zauber');
  for (const [art, fade] of [[0, (q) => 1 - q], [1, (q) => 1 - q * 0.6], [2, (q) => 1 - q]]) {
    const t0 = 0.8;
    H.S.zauber.fx = { art, t: t0, d: 1.6, seed: 1 };
    H.rec.length = 0; H.S.draw(H.g);
    const al = drawLog(H.rec).filter((e) => e[0] === 'drawImage').map((e) => +String(e[e.length - 1]).slice(1));
    assert.ok(al.some((a) => Math.abs(a - fade(t0 / 1.6)) < 1e-6), 'Zauber ' + art + ': erwartetes Alpha fehlt');
    assert.equal(H.g.globalAlpha, 1, 'globalAlpha nicht zurückgesetzt');
  }
});
