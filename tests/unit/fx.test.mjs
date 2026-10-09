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

// r21 (Grafik-Audit #2): Pool ohne Allokation, gleiche Zufallsfolge wie der alte Pool
import { execFileSync } from 'node:child_process';
import { ROOT } from './harness.mjs';
const FX_ALT = execFileSync('git', ['show', '2a503d4:fx.js'], { cwd: ROOT, encoding: 'utf8' });

function szenario(Fx) {
  const out = [];
  for (let i = 0; i < 90; i++) {
    if (i % 3 === 0) Fx.P.emit('spark', 100 + i, 50, { n: 6, life: 0.4 + (i % 5) * 0.2, dir: -1, spread: 1 });
    if (i % 7 === 0) Fx.P.emit('confetti', 10, 10, { n: 9, life: 0.8, layer: 'screen' });
    if (i === 40) Fx.P.clear('screen');
    Fx.P.update(1 / 60);
    out.push(Fx.P.list.map((p) => [p.type, +p.x.toFixed(6), +p.y.toFixed(6), +p.life.toFixed(6), p.col, p.layer]));
  }
  return out;
}

test('Partikel-Pool: unterhalb der Obergrenze Bild für Bild wie der alte Pool', () => {
  const neu = load({ files: ['fx.js'], seed: 9 }), alt = load({ files: ['fx.js'], seed: 9, sources: { 'fx.js': FX_ALT } });
  assert.deepEqual(JSON.parse(JSON.stringify(szenario(neu.Fx))), JSON.parse(JSON.stringify(szenario(alt.Fx))));
});

test('Partikel-Pool: keine neuen Objekte im Dauerbetrieb, auch bei vollem Pool', () => {
  const { Fx } = load({ files: ['fx.js'], seed: 3 });
  Fx.Q.tier = 0;
  for (let i = 0; i < 20; i++) Fx.P.emit('confetti', 0, 0, { n: 40, life: 2 });   // füllt den Pool (260)
  const bekannt = new Set(Fx.P.list);
  for (let f = 0; f < 600; f++) {                                                     // 10 s Konfetti-Regen + Verglühen
    Fx.P.emit('confetti', 0, 0, { n: 12, life: 0.5 + (f % 4) * 0.4 });
    Fx.P.update(1 / 60);
    for (const p of Fx.P.list) assert.ok(bekannt.has(p), 'neues Partikel-Objekt angelegt');
    assert.ok(Fx.P.count() <= 260);
  }
  assert.ok(Fx.P.count() + Fx.P.pool() <= 260, 'Vorrat wächst über die Obergrenze');
});

test('Partikel-Pool: Stufe sinkt bei vollem Pool → sofort auf die neue Obergrenze', () => {
  const { Fx } = load({ files: ['fx.js'], seed: 4 });
  Fx.Q.tier = 2;
  for (let i = 0; i < 30; i++) Fx.P.emit('spark', 0, 0, { n: 40, life: 5 });
  assert.equal(Fx.P.count(), 760);
  Fx.Q.tier = 0;
  Fx.P.emit('spark', 0, 0, { n: 1, life: 5 });
  assert.equal(Fx.P.count(), 260);
  // ältester Platz wird reihum überschrieben: nach 260 weiteren ist keins der alten Partikel (life 5) mehr jung
  for (let i = 0; i < 260; i++) Fx.P.emit('spark', 1, 1, { n: 1, life: 0.01 });
  assert.ok(Fx.P.list.every((p) => p.life < 0.02), 'Überschreiben trifft nicht alle Plätze');
});
