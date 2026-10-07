// album.test.mjs — P1-1: Album-Fotos sind echte Schnappschüsse (keine geteilten Objekte mit dem Bären).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, clone } from './harness.mjs';

const tap = (H, re) => { const b = H.S.buttons.find((x) => re.test(x.label || '')); assert.ok(b, 'Knopf ' + re); b.onTap(); };
const klick = (H) => { go(H, 'foto'); tap(H, /Klick!/); };
const gespeichert = (H) => JSON.parse(H.store.bs_album);

test('Foto → Kralle lackieren → Album-Eintrag bleibt unverändert (Speicher und Vorschau)', () => {
  const H = load({ seed: 1 });
  H.S.chooseBear(2);
  H.S.baer.lack.L0 = '#e91e63';
  H.S.baer.makeup.gp.push({ dx: 1, dy: 2 });
  klick(H);
  const vorher = clone(H.S.album[0]);
  // weiter stylen: Kralle lackieren (über die echte Tipp-Logik), Glitzer, Sticker
  go(H, 'pfoten'); H.S.lackColor = '#ffffff';
  H.S.draw(H.g);
  const s = Math.min(H.S.VW, H.S.VH) / 420;
  H.S.tapBear(H.S.VW * 0.5 + (55 + 16) * s, H.S.VH * 0.58 + 175 * s);    // Kralle R2
  assert.equal(H.S.baer.lack.R2, '#ffffff', 'Tipp hat nicht lackiert');
  H.S.baer.makeup.gp.push({ dx: 5, dy: 6 });
  H.S.baer.sticker.push({ ziel: 'L1', typ: 'herz', farbe: '#e91e63' });
  assert.deepEqual(clone(H.S.album[0]), vorher, 'Album-Eintrag hat sich mitverändert');
  // nächstes Foto schreibt bs_album neu → erster Eintrag weiter wie zum Fotozeitpunkt
  klick(H);
  assert.deepEqual(gespeichert(H)[0], vorher);
  assert.equal(gespeichert(H)[1].lack.R2, '#ffffff');
});

test('Album-Kachel laden → Hut setzen → zweites Foto: erster Eintrag hat weiter hut:null', () => {
  const H = load({ seed: 1 });
  H.S.chooseBear(1);
  klick(H);
  assert.equal(gespeichert(H)[0].acc.hut, null);
  go(H, 'foto');
  const box = H.S.REG.foto.hit().album[0];        // Kachel-Rechtecke aus dem Zustand (stations/foto.js)
  assert.ok(box, 'keine Album-Kachel');
  assert.equal(H.S.tapBear(box.x + box.w / 2, box.y + box.h / 2), true);
  assert.notEqual(H.S.baer.acc, H.S.album[0].acc, 'Bär teilt acc mit dem Album');
  assert.notEqual(H.S.baer.lack, H.S.album[0].lack, 'Bär teilt lack mit dem Album');
  assert.notEqual(H.S.baer.makeup, H.S.album[0].makeup, 'Bär teilt makeup mit dem Album');
  assert.notEqual(H.S.baer.sticker, H.S.album[0].sticker, 'Bär teilt sticker mit dem Album');
  // Hut über die Schmücken-Station aufsetzen
  go(H, 'schmuecken'); tap(H, /Hut/);
  assert.equal(H.S.baer.acc.hut, 0);
  assert.equal(H.S.album[0].acc.hut, null);
  klick(H);
  const alb = gespeichert(H);
  assert.equal(alb.length, 2);
  assert.equal(alb[0].acc.hut, null, 'erster Schnappschuss wurde mit Hut überschrieben');
  assert.equal(alb[1].acc.hut, 0);
});

test('Album mit kaputtem Speicher (bs_album="{}") → „Klick!“ wirft nicht', () => {
  for (const bad of ['{}', '"x"', '7', 'null']) {
    const H = load({ seed: 1, storage: { bs_album: bad } });
    assert.ok(Array.isArray(H.S.album));
    klick(H);
    assert.equal(gespeichert(H).length, 1);
  }
});

test('Album hält höchstens 4 Fotos, das älteste fällt raus', () => {
  const H = load({ seed: 1 });
  for (let i = 0; i < 6; i++) { H.S.chooseBear(i); klick(H); }
  const alb = gespeichert(H);
  assert.equal(alb.length, 4);
  assert.deepEqual(alb.map((a) => a.fellIdx), [2, 3, 4, 5]);
});
