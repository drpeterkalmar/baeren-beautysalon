// stationen-szenen.mjs — feste Szene je Station (hoch und quer) für Umbau-Schritt 10 (Stations-Dateien).
// Pro Bild: Uhr weiter → S.update(dt) → S.draw(g). Dazu Tipps an festen Punkten und Druck auf Tablett-Knöpfe.
// Prüfsumme je Bild über Zeichen-Protokoll, Knöpfe (Rechteck/aktiv), Tipp-Ergebnisse und Zustand.
// Referenz (Stand vor dem Umzug, Commit a6e223c): tests/unit/fixtures/stationen-ref.json (stationen-ref.mjs).
import crypto from 'node:crypto';
import { load, go, drawLog, CORE } from './harness.mjs';

const r4 = (v) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
export const HITS = ['_pakHit', '_teigHit', '_stabHit', '_wolleHit', '_ballHit', '_stabHitZ', '_albumBoxes', '_mbHit', '_mbFrame', '_brause'];
// Welt-Punkte (900×600-Bühne): Bärmitte, Kopf, Augen, Krallen, Wange, Requisiten links/rechts, Kerze, Zauberstab …
export const PUNKTE = [[450, 348], [450, 231], [407, 198], [493, 198], [349, 598], [551, 598], [420, 220], [665, 420],
  [200, 500], [612, 258], [633, 300], [770, 300], [500, 150], [300, 380], [610, 500], [470, 150]];
const ZUSTAND = ['state', 'hinweis', 'eis', 'tanz', 'zirkus', 'karo', 'kuchen', 'discoFarbe', 'fotoRahmen', 'flash', 'fotoBadge', 'album',
  'mb', 'mbColor', 'aqua', 'zauber', 'ballon', 'geschenk', 'keks', 'watte', 'mass', 'glitzMode', 'lackColor', 'stickerTyp', 'spaTarget',
  'foehn', 'dusche', 'toast', 'saved', 'menuBaer'];
// Felder mit _ sind Zwischenstände (Zeichenlisten, Hit-Boxen) und zählen nicht zum Zustand
const ohneIntern = (k, v) => (k && k[0] === '_' ? undefined : (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v));
function zustand(S) {
  const o = { baer: S.baer };
  for (const k of ZUSTAND) o[k] = S[k];
  return JSON.stringify(o, ohneIntern);
}
function knoepfe(S) {
  return S.buttons.map((b) => [b.label, b.x, b.y, b.w, b.h, b.active ? !!b.active() : null, b.fill || '', b.nav || '', b.tab || ''].map(r4));
}

// Vorbereitung je Station (nach dem Betreten), damit auch seltene Zustände im Bild sind
const VORBEREITUNG = {
  ballon(H) { for (let i = 0; i < 5; i++) H.S.buttons.find((b) => /Pusten/.test(b.label)).onTap(); },   // fertig → Schwebe-Ballon
};

function hitVars(S) {
  const o = {};
  for (const k of HITS) if (S[k] !== undefined && S[k] !== null) o[k] = JSON.parse(JSON.stringify(S[k], (kk, v) => (typeof v === 'number' ? r4(v) : v)));
  return o;
}

export function spieleStation(st, { port = true, files = CORE, sources, frames = 24, onFrame } = {}) {
  const H = load({ files, sources, seed: 21, record: true, date: '2026-10-07T10:00:00', globals: { BSUI: { L: { port } } } });
  const S = H.S;
  // gestylter Bär mit Duft (Duftwolken), zwei Album-Fotos (Wandbild, Album-Vorschau)
  S.chooseBear(3);
  S.baer.acc.hut = 1; S.baer.lack.L1 = '#e91e63'; S.baer.duft = 1; S.baer.makeup.rouge = '#ff9eb5';
  go(H, 'foto'); S.buttons.find((b) => /Klick!/.test(b.label)).onTap();
  S.baer.frisur = 'afro'; S.buttons.find((b) => /Klick!/.test(b.label)).onTap();
  S.flash = 0;
  go(H, st);
  if (VORBEREITUNG[st]) VORBEREITUNG[st](H);
  const hashes = [];
  let hitsFrueh = {};
  let pi = (st.length * 7) % PUNKTE.length, bi = 0;
  for (let i = 0; i < frames; i++) {
    const notiz = [];
    if (i === 6 || i === 12 || i === 18) {
      for (let k = 0; k < 3; k++) { const p = PUNKTE[pi++ % PUNKTE.length]; notiz.push(['tap', p, S.tapBear(p[0], p[1])]); }
    }
    if (i === 9 || i === 15 || i === 21) {
      const tray = S.buttons.filter((b) => !b.nav && !b.tab && !/Fertig!/.test(b.label));
      if (tray.length) { const b = tray[bi++ % tray.length]; notiz.push(['knopf', b.label]); b.onTap(); }
    }
    H.tick(1000 / 60);
    S.update(1 / 60);
    H.rec.length = 0;
    S.draw(H.g);
    const log = drawLog(H.rec).map((e) => e.map(r4));
    const dig = JSON.stringify([log, knoepfe(S), notiz, zustand(S)]);
    hashes.push(crypto.createHash('sha1').update(dig).digest('hex').slice(0, 12));
    if (onFrame) onFrame(H, i, { log, notiz });
    if (i === 3) hitsFrueh = hitVars(S);
    if (i === 4 && st === 'ballon') {                         // Schwebe-Ballon mittig antippen → PLATZ (Weg über die Hit-Box)
      const R = S.REG.ballon, b = R && R.hit ? R.hit().ballon : S._ballHit;
      if (b) S.tapBear(b.x + b.w / 2, b.y + b.h / 2);
    }
  }
  const hits = hitVars(S);
  // Tipp-Raster über die ganze Bühne (alle 20 Einheiten): Treffer-Folge + Endzustand → feine Prüfung der Hit-Geometrie
  let raster = '';
  for (let y = -40; y <= 660; y += 20) for (let x = -20; x <= 920; x += 20) raster += S.tapBear(x, y) ? '1' : '0';
  const rasterHash = crypto.createHash('sha1').update(raster + zustand(S)).digest('hex').slice(0, 12);
  return { hashes, hits, hitsFrueh, raster: rasterHash, H };
}
