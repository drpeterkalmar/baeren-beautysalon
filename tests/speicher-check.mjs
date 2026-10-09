// DEV-TOOL (r21): Canvas-Speicher einer typischen Sitzung, für alten und neuen Stand GLEICH gezählt.
// Aufruf: node tests/speicher-check.mjs <label> [--src=DIR] [--query=post=0] [--land] [--tier=2]
// Zählt ALLE lebenden Canvases (Hook auf document.createElement('canvas'), WeakRef + window.gc() vor jeder Zählung), also
// Bildschirm-Canvas, Raum-Cache, Ersatz-Raum, Sprites, Thumbnails, Album, Glow-Leinwand und den Zeichenpuffer des
// WebGL-Endbilds. Dazu kommen beim Endbild die WebGL-Texturen/Puffer (BSGame.canvasMem().postGpu ohne den Zeichenpuffer,
// der schon als Canvas gezählt ist). Interne Kopien des Browsers (Compositor, Doppelpuffer) sieht keiner der Werte.
// Ablauf wie tests/unit/speicher.test.mjs: Menü → Wahl → 3 Bären mit Foto → alle 24 Stationen → Finale → Menü.
// Ausgabe: tests/perf/r21/speicher_<label>.json (Spitze und Ende in Megapixel; × 4 = MB)
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const pwDir = [process.env.PW_DIR, path.join(process.env.HOME || '', '.cache/r18-pw/node_modules')].filter(Boolean)
  .find(d => fs.existsSync(path.join(d, 'playwright')));
const { chromium } = require(path.join(pwDir, 'playwright'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const label = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'run';
const src = path.resolve(arg('src', root)), query = arg('query', ''), land = process.argv.includes('--land'), tier = +arg('tier', '2');

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
  '--enable-gpu', '--mute-audio', '--js-flags=--expose-gc'] });
let res;
try {
  const ctx = await browser.newContext({ viewport: land ? { width: 915, height: 412 } : { width: 412, height: 915 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (e) {}
    let s = 20261009 >>> 0;
    Math.random = function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const refs = window.__cvRefs = [], ce = Document.prototype.createElement;
    Document.prototype.createElement = function (n, o) { const el = ce.call(this, n, o); if (String(n).toLowerCase() === 'canvas') refs.push(new WeakRef(el)); return el; };
    window.__zaehle = () => {
      if (window.gc) { window.gc(); window.gc(); }
      let px = 0, n = 0, groesste = [];
      for (const r of refs) { const c = r.deref(); if (!c) continue; const p = c.width * c.height; if (p > 1) { px += p; n++; groesste.push(p); } }
      const domCv = document.getElementById('cv'); // im HTML angelegt (nicht über createElement)
      if (domCv) { px += domCv.width * domCv.height; n++; groesste.push(domCv.width * domCv.height); }
      const G = window.BSGame, m = G && G.canvasMem ? G.canvasMem() : {}, PO = window.BSPost;
      let gpuExtra = 0;
      if (m.postGpu && PO && PO.masseJetzt) gpuExtra = m.postGpu - PO.masseJetzt.ow * PO.masseJetzt.oh; // Zeichenpuffer zählt schon als Canvas
      groesste.sort((a, b) => b - a);
      return { canvases: n, px, gpuExtra, gesamt: px + gpuExtra, groesste: groesste.slice(0, 6), canvasMem: m };
    };
  });
  await page.goto('file://' + path.join(src, 'index.html') + (query ? '?' + query : ''));
  await page.waitForFunction(() => window.BSSalon && window.BSGame && window.BSArt, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.evaluate((t) => { window.BSGame.perf.warm = -1e9; window.BSFx.Q.tier = t; window.dispatchEvent(new Event('resize')); }, tier);
  const W = (ms) => page.waitForTimeout(ms);
  const go = (st) => page.evaluate((st) => { const S = window.BSSalon; S.state = st; S.buildUI(); }, st);
  const punkte = [];
  const zaehle = async (wo) => { const z = await page.evaluate(() => window.__zaehle()); z.wo = wo; punkte.push(z); console.log(wo, (z.gesamt / 1e6).toFixed(2), 'MP', z.canvases, 'Canvases'); };
  await W(800); await zaehle('menu');
  await go('wahl'); await W(3500); await zaehle('wahl');
  for (const idx of [4, 9, 2]) {
    await page.evaluate((i) => window.BSSalon.chooseBear(i), idx); await W(700);
    await go('foto'); await W(600);
    await page.evaluate(() => { const b = window.BSSalon.buttons.find(x => /Klick!/.test(x.label || '')); if (b) b.onTap(); }); await W(900);
  }
  await zaehle('3 Bären + Fotos');
  const ids = await page.evaluate(() => window.BSSalon.STATIONS.map(s => s.id));
  for (const id of ids) { await go(id); await W(450); }
  await zaehle('alle Stationen');
  await go('finish'); await W(600); await page.evaluate(() => window.BSSalon.startFinale()); await W(7000);
  await zaehle('Finale');
  await go('menu'); await W(4000); await zaehle('zurück im Menü');
  const spitze = punkte.reduce((a, b) => (b.gesamt > a.gesamt ? b : a));
  res = { label, src, query, land, tier, spitzeMP: +(spitze.gesamt / 1e6).toFixed(2), spitzeWo: spitze.wo, endeMP: +(punkte[punkte.length - 1].gesamt / 1e6).toFixed(2),
    punkte, errors: errors.concat(await page.evaluate(() => window.__errors || [])) };
} finally { await browser.close(); }
const out = path.join(root, 'tests', 'perf', 'r21');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'speicher_' + label + '.json'), JSON.stringify(res, null, 2));
console.log('SPEICHER', label, 'Spitze', res.spitzeMP, 'MP (' + res.spitzeWo + ') =', (res.spitzeMP * 4).toFixed(0), 'MB; Ende', res.endeMP, 'MP; Fehler', res.errors.length);
