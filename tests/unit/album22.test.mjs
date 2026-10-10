// album22.test.mjs — r22 E3: Sammelalbum (185 Felder, 12 Fotos) und Bild-Postkarte (kunden.js), Messgröße 3 (Simulation).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, ALL } from './harness.mjs';

const OHNE_GB = '?tag=20260130';
const run = (H, n) => { for (let i = 0; i < n; i++) H.frame(); };
const tap = (H, re) => { const b = H.S.buttons.find((x) => re.test(x.label || '')); assert.ok(b, 'Knopf ' + re); b.onTap(); };
const namen = (H) => H.Art.MODELS.map((m) => m.name);

test('Album-Stand: 37 × 5 = 185 Felder, ein Sticker je Herz, kennengelernt = mindestens ein Besuch', () => {
  const H = load({ files: ALL, seed: 1 }), K = H.ctx.BSKunden, N = namen(H);
  assert.deepEqual({ ...K.albumStand(K.leer()) }, { voll: 0, felder: 185, kennen: 0, baeren: 37, beste: 0 });
  const st = K.lade(JSON.stringify({ v: 1, b: { [N[0]]: { p: 45, n: 3 }, [N[1]]: { p: 100, n: 9 }, [N[2]]: { p: 5, n: 1 }, [N[36]]: { p: 20, n: 1 } } }));
  assert.deepEqual({ ...K.albumStand(st) }, { voll: 2 + 5 + 0 + 1, felder: 185, kennen: 4, baeren: 37, beste: 1 });
});

// Messgröße 3: Sammel-Fortschritt nach 10 Besuchen (zufällige Kunden mit Stammkunden-Anteil, Punkte je Besuch wie in
// der Herz-Simulation). Mittel über 200 Läufe; Ergebnis steht im Bericht (Ziel laut Blatt 10–20 %).
export function simuliereAlbum(K, besuche = 10, laeufe = 200) {
  const res = [];
  for (let l = 0; l < laeufe; l++) {
    const st = K.leer(), rnd = K.zufall(1000 + l), letzte = [];
    for (let b = 1; b <= besuche; b++) {
      const idx = K.waehleKundeMit(rnd, letzte, st, {}); letzte.unshift(idx); letzte.length = Math.min(2, letzte.length);
      const e = K.eintrag(st, idx); e.n++;
      const herz = K.herzen(e.p), n = Math.min(3, K.P.wunsch + (herz >= K.P.wunschPlusAb ? 1 : 0));
      K.gutschreiben(st, idx, K.betrag('besuch'));
      for (let w = 0; w < n; w++) K.gutschreiben(st, idx, K.betrag('wunsch', { liebling: w === 0 && rnd() < 0.5 }));
      if (rnd() < 0.5) K.gutschreiben(st, idx, K.betrag('foto'));
      K.gutschreiben(st, idx, K.betrag('finale'));
    }
    const A = K.albumStand(st); res.push({ anteil: A.voll / A.felder, kennen: A.kennen });
  }
  return { anteil: res.reduce((a, r) => a + r.anteil, 0) / laeufe, kennen: res.reduce((a, r) => a + r.kennen, 0) / laeufe };
}
test('Messgröße 3: Sammel-Fortschritt nach 10 Besuchen (Simulation)', (t) => {
  const K = load({ files: ALL, seed: 1 }).ctx.BSKunden;
  const r = simuliereAlbum(K);
  t.diagnostic(`nach 10 Besuchen: ${(r.anteil * 100).toFixed(1)} % der 185 Felder, ${r.kennen.toFixed(1)} von 37 Bären kennengelernt`);
  assert.ok(r.anteil > 0 && r.anteil < 0.2);
});

test('Fotos: 12 im Album (älteste fallen raus), ?album=4 = wie vorher', () => {
  for (const [search, max] of [['', 12], ['?album=4', 4]]) {
    const H = load({ files: ALL, seed: 2, search }), S = H.S;
    run(H, 2); go(H, 'wahl');
    for (let i = 0; i < 15; i++) { S.chooseBear(i % 30); go(H, 'foto'); tap(H, /Klick!/); }
    assert.equal(S.album.length, max); assert.equal(JSON.parse(H.store.bs_album).length, max);
    assert.equal(S.album[max - 1].fellIdx, 14 % 30);
  }
});

test('Album-Zustand: Menü-Knopf 📖 → Album zeichnet hoch + quer, Scrollen, Speicher beim Verlassen frei', () => {
  for (const [w, h] of [[412, 915], [915, 412]]) {
    const N = namen(load({ files: ALL, seed: 1 }));
    const store = JSON.stringify({ v: 1, b: { [N[0]]: { p: 45, n: 3, e: { duft: 1, station: 1, farbe: 1 }, k: 2 }, [N[1]]: { p: 100, n: 9 } } });
    const H = load({ files: ALL, seed: 3, width: w, height: h, storage: { bs_freunde: store } }), S = H.S, K = H.ctx.BSKunden;
    go(H, 'wahl'); for (let i = 0; i < 5; i++) { S.chooseBear(i); go(H, 'foto'); tap(H, /Klick!/); }
    go(H, 'menu'); run(H, 5);
    const ab = S.buttons.find((b) => b.nav === 'album'); assert.ok(ab && ab.r && ab.r.w >= 48 && ab.r.h >= 48);
    ab.onTap(); assert.equal(S.state, 'album');
    run(H, 60);
    assert.ok(K.albumMaxScroll > 0);
    K.albumZiehen(0, -400); assert.equal(K.albumScroll, Math.min(400, K.albumMaxScroll)); run(H, 5);
    K.albumZiehen(0, -1e6); assert.equal(K.albumScroll, K.albumMaxScroll); run(H, 5);
    tap(H, /🏠/); assert.equal(S.state, 'menu');
    assert.deepEqual([...H.ctx.__errors], []);
  }
});

test('Postkarte: nach dem Besuch beim nächsten Start; ab Herz 3 mit Geschenk (Tipp öffnet, zweiter Tipp legt weg)', () => {
  const N = namen(load({ files: ALL, seed: 1 }));
  // Besuch eines Bären mit 58 Punkten → Finale → Karte mit Geschenk gespeichert
  const H = load({ files: ALL, seed: 4, search: OHNE_GB, storage: { bs_freunde: JSON.stringify({ v: 1, b: { [N[6]]: { p: 58, n: 4 } } }) } });
  run(H, 2); go(H, 'wahl'); H.S.chooseBear(6); run(H, 90); H.S.startFinale();
  const ka = JSON.parse(H.store.bs_freunde).karte;
  assert.deepEqual(ka, { i: 6, h: 3, g: true });
  assert.equal(H.ctx.BSKunden.karte, null, 'nicht in derselben Sitzung');
  // nächster Start: Karte liegt über dem Menü, Tipps gehen an die Karte (nicht an die Knöpfe)
  const H2 = load({ files: ALL, seed: 5, storage: { bs_freunde: H.store.bs_freunde } }), K = H2.ctx.BSKunden;
  run(H2, 30);
  assert.ok(K.karteOffen());
  const ev = (x, y) => ({ clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', preventDefault() {} });
  const kk = H2.S.buttons.find((b) => /Kunde kommt/.test(b.label)), p = [kk.r.x + kk.r.w / 2, kk.r.y + kk.r.h / 2];
  H2.mainCanvas._l.pointerdown(ev(...p)); H2.mainCanvas._l.pointerup(ev(...p));
  assert.equal(H2.S.state, 'menu'); assert.ok(K.karte.offen);
  assert.equal(K.store.b[N[6]].k, 1); assert.equal(JSON.parse(H2.store.bs_freunde).karte, undefined);
  run(H2, 30);
  H2.mainCanvas._l.pointerdown(ev(...p)); H2.mainCanvas._l.pointerup(ev(...p));
  run(H2, 40); assert.equal(K.karte, null);
  H2.mainCanvas._l.pointerdown(ev(...p)); H2.mainCanvas._l.pointerup(ev(...p));
  assert.equal(H2.S.state, 'kunde', 'danach gehen die Knöpfe wieder');
  assert.deepEqual([...H2.ctx.__errors], []);
  // ohne Geschenk (Herz < 3): ein Tipp legt weg; ?karte=0: keine Karte
  const H3 = load({ files: ALL, seed: 6, storage: { bs_freunde: JSON.stringify({ v: 1, b: {}, karte: { i: 2, h: 1, g: false } }) } });
  run(H3, 5); assert.ok(H3.ctx.BSKunden.karteOffen()); H3.ctx.BSKunden.karteTipp(); run(H3, 40); assert.equal(H3.ctx.BSKunden.karte, null);
  const H4 = load({ files: ALL, seed: 6, search: '?karte=0', storage: { bs_freunde: JSON.stringify({ v: 1, b: {}, karte: { i: 2, h: 1, g: false } }) } });
  assert.equal(H4.ctx.BSKunden.karte, null);
});
