// freunde.test.mjs — r22 E2: Freundschaft je Bär (kunden.js) – Herzen, Punkte nur Zuwachs, Speicher robust, Vorlieben,
// Geburtstag, Schwellen (Winken, Geschenk, beste Freunde) und Messgröße 2 (Herzen nach Besuchen, Simulation).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, ALL } from './harness.mjs';

// fester Tag ohne Geburtstag (Tag 30 kommt bei den Bären nie vor), damit Punkte-Rechnungen genau sind
const OHNE_GB = '?tag=20260130';
const run = (H, n) => { for (let i = 0; i < n; i++) H.frame(); };
const tap = (H, re) => { const b = H.S.buttons.find((x) => re.test(x.label || '')); assert.ok(b, 'Knopf ' + re); b.onTap(); };

test('Herzen: 20 Punkte je Herz, höchstens 5; angefangenes Herz als Anteil', () => {
  const K = load({ files: ALL, seed: 1 }).ctx.BSKunden;
  assert.deepEqual([0, 19, 20, 59, 60, 99, 100, 500, -5, NaN].map((p) => K.herzen(p)), [0, 0, 1, 2, 3, 4, 5, 5, 0, 0]);
  assert.equal(K.herzRest(30), 0.5); assert.equal(K.herzRest(100), 0); assert.equal(K.deckel(), 100);
  const P = K.liesParameter('?herz=10'); assert.equal(K.herzen(25, P), 2);
});

test('Messgröße 4: kein Ereignis gibt je weniger als 0 Punkte, Gutschrift nie negativ, Deckel 100', () => {
  const K = load({ files: ALL, seed: 1 }).ctx.BSKunden;
  for (const art of ['besuch', 'wunsch', 'foto', 'finale', 'entdeckt', 'gibtsnicht'])
    for (const ctx of [{}, { liebling: true }, { geburtstag: true }, { liebling: true, geburtstag: true }]) assert.ok(K.betrag(art, ctx) >= 0, art);
  assert.equal(K.betrag('wunsch', {}), 3); assert.equal(K.betrag('wunsch', { liebling: true }), 6); assert.equal(K.betrag('besuch', { geburtstag: true }), 6);
  const st = K.leer();
  for (const plus of [5, -10, -1e9, NaN, 'x', 3.4, 1e9]) {
    const r = K.gutschreiben(st, 2, plus);
    assert.ok(r.plus >= 0 && r.nachher >= r.vorher && r.nachher <= 100, JSON.stringify(r));
  }
  assert.equal(K.punkteVon(2, st), 100);
});

test('Messgröße 7: kaputter/alter/leerer Speicher → leer, nie Absturz; gültige Einträge bleiben', () => {
  const K = load({ files: ALL, seed: 1 }).ctx.BSKunden;
  for (const t of [null, '', '{', 'null', '[]', '42', '{"v":0,"b":{}}', '{"v":1,"b":[]}', '{"v":1}', '"text"'])
    assert.deepEqual(JSON.parse(JSON.stringify(K.lade(t))), { v: 1, b: {} }, String(t));
  const o = K.lade(JSON.stringify({ v: 1, gb: '20261010', b: { Panda: { p: 45, n: 3, e: { duft: 1, xx: 1 } }, Unbekannt: { p: 50 }, Teddy: { p: 'x', n: -3 }, Grizzly: { p: 999, n: 2.7 }, 'Eisbär': null } }));
  assert.deepEqual(JSON.parse(JSON.stringify(o)), { v: 1, gb: '20261010', b: { Panda: { p: 45, n: 3, e: { duft: 1 } }, Teddy: { p: 0, n: 0, e: {} }, Grizzly: { p: 100, n: 2, e: {} } } });
  // Spiel startet mit kaputtem Speicher, Bär ohne Herzen
  for (const t of ['{', '[]', '{"v":1,"b":{"Panda":"kaputt"}}', '{"v":2,"b":{}}', '']) {
    const H = load({ files: ALL, seed: 1, storage: { bs_freunde: t } });
    run(H, 3); go(H, 'menu'); tap(H, /Kunde kommt/); run(H, 30);
    assert.equal(H.ctx.BSKunden.herzVon(H.ctx.BSKunden.besuch.idx), 0);
    assert.deepEqual([...H.ctx.__errors], []);
  }
});

test('Vorlieben und Geburtstag: fest je Modell, gültige Werte', () => {
  const H = load({ files: ALL, seed: 1 }), K = H.ctx.BSKunden, Art = H.Art;
  const gb = new Set();
  for (let i = 0; i < Art.MODELS.length; i++) {
    const v = K.vorlieben(i), v2 = K.vorlieben(i), g = K.geburtstagVon(i);
    assert.deepEqual(v, v2);
    assert.ok(K.WUNSCH_IDS.includes(v.station) && v.duft >= 0 && v.duft < 4 && Art.HAAR.includes(v.farbe));
    assert.ok(g.m >= 1 && g.m <= 12 && g.d >= 1 && g.d <= 28);
    gb.add(g.m * 100 + g.d);
  }
  assert.ok(gb.size >= 30, 'Geburtstage gut verteilt: ' + gb.size);
  const g0 = K.geburtstagVon(0);
  assert.ok(K.istGeburtstag(0, { m: g0.m, d: g0.d })); assert.ok(!K.istGeburtstag(0, { m: g0.m, d: g0.d === 28 ? 1 : g0.d + 1 }));
});

// Messgröße 2: Herzen nach Besuchen desselben Bären (Startwerte). Ein Besuch = Besuch + 2 Wünsche (ab Herz 3: 3) +
// Finale; Foto in jedem zweiten Besuch; Lieblings-Wunsch in jedem zweiten Besuch (×2). Ziel: Herz 1 nach 2, Herz 3 nach 5,
// Herz 5 nach 8–10 Besuchen.
export function simuliereHerzen(K, besuche = 12) {
  const st = K.leer(), out = [];
  for (let b = 1; b <= besuche; b++) {
    const herz = K.herzen(K.punkteVon(0, st));
    const n = Math.min(3, K.P.wunsch + (herz >= K.P.wunschPlusAb ? 1 : 0));
    K.gutschreiben(st, 0, K.betrag('besuch'));
    for (let w = 0; w < n; w++) K.gutschreiben(st, 0, K.betrag('wunsch', { liebling: w === 0 && b % 2 === 0 }));
    if (b % 2 === 1) K.gutschreiben(st, 0, K.betrag('foto'));
    K.gutschreiben(st, 0, K.betrag('finale'));
    out.push(K.herzen(K.punkteVon(0, st)));
  }
  return out;
}
test('Messgröße 2: Herz 1 nach 2 Besuchen, Herz 3 nach 5, Herz 5 nach 8–10 (Simulation mit Startwerten)', (t) => {
  const K = load({ files: ALL, seed: 1 }).ctx.BSKunden;
  const h = simuliereHerzen(K);
  t.diagnostic('Herzen nach Besuch 1…12: ' + h.join(' '));
  assert.ok(h[1] >= 1 && h[0] < 1, 'Herz 1 nach 2');
  assert.ok(h[4] >= 3 && h[3] < 3, 'Herz 3 nach 5');
  const voll = h.indexOf(5) + 1; assert.ok(voll >= 8 && voll <= 10, 'Herz 5 nach ' + voll);
});

test('Besuch im Spiel: Punkte für Besuch, Wunsch, Foto (1×), Finale; Speicher wird geschrieben', () => {
  const H = load({ files: ALL, seed: 3, search: OHNE_GB }), S = H.S, K = H.ctx.BSKunden;
  run(H, 3); go(H, 'menu'); tap(H, /Kunde kommt/); run(H, 90);
  const B = K.besuch, idx = B.idx;
  assert.equal(K.punkteVon(idx), 2);
  go(H, B.wuensche[0]); K.aktion();
  const lieb = B.wuensche[0] === B.liebling;
  assert.equal(K.punkteVon(idx), 2 + (lieb ? 6 : 3));
  const p1 = K.punkteVon(idx);
  go(H, 'foto'); tap(H, /Klick!/); tap(H, /Klick!/);
  assert.equal(K.punkteVon(idx), p1 + 2 + (B.wuensche.includes('foto') ? (B.liebling === 'foto' ? 6 : 3) : 0));
  const p2 = K.punkteVon(idx);
  S.startFinale();
  assert.equal(K.punkteVon(idx), p2 + 2);
  const gesp = JSON.parse(H.store.bs_freunde);
  assert.equal(gesp.v, 1); assert.equal(gesp.b[H.Art.MODELS[idx].name].p, p2 + 2); assert.equal(gesp.b[H.Art.MODELS[idx].name].n, 1);
});

test('Schwellen: Herz 1 winkt, Herz 3 → 3 Wünsche + Geschenk (Accessoire), Herz 5 → rennt herein', () => {
  const name = (H, i) => H.Art.MODELS[i].name;
  for (const [p, erwartet] of [[25, { winkt: true, n: 2, geschenk: false, renner: false }], [65, { winkt: true, n: 3, geschenk: true, renner: false }], [100, { winkt: true, n: 3, geschenk: true, renner: true }]]) {
    const H0 = load({ files: ALL, seed: 4 });
    const store = JSON.stringify({ v: 1, b: { [name(H0, 7)]: { p, n: 4 } } });
    const H = load({ files: ALL, seed: 4, storage: { bs_freunde: store } }), S = H.S, K = H.ctx.BSKunden;
    run(H, 3); go(H, 'wahl'); S.chooseBear(7);
    const B = K.besuch;
    assert.equal(B.wuensche.length, erwartet.n, 'Wünsche bei ' + p);
    assert.equal(!!B.geschenk, erwartet.geschenk); assert.equal(B.renner, erwartet.renner);
    run(H, erwartet.renner ? 50 : 76);
    const env = {}; S.poseEnv(env, 'kunde'); assert.equal(!!env.wave, erwartet.winkt, 'winkt bei ' + p);
    if (B.geschenk) {
      const acc0 = Object.values(S.baer.acc).filter((v) => v !== null && v !== undefined).length;
      const gp = K.geschenkPos(); S.tapBear(gp[0], gp[1]);
      assert.ok(B.geschenk.offen);
      assert.equal(Object.values(S.baer.acc).filter((v) => v !== null && v !== undefined).length, acc0 + 1);
    }
    run(H, 60); assert.deepEqual([...H.ctx.__errors], []);
  }
});

test('Neues Herz → Herz-Moment; Stammkunden kommen wieder', () => {
  const H0 = load({ files: ALL, seed: 5 });
  const store = JSON.stringify({ v: 1, b: { [H0.Art.MODELS[3].name]: { p: 18, n: 1 } } });
  const H = load({ files: ALL, seed: 5, storage: { bs_freunde: store }, search: OHNE_GB }), S = H.S, K = H.ctx.BSKunden;
  run(H, 3); go(H, 'wahl'); S.chooseBear(3); run(H, 30);           // +2 → 20 = Herz 1, Moment erst nach dem Hereinlaufen
  assert.equal(K.herzVon(3), 1); assert.equal(K.moment, null); assert.equal(K.besuch.herzNeu, 1);
  run(H, 90); assert.ok(K.moment); assert.equal(K.besuch.herzNeu, 0);
  run(H, 130); assert.equal(K.moment, null);
  // Stammkunden-Anteil: bekannter Bär (Herz < 5) kommt bei P.wieder = 0,5 etwa jedes zweite Mal
  const rnd = K.zufall(9); let wieder = 0;
  for (let i = 0; i < 400; i++) if (K.waehleKundeMit(rnd, [], K.store) === 3) wieder++;
  assert.ok(wieder > 160 && wieder < 260, 'wieder ' + wieder);
});

test('Geburtstag (?tag=): Geburtstagskind kommt zuerst, Geburtstags-Station vorn, ×3 Punkte, einmal am Tag', () => {
  const H0 = load({ files: ALL, seed: 6 }), K0 = H0.ctx.BSKunden;
  const g = K0.geburtstagVon(10), tag = '2026' + String(g.m).padStart(2, '0') + String(g.d).padStart(2, '0');
  const H = load({ files: ALL, seed: 6, search: '?tag=' + tag }), S = H.S, K = H.ctx.BSKunden;
  const kind = K.geburtstagskind(); assert.ok(K.istGeburtstag(kind));
  run(H, 3); go(H, 'menu'); tap(H, /Kunde kommt/);
  const B = K.besuch;
  assert.equal(B.idx, kind); assert.ok(B.geburtstag); assert.equal(B.wuensche[0], 'geburtstag');
  assert.equal(K.punkteVon(kind), 6);
  assert.equal(K.geburtstagskind(), null, 'nur einmal am Tag');
});

test('Lieblingsduft entdecken: Jubel + Punkte, einmal je Besuch, im Speicher vermerkt', () => {
  const H = load({ files: ALL, seed: 7, search: OHNE_GB }), S = H.S, K = H.ctx.BSKunden;
  run(H, 3); go(H, 'wahl'); S.chooseBear(5); run(H, 90);
  const p0 = K.punkteVon(5), v = K.vorlieben(5);
  go(H, 'parfum'); S.baer.duft = (v.duft + 1) % 4; run(H, 3); assert.ok(K.punkteVon(5) - p0 <= (K.besuch.wuensche.includes('parfum') ? 6 : 0));
  const p1 = K.punkteVon(5);
  S.baer.duft = v.duft; run(H, 3);
  assert.equal(K.punkteVon(5), p1 + 2); assert.ok(K.besuch.entdeckt.duft);
  S.baer.duft = null; run(H, 2); S.baer.duft = v.duft; run(H, 2);
  assert.equal(K.punkteVon(5), p1 + 2, 'nur einmal');
  assert.equal(JSON.parse(H.store.bs_freunde).b[H.Art.MODELS[5].name].e.duft, 1);
});

test('?freund=0: keine Punkte, kein Speicher, keine Herzen; Wünsche gehen trotzdem', () => {
  const H = load({ files: ALL, seed: 8, search: '?freund=0' }), S = H.S, K = H.ctx.BSKunden;
  run(H, 3); go(H, 'menu'); tap(H, /Kunde kommt/); run(H, 90);
  go(H, K.besuch.wuensche[0]); K.aktion(); S.startFinale();
  assert.ok(K.besuch.erfuellt[K.besuch.wuensche[0]]);
  assert.equal(H.store.bs_freunde, undefined); assert.equal(K.besuch.geschenk, null);
});
