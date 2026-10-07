// tests/unit/harness.mjs — lädt die Spiel-Module per node:vm in eine Sandbox, ganz ohne Browser.
// Stubs: window (= globaler Kontext), localStorage (In-Memory), performance (steuerbare Uhr), location,
// document.createElement('canvas') (Proxy-Context: jede Methode leer, measureText → {width:40},
// getTransform → Einheitsmatrix, create*Gradient → {addColorStop(){}}), Path2D, Audio, Image.
// Keine npm-Abhängigkeiten. Vorbild: Harness aus docs/audit/2026-10-05-max-gutachten.md („Vorgehen und Belege“).
//
//   const H = load({ files: ['fx.js','art.js','salon.js'], storage: {bs_baer: '…'}, seed: 1 });
//   H.S (BSSalon), H.Fx, H.Art, H.storage (Map-artiges Objekt), H.clock.ms (performance.now), H.tick(ms)
//   H.g = Zeichen-Context (Proxy), H.rec = aufgezeichnete Aufrufe auf H.g (nur wenn record:true)
//   sources: {'salon.js': '…'} lädt statt der Datei einen anderen Quelltext (z. B. `git show origin/main:salon.js`)
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Standard-Ladereihenfolge wie index.html (sfx/music bleiben weg: Audio braucht echte WebAudio-Objekte)
export const ALL = ['fx.js', 'art.js', 'room.js', 'deko.js', 'salon.js', 'ui.js', 'game.js'];
export const CORE = ['fx.js', 'art.js', 'salon.js'];

// deterministischer Zufall (gleiche Formel wie tests/deko-check.mjs)
export function seeded(seed) {
  let s = seed >>> 0;
  return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function identity() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, is2D: true, isIdentity: true, inverse() { return identity(); }, multiply() { return identity(); } }; }

// Proxy-Context: merkt sich gesetzte Eigenschaften (fillStyle, globalAlpha …), alles andere ist eine leere Methode
function makeCtx(canvas, rec) {
  const props = { canvas, globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, font: '10px sans-serif', textAlign: 'start', shadowBlur: 0, shadowColor: 'rgba(0,0,0,0)', filter: 'none', lineDashOffset: 0, imageSmoothingEnabled: true };
  const special = {
    measureText: (t) => ({ width: 40, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }),
    getTransform: () => identity(),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createConicGradient: () => ({ addColorStop() {} }),
    createPattern: () => ({ setTransform() {} }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    isPointInPath: () => false,
    getLineDash: () => [],
  };
  const fns = {};
  return new Proxy(props, {
    get(o, k) {
      if (k in special) return special[k];
      if (k in o) return o[k];
      if (typeof k === 'symbol') return undefined;
      return fns[k] || (fns[k] = function () { if (rec) rec.push([k, ...arguments]); });
    },
    set(o, k, v) { o[k] = v; if (rec) rec.push(['=' + String(k), v]); return true; },
    has() { return true; },
  });
}

export function load(opt = {}) {
  const files = opt.files || CORE;
  const store = Object.assign({}, opt.storage || {});
  const clock = { ms: opt.now || 1000 };
  const rec = opt.record ? [] : null;
  const listeners = {};          // window-Ereignisse (resize …)
  const docListeners = {};
  const rafQueue = [];
  const timeouts = [];

  function makeCanvas() {
    const c = { width: 300, height: 150, style: {}, _ctx: null, tagName: 'CANVAS',
      getContext() { return c._ctx || (c._ctx = makeCtx(c, null)); },
      addEventListener(type, fn) { (c._l || (c._l = {}))[type] = fn; },
      setPointerCapture() {}, releasePointerCapture() {}, toDataURL() { return 'data:,'; },
      getBoundingClientRect() { return { left: 0, top: 0, width: c.width, height: c.height }; } };
    return c;
  }
  const mainCanvas = makeCanvas();
  const wrap = { clientWidth: opt.width || 412, clientHeight: opt.height || 915, style: {} };
  const ctx = {
    console,
    Math: Object.create(Math),   // eigenes Math-Objekt, damit Math.random pro Sandbox steuerbar ist
    JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, TypeError, Map, Set, WeakMap, Symbol, Promise, Proxy, Reflect,
    Uint8ClampedArray, Float32Array, Float64Array, Int32Array, Uint32Array, Uint8Array,
    parseFloat, parseInt, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    devicePixelRatio: opt.dpr || 2, innerWidth: wrap.clientWidth, innerHeight: wrap.clientHeight,
    location: { search: opt.search || '', href: 'file:///index.html' + (opt.search || '') },
    navigator: { userAgent: 'node-harness' },
    performance: { now: () => clock.ms },
    localStorage: {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { if (opt.storageThrows) throw new Error('QuotaExceeded'); store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; },
    },
    Path2D: class { constructor() {} moveTo() {} lineTo() {} closePath() {} rect() {} arc() {} ellipse() {} bezierCurveTo() {} quadraticCurveTo() {} addPath() {} },
    Audio: class { constructor() { this.volume = 1; this.paused = true; } play() { return Promise.resolve(); } pause() {} addEventListener() {} load() {} },
    Image: class { constructor() { this.width = 0; this.height = 0; } },
    Event: class { constructor(type) { this.type = type; } },
    setTimeout: (fn, ms) => { timeouts.push({ fn, at: clock.ms + (ms || 0) }); return timeouts.length; },
    clearTimeout: () => {},
    requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
    cancelAnimationFrame: () => {},
    getComputedStyle: () => ({ paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px' }),
    addEventListener: (type, fn) => { (listeners[type] || (listeners[type] = [])).push(fn); },
    removeEventListener: () => {},
    dispatchEvent: (ev) => { (listeners[ev.type] || []).forEach((fn) => fn(ev)); return true; },
    matchMedia: opt.reducedMotion === undefined ? undefined : () => ({ matches: !!opt.reducedMotion, addEventListener() {} }),
  };
  ctx.Math.random = opt.seed === undefined ? Math.random : seeded(opt.seed);
  ctx.document = {
    currentScript: null,
    createElement: (tag) => (String(tag).toLowerCase() === 'canvas' ? makeCanvas() : { style: {}, appendChild() {}, setAttribute() {} }),
    getElementById: (id) => (id === 'cv' ? mainCanvas : id === 'wrap' ? wrap : id === 'err' ? { textContent: '' } : null),
    body: { appendChild() {}, style: {} },
    addEventListener: (type, fn) => { (docListeners[type] || (docListeners[type] = [])).push(fn); },
    removeEventListener: () => {},
    hidden: false, visibilityState: 'visible',
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  if (opt.globals) Object.assign(ctx, opt.globals);
  vm.createContext(ctx);

  for (const f of files) {
    const src = (opt.sources && opt.sources[f]) || fs.readFileSync(path.join(ROOT, f), 'utf8');
    const q = opt.scriptQuery !== undefined ? opt.scriptQuery : '?v=20.3';
    ctx.document.currentScript = { src: 'file:///repo/' + f + q };
    vm.runInContext(src, ctx, { filename: f });
    ctx.document.currentScript = null;
  }

  const H = {
    ctx, store, storage: store, clock, rec, listeners, docListeners, rafQueue, timeouts, mainCanvas, wrap,
    get S() { return ctx.BSSalon; }, get Fx() { return ctx.BSFx; }, get Art() { return ctx.BSArt; },
    get UI() { return ctx.BSUI; }, get G() { return ctx.BSGame; }, get D() { return ctx.BSDeko; },
    g: makeCtx(makeCanvas(), rec),
    tick(ms) { clock.ms += ms; },
    // fällige setTimeout-Rückrufe ausführen
    runTimers() { const due = timeouts.filter((t) => t.at <= clock.ms); due.forEach((t) => { timeouts.splice(timeouts.indexOf(t), 1); t.fn(); }); },
    // ein rAF-Bild von game.js ausführen (Uhr läuft um ms weiter)
    frame(ms = 1000 / 60) { clock.ms += ms; const q = rafQueue.splice(0); q.forEach((fn) => fn(clock.ms)); },
    run(code) { return vm.runInContext(code, ctx); },
  };
  return H;
}

// Zustand setzen wie ein Knopfdruck in der Stations-Leiste
export function go(H, st) { H.S.state = st; H.S.buildUI(); }
// alle Stations-IDs (24)
export function stations(H) { return H.S.STATIONS.map((s) => s.id); }
// JSON-Tiefkopie (für Vergleiche „vorher/nachher“)
export const clone = (x) => JSON.parse(JSON.stringify(x));

// Zeichen-Protokoll aus H.rec: jeder Canvas-Aufruf; Zeichen-Operationen mit der wirksamen globalAlpha/fillStyle
// (save/restore werden nachgespielt). Zahlen auf 6 Stellen gerundet → alt/neu direkt vergleichbar.
const DRAW = new Set(['drawImage', 'fill', 'stroke', 'fillRect', 'strokeRect', 'fillText', 'strokeText', 'clearRect']);
export function drawLog(rec, { withStyle = true } = {}) {
  const out = [], stack = [];
  let st = { globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000' };
  const r = (v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : typeof v === 'object' && v ? '[obj]' : v);
  for (const [k, ...a] of rec) {
    if (k === 'save') stack.push({ ...st });
    else if (k === 'restore') st = stack.pop() || st;
    else if (k[0] === '=') { const p = k.slice(1); if (p in st) st[p] = a[0]; }
    if (k[0] === '=') continue;
    const e = [k, ...a.map(r)];                // jeder Aufruf (auch translate/rotate/arc …) zählt
    if (DRAW.has(k)) {
      e.push('α' + r(st.globalAlpha));
      if (withStyle && k !== 'drawImage') e.push(typeof st.fillStyle === 'string' ? st.fillStyle : '[grad]');
    }
    out.push(e);
  }
  return out;
}
