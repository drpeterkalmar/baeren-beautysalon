// tests/kunden-autopilot.mjs — r22 Messgröße 1: Zeit vom Start bis zum ersten erfüllten Wunsch für ein Kind, das nur
// tippt. Ohne Browser (Harness + echte game.js-Schleife, echte Zeiger-Ereignisse über UI-Treffertest und Welt).
// Je Lauf: Spielstart im Menü, alle 0,6 s ein Tipper — zur Hälfte auf einen zufälligen sichtbaren Knopf, zur Hälfte
// irgendwohin auf den Bildschirm. Ergebnis: Median/Min/Max über N Läufe (Standard 20), Abbruch nach 600 s.
//   node tests/kunden-autopilot.mjs [--n=20] [--land] [--search=?wunsch=2]
import { load, ALL, seeded } from './unit/harness.mjs';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const N = +arg('n', 20), land = process.argv.includes('--land'), search = arg('search', '');
const W = land ? 915 : 412, Hh = land ? 412 : 915;

function lauf(seed) {
  const H = load({ files: ALL, seed, width: W, height: Hh, search });
  const cv = H.mainCanvas, rnd = seeded(seed * 7919 + 1);
  const ev = (x, y) => ({ clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', preventDefault() {} });
  let t = 0, naechster = 0.6;
  const K = () => H.ctx.BSKunden;
  for (let i = 0; i < 10; i++) H.frame();
  while (t < 600) {
    H.frame(); t += 1 / 60;
    const B = K().besuch;
    if (B && Object.keys(B.erfuellt).length) return { t, wunsch: Object.keys(B.erfuellt)[0], fehler: [...H.ctx.__errors] };
    if (t >= naechster) {
      naechster += 0.6;
      let x, y;
      const sichtbar = H.S.buttons.filter((b) => b.r && b.r.w > 0 && b.nav !== 'mute');
      if (rnd() < 0.5 && sichtbar.length) { const b = sichtbar[Math.floor(rnd() * sichtbar.length)]; x = b.r.x + b.r.w / 2; y = b.r.y + b.r.h / 2; }
      else { x = rnd() * W; y = rnd() * Hh; }
      cv._l.pointerdown(ev(x, y)); H.frame(); t += 1 / 60; cv._l.pointerup(ev(x, y));
    }
  }
  return { t: Infinity, fehler: [...H.ctx.__errors] };
}

const res = [];
for (let s = 1; s <= N; s++) res.push(lauf(s));
const ts = res.map((r) => r.t).sort((a, b) => a - b), med = (ts[(N - 1) >> 1] + ts[N >> 1]) / 2;
const fehler = res.flatMap((r) => r.fehler);
const out = { format: land ? 'quer' : 'hoch', n: N, median_s: +med.toFixed(1), min_s: +ts[0].toFixed(1), max_s: +ts[N - 1].toFixed(1),
  ueber60: ts.filter((x) => x > 60).length, fehler: fehler.length, laeufe: res.map((r) => +r.t.toFixed(1)) };
console.log(JSON.stringify(out));
