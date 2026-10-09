// DEV-TOOL: Live-Check gegen GitHub Pages (oder --url=…): Version, HTTP-Status aller Requests, 0 Fehler,
// kurzer Rundgang (Menü → Waschen → Aquarium → Finale), Screenshots nach tests/shots/deko/live/.
// Aufruf: node tests/live-check.mjs [--expect=20.1] [--url=https://…] [--land]
import { createRequire } from 'module';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
// Playwright: $PW_DIR, ~/.cache/r18-pw (lokal installiert) oder global (wie tools/visual-check.mjs)
const npmRoot = () => { try { return execSync('npm root -g').toString().trim(); } catch (e) { return ''; } };
const pwDir = [process.env.PW_DIR, path.join(process.env.HOME || '', '.cache/r18-pw/node_modules'), npmRoot()].filter(Boolean)
  .find(d => fs.existsSync(path.join(d, 'playwright')));
if (!pwDir) { console.error('Playwright nicht gefunden: PW_DIR=<ordner mit node_modules/playwright> setzen'); process.exit(2); }
const { chromium } = require(path.join(pwDir, 'playwright'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const url = arg('url', 'https://drpeterkalmar.github.io/baeren-beautysalon/') + (arg('query', '') ? '?' + arg('query', '') : '');
const expect = arg('expect', ''), land = process.argv.includes('--land');
const out = path.join(root, 'tests', 'shots', 'deko', 'live'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--mute-audio'] });
const ctx = await browser.newContext({ viewport: land ? { width: 915, height: 412 } : { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errs = [], bad = [], media = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
page.on('requestfailed', r => { const f = (r.failure() || {}).errorText || ''; // Medien-Abbruch (Headless ohne AAC-Codec) ist kein Seitenfehler
  if (/\.m4a/.test(r.url()) && /ERR_ABORTED/.test(f)) { media.push(f + ' ' + r.url()); return; } bad.push('failed ' + f + ' ' + r.url()); });
const resp = await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.BSSalon && window.BSGame, null, { timeout: 30000 });
await page.waitForTimeout(1500);
const ver = await page.evaluate(() => window.BS_VERSION || null);
const deko = await page.evaluate(() => !!(window.BSFx && window.BSFx.DEKO));
const tag = land ? 'quer' : 'hoch';
await page.screenshot({ path: path.join(out, tag + '-1-menu.png') });
const st = (s) => page.evaluate((s) => { const S = window.BSSalon; S.state = s; S.buildUI(); }, s);
await st('waschen'); await page.waitForTimeout(1200);
await page.evaluate(() => { const b = window.BSSalon.buttons.find(x => /Seife/.test(x.label || '')); if (b) b.onTap(); });
await page.waitForTimeout(900); await page.screenshot({ path: path.join(out, tag + '-2-waschen.png') });
await st('aquarium'); await page.waitForTimeout(1400); await page.screenshot({ path: path.join(out, tag + '-3-aquarium.png') });
await st('finish'); await page.waitForTimeout(800); await page.evaluate(() => window.BSSalon.startFinale());
await page.waitForTimeout(6500); await page.screenshot({ path: path.join(out, tag + '-4-finale.png') });
errs.push(...(await page.evaluate(() => window.__errors || [])).map(e => 'window.__errors: ' + e));
const ok = resp.status() === 200 && !errs.length && !bad.length && (!expect || ver === expect);
console.log(JSON.stringify({ url, status: resp.status(), version: ver, deko, errors: errs, badRequests: bad, mediaAborted: media.length, ok }));
await browser.close();
process.exit(ok ? 0 : 1);
