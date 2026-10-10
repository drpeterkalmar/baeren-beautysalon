// spiel-szenen.mjs — Szenen über die echte game.js-Schleife (alle Module, fester Zufall): Zustand je Bild für die
// Stationen, deren Logik pro Bild aus game.js update() in die Stationen wandert (Haken frueh(dt)).
// Referenz: tests/unit/fixtures/spiel-ref.json (spiel-ref.mjs), erzeugt vor dem Umzug (Commit 104268f).
import crypto from 'node:crypto';
import { load, go, ALL, VOR_R22 } from './harness.mjs';

const knopf = (S, re) => { const b = S.buttons.find((x) => re.test(x.label || '')); if (b) b.onTap(); };
export const SPIEL = {
  waschen: (S, i) => { if (i === 0) { S.baer.schaum = 0.9; knopf(S, /Dusche/); } },
  foehnen: (S, i) => { S.foehn = i < 150; },
  spa: (S, i) => { if (i === 0) { S.baer.gurkeL = true; S.baer.gurkeR = true; S.buildUI(); } if (i === 200) knopf(S, /Gurken weg/); },
  eis: (S, i) => { if (i === 0) { knopf(S, /^$/); const f = S.buttons.filter((b) => b.fill); f[0].onTap(); f[2].onTap(); } },
  zuckerwatte: (S, i) => { if (i % 60 === 0) knopf(S, /Wirbeln/); },
  massage: (S, i) => { const s = Math.min(S.VW, S.VH) / 420, a = i * 0.15, x = S.VW * 0.5 + Math.cos(a) * 90 * s, y = S.VH * 0.58 + 70 * s + Math.sin(a) * 80 * s;
    if (i < 180) S.dragBear(x, y, x - 1, y - 1); },
};
const r4 = (k, v) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
function digest(H) {
  const S = H.S, b = S.baer;
  return JSON.stringify({ b: { schaum: b.schaum, tropfen: b.tropfen, fluff: b.fluff, relax: b.relax, spa: b._spa, jubel: b.jubel, hut: b.hutTilt, p: b._p },
    eis: S.eis, watte: S.watte, mass: S.mass, dusche: S.dusche, foehn: S.foehn, parts: H.Fx.P.list.map((p) => [p.type, p.x, p.y]), state: S.state }, r4);
}
export function spieleSchleife(st, { frames = 300 } = {}) {
  const H = load({ files: ALL, seed: 31, date: '2026-10-07T10:00:00', search: VOR_R22 });
  H.S.chooseBear(4);
  go(H, st);
  for (let i = 0; i < 20; i++) H.frame();
  const hashes = [];
  for (let i = 0; i < frames; i++) {
    SPIEL[st](H.S, i);
    H.frame();
    hashes.push(crypto.createHash('sha1').update(digest(H)).digest('hex').slice(0, 12));
  }
  return { hashes, H };
}
