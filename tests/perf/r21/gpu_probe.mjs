// DEV-PROBE (r21, einmalig): GPU-Profil ungebremst, CPU ×4, Stufe 2 hoch — Hauptthread je Bild mit/ohne Endbild, ohne Glow-Ebene,
// ohne Bloom, plus reine JS-Zeit von BSPost.bild(). Aufruf: node tests/perf/r21/gpu_probe.mjs (Ergebnis im TECHNIK_BERICHT).
import { createRequire } from 'module'; import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.HOME, '.cache/r18-pw/node_modules/playwright'));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const b = await chromium.launch({ args: ['--use-angle=metal','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-gpu-rasterization','--enable-gpu','--mute-audio','--disable-gpu-vsync','--disable-frame-rate-limit'] });
for (const [name, q, patch] of [['post0','post=0',0],['post','',0],['post-ohneGlow','',1],['post-ohneBloom','',2],['post0b','post=0',0],['postb','',0]]) {
  const ctx = await b.newContext({ viewport:{width:412,height:915}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    const P = window.__p = { on:false, h:[], parts:{} }; const raf = requestAnimationFrame.bind(window); const mc = new MessageChannel(); let t0 = 0;
    mc.port1.onmessage = () => { if (P.on && t0) P.h.push(performance.now() - t0); t0 = 0; };
    window.requestAnimationFrame = (cb) => raf((ts) => { const a = performance.now(); cb(ts); if (P.on) { t0 = a; mc.port2.postMessage(0); } });
  });
  await p.goto('file://' + root + '/index.html' + (q ? '?' + q : ''));
  await p.waitForFunction(() => window.BSGame && window.BSSalon);
  await p.evaluate((patch) => { window.BSGame.perf.warm=-1e9; window.BSFx.Q.tier=2; dispatchEvent(new Event('resize'));
    if (patch===1){ window.BSFx.GL.glow=function(){}; for (const k in window.BSFx.P.GLOWT) delete window.BSFx.P.GLOWT[k]; }
    if (patch===2){ for (const k in window.BSPost.GRADE) window.BSPost.GRADE[k].bloom=0; window.BSPost.grade.bloom=0; }
    // Zeit nur für PO.bild messen
    const PO=window.BSPost; if (PO && PO.bild){ const o=PO.bild; window.__pb=[]; PO.bild=function(){ const a=performance.now(); o.apply(this,arguments); window.__pb.push(performance.now()-a); }; }
  }, patch);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__p.on = true; if (window.__pb) window.__pb.length=0; });
  await p.waitForTimeout(6000);
  const r = await p.evaluate(() => { const q=(a,f)=>{const s=a.slice().sort((x,y)=>x-y); return s.length? +s[Math.floor(s.length*f)].toFixed(2):null;};
    return { n: window.__p.h.length, p50: q(window.__p.h,0.5), p95: q(window.__p.h,0.95), bildP50: window.__pb? q(window.__pb,0.5):null, bildP95: window.__pb? q(window.__pb,0.95):null, bloom: window.BSPost.bloomBilder }; });
  console.log(name, JSON.stringify(r)); await ctx.close();
}
await b.close();
