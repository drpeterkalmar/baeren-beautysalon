// post.js — r21 „Kino-Look 2D“ (Grafik-Audit #6): WebGL2-Endbild über dem Canvas-2D-Zeichner.
// Vorlage: ~/dev/koboldkeller/src/post.js (v13). Canvas 2D zeichnet weiter ALLES (Raum, Bär, UI, Partikel); neu ist nur der
// letzte Schritt — das fertige 2D-Bild wird als Textur in WebGL2 geladen und dort fertig gemacht:
//   • Hochskalieren + Nachschärfen (CAS, nach AMD FidelityFX „Contrast Adaptive Sharpening“): die 2D-Szene rendert mit
//     DPR 1,6 (Stufe 2) bzw. 1,3 (Stufe 1) statt 2 / 1,6 und wird in Ausgabe-Auflösung scharf gerechnet → spart Füllrate
//     und Canvas-Speicher (auch die Raum- und Bären-Sprites werden kleiner gebacken, sie hängen an view.dpr).
//   • Weiches Glühen (Bloom) aus einer Glow-Ebene: Glitzer, Funken, Sterne, Zauber und Seifenblasen malen zusätzlich einen
//     weichen Licht-Tupfer in eine Leinwand mit halber Szenen-Auflösung (fx.js Fx.GL); hier wird sie in Viertel-Auflösung
//     zweimal weichgezeichnet und per „Screen“ (nicht additiv — der Salon ist hell, additiv würde ausbrennen) dazugegeben.
//     Ist die Glow-Ebene leer (kein Glitzer im Bild), entfallen Hochladen und Weichzeichnen ganz.
//   • Warme Farbkorrektur je Raum/Station (Lift/Gamma/Gain, Sättigung, Kontrast), weich überblendet beim Stationswechsel.
//   • Vignette: Standard AUS (?pvign=1 = an). Grund wie im Koboldkeller: der Shader sieht das fertige Bild inkl. Knöpfen,
//     Titel und Hinweisen am Rand; eine Shader-Vignette würde sie mit abdunkeln. Die dezente warme Vignette steckt seit r20
//     schon im Raum-Cache (Fx.gradingPaint, VOR der UI) und kostet nichts pro Bild.
//   • Dither gegen Streifen in Verläufen.
// Rückfall auf reines 2D: ?post=0, kein WebGL2, Shader-/Puffer-Fehler, Kontextverlust → BSPost.an = false; game.js stellt
// die alte Auflösung wieder her (resize). Stufe 0 (Sparstufe): Endbild ruht, exakt der Weg vor r21.
// Reine Teile (Stufen, Maße, Farbstimmungen, CPU-Abbild der Farbkorrektur, Kern) sind ohne Browser getestet:
// tests/unit/post.test.mjs. TODO Heavy-Job: alle Zahlen in STUFEN/GRADE/SCHAERFE/GLOW sind Startwerte — nur am Bild
// abstimmbar (A/B-Collage je Station, ?post=0 gegen ?post=1, Lupe auf Text/Knöpfe).
(function(){
'use strict';
var PO=window.BSPost={};
var Q=(function(){ try{ return location.search||''; }catch(e){ return ''; } })();
function param(k){ var m=new RegExp('[?&]'+k+'=([^&#]*)').exec(Q); return m?decodeURIComponent(m[1]):null; }

// ---------------------------------------------------------------- reine Teile (Node-testbar)
// Je Qualitätsstufe (Index = Fx.Q.tier, 2 = beste): DPR der 2D-Szene und des Endbilds (absolut, wie Fx.Q.dpr()).
// Ohne Endbild (bis r20.4): 1,25 / 1,6 / 2. ruht = Endbild aus, reines 2D wie vorher (Sparstufe: dort gibt es nichts mehr
// einzusparen, Koboldkeller hat gemessen: mit Endbild +5 … 23 % p95).
PO.STUFEN=[
  { szene:1.25, aus:1.25, ruht:true },
  { szene:1.3,  aus:1.6 },
  { szene:1.6,  aus:2 }
];
// Abstimm-Regler (nur zum Messen/Vergleichen): ?pszene=1.25,1.3,1.6 setzt die Szenen-DPR der Stufen 0, 1, 2
PO.pszene=function(txt){
  if(!txt) return;
  String(txt).split(',').forEach(function(v,i){ var f=parseFloat(v); if(PO.STUFEN[i] && f>=0.75 && f<=2) PO.STUFEN[i].szene=f; });
};
PO.pszene(param('pszene'));
PO.SCHAERFE={ hoch:0.5, nativ:0.15 };   // CAS-Stärke beim Hochskalieren bzw. ohne Skalierung (TODO Bild: Text/Knöpfe in der Lupe)

function stufe(tier){ var S=PO.STUFEN; return S[Math.max(0,Math.min(S.length-1,tier|0))]; }
/** Pixelmaße für Szene (2D), Glow-Ebene (½), Bloom-Puffer (¼) und Endbild. dev = devicePixelRatio. Bei dev ≈ 1 (Desktop)
    wird die Szene nie unter 1 gerechnet (sonst weicher als vorher). ruht → nur die alten Maße (RS = Fx.Q.dpr-Wert). */
PO.masse=function(VW,VH,dev,tier){
  dev=dev>0?dev:1;
  var st=stufe(tier), RS=Math.max(Math.min(1,dev),Math.min(st.szene,dev));
  var aus=Math.max(RS,Math.min(st.aus,dev,2));
  var sw=Math.round(VW*RS), sh=Math.round(VH*RS);
  var gw=Math.max(1,Math.ceil(sw/2)), gh=Math.max(1,Math.ceil(sh/2));
  return { VW:VW, VH:VH, RS:RS, aus:aus, ruht:!!st.ruht, sw:sw, sh:sh, gw:gw, gh:gh,
    bw:Math.max(1,Math.ceil(gw/2)), bh:Math.max(1,Math.ceil(gh/2)),
    ow:Math.round(VW*aus), oh:Math.round(VH*aus), skala:RS/aus };
};
/** Pixel (×4 = Bytes), die das Endbild zusätzlich belegt, getrennt nach Art:
    d2  = 2D-Canvas (Glow-Leinwand) — zählt wie alle 2D-Canvases gegen die Canvas-Grenze von iOS-Safari;
    gpu = WebGL: Zeichenpuffer des Endbilds, Szenen-Textur, Glow-Textur, zwei Bloom-Puffer (Grafikspeicher).
    Dafür schrumpfen 2D-Szene, Raum-Cache und Bären-/Frisur-Sprites auf (RS/alt)² (Stufe 2: 64 %). Ruht → nichts. */
PO.speicher=function(m){
  if(!m || m.ruht) return { d2:0, gpu:0 };
  return { d2:m.gw*m.gh, gpu:m.ow*m.oh + m.sw*m.sh + m.gw*m.gh + 2*m.bw*m.bh };
};

// Farbstimmung je Raum/Station. lift/gamma/gain je Kanal, sat = Sättigung, kon = Kontrast, bloom = Stärke des Scheins,
// tint = Farbe des Scheins, vign = Vignetten-Stärke (nur ?pvign=1). Alles bewusst leise: die UI (Knöpfe, Text) liegt im
// selben Bild und darf ihre Farben nicht sichtbar wechseln (Unit-Test: Knopf-/Textfarben je Kanal ≤ 6 % Abweichung).
// Startwerte, TODO Heavy-Job: am Bild abstimmen.
PO.GRADE={
  salon:      { lift:[0.006,0.003,0],     gamma:[1,1,1],          gain:[1.025,1.0,0.97],  sat:1.05, kon:1.03, bloom:0.5, tint:[1,0.9,0.74],   vign:0.5 },
  menu:       { lift:[0.006,0.003,0],     gamma:[1,1,1],          gain:[1.02,1.0,0.975],  sat:1.04, kon:1.02, bloom:0.42, tint:[1,0.9,0.76],   vign:0.4 },
  aquarium:   { lift:[0,0.004,0.01],      gamma:[1,1,1.01],       gain:[0.985,1.0,1.02],  sat:1.07, kon:1.04, bloom:0.55, tint:[0.82,0.94,1],  vign:0.5 },
  spa:        { lift:[0.002,0.005,0.002], gamma:[1,1.01,1],       gain:[1.0,1.01,0.985],  sat:0.98, kon:0.99, bloom:0.45,  tint:[0.94,1,0.86],  vign:0.4 },
  disco:      { lift:[0.004,0,0.01],      gamma:[1,1,1],          gain:[1.0,0.99,1.02],   sat:1.06, kon:1.04, bloom:0.75, tint:[1,0.82,1],     vign:0.7 },
  zauber:     { lift:[0.006,0,0.012],     gamma:[1,1,1.01],       gain:[1.0,0.98,1.03],   sat:1.08, kon:1.04, bloom:0.85,  tint:[0.95,0.84,1],  vign:0.6 },
  geburtstag: { lift:[0.008,0.003,0],     gamma:[1,1,0.99],       gain:[1.02,1.0,0.96],   sat:1.04, kon:1.03, bloom:0.65, tint:[1,0.86,0.66],  vign:0.6 },
  finale:     { lift:[0.006,0.003,0],     gamma:[1,1,0.99],       gain:[1.02,1.0,0.955],  sat:1.05, kon:1.04, bloom:0.75,  tint:[1,0.9,0.7],    vign:0.6 }
};
var STIMMUNG={ menu:'menu', wahl:'menu', album:'menu', aquarium:'aquarium', spa:'spa', massage:'spa', disco:'disco', tanz:'disco',
  zauber:'zauber', geburtstag:'geburtstag', 'finish-done':'finale' };
PO.stimmung=function(state){ return STIMMUNG[state]||'salon'; };
var SKALAR=['sat','kon','bloom','vign'], VEK=['lift','gamma','gain','tint'];
PO.kopiereGrade=function(g){ var o={}; SKALAR.forEach(function(k){ o[k]=g[k]; }); VEK.forEach(function(k){ o[k]=g[k].slice(); }); return o; };
/** a ← a + (b − a)·t (weiches Überblenden beim Stationswechsel) */
PO.mischeGrade=function(a,b,t){
  SKALAR.forEach(function(k){ a[k]+=(b[k]-a[k])*t; });
  VEK.forEach(function(k){ for(var i=0;i<3;i++) a[k][i]+=(b[k][i]-a[k][i])*t; });
  return a;
};
/** CPU-Abbild der Farbkorrektur im Shader (gleiche Reihenfolge: Lift/Gain → Gamma → Sättigung → Kontrast), rgb in 0…1.
    Nur für Tests (UI-Farben dürfen nicht wegdriften) und zum Nachrechnen beim Abstimmen. */
PO.gradeFarbe=function(rgb,g){
  var c=[0,0,0], i;
  for(i=0;i<3;i++){ var v=rgb[i]*g.gain[i]+g.lift[i]*(1-rgb[i]); c[i]=Math.pow(Math.max(v,0),1/g.gamma[i]); }
  var l=0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
  for(i=0;i<3;i++){ c[i]=l+(c[i]-l)*g.sat; c[i]=(c[i]-0.5)*g.kon+0.5; c[i]=Math.max(0,Math.min(1,c[i])); }
  return c;
};

/** Gauß-Kern (Radius r Texel, sigma) für lineares Sampling: Mitte + 4 Paare (je Seite 4 Abrufe statt 8).
    Liefert { w0, off[4], wt[4] } — Summe w0 + 2·Σwt = 1. (wie Koboldkeller) */
PO.blurKern=function(sigma,r){
  sigma=sigma||3.2; r=r||8;
  var g=[], s=0, i;
  for(i=0;i<=r;i++){ var v=Math.exp(-(i*i)/(2*sigma*sigma)); g.push(v); s+=i?2*v:v; }
  for(i=0;i<=r;i++) g[i]/=s;
  var off=[], wt=[];
  for(i=1;i<=r;i+=2){ var a=g[i], b=g[i+1]||0, w=a+b; wt.push(w); off.push(w>0?(i*a+(i+1)*b)/w:i); }
  while(wt.length<4){ wt.push(0); off.push(0); }
  return { w0:g[0], off:off.slice(0,4), wt:wt.slice(0,4) };
};

// ---------------------------------------------------------------- Shader
var VS=[
'#version 300 es',
'out vec2 uv;',
'void main() {',
'  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));',
'  uv = p;',
'  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);',
'}'].join('\n');

// Weichzeichnen in einer Richtung (lineares Sampling: 1 + 2×4 Abrufe ≈ 17-Texel-Gauß)
var FS_BLUR=[
'#version 300 es',
'precision highp float;',
'uniform sampler2D tex;',
'uniform vec2 dir;',
'uniform float w0;',
'uniform vec4 off;',
'uniform vec4 wt;',
'in vec2 uv;',
'out vec4 o;',
'void main() {',
'  vec3 c = texture(tex, uv).rgb * w0;',
'  for (int i = 0; i < 4; i++) {',
'    vec2 d = dir * off[i];',
'    c += (texture(tex, uv + d).rgb + texture(tex, uv - d).rgb) * wt[i];',
'  }',
'  o = vec4(c, 1.0);',
'}'].join('\n');

var FS_END=[
'#version 300 es',
'precision highp float;',
'uniform sampler2D szene;',
'uniform sampler2D bloom;',
'uniform vec2 szPx;',        // 1 / Szenen-Texturgröße
'uniform float scharf;',     // CAS 0 … 1 (0 = aus)
'uniform vec3 lift;',
'uniform vec3 gam;',
'uniform vec3 gain;',
'uniform float sat;',
'uniform float kon;',
'uniform float bloomK;',
'uniform vec3 tint;',
'uniform float vignK;',
'uniform vec2 res;',         // Bildgröße in CSS-px (runde Vignette)
'in vec2 uv;',
'out vec4 o;',
// Contrast Adaptive Sharpening (vereinfachte Fassung von AMD FidelityFX CAS, 5 Abrufe im Kreuz)
'vec3 cas(vec2 p) {',
'  vec3 a = texture(szene, p + vec2(0.0, -szPx.y)).rgb;',
'  vec3 b = texture(szene, p + vec2(-szPx.x, 0.0)).rgb;',
'  vec3 c = texture(szene, p).rgb;',
'  vec3 d = texture(szene, p + vec2(szPx.x, 0.0)).rgb;',
'  vec3 e = texture(szene, p + vec2(0.0, szPx.y)).rgb;',
'  vec3 mn = min(min(min(a, b), min(d, e)), c);',
'  vec3 mx = max(max(max(a, b), max(d, e)), c);',
'  vec3 amp = sqrt(clamp(min(mn, 2.0 - mx) / max(mx, vec3(1e-4)), 0.0, 1.0));',
'  vec3 w = amp * (-1.0 / mix(8.0, 5.0, scharf));',
'  return clamp((c + (a + b + d + e) * w) / (1.0 + 4.0 * w), 0.0, 1.0);',
'}',
'void main() {',
'  vec3 c = scharf > 0.0 ? cas(uv) : texture(szene, uv).rgb;',
// weicher Schein per „Screen“: hebt dunkle Stellen sichtbar, helle kaum (kein Ausbrennen auf dem hellen Salon)
'  if (bloomK > 0.0) { vec3 b = clamp(texture(bloom, uv).rgb * tint * bloomK, 0.0, 1.0); c = 1.0 - (1.0 - c) * (1.0 - b); }',
// Farbkorrektur wie BSPost.gradeFarbe (Lift/Gain → Gamma → Sättigung → Kontrast)
'  c = pow(max(c * gain + lift * (1.0 - c), 0.0), 1.0 / gam);',
'  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
'  c = mix(vec3(l), c, sat);',
'  c = (c - 0.5) * kon + 0.5;',
// Vignette (nur ?pvign=1): warm, erst ab 45 % Abstand, höchstens −14 % an den Ecken
'  if (vignK > 0.0) {',
'    vec2 px = (uv - vec2(0.5, 0.52)) * res;',
'    float t = clamp((length(px) / (0.5 * length(res)) - 0.45) / 0.55, 0.0, 1.0);',
'    c *= mix(vec3(1.0), vec3(0.86, 0.8, 0.8), t * t * vignK);',
'  }',
// Dither gegen Streifen in Verläufen
'  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);',
'  o = vec4(clamp(c + (n - 0.5) / 255.0, 0.0, 1.0), 1.0);',
'}'].join('\n');
PO.SHADER={ VS:VS, FS_BLUR:FS_BLUR, FS_END:FS_END };
PO.UNIFORMS={ blur:['tex','dir','w0','off','wt'],
  end:['szene','bloom','szPx','scharf','lift','gam','gain','sat','kon','bloomK','tint','vignK','res'] };

// ---------------------------------------------------------------- Zustand + WebGL
PO.vign=param('pvign')==='1';
PO.an=false; PO.ruht=false; PO.grund='aus'; PO.fehler=null; PO.masseJetzt=null; PO.bilder=0; PO.bloomBilder=0;
PO.grade=PO.kopiereGrade(PO.GRADE.salon); PO.stimmungJetzt='salon';
var S=null, onAus=null;

function shader(gl,typ,src){
  var s=gl.createShader(typ);
  gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ var log=gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error('Shader: '+log); }
  return s;
}
function programm(gl,fs,uniforms){
  var p=gl.createProgram();
  gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,VS)); gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error('Link: '+gl.getProgramInfoLog(p));
  var u={}; uniforms.forEach(function(n){ u[n]=gl.getUniformLocation(p,n); });
  return { p:p, u:u };
}
function textur(gl){
  var t=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return t;
}
function puffer(gl,w,h){
  var t=textur(gl);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  var f=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,f);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
  var ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  if(!ok) throw new Error('Framebuffer unvollständig');
  return { t:t, f:f, w:w, h:h };
}

/** Endbild einschalten. cv2d = Canvas des 2D-Zeichners (bekommt weiter alle Berührungen, wird unsichtbar).
    opts.an === false → bleibt aus (?post=0). opts.aus(grund) wird beim späteren Rückfall (Kontextverlust) gerufen. */
PO.init=function(cv2d,opts){
  opts=opts||{};
  onAus=opts.aus||null;
  if(opts.an===false){ PO.grund='?post=0'; return false; }
  try{
    var cv=document.createElement('canvas');
    var gl=cv.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false});
    if(!gl){ PO.grund='kein WebGL2'; return false; }
    var blur=programm(gl,FS_BLUR,PO.UNIFORMS.blur), end=programm(gl,FS_END,PO.UNIFORMS.end);
    S={ gl:gl, cv:cv, cv2d:cv2d, blur:blur, end:end, vao:gl.createVertexArray(), tSzene:textur(gl), tGlow:textur(gl), A:null, B:null, kern:PO.blurKern() };
    cv.id='post';
    cv.style.cssText='position:absolute;left:0;top:0;display:block;pointer-events:none;touch-action:none';
    if(cv2d.after) cv2d.after(cv); else if(cv2d.parentNode) cv2d.parentNode.appendChild(cv);
    cv2d.style.opacity='0';                                   // sichtbar ist das Endbild, Eingaben gehen weiter an cv2d
    cv.addEventListener('webglcontextlost',function(e){ if(e && e.preventDefault) e.preventDefault(); PO.aus('Kontextverlust'); });
    PO.an=true; PO.grund='an'; PO.cv=cv; PO.gl=gl;
    return true;
  }catch(e){
    PO.fehler=String(e && e.message || e); PO.grund='Fehler';
    if(S && S.cv && S.cv.parentNode) S.cv.parentNode.removeChild(S.cv);
    S=null; PO.an=false;
    return false;
  }
};
/** zurück auf reines 2D: Endbild ausblenden, 2D-Canvas wieder sichtbar; game.js stellt per onAus → resize() die alte
    Auflösung her. Bleibt aus (kein Wiederaufleben nach webglcontextrestored — sicherer Weg). */
PO.aus=function(grund){
  if(!PO.an) return;
  PO.an=false; PO.ruht=false; PO.grund=grund||'aus';
  if(S){ S.cv.style.display='none'; S.cv2d.style.opacity=''; }
  if(onAus) onAus(PO.grund);
};
/** Sparstufe: Endbild ausblenden, 2D zeigen (ohne Rückfall — auf besseren Stufen läuft es wieder) */
PO.ruhe=function(ruht){
  if(!PO.an || !S) return;
  PO.ruht=!!ruht;
  S.cv.style.display=ruht?'none':'block';
  S.cv2d.style.opacity=ruht?'':'0';
};
/** Größen setzen (aus game.js resize). m = PO.masse(…) */
PO.groesse=function(m){
  if(!PO.an || !S) return;
  PO.masseJetzt=m;
  PO.ruhe(m.ruht);
  if(m.ruht) return;
  var gl=S.gl;
  if(S.cv.width!==m.ow || S.cv.height!==m.oh){ S.cv.width=m.ow; S.cv.height=m.oh; }
  S.cv.style.width=m.VW+'px'; S.cv.style.height=m.VH+'px';  // genau wie der 2D-Canvas
  try{
    if(!S.A || S.A.w!==m.bw || S.A.h!==m.bh){
      [S.A,S.B].forEach(function(P){ if(P){ gl.deleteTexture(P.t); gl.deleteFramebuffer(P.f); } });
      S.A=puffer(gl,m.bw,m.bh); S.B=puffer(gl,m.bw,m.bh);
    }
  }catch(e){ PO.fehler=String(e.message||e); PO.aus('Puffer'); }
};

function hochladen(gl,t,quelle,premul){
  gl.bindTexture(gl.TEXTURE_2D,t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,premul);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,quelle);
}

/** Ein Endbild. szene = 2D-Canvas, glow = Fx.GL ({cv, dirty}) oder null, state = S.state, VW/VH = CSS-px, dt = s */
PO.bild=function(szene,glow,state,dt){
  var m=PO.masseJetzt;
  if(!PO.an || !S || !m || PO.ruht) return;
  var gl=S.gl;
  if(gl.isContextLost()){ PO.aus('Kontextverlust'); return; }
  PO.bilder++;
  var st=PO.stimmung(state); PO.stimmungJetzt=st;
  PO.mischeGrade(PO.grade,PO.GRADE[st],1-Math.exp(-(dt||0)*3));   // ≈ 1 s Überblendung beim Stationswechsel
  // Bloom nur, wenn in diesem Bild etwas in die Glow-Ebene gemalt wurde (sonst kein Hochladen, kein Weichzeichnen)
  var g=PO.grade, k=S.kern, bloom=!!(glow && glow.cv && glow.dirty) && g.bloom>0.001;
  gl.bindVertexArray(S.vao);
  gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
  gl.activeTexture(gl.TEXTURE0); hochladen(gl,S.tSzene,szene,false);
  if(bloom){
    PO.bloomBilder++;
    // Glow-Ebene (vormultipliziert: Farben sind „Licht-Mengen“) → waagrecht in A (¼) → senkrecht in B
    gl.activeTexture(gl.TEXTURE1); hochladen(gl,S.tGlow,glow.cv,true);
    gl.useProgram(S.blur.p);
    gl.uniform1f(S.blur.u.w0,k.w0); gl.uniform4fv(S.blur.u.off,k.off); gl.uniform4fv(S.blur.u.wt,k.wt);
    gl.uniform1i(S.blur.u.tex,1);
    gl.bindFramebuffer(gl.FRAMEBUFFER,S.A.f); gl.viewport(0,0,S.A.w,S.A.h);
    gl.uniform2f(S.blur.u.dir,1.5/m.gw,0);
    gl.drawArrays(gl.TRIANGLES,0,3);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D,S.A.t);
    gl.uniform1i(S.blur.u.tex,2);
    gl.bindFramebuffer(gl.FRAMEBUFFER,S.B.f);
    gl.uniform2f(S.blur.u.dir,0,1.5/S.A.h);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,m.ow,m.oh);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D,S.B.t);
  var u=S.end.u;
  gl.useProgram(S.end.p);
  gl.uniform1i(u.szene,0); gl.uniform1i(u.bloom,2);
  gl.uniform2f(u.szPx,1/m.sw,1/m.sh);
  gl.uniform1f(u.scharf,m.skala<0.98?PO.SCHAERFE.hoch:PO.SCHAERFE.nativ);
  gl.uniform3fv(u.lift,g.lift); gl.uniform3fv(u.gam,g.gamma); gl.uniform3fv(u.gain,g.gain);
  gl.uniform1f(u.sat,g.sat); gl.uniform1f(u.kon,g.kon);
  gl.uniform1f(u.bloomK,bloom?g.bloom:0); gl.uniform3fv(u.tint,g.tint);
  gl.uniform1f(u.vignK,PO.vign?g.vign:0); gl.uniform2f(u.res,m.VW,m.VH);
  gl.drawArrays(gl.TRIANGLES,0,3);
};

PO.zustand=function(){
  var m=PO.masseJetzt;
  return { an:PO.an, ruht:PO.ruht, vign:PO.vign, grund:PO.grund, fehler:PO.fehler, bilder:PO.bilder, bloomBilder:PO.bloomBilder,
    stimmung:PO.stimmungJetzt, masse:m?{ RS:m.RS, aus:m.aus, sw:m.sw, sh:m.sh, ow:m.ow, oh:m.oh, gw:m.gw, gh:m.gh }:null,
    speicher:PO.speicher(PO.an?m:null) };
};
})();
