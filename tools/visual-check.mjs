// DEV-TOOL (nicht Teil des Spiels): Headless-Prüfung gegen CHECKS.md.
// Aufruf: node tools/visual-check.mjs <label> [--fps] [--novsync] [--throttle=4] [--land] [--swraster] [--only=flow|finale|stations|models|r19] [--model=N]
// Android-Viewport 412×915 @ DPR 2, Touch. Ergebnis: shots/r19/<label>/*.png + report.json
// --only=r19: Aquarium-Verdeckung (Bär-Maske gegen Fisch/Futter/Blasen/Deko, 10 s Füttern) + Zirkus-Bahnen + Bursts
import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
// Playwright: $PW_DIR, ~/.cache/r18-pw (lokal installiert) oder global
const pwCands = [process.env.PW_DIR, path.join(process.env.HOME || '', '.cache/r18-pw/node_modules'), execSync('npm root -g').toString().trim()].filter(Boolean);
const pwDir = pwCands.find(d => fs.existsSync(path.join(d, 'playwright')));
const { chromium } = require(path.join(pwDir, 'playwright'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const label = process.argv[2] || 'run';
const doFps = process.argv.includes('--fps'), land = process.argv.includes('--land');
const thr = +(arg('throttle') || 0), only = arg('only');
const outDir = path.join(root, 'shots', 'r19', label);
fs.mkdirSync(outDir, { recursive: true });
const report = { label, land, throttle: thr, errors: [], fps: {}, smallButtons: [], notes: [] };

// Standard: GPU-Raster (ANGLE) wie auf Android-Chrome; --swraster = Software-Raster (Worst Case, Headless-typisch)
const sw = process.argv.includes('--swraster');
// --novsync: rAF ungebremst (Headless ohne Display taktet sonst ~11 Hz) — FPS = Durchsatz, nur relativ vergleichbar
const novs = process.argv.includes('--novsync');
const browser = await chromium.launch({ args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'].concat(sw ? [] : ['--use-angle=metal', '--enable-gpu', '--enable-unsafe-swiftshader']).concat(novs ? ['--disable-gpu-vsync', '--disable-frame-rate-limit'] : []) });
report.raster = sw ? 'software' : 'gpu';
const ctx = await browser.newContext({
  viewport: land ? { width: 915, height: 412 } : { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36'
});
const page = await ctx.newPage();
page.on('pageerror', e => report.errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') report.errors.push('console: ' + m.text()); });
if (thr) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr }); }
await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto('file://' + path.join(root, 'index.html'));
await page.waitForTimeout(1200);

const W = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await page.screenshot({ path: path.join(outDir, name + '.png') }); console.log('shot', name); };
const checkButtons = async (where) => {
  const small = await page.evaluate(() => window.BSSalon.buttons.filter(b => b.r && (b.r.w < 47.5 || b.r.h < 47.5)).map(b => (b.label || b.fill) + ' ' + b.r.w + 'x' + b.r.h));
  small.forEach(s => report.smallButtons.push(where + ': ' + s));
};
const tapBtn = async (pred) => {
  const p = await page.evaluate((src) => {
    const f = new Function('b', 'return ' + src);
    const b = window.BSSalon.buttons.find(x => x.r && f(x));
    return b ? [b.r.x + b.r.w / 2, b.r.y + b.r.h / 2] : null;
  }, pred);
  if (p) await page.touchscreen.tap(p[0], p[1]); else report.notes.push('button not found: ' + pred);
  return !!p;
};
const tapWorld = async (wx, wy) => {
  const p = await page.evaluate(([x, y]) => window.BSGame.worldToScreen(x, y), [wx, wy]);
  await page.touchscreen.tap(p[0], p[1]);
};
const setState = async (st, wait = 900) => { await page.evaluate((s) => { window.BSSalon.state = s; window.BSSalon.buildUI(); }, st); await W(wait); };
async function fps(name, ms = 6000) {
  const r = await page.evaluate((ms) => new Promise(res => {
    let n = 0, last = performance.now(); const t0 = last, dts = [];
    function f(t) { n++; dts.push(t - last); last = t;
      if (t - t0 < ms) requestAnimationFrame(f);
      else { dts.sort((a, b) => a - b); res({ fps: +(n * 1000 / (t - t0)).toFixed(1), p95: +dts[Math.floor(dts.length * 0.95)].toFixed(1),
        worst: +dts[dts.length - 1].toFixed(1), tier: window.BSGame.tier(), particles: window.BSFx.P.count(), bakes: window.BSArt.bakes }); } }
    requestAnimationFrame(f);
  }), ms);
  console.log('FPS', name, JSON.stringify(r)); report.fps[name] = r; return r;
}
const styleBear = (m) => page.evaluate((m) => {
  const S = window.BSSalon, b = S.baer; b.fellIdx = m; b.fell = window.BSArt.MODELS[m].fell;
  b.acc.hut = 0; b.acc.kette = 0; b.makeup.rouge = '#ff9eb5'; b.frisur = 'lockig'; b.haar = '#c0392b';
  b.lack = { L0: '#e91e63', L1: '#f39c12', L2: '#9b59b6', R0: '#e91e63', R1: '#f39c12', R2: '#9b59b6' };
  S.buildUI();
}, m);

// ---------------------------------------------------------------- Flow über echte UI-Taps (C1.3)
if (!only || only === 'flow') {
  await shot('01-menu'); await checkButtons('menu');
  await tapBtn("/Los geht/.test(b.label)"); await W(900); await shot('02-wahl');
  if (doFps) await fps('wahl', 5000);
  await page.evaluate(() => {}); // Kachel 0 antippen
  const p0 = await page.evaluate(() => { const G = window.BSUI.L.grid; return [G.x + 40, G.y + 50]; });
  await page.touchscreen.tap(p0[0], p0[1]); await W(1000);
  await shot('03-waschen'); await checkButtons('waschen');
  // Waschen: Seife + rubbeln + Dusche
  await tapBtn("/Seife/.test(b.label)"); await W(300); await tapBtn("/Seife/.test(b.label)"); await W(500);
  await shot('04-schaum');
  if (doFps) await fps('waschen', 6000);
  await tapBtn("/Dusche/.test(b.label)"); await W(700); await shot('05-dusche'); await W(2200);
  const ids = await page.evaluate(() => window.BSSalon.STATIONS.map(s => s.id));
  const MAIN = { foehnen: null, schneiden: "/Afro/.test(b.label)", pfoten: "b.fill && b.r && b.fill==='#9b59b6'", massage: null, spa: null,
    tanz: "/Rock/.test(b.label)", zirkus: "b.fill==='#3498db'", parfum: "/Meer/.test(b.label)", makeup: "b.fill==='#ff6b81'",
    schmuecken: "/Hut/.test(b.label)", eis: "b.fill==='#8fd48a'", zuckerwatte: "/Wirbeln/.test(b.label)", ballon: "/Pusten/.test(b.label)",
    zauber: "/Blüten/.test(b.label)", geschenke: null, keks: "/Stern/.test(b.label)", karussell: "/Schnell/.test(b.label)",
    geburtstag: "/anzünden/.test(b.label)", disco: "b.fill==='#7ab8f5'", foto: "/Klick/.test(b.label)", malbuch: "b.fill==='#3498db'",
    aquarium: "/Futter/.test(b.label)", finish: null };
  let n = 6;
  for (const id of ids.slice(1)) {
    // Station per ➜ (Weiter) betreten — echter UI-Tap
    await tapBtn("b.nav==='next'"); await W(850);
    const st = await page.evaluate(() => window.BSSalon.state);
    if (st !== id) report.notes.push('expected ' + id + ' got ' + st);
    if (MAIN[id]) { await tapBtn(MAIN[id]); await W(250); }
    if (id === 'foehnen') { const p = await page.evaluate(() => { const b = window.BSSalon.buttons.find(x => x.hold); return [b.r.x + 20, b.r.y + 20]; });
      await page.touchscreen.tap(p[0], p[1]); await page.evaluate(() => { window.BSSalon.foehn = true; }); await W(900); }
    if (id === 'pfoten') { for (const k of [[-71, 175], [-55, 175], [55, 175]]) { await tapWorld(450 + k[0] * 600 / 420, 348 + k[1] * 600 / 420); await W(120); } }
    if (id === 'massage') { const a = await page.evaluate(() => window.BSGame.worldToScreen(450, 448));
      await page.mouse.move(a[0] + 60, a[1]); await page.mouse.down(); for (let i = 0; i < 40; i++) { const q = i / 40 * Math.PI * 4; await page.mouse.move(a[0] + Math.cos(q) * 60, a[1] + Math.sin(q) * 50); } await page.mouse.up(); }
    if (id === 'spa') { await tapWorld(450 - 30 * 600 / 420, 348 - 105 * 600 / 420); await W(150); await tapWorld(450 + 30 * 600 / 420, 348 - 105 * 600 / 420); await W(900); }
    if (id === 'schmuecken') { await tapBtn("/Brille/.test(b.label)"); await W(200); await tapBtn("/Kette/.test(b.label)"); await W(200); await tapBtn("/Schleife/.test(b.label)"); }
    if (id === 'eis') { await tapBtn("b.fill==='#ff9eb5'"); await W(150); await tapBtn("b.fill==='#c39bd3'"); }
    if (id === 'makeup') { await tapBtn("b.fill==='#3498db'"); }
    if (id === 'geschenke') { const h = await page.evaluate(() => window.BSSalon._pakHit); if (h) { await tapWorld(h.x + h.w / 2, h.y + h.h / 2); await W(200); await tapWorld(h.x + h.w / 2, h.y + h.h / 2); } }
    if (id === 'ballon') { for (let i = 0; i < 5; i++) { await tapBtn("/Pusten/.test(b.label)"); await W(120); } }
    if (id === 'tanz') { await tapWorld(450, 348); }
    await W(700);
    await shot(String(n++).padStart(2, '0') + '-' + id); await checkButtons(id);
    if (id === 'foehnen') await page.evaluate(() => { window.BSSalon.foehn = false; });
  }
  // Finale über den echten Knopf
  await tapBtn("b.hero"); await W(100);
  let lastMs = 100;
  for (const ms of [300, 1300, 2600, 3300, 4600, 6200]) { await W(ms - lastMs); lastMs = ms; await shot('fin-' + String(ms).padStart(4, '0')); }
  if (doFps) await fps('finale', 5000);
  await checkButtons('finale');
  await tapBtn("/Nochmal/.test(b.label)"); await W(800); await shot('99-nochmal');
}
// ---------------------------------------------------------------- Stationen mit gestyltem Bären (C7)
if (only === 'stations') {
  const ids = await page.evaluate(() => window.BSSalon.STATIONS.map(s => s.id));
  await setState('waschen'); await styleBear(+(arg('model') || 0));
  let n = 1;
  for (const id of ids) { await setState(id, 1100); await shot('st-' + String(n++).padStart(2, '0') + '-' + id); }
}
// ---------------------------------------------------------------- Finale-Zeitleiste
if (only === 'finale') {
  await setState('waschen'); await styleBear(+(arg('model') || 0)); await setState('finish');
  await page.evaluate(() => window.BSSalon.startFinale());
  let last = 0;
  for (const ms of [200, 600, 1200, 1800, 2600, 3000, 3400, 4200, 5200, 7500]) { await W(ms - last); last = ms; await shot('fin-' + String(ms).padStart(4, '0')); }
  if (doFps) await fps('finale', 5000);
}
// ---------------------------------------------------------------- 37 Modelle: Kontaktbogen + Einzelaufnahmen (C5)
if (only === 'models') {
  const res = await page.evaluate(() => {
    const A = window.BSArt, n = A.MODELS.length, cols = 6, cw = 300, ch = 330;
    const c = document.createElement('canvas'); c.width = cols * cw; c.height = Math.ceil(n / cols) * ch;
    const g = c.getContext('2d'); g.fillStyle = '#f7e4d4'; g.fillRect(0, 0, c.width, c.height);
    const bad = [];
    for (let i = 0; i < n; i++) {
      try {
        g.save(); g.translate((i % cols) * cw + cw / 2, Math.floor(i / cols) * ch + 170); g.scale(0.58, 0.58); g.translate(-210, -243.6);
        A.drawBear(g, { fellIdx: i, frisur: null, acc: {}, lack: {}, sticker: [], makeup: null, schaum: 0, fluff: 0, tropfen: [] }, { w: 420, h: 420 });
        g.restore();
        g.fillStyle = '#6b3f4a'; g.font = 'bold 18px sans-serif'; g.textAlign = 'center';
        g.fillText(i + ' ' + A.MODELS[i].name, (i % cols) * cw + cw / 2, Math.floor(i / cols) * ch + ch - 12);
        const t = A.thumb(i, 96); if (!t) bad.push(i);
      } catch (e) { bad.push(i + ': ' + e.message); }
    }
    // Daten-Identität (C5.2): Felder als Fingerabdruck
    const fp = A.MODELS.map(m => [m.name, m.fell, m.schnauze || '', m.ohren || '', m.arme || '', m.kontur || '', m.muster || '', m.hell || 0].join('|')).join('\n');
    return { png: c.toDataURL('image/png'), bad, fp, n };
  });
  fs.writeFileSync(path.join(outDir, 'models-sheet.png'), Buffer.from(res.png.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(outDir, 'models-fingerprint.txt'), res.fp);
  report.models = { n: res.n, bad: res.bad };
  console.log('models', res.n, 'bad', res.bad);
  await setState('wahl', 1500); await shot('wahl');
  await page.evaluate(() => { const L = window.BSUI.L; });
}
// ---------------------------------------------------------------- r19: Aquarium-Verdeckung + Jonglage
if (only === 'r19') {
  await setState('waschen'); await styleBear(+(arg('model') || 0));
  // Messhaken: Welt-Transform (S.draw) und Bär-Aufruf (Art.drawBear) mitschneiden — unabhängig von der Implementierung
  await page.evaluate(() => {
    const S = window.BSSalon, A = window.BSArt, R = window.__r19 = { ob: A.drawBear };
    const od = S.draw; S.draw = function (g) { R.T0 = g.getTransform(); return od.apply(this, arguments); };
    A.drawBear = function (g, b, opt) { if (b === S.baer) R.bear = { Tb: g.getTransform(), opt: opt, st: S.state }; return R.ob.apply(this, arguments); };
    R.m = document.createElement('canvas'); R.q = 0.5; R.ox = -400; R.oy = -400; R.m.width = 2000 * R.q; R.m.height = 1700 * R.q;
    R.acc = {}; R.n = 0;
    R.sample = function () {
      if (!R.bear || !R.T0 || R.bear.st !== 'aquarium') return false;
      const mg = R.m.getContext('2d', { willReadFrequently: true });
      mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, R.m.width, R.m.height);
      const rel = R.T0.inverse().multiply(R.bear.Tb);
      mg.setTransform(new DOMMatrix().scale(R.q).translate(-R.ox, -R.oy).multiply(rel));
      R.ob(mg, S.baer, R.bear.opt);
      const img = mg.getImageData(0, 0, R.m.width, R.m.height).data, MW = R.m.width, MH = R.m.height;
      const cov = (x, y) => { const i = Math.round((x - R.ox) * R.q), j = Math.round((y - R.oy) * R.q); return i >= 0 && j >= 0 && i < MW && j < MH && img[(j * MW + i) * 4 + 3] > 100; };
      const L = window.BSUI.L, vp = L.vp, w2s = window.BSGame.worldToScreen;
      const off = (x, y) => { const p = w2s(x, y); return p[0] < vp.x || p[0] > vp.x + vp.w || p[1] < vp.y || p[1] > vp.y + vp.h; };
      const add = (cat, cx, cy, rx, ry) => { // Ellipse mit 3-Einheiten-Raster abtasten (Punkte ∝ Fläche)
        const a = R.acc[cat] || (R.acc[cat] = { pts: 0, hid: 0, off: 0 });
        for (let y = cy - ry; y <= cy + ry; y += 3) for (let x = cx - rx; x <= cx + rx; x += 3) {
          const u = (x - cx) / rx, v = (y - cy) / ry; if (u * u + v * v > 1) continue;
          a.pts++; if (cov(x, y)) a.hid++; else if (off(x, y)) a.off++;
        }
      };
      const aq = S.aqua; if (!aq) return false;
      (aq.fisch || []).forEach(f => { const d = f.vx < 0 ? 1 : -1, k = f.s; add('fisch', f.x + d * 5 * k, f.y, 21 * k, 9 * k); });
      const fr = aq._futterR || 4; (aq.futter || []).forEach(f => add('futter', f.x, f.y, fr, fr));
      const bk = aq._blasenK || 1; (aq.blasen || []).forEach(b => { const r = (3 + b.t * 2) * bk; add('blasen', b.x, b.y, r, r); });
      if (aq.deko) {
        let bx = aq._dekoBox; // [x,y,w,h]; Fallback = Geometrie vor r19 (Becken 240/110/630/426, Deko bei bw*0.32)
        if (!bx) { const x = 240 + 630 * 0.32, yb = 110 + 426; bx = aq.deko === 1 ? [x - 50, yb - 64 - 54, 100, 78] : [x - 34, yb - 58 - 42, 68, 60]; }
        add('deko', bx[0] + bx[2] / 2, bx[1] + bx[3] / 2, bx[2] / 2, bx[3] / 2);
      }
      R.n++; return true;
    };
  });
  await setState('aquarium', 1500);
  await page.evaluate(() => { window.BSSalon.aqua.deko = 1; window.BSSalon.buildUI(); });
  await W(300); await shot('aq-01-schiff');
  const t0 = Date.now(); let k = 0;
  while (Date.now() - t0 < 10000) {
    if (k % 14 === 0) await tapBtn("/Futter/.test(b.label)");
    if (k === 50) await page.evaluate(() => { window.BSSalon.aqua.deko = 2; window.BSSalon.buildUI(); });
    if (k === 6) await shot('aq-02-fuettern-schiff');
    if (k === 60) await shot('aq-03-fuettern-schatz');
    await page.evaluate(() => window.__r19.sample()); await W(80); k++;
  }
  const occ = await page.evaluate(() => { const R = window.__r19; let P = 0, H = 0, O = 0; const o = { samples: R.n };
    for (const c in R.acc) { const a = R.acc[c]; P += a.pts; H += a.hid; O += a.off; o[c] = { verdeckt: +(100 * a.hid / a.pts).toFixed(1), ausserhalb: +(100 * a.off / a.pts).toFixed(1) }; }
    o.gesamt = { verdeckt: +(100 * H / P).toFixed(1), ausserhalb: +(100 * O / P).toFixed(1) }; return o; });
  report.aquarium = occ; console.log('AQUARIUM', JSON.stringify(occ));
  await W(1500); await shot('aq-04-schatz-ruhe');
  // Zirkus: 1/2/3 Bälle, je Burst 6 Bilder à 160 ms; Bahn-Metriken falls S.zirkus._pos / baer._paws vorhanden
  await setState('zirkus', 1500);
  await page.evaluate(() => { window.BSSalon.zirkus.bälle = [{ c: '#e74c3c' }]; window.BSSalon.buildUI(); }); await W(400);
  for (const n of [1, 2, 3]) {
    if (n > 1) { await tapBtn(n === 2 ? "b.fill==='#f4c20d'" : "b.fill==='#3498db'"); await W(500); }
    for (let i = 0; i < 6; i++) { await shot(`zi-${n}ball-${i + 1}`); await W(160); }
  }
  const zm = await page.evaluate(() => new Promise(res => {
    const S = window.BSSalon, out = { frames: 0, overlapFrames: 0, minDist: 1e9, lowDy: [], apexY: 1e9, lowY: -1e9 };
    const t0 = performance.now();
    (function f() {
      const P = S.zirkus && S.zirkus._pos, pw = S.baer._paws, geo = S.baer._geo;
      if (P && P.length) {
        out.frames++; let ov = false;
        for (let i = 0; i < P.length; i++) { out.apexY = Math.min(out.apexY, P[i][1]); out.lowY = Math.max(out.lowY, P[i][1]);
          for (let j = i + 1; j < P.length; j++) { const d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]); out.minDist = Math.min(out.minDist, d); if (d < (S.zirkus._r || 17) * 2) ov = true; } }
        if (ov) out.overlapFrames++;
        if (pw) out.paws = pw.map(p => p.map(Math.round));
        if (geo) { out.headTop = Math.round(geo.cy - 172 * geo.s); out.headMid = Math.round(geo.cy - 82 * geo.s); }
      }
      if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res(out);
    })();
  }));
  if (zm.frames) zm.overlapPct = +(100 * zm.overlapFrames / zm.frames).toFixed(1);
  report.zirkus = zm; console.log('ZIRKUS', JSON.stringify(zm));
  if (doFps) { await setState('aquarium', 800); await tapBtn("/Futter/.test(b.label)"); await fps('aquarium', 5000); await setState('zirkus', 800); await fps('zirkus', 5000); }
}
if (doFps && only === 'stations') { await setState('waschen', 800); await fps('waschen', 6000); }
report.errors.push(...(await page.evaluate(() => window.__errors || [])).map(e => 'window.__errors: ' + e));
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log('errors', report.errors.length, report.errors.slice(0, 8));
console.log('smallButtons', report.smallButtons.length, report.smallButtons.slice(0, 6));
console.log('notes', report.notes);
await browser.close();
