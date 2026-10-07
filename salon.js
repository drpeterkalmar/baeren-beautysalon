// salon.js — Stationen als State-Machine + Buttons (DOM-frei, alles auf Canvas)
(function(){
'use strict';
var Art = window.BSArt;
var Fx = window.BSFx;
// Juice-Helfer: Sound + Partikel + Bär-Reaktion (alle optional, falls Module fehlen)
function sfx(n,o){ if(window.BSSfx) window.BSSfx.play(n,o); }
function react(k,a){ if(S.baer) Art.react(S.baer,k,a); }
function emit(type,x,y,o){ if(Fx) Fx.P.emit(type,x,y,o); }
function headPos(){ var s=Math.min(S.VW,S.VH)/420; return [S.VW*0.5, S.VH*0.58-82*s]; }
function accPop(key){ if(!S.baer._accT) S.baer._accT={}; S.baer._accT[key]=performance.now()/1000; }

var S = window.BSSalon = {};
S.VW = 900; S.VH = 600;

S.STATIONS = [
  {id:'waschen',  icon:'🛁', name:'Waschen'},
  {id:'foehnen',  icon:'🚿', name:'Föhnen'},
  {id:'schneiden',icon:'✂️', name:'Schneiden'},
  {id:'pfoten',   icon:'💅', name:'Pfoten'},
  {id:'massage',  icon:'💆', name:'Massage'},
  {id:'spa',      icon:'💎', name:'Spa-Maske'},
  {id:'tanz',     icon:'🎵', name:'Tanz'},
  {id:'zirkus',   icon:'🎪', name:'Zirkus'},
  {id:'parfum',   icon:'🌸', name:'Parfum'},
  {id:'makeup',   icon:'💄', name:'Make-up'},
  {id:'schmuecken',icon:'🎀', name:'Schmücken'},
  {id:'eis',       icon:'🍦', name:'Eisdiele'},
  {id:'zuckerwatte',icon:'🍬', name:'Zuckerwatte'},
  {id:'ballon',   icon:'🎈', name:'Ballons'},
  {id:'zauber',   icon:'🌈', name:'Zauber'},
  {id:'geschenke',icon:'🎁', name:'Geschenke'},
  {id:'keks',     icon:'🍪', name:'Kekse'},
  {id:'karussell', icon:'🎠', name:'Karussell'},
  {id:'geburtstag',icon:'🎂', name:'Geburtstag'},
  {id:'disco',     icon:'🪩', name:'Disco'},
  {id:'foto',      icon:'📸', name:'Foto'},
  {id:'malbuch',  icon:'🎨', name:'Malbuch'},
  {id:'aquarium', icon:'🐟', name:'Aquarium'},
  {id:'finish',   icon:'✨', name:'Fertig!'}
];


// Tiefe Kopie (alles im Bären-Zustand ist JSON): Album-Fotos teilen nie Objekte mit dem Bären
function kopie(x){ return x===undefined ? undefined : JSON.parse(JSON.stringify(x)); }
function neuerBaer(fellIdx){
  return { fellIdx: fellIdx, fell: Art.MODELS[fellIdx].fell,
    haar: Art.HAAR[0], frisur: 'lockig', lack:{}, schaum:0, fluff:0,
    tropfen:[], bow:0, breathe:0, blink:0, relax:0,
    gurkeL:false, gurkeR:false, duft:null,
    makeup:{rouge:null,lid:null,gp:[]},
    acc:{hut:null,schleife:null,brille:null,kette:null},
    sticker:[] };
}

Art.DUFTE = [
  {name:'Garten', icon:'🌷', c:'#7ec850'},
  {name:'Vanille', icon:'🍦', c:'#e8c878'},
  {name:'Meer', icon:'🌊', c:'#5aa8e8'},
  {name:'Wald', icon:'🌲', c:'#4a8860'}
];

S.state = 'menu';          // menu | wahl | station-<id> | finish-done
S.eis = null; S.fotoRahmen = 0; S.fotoBadge = false; S.flash = 0; S.rainbow = 0;
S.tanz = null; S.zirkus = null; S.album = [];
S.baer = neuerBaer(0);
S.saved = null;
try{ S.saved = JSON.parse(localStorage.getItem('bs_baer')||'null'); }catch(e){}
try{ S.album = JSON.parse(localStorage.getItem('bs_album')||'[]'); }catch(e){ S.album=[]; }
if(!Array.isArray(S.album)) S.album=[]; // kaputter Speicher (z. B. '{}') darf „Klick!“ nicht werfen lassen
if(S.saved && Art.MODELS[S.saved.fellIdx||0]){
  var idx = S.saved.fellIdx||0;
  S.saved.fell = Art.MODELS[idx].fell; // Modell-Farbe hat Vorrang vor altem Save
  S.baer = Object.assign(neuerBaer(idx), S.saved);
  S.baer.tropfen=[]; S.baer.schaum=0; S.baer.fluff=0; S.baer.bow=0; S.baer.relax=0;
  if(!S.baer.makeup) S.baer.makeup={rouge:null,lid:null,gp:[]};
}

S.save = function(){
  try{ localStorage.setItem('bs_baer', JSON.stringify({
    fellIdx:S.baer.fellIdx, haar:S.baer.haar, frisur:S.baer.frisur,
    lack:S.baer.lack, acc:S.baer.acc, sticker:S.baer.sticker, makeup:S.baer.makeup,
    gurkeL:S.baer.gurkeL, gurkeR:S.baer.gurkeR, duft:S.baer.duft
  })); }catch(e){}
  // Menü soll „Weiter mit meinem Bären“ schon in derselben Sitzung zeigen (nicht erst nach dem Neuladen)
  S.saved = S.saved || {}; S.saved.fell = S.baer.fell; S.saved.fellIdx = S.baer.fellIdx;
};

// ---- Buttons ----------------------------------------------
var buttons = [];
S.buttons = buttons;
function btn(x,y,w,h,label,fn,opt){
  var b = {x:x,y:y,w:w,h:h,label:label,onTap:fn};
  if(opt) for(var k in opt) b[k]=opt[k];
  buttons.push(b); return b;
}
function muteButton(){
  var b = btn(S.VW-72,16,56,56, S.muted?'🔇':'🔊', function(){ S.toggleMute(); if(window.BSSfx) window.BSSfx.syncMute(); },{nav:'mute'});
  return b;
}

// ---- Stations-Registry (Umbau Schritt 10) ------------------
// Eine Station meldet sich aus stations/<id>.js (nach salon.js geladen) mit
// S.registerStation({id, build, back, draw, update, tap, hit, onEnter, onLeave}) an. buildUI/draw/drawDeko/update/
// tapBear rufen nur noch die Registry (alle 24 Stationen liegen in stations/<id>.js).
//   build()      Knöpfe/Hinweis (nach stationTabs-freien Rück-/Weiter-Knöpfen)    back(g)  Hintergrund-Deko (vor Duftwolken)
//   draw(g)      Welt der Station (Bär, Requisiten)                                update(dt,fr)  Simulation pro Bild
//   tap(x,y)     Antippen in Welt-Koordinaten → true, wenn verbraucht             hit()    Hit-Boxen aus dem Zustand
//   frueh(dt)    Stations-Logik pro Bild VOR der Pose des Bären (game.js update() ruft S.updateFrueh am Anfang)
//   onLeave(neu)/onEnter(alt)  Aufräumen beim Zustandswechsel
var REG = S.REG = {};
S.registerStation = function(def){
  if(!def || !def.id) throw new Error('registerStation: id fehlt');
  REG[def.id] = def; return def;
};
// Helfer für Stations-Dateien (dieselben Funktionen wie hier im Modul; befüllt am Dateiende)
S.H = {};
// Zustandswechsel an einer Stelle: Zustand setzen + Knöpfe neu bauen. Die Haken (onLeave/onEnter) laufen in
// S.buildUI beim Erkennen des Wechsels — so greifen sie auch, wenn Prüfwerkzeuge S.state direkt setzen.
S.setState = function(id){ S.state = id; S.buildUI(); };
function wechsel(alt, neu){
  var A = REG[alt], N = REG[neu];
  if(A && A.onLeave) A.onLeave(neu);
  if(N && N.onEnter) N.onEnter(alt);
}

S.buildUI = function(){
  buttons.length = 0;
  if(typeof S.toggleMute==='function') muteButton();
  var st = S.state;
  if(st==='menu'){
    // Menü-Vorschau: IMMER Braunbär (idx 0), Frisur+Haarfarbe+1 Accessoire wechseln zufällig
    // (salon-fair und robust gegen Modell-Details, die auf dem Menü fehlplatziert wirken)
    var mb = neuerBaer(0);
    mb.frisur = Art.FRISEURE[Math.floor(Math.random()*Art.FRISEURE.length)];
    mb.haar = Art.HAAR[Math.floor(Math.random()*Art.HAAR.length)];
    var accWahl=Math.floor(Math.random()*5);
    if(accWahl===0) mb.acc.hut=Art.HUTE[Math.floor(Math.random()*Art.HUTE.length)];
    else if(accWahl===1) mb.acc.schleife=Art.SCHLEIFEN[Math.floor(Math.random()*Art.SCHLEIFEN.length)];
    else if(accWahl===2) mb.acc.brille=Art.BRILLEN[Math.floor(Math.random()*Art.BRILLEN.length)];
    else if(accWahl===3) mb.acc.kette=Art.KETTEN[Math.floor(Math.random()*Art.KETTEN.length)];
    S.menuBaer = Object.assign(mb, {breath:0});
  } else if(st!=='wahl'){ S.flash=0; }
  if(S._prev!==st){ var alt=S._prev; S._prev = st; if(alt!==undefined) wechsel(alt, st); }
  if(st==='menu'){
    if(S.saved && S.saved.fell){
      btn(230,458,440,64,'🧸 Weiter mit meinem Bären',function(){ S.setState('waschen'); },{big:1,cta:1,primary:1});
      btn(230,534,440,64,'🌟 Neuen Bären wählen',function(){ S.setState('wahl'); },{big:1,cta:1});
    } else {
      btn(230,500,440,70,'▶️ Los geht’s!',function(){ S.setState('wahl'); },{big:1,cta:1,primary:1});
    }
    return;
  }
  if(st==='wahl'){
    btn(16,16,120,56,'🏠',function(){ S.setState('menu'); },{nav:'home'});
    return;
  }
  if(st==='finish-done'){
    btn(16,16,120,56,'🏠',function(){ S.fin=null; S.setState('menu'); },{nav:'home'});
    btn(150,518,280,62,'🐻 Neuer Bär',function(){ S.fin=null; S.setState('wahl'); },{big:1,cta:1,finCta:1});
    btn(470,518,280,62,'🔄 Nochmal',function(){ S.fin=null; S.baer=neuerBaer(S.baer.fellIdx); S.setState('waschen'); },{big:1,cta:1,finCta:1,primary:1});
    return;
  }
  backButtons();
  var R = REG[st];
  if(R && R.build) R.build();
};

function backButtons(){
  btn(16,16,120,56,'🏠',function(){ S.setState('menu'); },{nav:'home'});
  var i = S.STATIONS.map(function(s){return s.id;}).indexOf(S.state);
  if(i>=0 && i < S.STATIONS.length-1){
    btn(S.VW-150,16,134,56,'➜',function(){
      S.setState(S.STATIONS[i+1].id); S.save();
    },{nav:'next'});
  }
}

function stationTabs(){
  // Reihen à 12 Tabs (24 Stationen), 2 Reihen — kompakt
  for(var j=0;j<S.STATIONS.length;j++){
    (function(st,j){
      btn(6+(j%12)*74, S.VH-118+Math.floor(j/12)*56, 70, 52, st.icon+' '+st.name, function(){
        S.setState(st.id);
      }, {active:function(){ return S.state===st.id; }, small:1, tiny:1, tab:st.id, icon:st.icon, name:st.name});
    })(S.STATIONS[j],j);
  }
}
// ---- Stations-Builder --------------------------------------


// ---- Simulation pro Bild ----------------------------------
// Von game.js update(dt) aufgerufen (dt ≤ 0,05 s), direkt vor BSDeko.update. Die Zeichenfunktionen lesen danach
// nur noch Zustand. fr = dt*60 („Bilder à 60 Hz“): die alten Schritte pro Bild (0.016, t++, …) werden mit fr
// skaliert → bei 60 Hz exakt wie vorher, bei 30/90/120 Hz gleich schnell pro Sekunde.
// Stations-Logik, die die Pose des Bären im selben Bild beeinflusst (Entspannung, Schütteln, Flausch …):
// game.js ruft sie am Anfang von update(), also vor Art.updateBear — Reihenfolge wie früher in game.js.
S.updateFrueh = function(dt){
  var R=REG[S.state];
  if(R && R.frueh) R.frueh(dt);
};
S.update = function(dt){
  if(!(dt>0)) return;
  var fr=dt*60, st=S.state, R=REG[st];
  if(R && R.update) R.update(dt, fr);
};

// ---- Zeichnen ----------------------------------------------
// ---- Zeichnen: nur noch WELT (Kamera, Raum, Licht, HUD/Buttons kommen aus game.js + ui.js) ----------
S.draw = function(g){
  var W=S.VW,H=S.VH;
  drawDeko(g);
  if(S.state==='menu'){ drawSchmetterlinge(g); Art.drawBear(g,S.menuBaer||S.baer,{w:W,h:H}); return; }
  if(S.state==='wahl') return;
  if(S.state==='finish-done'){ drawFinaleWelt(g); return; }
  // Duft-Wolken im Stations-Screen
  if(S.baer && S.baer.duft!==null && S.baer.duft!==undefined) drawDuftWolken(g);
  var R=REG[S.state];
  if(R){ if(R.draw) R.draw(g); return; }
  S.H.baer(g); // Zustand ohne Station (kommt nicht vor): wenigstens den Bären zeigen
};

// ================= HELD-MOMENT: Vorher/Nachher-Enthüllung =================
// Zeitplan (Sekunden seit "Fertig!"):
//  0.00 UI gleitet weg, Licht dimmt auf Spot, Musik duckt, Trommelwirbel
//  0.35 Puff! → das Vorher-Foto (zerzaust, stumpf) steht da
//  0.90–2.45 magische Licht-Klinge wischt diagonal und enthüllt den Nachher-Bären (Augen noch zu)
//  2.50 TA-DA: Sprung (Squash&Stretch), Arme hoch, Blitz, Konfetti-Kanonen, Kamera-Punch aufs Gesicht
//  2.95 Glanz-Sweep übers Fell · 3.1 Titel · 3.6 Vorher-Polaroid fliegt in die Ecke
//  4.0/4.25/4.5 drei Sterne · 4.9 Knöpfe · danach Feier-Loop (Winken, Nieseln, Funkeln)
var FIN = S.FIN = {poof:0.35, wipe0:0.9, wipe1:2.45, tada:2.5, glint:2.95, title:3.1, pola:3.6, star:4.0, cta:4.9};
S.startFinale = function(){
  S.state='finish-done';
  S.fin={t:0, fired:{}, vorher:null};
  S.save(); S.buildUI();
  sfx('whoosh');
};
// Tipp während der Spannung: direkt zur Enthüllung springen
S.finaleSkip = function(){ var F=S.fin; if(F && F.t>0.5 && F.t<FIN.wipe1-0.3){ F.t=FIN.wipe1-0.3; } };
function fire(F,key,at,fn){ if(!F.fired[key] && F.t>=at){ F.fired[key]=1; fn(); } }
S.updateFinale = function(dt){
  var F=S.fin; if(!F) return;
  F.t+=dt; var t=F.t, W=S.VW, H=S.VH, s=Math.min(W,H)/420, cx=W/2, cy=H*0.58;
  var G=window.BSGame||{}, X=window.BSSfx;
  if(!F.vorher && G.pxPerUnit) F.vorher=Art.renderVorher(S.baer, Math.min(2.4,G.pxPerUnit()*1.2));
  fire(F,'duck',0.02,function(){ if(X) X.duck(0.3); });
  fire(F,'drum',0.3,function(){ sfx('drumroll',{dur:FIN.tada-0.3}); });
  fire(F,'poof',FIN.poof,function(){
    sfx('poof');
    emit('puff',cx,cy+10*s,{n:30,speed:300,size:70,life:0.95,grav:-30,drag:3,colors:['#fff6ea','#fbe7d2','#f6dcc4'],jx:110*s,jy:150*s});
  });
  fire(F,'magic',FIN.wipe0,function(){ sfx('magic'); });
  fire(F,'tada',FIN.tada,function(){
    sfx('tada'); sfx('cannon'); sfx('cannon',{delay:0.07});
    react('pop',1.7);
    if(G.cannons) G.cannons();
    emit('star',cx,cy-60*s,{n:28,speed:560,size:15,life:1.25,grav:420,drag:1.5,colors:['#ffe19a','#fff4d6','#f6a57a','#f4a6b8','#b9d4ad']});
    emit('ring',cx,cy-40*s,{n:1,speed:0,size:430*s,life:0.75,grav:0,drag:0,colors:['#fff1d6']});
    emit('twinkle',cx,cy-60*s,{n:16,speed:420,size:30,life:1.0,grav:0,drag:2.4});
  });
  fire(F,'land',FIN.tada+0.56,function(){
    react('land',1); sfx('boing');
    emit('puff',cx,cy+196*s,{n:12,speed:230,dir:0,spread:Math.PI*2,size:36,life:0.6,grav:-20,drag:4,colors:['#fff3e3','#f8e2c8'],jx:120*s});
  });
  fire(F,'title',FIN.title,function(){ sfx('sparkle'); });
  fire(F,'pola',FIN.pola,function(){ sfx('whoosh'); });
  [0,1,2].forEach(function(i){ fire(F,'star'+i,FIN.star+i*0.25,function(){ sfx('ding',{i:i}); if(G.starBurst) G.starBurst(i); }); });
  fire(F,'cta',FIN.cta,function(){ sfx('pop'); });
  fire(F,'unduck',5.8,function(){ if(X) X.duck(1); });
  // Funken an der Licht-Klinge
  if(t>FIN.wipe0 && t<FIN.wipe1){
    var lx=S.finWipeX(), yy=cy-240*s+Math.random()*480*s, lxx=lx+(yy-cy)*0.22;
    if(Math.random()<dt*45) emit('twinkle',lxx,yy,{n:1,speed:70,size:20,life:0.7,grav:-40,drag:2});
    if(Math.random()<dt*80) emit('spark',lxx,yy,{n:1,speed:160,dir:Math.PI,spread:1.3,size:11,life:0.8,grav:60,colors:['#ffe3a8','#fff6e0','#f6b98f']});
  }
  // Feier-Loop
  if(t>FIN.cta){
    F.dz=(F.dz||0)+dt;
    if(F.dz>0.14){ F.dz=0; if(G.drizzle) G.drizzle(); }
    if(Math.random()<dt*1.4) emit('twinkle',cx+(Math.random()-0.5)*320*s,cy+(Math.random()-0.62)*400*s,{n:1,speed:10,size:24,life:0.8,grav:0});
  }
};
S.finWipeX = function(){
  var F=S.fin; if(!F) return 2000;
  return Fx.lerp(80,830,Fx.ease.inOutCubic(Fx.seg(F.t,FIN.wipe0,FIN.wipe1)));
};
// Pose-Umgebung für Art.updateBear im Finale
S.finaleEnv = function(env){
  var F=S.fin; if(!F) return env;
  var t=F.t;
  if(t<FIN.tada-0.18){
    env.sleepy=t>FIN.poof?1:0; env.mouth=0; env.happy=0; env.arms=0; env.jumpY=0; env.pointer=null;
  } else {
    var j=t-FIN.tada, up=0.27, dn=0.29;
    env.jumpY = j<0?0 : (j<up? 78*Fx.ease.outCubic(j/up) : (j<up+dn? 78*(1-Fx.ease.inQuad((j-up)/dn)) : 0));
    env.arms = j<1.8 ? 1.12 : 0;
    env.armR = j>=1.8 ? 1.05 : 0;
    env.wave = j>=1.8 ? 1 : 0;
    env.happy = j<1.25 ? 1 : 0;
    env.mouth = j<2.2 ? 1 : 0.5;
    var gl=-1;
    if(t>=FIN.glint && t<=FIN.glint+0.9) gl=(t-FIN.glint)/0.9;
    else if(t>7 && (t-7)%5<0.9) gl=((t-7)%5)/0.9;
    env.glint=gl;
    if(j<1.6) env.pointer={x:450,y:260,age:0};
  }
  return env;
};
// Kamera-Choreografie: Zoom-Faktor, vertikaler Welt-Versatz, Wackeln (px)
S.finaleCam = function(){
  var F=S.fin; if(!F) return null;
  var t=F.t, z, oy=0, shake=0;
  if(t<FIN.tada){ z=1+0.09*Fx.ease.inOutCubic(Fx.seg(t,0.35,FIN.tada)); }
  else {
    var j=t-FIN.tada;
    var pin=Fx.ease.outCubic(Fx.seg(j,0,0.22)), pout=Fx.ease.inOutCubic(Fx.seg(j,0.9,2.4));
    var p=pin*(1-pout), idle=1+0.012*Math.sin(t*0.9);
    z=Fx.lerp(Fx.lerp(1.09,1.55,pin),idle,pout);
    oy=-110*p;
    shake=Math.max(0,1-j/0.4)*8;
  }
  return {z:z, oy:oy, shake:shake};
};
S.finaleDim = function(){
  var F=S.fin; if(!F) return 0; var t=F.t;
  if(t<FIN.tada) return 0.66*Fx.ease.inOutCubic(Fx.seg(t,0.02,0.55));
  return 0.66*(1-Fx.ease.outCubic(Fx.seg(t,FIN.tada,FIN.tada+0.8)));
};
S.finaleFlash = function(){ var F=S.fin; if(!F) return 0; var j=F.t-FIN.tada; return j<0?0:0.85*(1-Fx.ease.outCubic(Fx.seg(j,0,0.6))); };

function drawFinaleWelt(g){
  var F=S.fin, t=F?F.t:99, W=S.VW, H=S.VH, s=Math.min(W,H)/420, cx=W/2, cy=H*0.58;
  // Gottesstrahlen + warmer Halo hinter dem Bären (ab TA-DA)
  var ra=t<FIN.tada?0:Math.min(1,(t-FIN.tada)/0.3)*(t<FIN.tada+1.2?0.8:0.5);
  if(ra>0){
    g.save(); g.globalCompositeOperation='lighter';
    if(Fx.Q.tier>0){ g.globalAlpha=ra*0.85; g.translate(cx,cy-60*s); g.rotate(t*0.1); var R=600*s; g.drawImage(Fx.S.rays(),-R,-R,2*R,2*R); }
    g.restore();
    g.save(); g.globalCompositeOperation='lighter'; Fx.glow(g,cx,cy-50*s,340*s,'#ffe4b8',0.55*ra); g.restore();
  }
  var DKF=Fx.DEKO && window.BSDeko && window.BSDeko.finaleBack;
  if(DKF) window.BSDeko.finaleBack(g,t,cx,cy,s,FIN); // r20: hintere Hälfte der Funkel-Bahn (Sterne kreisen um den Bären)
  var live=function(){
    Art.drawBear(g,S.baer,{w:W,h:H});
    if(S.baer.duft!==null && S.baer.duft!==undefined && t>FIN.tada) drawDuftWolken(g);
  };
  if(!F || t<FIN.poof || !F.vorher || t>=FIN.wipe1){ live(); if(DKF) window.BSDeko.finaleFront(g,t,cx,cy,s,FIN); return; }
  // Diagonaler Wisch: links Nachher (live), rechts Vorher (Foto)
  var lx=S.finWipeX(), sl=0.22, yc=cy;
  var left=new Path2D(); left.moveTo(-4000,-4000); left.lineTo(lx+(-4000-yc)*sl,-4000); left.lineTo(lx+(4000-yc)*sl,4000); left.lineTo(-4000,4000); left.closePath();
  var right=new Path2D(); right.moveTo(lx+(-4000-yc)*sl,-4000); right.lineTo(5000,-4000); right.lineTo(5000,4000); right.lineTo(lx+(4000-yc)*sl,4000); right.closePath();
  g.save(); g.clip(left); live(); g.restore();
  var V=F.vorher;
  g.save(); g.clip(right); g.drawImage(V.img,V.x,V.y,V.w,V.h);
  // grummelige Staubwolke über dem Vorher-Kopf
  var dt2=t*1.3;
  g.globalAlpha=0.55;
  for(var k=0;k<4;k++) Fx.ball(g,cx+40*s+Math.cos(dt2+k*1.7)*26*s+k*12*s-20*s,cy-262*s+Math.sin(dt2*1.3+k)*6*s,(15+k*3)*s,(12+k*2)*s,'#c9b7a6');
  g.globalAlpha=1;
  g.restore();
  // Licht-Klinge
  if(t>FIN.wipe0-0.05){
    g.save(); g.globalCompositeOperation='lighter';
    g.translate(lx,yc); g.rotate(-Math.atan(sl));
    var hgt=620*s;
    g.globalAlpha=0.9; g.drawImage(Fx.S.glow('#ffd9a0'),-70*s,-hgt*0.6,140*s,hgt*1.2);
    var cg=g.createLinearGradient(0,-hgt*0.5,0,hgt*0.5);
    cg.addColorStop(0,'rgba(255,250,235,0)'); cg.addColorStop(0.2,'rgba(255,250,235,0.95)');
    cg.addColorStop(0.8,'rgba(255,250,235,0.95)'); cg.addColorStop(1,'rgba(255,250,235,0)');
    g.globalAlpha=1; g.fillStyle=cg; g.fillRect(-3*s,-hgt*0.5,6*s,hgt);
    g.restore();
  }
}


// Stations-Deko: kleine prozedurale Details, zurückhaltend
function drawDeko(g){
  var R=REG[S.state];
  if(R && R.back) R.back(g);
}
// ---- Neue Stations-Zeichner: Noten, Jonglage, Album, Feuerwerk -------
var NICONS=['🎵','🎶','♪','♫'];
function circle2(g,x,y,r,c){ g.fillStyle=c; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
function ell2(g,x,y,rx,ry,c){ g.fillStyle=c; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill(); }

function drawDuftWolken(g){
  // kleine Duft-Wolke beim Bären (Finish / Stationen)
  var d = Art.DUFTE[S.baer.duft]; if(!d) return;
  var t = performance.now()/1000;
  var s = Math.min(S.VW,S.VH)/420;
  var cx=S.VW*0.5, cy=S.VH*0.58;
  for(var i=0;i<3;i++){
    var a = t*0.7 + i*(Math.PI*2/3);
    var rr = (140+i*24)*s + Math.sin(t*1.5+i)*8*s;
    var x = cx+Math.cos(a)*rr, y = cy-120*s+Math.sin(a)*rr*0.35+Math.sin(t*2+i)*6*s;
    var sz = (12+Math.sin(t*3+i*1.7)*3)*s;
    g.globalAlpha = 0.35;
    g.fillStyle=d.c;
    g.beginPath(); g.arc(x,y,sz,0,Math.PI*2); g.fill();
    g.beginPath(); g.arc(x+sz*0.8,y-sz*0.4,sz*0.7,0,Math.PI*2); g.fill();
    g.beginPath(); g.arc(x-sz*0.8,y-sz*0.2,sz*0.6,0,Math.PI*2); g.fill();
    g.globalAlpha = 0.85;
    g.fillStyle='#fff'; g.font='bold '+(13*s)+'px sans-serif'; g.textAlign='center';
    g.fillText(d.icon, x, y+5*s);
    g.globalAlpha=1;
  }
}


function clawPos(key){
  var s = Math.min(S.VW,S.VH)/420;
  var cy = S.VH*0.58, cx=S.VW*0.5;
  var map = {L:[-55,175],R:[55,175]};
  var side=key[0], i=+key[1];
  var p=map[side];
  return [cx + (p[0]+(i-1)*16)*s, cy+p[1]*s, 14*s];
}
// Bär aus der Auswahl übernehmen (ui.js ruft das beim Kachel-Tipp)
S.chooseBear = function(i){
  var surprise = i===Art.MODELS.length-1;
  var idx = surprise ? Math.floor(Math.random()*(Art.MODELS.length-1)) : i;
  S.baer = neuerBaer(idx); S.save();
  S.setState('waschen');
  sfx(surprise?'tada':'chime');
  if(surprise){ window.BSGame && window.BSGame.konfettiBurst(S.VW/2, S.VH*0.4);
    window.BSGame && window.BSGame.sternExplosion(S.VW/2, S.VH*0.5); }
  react('happy',1.4);
};
S.tapBear = function(x,y){
  if(S.state==='finish-done'){ S.finaleSkip(); return true; }
  var R=REG[S.state];
  return !!(R && R.tap && R.tap(x,y));
};



// ---- Zeichnen der neuen Stationen ---------------------------------------

function drawSchmetterlinge(g){
  var t=performance.now()/1000;
  var cols=['#ff9eb5','#9b59b6','#f1c40f'];
  for(var i=0;i<3;i++){
    var p=(t*0.06+i/3)%1;
    var x = p* (S.VW+80)-40;
    var y = 120+Math.sin(t*0.9+i*2.1)*(60+i*30)+i*130;
    if(y>S.VH-140) y=S.VH-150-(y-(S.VH-140));
    var flap=Math.abs(Math.sin(t*9+i*2))*0.7+0.3;
    g.save(); g.translate(x,y); g.rotate(Math.sin(t*0.9+i)*0.3);
    g.fillStyle=cols[i%3];
    g.save(); g.scale(flap,1);
    g.beginPath(); g.ellipse(-8,-4,8,11,-0.4,0,Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(8,-4,8,11,0.4,0,Math.PI*2); g.fill();
    g.globalAlpha=0.8;
    g.beginPath(); g.ellipse(-6,6,5,7,-0.3,0,Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(6,6,5,7,0.3,0,Math.PI*2); g.fill();
    g.restore();
    g.fillStyle='#5d3a75'; g.fillRect(-1.5,-8,3,16);
    g.restore();
  }
}

// ---- Helfer für stations/<id>.js ----------------------------
S.H.btn=btn; S.H.stationTabs=stationTabs; S.H.sfx=sfx; S.H.react=react; S.H.emit=emit; S.H.headPos=headPos;
S.H.accPop=accPop; S.H.circle2=circle2; S.H.ell2=ell2; S.H.kopie=kopie; S.H.neuerBaer=neuerBaer; S.H.clawPos=clawPos;
S.H.NICONS=NICONS;
// Bär an seinem Standardplatz (wie im Zeichenpfad der meisten Stationen)
S.H.baer=function(g){ Art.drawBear(g,S.baer,{w:S.VW,h:S.VH, spaTarget:S.spaTarget}); };

})();
