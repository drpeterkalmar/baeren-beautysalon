// kunden.js — r22 Kundenbesuche: Türglocke, ein Bär läuft herein, Wunsch-Blase mit Stations-Symbolen (ohne Schrift),
// Häkchen + Freu-Hüpfer beim Erfüllen. Kein Zeitdruck, kein Ablauf, ein ignorierter Wunsch hat keinen Nachteil.
// Mechanik-Ideen aus gemütlichen Lebens-Simulationen (VORLAGEN.md), alle Zahlen sind eigene Startwerte.
// Alle Regler stehen in EINER Parametergruppe K.P (aus der Adresse); Regler 0 = Verhalten vor r22.
// Reine Teile (Parameter, Wunsch- und Kunden-Auswahl) sind ohne Browser getestet: tests/unit/kunden.test.mjs.
(function(){
'use strict';
var S=window.BSSalon, Art=window.BSArt, Fx=window.BSFx;
var K=window.BSKunden={};
function sfx(n,o){ if(window.BSSfx) window.BSSfx.play(n,o); }
function now(){ return performance.now()/1000; }

// ---------------------------------------------------------------- Parametergruppe (alle URL-Regler an einer Stelle)
//   ?kunden=0/1   Kundenbesuche als Standard (0 = Menü → Bär wählen wie vor r22)
//   ?wunsch=1…3   Wünsche je Besuch
K.liesParameter=function(q){
  q=String(q||'');
  function roh(k){ var m=new RegExp('[?&]'+k+'=([^&#]*)').exec(q); return m?decodeURIComponent(m[1]):null; }
  function zahl(k,def,min,max){ var v=parseFloat(roh(k)); return isFinite(v)?Math.max(min,Math.min(max,v)):def; }
  return {
    kunden: zahl('kunden',1,0,1)>=0.5?1:0,
    wunsch: Math.round(zahl('wunsch',2,1,3)),
    einlauf: 1.2            // s, Hereinlaufen (Tipp überspringt)
  };
};
K.P=K.liesParameter((function(){ try{ return location.search||''; }catch(e){ return ''; } })());
K.an=function(){ return !!K.P.kunden; };

// ---------------------------------------------------------------- reine Teile
// Stationen, die sich ein Kunde wünschen kann (alle außer „Fertig!“)
K.WUNSCH_IDS=S.STATIONS.map(function(s){ return s.id; }).filter(function(id){ return id!=='finish'; });
K.station=function(id){ for(var i=0;i<S.STATIONS.length;i++) if(S.STATIONS[i].id===id) return S.STATIONS[i]; return null; };
// deterministischer Zufall (für Tests, Datum-Seeds)
K.zufall=function(seed){
  var s=seed>>>0;
  return function(){ s=(s+0x6D2B79F5)>>>0; var t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
};
// n verschiedene Wunsch-Stationen; opt.zuerst steht vorn (z. B. Geburtstag), opt.ohne wird ausgelassen
K.wuensche=function(n,rnd,opt){
  opt=opt||{}; rnd=rnd||Math.random;
  var pool=K.WUNSCH_IDS.filter(function(id){ return id!==opt.zuerst && (!opt.ohne || opt.ohne.indexOf(id)<0); });
  var out=opt.zuerst?[opt.zuerst]:[];
  while(out.length<n && pool.length){ out.push(pool.splice(Math.floor(rnd()*pool.length),1)[0]); }
  return out;
};
// Kunde wählen: zufälliges Modell (ohne die „Überraschung?“-Kachel), nicht einer der zuletzt da gewesenen
K.KUNDEN_ANZAHL=Art.MODELS.length-1;
K.waehleKunde=function(rnd,letzte){
  rnd=rnd||Math.random; letzte=letzte||[];
  var pool=[]; for(var i=0;i<K.KUNDEN_ANZAHL;i++) if(letzte.indexOf(i)<0) pool.push(i);
  if(!pool.length) for(var j=0;j<K.KUNDEN_ANZAHL;j++) pool.push(j);
  return pool[Math.floor(rnd()*pool.length)];
};

// ---------------------------------------------------------------- Besuch (Laufzeit)
K.besuch=null; K.letzte=[];
K.neuerBesuch=function(idx,opt){
  opt=opt||{};
  if(idx===undefined || idx===null || !Art.MODELS[idx]) idx=K.waehleKunde(Math.random,K.letzte);
  K.letzte=[idx].concat(K.letzte.filter(function(x){ return x!==idx; })).slice(0,2);
  S.baer=S.H.neuerBaer(idx); S.save();
  K.besuch={ idx:idx, wuensche:K.wuensche(K.P.wunsch,Math.random), erfuellt:{}, t:opt.schonDa?K.P.einlauf+0.3:0,
    da:!!opt.schonDa, fertig:false, aktionen:{} };
  S.setState('kunde');
  return K.besuch;
};
// „Weiter mit meinem Bären“: laufender Besuch → Wunsch-Blase wieder zeigen, sonst wie früher zum Waschen
K.weiter=function(){
  var B=K.besuch;
  if(B && !B.fertig && S.baer && S.baer.fellIdx===B.idx){ B.t=Math.max(B.t,K.P.einlauf+0.3); B.da=true; S.setState('kunde'); }
  else S.setState('waschen');
};
// Etwas in der Station getan (Knopf, Tippen auf Bär/Requisite, Rubbeln, Föhnen …) → Wunsch erfüllt?
K.aktion=function(){
  var B=K.besuch, st=S.state;
  if(!B || B.fertig) return false;
  var t=now(); if(B._aSt!==st || t-B._aT>=0.25){ B.aktionen[st]=(B.aktionen[st]||0)+1; B._aSt=st; B._aT=t; }   // Halten/Ziehen zählt höchstens 4× je s
  if(B.wuensche.indexOf(st)>=0 && !B.erfuellt[st]){ erfuellen(B,st); return true; }
  return false;
};
K.alleErfuellt=function(B){ B=B||K.besuch; return !!B && B.wuensche.every(function(id){ return !!B.erfuellt[id]; }); };
function kopfPunkt(){ var s=Math.min(S.VW,S.VH)/420; return [S.VW*0.5, S.VH*0.58-82*s]; }
function erfuellen(B,st){
  B.erfuellt[st]=now();
  var G=window.BSGame, k=kopfPunkt();
  if(S.baer) Art.react(S.baer,'happy',1.2);
  sfx('chime');
  if(G && G.herzPuff) G.herzPuff(k[0],k[1]-40);
  if(K.alleErfuellt(B)){ sfx('sparkle',{delay:0.35}); if(G && G.sternExplosion) G.sternExplosion(k[0],k[1]-90); }
}

// ---------------------------------------------------------------- Station „kunde“ (Ankunft + Wunsch-Blase)
// Gedankenblase: hochkant über dem Kopf (rechts versetzt, Kamera zeigt mehr Raum oben), quer rechts neben dem Kopf
function hoch(){ var L=window.BSUI && window.BSUI.L; return !L || L.port!==false; }
function blaseGeo(){
  var B=K.besuch, n=B?B.wuensche.length:2, r=hoch()?44:60, gap=16, w=n*2*r+(n-1)*gap+40, h=2*r+30;
  var s=Math.min(S.VW,S.VH)/420, kx=S.VW*0.5, ky=S.VH*0.58-82*s, kopfOben=S.VH*0.58-172*s;
  var cx, cy, tail;
  if(hoch()){ cx=kx+70; cy=kopfOben-78-h/2; tail=[[cx-50,cy+h/2+18,13],[cx-80,cy+h/2+44,8]]; }
  else { cx=kx+114*s+40+w/2; cy=ky-70; tail=[[cx-w/2-16,cy+h/2-2,12],[cx-w/2-38,cy+h/2+18,8]]; }
  var items=[]; for(var i=0;i<n;i++) items.push({id:B?B.wuensche[i]:null, x:cx-w/2+20+r+i*(2*r+gap), y:cy, r:r});
  return {cx:cx,cy:cy,w:w,h:h,r:r,items:items,tail:tail};
}
K.blaseGeo=blaseGeo;
// Kamera-Ausschnitt der Ankunft (game.js S.focusRect fragt S.FOKUS): Platz für die Blase
S.FOKUS=S.FOKUS||{};
S.FOKUS.kunde=function(){ return hoch() ? [150,-215,750,655] : [205,-40,905,655]; };
S.registerStation({
  id:'kunde',
  build:function(){
    var B=K.besuch; if(!B) return;
    S.H.stationTabs();
    S.hinweis='Was wünscht sich der Bär? Tippe ein Bild! 💭';
    B.wuensche.forEach(function(id,i){
      var st=K.station(id); if(!st) return;
      S.H.btn(30+i*200,100,190,60,st.icon+' '+st.name,function(){ S.setState(id); },{big:1,wunsch:id,primary:i===0});
    });
  },
  update:function(dt){
    var B=K.besuch; if(!B) return;
    var t0=B.t; B.t+=dt;
    if(t0<0.02 && B.t>=0.02 && !B.da) sfx('klingel');
    if(!B.da && B.t>=K.P.einlauf){ B.da=true; if(S.baer) Art.react(S.baer,'happy',0.9); }
    if(t0<K.P.einlauf+0.15 && B.t>=K.P.einlauf+0.15) sfx('pop',{pitch:1.2});
  },
  draw:function(g){
    var B=K.besuch, s=Math.min(S.VW,S.VH)/420;
    if(!B){ S.H.baer(g); return; }
    // Hereinlaufen von links mit kleinen Hüpf-Schritten
    var q=Math.min(1,B.t/K.P.einlauf), e=Fx.ease.outCubic(q);
    var dx=(1-e)*-560, dy=-Math.abs(Math.sin(q*Math.PI*4))*16*(1-q)*s;
    Art.drawBear(g,S.baer,{w:S.VW,h:S.VH,cx:S.VW*0.5+dx,cy:S.VH*0.58+dy});
    if(q<1) zeichneKlingel(g,B.t);
    var qb=Fx.seg(B.t,K.P.einlauf+0.05,K.P.einlauf+0.5);
    if(qb>0) zeichneBlase(g,Fx.ease.outBack(qb));
  },
  tap:function(x,y){
    var B=K.besuch; if(!B) return false;
    if(B.t<K.P.einlauf){ B.t=K.P.einlauf; return true; }        // Tipp überspringt das Hereinlaufen
    var G=blaseGeo();
    for(var i=0;i<G.items.length;i++){ var it=G.items[i];
      if(it.id && Math.hypot(x-it.x,y-it.y)<=it.r+8){ sfx('tap'); S.setState(it.id); return true; } }
    return false;
  }
});
function zeichneKlingel(g,t){
  // kleine schwingende Glocke oben links neben der Tür-Seite
  var x=hoch()?215:265, y=hoch()?-150:-10, a=Math.sin(t*18)*0.5*Math.max(0,1-t/1.2);
  g.save(); g.translate(x,y); g.rotate(a);
  g.font='64px sans-serif'; g.textAlign='center'; g.textBaseline='top'; g.fillText('🔔',0,0);
  g.restore();
}
function zeichneBlase(g,sc){
  var B=K.besuch, G=blaseGeo(), t=now();
  g.save(); g.translate(G.cx,G.cy); g.scale(sc,sc); g.translate(-G.cx,-G.cy);
  // Wolke + Spitze zum Kopf
  g.save(); g.shadowColor='rgba(110,50,50,0.25)'; g.shadowBlur=12; g.shadowOffsetY=4;
  g.fillStyle='#fffdf9';
  Fx.rr(g,G.cx-G.w/2,G.cy-G.h/2,G.w,G.h,G.h/2); g.fill();
  G.tail.forEach(function(c){ g.beginPath(); g.arc(c[0],c[1],c[2],0,Math.PI*2); g.fill(); });
  g.restore();
  G.items.forEach(function(it,i){
    var st=K.station(it.id), ok=!!B.erfuellt[it.id], wob=ok?0:Math.sin(t*3+i*1.7)*0.06;
    g.save(); g.translate(it.x,it.y); g.scale(1+wob,1+wob);
    g.fillStyle=ok?'#e3f6dc':'#fff1e6'; g.beginPath(); g.arc(0,0,it.r,0,Math.PI*2); g.fill();
    g.strokeStyle=ok?'#7cc46a':'#f4b9a6'; g.lineWidth=3; g.stroke();
    g.font='50px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#000';
    if(st) g.fillText(st.icon,0,2);
    if(ok) haken(g,it.r*0.62,it.r*0.62,16);
    g.restore();
  });
  g.restore();
}
function haken(g,x,y,r){
  g.fillStyle='#5cb85c'; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill();
  g.strokeStyle='#ffffff'; g.lineWidth=r*0.32; g.lineCap='round'; g.lineJoin='round';
  g.beginPath(); g.moveTo(x-r*0.45,y); g.lineTo(x-r*0.1,y+r*0.38); g.lineTo(x+r*0.5,y-r*0.35); g.stroke();
}
K.haken=haken;

// ---------------------------------------------------------------- Bildschirm-Teile (ui.js ruft sie)
// Wunsch-Leiste in den Stationen: kleine Wolke unter dem Haus-Knopf, Symbole mit Häkchen (gecacht je Zustand)
var leisteCache={key:'',cv:null};
K.leisteBreite=function(){ var n=K.besuch?K.besuch.wuensche.length:2; return 16+n*40+(n-1)*4+14; };
K.zeichneLeiste=function(g,L){
  var B=K.besuch; if(!B || B.fertig || !L || !L.top) return;
  var kb=S.buttons.filter(function(b){ return b.nav==='wunsch'; })[0];
  var n=B.wuensche.length, h=48, w=K.leisteBreite(), x=L.top.x, y=L.top.y+L.top.h+6, d=L.dpr||1;
  var key=B.wuensche.join(',')+'|'+B.wuensche.map(function(id){ return B.erfuellt[id]?1:0; }).join('')+'|'+d;
  if(leisteCache.key!==key){
    var pad=8, c=leisteCache.cv||Fx.canvas(1,1);
    c.width=Math.ceil((w+pad*2)*d); c.height=Math.ceil((h+pad*2)*d);
    var q=c.getContext('2d'); q.setTransform(d,0,0,d,0,0); q.clearRect(0,0,w+pad*2,h+pad*2); q.translate(pad,pad);
    q.save(); q.shadowColor='rgba(110,50,50,0.22)'; q.shadowBlur=6; q.shadowOffsetY=2;
    q.fillStyle='rgba(255,253,249,0.95)'; Fx.rr(q,0,0,w,h,h/2); q.fill(); q.restore();
    q.font='15px sans-serif'; q.textAlign='center'; q.textBaseline='middle'; q.fillText('💭',14,h/2+1);
    B.wuensche.forEach(function(id,i){
      var st=K.station(id), cx=30+i*44+12;
      q.font='26px sans-serif'; q.globalAlpha=B.erfuellt[id]?0.75:1; if(st) q.fillText(st.icon,cx,h/2+1); q.globalAlpha=1;
      if(B.erfuellt[id]) haken(q,cx+11,h/2+9,8);
    });
    leisteCache={key:key,cv:c,pad:pad};
  }
  // kurzes Aufploppen, wenn gerade ein Wunsch erfüllt wurde
  var jung=0; B.wuensche.forEach(function(id){ var e=B.erfuellt[id]; if(e) jung=Math.max(jung,1-Math.min(1,(now()-e)/0.5)); });
  var sc=1+0.18*Math.sin(jung*Math.PI), p=leisteCache.pad, pt=kb&&kb._tapT?now()-kb._tapT:9;
  if(pt<0.35) sc*=1+0.08*Math.sin(pt/0.35*Math.PI);
  g.save(); g.translate(x+w/2,y+h/2); g.scale(sc,sc);
  g.drawImage(leisteCache.cv,-w/2-p,-h/2-p,w+p*2,h+p*2);
  g.restore();
};
// Marke auf dem Stations-Reiter: Herz = Wunsch offen, grünes Häkchen = erfüllt
K.reiterMarke=function(g,b){
  var B=K.besuch; if(!B || B.fertig || !b.tab || !b.r || B.wuensche.indexOf(b.tab)<0) return;
  var x=b.r.x+b.r.w-9, y=b.r.y+9;
  if(B.erfuellt[b.tab]) haken(g,x,y,9);
  else { var p=1+0.12*Math.sin(now()*5); Art.drawSticker(g,'herz',x,y,8*p,'#f2837a'); }
};

// ---------------------------------------------------------------- Einhängen in salon.js
// Menü-Knöpfe im Kunden-Modus (salon.js buildUI ruft das statt der alten Knöpfe)
K.menuKnoepfe=function(btn){
  btn(230,430,440,64,'🔔 Kunde kommt!',function(){ K.neuerBesuch(); },{big:1,cta:1,primary:1});
  if(S.saved && S.saved.fell) btn(230,500,440,64,'🧸 Weiter mit meinem Bären',function(){ K.weiter(); },{big:1,cta:1});
  btn(230,570,440,64,'🌟 Bären einladen',function(){ S.setState('wahl'); },{big:1,cta:1});
};
// jede echte Handlung in einer Station meldet sich bei K.aktion
var origTap=S.tapBear;
S.tapBear=function(x,y){ var r=origTap.apply(this,arguments); if(r && S.state!=='kunde' && S.state!=='finish-done') K.aktion(); return r; };
// Wunsch-Leiste als Knopf (unter dem Haus): führt zum nächsten offenen Wunsch, sind alle erfüllt → „Fertig!“
K.naechsterWunsch=function(){
  var B=K.besuch; if(!B) return null;
  for(var i=0;i<B.wuensche.length;i++) if(!B.erfuellt[B.wuensche[i]] && B.wuensche[i]!==S.state) return B.wuensche[i];
  return K.alleErfuellt(B) ? 'finish' : null;
};
var origBuild=S.buildUI;
S.buildUI=function(){
  var r=origBuild.apply(this,arguments);
  var B=K.besuch, st=S.state;
  if(B && !B.fertig && K.station(st) && st!=='finish'){
    S.H.btn(16,80,120,48,'💭',function(){ var z=K.naechsterWunsch(); if(z) S.setState(z); },{nav:'wunsch',selbst:1});
  }
  S.buttons.forEach(function(b){
    if(b.nav || b.tab || b.wunsch || b.finCta || b.cta || b._kw || typeof b.onTap!=='function') return;
    var f=b.onTap; b._kw=1; b.onTap=function(){ K.aktion(); return f.apply(this,arguments); };
  });
  return r;
};
var origUpdate=S.update;
S.update=function(dt){
  if(K.besuch && dt>0 && S.foehn && S.state==='foehnen') K.aktion();   // Föhn-Knopf wird gehalten (kein onTap)
  return origUpdate.apply(this,arguments);
};
if(typeof S.dragBear==='function'){ var origDrag=S.dragBear; S.dragBear=function(){ K.aktion(); return origDrag.apply(this,arguments); }; }
// „Bären einladen“: das Kind sucht sich den Kunden selbst aus — er kommt angelaufen und hat ebenfalls Wünsche
var origChoose=S.chooseBear;
S.chooseBear=function(i){
  if(!K.an()){ K.besuch=null; return origChoose.apply(this,arguments); }
  var surprise=i===Art.MODELS.length-1;
  K.neuerBesuch(surprise?K.waehleKunde(Math.random,[]):i);
  sfx(surprise?'tada':'chime');
  if(surprise && window.BSGame){ window.BSGame.konfettiBurst(S.VW/2,S.VH*0.4); window.BSGame.sternExplosion(S.VW/2,S.VH*0.5); }
};
var origFinale=S.startFinale;
S.startFinale=function(){ if(K.besuch) K.besuch.fertig=true; return origFinale.apply(this,arguments); };
})();
