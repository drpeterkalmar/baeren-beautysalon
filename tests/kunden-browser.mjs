// DEV-TOOL (r22): Browser-Abnahme der Kundenbesuche — echte Touch-Taps, Bildfolgen für die Sichtprüfung, 0 Fehler.
// Aufruf: node tests/kunden-browser.mjs <label> [--land] [--query=?kunden=1] [--speicher=JSON]
// Ablauf: Menü → „Kunde kommt!“ → Hereinlaufen (Bildfolge) → Wunsch-Blase → Wunsch-Knopf → Handlung (Häkchen) →
// andere Station (Leiste + Reiter-Marken) → 💭 → zweiter Wunsch → 💭 → „Fertig!“ → Finale → Menü → Album (ab E3).
// Uhr und Zufall fest (wie tests/touch-check.mjs). Ausgabe: tests/shots/r22/<label>/*.png + report.json
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
const land = process.argv.includes('--land'), query = arg('query', ''), speicher = arg('speicher', '');
const outDir = path.join(root, 'tests', 'shots', 'r22', label);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-gpu', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const out = { label, land, query, steps: [], errors: [], kleineKnoepfe: [], vibrate: [] };
try {
  const ctx = await browser.newContext({
    viewport: land ? { width: 915, height: 412 } : { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36'
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => out.errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') out.errors.push('console: ' + m.text()); });
  await page.clock.install({ time: new Date('2026-10-10T10:00:00') });
  await page.clock.pauseAt(new Date('2026-10-10T10:00:01'));
  await page.addInitScript((speicher) => {
    try { localStorage.clear(); if (speicher) { const o = JSON.parse(speicher); for (const k in o) localStorage.setItem(k, o[k]); } } catch (e) {}
    let s = 20261010;
    Math.random = function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.__vib = []; try { Object.defineProperty(navigator, 'vibrate', { value: (p) => { window.__vib.push([performance.now(), p]); return true; }, configurable: true }); } catch (e) {}
  }, speicher);
  await page.goto('file://' + path.join(root, 'index.html') + query);
  await page.clock.runFor(1500);
  await page.waitForFunction(() => window.BSSalon && window.BSGame && window.BSArt, null, { timeout: 30000 });
  await page.evaluate(() => { window.BSGame.perf.warm = -1e9; window.BSFx.Q.tier = 2; window.dispatchEvent(new Event('resize')); });
  await page.clock.runFor(600);

  const run = (ms) => page.clock.runFor(ms);
  let n = 0;
  const shot = async (name) => { n++; const f = String(n).padStart(2, '0') + '-' + name + '.png'; await page.screenshot({ path: path.join(outDir, f) });
    const st = await page.evaluate(() => { const S = window.BSSalon, K = window.BSKunden, B = K && K.besuch;
      const klein = S.buttons.filter(b => b.r && (b.r.w < 48 || b.r.h < 48)).map(b => (b.label || b.nav || b.tab || '?') + ' ' + Math.round(b.r.w) + '×' + Math.round(b.r.h));
      return { state: S.state, besuch: B ? { idx: B.idx, wuensche: B.wuensche, erfuellt: Object.keys(B.erfuellt), fertig: B.fertig } : null, klein, errors: window.__errors.slice() }; });
    out.steps.push({ shot: f, ...st }); if (st.klein.length) out.kleineKnoepfe.push(f + ': ' + st.klein.join(', ')); };
  const tapAt = async (p) => { await page.touchscreen.tap(p[0], p[1]); await run(150); };
  const btnPos = (re) => page.evaluate((re) => { const b = window.BSSalon.buttons.find(x => x.r && new RegExp(re).test(x.label || x.nav || '')); return b ? [b.r.x + b.r.w / 2, b.r.y + b.r.h / 2] : null; }, re);
  const tapBtn = async (re) => { const p = await btnPos(re); if (p) await tapAt(p); else out.errors.push('Knopf fehlt: ' + re); return !!p; };
  const tapWorld = async (x, y) => { const p = await page.evaluate(([x, y]) => window.BSGame.worldToScreen(x, y), [x, y]); await tapAt(p); };

  await shot('menu');
  await tapBtn('Kunde kommt');
  for (const ms of [250, 300, 300]) { await run(ms); await shot('einlauf'); }
  await run(700); await shot('blase');
  // Wunsch-Knopf 1 → Station, eine Handlung (erstes Werkzeug oder Tippen auf den Bären)
  const w = await page.evaluate(() => window.BSKunden.besuch.wuensche);
  await tapBtn('^' + (await page.evaluate((id) => { const s = window.BSKunden.station(id); return s.icon; }, w[0])));
  await run(900); await shot('station-' + w[0]);
  const werk = await page.evaluate(() => { const b = window.BSSalon.buttons.find(x => x.r && x._zone === 'tray' && !x.hold); return b ? [b.r.x + b.r.w / 2, b.r.y + b.r.h / 2] : null; });
  if (werk) await tapAt(werk); else await tapWorld(450, 380);
  await page.evaluate(() => { const K = window.BSKunden; if (!K.besuch.erfuellt[window.BSSalon.state]) K.aktion(); });
  await run(250); await shot('erfuellt-' + w[0]);
  await run(900);
  // eine nicht gewünschte Station über die Reiter: Leiste + Marken sichtbar
  const andere = await page.evaluate(() => { const K = window.BSKunden; return window.BSSalon.STATIONS.map(s => s.id).find(id => !K.besuch.wuensche.includes(id) && id !== 'finish' && id !== window.BSSalon.state); });
  await page.evaluate((id) => window.BSSalon.setState(id), andere); await run(900); await shot('andere-' + andere);
  await tapBtn('^💭$'); await run(900); await shot('wunsch2-' + w[1]);
  await page.evaluate(() => window.BSKunden.aktion()); await run(400); await shot('beide-erfuellt');
  await tapBtn('^💭$'); await run(900); await shot('fertig-station');
  await tapBtn('Fertig!'); await run(5600); await shot('finale');
  await tapBtn('Nächster Kunde'); await run(1800); await shot('naechster-kunde');
  out.vibrate = await page.evaluate(() => window.__vib);
  out.windowErrors = await page.evaluate(() => window.__errors.slice());
} catch (e) { out.errors.push('skript: ' + (e && e.stack || e)); }
await browser.close();
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ label, shots: out.steps.length, errors: out.errors, windowErrors: out.windowErrors, kleineKnoepfe: out.kleineKnoepfe }, null, 1));
process.exit(out.errors.length ? 1 : 0);
