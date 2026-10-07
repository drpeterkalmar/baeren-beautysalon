// registry.test.mjs — Umbau Schritt 10: Stations-Registry und S.setState (onLeave/onEnter).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, go } from './harness.mjs';

test('S.setState: Zustand setzen + Knöpfe bauen; Aufräumen wie vorher (Waschen/Föhnen)', () => {
  const H = load({ seed: 1 });
  H.S.setState('waschen');
  assert.equal(H.S.state, 'waschen');
  assert.ok(H.S.buttons.some((b) => /Seife/.test(b.label)));
  H.S.baer.schaum = 0.7; H.S.dusche = true;
  H.S.setState('foehnen');
  assert.equal(H.S.baer.schaum, 0);
  assert.equal(H.S.dusche, false);
  assert.ok(!H.S.buttons.some((b) => /Erst duschen/.test(b.label)), 'Schaum wurde zu spät geleert');
  H.S.foehn = true;
  H.S.setState('menu');
  assert.equal(H.S.foehn, false);
});

test('Alle Knöpfe, die den Zustand wechseln, laufen über S.setState', () => {
  const H = load({ seed: 1 });
  const ziele = [];
  const orig = H.S.setState;
  H.S.setState = function (id) { ziele.push(id); return orig.call(this, id); };
  go(H, 'menu'); H.S.buttons.find((b) => /Los geht/.test(b.label)).onTap();
  H.S.chooseBear(1);
  go(H, 'waschen'); H.S.buttons.find((b) => b.nav === 'next').onTap();
  H.S.buttons.find((b) => b.tab === 'disco').onTap();
  H.S.buttons.find((b) => b.nav === 'home').onTap();
  assert.deepEqual(ziele, ['wahl', 'waschen', 'foehnen', 'disco', 'menu']);
});

test('Registry: eine angemeldete Station übernimmt build/back/draw/update/tap; onLeave/onEnter auch bei direkter Zuweisung', () => {
  const H = load({ seed: 1 });
  const log = [];
  H.S.registerStation({
    id: 'disco',
    build() { log.push('build'); H.S.H && H.S.hinweis; },
    back() { log.push('back'); }, draw() { log.push('draw'); },
    update(dt, fr) { log.push('update:' + fr); }, tap(x, y) { log.push('tap'); return x > 100; },
    onEnter(alt) { log.push('enter:' + alt); }, onLeave(neu) { log.push('leave:' + neu); },
  });
  go(H, 'waschen');
  H.S.state = 'disco'; H.S.buildUI();            // wie die Prüfwerkzeuge (direkte Zuweisung)
  H.S.draw(H.g);
  H.S.update(1 / 60);
  assert.equal(H.S.tapBear(200, 200), true);
  assert.equal(H.S.tapBear(50, 200), false);
  H.S.setState('foto');
  assert.deepEqual(log, ['enter:waschen', 'build', 'back', 'draw', 'update:1', 'tap', 'tap', 'leave:foto']);
  assert.ok(H.S.buttons.some((b) => b.nav === 'home'), 'Rück-Knöpfe fehlen');
});
