// weiter.test.mjs — P1-2: Menü zeigt „Weiter mit meinem Bären“ schon in derselben Sitzung.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go } from './harness.mjs';

const labels = (H) => H.S.buttons.map((b) => b.label);
const tap = (H, re) => { const b = H.S.buttons.find((x) => re.test(x.label || '')); assert.ok(b, 'Knopf ' + re + ' fehlt: ' + labels(H).join(' | ')); b.onTap(); };

test('Bär wählen → S.save() → Menü hat sofort beide Knöpfe', () => {
  const H = load({ seed: 1 });                 // leerer Speicher: erster Besuch
  go(H, 'menu');
  assert.ok(labels(H).some((l) => /Los geht/.test(l)));
  H.S.chooseBear(4);                           // speichert intern
  H.S.save();
  go(H, 'menu');
  assert.ok(labels(H).some((l) => /Weiter mit meinem Bären/.test(l)), labels(H).join(' | '));
  assert.ok(labels(H).some((l) => /Neuen Bären wählen/.test(l)));
});

test('Weg eines Kindes: stylen → 🏠 → „Weiter“ → der gestylte Bär ist noch da', () => {
  const H = load({ seed: 1 });
  go(H, 'wahl');
  H.S.chooseBear(2);
  go(H, 'pfoten'); H.S.lackColor = '#3498db';
  const s = Math.min(H.S.VW, H.S.VH) / 420;
  H.S.tapBear(H.S.VW * 0.5 - 55 * s - 16 * s, H.S.VH * 0.58 + 175 * s);   // Kralle L0
  assert.equal(H.S.baer.lack.L0, '#3498db');
  tap(H, /🏠/);
  assert.equal(H.S.state, 'menu');
  tap(H, /Weiter mit meinem Bären/);
  assert.equal(H.S.state, 'waschen');
  assert.equal(H.S.baer.fellIdx, 2);
  assert.equal(H.S.baer.lack.L0, '#3498db');
  assert.equal(JSON.parse(H.store.bs_baer).lack.L0, '#3498db');
});

test('S.saved folgt dem zuletzt gespeicherten Bären (fell/fellIdx)', () => {
  const H = load({ seed: 1 });
  H.S.chooseBear(5);
  assert.equal(H.S.saved.fellIdx, 5);
  assert.equal(H.S.saved.fell, H.Art.MODELS[5].fell);
  H.S.chooseBear(1);
  assert.equal(H.S.saved.fellIdx, 1);
  assert.equal(H.S.saved.fell, H.Art.MODELS[1].fell);
});

test('Speicher gesperrt (privater Modus): Menü zeigt trotzdem „Weiter“, nichts wirft', () => {
  const H = load({ seed: 1, storageThrows: true });
  H.S.chooseBear(3);
  go(H, 'menu');
  assert.ok(labels(H).some((l) => /Weiter mit meinem Bären/.test(l)));
});
