// sim-szenen.mjs — feste Szenen für Schritt 6 (Simulation aus dem Zeichenpfad in S.update(dt)).
// Jede Szene läuft mit festem Zufall und fester Uhr. Pro Bild: Uhr weiter → (neu: S.update(dt)) → S.draw(g).
// Ergebnis: Prüfsumme des Zeichen-Protokolls je Bild (= „was zu sehen ist“) + Zustands-Stichproben.
// Referenzwerte des ALTEN Codes (Simulation noch im Zeichenpfad): tests/unit/fixtures/sim-ref-alt.json,
// erzeugt mit `node tests/unit/sim-ref.mjs` aus salon.js von Commit 79d3ca7 (Stand vor dem Umbau).
import crypto from 'node:crypto';
import { load, go, drawLog } from './harness.mjs';

const r6 = (v) => Math.round(v * 1e6) / 1e6;
const r4 = (v) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
const tapLabel = (H, re) => { const b = H.S.buttons.find((x) => re.test(x.label || '')); if (!b) throw new Error('Knopf ' + re); b.onTap(); };
const sk = (H) => Math.min(H.S.VW, H.S.VH) / 420;

export const SZENEN = {
  aquarium: {
    seed: 11, frames: 150,
    start(H) { go(H, 'aquarium'); },
    tap(H, i) { if (i === 0 || i === 70) tapLabel(H, /Futter!/); },
    snap(H) {
      const aq = H.S.aqua;
      return { fisch: (aq.fisch || []).map((f) => [f.x, f.y, f.vx, f.vy].map(r6)), futter: aq.futter.map((f) => [f.x, f.y, f.vy].map(r6)),
        blasen: aq.blasen.length, fuetter: r6(aq.fuetter) };
    },
  },
  zauber: {
    seed: 12, frames: 330,
    start(H) { go(H, 'zauber'); },
    tap(H, i) {
      if (i % 110 !== 0) return;
      H.S.zauber.art = i / 110;
      const s = sk(H);
      H.S.tapBear(H.S.VW * 0.5 + 128 * s, H.S.VH * 0.58 - 60 * s);
    },
    // t selbst steckt in der Bild-Prüfsumme (alt zählte nach dem Zeichnen weiter, neu davor → Stichprobe nur aktiv/Art)
    snap(H) { const f = H.S.zauber.fx; return { fx: f ? f.art : null }; },
  },
  karussell: {
    seed: 13, frames: 150,
    start(H) { go(H, 'karussell'); },
    tap(H, i) { if (i === 0) tapLabel(H, /Schnell/); if (i === 120) tapLabel(H, /Langsam/); },
    snap(H) { const k = H.S.karo; return { ang: r6(k.ang), noten: (k.noten || []).map((n) => [n.x, n.y, n.t].map(r6)) }; },
  },
  tanz: {
    seed: 14, frames: 150,
    start(H) { go(H, 'tanz'); },
    tap() {},
    snap(H) { return { noten: H.S.tanz.noten.map((n) => [n.x, n.y, n.t].map(r6)) }; },
  },
  geburtstag: {
    seed: 15, frames: 100,
    start(H) { go(H, 'geburtstag'); },
    tap(H, i) {
      const k = [0, 20].indexOf(i); if (k < 0) return;
      const cx = H.S.VW * 0.5 + 200, cy = H.S.VH * 0.58 + 150;   // kerzenPos() in salon.js
      H.S.tapBear(cx - 38 + k * 38, cy - 96 + 10);
    },
    snap(H) { return { rauch: H.S.kuchen.rauch.map((r) => [r.x, r.y, r.t].map(r6)) }; },
  },
};

// Szene abspielen. mode: 'alt' (nur draw) | 'neu' (S.update(dt) vor draw). hz: Bildrate.
export function spiele(name, { mode = 'neu', hz = 60, sources, files, every = 10, random } = {}) {
  const sz = SZENEN[name];
  const H = load({ files, seed: sz.seed, record: true, sources, globals: { BSUI: { L: { port: true } } } });
  if (random) H.ctx.Math.random = random;
  sz.start(H);
  const dt = 1 / hz, k = hz / 60;                // k Bilder pro 60-Hz-Bild
  const hashes = [], snaps = [];
  const n = Math.round(sz.frames * k);
  for (let i = 0; i < n; i++) {
    if (i % k === 0) sz.tap(H, i / k);
    H.tick(dt * 1000);
    if (mode === 'neu') H.S.update(dt);
    H.rec.length = 0;
    H.S.draw(H.g);
    if (hz === 60) {
      const log = drawLog(H.rec).map((e) => e.map(r4));
      hashes.push(crypto.createHash('sha1').update(JSON.stringify(log)).digest('hex').slice(0, 12));
    }
    if ((i + 1) % (every * k) === 0) snaps.push(JSON.parse(JSON.stringify(sz.snap(H))));  // Sandbox-Arrays → normale Arrays
  }
  return { hashes, snaps, H };
}
