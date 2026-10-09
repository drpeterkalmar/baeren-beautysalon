// DEV-TOOL (r21 Technik-Nacht): Browser-Abnahme des Kino-Endbilds (post.js) und der Fell-/Stoff-Struktur (relief.js).
// Aufruf: node tests/technik-abnahme.mjs [--browser=chromium|webkit] [--land] [--src=DIR]
// Prüft nacheinander in EINEM Browser (stumm, Chromium über Metal):
//   P1 Endbild an: WebGL2 übersetzt, keine Fehler, Maße je Stufe, 2D-Canvas unsichtbar, Endbild-Canvas sichtbar
//   P2 echtes Tippen geht durch das Endbild hindurch (Weiter-Knopf → nächste Station)
//   P3 Kontextverlust mitten im Spiel → reines 2D (alte Auflösung), Tippen geht weiter, keine Fehler
//   P4 ?post=0 → kein Endbild, Auflösung wie 20.4
//   P5 Stufe 0 → Endbild ruht (2D sichtbar), zurück auf Stufe 2 → läuft wieder
//   P6 Glühen: im Finale wird die Glow-Ebene gefüllt und weichgezeichnet (bloomBilder steigt), im leeren Menü nicht immer
//   F1 Fell-Struktur: Relief-Kacheln gebacken (?fell=0 → keine)
// Ausgabe: tests/perf/r21/abnahme_<browser>_<hoch|quer>.json, Exit-Code 1 bei einem Fehlschlag.
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const pwDir = [process.env.PW_DIR, path.join(process.env.HOME || '', '.cache/r18-pw/node_modules')].filter(Boolean)
  .find(d => fs.existsSync(path.join(d, 'playwright')));
const pw = require(path.join(pwDir, 'playwright'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const BR = arg('browser', 'chromium'), land = process.argv.includes('--land'), src = path.resolve(arg('src', root));
const fmt = land ? 'quer' : 'hoch';
const VW = land ? 915 : 412, VH = land ? 412 : 915;

const launchArgs = BR === 'chromium'
  ? { args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] }
  : {};
const browser = await pw[BR].launch(launchArgs);
const ergebnis = { browser: BR, format: fmt, checks: {}, fehler: [] };
const ok = (k, bed, info) => { ergebnis.checks[k] = { ok: !!bed, info }; console.log((bed ? 'PASS ' : 'FAIL ') + k, JSON.stringify(info)); };

async function seite(query) {
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, hasTouch: true,
    isMobile: BR === 'chromium' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch (e) {}
    // WebKit hat kein --mute-audio: Medien und WebAudio stumm schalten
    try { const P = HTMLMediaElement.prototype, pl = P.play; P.play = function () { this.muted = true; this.volume = 0; return pl.call(this); }; } catch (e) {}
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { const r = AC.prototype.resume; AC.prototype.resume = function () { try { this.suspend(); } catch (e) {} return Promise.resolve(); }; } } catch (e) {}
  });
  await page.goto('file://' + path.join(src, 'index.html') + (query ? '?' + query : ''));
  await page.waitForFunction(() => window.BSSalon && window.BSGame && window.BSFx, null, { timeout: 30000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => { window.BSGame.perf.warm = -1e9; window.BSFx.Q.tier = 2; window.dispatchEvent(new Event('resize')); });
  await page.waitForTimeout(400);
  return { ctx, page, errs };
}
const zustand = (page) => page.evaluate(() => {
  const G = window.BSGame, cv = document.getElementById('cv'), po = document.getElementById('post');
  return { post: G.post ? G.post() : null, cv: [cv.width, cv.height], cvOpacity: cv.style.opacity,
    postCanvas: po ? { w: po.width, h: po.height, display: po.style.display || 'block', pe: getComputedStyle(po).pointerEvents } : null,
    state: window.BSSalon.state, tier: window.BSFx.Q.tier, relief: window.BSRelief ? { an: window.BSRelief.an, kacheln: window.BSRelief.anzahl(), zeitMs: +window.BSRelief.zeit.toFixed(1) } : null,
    errors: window.__errors.slice() };
});
// echtes Tippen auf einen Knopf (Bildschirm-Rechteck aus ui.js)
async function tippe(page, finde) {
  const r = await page.evaluate((f) => { const b = window.BSSalon.buttons.find(x => (f === 'next' ? x.nav === 'next' : new RegExp(f).test(x.label || '')) && x.r);
    return b ? { x: b.r.x + b.r.w / 2, y: b.r.y + b.r.h / 2 } : null; }, finde);
  if (!r) return false;
  await page.touchscreen.tap(r.x, r.y);
  return true;
}

try {
  // ---------------------------------------------------------------- P1 + P2 + P3 + P5 + P6 + F1 (Standard: Endbild an)
  {
    const { ctx, page, errs } = await seite('');
    let z = await zustand(page);
    const m = z.post && z.post.masse;
    ok('P1_endbild_an', z.post && z.post.an === true && !z.post.fehler && z.cvOpacity === '0' && z.postCanvas && z.postCanvas.display !== 'none'
      && z.postCanvas.pe === 'none' && m && m.ow === Math.round(VW * 2) && m.sw === Math.round(VW * 1.6), { post: z.post, cv: z.cv, postCanvas: z.postCanvas });
    // P2: Menü → Wahl → Bär → Waschen per echtem Tippen, dann „weiter“
    await page.evaluate(() => { const S = window.BSSalon; S.state = 'waschen'; S.buildUI(); });
    await page.waitForTimeout(600);
    const st0 = (await zustand(page)).state;
    const getippt = await tippe(page, 'next'); await page.waitForTimeout(700);
    const st1 = (await zustand(page)).state;
    ok('P2_tippen_durch_endbild', getippt && st1 !== st0, { vorher: st0, nachher: st1 });
    // P6: Glühen im Finale
    await page.evaluate(() => { const S = window.BSSalon; S.state = 'finish'; S.buildUI(); });
    await page.waitForTimeout(800);
    const b0 = (await zustand(page)).post.bloomBilder;
    await page.evaluate(() => window.BSSalon.startFinale());
    await page.waitForTimeout(6500);
    z = await zustand(page);
    ok('P6_gluehen_finale', z.post.bloomBilder - b0 > 20, { bloomBilder: z.post.bloomBilder - b0, bilder: z.post.bilder, stimmung: z.post.stimmung });
    // F1: Relief gebacken
    ok('F1_fell_struktur', z.relief && z.relief.kacheln > 0, z.relief);
    // P5: Stufe 0 → ruht, Stufe 2 → läuft
    await page.evaluate(() => { window.BSFx.Q.tier = 0; window.dispatchEvent(new Event('resize')); });
    await page.waitForTimeout(500);
    const z0 = await zustand(page);
    await page.evaluate(() => { window.BSFx.Q.tier = 2; window.dispatchEvent(new Event('resize')); });
    await page.waitForTimeout(300);
    const za = await zustand(page); await page.waitForTimeout(500); const zb = await zustand(page);
    ok('P5_stufe0_ruht', z0.post.ruht === true && z0.cvOpacity === '' && z0.postCanvas.display === 'none' && z0.cv[0] === Math.round(VW * 1.25)
      && zb.post.ruht === false && zb.post.bilder > za.post.bilder && zb.cvOpacity === '0', { stufe0: { ruht: z0.post.ruht, cv: z0.cv }, zurueck: { ruht: zb.post.ruht, bilder: zb.post.bilder - za.post.bilder } });
    // P3: Kontextverlust mitten im Spiel
    await page.evaluate(() => { const S = window.BSSalon; S.state = 'waschen'; S.buildUI(); });
    await page.waitForTimeout(500);
    const verloren = await page.evaluate(() => { const e = document.getElementById('post').getContext('webgl2').getExtension('WEBGL_lose_context'); if (!e) return false; e.loseContext(); return true; });
    await page.waitForTimeout(600);
    const zl = await zustand(page);
    const st2 = zl.state; await tippe(page, 'next'); await page.waitForTimeout(700);
    const zl2 = await zustand(page);
    ok('P3_kontextverlust', verloren && zl.post.an === false && zl.post.grund === 'Kontextverlust' && zl.cvOpacity === '' && zl.postCanvas.display === 'none'
      && zl.cv[0] === Math.round(VW * 2) && zl2.state !== st2 && zl2.errors.length === 0,
      { verloren, grund: zl.post.grund, cv: zl.cv, stateVorher: st2, stateNachher: zl2.state });
    ergebnis.fehler.push(...errs, ...zl2.errors);
    await ctx.close();
  }
  // ---------------------------------------------------------------- P4 ?post=0 (+ ?fell=0)
  {
    const { ctx, page, errs } = await seite('post=0&fell=0');
    await page.evaluate(() => { const S = window.BSSalon; S.state = 'waschen'; S.buildUI(); });
    await page.waitForTimeout(800);
    const z = await zustand(page);
    ok('P4_post0_wie_20_4', z.post && z.post.an === false && z.post.grund === '?post=0' && !z.postCanvas && z.cvOpacity === '' && z.cv[0] === Math.round(VW * 2),
      { post: z.post && z.post.grund, cv: z.cv });
    ok('F2_fell0_nichts_gebacken', z.relief && z.relief.kacheln === 0, z.relief);
    ergebnis.fehler.push(...errs, ...z.errors);
    await ctx.close();
  }
} finally { await browser.close(); }
ok('Z_keine_fehler', ergebnis.fehler.length === 0, ergebnis.fehler.slice(0, 5));
const out = path.join(root, 'tests', 'perf', 'r21');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, `abnahme_${BR}_${fmt}.json`), JSON.stringify(ergebnis, null, 2));
const durch = Object.entries(ergebnis.checks).filter(([, v]) => !v.ok).map(([k]) => k);
console.log(durch.length ? 'DURCHGEFALLEN: ' + durch.join(', ') : 'ALLE BESTANDEN');
process.exit(durch.length ? 1 : 0);
