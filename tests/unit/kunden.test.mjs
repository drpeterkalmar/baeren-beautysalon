// kunden.test.mjs — r22 Kundenbesuche (kunden.js): Parameter, Wunsch-/Kunden-Auswahl, Ablauf in der echten Spielschleife.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go, ALL } from './harness.mjs';

const labels = (H) => H.S.buttons.map((b) => b.label);
const tap = (H, re) => { const b = H.S.buttons.find((x) => re.test(x.label || '')); assert.ok(b, 'Knopf ' + re + ' fehlt: ' + labels(H).join(' | ')); b.onTap(); };
const run = (H, n) => { for (let i = 0; i < n; i++) H.frame(); };

test('Parametergruppe: Standard, Regler, Grenzen', () => {
  const H = load({ files: ALL, seed: 1 });
  const K = H.ctx.BSKunden;
  const P0 = K.liesParameter('');
  assert.equal(P0.kunden, 1); assert.equal(P0.wunsch, 2); assert.equal(P0.einlauf, 1.2);
  assert.equal(P0.freund, 1); assert.equal(P0.herz, 20); assert.equal(P0.herzen, 5); assert.equal(P0.vorliebe, 2); assert.equal(P0.geburtstag, 3);
  assert.equal(P0.tag, null); assert.equal(K.liesParameter('?tag=20261224').tag, '20261224'); assert.equal(K.liesParameter('?tag=2026').tag, null);
  assert.equal(K.liesParameter('?freund=0').freund, 0); assert.equal(K.liesParameter('?herz=0').herz, 1);
  assert.equal(K.liesParameter('?kunden=0').kunden, 0);
  assert.equal(K.liesParameter('?x=1&wunsch=3').wunsch, 3);
  assert.equal(K.liesParameter('?wunsch=9').wunsch, 3);
  assert.equal(K.liesParameter('?wunsch=abc').wunsch, 2);
  assert.equal(K.P.kunden, 1);
});

test('Wünsche: n verschiedene Stationen, nie „Fertig!“, „zuerst“ steht vorn', () => {
  const H = load({ files: ALL, seed: 1 });
  const K = H.ctx.BSKunden, rnd = K.zufall(7);
  assert.equal(K.WUNSCH_IDS.length, 23);
  for (let i = 0; i < 300; i++) {
    const w = K.wuensche(1 + (i % 3), rnd);
    assert.equal(w.length, 1 + (i % 3));
    assert.equal(new Set(w).size, w.length);
    assert.ok(!w.includes('finish'));
  }
  const g = K.wuensche(3, rnd, { zuerst: 'geburtstag' });
  assert.equal(g[0], 'geburtstag'); assert.equal(new Set(g).size, 3);
});

test('Kunde: alle 37 Modelle möglich (Album 37 × 5), nicht einer der letzten zwei', () => {
  const H = load({ files: ALL, seed: 1 });
  const K = H.ctx.BSKunden, rnd = K.zufall(3), seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const k = K.waehleKunde(rnd, [4, 9]); seen.add(k);
    assert.ok(k >= 0 && k < H.Art.MODELS.length && k !== 4 && k !== 9, String(k));
  }
  assert.equal(seen.size, H.Art.MODELS.length - 2);
});

test('Menü (Standard): „Kunde kommt!“ zuerst, „Bären einladen“ bleibt; ?kunden=0 = altes Menü', () => {
  const H = load({ files: ALL, seed: 1 });
  go(H, 'menu');
  assert.match(labels(H).filter((l) => !/🔊|🔇/.test(l))[0], /Kunde kommt/);
  assert.ok(labels(H).some((l) => /Bären einladen/.test(l)));
  tap(H, /Bären einladen/); assert.equal(H.S.state, 'wahl');
  const A = load({ files: ALL, seed: 1, search: '?kunden=0' });
  go(A, 'menu');
  assert.ok(labels(A).some((l) => /Los geht/.test(l)));
  assert.ok(!labels(A).some((l) => /Kunde/.test(l)));
});

test('Besuch: Glocke, Hereinlaufen (Tipp überspringt), Wunsch-Knöpfe, Häkchen beim Erfüllen', () => {
  const H = load({ files: ALL, seed: 2 });
  const S = H.S, K = H.ctx.BSKunden;
  run(H, 5); go(H, 'menu'); tap(H, /Kunde kommt/);
  assert.equal(S.state, 'kunde');
  const B = K.besuch;
  assert.equal(B.wuensche.length, 2);
  assert.equal(S.baer.fellIdx, B.idx);
  // Tipp während des Hereinlaufens überspringt es
  run(H, 10); assert.ok(B.t < K.P.einlauf);
  S.tapBear(450, 300); assert.ok(B.t >= K.P.einlauf);
  run(H, 40); assert.ok(B.da);
  // je Wunsch ein großer Knopf; Tippen führt in die Station, noch nichts erfüllt
  const wk = S.buttons.filter((b) => b.wunsch);
  assert.deepEqual(wk.map((b) => b.wunsch), B.wuensche);
  wk[0].onTap();
  assert.equal(S.state, B.wuensche[0]);
  assert.ok(!B.erfuellt[B.wuensche[0]]);
  // erste Handlung in der Station (irgendein Werkzeug-Knopf oder Tippen) → erfüllt
  const werkzeug = S.buttons.find((b) => !b.nav && !b.tab && !b.hold);
  if (werkzeug) werkzeug.onTap(); else S.tapBear(450, 380);
  if (!B.erfuellt[B.wuensche[0]]) K.aktion();
  assert.ok(B.erfuellt[B.wuensche[0]], 'Wunsch nicht erfüllt in ' + S.state);
  assert.ok(!K.alleErfuellt());
  // Handlung in einer Station, die nicht gewünscht ist, erfüllt nichts
  const andere = S.STATIONS.map((s) => s.id).find((id) => !B.wuensche.includes(id) && id !== 'finish');
  go(H, andere); K.aktion();
  assert.equal(Object.keys(B.erfuellt).length, 1);
  go(H, B.wuensche[1]); K.aktion();
  assert.ok(K.alleErfuellt());
  run(H, 30);
  assert.deepEqual([...H.ctx.__errors], []);
});

test('Wunsch-Leiste und Reiter-Marken zeichnen ohne Fehler (hoch + quer)', () => {
  for (const [w, h] of [[412, 915], [915, 412]]) {
    const H = load({ files: ALL, seed: 4, width: w, height: h });
    const S = H.S, K = H.ctx.BSKunden;
    run(H, 3); go(H, 'menu'); tap(H, /Kunde kommt/); run(H, 90);
    go(H, K.besuch.wuensche[0]); K.aktion(); run(H, 30);
    assert.deepEqual([...H.ctx.__errors], []);
  }
});

test('🏠 mitten im Besuch → „Weiter“ zeigt die Wunsch-Blase wieder (ohne Hereinlaufen)', () => {
  const H = load({ files: ALL, seed: 5 });
  const S = H.S, K = H.ctx.BSKunden;
  go(H, 'menu'); tap(H, /Kunde kommt/); run(H, 90);
  const idx = K.besuch.idx;
  go(H, K.besuch.wuensche[0]); K.aktion();
  tap(H, /🏠/); assert.equal(S.state, 'menu');
  tap(H, /Weiter mit meinem Bären/);
  assert.equal(S.state, 'kunde');
  assert.equal(S.baer.fellIdx, idx);
  assert.ok(K.besuch.t >= K.P.einlauf);
  assert.equal(Object.keys(K.besuch.erfuellt).length, 1);
});

test('Finale im Besuch: „Nächster Kunde“ und „Nochmal“ (gleicher Bär, neue Wünsche)', () => {
  const H = load({ files: ALL, seed: 6 });
  const S = H.S, K = H.ctx.BSKunden;
  go(H, 'menu'); tap(H, /Kunde kommt/); run(H, 90);
  const idx = K.besuch.idx;
  S.startFinale(); assert.ok(K.besuch.fertig);
  assert.ok(labels(H).some((l) => /Nächster Kunde/.test(l)));
  tap(H, /Nochmal/);
  assert.equal(S.state, 'kunde'); assert.equal(K.besuch.idx, idx); assert.ok(!K.besuch.fertig);
  S.startFinale(); tap(H, /Nächster Kunde/);
  assert.equal(S.state, 'kunde'); assert.notEqual(K.besuch.idx, idx);
});

test('„Bären einladen“: der gewählte Bär kommt als Kunde mit Wünschen; ?kunden=0 → direkt zum Waschen ohne Wünsche', () => {
  const H = load({ files: ALL, seed: 7 });
  const S = H.S, K = H.ctx.BSKunden;
  go(H, 'wahl'); S.chooseBear(3);
  assert.equal(S.state, 'kunde'); assert.equal(K.besuch.idx, 3); assert.equal(S.baer.fellIdx, 3);
  S.chooseBear(H.Art.MODELS.length - 1);                       // Überraschung: irgendein echter Bär
  assert.ok(K.besuch.idx < H.Art.MODELS.length - 1);
  const A = load({ files: ALL, seed: 7, search: '?kunden=0' });
  go(A, 'wahl'); A.S.chooseBear(3);
  assert.equal(A.S.state, 'waschen');
  assert.ok(A.ctx.BSKunden.besuch.frei); assert.deepEqual([...A.ctx.BSKunden.besuch.wuensche], []);   // Freundschaft zählt trotzdem
  assert.equal(A.ctx.BSKunden.aktion(), false);
  const V = load({ files: ALL, seed: 7, search: '?kunden=0&freund=0' });
  go(V, 'wahl'); V.S.chooseBear(3);
  assert.equal(V.S.state, 'waschen'); assert.equal(V.ctx.BSKunden.besuch, null);
});

test('Wunsch-Knopf (💭) führt zum nächsten offenen Wunsch, danach zu „Fertig!“', () => {
  const H = load({ files: ALL, seed: 8 });
  const S = H.S, K = H.ctx.BSKunden;
  go(H, 'menu'); tap(H, /Kunde kommt/); run(H, 90);
  const [a, b] = K.besuch.wuensche;
  const andere = S.STATIONS.map((s) => s.id).find((id) => !K.besuch.wuensche.includes(id) && id !== 'finish');
  go(H, andere);
  const wk = () => S.buttons.find((x) => x.nav === 'wunsch');
  assert.ok(wk()); run(H, 2); assert.ok(wk().r.h >= 48 && wk().r.w >= 48);
  wk().onTap(); assert.equal(S.state, a);
  K.aktion(); wk().onTap(); assert.equal(S.state, b);
  K.aktion(); wk().onTap(); assert.equal(S.state, 'finish');
  assert.ok(!wk(), 'auf „Fertig!“ kein Wunsch-Knopf');
});
