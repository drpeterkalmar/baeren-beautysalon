// DEV-TOOL (nicht Teil des Spiels): Screenshots + Leistungsmessung für die Deko-Runde (r20).
// Aufruf:
//   node tests/deko-check.mjs shots <label> [--src=DIR] [--land] [--deko=0|1] [--only=a,b]
//   node tests/deko-check.mjs perf  <label> [--src=DIR] [--tier=2|1|0|auto] [--throttle=4] [--vsync] [--secs=10.5] [--only=a,b] [--reduced]
// --src: Spiel-Ordner (Standard: Repo). Für "vorher" ein git-archive-Export des alten Stands.
// Handy-Viewport 412×915 @ DPR 2 (quer 915×412), Touch, GPU-Raster (Metal), Zufall per Seed fest.
// Ausgabe: tests/shots/deko/<label>/*.png bzw. tests/shots/deko/perf/<label>.json
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pwDir = [process.env.PW_DIR, path.join(process.env.HOME || '', '.cache/r18-pw/node_modules')].filter(Boolean)
  .find(d => fs.existsSync(path.join(d, 'playwright')));
const { chromium } = require(path.join(pwDir, 'playwright'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] || 'shots', label = process.argv[3] || 'run';
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const flag = (k) => process.argv.includes('--' + k);
const src = path.resolve(arg('src', root)), land = flag('land'), deko = arg('deko', '');
const only = (arg('only', '') || '').split(',').filter(Boolean);
const want = (n) => !only.length || only.includes(n);
const perfMode = mode === 'perf';
const vsync = !perfMode || flag('vsync');

// --swraster: Canvas ohne GPU (Software-Raster auf der gedrosselten CPU) = pessimistischer Ersatz für schwache Handy-GPUs (Füllrate)
const sw = flag('swraster');
const args = (sw ? ['--disable-gpu', '--disable-accelerated-2d-canvas', '--disable-gpu-rasterization']
  : ['--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-gpu'])
  .concat(['--autoplay-policy=no-user-gesture-required']).concat(vsync ? [] : ['--disable-gpu-vsync', '--disable-frame-rate-limit']);
const browser = await chromium.launch({ args });
const ctx = await browser.newContext({
  viewport: land ? { width: 915, height: 412 } : { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36'
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
// fester Zufall (gleiche Menü-Frisur, gleiche Partikel-Startwerte) + rAF-Messhaken (Intervall + JS-Arbeit je Bild)
await page.addInitScript(() => {
  try { localStorage.clear(); } catch (e) {}
  let s = 20261005 >>> 0;
  Math.random = function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const P = window.__perf = { on: false, iv: [], work: [], last: 0, tiers: [], parts: [] };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) {
    return raf(function (ts) {
      const t0 = performance.now(); cb(ts); const w = performance.now() - t0;
      if (P.on) { if (P.last) P.iv.push(ts - P.last); P.work.push(w); P.tiers.push(window.BSFx ? window.BSFx.Q.tier : -1);
        P.parts.push(window.BSFx ? window.BSFx.P.count() : 0); }
      P.last = ts;
    });
  };
});
const url = 'file://' + path.join(src, 'index.html') + (deko !== '' ? '?deko=' + deko : '');
await page.goto(url);
await page.waitForFunction(() => window.BSSalon && window.BSGame && window.BSFx, null, { timeout: 30000 });
await page.waitForTimeout(800);
const W = (ms) => page.waitForTimeout(ms);
const outDir = path.join(root, 'tests', 'shots', 'deko', perfMode ? 'perf' : label);
fs.mkdirSync(outDir, { recursive: true });
const shot = async (name) => { await page.screenshot({ path: path.join(outDir, name + '.png') }); console.log('shot', name); };

// ---------------------------------------------------------------- Szenen-Helfer (nur öffentliche Spiel-API, alt + neu gleich)
const setState = (st) => page.evaluate((st) => { const S = window.BSSalon; S.state = st; S.buildUI(); }, st);
const tapLabel = (re) => page.evaluate((re) => { const b = window.BSSalon.buttons.find(x => new RegExp(re).test(x.label || '')); if (b) b.onTap(); return !!b; }, re);
const styleBear = () => page.evaluate(() => {
  const S = window.BSSalon, A = window.BSArt, b = S.baer;
  b.fellIdx = 0; b.fell = A.MODELS[0].fell; b.frisur = 'lockig'; b.haar = A.HAAR[0];
  b.acc.schleife = 0; b.acc.hut = null; b.acc.kette = null; b.acc.brille = null;
  b.makeup.rouge = '#ff9eb5';
  b.lack = { L0: '#e91e63', L1: '#f39c12', L2: '#9b59b6', R0: '#e91e63', R1: '#f39c12', R2: '#9b59b6' };
});
// synthetisches Rubbeln (PointerEvents auf dem Canvas, wie ein Finger) über dem Bärenbauch
const rubStart = () => page.evaluate(() => {
  const cv = document.getElementById('cv'), G = window.BSGame;
  const ev = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true }));
  const c = () => G.worldToScreen(450, 420);
  let k = 0; const p0 = c(); ev('pointerdown', p0[0] + 40, p0[1]);
  window.__rub = setInterval(() => { const p = c(), a = k++ * 0.35; ev('pointermove', p[0] + Math.cos(a) * 46, p[1] + Math.sin(a) * 34); }, 33);
  window.__rubEnd = () => { clearInterval(window.__rub); const p = c(); ev('pointerup', p[0], p[1]); };
});
const rubStop = () => page.evaluate(() => { if (window.__rubEnd) window.__rubEnd(); window.__rubEnd = null; });
const pinTier = (tier) => page.evaluate((tier) => {
  if (tier === 'auto') return;
  window.BSGame.perf.warm = -1e9; window.BSFx.Q.tier = +tier; window.dispatchEvent(new Event('resize'));
}, tier);

// ---------------------------------------------------------------- Screenshots
if (mode === 'shots') {
  await styleBear();
  if (want('menu')) { await setState('menu'); await W(1600); await shot('01-menu'); }
  if (want('wahl')) { await setState('wahl'); await W(2400); await shot('02-wahl'); }
  if (want('waschen')) {
    await setState('waschen'); await W(1300); await tapLabel('Seife'); await W(150); await tapLabel('Seife');
    await rubStart(); await W(1300); await shot('03-waschen-schaum'); await rubStop();
    await tapLabel('Dusche'); await W(650); await shot('04-waschen-dusche'); await W(2200); await shot('05-waschen-fertig');
  }
  if (want('foehnen')) { await setState('foehnen'); await W(1300); await page.evaluate(() => { window.BSSalon.foehn = true; }); await W(900); await shot('06-foehnen');
    await page.evaluate(() => { window.BSSalon.foehn = false; }); }
  if (want('spa')) { await setState('spa'); await W(1300); await shot('07-spa'); }
  if (want('aquarium')) { await setState('aquarium'); await W(1500); await tapLabel('Futter'); await W(800); await shot('08-aquarium'); }
  if (want('zirkus')) {
    await setState('zirkus'); await W(900);
    await page.evaluate(() => { const S = window.BSSalon; S.zirkus.bälle = [{ c: '#e74c3c' }, { c: '#f4c20d' }, { c: '#3498db' }]; S.buildUI(); });
    await W(1200); await shot('09-zirkus');
  }
  if (want('disco')) { await setState('disco'); await W(1400); await shot('10-disco'); }
  if (want('finale')) {
    await setState('finish'); await W(1000); await page.evaluate(() => window.BSSalon.startFinale());
    await W(1500); await shot('11-finale-wisch'); await W(1500); await shot('12-finale-tada'); await W(4200); await shot('13-finale-feier');
  }
}

// ---------------------------------------------------------------- Leistung (gedrosselt, Bildrate ungebremst → Intervall = Kosten je Bild)
if (perfMode) {
  const thr = +arg('throttle', '4'), secs = +arg('secs', '10.5'), tier = arg('tier', '2');
  const cdp = await ctx.newCDPSession(page);
  await styleBear(); await pinTier(tier);
  const res = { label, src, deko, tier, throttle: thr, vsync, raster: sw ? 'software' : 'gpu', secs, viewport: land ? '915x412' : '412x915@2', scenes: {} };
  const measure = async (name, driver) => {
    await page.evaluate(() => { const P = window.__perf; P.iv = []; P.work = []; P.tiers = []; P.parts = []; P.last = 0; P.on = true; });
    const t0 = Date.now(); await driver(secs * 1000); const el = Date.now() - t0;
    if (el < secs * 1000) await W(secs * 1000 - el);
    const r = await page.evaluate(() => {
      const P = window.__perf; P.on = false;
      const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * f))].toFixed(2) : null; };
      const avg = (a) => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : null;
      return { frames: P.iv.length, p50: q(P.iv, 0.5), p95: q(P.iv, 0.95), p99: q(P.iv, 0.99), workP50: q(P.work, 0.5), workP95: q(P.work, 0.95),
        tierEnd: P.tiers[P.tiers.length - 1], tierMin: Math.min.apply(null, P.tiers), partsAvg: avg(P.parts), partsMax: Math.max.apply(null, P.parts) };
    });
    res.scenes[name] = r; console.log('PERF', label, name, JSON.stringify(r));
  };
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr || 1 });
  if (want('menu')) { await setState('menu'); await W(1500); await measure('menu', async () => {}); }
  if (want('waschen')) {
    await setState('waschen'); await W(1500);
    await measure('waschen', async (ms) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms - 600) {
        await tapLabel('Seife'); await tapLabel('Seife'); await rubStart(); await W(1800); await rubStop();
        await tapLabel('Dusche'); await W(2000);
      }
    });
  }
  if (want('aquarium')) {
    await setState('aquarium'); await W(1500);
    await measure('aquarium', async (ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms - 300) { await tapLabel('Futter'); await W(1400); } });
  }
  if (want('finale')) {
    await setState('finish'); await W(1200);
    await measure('finale', async () => { await page.evaluate(() => window.BSSalon.startFinale()); });
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  res.errors = errors.concat((await page.evaluate(() => window.__errors || [])).map(e => 'window.__errors: ' + e));
  fs.writeFileSync(path.join(outDir, label + '.json'), JSON.stringify(res, null, 2));
}
if (!perfMode) {
  const errs = errors.concat((await page.evaluate(() => window.__errors || [])).map(e => 'window.__errors: ' + e));
  fs.writeFileSync(path.join(outDir, 'errors.json'), JSON.stringify(errs, null, 2));
  console.log('errors', errs.length, errs.slice(0, 5));
} else console.log('errors', errors.length, errors.slice(0, 5));
await browser.close();
