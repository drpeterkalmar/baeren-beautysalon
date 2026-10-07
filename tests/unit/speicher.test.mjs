// speicher.test.mjs — P2-6: Canvas-Speicherbudget (Sprite-Sätze LRU 5, Thumbnails je Größe, Ersatzraum, Schnappschuss).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, go, ALL, ROOT } from './harness.mjs';

// art.js mit Protokoll je Backvorgang (Modell@k) – nur für den Vergleich im Test
const ART = fs.readFileSync(path.join(ROOT, 'art.js'), 'utf8')
  .replace('Art.bakes=(Art.bakes||0)+1;', "Art.bakes=(Art.bakes||0)+1; (Art._log||(Art._log=[])).push(k);");
const art10 = ART.replace('SETS_MAX=5', 'SETS_MAX=10');   // früherer Stand zum Vergleich

test('Sprite-Sätze: nie mehr als 5 im Speicher', () => {
  const H = load({ seed: 1 });
  const { Art } = H;
  for (let i = 0; i < 12; i++) {
    for (const z of [1, 1.7, 2.6]) {
      H.g.setTransform(z, 0, 0, z, 0, 0);
      Art.drawBear(H.g, { fellIdx: i, acc: {}, lack: {}, sticker: [], makeup: null, schaum: 0, fluff: 0, tropfen: [] }, { w: 900, h: 600 });
      assert.ok(Art.setCount() <= 5, `${Art.setCount()} Sätze`);
    }
  }
  assert.equal(Art.setCount(), 5);
});

// typischer Ablauf über die echte game.js-Schleife: Menü → Wahl → 3 Bären mit Fotos → alle Stationen → Finale
function flow(sources) {
  const H = load({ files: ALL, seed: 3, sources });
  const S = H.S, run = (n) => { for (let i = 0; i < n; i++) H.frame(); };
  run(60);
  go(H, 'wahl'); run(120);                                   // Raster backt Kacheln (1 pro Bild)
  for (const idx of [4, 9, 2]) {
    S.chooseBear(idx); run(30);
    go(H, 'foto'); run(20);
    S.buttons.find((b) => /Klick!/.test(b.label)).onTap(); run(40);
  }
  for (const st of S.STATIONS.map((x) => x.id)) { go(H, st); run(15); }
  S.startFinale(); run(60 * 6);
  go(H, 'menu'); run(60);
  return { bakes: H.Art.bakes, gross: H.Art._log.filter((k) => k >= 1).length, mem: H.G.canvasMem(), errors: [...H.ctx.__errors] };
}

// Stand 07.10.: LRU 5 → 33–34 Backvorgänge (je nach Ablauflänge), LRU 10 → 31. Die zusätzlichen sind Mini-Sätze
// (k = 0,18) der Album-Vorschau in der Foto-Station (wenige KB, Backen < 1 ms); große Sätze (k ≥ 1, teuer) gleich viele.
test('Flow: LRU 5 backt keinen großen Satz mehr als vorher LRU 10', (t) => {
  const neu = flow({ 'art.js': ART }), alt = flow({ 'art.js': art10 });
  assert.deepEqual(neu.errors, []);
  t.diagnostic(`Backvorgänge gesamt: LRU5 ${neu.bakes}, LRU10 ${alt.bakes}; große (k ≥ 1): ${neu.gross} / ${alt.gross}`);
  assert.equal(neu.gross, alt.gross, `große Sätze LRU5 ${neu.gross} vs LRU10 ${alt.gross}`);
  assert.ok(neu.mem.sets <= 5);
});

test('Foto-Station mit 4 verschiedenen Album-Bären + eigenem Bären: kein Neu-Backen pro Bild', () => {
  const H = load({ files: ALL, seed: 5 });
  const S = H.S;
  for (const idx of [1, 5, 9, 13]) { S.chooseBear(idx); go(H, 'foto'); S.buttons.find((b) => /Klick!/.test(b.label)).onTap(); }
  S.chooseBear(20); go(H, 'foto');
  for (let i = 0; i < 90; i++) H.frame();                    // Kamera in Ruhe, alles gebacken
  const b0 = H.Art.bakes;
  for (let i = 0; i < 60; i++) H.frame();
  assert.equal(H.Art.bakes, b0, 'Sprite-Sätze werden laufend neu gebacken (LRU zu klein)');
});

test('Thumbnails: nur die zwei zuletzt benutzten Größen bleiben', () => {
  const H = load({ seed: 1 });
  const { Art } = H;
  for (let i = 0; i < 6; i++) Art.thumb(i, 120);
  Art.thumb(0, 160);
  assert.equal(Art.thumbCount(), 7);
  assert.ok(Art.thumbReady(3, 120));
  for (let i = 0; i < 6; i++) Art.thumb(i, 96);              // Drehung: neue Rastergröße
  assert.ok(!Art.thumbReady(3, 120), 'alte Größe noch im Speicher');
  assert.ok(Art.thumbReady(0, 160) && Art.thumbReady(5, 96));
  assert.equal(Art.thumbCount(), 7);
  // abwechselnd Raster und Wandbild: kein Neu-Backen
  const c = Art.thumb(2, 96); Art.thumb(0, 160);
  assert.equal(Art.thumb(2, 96), c);
});

test('Ersatz-Raum nach 3 s Kamera-Ruhe und Schnappschuss nach der Überblendung freigegeben', () => {
  const H = load({ files: ALL, seed: 2 });
  go(H, 'waschen');
  for (let i = 0; i < 120; i++) H.frame();
  go(H, 'zirkus');
  H.frame();
  assert.ok(H.G.canvasMem().snap > 1, 'Überblendung braucht den Schnappschuss');
  for (let i = 0; i < 60; i++) H.frame();                    // Fahrt (0,7 s) vorbei, Raum getauscht
  const m1 = H.G.canvasMem();
  assert.equal(m1.snap, 1, 'Schnappschuss nach der Überblendung nicht freigegeben');
  assert.ok(m1.spare > 1, 'alter Raum liegt als Ersatz bereit');
  for (let i = 0; i < 60 * 3.2; i++) H.frame();
  assert.equal(H.G.canvasMem().spare, 1, 'Ersatz-Raum nach 3 s Ruhe nicht freigegeben');
  // nächster Wechsel funktioniert weiter (Ersatz wird neu angelegt), Raum vollständig
  go(H, 'keks');
  for (let i = 0; i < 90; i++) H.frame();
  const m2 = H.G.canvasMem();
  assert.ok(m2.room > 1000);
  assert.deepEqual([...H.ctx.__errors], []);
});
