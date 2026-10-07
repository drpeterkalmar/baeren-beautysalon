// DEV-TOOL (Umbau 20.4): Touch-Abnahme der umgezogenen Stationen im Browser, vorher/nachher vergleichbar.
// Aufruf: node tests/touch-check.mjs <label> [--src=DIR] [--land]
// Echte Touch-Taps (page.touchscreen) auf die Hit-Boxen und Ziehen per PointerEvent (wie ein Finger): Album-Kachel
// laden, Zauberstab, Pfoten lackieren, Kerzen, Paket, Ballon pusten + platzen, Malbuch-Flächen/Rahmen,
// Zuckerwatte spinnen + Stab ziehen, Teig ausrollen + ausstechen, Schaum rubbeln + Dusche, Massage-Streicheln.
// Hit-Boxen: neu aus der Registry (S.REG[id].hit()), alt aus den S._…-Variablen (nach dem Zeichnen gesetzt).
// Uhr und Zufall fest wie tests/umbau-shots.mjs → zwei Läufe desselben Stands liefern dieselbe Ausgabe.
// Ausgabe: tests/shots/umbau/touch-<label>.json (Zustand nach jedem Schritt) – mit dem anderen Stand vergleichen.
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
const outDir = path.join(root, 'tests', 'shots', 'umbau');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-gpu', '--autoplay-policy=no-user-gesture-required'] });
const out = { label, land, steps: [], errors: [] };
try {
  const ctx = await browser.newContext({
    viewport: land ? { width: 915, height: 412 } : { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36'
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => out.errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') out.errors.push('console: ' + m.text()); });
  await page.clock.install({ time: new Date('2026-10-05T10:00:00') });
  await page.clock.pauseAt(new Date('2026-10-05T10:00:01'));
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (e) {}
    let s = 0;
    window.__seed = (n) => { s = n >>> 0; };
    window.__seed(20261005);
    const K = 1000 / 960, pn = performance.now.bind(performance), raf = window.requestAnimationFrame.bind(window);
    performance.now = () => pn() * K;
    window.requestAnimationFrame = (cb) => raf((ts) => cb(ts * K));
    Math.random = function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    // Hit-Box: neu aus der Registry, alt aus der beim Zeichnen gesetzten Variable
    const OLD = { album: '_albumBoxes', zauberstab: '_stabHitZ', paket: '_pakHit', flaechen: '_mbHit', rahmen: '_mbFrame',
      stab: '_stabHit', wolle: '_wolleHit', ballon: '_ballHit', teig: '_teigHit', brause: '_brause' };
    window.__hit = (id, name) => { const S = window.BSSalon, R = S.REG && S.REG[id];
      return R && R.hit ? R.hit()[name] : S[OLD[name]]; };
    const r2 = (v) => typeof v === 'number' ? Math.round(v * 100) / 100 : v;
    const clean = (o, d) => { if (d > 4 || o == null) return o; if (Array.isArray(o)) return o.slice(0, 40).map(x => clean(x, d + 1));
      if (typeof o === 'object') { if (o instanceof HTMLCanvasElement || o.getContext) return '[canvas]'; const r = {};
        for (const k of Object.keys(o).sort()) { if (k[0] === '_' || typeof o[k] === 'function') continue; r[k] = clean(o[k], d + 1); } return r; }
      return r2(o); };
    window.__snap = (keys) => { const S = window.BSSalon, b = S.baer || {}, r = { state: S.state,
      baer: clean({ lack: b.lack, acc: b.acc, sticker: b.sticker, makeup: b.makeup, schaum: b.schaum, fluff: b.fluff,
        tropfen: (b.tropfen || []).length, frisur: b.frisur, haar: b.haar, fellIdx: b.fellIdx, gurkeL: b.gurkeL, gurkeR: b.gurkeR, relax: b.relax }, 0),
      album: clean(S.album, 0), knoepfe: (S.buttons || []).map(x => x.label || x.fill || '').join('|'), partikel: window.BSFx.P.count() };
      for (const k of keys || []) r[k] = clean(S[k], 0);
      return r; };
  });
  await page.goto('file://' + path.join(src, 'index.html'));
  await page.clock.runFor(1500);
  await page.waitForFunction(() => window.BSSalon && window.BSGame && window.BSArt, null, { timeout: 30000 });
  await page.evaluate(() => { window.BSGame.perf.warm = -1e9; window.BSFx.Q.tier = 2; window.dispatchEvent(new Event('resize')); });
  await page.clock.runFor(300);

  const run = (ms) => page.clock.runFor(ms);
  const toScreen = (x, y) => page.evaluate(([x, y]) => window.BSGame.worldToScreen(x, y), [x, y]);
  const tapWorld = async (x, y) => { const p = await toScreen(x, y); await page.touchscreen.tap(p[0], p[1]); await run(120); };
  const tapBox = async (b) => { if (!b) return false; if (Array.isArray(b) && typeof b[0] === 'number') await tapWorld(b[0], b[1]);
    else if (b.r !== undefined && b.w === undefined) await tapWorld(b.x, b.y); else await tapWorld(b.x + b.w / 2, b.y + b.h / 2); return true; };
  const tapBtn = async (re) => { const p = await page.evaluate((re) => { const b = window.BSSalon.buttons.find(x => x.r && new RegExp(re).test(x.label || x.fill || ''));
    return b ? [b.r.x + b.r.w / 2, b.r.y + b.r.h / 2] : null; }, re); if (p) { await page.touchscreen.tap(p[0], p[1]); await run(150); } return !!p; };
  // Ziehen wie ein Finger: PointerEvents in Welt-Koordinaten (pointerId fest, je Bewegung ein Bild)
  const drag = async (pts) => {
    const sc = []; for (const [x, y] of pts) sc.push(await toScreen(x, y));
    const ev = (type, p) => page.evaluate(([type, x, y]) => document.getElementById('cv').dispatchEvent(new PointerEvent(type,
      { pointerId: 7, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true })), [type, p[0], p[1]]);
    await ev('pointerdown', sc[0]); await run(17);
    for (const p of sc.slice(1)) { await ev('pointermove', p); await run(17); }
    await ev('pointerup', sc[sc.length - 1]); await run(100);
  };
  const enter = async (id, seed) => { await page.evaluate(([id, seed]) => { window.__seed(seed); const S = window.BSSalon; S.state = id; S.buildUI(); }, [id, seed]); await run(900); };
  const step = async (name, keys, extra) => { await run(200); const s = await page.evaluate((k) => window.__snap(k), keys || []);
    if (extra) s.extra = await page.evaluate(extra); s.name = name; out.steps.push(s); console.log('step', name); };
  const kreis = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i * 0.35) * rx, cy + Math.sin(i * 0.35) * ry]);

  // Bär wählen (echter Tap auf die erste Kachel)
  await page.evaluate(() => { window.__seed(11); const S = window.BSSalon; S.state = 'wahl'; S.buildUI(); }); await run(1200);
  const g0 = await page.evaluate(() => { const G = window.BSUI.L.grid; return [G.x + 40, G.y + 50]; });
  await page.touchscreen.tap(g0[0], g0[1]); await run(1000);
  await step('wahl→waschen');

  // Waschen: Seife, rubbeln, Dusche (Duschstrahl kommt von der Brause)
  await enter('waschen', 101);
  await tapBtn('Seife'); await tapBtn('Seife');
  await drag(kreis(450, 420, 46, 34, 40));
  await step('waschen-schaum');
  await tapBtn('Dusche'); await run(400);
  await step('waschen-dusche', [], () => { const b = window.__hit('waschen', 'brause'); return { brause: b && b.map(v => Math.round(v)) }; });
  await run(2500); await step('waschen-fertig');

  // Pfoten: drei Krallen antippen (Farbe Lila vorher wählen)
  await enter('pfoten', 102);
  await tapBtn('#9b59b6');
  for (const k of [[-71, 175], [-55, 175], [55, 175]]) await tapWorld(450 + k[0] * 600 / 420, 348 + k[1] * 600 / 420);
  await step('pfoten-lack');

  // Massage: Streicheln (Ziehen über den Bauch)
  await enter('massage', 103);
  await drag(kreis(450, 448, 60, 50, 40));
  await step('massage', ['mass']);

  // Zuckerwatte: Wolle antippen (spinnt), dann Stab zum Bären ziehen
  await enter('zuckerwatte', 104);
  for (let i = 0; i < 4; i++) { await tapBox(await page.evaluate(() => window.__hit('zuckerwatte', 'wolle'))); await run(300); }
  await step('watte-gesponnen', ['watte']);
  const st = await page.evaluate(() => window.__hit('zuckerwatte', 'stab'));
  if (st) { const x0 = st.x + st.w / 2, y0 = st.y + st.h / 2; await drag(Array.from({ length: 30 }, (_, i) => [x0 + (450 - x0) * i / 29, y0 + (300 - y0) * i / 29])); }
  await run(600); await step('watte-gezogen', ['watte']);

  // Ballon: pusten bis fertig, dann den schwebenden Ballon antippen (platzt)
  await enter('ballon', 105);
  for (let i = 0; i < 6; i++) { await tapBtn('Pusten'); await run(150); }
  await run(1200); await step('ballon-fertig', ['ballon']);
  await tapBox(await page.evaluate(() => window.__hit('ballon', 'ballon'))); await run(600);
  await step('ballon-geplatzt', ['ballon']);

  // Zauber: Spruch wählen, Zauberstab antippen
  await enter('zauber', 106);
  await tapBtn('Blüten'); await run(300);
  await tapBox(await page.evaluate(() => window.__hit('zauber', 'zauberstab'))); await run(400);
  await step('zauberstab', ['zauber']);

  // Geschenke: Paket zweimal antippen
  await enter('geschenke', 107);
  for (let i = 0; i < 3; i++) { await tapBox(await page.evaluate(() => window.__hit('geschenke', 'paket'))); await run(300); }
  await run(800); await step('paket', ['geschenk']);

  // Kekse: Teig ausrollen (Ziehen über den Teig), dann Form wählen und ausstechen (Tap auf den Teig)
  await enter('keks', 108);
  const tg = await page.evaluate(() => window.__hit('keks', 'teig'));
  if (tg) await drag(Array.from({ length: 40 }, (_, i) => [tg.x + tg.w * (0.2 + 0.6 * ((i % 10) / 9)), tg.y + tg.h / 2]));
  await step('teig-gerollt', ['keks']);
  await tapBtn('Stern'); await tapBox(await page.evaluate(() => window.__hit('keks', 'teig'))); await run(500);
  await step('teig-gestochen', ['keks']);

  // Geburtstag: Kerzen anzünden, dann auspusten (Tap auf den Kuchen)
  await enter('geburtstag', 109);
  await tapBtn('anzünden'); await run(400); await step('kerzen-an', ['kuchen']);
  await tapWorld(450, 300); await run(400); await step('kerzen-tap', ['kuchen']);

  // Malbuch: zwei Flächen färben, Rahmen antippen
  await enter('malbuch', 110);
  await tapBtn('#3498db');
  const fl = await page.evaluate(() => window.__hit('malbuch', 'flaechen'));
  if (fl && fl.length) { await tapBox(fl[0]); await tapBox(fl[Math.min(3, fl.length - 1)]); }
  const rh = await page.evaluate(() => window.__hit('malbuch', 'rahmen'));
  if (rh) await tapWorld(rh.x + 6, rh.y + 6);
  await step('malbuch', ['mb']);

  // Foto: Klick, Hut aufsetzen (Schmücken), zweites Foto, dann Album-Kachel 1 laden (P1-1: Kachel unverändert)
  await enter('foto', 111);
  await tapBtn('Klick'); await run(1500); await step('foto-1');
  await enter('schmuecken', 112); await tapBtn('Hut'); await run(300);
  await enter('foto', 113); await tapBtn('Klick'); await run(1500); await step('foto-2');
  const ab = await page.evaluate(() => window.__hit('foto', 'album'));
  if (ab && ab.length) await tapBox(ab[0]);
  await run(500); await step('album-geladen');
  await enter('schmuecken', 114); await tapBtn('Kette'); await run(300);
  await step('nach-laden-geschmueckt');
  // 🏠 → Menü (P1-2: „Weiter mit meinem Bären“ in derselben Sitzung)
  await tapBtn('🏠'); await run(800); await step('menu-nach-home');

  out.errors = out.errors.concat((await page.evaluate(() => window.__errors || [])).map(e => 'window.__errors: ' + e));
} finally {
  fs.writeFileSync(path.join(outDir, 'touch-' + label + '.json'), JSON.stringify(out, null, 1));
  console.log('errors', out.errors.length, out.errors.slice(0, 5));
  await browser.close();
}
