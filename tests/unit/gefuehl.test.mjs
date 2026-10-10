// gefuehl.test.mjs — r22 E4: Kitzeln, Haptik (Messgröße 6), Mini-Pokal, Tageszeit, Gast des Tages (kunden.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, ALL } from './harness.mjs';

const OHNE_GB = '?tag=20260130';
const run = (H, n) => { for (let i = 0; i < n; i++) H.frame(); };
const tap = (H, re) => { const b = H.S.buttons.find((x) => re.test(x.label || '')); assert.ok(b, 'Knopf ' + re); b.onTap(); };
const ev = (x, y) => ({ clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', preventDefault() {} });

test('Kitzeln (rein): 3 Tipper in ≤ 1,2 s lösen aus, danach 2 s Pause; langsames Tippen nie', () => {
  const K = load({ files: ALL, seed: 1 }).ctx.BSKunden;
  let z = {};
  assert.deepEqual([0, 0.4, 0.8].map((t) => K.kitzelSchritt(z, t)), [false, false, true]);
  assert.deepEqual([1.0, 1.2, 1.4, 2.0, 2.3, 2.6, 2.85].map((t) => K.kitzelSchritt(z, t)), [false, false, false, false, false, false, true]);
  z = {}; assert.ok([0, 0.7, 1.4, 2.1, 2.8, 3.5].every((t) => !K.kitzelSchritt(z, t)));
});

test('Kitzeln im Spiel: drei schnelle Tipper auf den Bären → Kichern + Hüpfer; ?kitzel=0 → nichts', () => {
  for (const [search, erwartet] of [['', true], ['?kitzel=0', false]]) {
    const H = load({ files: ALL, seed: 2, search }), S = H.S, K = H.ctx.BSKunden;
    run(H, 3); go(H, 'wahl'); S.chooseBear(4); go(H, 'schneiden'); run(H, 60);
    const p = H.G.worldToScreen(450, 230);
    let ausgeloest = false; const orig = S.kitzel; S.kitzel = function () { const r = orig.apply(this, arguments); if (r) ausgeloest = true; return r; };
    for (let i = 0; i < 3; i++) { H.mainCanvas._l.pointerdown(ev(p[0], p[1])); H.mainCanvas._l.pointerup(ev(p[0], p[1])); run(H, 15); }
    assert.equal(ausgeloest, erwartet, search);
    assert.deepEqual([...H.ctx.__errors], []);
  }
});

test('Haptik (rein): Muster ≥ 25 ms, Abstand ≥ 1,5 s, höchstens 4 je Besuch, ?haptik=0 = aus', () => {
  const K = load({ files: ALL, seed: 1 }).ctx.BSKunden;
  for (const m of Object.values(K.P.haptikMuster)) for (const v of [].concat(m)) assert.ok(v >= 25, String(v));
  const z = {};
  assert.equal(K.haptikMuster(z, 'herz', 0), K.P.haptikMuster.herz);
  assert.equal(K.haptikMuster(z, 'tada', 1.0), null);
  assert.equal(K.haptikMuster(z, 'tada', 1.5), 35);
  assert.equal(K.haptikMuster(z, 'geschenk', 3.0), 40);
  assert.ok(K.haptikMuster(z, 'herz', 4.5)); assert.equal(K.haptikMuster(z, 'herz', 9), null, 'höchstens 4');
  assert.equal(K.haptikMuster({}, 'unbekannt', 0), null);
  assert.equal(K.haptikMuster({}, 'tada', 0, K.liesParameter('?haptik=0')), null);
});

test('Messgröße 6: ein ganzer Besuch mit Geschenk, neuem Herz und Finale vibriert ≤ 4×, Abstand ≥ 1,5 s, kein Puls < 25 ms', () => {
  const N = load({ files: ALL, seed: 1 }).Art.MODELS.map((m) => m.name);
  const vib = [];
  const H = load({ files: ALL, seed: 3, search: OHNE_GB, storage: { bs_freunde: JSON.stringify({ v: 1, b: { [N[8]]: { p: 74, n: 6 } } }) },
    globals: { navigator: { userAgent: 'node', vibrate: (p) => { vib.push([H.clock.ms, p]); return true; } } } });
  const S = H.S, K = H.ctx.BSKunden;
  run(H, 3); go(H, 'wahl'); S.chooseBear(8); run(H, 120);
  const gp = K.geschenkPos(); S.tapBear(gp[0], gp[1]); run(H, 30);                 // Geschenk
  for (const id of K.besuch.wuensche) { go(H, id); K.aktion(); run(H, 40); }       // Wünsche → neues Herz (80)
  S.startFinale(); run(H, 60 * 7);                                                 // TA-DA
  assert.ok(vib.length >= 2 && vib.length <= 4, JSON.stringify(vib));
  for (let i = 1; i < vib.length; i++) assert.ok(vib[i][0] - vib[i - 1][0] >= 1500, 'Abstand ' + (vib[i][0] - vib[i - 1][0]));
  for (const [, p] of vib) for (const v of [].concat(p)) assert.ok(v >= 25);
});

test('Pokal: Gruppe mit den meisten Handlungen; nichts getan → erster Pokal; im Finale gesetzt, ?pokal=0 → keiner', () => {
  const H = load({ files: ALL, seed: 4, search: OHNE_GB }), S = H.S, K = H.ctx.BSKunden;
  assert.equal(K.POKALE.length, 6);
  const alle = K.POKALE.flatMap((p) => p.st); assert.equal(new Set(alle).size, 23);   // jede Wunsch-Station in genau einer Gruppe
  for (const id of K.WUNSCH_IDS) assert.ok(alle.includes(id), id);
  assert.equal(K.pokalWahl({}).id, 'schaum');
  assert.equal(K.pokalWahl({ eis: 3, keks: 2, waschen: 4 }).id, 'nasch');
  assert.equal(K.pokalWahl({ foto: 2, disco: 2 }).id, 'party');
  run(H, 3); go(H, 'wahl'); S.chooseBear(2); run(H, 90);
  go(H, 'disco'); for (let i = 0; i < 5; i++) { K.aktion(); H.tick(300); }
  S.startFinale(); assert.equal(K.besuch.pokal.id, 'party');
  run(H, 60 * 6); assert.deepEqual([...H.ctx.__errors], []);
  const A = load({ files: ALL, seed: 4, search: '?pokal=0' }); go(A, 'wahl'); A.S.chooseBear(2); A.S.startFinale();
  assert.equal(A.ctx.BSKunden.besuch.pokal, null);
});

test('Tageszeit: passend nach der Uhr, ?zeit= erzwingt; Tag ohne Farbschleier (wie vorher)', () => {
  const K = load({ files: ALL, seed: 1 }).ctx.BSKunden;
  assert.deepEqual([6, 7, 12, 16, 17, 19, 20, 23, 0].map((h) => K.zeitStufe('passend', h)), ['nacht', 'tag', 'tag', 'tag', 'abend', 'abend', 'nacht', 'nacht', 'nacht']);
  assert.equal(K.zeitStufe('abend', 12), 'abend'); assert.equal(K.ZEIT_TINT.tag, null);
  assert.equal(K.liesParameter('?zeit=quatsch').zeit, 'passend');
  for (const z of ['tag', 'abend', 'nacht']) {
    const H = load({ files: ALL, seed: 1, search: '?zeit=' + z });
    run(H, 30); assert.equal(!!H.S.zeitTint(), z !== 'tag'); assert.deepEqual([...H.ctx.__errors], []);
  }
});

test('Gast des Tages: fest je Datum, erster Kunde des Tages (ohne Geburtstagskind), Extra-Stempel, einmal am Tag', () => {
  const H0 = load({ files: ALL, seed: 1 }), K0 = H0.ctx.BSKunden;
  // ein Datum ohne Geburtstagskind suchen
  let tag = null; for (let d = 1; d <= 28 && !tag; d++) { const key = '202611' + String(d).padStart(2, '0'); const heute = { m: 11, d, key };
    if (!H0.Art.MODELS.some((_, i) => K0.istGeburtstag(i, heute))) tag = key; }
  const H = load({ files: ALL, seed: 5, search: '?tag=' + tag }), S = H.S, K = H.ctx.BSKunden;
  const tg = K.tagesgast(); assert.equal(tg, K.tagesgast()); assert.ok(tg >= 0 && tg < 37);
  run(H, 3); go(H, 'menu'); tap(H, /Kunde kommt/);
  assert.equal(K.besuch.idx, tg); assert.ok(K.besuch.tagesgast);
  assert.equal(K.store.b[H.Art.MODELS[tg].name].t, 1); assert.equal(K.store.tg, tag);
  run(H, 120); S.startFinale(); tap(H, /Nächster Kunde/);
  assert.ok(!K.besuch.tagesgast);
  assert.deepEqual([...H.ctx.__errors], []);
});
