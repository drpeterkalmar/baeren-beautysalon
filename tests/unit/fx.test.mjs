// fx.test.mjs — Farb-Mathe robust gegen Unsinn, Partikel-Pool hält seine Obergrenze je Qualitätsstufe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';

const UNSINN = [undefined, null, '', 'x', '#', '#zz', 'rgba(', 'rgba(a,b,c)', 42, {}, [], 'rgb(1,2)'];
const ok4 = (c) => Array.isArray(c) && c.length === 4 && c.every((v) => Number.isFinite(v));

test('Fx.parse liefert für Unsinn immer vier endliche Zahlen', () => {
  const { Fx } = load({ files: ['fx.js'] });
  for (const u of UNSINN) assert.ok(ok4(Fx.parse(u)), 'parse(' + JSON.stringify(u) + ')');
  assert.deepEqual([...Fx.parse('#ff8000')], [255, 128, 0, 1]);
  assert.deepEqual([...Fx.parse('#f80')], [255, 136, 0, 1]);
  assert.deepEqual([...Fx.parse('rgba(10,20,30,0.5)')], [10, 20, 30, 0.5]);
  assert.deepEqual([...Fx.parse('rgb(10,20,30)')], [10, 20, 30, 1]);
});

test('Fx.mix / Fx.alpha / Fx.shade liefern gültige CSS-Farben, auch bei Unsinn', () => {
  const { Fx } = load({ files: ['fx.js'] });
  const css = /^rgba?\(\d+,\d+,\d+(,[0-9.]+)?\)$/;
  for (const u of UNSINN) {
    assert.match(Fx.mix(u, '#fff', 0.5), css);
    assert.match(Fx.mix('#000', u, 0.5), css);
    assert.match(Fx.alpha(u, 0.3), css);
    assert.match(Fx.shade(u, -40), css);
    assert.match(Fx.shade(u, 40), css);
    assert.ok(Number.isFinite(Fx.lum(u)));
  }
  assert.equal(Fx.mix('#000000', '#ffffff', 0.5), 'rgb(128,128,128)');
  assert.equal(Fx.alpha('#ff0000', 0.25), 'rgba(255,0,0,0.250)');
  assert.equal(Fx.mix('#000', '#fff', 0), 'rgb(0,0,0)');
});

test('Partikel-Pool überschreitet MAXP[Stufe] nie (260/480/760)', () => {
  const { Fx } = load({ files: ['fx.js'], seed: 5 });
  const MAXP = [260, 480, 760];
  for (const tier of [0, 1, 2]) {
    Fx.Q.tier = tier;
    Fx.P.clear();
    for (let i = 0; i < 400; i++) {
      Fx.P.emit('confetti', 100, 100, { n: 30, life: 5 });
      assert.ok(Fx.P.count() <= MAXP[tier], `Stufe ${tier}: ${Fx.P.count()} > ${MAXP[tier]}`);
    }
    assert.equal(Fx.P.count(), MAXP[tier]);   // voll, aber nie drüber
    for (let i = 0; i < 400; i++) Fx.P.update(1 / 60);  // alles verglüht
    assert.equal(Fx.P.count(), 0);
  }
});

test('Partikel: clear(layer) löscht nur die Ebene', () => {
  const { Fx } = load({ files: ['fx.js'], seed: 5 });
  Fx.P.emit('spark', 0, 0, { n: 5 });
  Fx.P.emit('spark', 0, 0, { n: 5, layer: 'screen' });
  const n = Fx.P.count();
  Fx.P.clear('screen');
  assert.ok(Fx.P.count() > 0 && Fx.P.count() < n);
  assert.ok(Fx.P.list.every((p) => p.layer === 'world'));
});
