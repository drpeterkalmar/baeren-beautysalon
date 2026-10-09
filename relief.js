// relief.js — r21 E2 „Fell und Stoff mit Struktur“ (Grafik-Audit #7): gebackene Normalen-Beleuchtung.
// Aus einem prozeduralen Höhenfeld (Fell-Fasern, Frottee-Schlingen, Samt, Webstoff) werden Normalen berechnet und mit
// einer Lichtrichtung beleuchtet (Lambert). Ergebnis ist eine graue, kachelbare Textur um 50 % Grau, die — genau wie die
// vorhandene Flausch-Kachel in art.js — per 'soft-light' eingerechnet wird: 50 % Grau = keine Änderung, heller = Licht,
// dunkler = Schatten. Das passiert NUR beim Backen (Bären-Teil-Sprites, Raum-Cache, Vorhang-Sprite), nie pro Bild.
// Licht: Raum-Stoffe (Handtuchrollen, Sessel-Polster, Vorhänge, Teppich) aus der Richtung des Fensters; das Bärenfell aus
// der Richtung des Keylights oben links, mit dem art.js die Form schattiert (sonst widerspräche sich das Licht am Bären).
// ?fell=0 → alles aus (Bild wie vor r21). Reine Teile (Höhenfelder, Licht, Richtungen) sind ohne Browser getestet:
// tests/unit/relief.test.mjs. TODO Heavy-Job: Stärken/Maßstäbe in ZIELE sind Startwerte (am Bild abstimmen), Backzeit messen
// (Raum-/Stationswechsel p95; > +30 ms → MIN_STUFE = 1).
(function(){
'use strict';
var Fx=window.BSFx, TAU=Math.PI*2;
var RF=window.BSRelief={};
RF.an=!/[?&]fell=0(&|$)/.test((function(){ try{ return location.search||''; }catch(e){ return ''; } })());
RF.MIN_STUFE=0;                  // erst ab dieser Qualitätsstufe backen (Stufe gilt beim Backen; Sprites behalten ihren Stand)
RF.aktiv=function(){ return RF.an && (Fx ? Fx.Q.tier : 2)>=RF.MIN_STUFE; };
RF.N=128;                        // Kachelgröße (Texel); alle Raster-Abstände unten teilen 128

// Fenster (deko.js WIN: x 660, y 74, 170 × 220) und Keylight des Bären (art.js shadeForm: Licht bei −0,36·rx / −0,44·ry)
RF.FENSTER=[745,184];
RF.HOEHE_GRAD=38;                // Lichthöhe über der Fläche in Grad (flach = mehr Struktur)

// Ziele: Höhenfeld-Art, Stärke (globalAlpha der soft-light-Füllung), Maßstab (Welt-/Bär-Einheiten je Texel), Relief-Tiefe.
// Abgestimmt auf eine Grau-Streuung der Kachel × Stärke von ≈ 7 … 15 Stufen (Fell ≈ 9, Frottee ≈ 15, Polster ≈ 7) —
// sichtbar, aber nicht fleckig; Unit-Test hält die Kachel-Streuung in 5 … 40.
RF.ZIELE={
  fell:    { art:'fell',    amt:0.5,  skala:0.42, tiefe:2.2 },
  frottee: { art:'frottee', amt:0.5,  skala:0.3,  tiefe:1.8 },
  polster: { art:'samt',    amt:0.55, skala:0.5,  tiefe:3.0 },
  vorhang: { art:'stoff',   amt:0.4,  skala:0.32, tiefe:1.0 },
  teppich: { art:'frottee', amt:0.4,  skala:0.45, tiefe:1.4 }
};

// ---------------------------------------------------------------- reine Teile (Node-testbar)
function rng(seed){ var s=(seed>>>0)||1; return function(){ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)%100000)/100000; }; }
RF.rng=rng;
// weicher runder Buckel, kachelbar (Koordinaten modulo N)
function buckel(h,N,x,y,r,amp){
  var R=Math.ceil(r), r2=r*r, x0=Math.round(x), y0=Math.round(y);
  for(var dy=-R;dy<=R;dy++) for(var dx=-R;dx<=R;dx++){
    var ex=x0+dx-x, ey=y0+dy-y, d2=ex*ex+ey*ey; if(d2>=r2) continue;
    var q=1-d2/r2, xi=((x0+dx)%N+N)%N, yi=((y0+dy)%N+N)%N;
    h[yi*N+xi]+=amp*q*q;
  }
}
// Faser: Kette kleiner Buckel entlang einer Richtung, zur Spitze dünner
function faser(h,N,x,y,ang,len,w,amp){
  var cx=Math.cos(ang), cy=Math.sin(ang);
  for(var t=0;t<=len;t+=0.6){ var k=1-0.55*t/len; buckel(h,N,x+cx*t,y+cy*t,w*k,amp*k); }
}
function normiere(h){
  var mn=Infinity, mx=-Infinity, i;
  for(i=0;i<h.length;i++){ if(h[i]<mn) mn=h[i]; if(h[i]>mx) mx=h[i]; }
  var d=mx-mn||1; for(i=0;i<h.length;i++) h[i]=(h[i]-mn)/d;
  return h;
}
/** Höhenfeld N×N (Float32Array, 0…1, kachelbar). art: fell | frottee | samt | stoff */
RF.hoehe=function(art,N,seed){
  N=N||RF.N; var h=new Float32Array(N*N), R=rng(seed||(art.length*7919+31)), i;
  if(art==='fell'){
    for(i=0;i<36;i++) buckel(h,N,R()*N,R()*N,9+R()*12,0.35);                      // Büschel
    for(i=0;i<720;i++) faser(h,N,R()*N,R()*N,Math.PI/2+(R()-0.5)*0.9,6+R()*9,1.3+R()*0.9,0.3+R()*0.3); // Haare, nach unten
  } else if(art==='frottee'){
    for(var gy=0;gy<N;gy+=4) for(var gx=0;gx<N;gx+=4)                              // Schlingen im 4er-Raster
      buckel(h,N,gx+(gy%8?2:0)+(R()-0.5)*1.4,gy+(R()-0.5)*1.4,1.6+R()*0.8,0.6+R()*0.4);
    for(i=0;i<300;i++) buckel(h,N,R()*N,R()*N,0.9,0.15+R()*0.2);
  } else if(art==='samt'){
    for(i=0;i<70;i++) buckel(h,N,R()*N,R()*N,6+R()*10,0.25+R()*0.2);               // weiche Dellen
    for(i=0;i<2600;i++) buckel(h,N,R()*N,R()*N,0.9,0.06+R()*0.06);                  // feiner Flor
  } else { // stoff: Leinwandbindung (Kette/Schuss im 4er-Raster, abwechselnd oben) + unregelmäßige Fäden
    var dick=[]; for(i=0;i<N/4;i++) dick.push(0.8+R()*0.4);
    for(var y=0;y<N;y++) for(var x=0;x<N;x++){
      var cxp=Math.floor(x/4), cyp=Math.floor(y/4), oben=((cxp+cyp)&1)===0;
      var kette=Math.pow(Math.cos(Math.PI*((x%4)+0.5-2)/4),2)*dick[cxp], schuss=Math.pow(Math.cos(Math.PI*((y%4)+0.5-2)/4),2)*dick[cyp];
      h[y*N+x]=oben ? 0.35+0.65*kette*(0.6+0.4*schuss) : 0.35+0.65*schuss*(0.6+0.4*kette);
    }
  }
  return normiere(h);
};
/** Lichtrichtung (Einheitsvektor, y nach unten wie im Canvas) von der Fläche bei (ox,oy) zur Lichtquelle (lx,ly),
    angehoben um hoeheGrad über die Fläche. */
RF.richtung=function(lx,ly,ox,oy,hoeheGrad){
  var a=(hoeheGrad===undefined?RF.HOEHE_GRAD:hoeheGrad)*Math.PI/180, dx=lx-ox, dy=ly-oy, d=Math.hypot(dx,dy);
  if(d<1e-6) return [0,0,1];
  var c=Math.cos(a); return [dx/d*c, dy/d*c, Math.sin(a)];
};
RF.fenster=function(ox,oy){ return RF.richtung(RF.FENSTER[0],RF.FENSTER[1],ox,oy); };
// Keylight des Bären: oben links (wie shadeForm in art.js)
RF.KEY=RF.richtung(-0.36,-0.44,0,0);
/** Beleuchtete Graustufen-Kachel (RGBA, Mittelwert 128). tiefe = Relief-Höhe in Texeln, kontrast = Helligkeit je Lambert-Einheit */
RF.licht=function(h,N,L,tiefe,kontrast){
  tiefe=tiefe||2; kontrast=kontrast||150;
  var v=new Float32Array(N*N), sum=0, x, y;
  for(y=0;y<N;y++){
    var yu=((y-1+N)%N)*N, yd=((y+1)%N)*N, yc=y*N;
    for(x=0;x<N;x++){
      var xl=(x-1+N)%N, xr=(x+1)%N;
      var dx=(h[yc+xr]-h[yc+xl])*0.5*tiefe, dy=(h[yd+x]-h[yu+x])*0.5*tiefe;
      var il=1/Math.sqrt(dx*dx+dy*dy+1);
      var d=(-dx*L[0]-dy*L[1]+L[2])*il - L[2];                                    // gegen die flache Fläche
      // Höhe selbst leicht mit (Spitzen etwas heller, Täler dunkler: Ambient-Okklusion des Reliefs)
      d+=(h[yc+x]-0.5)*0.12;
      v[yc+x]=d; sum+=d;
    }
  }
  var mid=sum/(N*N), out=new Uint8ClampedArray(N*N*4);
  for(var i=0;i<N*N;i++){ var g=128+(v[i]-mid)*kontrast; out[i*4]=out[i*4+1]=out[i*4+2]=g; out[i*4+3]=255; }
  return out;
};
/** Winkel der Lichtrichtung auf 16 Stufen gerundet (Cache-Schlüssel; gleiche Kachel für ähnliche Richtungen) */
RF.stufe=function(L){ var a=Math.atan2(L[1],L[0]); return ((Math.round(a/(TAU/16))%16)+16)%16; };
RF.ausStufe=function(q,hoeheGrad){ var a=q*TAU/16, e=(hoeheGrad===undefined?RF.HOEHE_GRAD:hoeheGrad)*Math.PI/180; return [Math.cos(a)*Math.cos(e),Math.sin(a)*Math.cos(e),Math.sin(e)]; };

// ---------------------------------------------------------------- Kacheln (Canvas) + Auftragen beim Backen
var HF={}, KA={};
RF.anzahl=function(){ return Object.keys(KA).length; };
RF.schluessel=function(){ return Object.keys(KA); };   // 'ziel|richtungsstufe' (Tests, Diagnose)
RF.zeit=0;                       // ms, die das Kachel-Backen insgesamt gekostet hat (für die Messung)
RF.kachel=function(ziel,L){
  var Z=RF.ZIELE[ziel], q=RF.stufe(L), key=ziel+'|'+q;
  if(KA[key]) return KA[key];
  var t0=(typeof performance!=='undefined')?performance.now():0, N=RF.N;
  var h=HF[Z.art]||(HF[Z.art]=RF.hoehe(Z.art,N));
  var px=RF.licht(h,N,RF.ausStufe(q),Z.tiefe);
  var c=Fx.canvas(N,N), g=c.getContext('2d'), id=g.createImageData(N,N);
  id.data.set(px); g.putImageData(id,0,0);
  if(t0) RF.zeit+=performance.now()-t0;
  return (KA[key]=c);
};
/** Relief auf ein Rechteck (Koordinaten wie g) auftragen; der Aufrufer clippt auf die Form. L = Lichtrichtung. */
RF.auftragen=function(g,ziel,L,x,y,w,h,staerke){
  if(!RF.aktiv() || !(w>0 && h>0)) return;
  var Z=RF.ZIELE[ziel]; if(!Z) return;
  var pat=g.createPattern(RF.kachel(ziel,L),'repeat'); if(!pat) return;
  var s=Z.skala;
  g.save(); g.globalCompositeOperation='soft-light'; g.globalAlpha=Z.amt*(staerke===undefined?1:staerke);
  g.scale(s,s); g.fillStyle=pat; g.fillRect(x/s,y/s,w/s,h/s);
  g.restore();
};
/** Form (pfad(g) legt den Pfad an) mit Relief füllen: clip → auftragen. Für Raum-Stoffe (Licht aus dem Fenster). */
RF.flaeche=function(g,ziel,pfad,x,y,w,h,staerke){
  if(!RF.aktiv()) return;
  g.save(); pfad(g); g.clip();
  RF.auftragen(g,ziel,RF.fenster(x+w/2,y+h/2),x,y,w,h,staerke);
  g.restore();
};
})();
