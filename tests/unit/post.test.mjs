// post.test.mjs — r21 Kino-Look (post.js): reine Teile + Anbindung in der echten game.js-Schleife mit nachgebautem WebGL2.
// Was hier NICHT geprüft werden kann (Heavy-Job, Browser): ob die Shader auf echter Hardware übersetzen, wie das Bild
// aussieht (A/B-Collage), GPU-Kosten, Kontextverlust im echten Browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, go, ALL, ROOT } from './harness.mjs';

const P = (opt = {}) => load({ files: ['fx.js', 'post.js'], ...opt }).ctx.BSPost;
const J = (x) => JSON.parse(JSON.stringify(x));

test('Maße je Stufe: Szene kleiner, Endbild in alter Auflösung (Handy hochkant, DPR 2)', () => {
  const PO = P();
  const m2 = PO.masse(412, 915, 2, 2);
  assert.deepEqual([m2.RS, m2.aus, m2.sw, m2.sh, m2.ow, m2.oh, m2.gw, m2.gh, m2.bw, m2.bh, m2.ruht], [1.6, 2, 659, 1464, 824, 1830, 330, 732, 165, 366, false]);
  assert.ok(Math.abs(m2.skala - 0.8) < 1e-9);
  // Füllrate der 2D-Szene: 64 % der alten Stufe 2
  assert.ok(Math.abs((m2.sw * m2.sh) / (824 * 1830) - 0.64) < 0.01);
  const m1 = PO.masse(412, 915, 2, 1);
  assert.deepEqual([m1.RS, m1.aus, m1.ow, m1.ruht], [1.3, 1.6, 659, false]);
  const m0 = PO.masse(412, 915, 2, 0);
  assert.equal(m0.ruht, true);
  assert.equal(m0.RS, 1.25);                                    // = Fx.Q.dpr() auf Stufe 0, also genau der alte Weg
  assert.deepEqual(J(PO.speicher(m0)), { d2: 0, gpu: 0 });
});

test('Maße: Desktop (DPR 1) nie unter 1, DPR 3 auf 2 gedeckelt, DPR 1,5 ohne Hochskalieren', () => {
  const PO = P();
  const d1 = PO.masse(1280, 800, 1, 2);
  assert.deepEqual([d1.RS, d1.aus, d1.skala, d1.sw, d1.ow], [1, 1, 1, 1280, 1280]);
  const d3 = PO.masse(393, 852, 3, 2);
  assert.deepEqual([d3.RS, d3.aus], [1.6, 2]);
  const d15 = PO.masse(400, 800, 1.5, 2);
  assert.deepEqual([d15.RS, d15.aus, d15.skala], [1.5, 1.5, 1]);
});

test('?pszene= setzt die Szenen-DPR je Stufe (Abstimm-Regler), Unsinn wird ignoriert', () => {
  const PO = P({ search: '?pszene=1.2,1.4,1.7' });
  assert.deepEqual(J(PO.STUFEN.map((s) => s.szene)), [1.2, 1.4, 1.7]);
  const PX = P({ search: '?pszene=x,0.1,9' });
  assert.deepEqual(J(PX.STUFEN.map((s) => s.szene)), [1.25, 1.3, 1.6]);
});

test('Speicher (Rechnung): Endbild-Zusatz getrennt nach 2D-Canvas und Grafikspeicher', () => {
  const PO = P();
  const m = PO.masse(412, 915, 2, 2), sp = PO.speicher(m);
  assert.equal(sp.d2, 330 * 732);                                       // nur die Glow-Leinwand ist ein 2D-Canvas
  assert.equal(sp.gpu, 824 * 1830 + 659 * 1464 + 330 * 732 + 2 * 165 * 366);
  // 2D-Canvas-Speicher (zählt gegen die iOS-Grenze): Szene + Raum (≈ 1,64 × Bild) + Glow gegen Szene + Raum bei DPR 2
  const neu2d = 659 * 1464 * 2.64 + sp.d2, alt2d = 824 * 1830 * 2.64;
  assert.ok(neu2d < alt2d * 0.75, `2D ${(neu2d / 1e6).toFixed(2)} MP gegen ${(alt2d / 1e6).toFixed(2)} MP`);
});

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const UI_FARBEN = [...new Set(fs.readFileSync(path.join(ROOT, 'ui.js'), 'utf8').match(/#[0-9a-fA-F]{6}\b/g))];

test('Farbstimmungen: neutral = unverändert; UI-Farben (ui.js) je Kanal höchstens 6 % verschoben', () => {
  const PO = P();
  const neutral = { lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], sat: 1, kon: 1 };
  for (const c of [[0, 0, 0], [1, 1, 1], [0.3, 0.6, 0.9]]) {
    PO.gradeFarbe(c, neutral).forEach((v, i) => assert.ok(Math.abs(v - c[i]) < 1e-9));
  }
  assert.ok(UI_FARBEN.length > 10);
  for (const [name, g] of Object.entries(PO.GRADE)) {
    for (const h of UI_FARBEN) {
      const c = hex(h), o = PO.gradeFarbe(c, g);
      o.forEach((v, i) => assert.ok(Math.abs(v - c[i]) <= 0.06, `${name}: ${h} Kanal ${i} ${c[i].toFixed(3)} → ${v.toFixed(3)}`));
    }
  }
});

test('Farbstimmungen: Salon wärmer (Rot hoch, Blau runter), Aquarium kühler; Station → Stimmung', () => {
  const PO = P();
  const grau = [0.6, 0.6, 0.6];
  const s = PO.gradeFarbe(grau, PO.GRADE.salon), a = PO.gradeFarbe(grau, PO.GRADE.aquarium);
  assert.ok(s[0] > s[2] + 0.02, 'Salon nicht warm');
  assert.ok(a[2] > a[0] + 0.01, 'Aquarium nicht kühl');
  assert.equal(PO.stimmung('waschen'), 'salon');
  assert.equal(PO.stimmung('aquarium'), 'aquarium');
  assert.equal(PO.stimmung('finish-done'), 'finale');
  assert.equal(PO.stimmung('wahl'), 'menu');
  for (const g of Object.values(PO.GRADE)) for (const k of ['lift', 'gamma', 'gain', 'tint']) assert.equal(g[k].length, 3);
});

test('Überblenden: mischeGrade erreicht das Ziel, ohne die Tabelle zu verändern', () => {
  const PO = P();
  const a = PO.kopiereGrade(PO.GRADE.salon), ziel = PO.GRADE.disco, vor = J(ziel);
  for (let i = 0; i < 300; i++) PO.mischeGrade(a, ziel, 1 - Math.exp(-3 / 60));   // 5 s bei 60 Hz
  for (const k of ['sat', 'kon', 'bloom']) assert.ok(Math.abs(a[k] - ziel[k]) < 1e-4);
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(a.gain[i] - ziel.gain[i]) < 1e-4);
  assert.deepEqual(J(ziel), vor);
  a.gain[0] = 9; assert.notEqual(PO.GRADE.salon.gain[0], 9, 'kopiereGrade teilt Felder');
});

test('Weichzeichner-Kern: Summe 1, 4 Paare, symmetrisch abfallend', () => {
  const k = P().blurKern();
  const sum = k.w0 + 2 * k.wt.reduce((x, y) => x + y, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
  assert.equal(k.off.length, 4);
  for (let i = 1; i < 4; i++) { assert.ok(k.off[i] > k.off[i - 1]); assert.ok(k.wt[i] < k.wt[i - 1]); }
});

test('Shader (statisch): GLSL ES 3.00, jede gesetzte Uniform ist deklariert und umgekehrt', () => {
  const PO = P();
  const { VS, FS_BLUR, FS_END } = PO.SHADER;
  for (const src of [VS, FS_BLUR, FS_END]) {
    assert.ok(src.startsWith('#version 300 es\n'));
    assert.ok(!/texture2D|gl_FragColor|varying|attribute/.test(src), 'WebGL1-Syntax');
  }
  const decl = (src) => [...src.matchAll(/^uniform \w+ (\w+);/gm)].map((m) => m[1]).sort();
  assert.deepEqual(decl(FS_BLUR), [...PO.UNIFORMS.blur].sort());
  assert.deepEqual(decl(FS_END), [...PO.UNIFORMS.end].sort());
  // Reihenfolge der Farbkorrektur im Shader wie im CPU-Abbild gradeFarbe (Lift/Gain → Gamma → Sättigung → Kontrast)
  const i = (s) => FS_END.indexOf(s);
  assert.ok(i('c * gain + lift') < i('1.0 / gam') && i('1.0 / gam') < i('mix(vec3(l), c, sat)') && i('mix(vec3(l), c, sat)') < i('* kon'));
  assert.equal((FS_END.match(/\{/g) || []).length, (FS_END.match(/\}/g) || []).length);
});

// ---------------------------------------------------------------- Anbindung: echte game.js-Schleife, nachgebautes WebGL2
function fakeGL(log) {
  const K = { FRAMEBUFFER_COMPLETE: 36053 };
  const st = { lost: false };
  const gl = new Proxy({}, {
    get(o, k) {
      if (k in K) return K[k];
      if (k === '_st') return st;
      if (k === 'isContextLost') return () => st.lost;
      if (k === 'getShaderParameter' || k === 'getProgramParameter') return () => true;
      if (k === 'checkFramebufferStatus') return () => K.FRAMEBUFFER_COMPLETE;
      if (k === 'getUniformLocation') return (p, n) => ({ n });
      if (typeof k === 'string' && /^[A-Z_0-9]+$/.test(k)) return k;
      return (...a) => { log.push([k, ...a.map((x) => (x && typeof x === 'object' && 'width' in x ? `cv${x.width}x${x.height}` : x))]); return { id: log.length }; };
    },
  });
  return gl;
}
function spiel(opt = {}) {
  const H = load({ files: ALL.filter((f) => f !== 'game.js'), seed: 7, ...opt });
  const log = [], gls = [];
  const orig = H.ctx.document.createElement;
  H.ctx.document.createElement = (tag) => {
    const c = orig(tag);
    if (String(tag).toLowerCase() === 'canvas') {
      const g2 = c.getContext;
      c.getContext = (typ) => { if (typ === 'webgl2') { if (opt.keinGL) return null; const gl = fakeGL(log); gls.push(gl); return gl; } return g2(typ); };
    }
    return c;
  };
  H.run(fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8'));
  return { H, log, gls, PO: H.ctx.BSPost, Fx: H.Fx };
}
const zaehle = (log, k) => log.filter((e) => e[0] === k).length;

test('game.js: Endbild an → Szene DPR 1,6, Glow-Ebene ½, jedes Bild ein Endbild-Durchgang, keine Fehler', () => {
  const { H, log, PO, Fx } = spiel();
  assert.equal(PO.an, true, PO.grund + ' ' + PO.fehler);
  assert.deepEqual([H.mainCanvas.width, H.mainCanvas.height], [659, 1464]);
  assert.equal(H.mainCanvas.style.opacity, '0');
  assert.equal(Fx.GL.on, true);
  assert.deepEqual([Fx.GL.cv.width, Fx.GL.cv.height], [330, 732]);
  go(H, 'waschen');
  log.length = 0;
  for (let i = 0; i < 30; i++) H.frame();
  assert.equal(zaehle(log, 'drawArrays') >= 30, true);
  assert.equal(PO.bilder >= 30, true);
  const mem = H.G.canvasMem();
  assert.equal(mem.main, 659 * 1464);
  assert.equal(mem.post, 330 * 732);
  assert.equal(mem.postGpu, PO.speicher(PO.masseJetzt).gpu);
  assert.deepEqual([...H.ctx.__errors], []);
});

test('game.js: ohne Glitzer kein Bloom (kein Hochladen der Glow-Ebene), mit Funken schon', () => {
  const { H, log, PO, Fx } = spiel({ reducedMotion: true });   // Bewegung reduzieren: keine Lichterketten-Funkel
  go(H, 'waschen');
  for (let i = 0; i < 40; i++) H.frame();
  Fx.P.clear();
  for (let i = 0; i < 3; i++) H.frame();
  const b0 = PO.bloomBilder; log.length = 0;
  for (let i = 0; i < 10; i++) H.frame();
  assert.equal(PO.bloomBilder, b0, 'Bloom ohne Glitzer');
  assert.equal(zaehle(log, 'texImage2D'), 10, 'nur die Szene wird hochgeladen');
  Fx.P.emit('spark', 450, 300, { n: 20, life: 2 });
  log.length = 0;
  H.frame();
  assert.equal(PO.bloomBilder, b0 + 1);
  assert.equal(zaehle(log, 'texImage2D'), 2);
  assert.equal(zaehle(log, 'drawArrays'), 3);                   // 2× Weichzeichnen + Endbild
  assert.ok(log.some((e) => e[0] === 'texImage2D' && e.includes('cv330x732')), 'Glow-Ebene nicht hochgeladen');
});

test('game.js: Stufe 0 → Endbild ruht (alter 2D-Weg, DPR 1,25), zurück auf Stufe 2 → läuft wieder', () => {
  const { H, PO, Fx } = spiel();
  H.Fx.Q.tier = 0; H.ctx.dispatchEvent(new H.ctx.Event('resize'));
  assert.equal(PO.ruht, true);
  assert.deepEqual([H.mainCanvas.width, H.mainCanvas.height], [515, 1144]);
  assert.equal(H.mainCanvas.style.opacity, '');
  assert.equal(Fx.GL.on, false);
  const n = PO.bilder; H.frame(); assert.equal(PO.bilder, n, 'Endbild rechnet trotz Ruhe');
  H.Fx.Q.tier = 2; H.ctx.dispatchEvent(new H.ctx.Event('resize'));
  assert.equal(PO.ruht, false);
  assert.equal(H.mainCanvas.width, 659);
  H.frame(); assert.equal(PO.bilder, n + 1);
});

test('game.js: Kontextverlust → reines 2D in alter Auflösung, Spiel läuft weiter', () => {
  const { H, gls, PO, Fx } = spiel();
  go(H, 'aquarium');
  for (let i = 0; i < 10; i++) H.frame();
  gls[0]._st.lost = true;
  H.frame();                                                    // Endbild merkt den Verlust selbst …
  assert.equal(PO.an, false);
  assert.equal(PO.grund, 'Kontextverlust');
  assert.deepEqual([H.mainCanvas.width, H.mainCanvas.height], [824, 1830]);
  assert.equal(H.mainCanvas.style.opacity, '');
  assert.equal(Fx.GL.on, false);
  for (let i = 0; i < 60; i++) H.frame();
  go(H, 'zirkus');
  for (let i = 0; i < 60; i++) H.frame();
  assert.deepEqual([...H.ctx.__errors], []);
});

test('game.js: ?post=0 und „kein WebGL2“ → reines 2D wie vor r21', () => {
  for (const opt of [{ search: '?post=0' }, { keinGL: true }]) {
    const { H, log, PO, Fx } = spiel(opt);
    assert.equal(PO.an, false);
    assert.equal(PO.grund, opt.keinGL ? 'kein WebGL2' : '?post=0');
    assert.deepEqual([H.mainCanvas.width, H.mainCanvas.height], [824, 1830]);
    assert.equal(Fx.GL.on, false);
    go(H, 'waschen');
    for (let i = 0; i < 20; i++) H.frame();
    assert.equal(log.length, 0);
    assert.deepEqual([...H.ctx.__errors], []);
  }
});

// Sitzung wie im Gutachten (P2-6): drei Bären mit Frisur probiert, Stationen, Finale – Speicher am Ende
function sitzung(s) {
  const { H } = s, S = H.S, run = (n) => { for (let i = 0; i < n; i++) H.frame(); };
  for (const [idx, fr] of [[4, 'lockig'], [9, 'afro'], [2, 'zottig']]) { S.chooseBear(idx); S.baer.frisur = fr; go(H, 'waschen'); run(60); go(H, 'foehnen'); run(60); }
  for (const st of ['aquarium', 'zirkus', 'disco']) { go(H, st); run(50); }
  S.startFinale(); run(300);
  return H.G.canvasMem();
}
test('Speicher in einer Sitzung: 2D-Canvas deutlich weniger, mit Grafikspeicher höchstens gleich', (t) => {
  const a = sitzung(spiel()), b = sitzung(spiel({ search: '?post=0' }));
  const MP = (x) => (x / 1e6).toFixed(2);
  const d2 = (m) => m.main + m.room + m.spare + m.bake + m.snap + m.sprites + m.post;
  t.diagnostic(`mit Endbild: 2D ${MP(d2(a))} MP (Sprites ${MP(a.sprites)}, Raum ${MP(a.room)}) + GPU ${MP(a.postGpu)} MP; ` +
    `ohne: 2D ${MP(d2(b))} MP (Sprites ${MP(b.sprites)}, Raum ${MP(b.room)})`);
  assert.ok(a.sprites < b.sprites * 0.8, `Sprites mit Endbild ${a.sprites} px, ohne ${b.sprites} px`);
  assert.ok(a.room < b.room * 0.8, `Raum mit Endbild ${a.room} px, ohne ${b.room} px`);
  assert.ok(d2(a) < d2(b) * 0.8, '2D-Canvas-Speicher nicht kleiner');
  assert.ok(d2(a) + a.postGpu <= d2(b) * 1.0, 'mit Grafikspeicher mehr als vorher');
});

test('Endbild an: Bild für Bild kein Neu-Backen der Bären-Sprites', () => {
  const mit = spiel();
  go(mit.H, 'waschen'); for (let i = 0; i < 90; i++) mit.H.frame();
  const bk = mit.H.Art.bakes; for (let i = 0; i < 60; i++) mit.H.frame();
  assert.equal(mit.H.Art.bakes, bk);
});

test('Glow-Ebene: leuchtende Partikel malen hinein (nur Szenen-Canvas), Konfetti nicht; aus = keine Aufrufe', () => {
  const H = load({ files: ['fx.js'], seed: 1, record: true });
  const { Fx } = H;
  const main = H.g.canvas;
  main.width = 800; main.height = 600;
  Fx.P.emit('confetti', 100, 100, { n: 5, life: 2 });
  Fx.P.draw(H.g, 'world');
  assert.equal(Fx.GL.dirty, false);                             // aus: nichts
  Fx.GL.setze(main, 400, 300);
  const rec = []; const gg = Fx.GL.g;
  const orig = gg.drawImage; Fx.GL.g = new Proxy(gg, { get: (o, k) => (k === 'drawImage' ? (...a) => rec.push(a) : o[k]) });
  Fx.P.draw(H.g, 'world');
  assert.equal(rec.length, 0, 'Konfetti glüht');
  assert.equal(Fx.GL.dirty, false);
  Fx.P.emit('spark', 100, 100, { n: 4, life: 2 });
  Fx.P.emit('twinkle', 100, 100, { n: 3, life: 2 });
  Fx.P.update(0.2);
  Fx.P.draw(H.g, 'world');
  assert.equal(rec.length, 7);
  assert.equal(Fx.GL.dirty, true);
  // anderer Canvas (z. B. Thumbnail/Album) → keine Glow-Aufrufe
  const H2 = load({ files: ['fx.js'] });
  rec.length = 0; Fx.GL.dirty = false;
  Fx.P.draw(H2.g, 'world');
  assert.equal(rec.length, 0);
  Fx.GL.anfang(); assert.equal(Fx.GL.dirty, false);
  void orig;
});
