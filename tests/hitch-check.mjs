// DEV-TOOL: Ruckler beim Stationswechsel (Raum wird nach der Kamerafahrt neu gebacken) — längstes Bild je Wechsel.
// Aufruf: node tests/hitch-check.mjs [--src=DIR] [--swraster] [--throttle=4]
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.HOME, '.cache/r18-pw/node_modules/playwright'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const src = path.resolve(arg('src', root)), sw = process.argv.includes('--swraster'), thr = +arg('throttle', '4');
const browser = await chromium.launch({ args: sw ? ['--disable-gpu', '--disable-accelerated-2d-canvas', '--disable-gpu-rasterization'] : ['--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('file://' + path.join(src, 'index.html') + (arg('query', '') ? '?' + arg('query', '') : ''));
await page.waitForFunction(() => window.BSSalon && window.BSGame, null, { timeout: 30000 });
await page.waitForTimeout(1200);
await page.evaluate((T) => { window.BSGame.perf.warm = -1e9; window.BSFx.Q.tier = T; window.dispatchEvent(new Event('resize')); }, +arg('tier', '2'));
await page.waitForTimeout(800);
const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
const res = await page.evaluate(async () => {
  const S = window.BSSalon, out = {};
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  for (const st of ['waschen', 'zirkus', 'keks', 'aquarium', 'waschen', 'karussell', 'menu', 'waschen']) {
    let last = 0, mx = 0, run = true;
    const f = (t) => { if (last) mx = Math.max(mx, t - last); last = t; if (run) requestAnimationFrame(f); };
    requestAnimationFrame(f);
    S.state = st; S.buildUI(); await wait(2200); run = false;
    out[st + '#' + Object.keys(out).length] = +mx.toFixed(1);
  }
  return out;
});
const v = Object.values(res).slice(1); console.log(JSON.stringify({ src: path.basename(src), sw, tier: +arg('tier', '2'), mittel: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1), max: Math.max(...v), res, errs }));
await browser.close();
