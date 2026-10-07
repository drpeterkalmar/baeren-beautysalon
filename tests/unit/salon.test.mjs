// salon.test.mjs — Smoke, Speichern/Laden, Aufräumen beim Stationswechsel, Aquarium-Layout, Finale-Zeitplan.
// Läuft ohne Browser: node --test tests/unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, stations, ALL } from './harness.mjs';

test('Smoke: alle 24 Stationen bauen, zeichnen und an drei Punkten antippen ohne Fehler', () => {
  for (const files of [undefined, ALL]) {        // nur Kern-Module und kompletter Satz (mit deko/ui/game)
    const H = load({ files, seed: 7 });
    const ids = stations(H);
    assert.equal(ids.length, 24);
    for (const st of ids) {
      go(H, st);
      assert.ok(H.S.buttons.length > 0, st + ': keine Knöpfe');
      H.S.draw(H.g);
      for (const [x, y] of [[450, 300], [200, 520], [700, 140]]) H.S.tapBear(x, y);
      H.S.draw(H.g);
    }
    for (const st of ['menu', 'wahl']) { go(H, st); H.S.draw(H.g); }
    if (H.G) assert.deepEqual([...H.ctx.__errors], []);
  }
});

test('Speichern/Laden: bs_baer übersteht einen Neustart', () => {
  const H = load({ seed: 1 });
  H.S.chooseBear(3);
  const b = H.S.baer;
  b.frisur = 'afro'; b.haar = H.Art.HAAR[2]; b.lack.L0 = '#e91e63'; b.acc.hut = 1; b.duft = 2; b.gurkeL = true;
  b.makeup.rouge = H.Art.ROUGE[1];
  H.S.save();
  const saved = JSON.parse(H.store.bs_baer);
  assert.equal(saved.fellIdx, 3);
  assert.equal(saved.frisur, 'afro');

  const H2 = load({ seed: 1, storage: H.store });
  const b2 = H2.S.baer;
  assert.equal(b2.fellIdx, 3);
  assert.equal(b2.fell, H2.Art.MODELS[3].fell);
  assert.equal(b2.frisur, 'afro');
  assert.equal(b2.haar, H.Art.HAAR[2]);
  assert.deepEqual({ ...b2.lack }, { L0: '#e91e63' });
  assert.equal(b2.acc.hut, 1);
  assert.equal(b2.duft, 2);
  assert.equal(b2.gurkeL, true);
  assert.equal(b2.makeup.rouge, H.Art.ROUGE[1]);
  // flüchtige Felder starten leer
  assert.equal(b2.schaum, 0);
  assert.equal(b2.tropfen.length, 0);
  // Menü bietet nach dem Neustart „Weiter“ an
  go(H2, 'menu');
  assert.ok(H2.S.buttons.some((x) => /Weiter mit meinem Bären/.test(x.label)));
});

test('Laden: kaputter Speicher stürzt nicht ab', () => {
  for (const bad of ['{', 'null', '{"fellIdx":999}']) {
    const H = load({ seed: 1, storage: { bs_baer: bad } });
    go(H, 'menu');
    go(H, 'waschen');
    H.S.draw(H.g);
  }
});

test('Stationswechsel räumt auf: Schaum/Tropfen nach Waschen, Föhn nach Föhnen', () => {
  const H = load({ seed: 1 });
  go(H, 'waschen');
  H.S.baer.schaum = 0.8; H.S.baer.tropfen.push({ x: 1, y: 2 }); H.S.dusche = true;
  go(H, 'foehnen');
  assert.equal(H.S.baer.schaum, 0);
  assert.equal(H.S.baer.tropfen.length, 0);
  assert.equal(H.S.dusche, false);
  H.S.foehn = true;
  go(H, 'schneiden');
  assert.equal(H.S.foehn, false);
});

test('aquaLayout: gültige Rechtecke hoch und quer', () => {
  for (const port of [true, false]) {
    const H = load({ seed: 1, globals: { BSUI: { L: { port } } } });
    go(H, 'aquarium');
    const f = H.S.aquaFocus();
    assert.equal(f.length, 4);
    assert.ok(f[2] > f[0] && f[3] > f[1], 'Fokus-Rechteck verkehrt');
    H.S.draw(H.g);                       // legt Fische an
    const aq = H.S.aqua;
    assert.equal(aq.fisch.length, 6);
    for (const fi of aq.fisch) {
      assert.ok(Number.isFinite(fi.x) && Number.isFinite(fi.y));
      // Fische liegen im Fokus-Ausschnitt (Kamera zeigt sie)
      assert.ok(fi.x >= f[0] && fi.x <= f[2] && fi.y >= f[1] && fi.y <= f[3], `Fisch außerhalb (${port ? 'hoch' : 'quer'})`);
    }
  }
});

test('Finale-Zeitplan: jedes Ereignis feuert genau einmal', () => {
  const calls = { sfx: {}, cannons: 0, starBurst: [], drizzle: 0, duck: [] };
  const BSSfx = { play(n) { calls.sfx[n] = (calls.sfx[n] || 0) + 1; }, duck(v) { calls.duck.push(v); }, loop() {}, tick() {}, syncMute() {} };
  const BSGame = { pxPerUnit: () => 2, cannons() { calls.cannons++; }, starBurst(i) { calls.starBurst.push(i); }, drizzle() { calls.drizzle++; } };
  const H = load({ seed: 3, globals: { BSSfx, BSGame } });
  go(H, 'finish');
  H.S.startFinale();
  assert.equal(H.S.state, 'finish-done');
  for (let i = 0; i < 60 * 8; i++) H.S.updateFinale(1 / 60);   // 8 s
  const F = H.S.fin;
  const keys = Object.keys(F.fired).sort();
  assert.deepEqual(keys, ['cta', 'drum', 'duck', 'land', 'magic', 'pola', 'poof', 'star0', 'star1', 'star2', 'tada', 'title', 'unduck'].sort());
  for (const n of ['drumroll', 'poof', 'magic', 'tada', 'boing', 'sparkle', 'pop']) assert.equal(calls.sfx[n], 1, n);
  assert.equal(calls.sfx.cannon, 2);       // zwei Kanonen-Schüsse im selben Ereignis
  assert.equal(calls.sfx.ding, 3);
  assert.equal(calls.sfx.whoosh, 2);       // Start + Polaroid
  assert.equal(calls.cannons, 1);
  assert.deepEqual(calls.starBurst, [0, 1, 2]);
  assert.deepEqual(calls.duck, [0.3, 1]);
  assert.ok(calls.drizzle > 0);            // Feier-Loop läuft
  assert.ok(F.vorher, 'Vorher-Bild fehlt');
  // Überspringen während der Spannung springt nur vor, feuert nichts doppelt
  const H2 = load({ seed: 3, globals: { BSSfx: { play() {}, duck() {} }, BSGame } });
  go(H2, 'finish'); H2.S.startFinale();
  for (let i = 0; i < 60; i++) H2.S.updateFinale(1 / 60);
  H2.S.tapBear(450, 300);
  assert.ok(H2.S.fin.t >= H2.S.FIN.wipe1 - 0.3 - 1e-9);
});
