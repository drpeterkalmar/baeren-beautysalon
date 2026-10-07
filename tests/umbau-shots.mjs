// DEV-TOOL (Umbau 20.4): reproduzierbare Screenshots aller 24 Stationen für den Pixel-Vergleich vorher/nachher.
// Aufruf: node tests/umbau-shots.mjs <label> [--src=DIR] [--land] [--only=a,b]
// Uhr und Zufall sind fest (Playwright page.clock, auf genau 60 Hz gestreckt, + Zufall je Station neu gesät): zwei Läufe desselben Stands
// liefern dieselben Bilder, Unterschiede kommen nur aus dem Code. Bär voll gestylt (Hut, Schleife, Kette,
// 6 Lackkrallen, Sticker, Make-up, Frisur), Eisdiele mit zwei Kugeln.
// Ausgabe: tests/shots/umbau/<label>/st-NN-<id>.png + errors.json
// Vergleich: python3 tests/pixel-diff.py tests/shots/umbau/A tests/shots/umbau/B --max=1.0
import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const npmRoot = () => { try { return execSync('npm root -g').toString().trim(); } catch (e) { return ''; } };
const pwDir = [process.env.PW_DIR, path.join(process.env.HOME || '', '.cache/r18-pw/node_modules'), npmRoot()].filter(Boolean)
  .find(d => fs.existsSync(path.join(d, 'playwright')));
if (!pwDir) { console.error('Playwright nicht gefunden: PW_DIR=<ordner mit node_modules/playwright> setzen'); process.exit(2); }
const { chromium } = require(path.join(pwDir, 'playwright'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'run';
const src = path.resolve(arg('src', root)), land = process.argv.includes('--land');
const only = (arg('only', '') || '').split(',').filter(Boolean);
const outDir = path.join(root, 'tests', 'shots', 'umbau', label);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-gpu', '--autoplay-policy=no-user-gesture-required'] });
try {
  const ctx = await browser.newContext({
    viewport: land ? { width: 915, height: 412 } : { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36'
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.clock.install({ time: new Date('2026-10-05T10:00:00') });
  await page.clock.pauseAt(new Date('2026-10-05T10:00:01')); // Uhr steht, läuft nur per runFor
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (e) {}
    let s = 0;
    window.__seed = (n) => { s = n >>> 0; };
    window.__seed(20261005);
    // page.clock tickt rAF alle 16 ms; Spielzeit um 1000/960 strecken → genau 60 Hz (1/60 s je Bild) wie am Handy
    const K = 1000 / 960, pn = performance.now.bind(performance), raf = window.requestAnimationFrame.bind(window);
    performance.now = () => pn() * K;
    window.requestAnimationFrame = (cb) => raf((ts) => cb(ts * K));
    Math.random = function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  });
  await page.goto('file://' + path.join(src, 'index.html'));
  await page.clock.runFor(1500);
  await page.waitForFunction(() => window.BSSalon && window.BSGame && window.BSArt, null, { timeout: 30000 });
  // Qualitätsstufe fest auf 2 (die Automatik misst echte Zeit, hier ist die Uhr gefälscht)
  await page.evaluate(() => { window.BSGame.perf.warm = -1e9; window.BSFx.Q.tier = 2; window.dispatchEvent(new Event('resize')); });
  await page.clock.runFor(300);
  const ids = await page.evaluate(() => window.BSSalon.STATIONS.map(s => s.id));
  await page.evaluate(() => {
    const S = window.BSSalon, A = window.BSArt;
    S.state = 'waschen'; S.buildUI();
    const b = S.baer;
    b.fellIdx = 3; b.fell = A.MODELS[3].fell; b.frisur = 'lockig'; b.haar = '#c0392b';
    b.acc.hut = A.HUTE[0]; b.acc.schleife = A.SCHLEIFEN[1]; b.acc.kette = A.KETTEN[0]; b.acc.brille = null;
    b.makeup = Object.assign(b.makeup || {}, { rouge: '#ff9eb5' });
    b.lack = { L0: '#e91e63', L1: '#f39c12', L2: '#9b59b6', R0: '#3498db', R1: '#2ecc71', R2: '#ffffff' };
    b.sticker = [{ typ: 'herz', ziel: 'L1', farbe: '#e91e63' }, { typ: 'stern', ziel: 'R0', farbe: '#f1c40f' }];
  });
  let n = 1;
  for (const id of ids) {
    const name = 'st-' + String(n++).padStart(2, '0') + '-' + id;
    if (only.length && !only.includes(id)) continue;
    await page.evaluate((id) => {
      const S = window.BSSalon; window.__seed(1000 + id.length * 7 + id.charCodeAt(0));
      S.state = id; S.buildUI();
      if (id === 'eis') S.eis = { waffel: 0, kugeln: [{ c: 1, scale: 1 }, { c: 3, scale: 1 }], leck: true };
    }, id);
    await page.clock.runFor(1100);
    await page.screenshot({ path: path.join(outDir, name + '.png') });
    console.log('shot', name);
  }
  const errs = errors.concat((await page.evaluate(() => window.__errors || [])).map(e => 'window.__errors: ' + e));
  fs.writeFileSync(path.join(outDir, 'errors.json'), JSON.stringify(errs, null, 2));
  console.log('errors', errs.length, errs.slice(0, 5));
} finally { await browser.close(); }
