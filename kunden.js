// kunden.js — r22 Kundenbesuche: Türglocke, ein Bär läuft herein, Wunsch-Blase mit Stations-Symbolen (ohne Schrift),
// Häkchen + Freu-Hüpfer beim Erfüllen. Kein Zeitdruck, kein Ablauf, ein ignorierter Wunsch hat keinen Nachteil.
// Mechanik-Ideen aus gemütlichen Lebens-Simulationen (VORLAGEN.md), alle Zahlen sind eigene Startwerte.
// Alle Regler stehen in EINER Parametergruppe K.P (aus der Adresse); Regler 0 = Verhalten vor r22.
// E2: Freundschaft je Bärenmodell (5 Herzen, nur Zuwachs, kein Verfall), Vorlieben, Schwellen-Belohnungen, Geburtstag,
// Speicher `bs_freunde` (mit Version; kaputt/alt/leer → leer, nie Absturz).
// E3: Sammelalbum (je Bär 5 Felder = ein Sticker je Herz → 37 × 5 = 185; Fotos 4 → 12) und Bild-Postkarte vom
// letzten Kunden beim nächsten Start (ab Herz 3 mit Geschenk). Album-Bilder sind gecacht und werden beim Verlassen frei.
// Reine Teile (Parameter, Wunsch-/Kunden-Auswahl, Punkte, Herzen, Speicher) sind ohne Browser getestet: tests/unit/kunden.test.mjs.
(function(){
'use strict';
var S=window.BSSalon, Art=window.BSArt, Fx=window.BSFx;
var K=window.BSKunden={};
function sfx(n,o){ if(window.BSSfx) window.BSSfx.play(n,o); }
function now(){ return performance.now()/1000; }

// ---------------------------------------------------------------- Parametergruppe (alle URL-Regler an einer Stelle)
//   ?kunden=0/1   Kundenbesuche als Standard (0 = Menü → Bär wählen wie vor r22)
//   ?wunsch=1…3   Wünsche je Besuch (ab Herz 3 einer mehr, höchstens 3)
//   ?freund=0/1   Freundschafts-Herzen je Bär     ?herz=20   Punkte je Herz (5 Herzen)
//   ?vorliebe=2   Faktor für Lieblings-Wunsch     ?geburtstag=3   Faktor am Geburtstag des Bären
//   ?tag=JJJJMMTT Datum vorgeben (Prüfen von Geburtstag/Gast des Tages)
//   ?album=12     Fotos im Album (4 = wie vor r22)   ?karte=0/1   Bild-Postkarte beim nächsten Start
K.liesParameter=function(q){
  q=String(q||'');
  function roh(k){ var m=new RegExp('[?&]'+k+'=([^&#]*)').exec(q); return m?decodeURIComponent(m[1]):null; }
  function zahl(k,def,min,max){ var v=parseFloat(roh(k)); return isFinite(v)?Math.max(min,Math.min(max,v)):def; }
  return {
    kunden: zahl('kunden',1,0,1)>=0.5?1:0,
    wunsch: Math.round(zahl('wunsch',2,1,3)),
    einlauf: 1.2,           // s, Hereinlaufen (Tipp überspringt); beste Freunde rennen (× renner)
    renner: 0.6,
    freund: zahl('freund',1,0,1)>=0.5?1:0,
    herz: Math.round(zahl('herz',20,1,1000)),
    herzen: 5,
    vorliebe: zahl('vorliebe',2,1,5),
    geburtstag: zahl('geburtstag',3,1,10),
    tag: /^\d{8}$/.test(roh('tag')||'') ? roh('tag') : null,
    // Punkte je Ereignis (nur Zuwachs): Besuch, erfüllter Wunsch, Foto (1× je Besuch), Finale, Vorliebe entdeckt (1× je Art und Besuch)
    punkte: { besuch:2, wunsch:3, foto:2, finale:2, entdeckt:2 },
    wieder: 0.5,            // Anteil Stammkunden: bekannter Bär kommt wieder (sonst ein neuer)
    wunschPlusAb: 3,        // ab diesem Herz ein Wunsch mehr
    geschenkAb: 3,          // ab diesem Herz bringt der Bär ein Geschenk mit
    winkenAb: 1, besteAb: 5,
    album: Math.round(zahl('album',12,4,24)),
    karte: zahl('karte',1,0,1)>=0.5?1:0
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
// Kunde wählen: zufälliges Modell, nicht einer der zuletzt da gewesenen. Alle 37 Modelle können kommen (auch der
// Fragezeichen-Bär, dessen Kachel in der Bärenwahl „Überraschung?“ heißt) — so passt das Album mit 37 × 5 Feldern.
K.KUNDEN_ANZAHL=Art.MODELS.length;
K.waehleKunde=function(rnd,letzte){
  rnd=rnd||Math.random; letzte=letzte||[];
  var pool=[]; for(var i=0;i<K.KUNDEN_ANZAHL;i++) if(letzte.indexOf(i)<0) pool.push(i);
  if(!pool.length) for(var j=0;j<K.KUNDEN_ANZAHL;j++) pool.push(j);
  return pool[Math.floor(rnd()*pool.length)];
};

// ---- Freundschaft (rein): Herzen, Punkte, Vorlieben, Geburtstag, Speicher
K.hash=function(str){ var h=2166136261; str=String(str); for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
K.deckel=function(P){ P=P||K.P; return P.herz*P.herzen; };
K.herzen=function(p,P){ P=P||K.P; return Math.max(0,Math.min(P.herzen,Math.floor((+p||0)/P.herz))); };
// Anteil am angefangenen Herz (0…1) für die Anzeige
K.herzRest=function(p,P){ P=P||K.P; if(K.herzen(p,P)>=P.herzen) return 0; return ((+p||0)%P.herz)/P.herz; };
// Betrag eines Ereignisses: Grundwert × Vorliebe (Lieblings-Wunsch) × Geburtstag; nie negativ, ganzzahlig
K.betrag=function(art,ctx,P){
  P=P||K.P; ctx=ctx||{};
  var b=P.punkte[art]||0; if(ctx.liebling) b*=P.vorliebe; if(ctx.geburtstag) b*=P.geburtstag;
  return Math.max(0,Math.round(b));
};
// Vorlieben je Modell (fest aus dem Namen): Lieblings-Station, -Duft (Art.DUFTE), -Haarfarbe (Art.HAAR)
K.vorlieben=function(idx){
  var m=Art.MODELS[idx]||Art.MODELS[0], h=K.hash('vorliebe|'+m.name);
  return { station:K.WUNSCH_IDS[h%K.WUNSCH_IDS.length], duft:(h>>>8)%4, farbe:Art.HAAR[(h>>>12)%Art.HAAR.length] };
};
// Geburtstag je Modell (fest aus dem Namen): Monat 1–12, Tag 1–28 (gibt es in jedem Monat)
K.geburtstagVon=function(idx){
  var m=Art.MODELS[idx]||Art.MODELS[0], h=K.hash('geburtstag|'+m.name);
  return { m:1+(h%12), d:1+((h>>>4)%28) };
};
// heutiges Datum (oder ?tag=JJJJMMTT)
K.heute=function(P){
  P=P||K.P;
  if(P.tag) return { j:+P.tag.slice(0,4), m:+P.tag.slice(4,6), d:+P.tag.slice(6,8), key:P.tag };
  var d=new Date(), j=d.getFullYear(), mo=d.getMonth()+1, t=d.getDate();
  return { j:j, m:mo, d:t, key:String(j)+(mo<10?'0':'')+mo+(t<10?'0':'')+t };
};
K.istGeburtstag=function(idx,heute){ var g=K.geburtstagVon(idx); heute=heute||K.heute(); return g.m===heute.m && g.d===heute.d; };
// Speicher: {v:1, b:{<Modellname>:{p:Punkte, n:Besuche, e:{duft:1,farbe:1,station:1}}}}
K.VERSION=1;
K.leer=function(){ return { v:K.VERSION, b:{} }; };
K.lade=function(text){
  var o=null; try{ o=JSON.parse(text||'null'); }catch(e){ o=null; }
  var out=K.leer();
  if(!o || typeof o!=='object' || Array.isArray(o) || o.v!==K.VERSION || !o.b || typeof o.b!=='object' || Array.isArray(o.b)) return out;
  var namen={}; Art.MODELS.forEach(function(m){ namen[m.name]=1; });
  for(var k in o.b){
    if(!namen[k]) continue;
    var e=o.b[k]; if(!e || typeof e!=='object') continue;
    var p=+e.p, n=+e.n;
    var ein={ p:isFinite(p)?Math.max(0,Math.min(K.deckel(),Math.round(p))):0, n:isFinite(n)?Math.max(0,Math.floor(n)):0, e:{} };
    if(e.e && typeof e.e==='object') ['duft','farbe','station'].forEach(function(x){ if(e.e[x]) ein.e[x]=1; });
    var kg=+e.k; if(isFinite(kg) && kg>0) ein.k=Math.min(999,Math.floor(kg));          // geöffnete Postkarten-Geschenke
    out.b[k]=ein;
  }
  if(typeof o.gb==='string' && /^\d{8}$/.test(o.gb)) out.gb=o.gb;   // Geburtstagskind heute schon da gewesen
  var ka=o.karte; if(ka && typeof ka==='object' && Art.MODELS[ka.i] && isFinite(+ka.h)) out.karte={ i:ka.i|0, h:Math.max(0,Math.min(5,ka.h|0)), g:!!ka.g };
  return out;
};
K.eintrag=function(store,idx){
  var name=(Art.MODELS[idx]||Art.MODELS[0]).name;
  return store.b[name]||(store.b[name]={p:0,n:0,e:{}});
};
// Punkte gutschreiben: nur Zuwachs, Deckel. Liefert {plus, vorher, nachher, herzVorher, herzNachher}
K.gutschreiben=function(store,idx,plus,P){
  P=P||K.P; var e=K.eintrag(store,idx), v=e.p;
  plus=Math.max(0,Math.round(+plus||0));
  e.p=Math.min(K.deckel(P),v+plus);
  return { plus:e.p-v, vorher:v, nachher:e.p, herzVorher:K.herzen(v,P), herzNachher:K.herzen(e.p,P) };
};
K.herzVon=function(idx,store){ store=store||K.store; var name=(Art.MODELS[idx]||{}).name; var e=store && store.b[name]; return e?K.herzen(e.p):0; };
K.punkteVon=function(idx,store){ store=store||K.store; var name=(Art.MODELS[idx]||{}).name; var e=store && store.b[name]; return e?e.p:0; };
// Kunde mit Stammkunden: mit Wahrscheinlichkeit P.wieder ein schon bekannter Bär (noch nicht beste Freunde), sonst irgendeiner;
// heute Geburtstag → dieser Bär zuerst (einmal am Tag)
K.waehleKundeMit=function(rnd,letzte,store,opt){
  rnd=rnd||Math.random; letzte=letzte||[]; opt=opt||{};
  if(opt.geburtstag!==undefined && opt.geburtstag!==null) return opt.geburtstag;
  if(store && K.P.freund){
    var bekannt=[]; for(var i=0;i<K.KUNDEN_ANZAHL;i++){ var e=store.b[Art.MODELS[i].name];
      if(e && e.n>0 && K.herzen(e.p)<K.P.herzen && letzte.indexOf(i)<0) bekannt.push(i); }
    if(bekannt.length && rnd()<K.P.wieder) return bekannt[Math.floor(rnd()*bekannt.length)];
  }
  return K.waehleKunde(rnd,letzte);
};
// Sammelalbum: je Bär so viele Sticker wie Herzen (5 Felder) → 185 Felder; „kennengelernt“ = mindestens ein Besuch
K.albumStand=function(store){
  store=store||K.store; var voll=0, kennen=0, beste=0;
  Art.MODELS.forEach(function(m){ var e=store.b[m.name]; if(!e) return; if(e.n>0) kennen++; var h=K.herzen(e.p); voll+=h; if(h>=K.P.herzen) beste++; });
  return { voll:voll, felder:Art.MODELS.length*K.P.herzen, kennen:kennen, baeren:Art.MODELS.length, beste:beste };
};
K.gesamtHerzen=function(){ return K.albumStand().voll; };
K.albumMax=function(){ return K.P.album; };
K.store=K.lade((function(){ try{ return localStorage.getItem('bs_freunde'); }catch(e){ return null; } })());
K.speichere=function(){ if(!K.P.freund) return; try{ localStorage.setItem('bs_freunde',JSON.stringify(K.store)); }catch(e){} };

// ---------------------------------------------------------------- Besuch (Laufzeit)
K.besuch=null; K.letzte=[]; K.moment=null;
// Geburtstagskind von heute (falls eines der Modelle heute Geburtstag hat und heute noch nicht da war)
K.geburtstagskind=function(){
  if(!K.P.freund) return null;
  var h=K.heute(); if(K.store.gb===h.key) return null;
  for(var i=0;i<K.KUNDEN_ANZAHL;i++) if(K.istGeburtstag(i,h)) return i;
  return null;
};
K.neuerBesuch=function(idx,opt){
  opt=opt||{};
  var frei=!K.an();                       // ?kunden=0: freies Spiel (nur Freundschaft zählt, keine Wünsche)
  if(idx===undefined || idx===null || !Art.MODELS[idx]) idx=K.waehleKundeMit(Math.random,K.letzte,K.store,{geburtstag:K.geburtstagskind()});
  K.letzte=[idx].concat(K.letzte.filter(function(x){ return x!==idx; })).slice(0,2);
  if(!opt.behalten){ S.baer=S.H.neuerBaer(idx); S.save(); }
  var F=K.P.freund, herz=F?K.herzVon(idx):0, gb=F && K.istGeburtstag(idx);
  var vl=K.vorlieben(idx), n=Math.min(3,K.P.wunsch+(herz>=K.P.wunschPlusAb?1:0));
  var w=[];
  if(!frei){
    // Lieblings-Station kommt in jedem zweiten Besuch unter die Wünsche; am Geburtstag steht die Geburtstags-Station vorn
    w=K.wuensche(n,Math.random,{zuerst:gb?'geburtstag':null});
    if(F && w.indexOf(vl.station)<0 && Math.random()<0.5) w[w.length-1]=vl.station;
  }
  K.besuch={ idx:idx, wuensche:w, erfuellt:{}, t:opt.schonDa?K.P.einlauf+0.3:0, da:!!opt.schonDa, fertig:false, aktionen:{},
    frei:frei, herz:herz, geburtstag:gb, liebling:F?vl.station:null, vorliebe:vl, renner:herz>=K.P.besteAb,
    geschenk:(F && !frei && herz>=K.P.geschenkAb)?{offen:false}:null, foto:false, entdeckt:{}, punkte:0 };
  if(F){
    var e=K.eintrag(K.store,idx); e.n++;
    if(gb) K.store.gb=K.heute().key;
    punkte('besuch',{geburtstag:gb},true);
  }
  if(!frei) S.setState('kunde');
  return K.besuch;
};
// „Weiter mit meinem Bären“: laufender Besuch → Wunsch-Blase wieder zeigen, sonst wie früher zum Waschen
K.weiter=function(){
  var B=K.besuch;
  if(B && !B.fertig && !B.frei && S.baer && S.baer.fellIdx===B.idx){ B.t=Math.max(B.t,K.P.einlauf+0.3); B.da=true; S.setState('kunde'); }
  else S.setState('waschen');
};
// Punkte für den laufenden Besuch; neues Herz → großer Moment (Herz-Reihe über dem Kopf, Klang, Hüpfer)
function punkte(art,ctx,leise){
  var B=K.besuch; if(!B || !K.P.freund) return null;
  var r=K.gutschreiben(K.store,B.idx,K.betrag(art,ctx));
  B.punkte+=r.plus; B.herz=r.herzNachher;
  K.speichere();
  if(r.herzNachher>r.herzVorher){ if(leise) B.herzNeu=r.herzNachher; else neuesHerz(r.herzNachher); }   // leise = später zeigen (nach dem Hereinlaufen / bei TA-DA)
  return r;
}
K.punkte=punkte;
function neuesHerz(n){
  var G=window.BSGame, k=kopfPunkt();
  K.moment={t0:now(), herz:n};
  if(K.vibriere) K.vibriere('herz');
  sfx('magic'); sfx('chime',{delay:0.25});
  if(S.baer) Art.react(S.baer,'happy',1.5);
  if(G && G.herzPuff){ G.herzPuff(k[0],k[1]-60); setTimeout(function(){ G.herzPuff(k[0],k[1]-60); },180); }
}
// Etwas in der Station getan (Knopf, Tippen auf Bär/Requisite, Rubbeln, Föhnen …) → Wunsch erfüllt?
K.aktion=function(){
  var B=K.besuch, st=S.state;
  if(!B || B.fertig) return false;
  var t=now(); if(B._aSt!==st || t-B._aT>=0.25){ B.aktionen[st]=(B.aktionen[st]||0)+1; B._aSt=st; B._aT=t; }   // Halten/Ziehen zählt höchstens 4× je s
  if(B.wuensche.indexOf(st)>=0 && !B.erfuellt[st]){ erfuellen(B,st); return true; }
  return false;
};
K.alleErfuellt=function(B){ B=B||K.besuch; return !!B && B.wuensche.length>0 && B.wuensche.every(function(id){ return !!B.erfuellt[id]; }); };
function kopfPunkt(){ var s=Math.min(S.VW,S.VH)/420; return [S.VW*0.5, S.VH*0.58-82*s]; }
function erfuellen(B,st){
  B.erfuellt[st]=now();
  var G=window.BSGame, k=kopfPunkt(), lieb=st===B.liebling;
  if(S.baer) Art.react(S.baer,'happy',lieb?1.6:1.2);
  sfx(lieb?'tada':'chime');
  if(G && G.herzPuff) G.herzPuff(k[0],k[1]-40);
  if(lieb && G && G.blumenPuff) G.blumenPuff(k[0],k[1]-70);           // Lieblings-Wunsch: großer Jubel
  if(lieb) K.eintrag(K.store,B.idx).e.station=1;
  punkte('wunsch',{liebling:lieb,geburtstag:B.geburtstag});
  if(K.alleErfuellt(B)){ sfx('sparkle',{delay:0.35}); if(G && G.sternExplosion) G.sternExplosion(k[0],k[1]-90); }
}
// Foto im Studio („Klick!“): einmal je Besuch
K.foto=function(){ var B=K.besuch; if(!B || B.fertig || B.foto) return; B.foto=true; punkte('foto',{geburtstag:B.geburtstag}); };
// Vorlieben entdecken: Lieblingsduft / Lieblings-Haarfarbe am Bären → Jubel (einmal je Art und Besuch)
function vorliebenPruefen(){
  var B=K.besuch, b=S.baer; if(!B || B.fertig || !K.P.freund || !b || b.fellIdx!==B.idx) return;
  var V=B.vorliebe;
  if(!B.entdeckt.duft && b.duft===V.duft) entdeckt('duft');
  if(!B.entdeckt.farbe && b.haar===V.farbe && B._haar0!==undefined && B._haar0!==b.haar) entdeckt('farbe');
  if(B._haar0===undefined) B._haar0=b.haar;
}
function entdeckt(art){
  var B=K.besuch, G=window.BSGame, k=kopfPunkt();
  B.entdeckt[art]=1; K.eintrag(K.store,B.idx).e[art]=1;
  if(S.baer) Art.react(S.baer,'happy',1.6);
  sfx('tada');
  if(G && G.herzPuff) G.herzPuff(k[0],k[1]-50);
  punkte('entdeckt',{geburtstag:B.geburtstag});
}
// Geschenk (ab Herz 3): Paket antippen → ein Accessoire, das der Bär noch nicht trägt
K.geschenkOeffnen=function(){
  var B=K.besuch; if(!B || !B.geschenk || B.geschenk.offen) return false;
  B.geschenk.offen=true; B.geschenk.t=now();
  var G=window.BSGame, b=S.baer, frei=['hut','schleife','brille','kette'].filter(function(k){ return b.acc[k]===null || b.acc[k]===undefined; });
  var k=frei.length?frei[Math.floor(Math.random()*frei.length)]:'schleife';
  var farben={hut:Art.HUTE,schleife:Art.SCHLEIFEN,brille:Art.BRILLEN,kette:Art.KETTEN}[k];
  b.acc[k]=Math.floor(Math.random()*farben.length); S.H.accPop(k); S.save();
  var p=geschenkPos();
  if(G && G.konfettiBurst) G.konfettiBurst(p[0],p[1]);
  sfx('tada'); Art.react(b,'happy',1.5);
  if(K.vibriere) K.vibriere('geschenk');
  return true;
};
function geschenkPos(){ var s=Math.min(S.VW,S.VH)/420; return [S.VW*0.5+165*s, S.VH*0.58+150*s]; }
K.geschenkPos=geschenkPos;

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
function einlauf(B){ return B && B.renner ? K.P.einlauf*K.P.renner : K.P.einlauf; }
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
    var t0=B.t, E=einlauf(B); B.t+=dt;
    if(t0<0.02 && B.t>=0.02 && !B.da) sfx('klingel');
    if(!B.da && B.t>=E){ B.da=true; if(S.baer) Art.react(S.baer,B.renner?'pop':'happy',B.renner?1.4:0.9); if(B.renner) sfx('boing'); }
    if(B.da && B.herzNeu && B.t>=E+0.6){ var hn=B.herzNeu; B.herzNeu=0; neuesHerz(hn); }
    if(t0<E+0.15 && B.t>=E+0.15) sfx('pop',{pitch:1.2});
    // beste Freunde: Herzchen-Spur beim Anrennen
    if(B.renner && B.t<E && Math.random()<dt*20 && window.BSGame){ var k=kopfPunkt(), q=Math.min(1,B.t/E);
      Fx.P.emit('heart',k[0]+(1-Fx.ease.outCubic(q))*-560-60,k[1]+150,{n:1,speed:80,size:9,life:0.8,grav:-80,drag:1.5}); }
  },
  draw:function(g){
    var B=K.besuch, s=Math.min(S.VW,S.VH)/420;
    if(!B){ S.H.baer(g); return; }
    // Hereinlaufen von links mit kleinen Hüpf-Schritten (beste Freunde rennen: schneller, höhere Hüpfer)
    var E=einlauf(B), q=Math.min(1,B.t/E), e=Fx.ease.outCubic(q);
    var dx=(1-e)*-560, dy=-Math.abs(Math.sin(q*Math.PI*(B.renner?5:4)))*(B.renner?30:16)*(1-q)*s;
    if(B.geschenk && q>=1) zeichneGeschenk(g,B);
    Art.drawBear(g,S.baer,{w:S.VW,h:S.VH,cx:S.VW*0.5+dx,cy:S.VH*0.58+dy});
    if(q<1) zeichneKlingel(g,B.t);
    var qb=Fx.seg(B.t,E+0.05,E+0.5);
    if(qb>0) zeichneBlase(g,Fx.ease.outBack(qb));
  },
  tap:function(x,y){
    var B=K.besuch; if(!B) return false;
    if(B.t<einlauf(B)){ B.t=einlauf(B); return true; }        // Tipp überspringt das Hereinlaufen
    if(B.geschenk && !B.geschenk.offen){ var p=geschenkPos(); if(Math.hypot(x-p[0],y-p[1])<=75){ K.geschenkOeffnen(); return true; } }
    var G=blaseGeo();
    for(var i=0;i<G.items.length;i++){ var it=G.items[i];
      if(it.id && Math.hypot(x-it.x,y-it.y)<=it.r+8){ sfx('tap'); S.setState(it.id); return true; } }
    return false;
  }
});
// Pose beim Ankommen (game.js fragt S.poseEnv): ab Herz 1 winkt der Bär zur Begrüßung
S.poseEnv=function(env,st){
  var B=K.besuch;
  if(st==='kunde' && B && K.P.freund && B.herz>=K.P.winkenAb){ var E=einlauf(B); if(B.t>E-0.2 && B.t<E+2.4){ env.wave=1; env.armR=1; } }
};
function zeichneKlingel(g,t){
  // kleine schwingende Glocke oben links neben der Tür-Seite
  var x=hoch()?215:265, y=hoch()?-150:-10, a=Math.sin(t*18)*0.5*Math.max(0,1-t/1.2);
  g.save(); g.translate(x,y); g.rotate(a);
  g.font='64px sans-serif'; g.textAlign='center'; g.textBaseline='top'; g.fillText('🔔',0,0);
  g.restore();
}
function zeichneGeschenk(g,B){
  var p=geschenkPos(), t=now(), G=B.geschenk;
  if(G.offen){ var q=Math.min(1,(t-G.t)/0.5); if(q>=1) return; g.globalAlpha=1-q; }
  var bob=G.offen?0:Math.sin(t*4)*4, sc=G.offen?1+0.5*Math.min(1,(t-G.t)/0.5):1+0.04*Math.sin(t*6);
  g.save(); g.translate(p[0],p[1]+bob); g.scale(sc,sc);
  Fx.contactShadow(g,0,46,60,12,0.6);
  g.font='96px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('🎁',0,0);
  g.restore(); g.globalAlpha=1;
}
// Herz-Reihe (5 Herzen, das angefangene teilweise gefüllt) – Welt- oder Bildschirm-Koordinaten
function herzReihe(g,cx,y,r,p){
  var n=K.P.herzen, voll=K.herzen(p), rest=K.herzRest(p), gap=r*2.5, x0=cx-(n-1)*gap/2;
  for(var i=0;i<n;i++){
    var x=x0+i*gap;
    Art.drawSticker(g,'herz',x,y,r,'rgba(244,185,166,0.55)');
    var f=i<voll?1:(i===voll?rest:0);
    if(f>0){ g.save(); g.beginPath(); g.rect(x-r*1.3,y-r*1.3,r*2.6*f,r*2.6); g.clip(); Art.drawSticker(g,'herz',x,y,r,'#f0607e'); g.restore(); }
  }
}
K.herzReihe=herzReihe;
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
    g.strokeStyle=ok?'#7cc46a':(it.id===B.liebling?'#f0607e':'#f4b9a6'); g.lineWidth=it.id===B.liebling?5:3; g.stroke();
    g.font=Math.round(it.r*1.14)+'px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#000';
    if(st) g.fillText(st.icon,0,2);
    if(it.id===B.liebling && !ok) Art.drawSticker(g,'herz',-it.r*0.66,-it.r*0.62,it.r*0.3,'#f0607e');   // Lieblings-Wunsch
    if(ok) haken(g,it.r*0.62,it.r*0.62,it.r*0.36);
    g.restore();
  });
  // Freundschaft: Herz-Reihe über der Blase, am Geburtstag eine Torte daneben
  if(K.P.freund){
    var hy=G.cy-G.h/2-G.r*0.5, hr=G.r*0.3, M=K.moment, mq=M?now()-M.t0:9;
    if(mq<1.8){ var ps=1+0.7*Fx.ease.outBack(Math.min(1,mq/0.35))*Math.min(1,(1.8-mq)/0.4); hr*=ps;   // neues Herz: Reihe pulsiert groß
      g.save(); g.fillStyle='rgba(255,253,249,0.9)'; Fx.rr(g,G.cx-hr*7.2,hy-hr*1.9,hr*14.4,hr*3.8,hr*1.9); g.fill(); g.restore(); }
    herzReihe(g,G.cx,hy,hr,K.punkteVon(B.idx));
    if(B.geburtstag){ g.font=Math.round(G.r*0.9)+'px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
      g.fillText('🎂',G.cx+G.w/2+G.r*0.2,hy-4+Math.sin(t*5)*3); }
  }
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
K.leisteBreite=function(){ var n=K.besuch?K.besuch.wuensche.length:2; return 16+n*40+(n-1)*4+14+(K.P.freund?5*13+6:0); };
K.zeichneLeiste=function(g,L){
  var B=K.besuch; if(!B || B.fertig || !B.wuensche.length || !L || !L.top) return;
  var kb=S.buttons.filter(function(b){ return b.nav==='wunsch'; })[0];
  var n=B.wuensche.length, h=48, w=K.leisteBreite(), x=L.top.x, y=L.top.y+L.top.h+6, d=L.dpr||1;
  var hz=K.P.freund?K.herzVon(B.idx):-1;
  var key=B.wuensche.join(',')+'|'+B.wuensche.map(function(id){ return B.erfuellt[id]?1:0; }).join('')+'|'+d+'|'+hz;
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
    if(hz>=0){ var hx=16+n*40+(n-1)*4+8; for(var i=0;i<5;i++) Art.drawSticker(q,'herz',hx+6+i*13,h/2,5.5,i<hz?'#f0607e':'rgba(244,185,166,0.6)'); }
    leisteCache={key:key,cv:c,pad:pad};
  }
  // kurzes Aufploppen, wenn gerade ein Wunsch erfüllt wurde
  var jung=0; B.wuensche.forEach(function(id){ var e=B.erfuellt[id]; if(e) jung=Math.max(jung,1-Math.min(1,(now()-e)/0.5)); });
  var sc=1+0.18*Math.sin(jung*Math.PI), p=leisteCache.pad, pt=kb&&kb._tapT?now()-kb._tapT:9;
  if(pt<0.35) sc*=1+0.08*Math.sin(pt/0.35*Math.PI);
  g.save(); g.translate(x,y+h/2); g.scale(sc,sc);                         // Aufploppen vom linken Rand aus (bleibt im Bild)
  g.drawImage(leisteCache.cv,-p,-h/2-p,w+p*2,h+p*2);
  g.restore();
};
// Bären-Wahl: Herzen unter dem Bild, Stern für beste Freunde, Torte am Geburtstag
K.karteMarke=function(g,i,x,y,w,h){
  if(!K.P.freund) return;
  var p=K.punkteVon(i), hz=K.herzen(p);
  if(p>0) herzReihe(g,x+w/2,y+w*0.9,Math.max(4,w*0.045),p);
  if(hz>=K.P.besteAb) Art.drawSticker(g,'stern',x+w-14,y+14,11,'#ffcf4a');
  if(K.istGeburtstag(i)){ g.font='20px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('🎂',x+14,y+16); }
};
// Marke auf dem Stations-Reiter: Herz = Wunsch offen, grünes Häkchen = erfüllt
K.reiterMarke=function(g,b){
  var B=K.besuch; if(!B || B.fertig || !b.tab || !b.r || B.wuensche.indexOf(b.tab)<0) return;
  var x=b.r.x+b.r.w-9, y=b.r.y+9;
  if(B.erfuellt[b.tab]) haken(g,x,y,9);
  else { var p=1+0.12*Math.sin(now()*5); Art.drawSticker(g,'herz',x,y,8*p,'#f2837a'); }
};

// ---------------------------------------------------------------- Sammelalbum (Zustand 'album', Bildschirm-Koordinaten)
K.albumScroll=0; K.albumMaxScroll=0;
var fotoCache={}, fotoKeys=[], silh=null;
function fotoBild(p,px){
  var key=JSON.stringify(p)+'|'+px; if(fotoCache[key]) return fotoCache[key];
  var mod=Art.MODELS[p.fellIdx]||Art.MODELS[0];
  var mini={ fellIdx:p.fellIdx|0, fell:mod.fell, haar:p.haar||Art.HAAR[0], frisur:p.frisur||'lockig', lack:p.lack||{}, schaum:0, tropfen:[], fluff:0,
    makeup:(p.makeup && {rouge:p.makeup.rouge||null,lid:p.makeup.lid||null,gp:(p.makeup.gp||[]).slice(0,8)})||{rouge:null,lid:null,gp:[]},
    acc:p.acc||{hut:null,schleife:null,brille:null,kette:null}, sticker:[], gurkeL:false, gurkeR:false, duft:null };
  var c=Fx.canvas(px,px), g=c.getContext('2d'), U=px/560;
  g.translate(px/2,px*0.6); g.scale(U,U); g.translate(-210,-243.6);
  Art.drawBear(g,mini,{w:420,h:420});
  fotoCache[key]=c; fotoKeys.push(key);
  while(fotoKeys.length>K.P.album){ var alt=fotoKeys.shift(); delete fotoCache[alt]; }
  return c;
}
function silhouette(px){
  if(silh && silh.width===px) return silh;
  var t=Art.thumb(0,px), c=Fx.canvas(px,px), g=c.getContext('2d');
  g.drawImage(t,0,0); g.globalCompositeOperation='source-in'; g.fillStyle='#e6d6ca'; g.fillRect(0,0,px,px);
  return (silh=c);
}
K.albumFrei=function(){ fotoCache={}; fotoKeys=[]; silh=null; };   // beim Verlassen des Albums: Speicher frei
function albumGeo(L){
  var G=L.grid, cols=L.port?3:6, gap=10, w=(G.w-gap*(cols-1))/cols;
  return { G:G, cols:cols, gap:gap, w:w, ph:w*1.18, kh:w*1.32 };
}
K.zeichneAlbum=function(g,L){
  if(!L.grid) return;
  var q=albumGeo(L), G=q.G, d=L.dpr||1, t=now(), A=K.albumStand(), y=G.y-K.albumScroll, x0=G.x;
  g.save(); g.beginPath(); g.rect(0,G.y-6,L.W,G.h+6); g.clip();
  // Fortschritt: Sticker-Herz + Zahl, Bären-Kopf + Zahl (für Eltern lesbar, Kinder sehen die Felder)
  g.font='800 17px system-ui,sans-serif'; g.textBaseline='middle'; g.textAlign='left'; g.fillStyle='#6b3f4a';
  Art.drawSticker(g,'herz',x0+14,y+18,11,'#f0607e'); g.fillText(A.voll+' / '+A.felder,x0+32,y+19);
  g.fillText('🐻 '+A.kennen+' / '+A.baeren,x0+G.w*0.5,y+19);
  y+=44;
  // Fotos: alle Plätze (leer = gestrichelt), neueste zuerst
  var fotos=(S.album||[]).slice(-K.P.album).reverse(), nPl=K.P.album, built=0;
  for(var i=0;i<nPl;i++){
    var cx=i%q.cols, cy=Math.floor(i/q.cols), x=x0+cx*(q.w+q.gap), yy=y+cy*(q.ph+q.gap);
    if(yy>G.y+G.h || yy+q.ph<G.y-6) continue;
    var p=fotos[i];
    if(!p){ g.save(); g.setLineDash([6,6]); g.strokeStyle='rgba(107,63,74,0.25)'; g.lineWidth=2; Fx.rr(g,x+3,yy+3,q.w-6,q.ph-6,10); g.stroke(); g.restore();
      g.font='22px sans-serif'; g.textAlign='center'; g.globalAlpha=0.35; g.fillText('📸',x+q.w/2,yy+q.ph/2); g.globalAlpha=1; continue; }
    g.save(); g.translate(x+q.w/2,yy+q.ph/2); g.rotate(((i*37)%7-3)*0.012);
    g.shadowColor='rgba(80,40,40,0.25)'; g.shadowBlur=6; g.shadowOffsetY=2; g.fillStyle='#fffdf8'; g.fillRect(-q.w/2+3,-q.ph/2+3,q.w-6,q.ph-6);
    g.shadowBlur=0; g.shadowOffsetY=0;
    var iw=q.w-16, px=Math.round(iw*d), key=JSON.stringify(p)+'|'+px;
    g.fillStyle=['#fde8ef','#e8f4ff','#fff3d6'][p.rahmen|0]||'#fde8ef'; g.fillRect(-iw/2,-q.ph/2+8,iw,iw);
    if(fotoCache[key] || built<1){ if(!fotoCache[key]) built++; g.drawImage(fotoBild(p,px),-iw/2,-q.ph/2+8,iw,iw); }
    g.font='600 10px system-ui,sans-serif'; g.textAlign='center'; g.fillStyle='#8a6a5a'; g.fillText(p.datum||'',0,q.ph/2-12);
    g.restore();
  }
  y+=Math.ceil(nPl/q.cols)*(q.ph+q.gap)+8;
  // Bären: je 5 Sticker-Felder; unbekannte Bären als Schatten
  var n=Art.MODELS.length, tpx=Math.round(q.w*0.8*d), tb=0;
  for(var j=0;j<n;j++){
    var bx=x0+(j%q.cols)*(q.w+q.gap), by=y+Math.floor(j/q.cols)*(q.kh+q.gap);
    if(by>G.y+G.h || by+q.kh<G.y-6) continue;
    var m=Art.MODELS[j], e=K.store.b[m.name], kennt=!!(e && e.n>0), hz=e?K.herzen(e.p):0, best=hz>=K.P.besteAb;
    g.save(); g.shadowColor='rgba(110,50,50,0.18)'; g.shadowBlur=6; g.shadowOffsetY=2;
    g.fillStyle=best?'#fff4cf':'#fffaf4'; Fx.rr(g,bx,by,q.w,q.kh,16); g.fill(); g.restore();
    if(best){ g.strokeStyle='#f2c14e'; g.lineWidth=3; Fx.rr(g,bx+1.5,by+1.5,q.w-3,q.kh-3,15); g.stroke(); }
    var tw=q.w*0.8, tx=bx+q.w*0.1, ty=by+4;
    if(kennt){ if(Art.thumbReady(j,tpx) || tb<1){ if(!Art.thumbReady(j,tpx)) tb++; g.drawImage(Art.thumb(j,tpx),tx,ty,tw,tw); } }
    else { g.globalAlpha=0.9; g.drawImage(silhouette(tpx),tx,ty,tw,tw); g.globalAlpha=1;
      g.font='800 '+Math.round(tw*0.3)+'px system-ui,sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='rgba(107,63,74,0.35)'; g.fillText('?',tx+tw/2,ty+tw*0.55); }
    // 5 Sticker-Felder
    var sr=Math.max(5,q.w*0.065), sg=sr*2.5, sx0=bx+q.w/2-2*sg, sy=by+tw+sr+6;
    for(var k=0;k<5;k++){
      if(k<hz) Art.drawSticker(g,k===4?'stern':'herz',sx0+k*sg,sy,sr*(k===4?1.15:1),k===4?'#ffcf4a':'#f0607e');
      else { g.strokeStyle='rgba(107,63,74,0.22)'; g.lineWidth=1.5; g.setLineDash([3,3]); g.beginPath(); g.arc(sx0+k*sg,sy,sr*0.9,0,Math.PI*2); g.stroke(); g.setLineDash([]); }
    }
    g.font='700 '+(q.w<110?10:11.5)+'px system-ui,sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#6b3f4a';
    g.fillText(kennt?m.name:'?',bx+q.w/2,by+q.kh-11,q.w-8);
    // entdeckte Vorlieben + Postkarten-Geschenke klein oben
    if(kennt && e){ var V=K.vorlieben(j), ic=[]; if(e.e.station){ var st=K.station(V.station); if(st) ic.push(st.icon); } if(e.e.duft) ic.push(Art.DUFTE[V.duft].icon);
      if(e.k) ic.push('🎁'); g.font='13px sans-serif'; g.textAlign='left'; ic.forEach(function(c,ii){ g.fillText(c,bx+5,by+12+ii*16); });
      if(e.e.farbe){ g.fillStyle=V.farbe; g.beginPath(); g.arc(bx+q.w-11,by+12,6,0,Math.PI*2); g.fill(); } }
    if(best) Art.drawSticker(g,'stern',bx+q.w-12,by+q.kh*0.55,9+Math.sin(t*3+j)*1,'#ffcf4a');
  }
  y+=Math.ceil(n/q.cols)*(q.kh+q.gap);
  K.albumMaxScroll=Math.max(0,y+K.albumScroll-G.y-G.h+16);
  g.restore();
};
K.albumZiehen=function(s0,dy){ K.albumScroll=Math.max(0,Math.min(K.albumMaxScroll,s0-dy)); };
S.registerStation({ id:'album', build:function(){ S.hinweis=''; }, onLeave:function(){ K.albumFrei(); }, onEnter:function(){ K.albumScroll=0; } });

// ---------------------------------------------------------------- Bild-Postkarte (Menü, beim nächsten Start)
K.karte=(K.P.karte && K.P.freund && K.store.karte) ? {i:K.store.karte.i, h:K.store.karte.h, g:K.store.karte.g, t0:null, offen:false, weg:null} : null;
K.karteOffen=function(){ return !!K.karte && S.state==='menu'; };
K.karteTipp=function(){
  var C=K.karte; if(!C) return;
  var G=window.BSGame, L=window.BSUI && window.BSUI.L;
  if(C.weg) return;
  if(C.g && !C.offen){
    C.offen=now(); sfx('tada');
    if(G && L) Fx.P.emit('confetti',L.W/2,L.H*0.45,{n:70,speed:520,size:11,life:2.2,grav:700,drag:1.2,layer:'screen'});
    var e=K.eintrag(K.store,C.i); e.k=(e.k||0)+1;
    if(K.vibriere) K.vibriere('geschenk');
  } else { C.weg=now(); sfx('whoosh'); }
  delete K.store.karte; K.speichere();
};
K.zeichneKarte=function(g,L){
  var C=K.karte; if(!C || S.state!=='menu') return;
  var t=now(); if(C.t0===null){ C.t0=t; sfx('whoosh'); }
  var q=Fx.ease.outBack(Math.min(1,(t-C.t0)/0.55)), wq=C.weg?Math.min(1,(t-C.weg)/0.45):0;
  if(wq>=1){ K.karte=null; return; }
  var w=Math.min(L.W-40,L.port?330:380), h=w*0.66, cx=L.W/2, cy=L.H*(L.port?0.45:0.5);
  // Hintergrund abdunkeln (Karte ist das Einzige, was gerade zählt)
  g.fillStyle='rgba(60,30,40,'+(0.35*(1-wq)*Math.min(1,q))+')'; g.fillRect(0,0,L.W,L.H);
  g.save(); g.translate(cx+wq*L.W*0.7,cy-wq*80); g.rotate(-0.05+wq*0.5); g.scale(q,q);
  g.shadowColor='rgba(60,30,30,0.35)'; g.shadowBlur=16; g.shadowOffsetY=6;
  g.fillStyle='#fffaf0'; Fx.rr(g,-w/2,-h/2,w,h,14); g.fill(); g.shadowBlur=0; g.shadowOffsetY=0;
  // Briefmarke mit Bär (rechts oben), Poststempel-Wellen, Linien
  var sw=h*0.62, sx=w/2-sw-12, sy=-h/2+12;
  g.fillStyle='#fde3ea'; g.fillRect(sx,sy,sw,sw); g.strokeStyle='#f0a1b4'; g.setLineDash([4,3]); g.lineWidth=3; g.strokeRect(sx+2,sy+2,sw-4,sw-4); g.setLineDash([]);
  var px=Math.round(sw*(L.dpr||1)); g.drawImage(Art.thumb(C.i,px),sx,sy,sw,sw);
  g.strokeStyle='rgba(120,90,120,0.35)'; g.lineWidth=2;
  for(var k=0;k<3;k++){ g.beginPath(); for(var xx=0;xx<=70;xx+=5){ var yy=sy+sw*0.25+k*10+Math.sin(xx*0.2)*3; if(xx===0) g.moveTo(sx-60+xx,yy); else g.lineTo(sx-60+xx,yy); } g.stroke(); }
  // links: Herzen (Freundschaft) + großes Herz als Gruß, kein Text
  Art.drawSticker(g,'herz',-w/2+h*0.32,-h*0.08,h*0.2+Math.sin(t*4)*2,'#f0607e');
  herzReihe(g,-w/2+h*0.32+40,h*0.3,9,C.h*K.P.herz);
  // Geschenk ab Herz 3: Paket wackelt, nach dem Antippen Funkeln
  if(C.g){ var gx=w/2-sw/2-12, gy=h/2-h*0.2;
    if(!C.offen){ g.save(); g.translate(gx,gy); g.rotate(Math.sin(t*9)*0.12); g.font=Math.round(h*0.28)+'px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('🎁',0,0); g.restore(); }
    else { var oq=Math.min(1,(t-C.offen)/0.6); Art.drawSticker(g,'stern',gx,gy,h*0.12*(1+oq*0.3),'#ffcf4a'); } }
  g.restore();
};

// ---------------------------------------------------------------- Einhängen in salon.js
// Menü-Knöpfe im Kunden-Modus (salon.js buildUI ruft das statt der alten Knöpfe)
K.menuKnoepfe=function(btn){
  btn(230,430,440,64,'🔔 Kunde kommt!',function(){ K.neuerBesuch(); },{big:1,cta:1,primary:1});
  if(S.saved && S.saved.fell){ var hz=K.P.freund?K.herzVon(S.saved.fellIdx||0):0;
    btn(230,500,440,64,'🧸 Weiter mit meinem Bären'+(hz?' '+new Array(hz+1).join('❤️'):''),function(){ K.weiter(); },{big:1,cta:1}); }
  btn(230,570,440,64,'🌟 Bären einladen',function(){ S.setState('wahl'); },{big:1,cta:1});
  if(K.P.freund) btn(S.VW-150,16,56,56,'📖',function(){ S.setState('album'); },{nav:'album'});
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
  if(K.besuch && dt>0) vorliebenPruefen();
  var Bz=K.besuch;
  if(Bz && Bz.herzNeu && dt>0){                                           // aufgeschobener Herz-Moment
    var F=S.fin, bereit=S.state==='finish-done' ? (F && F.t>=S.FIN.tada+1.0) : (S.state!=='kunde' && S.state!=='menu' && S.state!=='wahl');
    if(bereit){ var hn=Bz.herzNeu; Bz.herzNeu=0; neuesHerz(hn); }
  }
  return origUpdate.apply(this,arguments);
};
if(typeof S.dragBear==='function'){ var origDrag=S.dragBear; S.dragBear=function(){ K.aktion(); return origDrag.apply(this,arguments); }; }
// „Bären einladen“: das Kind sucht sich den Kunden selbst aus — er kommt angelaufen und hat ebenfalls Wünsche
var origChoose=S.chooseBear;
S.chooseBear=function(i){
  if(!K.an()){ K.besuch=null; var r=origChoose.apply(this,arguments); if(K.P.freund) K.neuerBesuch(S.baer.fellIdx,{behalten:true}); return r; }
  var surprise=i===Art.MODELS.length-1;
  K.neuerBesuch(surprise?Math.floor(Math.random()*(Art.MODELS.length-1)):i);
  sfx(surprise?'tada':'chime');
  if(surprise && window.BSGame){ window.BSGame.konfettiBurst(S.VW/2,S.VH*0.4); window.BSGame.sternExplosion(S.VW/2,S.VH*0.5); }
};
var origFinale=S.startFinale;
S.startFinale=function(){
  var B=K.besuch;
  if(B && !B.fertig){ punkte('finale',{geburtstag:B.geburtstag},true); B.fertig=true;
    if(K.P.karte && K.P.freund){ var hz=K.herzVon(B.idx); K.store.karte={ i:B.idx, h:hz, g:hz>=K.P.geschenkAb }; K.speichere(); } }   // Postkarte für den nächsten Start
  return origFinale.apply(this,arguments);
};
// großer Herz-Moment (neues Herz): Herz-Reihe ploppt über dem Kopf auf, 1,8 s, in jeder Station
var origDraw=S.draw;
S.draw=function(g){
  var r=origDraw.apply(this,arguments), M=K.moment;
  if(M && S.state==='kunde' && now()-M.t0>1.8) K.moment=null;
  if(M && S.state!=='menu' && S.state!=='wahl' && S.state!=='kunde'){
    var q=now()-M.t0; if(q>1.8){ K.moment=null; return r; }
    var s=Math.min(S.VW,S.VH)/420, k=kopfPunkt(), sc=Fx.ease.outBack(Math.min(1,q/0.4)), a=Math.min(1,(1.8-q)/0.3);
    var y=S.state==='finish-done'?k[1]-150*s:k[1]-128*s-q*12;
    g.save(); g.globalAlpha=a; g.translate(S.VW*0.5,y); g.scale(sc,sc);
    g.fillStyle='rgba(255,253,249,0.92)'; Fx.rr(g,-118,-30,236,60,30); g.fill();
    herzReihe(g,0,0,17,K.punkteVon(K.besuch?K.besuch.idx:0));
    g.restore();
  }
  return r;
};
})();
