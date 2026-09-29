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

var FRISUR_NAMEN = {lockig:'Lockig',kurz:'Kurz',zottig:'Zottig',igel:'Igel',afro:'Afro'};
var DISCO_FARBEN = ['#ff5da2','#7ab8f5','#ffd24d','#8fd48a','#c39bd3'];
var ACC = [
  {key:'hut',icon:'🎩',name:'Hut',colors:Art.HUTE},
  {key:'schleife',icon:'🎀',name:'Schleife',colors:Art.SCHLEIFEN},
  {key:'brille',icon:'🕶️',name:'Brille',colors:Art.BRILLEN},
  {key:'kette',icon:'📿',name:'Kette',colors:Art.KETTEN}
];

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
  if(S._prev==='waschen' && st!=='waschen'){ S.baer.schaum=0; S.baer.tropfen=[]; S.dusche=false; }
  if(S._prev==='foehnen' && st!=='foehnen'){ S.foehn=false; }
  S._prev = st;
  if(st==='menu'){
    if(S.saved && S.saved.fell){
      btn(230,458,440,64,'🧸 Weiter mit meinem Bären',function(){ S.state='waschen'; S.buildUI(); },{big:1,cta:1,primary:1});
      btn(230,534,440,64,'🌟 Neuen Bären wählen',function(){ S.state='wahl'; S.buildUI(); },{big:1,cta:1});
    } else {
      btn(230,500,440,70,'▶️ Los geht’s!',function(){ S.state='wahl'; S.buildUI(); },{big:1,cta:1,primary:1});
    }
    return;
  }
  if(st==='wahl'){
    btn(16,16,120,56,'🏠',function(){ S.state='menu'; S.buildUI(); },{nav:'home'});
    return;
  }
  if(st==='finish-done'){
    btn(16,16,120,56,'🏠',function(){ S.fin=null; S.state='menu'; S.buildUI(); },{nav:'home'});
    btn(150,518,280,62,'🐻 Neuer Bär',function(){ S.fin=null; S.state='wahl'; S.buildUI(); },{big:1,cta:1,finCta:1});
    btn(470,518,280,62,'🔄 Nochmal',function(){ S.fin=null; S.baer=neuerBaer(S.baer.fellIdx); S.state='waschen'; S.buildUI(); },{big:1,cta:1,finCta:1,primary:1});
    return;
  }
  backButtons();
  if(st==='waschen') buildWaschen();
  else if(st==='foehnen') buildFoehnen();
  else if(st==='schneiden') buildSchneiden();
  else if(st==='pfoten') buildPfoten();
  else if(st==='massage') buildMassage();
  else if(st==='spa') buildSpa();
  else if(st==='tanz') buildTanz();
  else if(st==='zirkus') buildZirkus();
  else if(st==='parfum') buildParfum();
  else if(st==='makeup') buildMakeup();
  else if(st==='schmuecken') buildSchmuecken();
  else if(st==='eis') buildEis();
  else if(st==='zuckerwatte') buildZuckerwatte();
  else if(st==='ballon') buildBallon();
  else if(st==='zauber') buildZauber();
  else if(st==='geschenke') buildGeschenke();
  else if(st==='keks') buildKeks();
  else if(st==='karussell') buildKarussell();
  else if(st==='geburtstag') buildGeburtstag();
  else if(st==='disco') buildDisco();
  else if(st==='foto') buildFoto();
  else if(st==='malbuch') buildMalbuch();
  else if(st==='aquarium') buildAquarium();
  else if(st==='finish') buildFinish();
};

function backButtons(){
  btn(16,16,120,56,'🏠',function(){ S.state='menu'; S.buildUI(); },{nav:'home'});
  var i = S.STATIONS.map(function(s){return s.id;}).indexOf(S.state);
  if(i>=0 && i < S.STATIONS.length-1){
    btn(S.VW-150,16,134,56,'➜',function(){
      S.state = S.STATIONS[i+1].id; S.buildUI(); S.save();
    },{nav:'next'});
  }
}

function stationTabs(){
  // Reihen à 12 Tabs (24 Stationen), 2 Reihen — kompakt
  for(var j=0;j<S.STATIONS.length;j++){
    (function(st,j){
      btn(6+(j%12)*74, S.VH-118+Math.floor(j/12)*56, 70, 52, st.icon+' '+st.name, function(){
        S.state = st.id; S.buildUI();
      }, {active:function(){ return S.state===st.id; }, small:1, tiny:1, tab:st.id, icon:st.icon, name:st.name});
    })(S.STATIONS[j],j);
  }
}
// ---- Stations-Builder --------------------------------------
function buildWaschen(){
  stationTabs();
  S.hinweis = 'Seife antippen, dann Schaum rubbeln! 🧼';
  btn(30,110,150,64,'🧼 Seife',function(){
    S.baer.schaum=Math.min(1,S.baer.schaum+0.5);
    sfx('bubble'); sfx('bubble',{delay:0.08}); react('happy',0.8);
    emit('bubble',S.VW*0.5,S.VH*0.58+40,{n:14,speed:160,dir:-Math.PI/2,spread:2.2,grav:-60,drag:1.4,size:14,life:1.8,jx:90,jy:50});
  },{active:function(){return S.baer.schaum>0.2;}});
  btn(30,186,150,64,'🚿 Dusche',function(){ S.dusche=true; S._duschT=0; },{active:function(){return !!S.dusche;}});
}
function buildFoehnen(){
  stationTabs();
  S.hinweis = 'Halte den Föhn gedrückt! 💨';
  btn(30,110,170,80,'🌬️ Föhn',function(){},{hold:true, active:function(){return S.foehn;}});
  if(S.baer.schaum>0.1) btn(30,206,170,56,'🚿 Erst duschen!',function(){ S.state='waschen'; S.buildUI(); });
}
function buildSchneiden(){
  stationTabs();
  S.hinweis = 'Wähle Frisur und Farbe! ✂️';
  Art.FRISEURE.forEach(function(f,i){
    btn(30+(i%2)*130, 100+Math.floor(i/2)*62, 122, 56, '✂️ '+FRISUR_NAMEN[f], function(){
      S.baer.frisur=f; S.save(); S.buildUI();
      sfx('snip'); react('snip');
      var hp=headPos(); emit('hair',hp[0],hp[1]-70,{n:16,speed:180,dir:-Math.PI/2,spread:2.6,grav:520,drag:1.8,size:9,life:1.4,colors:[S.baer.haar],jx:60});
    },{active:function(){return S.baer.frisur===f;},small:1,row:0});
  });
  Art.HAAR.forEach(function(c,i){
    btn(30+(i%4)*62, 310+Math.floor(i/4)*62, 56, 56, '', function(){
      S.baer.haar=c; S.save(); S.buildUI();
      sfx('sparkle'); react('happy',0.7);
      var hp=headPos(); emit('puff',hp[0],hp[1]-80,{n:8,speed:90,size:26,life:0.6,grav:-40,colors:[c],jx:50});
      emit('star',hp[0],hp[1]-80,{n:8,speed:260,size:10,life:0.8,grav:300,colors:['#ffe7a8',c]});
    },{fill:c,active:function(){return S.baer.haar===c;},row:1});
  });
}
function buildPfoten(){
  stationTabs();
  S.hinweis = 'Farbe wählen, dann auf die Krallen tippen! 💅';
  Art.LACK.slice(0,6).forEach(function(c,i){
    btn(30+(i%3)*62, 100+Math.floor(i/3)*62, 56, 56, '', function(){
      S.lackColor=c; S.stickerTyp=null; S.buildUI();
    },{fill:c,active:function(){return S.lackColor===c && !S.stickerTyp;}});
  });
  var sticker=[['herz','❤️'],['stern','⭐'],['blume','🌸']];
  sticker.forEach(function(t,i){
    btn(30+i*86, 250, 78, 56, t[1], function(){
      S.stickerTyp=t[0]; S.buildUI();
    },{active:function(){return S.stickerTyp===t[0];},big:1});
  });
  btn(30,326,150,56,'🧽 Neu',function(){ S.baer.lack={}; S.baer.sticker=[]; S.save(); S.buildUI(); });
}
function buildMassage(){
  stationTabs();
  S.hinweis = 'Streiche mit dem Finger in Kreisen über den Bären! 💆';
  if(!S.mass) S.mass = {prog:0, ang:null, herzen:[]};
}
function buildTanz(){
  stationTabs();
  S.hinweis = 'Musikstil wählen und mit dem Bären tanzen! Antippen = Pirouette! 🎵';
  if(!S.tanz) S.tanz = {stil:'disco', noten:[], spin:0};
  [['disco','🕺 Disco'],['klassik','🎻 Klassik'],['rock','🎸 Rock']].forEach(function(d,i){
    btn(30+i*160, 100, 150, 60, d[1], function(){
      S.tanz.stil=d[0]; S.buildUI();
    },{active:function(){return S.tanz.stil===d[0];}, small:1});
  });
}
function buildZirkus(){
  stationTabs();
  S.hinweis = 'Ball-Farbe antippen = ein Ball mehr zum Jonglieren (max. 3)! 🎪';
  if(!S.zirkus) S.zirkus = {bälle:[{c:'#e74c3c'}], t:0};
  ['#e74c3c','#f4c20d','#3498db','#2ecc71','#9b59b6'].forEach(function(c,i){
    btn(30+i*66, 100, 58, 58, '', function(){
      var z=S.zirkus;
      if(z.bälle.length>=3) return;
      z.bälle.push({c:c}); S.buildUI();
    },{fill:c});
  });
  btn(30, 170, 190, 52, '🧽 Neue Bälle', function(){ S.zirkus.bälle=[{c:'#e74c3c'}]; S.buildUI(); });
}
function buildSpa(){
  stationTabs();
  S.hinweis = 'Tippe aufs Auge für eine Gurkenscheibe, nochmal zum Abnehmen! 🥒';
  if(S.baer.gurkeL && S.baer.gurkeR){
    // Ahhhh — Entspannung ansteuern
    S.spaTarget = 1;
  } else S.spaTarget = 0;
  btn(330,400,240,56,'🧽 Gurken weg',function(){
    S.baer.gurkeL=false; S.baer.gurkeR=false; S.spaTarget=0; S.save(); S.buildUI();
  },{active:function(){return S.baer.gurkeL||S.baer.gurkeR;}});
}
function buildParfum(){
  stationTabs();
  S.hinweis = 'Wähle einen Duft — ein Schnupper-Wölkchen bleibt! 🌸';
  Art.DUFTE.forEach(function(d,i){
    btn(30+(i%2)*170, 100+Math.floor(i/2)*130, 162, 56, d.icon+' '+d.name, function(){
      S.baer.duft=i; S.save(); S.buildUI();
      window.BSGame && window.BSGame.parfumSpray(Art.DUFTE[i].c);
      sfx('sparkle'); react('happy',1.2);
    },{active:function(){return S.baer.duft===i;},row:0});
    // kleiner Flakon unter dem Knopf
    btn(80+(i%2)*170, 162+Math.floor(i/2)*130, 30, 46, '', function(){
      S.baer.duft=i; S.save(); S.buildUI();
      window.BSGame && window.BSGame.parfumSpray(Art.DUFTE[i].c);
    },{fill:d.c,tiny:1,hideInTray:1});
  });
  btn(30, 372, 150, 50, '🧽 Kein Duft', function(){
    S.baer.duft=null; S.save(); S.buildUI();
  });
}
function buildMakeup(){
  stationTabs();
  S.hinweis = 'Farbe wählen, dann Glitzer auf Wange oder Stirn tupfen! ✨';
  var mk = S.baer.makeup;
  // Rouge-Farben
  Art.ROUGE.forEach(function(c,i){
    btn(30+i*52, 100, 46, 46, '', function(){
      mk.rouge=c; S.save(); S.buildUI(); sfx('kiss'); react('kiss');
    },{fill:c,active:function(){return mk.rouge===c;},row:0,rowLabel:i===0?'Rouge':null});
  });
  // Lidschatten
  Art.LIDSCHATTEN.forEach(function(c,i){
    btn(30+i*52, 156, 46, 46, '', function(){
      mk.lid=c; S.save(); S.buildUI(); sfx('sparkle'); react('blink');
    },{fill:c,active:function(){return mk.lid===c;},row:1,rowLabel:i===0?'Lidschatten':null});
  });
  btn(30, 216, 200, 50, '✨ Glitzer-Modus', function(){
    S.glitzMode = !S.glitzMode; S.buildUI();
  },{active:function(){return !!S.glitzMode;}});
  btn(30, 276, 150, 50, '🧽 Neu', function(){
    S.baer.makeup={rouge:null,lid:null,gp:[]}; S.save(); S.buildUI();
  });
}
function buildSchmuecken(){
  stationTabs();
  S.hinweis = 'Antippen = an/aus, Farben wechseln! 🎀';
  ACC.forEach(function(a,i){
    var on = S.baer.acc[a.key]!==null && S.baer.acc[a.key]!==undefined;
    btn(30+(i%2)*150, 100+Math.floor(i/2)*130, 142, 60, a.icon+' '+a.name, function(){
      var cur = S.baer.acc[a.key];
      if(cur===null||cur===undefined){ S.baer.acc[a.key]=0; accPop(a.key); sfx('pop'); react('happy');
        var hp=headPos(); emit('star',hp[0],hp[1]-40,{n:10,speed:240,size:10,life:0.8,grav:260}); }
      else { S.baer.acc[a.key]=null; sfx('pop',{pitch:0.7}); }
      S.save(); S.buildUI();
    },{active:function(){return on;},row:i});
    if(on){
      a.colors.forEach(function(c,k){
        btn(30+(i%2)*150+k*46, 166+Math.floor(i/2)*130, 40, 40, '', function(){
          S.baer.acc[a.key]=k; accPop(a.key); S.save(); S.buildUI(); sfx('sparkle');
        },{fill:c,active:function(){return S.baer.acc[a.key]===k;},tiny:1,row:i});
      });
    }
  });
}
function buildFinish(){
  S.hinweis = 'Perfekt! ✨';
  S.hinweis = 'Bereit für den großen Auftritt? ✨';
  btn(330,470,240,70,'🎉 Fertig!',function(){ S.startFinale(); },{big:1,cta:1,primary:1,hero:1});
}
function buildEis(){
  stationTabs();
  S.hinweis = 'Waffel wählen, dann Kugel-Farben antippen — der Bär schleckt! 🍦';
  if(!S.eis) S.eis = {waffel:0, kugeln:[], leck:true};
  ['🍦 Tüte','🥤 Becher','❤️ Herz'].forEach(function(t,i){
    btn(30+i*120, 100, 112, 54, t, function(){ S.eis.waffel=i; S.buildUI(); },
      {active:function(){return S.eis.waffel===i;}, small:1});
  });
  Art.EIS_FARBEN.forEach(function(c,i){
    btn(30+i*60, 166, 54, 54, '', function(){
      if(S.eis.kugeln.length>=3) return;
      S.eis.kugeln.push({c:i, scale:1}); S.eis.leck=true; S.buildUI();
    },{fill:c});
  });
  btn(30, 232, 170, 50, '🧽 Neues Eis', function(){ S.eis.kugeln=[]; S.buildUI(); });
}
function buildZuckerwatte(){
  stationTabs();
  S.hinweis = 'Tippe die Wolle an zum Spinnen — halte den Watte-Stab fest und zieh ihn! 🍬';
  if(!S.watte) S.watte = {lvl:0, kau:0, sx:S.VW*0.5+150, sy:S.VH*0.58+120, spin:0};
  btn(30,100,190,58,'🍬 Wirbeln!',function(){ S.watte.spin=Math.min(1,(S.watte.spin||0)+0.45); },{active:function(){return S.watte.spin>0;}});
  btn(30,168,190,52,'🧽 Neue Watte',function(){ S.watte={lvl:0,kau:0,sx:S.VW*0.5+150,sy:S.VH*0.58+120,spin:0}; S.buildUI(); });
}
Art.BALLON_FARBEN = ['#e91e63','#f4c20d','#3498db','#2ecc71','#9b59b6'];
function buildBallon(){
  stationTabs();
  S.hinweis = 'Farbe wählen, Pusten-Knopf drücken — fertigen Ballon antippen = PLATZ! 🎈';
  if(!S.ballon) S.ballon = {farb:0, gr:0, pust:0, fertig:false, schweb:null, schreck:0};
  Art.BALLON_FARBEN.forEach(function(c,i){
    btn(30+i*66, 100, 58, 58, '', function(){
      S.ballon.farb=i; S.ballon.gr=0; S.ballon.fertig=false; S.ballon.schreck=0; S.ballon.schweb=null; S.buildUI();
    },{fill:c, active:function(){return S.ballon.farb===i && !S.ballon.fertig && S.ballon.gr===0;}});
  });
  btn(30,170,190,64,'💨 Pusten!',function(){
    if(S.ballon.fertig) return;
    S.ballon.pust=1.4; S.ballon.gr=Math.min(1,S.ballon.gr+0.2);
    if(S.ballon.gr>=1) S.ballon.fertig=true;
    S.buildUI();
  },{active:function(){return S.ballon.pust>0;}, big:1});
  btn(30,246,190,52,'🧽 Neuer Ballon',function(){
    S.ballon={farb:S.ballon.farb,gr:0,pust:0,fertig:false,schweb:null,schreck:0}; S.buildUI();
  });
}
// ---- Neu Runde 8: Geschenke-Station ------------------------------------
var GESCHENK_INHALT = ['konfetti','herz','stern','blume','regenbogen'];
Art.PAKET_FARBEN = ['#e91e63','#3498db','#f4c20d','#2ecc71','#9b59b6'];
function buildGeschenke(){
  stationTabs();
  S.hinweis = 'Paket antippen = schütteln, nochmal = aufmachen! Was ist drin? 🎁';
  if(!S.geschenk) S.geschenk = {idx:0, offen:false, schuettel:0, strahl:0};
}
// ---- Neu Runde 8: Keks-Backen-Station -----------------------------------
Art.KEKS_FOERMCHEN = ['stern','herz','baer'];
function buildKeks(){
  stationTabs();
  S.hinweis = 'Streiche über den Teig zum Ausrollen, wähle ein Förmchen, tippe den Teig an — dann backen! 🍪';
  if(!S.keks) S.keks = {teig:0, form:null, stich:null, glow:0, biss:0, roll:[]};
  var kk=S.keks;
  var FN=[['⭐ Stern','stern'],['❤️ Herz','herz'],['🧸 Bär','baer']];
  FN.forEach(function(f,i){
    btn(30+i*150, 100, 140, 54, f[0], function(){ kk.form=f[1]; S.buildUI(); },
      {active:function(){return kk.form===f[1];}, small:1});
  });
  btn(30,168,150,58,'🔥 Backen!',function(){
    if(kk.stich && kk.glow<=0 && kk.biss<=0){ kk.glow=1.6; S.buildUI(); }
  },{active:function(){return kk.glow>0;}, big:1});
  btn(190,168,150,58,'🧽 Neuer Teig',function(){
    S.keks={teig:0,form:null,stich:null,glow:0,biss:0,roll:[]}; S.buildUI();
  });
}
function buildZauber(){
  stationTabs();
  S.hinweis = 'Zauber wählen, dann den Zauberstab antippen! 🌈✨';
  if(!S.zauber) S.zauber = {art:0, fx:null, pfote:0};
  [['⭐ Sternenschweif'],['🌸 Blütenregen'],['❤️ Herz-Kreis']].forEach(function(d,i){
    btn(30+i*200, 100, 190, 60, d[0], function(){
      S.zauber.art=i; S.buildUI();
    },{active:function(){return S.zauber.art===i;}, small:1});
  });
}
function buildKarussell(){
  stationTabs();
  S.hinweis = 'Pferd-Farbe wählen — das Karussell dreht sich! 🎠';
  if(!S.karo) S.karo = {pferd:0, w:0.7, ang:0};
  ['#ff9eb5','#7ab8f5','#ffd24d'].forEach(function(c,i){
    btn(30+i*66, 100, 58, 58, '', function(){ S.karo.pferd=i; S.buildUI(); },
      {fill:c, active:function(){return S.karo.pferd===i;}});
  });
  btn(236,100,190,58,'🐢 Langsam',function(){ S.karo.w=0.45; S.buildUI(); },{active:function(){return S.karo.w<0.7;}});
  btn(436,100,190,58,'🐇 Schnell',function(){ S.karo.w=1.6; S.buildUI(); },{active:function(){return S.karo.w>1;}});
}
function buildGeburtstag(){
  stationTabs();
  S.hinweis = 'Kerzen antippen: anzünden und wieder ausblasen! 🎂';
  if(!S.kuchen) S.kuchen = {kerzen:[{an:true},{an:true},{an:true}], rauch:[], feier:0};
  btn(30,100,190,56,'🕯️ Alle anzünden',function(){
    S.kuchen.kerzen.forEach(function(k){k.an=true;}); S.kuchen.feier=0; S.buildUI();
  });
  btn(30,166,190,56,'🎂 Neuer Kuchen',function(){
    S.kuchen={kerzen:[{an:true},{an:true},{an:true}],rauch:[],feier:0}; S.buildUI();
  });
}
function buildDisco(){
  stationTabs();
  S.hinweis = 'Bären antippen = Licht wechselt Farbe! 🪩';
  if(S.discoFarbe===undefined || S.discoFarbe===null) S.discoFarbe=0;
  DISCO_FARBEN.forEach(function(c,i){
    btn(30+i*62, 100, 56, 56, '', function(){ S.discoFarbe=i; S.buildUI(); },
      {fill:c, active:function(){return S.discoFarbe===i;}});
  });
}
function kerzenPos(){
  // 3 Kerzen auf dem Kuchen vor dem Bären (rechts unten)
  var cx=S.VW*0.5+200, cy=S.VH*0.58+150;
  var out=[];
  for(var i=0;i<3;i++) out.push([cx-38+i*38, cy-96]);
  return {kx:cx, ky:cy, kerzen:out};
}
function buildFoto(){
  stationTabs();
  S.hinweis = 'Rahmen wählen und Klick! 📸';
  if(S.fotoRahmen===undefined) S.fotoRahmen=0;
  ['✨ Sternchen','🌸 Blümchen','👑 Gold'].forEach(function(t,i){
    btn(30+i*140, 100, 132, 54, t, function(){ S.fotoRahmen=i; S.buildUI(); },
      {active:function(){return S.fotoRahmen===i;}, small:1});
  });
  btn(30, 170, 170, 60, '📸 Klick!', function(){
    S.flash=1; S.fotoBadge=true; S.buildUI();
    // Schnappschuss ins Album (max 4, älteste verschwinden)
    var d = new Date();
    var tag = ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.';
    S.album.push({modell: Art.MODELS[S.baer.fellIdx||0].name, datum: tag,
      fellIdx: S.baer.fellIdx||0, haar: S.baer.haar, frisur: S.baer.frisur,
      rahmen: S.fotoRahmen||0,
      lack:S.baer.lack, acc:S.baer.acc, sticker:S.baer.sticker,
      makeup:S.baer.makeup, gurkeL:S.baer.gurkeL, gurkeR:S.baer.gurkeR, duft:S.baer.duft});
    while(S.album.length>4) S.album.shift();
    try{ localStorage.setItem('bs_album', JSON.stringify(S.album)); }catch(e){}
  },{big:1});
}

// ---- Neu Runde 9: Malbuch -------------------------------------------------
Art.MAL_FARBEN = ['#e91e63','#e74c3c','#f4c20d','#8fd48a','#3498db','#9b59b6','#e0892f','#ff9eb5'];
function buildMalbuch(){
  stationTabs();
  S.hinweis = 'Farbe wählen, dann eine Fläche des Bären antippen! 🎨';
  Art.MAL_FARBEN.forEach(function(c,i){
    btn(30+(i%4)*56, 100+Math.floor(i/4)*56, 50, 50, '', function(){
      S.mbColor=c; S.buildUI();
    },{fill:c, active:function(){return S.mbColor===c;}});
  });
  btn(30, 226, 150, 52, '🖼️ Rahmen', function(){
    if(!S.mb) S.mb={parts:{},rahmen:0};
    S.mb.rahmen=(S.mb.rahmen+1)%4;
    S.toast={txt:'🎨 Meisterwerk!', t:2.2};
    window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(S.VW*0.5, S.VH*0.4);
    S.buildUI();
  }, {active:function(){return S.mb && S.mb.rahmen>0;}});
  btn(30, 288, 150, 52, '🧽 Neues Bild', function(){
    S.mb={parts:{},rahmen:0}; S.buildUI();
  });
}
// ---- Neu Runde 9: Aquarium ------------------------------------------------
var AQUA_FARBEN = ['#ff8a5c','#ffd24d','#7ab8f5','#9b59b6','#ff6b9d','#2ecc71'];
function buildAquarium(){
  stationTabs();
  S.hinweis = 'Futter-Dose antippen: Futterkörner fallen — Fische schnappen zu! 🐟';
  if(!S.aqua) S.aqua={fisch:null, futter:[], blasen:[], deko:0, fuetter:0};
  [['⚓ Schiff','1'],['👑 Schatzkiste','2']].forEach(function(d,i){
    btn(30+i*160, 100, 150, 58, d[0], function(){
      S.aqua.deko=i+1; S.buildUI();
    },{active:function(){return S.aqua.deko===i+1;}, small:1});
  });
  btn(30, 170, 190, 64, '🥫 Futter!', function(){
    var aq=S.aqua;
    for(var i=0;i<8;i++){
      var AL=aquaLayout(); // r19: Körner fallen aus der Dose ins freie Wasser
      aq.futter.push({x:AL.canX+(Math.random()-0.5)*120, y:AL.by0+6-Math.random()*10, vy:22+Math.random()*30,
        ph:Math.random()*6});
    }
    aq.fuetter=1.2;
    S.baer.jubelT2=Math.max(S.baer.jubelT2||0,1.2);
    S.buildUI();
  }, {active:function(){return S.aqua && S.aqua.futter.length>0;}, big:1});
}

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
  if(S.state==='malbuch'){ drawMalbuch(g); return; }
  if(S.state==='aquarium'){ drawAquarium(g); return; }
  if(S.state==='massage') drawHerzen(g);
  if(S.state==='waschen') drawWanne(g,false);

  // Tanz: Bär wippt/wiegt/nickt je nach Stil; Pirouette bei spin
  var tNow=performance.now()/1000;
  var tOffY=0, tRot=0, tStretch=1;
  if(S.state==='tanz' && S.tanz){
    var stil=S.tanz.stil||'disco';
    if(stil==='disco'){ // auf-und-ab hüpfen
      tOffY=-Math.abs(Math.sin(tNow*4.4))*34;
      tRot=Math.sin(tNow*4.4)*0.09;
    } else if(stil==='klassik'){ // sanft wiegend
      tRot=Math.sin(tNow*1.8)*0.22;
      tOffY=Math.sin(tNow*3.6)*8;
    } else { // rock: Kopf-Nicken (Vorbeugen)
      tStretch=1-Math.abs(Math.sin(tNow*5.2))*0.10;
      tOffY=Math.abs(Math.sin(tNow*5.2))*14;
    }
    if(S.tanz.spin>0){
      // spinA: volle Drehung über spin 1→0 (Abbau in update())
      var sp=S.tanz.spin;
      S.tanz.spinA = Math.sin((1-sp)*Math.PI)*6.2; // 0→π→0 Wipp-Rotation
    } else S.tanz.spinA=0;
    tRot += (S.tanz.spinA||0);
    g.save();
    g.translate(W/2, S.VH*0.58+150*Math.min(W,H)/420);
    g.rotate(tRot); g.scale(1,tStretch);
    g.translate(-W/2, -(S.VH*0.58+150*Math.min(W,H)/420)-tOffY);
    Art.drawBear(g,S.baer,{w:W,h:H, spaTarget:S.spaTarget});
    drawStickers(g);
    g.restore();
    // bunte Noten steigen auf
    drawNoten(g);
  } else {
  if(S.state==='disco'){
    // Groove: sanftes Seiten-Neigen
    var gro=Math.sin(tNow*2.6)*0.09;
    g.save();
    g.translate(W/2, S.VH*0.58+150*Math.min(W,H)/420);
    g.rotate(gro);
    g.translate(-W/2, -(S.VH*0.58+150*Math.min(W,H)/420)-Math.abs(Math.sin(tNow*2.6))*8);
    Art.drawBear(g,S.baer,{w:W,h:H, spaTarget:S.spaTarget});
    drawStickers(g);
    g.restore();
  } else if(S.state==='zuckerwatte' || S.state==='karussell'){
    if(S.state==='zuckerwatte') drawZuckerwatte(g); else drawKarussell(g);
  } else if(S.state==='ballon'){
    // Erschreck-Zucken: Bär springt kurz hoch, dann lacht er (jubel hoch)
    var bl=S.ballon||{schreck:0};
    var shk=Math.max(0,bl.schreck||0);
    g.save();
    g.translate(0,-Math.sin(Math.min(1,shk)*Math.PI)*26);
    Art.drawBear(g,S.baer,{w:W,h:H, spaTarget:S.spaTarget});
    drawStickers(g);
    g.restore();
    drawBallonStation(g);
  } else if(S.state==='zauber'){
    // Pfoten heben beim Zaubern: kurz jubel-Anteil
    var zb=S.zauber||{pfote:0};
    if(S.baer._j===undefined) S.baer._j=0;
    var jAlt=S.baer.jubel; S.baer.jubel=Math.max(jAlt,Math.min(1,zb.pfote||0)*0.7);
    Art.drawBear(g,S.baer,{w:W,h:H, spaTarget:S.spaTarget});
    S.baer.jubel=jAlt;
    drawStickers(g);
    drawZauberStation(g);
  } else if(S.state==='geschenke'){
    drawGeschenke(g);
  } else if(S.state==='keks'){
    drawKeks(g);
  } else {
  Art.drawBear(g,S.baer,{w:W,h:H, spaTarget:S.spaTarget});
  drawStickers(g);
  }
  }
  // Zirkus: jonglierende Bälle auf Parabel-Bahnen zwischen den Pfoten
  if(S.state==='zirkus' && S.zirkus) drawJonglage(g);
  if(S.state==='geburtstag') drawKuchen(g);
  if(S.state==='disco') drawDisco(g);
  // Album-Vorschau in der Foto-Station
  if(S.state==='foto') drawAlbumVorschau(g);
  if(S.state==='eis' && S.eis){
    var s3=Math.min(S.VW,S.VH)/420;
    Art.drawEis(g, S.eis, S.VW*0.5, S.VH*0.58+40*s3, s3);
  }
  if(S.state==='foto') Art.drawFotoRahmen(g, S.fotoRahmen||0, S.flash||0, !!S.fotoBadge, S.VW, S.VH);
  if(S.state==='waschen') drawWanne(g,true);
  if(S.state==='foehnen') drawFoehn(g);
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
  var live=function(){
    Art.drawBear(g,S.baer,{w:W,h:H});
    if(S.baer.duft!==null && S.baer.duft!==undefined && t>FIN.tada) drawDuftWolken(g);
  };
  if(!F || t<FIN.poof || !F.vorher || t>=FIN.wipe1){ live(); return; }
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

// Badewanne (Waschen): Rückwand hinter dem Bären, Front davor — der Bär sitzt IN der Wanne
function drawWanne(g,front){
  var s=Math.min(S.VW,S.VH)/420, cx=S.VW*0.5, y=S.VH*0.58+128*s;
  var w=210*s, h=92*s, t=performance.now()/1000;
  if(!front){
    Fx.contactShadow(g,cx,y+h+14*s,w*1.05,26*s,0.8);
    var bg=g.createLinearGradient(0,y-30*s,0,y+10*s);
    bg.addColorStop(0,'#f3e6d6'); bg.addColorStop(1,'#e2cfb9');
    g.fillStyle=bg; g.beginPath(); g.ellipse(cx,y,w,26*s,0,Math.PI,0); g.fill();
    // Brause-Kopf über dem Bären (Messing)
    var hx=cx-150*s, hyb=S.VH*0.58-250*s;
    g.strokeStyle='#caa06a'; g.lineWidth=7*s; g.lineCap='round';
    g.beginPath(); g.moveTo(hx-60*s,hyb-120*s); g.lineTo(hx-60*s,hyb-20*s); g.quadraticCurveTo(hx-60*s,hyb,hx-30*s,hyb); g.lineTo(hx,hyb); g.stroke();
    g.save(); g.translate(hx+14*s,hyb+8*s); g.rotate(0.5);
    var sg=g.createLinearGradient(-22*s,0,22*s,0); sg.addColorStop(0,'#f2d49c'); sg.addColorStop(0.5,'#d8ab6a'); sg.addColorStop(1,'#a97a45');
    g.fillStyle=sg; g.beginPath(); g.moveTo(-10*s,-14*s); g.lineTo(10*s,-14*s); g.lineTo(26*s,10*s); g.lineTo(-26*s,10*s); g.closePath(); g.fill();
    Fx.ball(g,0,10*s,26*s,7*s,'#e7c28a');
    g.restore();
    S._brause=[hx+26*s,hyb+26*s];
    return;
  }
  // Wannen-Front (Emaille creme, Rand apricot) + Schaum-Krone am Rand
  var fg=g.createLinearGradient(0,y,0,y+h);
  fg.addColorStop(0,'#fffaf2'); fg.addColorStop(0.55,'#f6ebdd'); fg.addColorStop(1,'#e5d2bd');
  g.fillStyle=fg;
  g.beginPath(); g.moveTo(cx-w,y); g.lineTo(cx+w,y); g.quadraticCurveTo(cx+w*0.98,y+h,cx+w*0.7,y+h); g.lineTo(cx-w*0.7,y+h); g.quadraticCurveTo(cx-w*0.98,y+h,cx-w,y); g.fill();
  g.fillStyle='rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(cx-w*0.55,y+h*0.35,w*0.22,h*0.14,-0.1,0,Math.PI*2); g.fill();
  var rg=g.createLinearGradient(0,y-10*s,0,y+12*s); rg.addColorStop(0,'#f7c09c'); rg.addColorStop(1,'#e2946e');
  g.fillStyle=rg; g.beginPath(); g.ellipse(cx,y,w+8*s,11*s,0,0,Math.PI*2); g.fill();
  // Füße (Messing)
  [-1,1].forEach(function(sg){ Fx.ball(g,cx+sg*w*0.62,y+h+8*s,16*s,11*s,'#d8ab6a'); });
  // Schaumkrone (wächst mit Schaum)
  var sc=Math.max(0.25,S.baer.schaum||0);
  for(var i=0;i<16;i++){
    var q=i/15, bx=cx-w*0.95+q*w*1.9, br=(12+((i*37)%9))*s*(0.6+0.6*sc);
    Fx.ball(g,bx,y-4*s-Math.sin(q*Math.PI)*6*s+Math.sin(t*2+i)*1.5*s,br,br*0.85,'#fffaf3');
  }
}
// Föhn (hängt links oben, zielt auf den Kopf) + warme Luftwellen
function drawFoehn(g){
  var s=Math.min(S.VW,S.VH)/420, t=performance.now()/1000;
  var fx=S.VW*0.5-175*s, fy=S.VH*0.58-190*s, on=!!S.foehn;
  var wob=on?Math.sin(t*40)*1.2*s:0;
  g.save(); g.translate(fx+wob,fy); g.rotate(0.35);
  Fx.contactShadow(g,6*s,40*s,50*s,14*s,0.25);
  // Griff
  var hg=g.createLinearGradient(-12*s,0,12*s,0); hg.addColorStop(0,'#f6c29f'); hg.addColorStop(1,'#d88a63');
  g.fillStyle=hg; g.beginPath(); g.moveTo(-26*s,6*s); g.lineTo(-6*s,6*s); g.lineTo(-14*s,70*s); g.lineTo(-34*s,66*s); g.closePath(); g.fill();
  // Körper
  Fx.ball(g,-10*s,0,40*s,30*s,'#f2a57e');
  var ng=g.createLinearGradient(0,-18*s,0,18*s); ng.addColorStop(0,'#f0d3a0'); ng.addColorStop(1,'#b98c55');
  g.fillStyle=ng; g.beginPath(); g.moveTo(20*s,-18*s); g.lineTo(58*s,-13*s); g.lineTo(58*s,13*s); g.lineTo(20*s,18*s); g.closePath(); g.fill();
  Fx.ball(g,58*s,0,6*s,13*s,'#8f6a4a');
  g.fillStyle='rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-22*s,-14*s,14*s,6*s,-0.3,0,Math.PI*2); g.fill();
  g.restore();
  if(on && S.baer.schaum<0.1){
    g.save(); g.lineCap='round';
    for(var i=0;i<5;i++){
      var ph=((t*1.6+i/5)%1);
      g.globalAlpha=Math.sin(ph*Math.PI)*0.55;
      g.strokeStyle=i%2?'#ffe6c4':'#fff4e4'; g.lineWidth=(5-ph*3)*s;
      var sx=fx+60*s, sy=fy+22*s, ex=S.VW*0.5+10*s, ey=S.VH*0.58-100*s+(i-2)*22*s;
      var mx=sx+(ex-sx)*ph, my=sy+(ey-sy)*ph;
      g.beginPath(); g.moveTo(mx-30*s,my-8*s);
      g.quadraticCurveTo(mx-15*s,my-8*s+Math.sin(t*14+i)*9*s,mx,my); g.quadraticCurveTo(mx+15*s,my+Math.sin(t*14+i+1)*9*s,mx+30*s,my+6*s);
      g.stroke();
    }
    g.restore();
  }
}

// Stations-Deko: kleine prozedurale Details, zurückhaltend
function drawDeko(g){
  var W=S.VW,H=S.VH;
  if(S.state==='wahl'||S.state==='menu'||S.state==='finish-done') return;
  if(S.state==='waschen' && S.album && S.album.length){
    // Bilderrahmen mit dem letzten Album-Foto an der Wand
    var last=S.album[S.album.length-1];
    var bx=205, by=118, bw=104, bh=116;
    Fx.contactShadow(g,bx+bw/2+6,by+bh/2+8,bw*0.62,bh*0.62,0.35);
    var fg=g.createLinearGradient(bx,by,bx+bw,by+bh); fg.addColorStop(0,'#e6b98f'); fg.addColorStop(1,'#b98460');
    g.fillStyle=fg; g.fillRect(bx-7,by-7,bw+14,bh+14);
    g.fillStyle='#fbf3e8'; g.fillRect(bx,by,bw,bh);
    var mod2=Art.MODELS[last.fellIdx]||Art.MODELS[0];
    var th=Art.thumb(last.fellIdx||0,160);
    g.drawImage(th,bx+6,by+4,bw-12,bw-12);
    g.fillStyle='#6b4a3a'; g.font='bold 11px sans-serif'; g.textAlign='center';
    g.fillText('⭐ '+(last.modell||mod2.name), bx+bw/2, by+bh-6);
  }
  if(S.state==='eis'){ // Eis-Stand
    Fx.contactShadow(g,780,430,110,14,0.4);
    var sg=g.createLinearGradient(0,296,0,318); sg.addColorStop(0,'#f0d2ae'); sg.addColorStop(1,'#c7976f');
    g.fillStyle=sg; g.fillRect(690,300,180,16);
    g.fillStyle='#e99f78'; g.fillRect(700,316,12,110); g.fillRect(848,316,12,110);
    Art.EIS_FARBEN.forEach(function(c,i){ Fx.ball(g,720+i*30,288,13,13,c); });
    g.fillStyle='#d9a94f';
    g.beginPath(); g.moveTo(800,296); g.lineTo(830,296); g.lineTo(815,340); g.closePath(); g.fill();
  }
  if(S.state==='foto'){ // Foto-Studio: warme Scheinwerfer
    g.save();
    [[65,58,-0.5],[835,58,0.5]].forEach(function(d){
      g.fillStyle='#6b5446'; g.fillRect(d[0]-5,d[1],10,90);
      Fx.ball(g,d[0],d[1],20,20,'#fff0cf');
      g.globalCompositeOperation='lighter'; g.globalAlpha=0.14; g.fillStyle='#ffe8c0';
      g.beginPath(); g.moveTo(d[0],d[1]);
      g.lineTo(d[0]+(d[2]>0?-160:160)+d[2]*200, 400); g.lineTo(d[0]+d[2]*280, 430);
      g.closePath(); g.fill(); g.globalAlpha=1; g.globalCompositeOperation='source-over';
    });
    g.restore();
  }
}
// ---- Neue Stations-Zeichner: Noten, Jonglage, Album, Feuerwerk -------
var NICONS=['🎵','🎶','♪','♫'];
function drawNoten(g){
  var t=performance.now()/1000;
  if(!S._noteT) S._noteT=0;
  if(!S.tanz) return;
  // neue Noten nachführen
  if(t>S._noteT){
    S._noteT=t+0.4;
    var cols=['#e91e63','#f4c20d','#3498db','#2ecc71','#9b59b6'];
    S.tanz.noten.push({x:S.VW*0.5+(Math.random()-0.5)*320, y:S.VH*0.72,
      w:(Math.random()-0.5)*30, c:cols[Math.floor(Math.random()*5)],
      ic:NICONS[Math.floor(Math.random()*4)], t:0});
    if(S.tanz.noten.length>14) S.tanz.noten.shift();
  }
  for(var i=S.tanz.noten.length-1;i>=0;i--){
    var n=S.tanz.noten[i]; n.t++;
    n.y-=1.9; n.x+=Math.sin(n.t*0.1)*1.4+n.w*0.006;
    var a=Math.min(1,(S.VH*0.72-n.y)/80)-Math.max(0, (S.VH*0.16-n.y)/90);
    g.globalAlpha=Math.max(0,Math.min(1,a));
    g.font=(20+Math.sin(n.t*0.12)*4)+'px sans-serif'; g.textAlign='center';
    g.fillStyle=n.c; g.fillText(n.ic, n.x, n.y);
    if(n.y<S.VH*0.1) S.tanz.noten.splice(i,1);
  }
  g.globalAlpha=1;
}
// Geburtstag: Kuchen mit 3 Kerzen + Flamme/Rauch/Konfetti
function drawKuchen(g){
  if(!S.kuchen) return;
  var kp=kerzenPos(), t=performance.now()/1000;
  var cx=kp.kx, cy=kp.ky;
  // Tisch
  g.fillStyle='#c49a6c'; g.fillRect(cx-110,cy+34,220,14);
  // Kuchen: 2 Stöcke + Deko
  g.fillStyle='#f6d8b0'; g.fillRect(cx-86,cy-6,172,44);
  g.fillStyle='#ff9eb5'; g.fillRect(cx-86,cy-14,172,12);
  g.fillStyle='#f2c490'; g.fillRect(cx-70,cy-48,140,40);
  g.fillStyle='#ff9eb5'; g.fillRect(cx-70,cy-56,140,12);
  // Streusel
  var cols=['#e91e63','#f4c20d','#3498db','#2ecc71','#9b59b6'];
  for(var i=0;i<14;i++){
    g.fillStyle=cols[i%5];
    g.fillRect(cx-78+i*12, cy-12+((i*7)%8), 6, 3);
  }
  // Kerzen
  for(var k=0;k<3;k++){
    var px=kp.kerzen[k][0], py=kp.kerzen[k][1];
    // Kerzenkörper (gestreift)
    g.fillStyle='#fff'; g.fillRect(px-6,py,12,52);
    g.fillStyle=cols[k*2]; 
    for(var s2=0;s2<3;s2++) g.fillRect(px-6,py+6+s2*16,12,6);
    g.strokeStyle='rgba(0,0,0,0.12)'; g.lineWidth=1.5; g.strokeRect(px-6,py,12,52);
    // Docht
    g.strokeStyle='#5a4637'; g.lineWidth=2;
    g.beginPath(); g.moveTo(px,py); g.lineTo(px,py-7); g.stroke();
    var kerze=S.kuchen.kerzen[k];
    if(kerze.an){
      // Flamme (flackernd)
      var fl=Math.sin(t*13+k*2.4)*2.4 + Math.sin(t*7.3+k)*1.6;
      var fy=py-9;
      g.save();
      g.globalAlpha=0.9;
      ell2(g,px+fl*0.4,fy-8,7+Math.sin(t*11+k)*1.4,12+Math.cos(t*9+k)*1.8,'rgba(255,196,64,0.95)');
      ell2(g,px+fl*0.2,fy-7,4,7,'rgba(255,240,170,0.95)');
      circle2(g,px,fy-4,2.4,'#fff');
      g.restore();
      // Halo
      g.globalAlpha=0.18; circle2(g,px,fy-6,26,'#ffcf63'); g.globalAlpha=1;
    }
  }
  // Rauchwölkchen für gelöschte Kerzen
  for(var r2=S.kuchen.rauch.length-1;r2>=0;r2--){
    var rp=S.kuchen.rauch[r2]; rp.t++;
    var ra=Math.max(0, 1-rp.t/60);
    g.globalAlpha=ra*0.6;
    g.fillStyle='#cfd6de';
    var wob2=Math.sin(rp.t*0.13)*12;
    circle2(g,rp.x+wob2*0.2, rp.y-rp.t*1.6, 6+rp.t*0.16, '#cfd6de');
    circle2(g,rp.x+8+wob2*0.3, rp.y-rp.t*1.6-8, 4+rp.t*0.12, '#dfe5ec');
    if(rp.t>60) S.kuchen.rauch.splice(r2,1);
  }
  g.globalAlpha=1;
  // Feier-Text, wenn alle aus
  if(S.kuchen.feier>0){
    g.textAlign='center';
    var pul=1+0.12*Math.sin(t*6);
    g.save();
    g.translate(S.VW/2,150); g.scale(pul,pul);
    g.font='bold 44px sans-serif';
    g.lineWidth=7; g.strokeStyle='#fff';
    g.strokeText('🎉 Alles Gute! 🎂',0,0);
    g.fillStyle='#7a4b8f'; g.fillText('🎉 Alles Gute! 🎂',0,0);
    g.restore();
  }
}
// Disco: Kugel + Lichtpunkte + Farbschein
function drawDisco(g){
  var t=performance.now()/1000;
  var farb=DISCO_FARBEN[S.discoFarbe||0];
  var W=S.VW,H=S.VH;
  // Farb-Overlay dezent
  g.save();
  g.globalAlpha=0.16;
  g.fillStyle=farb; g.fillRect(0,0,W,H*0.66);
  g.globalAlpha=1;
  // Lichtpunkte, die über Boden/Wand wandern
  for(var i=0;i<24;i++){
    var a=t*0.9+i*(Math.PI*2/24);
    var rxp=Math.cos(a)*(140+((i*37)%120));
    var px2=W*0.5+rxp*Math.cos(i*1.3+t*0.5);
    var py2=H*0.72+((i*53)%150) - Math.abs(Math.sin(a+i))*40;
    var sz=3+((i*29)%6)+2*Math.sin(t*3+i);
    g.globalAlpha=0.5+0.4*Math.sin(t*2.5+i*1.7);
    circle2(g,px2,py2,Math.max(2,sz),farb);
  }
  // Wandpunkte oben
  for(var w=0;w<10;w++){
    var wx2=(t*40+w*97)%W;
    var wy2=40+((w*67)%120);
    g.globalAlpha=0.4;
    circle2(g,wx2,wy2,4,'#ffffff');
  }
  g.globalAlpha=1;
  // Discokugel über dem Bären
  var kx=W*0.5, ky=118, kr=52;
  // Kette
  g.strokeStyle='#9aa4ae'; g.lineWidth=3;
  g.beginPath(); g.moveTo(kx,20); g.lineTo(kx,ky-kr); g.stroke();
  // rotierende Facetten
  var rot=t*0.7;
  for(var yy=-4;yy<=4;yy++){
    for(var xx=-4;xx<=4;xx++){
      var nx=xx/4.5, ny=yy/4.5;
      if(nx*nx+ny*ny>1) continue;
      var pxp=kx+nx*kr*Math.cos(rot)-ny*kr*0.9*Math.sin(rot);
      var pyp=ky+ny*kr*0.9+ (nx*4);
      var br=Math.max(0,Math.cos(nx*2.2+rot*2.6))*0.75+0.25;
      g.fillStyle='rgba(230,235,240,'+br.toFixed(2)+')';
      g.fillRect(pxp-6,pyp-5,12,10);
    }
  }
  g.strokeStyle='#b8c2cc'; g.lineWidth=2;
  g.beginPath(); g.arc(kx,ky,kr,0,Math.PI*2); g.stroke();
  // Funkeln
  Art.drawSticker(g,'stern',kx+30*Math.cos(rot*3),ky-34,7,'#fff');
  Art.drawSticker(g,'stern',kx-26*Math.cos(rot*2),ky+30,5,farb);
  g.restore();
}
function circle2(g,x,y,r,c){ g.fillStyle=c; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
function ell2(g,x,y,rx,ry,c){ g.fillStyle=c; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill(); }

// r19: Bälle starten/landen IN den echten Pfoten (Art.drawBear → baer._paws), Scheitel ≈ Kopfhöhe.
// L→R hoch (Kopf oben), R→L flacher (Augenhöhe): die Bahnen treffen sich nur in den Pfoten, 2–3 Bälle berühren sich nie
// (simuliert: Mindestabstand ≥ 55 Welt-Einheiten bei Ø 46).
var BALL_R=23;      // Ball-Radius (war 17, +35 %)
var JONG_T=1.7;     // Sekunden pro Ball-Runde (L→R fliegen, halten, R→L fliegen, halten)
function drawJonglage(g){
  var z=S.zirkus, bälle=z.bälle, n=bälle.length, b=S.baer, geo=b._geo;
  var t=performance.now()/1000, R=BALL_R, k=R/17;
  var s=geo?geo.s:Math.min(S.VW,S.VH)/420, cy=geo?geo.cy:S.VH*0.58;
  var pw=b._paws||[[S.VW*0.5-160*s,cy+45*s],[S.VW*0.5+160*s,cy+45*s]];
  var hand=[[pw[0][0],pw[0][1]-R*0.5],[pw[1][0],pw[1][1]-R*0.5]]; // Ball liegt in der Pfote
  var apex=[cy-160*s, cy-100*s]; // Kopf oben ≈ cy-172s, Augen ≈ cy-98s
  var FL=0.42, DW=0.08;
  z._pos=[]; z._r=R;
  for(var i=0;i<n;i++){
    var ph=(t/JONG_T+i/n)%1, lr=ph<0.5, q=lr?ph:ph-0.5, P0=hand[lr?0:1], P1=hand[lr?1:0], x, y;
    if(q<FL){ // Flug
      var u=q/FL, h=Math.max(0,Math.min(P0[1],P1[1])-apex[lr?0:1]);
      x=P0[0]+(P1[0]-P0[0])*u; y=P0[1]+(P1[1]-P0[1])*u-4*h*u*(1-u);
    } else { // Halten: kurz in die Pfote plumpsen
      x=P1[0]; y=P1[1]+Math.sin((q-FL)/DW*Math.PI)*8*s;
    }
    z._pos.push([x,y]);
    g.fillStyle=bälle[i].c; g.beginPath(); g.arc(x,y,R,0,Math.PI*2); g.fill();
    g.strokeStyle='rgba(0,0,0,0.25)'; g.lineWidth=2*k; g.stroke();
    g.fillStyle='rgba(255,255,255,0.65)';
    g.beginPath(); g.arc(x-5*k,y-6*k,5*k,0,Math.PI*2); g.fill();
  }
}
function drawAlbumVorschau(g){
  if(!S.album || !S.album.length) return;
  var ax=S.VW-330, ay=S.VH-230, aw=72, ah=86, gap=14;
  S._albumBoxes=[];
  g.save(); g.font='11px sans-serif'; g.textAlign='center';
  g.fillStyle='#7a4b8f'; g.fillText('Meine Schnappschüsse (antippen = laden)', ax+ (4*(aw+gap)-gap)/2, ay-6);
  S.album.slice(-4).forEach(function(p,i){
    var x=ax+i*(aw+gap);
    S._albumBoxes.push({x:x,y:ay,w:aw,h:ah,idx:S.album.length-Math.min(4,S.album.length)+i});
    g.fillStyle='#fff'; g.strokeStyle='#c9aede'; g.lineWidth=2;
    g.beginPath(); g.rect(x,ay,aw,ah); g.fill(); g.stroke();
    // Mini-Thumbnail des gespeicherten Looks
    var mod=Art.MODELS[p.fellIdx]||Art.MODELS[0];
    var mini={
      fellIdx:p.fellIdx, fell:mod.fell, haar:p.haar||Art.HAAR[0], frisur:p.frisur||'lockig',
      lack:p.lack||{}, schaum:0, tropfen:[], fluff:0, bow:0, breathe:0, blink:0, relax:0,
      gurkeL:false, gurkeR:false, duft:null,
      makeup:(p.makeup && {rouge:p.makeup.rouge||null,lid:p.makeup.lid||null,gp:(p.makeup.gp||[]).slice(0,8)}) || {rouge:null,lid:null,gp:[]},
      acc:p.acc||{hut:null,schleife:null,brille:null,kette:null},
      sticker:[]
    };
    g.save(); g.beginPath(); g.rect(x+4,ay+4,aw-8,50); g.clip();
    g.translate(x+aw/2,ay+10); g.scale(0.14,0.14); g.translate(-225,-60);
    Art.drawBear(g, mini, {w:450,h:330}); g.restore();
    g.fillStyle='#5d3a75'; g.font='9px sans-serif';
    g.fillText(p.modell, x+aw/2, ay+64);
    g.fillText(p.datum, x+aw/2, ay+76);
  });
  g.restore();
}
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

function drawHerzen(g){
  if(!S.mass) return;
  S.mass.herzen.forEach(function(h){
    g.globalAlpha = h.a;
    Art.drawSticker(g,'herz',h.x,h.y,10,'#ff6b9d');
  });
  g.globalAlpha=1;
}

function drawStickers(g){ /* v17: Sticker sitzen auf den Krallen (art.js) */ }

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
  S.state='waschen'; S.buildUI();
  sfx(surprise?'tada':'chime');
  if(surprise){ window.BSGame && window.BSGame.konfettiBurst(S.VW/2, S.VH*0.4);
    window.BSGame && window.BSGame.sternExplosion(S.VW/2, S.VH*0.5); }
  react('happy',1.4);
};
S.tapBear = function(x,y){
  if(S.state==='finish-done'){ S.finaleSkip(); return true; }
  if(S.state==='geschenke' && S.geschenk){
    // Paket antippen: schütteln → Deckel fliegt mit Überraschungs-Puff; danach neues Paket
    var gpak=S._pakHit;
    if(gpak && x>=gpak.x&&x<=gpak.x+gpak.w&&y>=gpak.y&&y<=gpak.y+gpak.h){
      var ge=S.geschenk;
      if(ge.offen){
        // erneut antippen = neues Paket
        ge.offen=false; ge.schuettel=0; ge.idx=(ge.idx+1)%5;
        window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(gpak.x+gpak.w/2,gpak.y+gpak.h/2);
        return true;
      }
      if(ge.schuettel<=0){
        ge.schuettel=0.8; // erst schütteln
      } else {
        ge.offen=true; ge.schuettel=0;
        geschenkPuff(ge.idx);
      }
      return true;
    }
    return true;
  }
  if(S.state==='keks' && S.keks){
    var kk=S.keks, s9=Math.min(S.VW,S.VH)/420;
    // Teig-Tap: mit gewähltem Förmchen ausstechen
    if(kk.form!==null && S._teigHit && !kk.stich && kk.teig>0.6 &&
      x>=S._teigHit.x&&x<=S._teigHit.x+S._teigHit.w&&y>=S._teigHit.y&&y<=S._teigHit.y+S._teigHit.h){
      kk.stich={form:kk.form, gebacken:0};
      window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(S._teigHit.x+S._teigHit.w/2,S._teigHit.y);
      S.buildUI();
      return true;
    }
    return true;
  }
  if(S.state==='zuckerwatte' && S.watte){
    var wt2=S.watte;
    // Watte-Stab antippen = Drag aktiv
    if(S._stabHit && x>=S._stabHit.x&&x<=S._stabHit.x+S._stabHit.w&&y>=S._stabHit.y&&y<=S._stabHit.y+S._stabHit.h){
      S._stabDrag=true; return true;
    }
    // Zuckerwolle antippen = Spinnen starten
    if(S._wolleHit && x>=S._wolleHit.x&&x<=S._wolleHit.x+S._wolleHit.w&&y>=S._wolleHit.y&&y<=S._wolleHit.y+S._wolleHit.h){
      wt2.spin=Math.min(1,(wt2.spin||0)+0.45); return true;
    }
    return true;
  }
  if(S.state==='foto' && S._albumBoxes){
    // Album-Kachel tippen: Look zurückladen
    for(var ai=0; ai<S._albumBoxes.length; ai++){
      var ab=S._albumBoxes[ai];
      if(x>=ab.x&&x<=ab.x+ab.w&&y>=ab.y&&y<=ab.y+ab.h){
        var snap=S.album[ab.idx]; if(!snap) return false;
        var m=Art.MODELS[snap.fellIdx]||Art.MODELS[0];
        S.baer=Object.assign(neuerBaer(snap.fellIdx||0), {
          haar:snap.haar||Art.HAAR[0], frisur:snap.frisur||'lockig',
          lack:snap.lack||{}, acc:snap.acc||{hut:null,schleife:null,brille:null,kette:null},
          sticker:snap.sticker||[], makeup:snap.makeup||{rouge:null,lid:null,gp:[]},
          gurkeL:!!snap.gurkeL, gurkeR:!!snap.gurkeR, duft:(snap.duft===undefined?null:snap.duft)
        });
        S.baer.fellIdx=snap.fellIdx||0; S.baer.fell=m.fell;
        if(snap.rahmen!==undefined) S.fotoRahmen=snap.rahmen;
        S.save(); S.buildUI();
        return true;
      }
    }
  }
  if(S.state==='ballon' && S.ballon){
    // Fertigen Ballon antippen = PLATZ!
    if(S._ballHit && S.ballon.fertig &&
      x>=S._ballHit.x&&x<=S._ballHit.x+S._ballHit.w&&y>=S._ballHit.y&&y<=S._ballHit.y+S._ballHit.h){
      var bl2=S.ballon;
      var mpx=S._ballHit.x+S._ballHit.w/2, mpy=S._ballHit.y+S._ballHit.h/2;
      window.BSGame && window.BSGame.konfettiBurst(mpx, mpy);
      window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(mpx,mpy);
      var cAlt=bl2.farb;
      bl2.schweb=null; bl2.fertig=false; bl2.gr=0; bl2.schreck=1; // Bär zuckt
      // danach schwebt automatisch ein neuer Ballon in anderer Farbe neben den Bären
      setTimeout(function(){
        if(S.state==='ballon' && S.ballon && !S.ballon.fertig && S.ballon.gr===0){
          S.ballon.farb=(cAlt+1)%Art.BALLON_FARBEN.length;
          S.ballon.gr=1; S.ballon.fertig=true; S.ballon.schweb=null; S.buildUI();
        }
      },2600);
      S.buildUI();
      return true;
    }
    return true;
  }
  if(S.state==='zauber' && S.zauber){
    // Zauberstab antippen = Zauberspruch
    if(S._stabHitZ && x>=S._stabHitZ.x&&x<=S._stabHitZ.x+S._stabHitZ.w&&y>=S._stabHitZ.y&&y<=S._stabHitZ.y+S._stabHitZ.h){
      S.zauber.fx={art:S.zauber.art, t:0.001, d:1.6, seed:Math.random()*6};
      S.zauber.pfote=1;
      window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(S.VW*0.5+128*Math.min(S.VW,S.VH)/420, S.VH*0.58-140);
      S.buildUI();
      return true;
    }
    // Auch Tap aufs obere Drittel neben dem Bären zaubert (Kinder-tolerant)
    var s6=Math.min(S.VW,S.VH)/420;
    if(Math.hypot(x-(S.VW*0.5+128*s6), y-(S.VH*0.58-60*s6))<120*s6){
      S.zauber.fx={art:S.zauber.art, t:0.001, d:1.6, seed:Math.random()*6};
      S.zauber.pfote=1; S.buildUI();
      return true;
    }
    return true;
  }
  if(S.state==='geburtstag' && S.kuchen){
    // Kerzen antippen
    var kp=kerzenPos();
    for(var ci=0; ci<3; ci++){
      var kx2=kp.kerzen[ci][0], ky2=kp.kerzen[ci][1];
      if(x>=kx2-16&&x<=kx2+16&&y>=ky2-30&&y<=ky2+56){
        var ker=S.kuchen.kerzen[ci];
        if(ker.an){ // ausblasen: Rauchwölkchen
          ker.an=false;
          for(var rm=0; rm<3; rm++) S.kuchen.rauch.push({x:kx2+(rm-1)*6, y:ky2-14, t:rm*-8});
          if(S.kuchen.kerzen.every(function(z){return !z.an;})){
            S.kuchen.feier=1;
            window.BSGame && window.BSGame.konfettiBurst(S.VW/2, 170);
          }
          S.buildUI();
        } else { ker.an=true; S.kuchen.feier=0; S.buildUI(); }
        return true;
      }
    }
    return true;
  }
  if(S.state==='disco'){
    // Bär antippen: Lichtfarbe wechseln
    var s5=Math.min(S.VW,S.VH)/420;
    if(Math.hypot(x-S.VW*0.5, y-S.VH*0.58)<180*s5){
      S.discoFarbe=((S.discoFarbe||0)+1)%DISCO_FARBEN.length;
      S.buildUI();
      return true;
    }
    return true;
  }
  if(S.state==='waschen'){
    var s=Math.min(S.VW,S.VH)/420;
    var cx=S.VW*0.5, cy=S.VH*0.58+70*s;
    var dx=(x-cx)/(120*s), dy=(y-cy)/(110*s);
    if(dx*dx+dy*dy < 1.4){ S.baer.schaum=Math.min(1,S.baer.schaum+0.03); return true; }
  }
  if(S.state==='pfoten'){
    ['L0','L1','L2','R0','R1','R2'].forEach(function(k){
      var p=clawPos(k);
      if(Math.hypot(x-p[0],y-p[1])<p[2]+8){
        if(S.stickerTyp){
          S.baer.sticker=S.baer.sticker.filter(function(t){return t.ziel!==k;});
          S.baer.sticker.push({ziel:k,typ:S.stickerTyp,farbe:S.lackColor||'#e91e63'});
        } else {
          S.baer.lack[k]=S.lackColor||'#e91e63';
        }
        S.save();
        sfx('pop',{pitch:1.4}); react('happy',0.6);
        emit('star',p[0],p[1],{n:7,speed:170,size:8,life:0.6,grav:200,colors:['#ffe7a8',S.lackColor||'#e91e63']});
      }
    });
    return true;
  }
  if(S.state==='makeup' && S.glitzMode){
    // Glitzer-Tupfer auf Wange/Stirn (Kopfbereich), max 14
    var s2=Math.min(S.VW,S.VH)/420;
    var cx2=S.VW*0.5, hy2=S.VH*0.58-90*s2;
    var ddx=x-cx2, ddy=y-hy2;
    if(ddx*ddx/(90*s2*90*s2)+ddy*ddy/(90*s2*90*s2)<1.2){
      var mk=S.baer.makeup; if(!mk.gp) mk.gp=[];
      if(mk.gp.length<14){ mk.gp.push({dx:ddx,dy:ddy}); S.save(); }
    }
    return true;
  }
  if(S.state==='massage'){ S.dragBear(x,y); return true; }
  if(S.state==='tanz' && S.tanz){
    // Antippen des Bären: Pirouette (Spin)
    var s4=Math.min(S.VW,S.VH)/420;
    var bx=S.VW*0.5, byc=S.VH*0.58;
    if(Math.hypot(x-bx,y-byc)<160*s4){ S.tanz.spin=1; return true; }
    return true;
  }
  if(S.state==='spa'){
    var s2=Math.min(S.VW,S.VH)/420;
    var cx2=S.VW*0.5, ey=S.VH*0.58-105*s2;
    // linke Seite / rechte Seite
    if(Math.hypot(x-(cx2-30*s2), y-ey) < 40*s2){
      S.baer.gurkeL = !S.baer.gurkeL; S.save(); S.buildUI();
      window.BSGame && window.BSGame.spaTupfer(x,y);
      return true;
    }
    if(Math.hypot(x-(cx2+30*s2), y-ey) < 40*s2){
      S.baer.gurkeR = !S.baer.gurkeR; S.save(); S.buildUI();
      window.BSGame && window.BSGame.spaTupfer(x,y);
      return true;
    }
    return true;
  }
  if(S.state==='malbuch'){
    if(!S.mb) S.mb={parts:{},rahmen:0};
    if(!S.mbColor) S.mbColor=Art.MAL_FARBEN[0];
    // Rahmen-Bereich tippen = Rahmenstil wechseln (ohne Papier)
    var f=S._mbFrame;
    if(f && x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.h &&
       !(x>f.x+26&&x<f.x+f.w-26&&y>f.y+26&&y<f.y+f.h-26)){
      S.mb.rahmen=(S.mb.rahmen+1)%4; S.buildUI(); return true;
    }
    if(S._mbHit) for(var mi=0;mi<S._mbHit.length;mi++){
      var h=S._mbHit[mi];
      if(Math.hypot(x-h.x,y-h.y)<h.r){
        S.mb.parts[h.key]=S.mbColor;
        return true;
      }
    }
    return true;
  }
  return false;
};

// Massage-Bewegung: Kreis-Drag auf dem Bär-Körper
S.dragBear = function(x,y,px,py){
  if(S.state!=='massage'||!S.mass) return;
  var s=Math.min(S.VW,S.VH)/420;
  var cx=S.VW*0.5, cy=S.VH*0.58+70*s;
  var dx=(x-cx)/(140*s), dy=(y-cy)/(130*s);
  if(dx*dx+dy*dy>1.6) { S.mass.ang=null; return; }
  var a=Math.atan2(y-cy,x-cx);
  if(S.mass.ang!==null && px!==undefined){
    var da=a-S.mass.ang;
    if(da>Math.PI) da-=Math.PI*2;
    if(da<-Math.PI) da+=Math.PI*2;
    S.mass.prog=Math.min(100,S.mass.prog+Math.abs(da)*2.2);
    if(Math.abs(da)>0.05 && Math.random()<0.3){
      S.mass.herzen.push({ox:x,oy:y, x:x, y:y, a:1, t:0, a0:Math.random()*Math.PI*2, r0:6+Math.random()*10});
      if(S.mass.herzen.length>18) S.mass.herzen.shift();
    }
  }
  S.mass.ang=a;
};

function drawRegenbogen(g,cx,cy,R){
  var cols=['#ff7a7a','#ffbe60','#ffe86e','#8fd48a','#7ab8f5','#c39bd3'];
  g.save(); g.lineCap='round';
  for(var i=0;i<cols.length;i++){
    g.strokeStyle=cols[i]; g.globalAlpha=0.85; g.lineWidth=11;
    g.beginPath(); g.arc(cx,cy,R-i*11,Math.PI,Math.PI*2); g.stroke();
  }
  g.globalAlpha=1;
  // Wölkchen an den Enden
  [-1,1].forEach(function(sgn){
    var wx=cx+sgn*R, wy=cy;
    g.fillStyle='rgba(255,255,255,0.9)';
    g.beginPath(); g.arc(wx,wy,20,0,Math.PI*2); g.fill();
    g.beginPath(); g.arc(wx-16,wy+5,14,0,Math.PI*2); g.fill();
    g.beginPath(); g.arc(wx+16,wy+5,14,0,Math.PI*2); g.fill();
  });
  g.restore();
}

function geschenkPuff(idx){
  var gx=S.VW*0.5+230, gy=S.VH*0.58+40;
  var p=gesPos(); gx=p.x; gy=p.y;
  var G2=window.BSGame; if(!G2) return;
  var typ=GESCHENK_INHALT[idx%5];
  if(typ==='konfetti') G2.konfettiBurst(gx,gy);
  else if(typ==='herz') G2.herzPuff(gx,gy);
  else if(typ==='stern') G2.sternExplosion(gx,gy);
  else if(typ==='blume') G2.blumenPuff(gx,gy);
  else G2.regenbogenPuff(gx,gy);
  if(S.baer) S.baer.jubelT2=Math.max(S.baer.jubelT2||0,1.6);
}
function gesPos(){
  return {x:S.VW*0.5+215, y:S.VH*0.58+60};
}
// ---- Zeichnen der neuen Stationen ---------------------------------------
function drawPaket(g,x,y,w2,offen,idx,t){
  var s=w2/100;
  // Körper
  g.fillStyle=Art.PAKET_FARBEN[idx%Art.PAKET_FARBEN.length];
  g.fillRect(x-w2*0.5,y-w2*0.32,w2,w2*0.72);
  g.strokeStyle='rgba(0,0,0,0.22)'; g.lineWidth=3*s*3; g.strokeRect(x-w2*0.5,y-w2*0.32,w2,w2*0.72);
  // Band
  g.fillStyle='rgba(255,255,255,0.9)';
  g.fillRect(x-w2*0.09,y-w2*0.32,w2*0.18,w2*0.72);
  g.fillRect(x-w2*0.5,y-w2*0.05,w2,w2*0.14);
  if(!offen){
    // Deckel
    g.fillStyle=Art.shade(Art.PAKET_FARBEN[idx%5],-28);
    g.fillRect(x-w2*0.56,y-w2*0.5,w2*1.12,w2*0.2);
    g.strokeRect(x-w2*0.56,y-w2*0.5,w2*1.12,w2*0.2);
    // Schleife
    g.fillStyle='#fff';
    g.beginPath(); g.moveTo(x,y-w2*0.5); g.lineTo(x-w2*0.3,y-w2*0.72); g.lineTo(x-w2*0.3,y-w2*0.5); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x,y-w2*0.5); g.lineTo(x+w2*0.3,y-w2*0.72); g.lineTo(x+w2*0.3,y-w2*0.5); g.closePath(); g.fill();
    circle2(g,x,y-w2*0.5,w2*0.12,'#ffe9f2');
  } else {
    // offen: Deckel liegt fliegend daneben, dunkler Innenraum glitzert
    g.fillStyle='rgba(40,20,60,0.85)';
    g.fillRect(x-w2*0.5,y-w2*0.32,w2,w2*0.16);
    for(var s2=0;s2<3;s2++)
      Art.drawSticker(g,'stern',x-w2*0.3+s2*w2*0.3,y-w2*0.26,(7+2*Math.sin(t*6+s2*2))*s*0.5,'#ffd24d');
    var dy=-w2*(0.55+0.12*Math.sin(t*3));
    drawPaketDeckel(g,x+w2*0.55,y+dy,w2*0.9,t);
  }
}
function drawPaketDeckel(g,x,y,w2,t){
  g.save(); g.translate(x,y); g.rotate(0.5+Math.sin(t*4)*0.12);
  g.fillStyle=Art.shade(Art.PAKET_FARBEN[S.geschenk.idx%5]||'#e91e63',-28);
  g.fillRect(-w2*0.56,-w2*0.1,w2*1.12,w2*0.2);
  g.strokeStyle='rgba(0,0,0,0.2)'; g.lineWidth=6; g.strokeRect(-w2*0.56,-w2*0.1,w2*1.12,w2*0.2);
  g.restore();
}
function drawGeschenke(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var ge=S.geschenk; if(!ge) return;
  // Bär strahlt beim Öffnen
  var strahlAlt=S.baer.jubel;
  if(ge.offen|| (S.baer.jubelT2||0)>0) S.baer.jubel=Math.max(S.baer.jubel||0, Math.min(1,(S.baer.jubelT2||0))/1.2);
  Art.drawBear(g,S.baer,{w:S.VW,h:S.VH, spaTarget:S.spaTarget});
  S.baer.jubel=strahlAlt;
  drawStickers(g);
  // aktives Paket neben dem Bären (schüttelt sich)
  var p=gesPos();
  var wob = ge.schuettel>0 ? Math.sin(t*22)*10*ge.schuettel : 0;
  S._pakHit={x:p.x-80,y:p.y-80,w:170,h:170}; // Hit immer, auch beim Schütteln
  g.save(); g.translate(p.x+wob,p.y); g.rotate(wob*0.01);
  drawPaket(g,0,0,120,ge.offen,ge.idx,t);
  g.restore();
  S._pakHit={x:p.x-80,y:p.y-80,w:170,h:170};
  // Regenbogen-Aura bei Regenbogen-Inhalt
  if(ge.offen && GESCHENK_INHALT[ge.idx%5]==='regenbogen')
    drawRegenbogen(g,p.x,p.y+30,90);
  // Schleifen-Regen Deko oben
  for(var d=0;d<5;d++){
    var dy2=(t*24+d*97)%(S.VH*0.5);
    Art.drawSticker(g,d%2?'herz':'stern',60+d*170,dy2+40,7,'rgba(154,107,181,0.5)');
  }
}
function drawKeks(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var kk=S.keks; if(!kk) return;
  // Backofen-Backwand rechts
  var ox=S.VW-270, oy=S.VH*0.42, ow=210, oh=170;
  g.fillStyle='#5a4a3a'; g.beginPath(); g.roundRect?g.roundRect(ox,oy,ow,oh,18):g.rect(ox,oy,ow,oh); g.fill();
  g.fillStyle='#3a2f24'; g.beginPath(); g.roundRect?g.roundRect(ox+18,oy+18,ow-36,oh-72,10):g.rect(ox+18,oy+18,ow-36,oh-72); g.fill();
  // Ofen-Glow wenn gebacken wird
  if(kk.glow>0){
    g.save(); g.globalAlpha=Math.min(1,kk.glow);
    var grd=g.createRadialGradient(ox+ow/2,oy+oh/2-24,8,ox+ow/2,oy+oh/2-24,110);
    grd.addColorStop(0,'#ffd24d'); grd.addColorStop(1,'rgba(255,120,40,0)');
    g.fillStyle=grd; g.fillRect(ox+18,oy+8,ow-36,oh-52);
    g.restore();
  }
  g.fillStyle='#c8a06a'; g.font='13px sans-serif'; g.textAlign='center';
  g.fillText('Ofen',ox+ow/2,oy+oh-18);
  // Bär
  Art.drawBear(g,S.baer,{w:S.VW,h:S.VH, spaTarget:S.spaTarget});
  drawStickers(g);
  // Teigbrett links-vor dem Bären
  var bx=S.VW*0.28, by=S.VH*0.68, bw=250, bh=110;
  g.fillStyle='#c49a6c'; g.beginPath(); g.roundRect?g.roundRect(bx-bw/2,by,bw,bh,16):g.rect(bx-bw/2,by,bw,bh); g.fill();
  g.strokeStyle='#8a6238'; g.lineWidth=3; g.strokeRect(bx-bw/2+6,by+6,bw-12,bh-12);
  var flach=0.55+kk.teig*0.45;
  if(!kk.stich){
    g.save();
    g.translate(bx,by+bh*0.5); g.scale(1,flach);
    g.fillStyle='#f0d8a8';
    g.beginPath(); g.ellipse(0,0,bw*0.42,bh*0.7,0,0,Math.PI*2); g.fill();
    g.strokeStyle='#d9bd85'; g.lineWidth=2.5;
    g.beginPath(); g.ellipse(0,0,bw*0.42,bh*0.7,0,0,Math.PI*2); g.stroke();
    // Mehl-Sprenkel
    g.fillStyle='rgba(255,255,255,0.7)';
    for(var m=0;m<8;m++) circle2(g,-70+m*20-((m*37)%14),((m*53)%40)-20,2,'#fff');
    g.restore();
    S._teigHit={x:bx-bw*0.45,y:by+bh*0.5-bh*0.75*flach,w:bw*0.9,h:bh*1.5*flach};
    if(kk.teig>0.6 && kk.form===null){
      g.fillStyle='#9c6bb5'; g.font='15px sans-serif';
      g.fillText('Teig ist glatt! Wähle ein Förmchen 👆',bx,by-16);
    }
  } else S._teigHit=null;
  // Ausgestochener Keks im Ofen: Farbe hell→goldbraun mit glow
  if(kk.stich){
    var kx6=ox+ow/2, ky6=oy+oh/2-26;
    var col=kk.glow>0.5?'#c98a3a':(kk.glow>0?'#dfae62':'#f0d8a8');
    g.fillStyle=col;
    if(kk.stich.form==='baer'){
      circle2(g,kx6,ky6,24,col); circle2(g,kx6-19,ky6-19,9,col); circle2(g,kx6+19,ky6-19,9,col);
    } else {
      Art.drawSticker(g,kk.stich.form,kx6,ky6,26,col);
    }
    // Schokotröpfchen
    circle2(g,kx6-8,ky6-4,3,'#6b4226'); circle2(g,kx6+7,ky6+6,3,'#6b4226'); circle2(g,kx6+2,ky6-10,2.5,'#6b4226');
    // Sichtbarer Biß: dunkler Hintergrund-Sektor frisst den Keks oben rechts weg
    if(kk.biss>0 || kk.glow===0){
      var bissA=Math.max(0,Math.min(1, kk.biss>0 ? (1.4-kk.biss)*2.5 : 1)); // wächst während des Kauens
      if(bissA>0.05){
        g.save();
        g.globalAlpha=bissA;
        g.fillStyle='#3a2f24'; // Ofen-Hintergrundfarbe = Biß-Loch
        g.beginPath(); g.arc(kx6+20,ky6-16,17,0,Math.PI*2); g.fill();
        g.beginPath(); g.arc(kx6+30,ky6-2,11,0,Math.PI*2); g.fill(); // zweiter Knabser
        // Krümel am Bißrand
        g.fillStyle='#c98a3a';
        circle2(g,kx6+8,ky6-4,2.2,'#c98a3a');
        circle2(g,kx6+2,ky6-12,2,'#c98a3a');
        circle2(g,kx6+13,ky6-14,1.6,'#6b4226');
        g.restore();
      }
    }
    // Dampf beim Naschen (nach glow)
    if(kk.biss>0){
      g.globalAlpha=Math.min(1,kk.biss);
      Art.drawSticker(g,'herz',kx6-30,ky6-50,9,'rgba(255,150,170,0.9)');
      Art.drawSticker(g,'herz',kx6+34,ky6-58,7,'rgba(255,150,170,0.8)');
      g.globalAlpha=1;
    }
  }
}

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

function roundRect(g,x,y,w,h,r){  g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}

S.hitButton = function(x,y){
  for(var i=buttons.length-1;i>=0;i--){
    var b=buttons[i];
    if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h) return b;
  }
  return null;
};
// ---- Zuckerwatte: Wolle-Tap spinnt, Stab per Drag, Bär beißt ab ----
function drawZuckerwatte(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var wt=S.watte;
  // Hintergrund: Jahrmarkt-Bude
  g.fillStyle='#ffe9f0'; g.fillRect(0,0,S.VW,S.VH*0.66);
  g.fillStyle='#ffd1e0'; for(var st2=0;st2<9;st2++) g.fillRect(st2*112,0,56,S.VH*0.66);
  // schwebende Zuckerkrümel-Partikel
  for(var p=0;p<16;p++){
    var px=(p*167+Math.sin(t*0.7+p)*30)%S.VW, py=80+((p*131)%300)+Math.sin(t*1.3+p*2)*20;
    g.fillStyle=['#ff9eb5','#ffd24d','#c39bd3','#fff'][p%4];
    g.beginPath(); g.arc(px,py,2.5+Math.sin(t*3+p)*1.2,0,Math.PI*2); g.fill();
  }
  // Spinn-Maschine (Wolle im Topf)
  var mx=S.VW*0.5-170, my=S.VH*0.55+40;
  g.fillStyle='#8a97a5'; g.strokeStyle='#5a646e'; g.lineWidth=3;
  g.beginPath(); g.roundRect ? g.roundRect(mx-70,my,140,90,14) : g.rect(mx-70,my,140,90);
  g.fill(); g.stroke();
  g.fillStyle='#ff9ec4';
  g.beginPath(); g.ellipse(mx,my,66,26,0,0,Math.PI*2); g.fill();
  g.fillStyle='#ffb8d6';
  g.beginPath(); g.ellipse(mx,my-4,50,18,0,0,Math.PI*2); g.fill();
  if(wt.spin>0){ // Wirbel im Topf
    for(var w=0;w<5;w++){
      var wa=t*8*wt.spin+w*1.3;
      g.beginPath(); g.ellipse(mx+Math.cos(wa)*38,my-3+Math.sin(wa)*8,6,4,0,0,Math.PI*2); g.fill();
    }
  }
  // Zuckerwolle antippen
  if(!S._wolleHit) S._wolleHit={x:mx-70,y:my-10,w:140,h:110};
  g.fillStyle='#7a4b8f'; g.font='15px sans-serif'; g.textAlign='center';
  g.fillText('👆 Zuckerwolle',mx,my+108);
  // Bär groß
  Art.drawBear(g,S.baer,{w:S.VW,h:S.VH, spaTarget:S.spaTarget});
  drawStickers(g);
  // Watte-Stab (Bär hält ihn, Position vom User-Drag)
  var wx2=wt.sx, wy2=wt.sy;
  g.save();
  g.strokeStyle='#e8d5b0'; g.lineWidth=7*s; g.lineCap='round';
  g.beginPath(); g.moveTo(wx2,wy2+90*s); g.lineTo(wx2,wy2-40*s); g.stroke();
  // Watte: rosa Wolke wächst mit lvl
  var wr=(30+wt.lvl*60)*s*(wt.kau>0?1:1);
  if(wr>4){
    var wob=1+0.06*Math.sin(t*6);
    g.globalAlpha=0.96;
    ell2(g,wx2,wy2-60*s,wr*0.9*wob,wr*0.75,'#ffb8d6');
    ell2(g,wx2-wr*0.35,wy2-58*s,wr*0.55,wr*0.5,'#ffc9e0');
    ell2(g,wx2+wr*0.35,wy2-66*s,wr*0.6,wr*0.52,'#ffc9e0');
    ell2(g,wx2,wy2-80*s,wr*0.5,wr*0.42,'#ff9ec4');
    g.globalAlpha=1;
    // glitzernde Zuckerpunkte in der Watte
    for(var zp=0;zp<8;zp++){
      var za=t*2+zp*0.8;
      var zx=wx2+Math.cos(za)*wr*0.5, zy=wy2-62*s+Math.sin(za*1.3)*wr*0.35;
      g.globalAlpha=0.5+0.5*Math.sin(t*5+zp);
      circle2(g,zx,zy,2.5*s,'#fff');
    }
    g.globalAlpha=1;
  }
  // Hit-Box des Stabs für Drag
  S._stabHit={x:wx2-40*s, y:wy2-40*s-wr, w:80*s+wr*2*0, h:130*s+wr};
  // glückliches Kaugesicht: Bär mit hochgezogenen Wangen, wenn kau>0
  if(wt.kau>0){
    var kc=S.VW*0.5, kcy2=S.VH*0.58-15*s;
    g.globalAlpha=Math.min(1,wt.kau);
    Art.drawSticker(g,'herz',kc-55*s,kcy2,14*s,'rgba(255,120,160,0.9)');
    Art.drawSticker(g,'herz',kc+55*s,kcy2,14*s,'rgba(255,120,160,0.9)');
    g.globalAlpha=1;
  }
  g.restore();
}
// ---- Ballon-Station: Farbe + Pusten + PLATZ + schwebender Ballon + Mini-Herzen ----
function drawBallonStation(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var bl=S.ballon; if(!bl) return;
  var cx=S.VW*0.5, cy=S.VH*0.58;
  // schwebende Mini-Herzchen als Deko
  for(var h=0;h<8;h++){
    var hx=(h*113+Math.sin(t*0.6+h)*40)%S.VW, hy2=90+((h*89)%260)+Math.sin(t*1.4+h*2.2)*14;
    g.globalAlpha=0.4+0.3*Math.sin(t*2+h*1.3);
    Art.drawSticker(g,'herz',hx,hy2,7+2*Math.sin(t*3+h),'#ff8fb3');
  }
  g.globalAlpha=1;
  // Pust-Wangen (rund) während der Pust-Animation
  if(bl.pust>0){
    g.globalAlpha=Math.min(1,bl.pust);
    circle2(g,cx-56*s,cy-52*s,20*s,'rgba(255,160,180,0.75)');
    circle2(g,cx+56*s,cy-52*s,20*s,'rgba(255,160,180,0.75)');
    g.globalAlpha=1;
  }
  // Luft-Strahl vom Mund zum Ballon beim Pusten
  var bx=cx+210*s, by=cy-150*s, br=(14+bl.gr*54)*s;
  if(bl.fertig && bl.schweb===null){ // frisch fertig: hängt noch am Schnürchen
    bl.schweb={x:bx,y:by,c:bl.farb,ph:Math.random()*6};
  }
  if(bl.pust>0 && !bl.fertig){
    g.strokeStyle='rgba(160,220,255,0.6)'; g.lineWidth=4; g.lineCap='round';
    for(var l=-1;l<=1;l++){
      g.beginPath(); g.moveTo(cx+30*s,cy-14*s+l*5);
      g.quadraticCurveTo(cx+120*s,cy-60*s+l*20, bx-br*0.6, by+l*10); g.stroke();
    }
  }
  // Ballon am Mund wächst (noch nicht fertig), sonst schwebt er neben dem Bären
  if(!bl.fertig && bl.gr>0){
    g.fillStyle=Art.BALLON_FARBEN[bl.farb];
    g.beginPath(); g.ellipse(bx-br*0.3,by,br*0.8,br,0,0,Math.PI*2); g.fill();
    g.fillStyle='rgba(255,255,255,0.5)';
    g.beginPath(); g.ellipse(bx-br*0.3-br*0.25,by-br*0.3,br*0.22,br*0.3,0,0,Math.PI*2); g.fill();
    // Hit-Box auf wachsenden Ballon (erst bei fertig relevant)
    S._ballHit={x:bx-br*0.3-br,y:by-br,w:br*2,h:br*2};
  } else S._ballHit=null;
  if(bl.fertig && bl.schweb){
    var sw=bl.schweb;
    var sx2=sw.x+Math.sin(t*1.1+sw.ph)*10, sy2=sw.y+Math.sin(t*1.7+sw.ph)*16;
    // Schnur
    g.strokeStyle='rgba(120,120,140,0.7)'; g.lineWidth=2;
    g.beginPath(); g.moveTo(cx+86*s,cy-40*s); g.quadraticCurveTo(sx2-20,sy2+80,sx2,sy2+br+4); g.stroke();
    g.fillStyle=Art.BALLON_FARBEN[sw.c];
    g.beginPath(); g.ellipse(sx2,sy2,br*0.85,br*1.05,0,0,Math.PI*2); g.fill();
    g.fillStyle='rgba(255,255,255,0.5)';
    g.beginPath(); g.ellipse(sx2-br*0.28,sy2-br*0.35,br*0.2,br*0.28,0,0,Math.PI*2); g.fill();
    // Zipfel
    g.fillStyle=Art.shade(Art.BALLON_FARBEN[sw.c],-40);
    g.beginPath(); g.moveTo(sx2-6,sy2+br*1.05); g.lineTo(sx2+6,sy2+br*1.05); g.lineTo(sx2,sy2+br*1.05+10); g.closePath(); g.fill();
    // großzügige Hit-Zone (QA-Fix): deutlich größer als der Ballon
    S._ballHit={x:sx2-br-26,y:sy2-br*1.05-26,w:br*2+52,h:br*2.2+52};
    // Hinweis-Platzer-Stern pulsierend groß
    Art.drawSticker(g,'stern',sx2+br*0.9,sy2-br*1.1,12+4*Math.sin(t*5),'rgba(255,230,120,0.95)');
    g.font='bold 15px sans-serif'; g.textAlign='center'; g.fillStyle='#7a4b8f';
    g.fillText('Antippen = PLATZ!',sx2,sy2+br*1.5+30);
  }
}
// ---- Zauber-Station: Stab + 3 Zauber + mystischer Boden-Nebel ----
function drawZauberStation(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var zb=S.zauber; if(!zb) return;
  var cx=S.VW*0.5, cy=S.VH*0.58;
  // Mystischer Nebel: langsam wandernde halbtransparente Wölkchen am Boden
  for(var n=0;n<7;n++){
    var nx=((t*14+n*173)%(S.VW+220))-110, ny=S.VH*0.72+((n*53)%110)+Math.sin(t*0.8+n)*10;
    g.globalAlpha=0.16+0.08*Math.sin(t*0.7+n*1.9);
    var nc=n%2?'#c39bd3':'#9fb8d8';
    circle2(g,nx,ny,34+n*4,nc);
    circle2(g,nx+26,ny+5,24+n*3,nc);
    circle2(g,nx-26,ny+6,22+n*2,nc);
  }
  g.globalAlpha=1;
  // Zauberstab in der rechten Pfote, leicht schwebend, funkelt idle
  var stx=cx+128*s, sty=cy-30*s+Math.sin(t*1.5)*4;
  g.save();
  g.translate(stx,sty); g.rotate(-0.5);
  g.strokeStyle='#8a5a2a'; g.lineWidth=6*s; g.lineCap='round';
  g.beginPath(); g.moveTo(0,0); g.lineTo(0,-86*s); g.stroke();
  var tw=0.6+0.4*Math.sin(t*4.5);
  Art.drawSticker(g,'stern',0,-98*s,(14+5*tw)*s,'#ffd24d');
  g.globalAlpha=tw*0.6;
  circle2(g,0,-98*s,(26+6*Math.sin(t*4.5))*s,'rgba(255,220,120,0.5)');
  g.globalAlpha=1;
  g.restore();
  S._stabHitZ={x:stx-30*s,y:sty-130*s,w:60*s,h:150*s};
  // Zauberspruch-Effekte (Partikel je Zauber)
  if(zb.fx){
    var f=zb.fx, q=f.t/f.d;
    if(q>=1){ zb.fx=null; }
    else if(f.art===0){ // Sternenschweif: goldene Sterne kreisen aufwärts
      for(var i2=0;i2<14;i2++){
        var a2=f.seed+i2*0.45+q*5;
        var rr2=(60+q*180)*s;
        Art.drawSticker(g,'stern',cx+Math.cos(a2)*rr2,cy-40*s+Math.sin(a2)*rr2*0.5-q*90*s,
          (9+3*Math.sin(q*9+i2))*s,'rgba(255,210,77,'+(1-q)+')');
      }
    } else if(f.art===1){ // Blütenregen: Rosa Blumen fallen von oben
      for(var b2=0;b2<16;b2++){
        var bx2=(b2*67 + f.seed*40)%S.VW;
        var by2=-20+q*S.VH*0.8+((b2*29)%40);
        Art.drawSticker(g,'blume',bx2+Math.sin(t*2+b2)*16,by2,9*s,'rgba(255,158,181,'+(1-q*0.6)+')');
      }
    } else { // Herz-Kreis: Herzen im Kreis um den Bären
      for(var h2=0;h2<12;h2++){
        var ah=h2/12*Math.PI*2+q*3+f.seed;
        Art.drawSticker(g,'herz',cx+Math.cos(ah)*150*s,cy+Math.sin(ah)*110*s-40*s,
          (10+4*Math.sin(q*8+h2))*s,'rgba(233,30,99,'+(1-q)+')');
      }
    }
    if(zb.fx) zb.fx.t+=0.016;
  }
}
// ---- Karussell: Zelt, Lichterketten, drehendes Pferd mit Bär ----
function drawKarussell(g){
  var t=performance.now()/1000;
  var k=S.karo; k.ang=(k.ang||0)+k.w*0.02;
  var W=S.VW,H=S.VH;
  // Zelt-Dach
  g.fillStyle='#e74c3c';
  g.beginPath(); g.moveTo(W/2,30); g.lineTo(W/2-260,140); g.lineTo(W/2+260,140); g.closePath(); g.fill();
  g.strokeStyle='#b03a2e'; g.lineWidth=3;
  for(var st3=-2;st3<=2;st3++){
    g.beginPath(); g.moveTo(W/2+st3*52,140); g.lineTo(W/2,30); g.stroke();
  }
  // Lichterketten am Dachrand
  for(var li=0;li<=12;li++){
    var f=li/12, lx=W/2-260+f*520, ly=140-Math.sin(f*Math.PI)*26;
    var blink=0.5+0.5*Math.sin(t*4+li*1.4);
    circle2(g,lx,ly,5+3*blink,['#ffd24d','#ff9eb5','#7ab8f5','#8fd48a'][li%4]);
  }
  for(var li2=0;li2<=10;li2++){
    var f2=li2/10, lx2=W/2-210+f2*420, ly2=150+Math.sin(f2*Math.PI)*34;
    var blink2=0.5+0.5*Math.sin(t*5+li2*1.7);
    circle2(g,lx2,ly2,4+3*blink2,['#7ab8f5','#ffd24d','#ff9eb5'][li2%3]);
  }
  // Podium
  g.fillStyle='#c49a6c'; g.beginPath(); g.ellipse(W/2,H*0.72,300,44,0,0,Math.PI*2); g.fill();
  g.fillStyle='#a87f52'; g.beginPath(); g.ellipse(W/2,H*0.72+10,300,30,0,0,Math.PI*2); g.fill();
  // Mittelmast
  g.fillStyle='#8a6aa0'; g.fillRect(W/2-8,140,16,H*0.72-140);
  // Pferd kreist um den Mast (Bär sitzt drauf) — Ellipse mit Auf-und-Ab
  var ang=k.ang;
  var rr=190, ex=W/2+Math.cos(ang)*rr, ey=H*0.72-Math.abs(Math.sin(ang))*50-Math.max(0,Math.sin(ang))*26;
  var depth=0.85+0.3*((Math.sin(ang)+1)/2); // vorne größer
  // weitere Pferde als Deko (hinten)
  [ang+2.1, ang+4.2].forEach(function(a2,di){
    var dx2=W/2+Math.cos(a2)*rr, dy2=H*0.72-Math.abs(Math.sin(a2))*50;
    var d2=0.7+0.25*((Math.sin(a2)+1)/2);
    g.save(); g.globalAlpha=0.85;
    g.strokeStyle='#9aa4ae'; g.lineWidth=4;
    g.beginPath(); g.moveTo(dx2,dy2-120*d2); g.lineTo(dx2,dy2+30); g.stroke();
    drawPferd(g,dx2,dy2,d2*0.8,['#c39bd3','#8fd48a'][di]);
    g.restore();
  });
  // Hauptpferd: Stange + Pferd + Bär
  g.strokeStyle='#9aa4ae'; g.lineWidth=4.5;
  g.beginPath(); g.moveTo(ex,ey-150*depth); g.lineTo(ex,ey+40); g.stroke();
  drawPferd(g,ex,ey,depth,['#ff9eb5','#7ab8f5','#ffd24d'][k.pferd]);
  // Bär reitet klein auf dem Pferd
  g.save();
  g.translate(ex,ey-70*depth); g.scale(0.34*depth,0.34*depth); g.translate(-W/2,-300);
  Art.drawBear(g,S.baer,{w:W,h:H, spaTarget:S.spaTarget});
  g.restore();
  // Musiknoten schweben beim schnellen Dreh
  if(k.w>1){
    if(!k.noten) k.noten=[];
    if(Math.random()<0.3) k.noten.push({x:W/2+(Math.random()-0.5)*300, y:H*0.72, t:0, wob:Math.random()*6});
    for(var ni=k.noten.length-1;ni>=0;ni--){
      var no=k.noten[ni]; no.t+=0.016;
      no.y-=2.4; no.x+=Math.sin(t*3+no.wob)*2;
      var na=Math.max(0,1-no.t/1.6);
      if(na<=0){ k.noten.splice(ni,1); continue; }
      g.globalAlpha=na; g.font='26px sans-serif'; g.textAlign='center';
      g.fillStyle=['#7a4b8f','#e91e63','#3498db'][ni%3];
      g.fillText(NICONS[ni%4], no.x, no.y);
    }
    g.globalAlpha=1;
  } else if(k.noten) k.noten.length=0;
}
function drawPferd(g,x,y,d,c){
  g.save(); g.translate(x,y); g.scale(d,d);
  g.fillStyle=c; g.strokeStyle=Art.shade(c,-40); g.lineWidth=3;
  g.beginPath(); g.ellipse(0,0,66,30,0,0,Math.PI*2); g.fill(); g.stroke(); // Körper
  g.beginPath(); g.ellipse(46,-22,22,16,-0.5,0,Math.PI*2); g.fill(); g.stroke(); // Kopf
  circle2(g,52,-26,3.5,'#2b2b2b');
  g.fillStyle=Art.shade(c,-40);
  [[-38,26],[-24,30],[24,30],[38,26]].forEach(function(p){
    g.fillRect(p[0]-5,p[1],10,26); // Beine
  });
  g.beginPath(); g.moveTo(-64,-4); g.quadraticCurveTo(-88,-18,-92,4); g.quadraticCurveTo(-86,10,-64,10); g.fill(); // Schweif
  g.fillStyle='#fff'; g.beginPath(); g.ellipse(-10,-8,26,20,0,0,Math.PI*2); g.fill(); // Sattel
  g.restore();
}
// ---- Runde 9: Malbuch (Umriss-Bär, antippbare Flächen, Rahmen) -------------
var MB_PARTS = ['kopf','koerper','ohrL','ohrR','schnauze','pfoteVL','pfoteVR','pfoteHL','pfoteHR'];
function drawMalbuch(g){
  if(!S.mb) S.mb={parts:{},rahmen:0};
  var rx=230, ry=104, rw=440, rh=320;
  // Papier + Deko-Raum
  g.fillStyle='rgba(0,0,0,0.06)'; g.fillRect(rx+8,ry+10,rw,rh); // Schatten
  g.fillStyle='#fdf9f2'; g.fillRect(rx,ry,rw,rh);
  g.strokeStyle='#d9c8ac'; g.lineWidth=2; g.strokeRect(rx,ry,rw,rh);
  S._mbHit=[]; S._mbFrame={x:rx-26,y:ry-26,w:rw+52,h:rh+52};
  // Bär in der Mitte des Papiers, Scale auf virtuelles 450x330
  var sc=1.05;
  g.save();
  g.translate(rx+rw/2, ry+rh/2-152); // Zentrum: virtuelle 225,40 Ziel = rx+rw/2, ry+~40*sc
  g.scale(sc,sc);
  g.translate(-225,-40);
  drawMalBaer(g);
  g.restore();
  // Welt-Hit-Boxes speichern (für tapBear)
  for(var pi=0;pi<(S._mbHitLocal||[]).length;pi++){
    var hb=S._mbHitLocal[pi];
    S._mbHit.push({key:hb.key, x:rx+rw/2+(hb.x-225)*sc, y:ry+rh/2-152+(hb.y-40)*sc, r:hb.r*sc});
  }
  // Rahmen-Deko wenn gewählt
  if(S.mb.rahmen>0) drawMalRahmen(g, rx,ry,rw,rh, S.mb.rahmen);
  // Farbkleckse am Rand (Effekt)
  var t9=performance.now()/1000;
  var kl=["#e91e63","#f4c20d","#3498db","#2ecc71","#9b59b6","#e0892f"];
  for(var k9=0;k9<8;k9++){
    var kx9=rx-30+(k9%2)*(rw+60), ky9=ry+22+k9%4*96+((k9*37)%14);
    circle2(g,kx9,ky9,7+k9%3*4, kl[k9%6]);
    circle2(g,kx9+((k9%2)?-1:1)*12, ky9+16, 3.5, kl[(k9+2)%6]);
  }
  for(var k10=0;k10<4;k10++){ // langsam schwebende Kringel ums Papier
    var a10=t9*0.7+k10*1.6;
    circle2(g, rx+rw/2+Math.cos(a10)*(rw/2+44), ry+rh/2+Math.sin(a10)*(rh/2+40), 3.5, kl[k10+1]);
  }
  // Toast
  if(S.toast && S.toast.t>0){
    var ta=Math.min(1,S.toast.t/0.4);
    g.globalAlpha=ta;
    g.fillStyle='rgba(255,255,255,0.96)';
    g.beginPath(); g.roundRect?g.roundRect(S.VW/2-160,54,320,56,26):g.rect(S.VW/2-160,54,320,56);
    g.fill(); g.strokeStyle='#7a4b8f'; g.lineWidth=3; g.stroke();
    g.fillStyle='#7a4b8f'; g.font='bold 24px sans-serif'; g.textAlign='center';
    g.fillText(S.toast.txt, S.VW/2, 90);
    g.globalAlpha=1;
  }
}
function drawMalBaer(g){
  // Umriss-Bär auf virtueller 450x330-Fläche (gleiche Anatomie wie drawBear, vereinfacht)
  var s=1;
  var cx=225, cy=190; // virtueller Mittelpunkt
  S._mbHitLocal=[];
  function fillOr(key, drawFn, hx, hy, hr){
    var col=S.mb.parts[key];
    drawFn(col||'#ffffff');
    g.strokeStyle='#5a4637'; g.lineWidth=3.5;
    drawFn(null, true); // nur Outline
    S._mbHitLocal.push({key:key, x:hx||cx, y:hy||cy, r:hr||50});
  }
  // Hinterpfoten (Füße)
  fillOr('pfoteHL', function(c,outline){ g.fillStyle=c; g.strokeStyle='#5a4637';
    g.beginPath(); g.ellipse(cx-55,cy+165,52,34,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); }, cx-55, cy+165, 52);
  fillOr('pfoteHR', function(c,outline){ g.fillStyle=c; g.strokeStyle='#5a4637';
    g.beginPath(); g.ellipse(cx+55,cy+165,52,34,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); }, cx+55, cy+165, 52);
  // Vorderpfoten (Arme)
  fillOr('pfoteVL', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.ellipse(cx-105,cy+40,38,70,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); }, cx-105, cy+40, 44);
  fillOr('pfoteVR', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.ellipse(cx+105,cy+40,38,70,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); }, cx+105, cy+40, 44);
  // Körper
  fillOr('koerper', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.ellipse(cx,cy+70,120,110,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); }, cx, cy+70, 110);
  // Ohren
  fillOr('ohrL', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.arc(cx-62,cy-160,26,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); }, cx-62, cy-160, 28);
  fillOr('ohrR', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.arc(cx+62,cy-160,26,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); }, cx+62, cy-160, 28);
  // Innenohren immer zartrosa
  circle2(g,cx-62,cy-160,13,'#ff9ec4'); circle2(g,cx+62,cy-160,13,'#ff9ec4');
  // Kopf
  fillOr('kopf', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.arc(cx,cy-90,88,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); }, cx, cy-90, 88);
  // Schnauze
  fillOr('schnauze', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.ellipse(cx,cy-62,36,26,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); }, cx, cy-62, 34);
  // Gesichtslinien (Augen, Nase, Mund) immer dunkel
  g.fillStyle='#26221f';
  circle2(g,cx-30,cy-105,9,'#26221f'); circle2(g,cx+30,cy-105,9,'#26221f');
  circle2(g,cx-27,cy-108,3,'#fff'); circle2(g,cx+33,cy-108,3,'#fff');
  g.fillStyle='#4a3227';
  g.beginPath(); g.ellipse(cx,cy-72,12,9,0,0,Math.PI*2); g.fill();
  g.strokeStyle='#4a3227'; g.lineWidth=3; g.lineCap='round';
  g.beginPath(); g.moveTo(cx,cy-63); g.lineTo(cx,cy-54);
  g.quadraticCurveTo(cx-12,cy-44,cx-22,cy-50);
  g.moveTo(cx,cy-54); g.quadraticCurveTo(cx+12,cy-44,cx+22,cy-50); g.stroke();
}
function drawMalRahmen(g,rx,ry,rw,rh,style){
  var t=performance.now()/1000;
  g.save();
  if(style===1){ // Sterne
    g.strokeStyle='#f5c542'; g.lineWidth=10;
    g.strokeRect(rx-26,ry-26,rw+52,rh+52);
    for(var i=0;i<12;i++){
      var px=rx-26+(i%6)*((rw+52)/5)-5, py=(i<6? ry-26 : ry+rh+26);
      Art.drawSticker(g,'stern',px,py,13+2*Math.sin(t*3+i),'#ffd24d');
    }
  } else if(style===2){ // Blumen
    g.strokeStyle='#e89ab8'; g.lineWidth=8;
    g.strokeRect(rx-22,ry-22,rw+44,rh+44);
    for(var j=0;j<16;j++){
      var fa=j/16*Math.PI*2;
      var cxm=rx+rw/2+Math.cos(fa)*(rw/2+30), cym=ry+rh/2+Math.sin(fa)*(rh/2+30);
      Art.drawSticker(g,'blume',cxm,cym,11+2*Math.sin(t*2.4+j), j%2?'#ff9ec4':'#fff');
    }
  } else { // Regenbogen
    var cols=['#ff7a7a','#ffbe60','#ffe86e','#8fd48a','#7ab8f5','#c39bd3'];
    for(var r2=0;r2<cols.length;r2++){
      g.strokeStyle=cols[r2]; g.lineWidth=5; g.globalAlpha=0.9;
      g.strokeRect(rx-12-r2*6, ry-12-r2*6, rw+24+r2*12, rh+24+r2*12);
    }
    g.globalAlpha=1;
  }
  g.restore();
}
// ---- Runde 9: Aquarium ------------------------------------------------------
// r19: Der Bär steht NEBEN (quer) bzw. UNTER (hoch) dem Becken und schaut hinein — Fische, Futter, Blasen und Deko
// bleiben sichtbar. Fische schwimmen nur im freien Teil des Beckens (fr). Kamera-Ausschnitt: S.aquaFocus (game.js).
var FISCH_K=1.35, FUTTER_R=5; // r19: Fische ×1.35, Futterkorn 4 → 5
function aquaLayout(){
  var L=window.BSUI && window.BSUI.L, port=L ? L.port!==false : true, o;
  if(port) o={port:true, bx0:140, by0:30, bw:620, bh:350, bear:{cx:450, cy:625, s:1.05}, deko:0.2, focus:[120,-35,780,860]};
  else o={port:false, bx0:-30, by0:60, bw:720, bh:430, bear:{cx:855, cy:392, s:1.0}, deko:0.3, focus:[-60,-10,1085,625]};
  var fr={x0:o.bx0+26, x1:o.bx0+o.bw-26, y0:o.by0+24, y1:o.by0+o.bh-40};
  if(!port) fr.x1=Math.min(fr.x1, o.bear.cx-150*o.bear.s-30); // quer: nicht hinter den Bären schwimmen
  o.fr=fr; o.canX=(fr.x0+fr.x1)/2; return o;
}
S.aquaFocus=function(){ return aquaLayout().focus; };
// Blickziel für den Bären: Futter, sonst abwechselnd ein Fisch
S.aquaBlick=function(){
  var aq=S.aqua; if(!aq || !aq.fisch) return null;
  if(aq.futter.length) { var f=aq.futter[0]; return [f.x,f.y]; }
  var fi=aq.fisch[Math.floor(performance.now()/2600)%aq.fisch.length]; return fi?[fi.x,fi.y]:null;
};
function aquaInit(aq,fr){
  if(aq.fisch) return;
  aq.fisch=[];
  for(var i=0;i<6;i++){
    aq.fisch.push({
      x:fr.x0+Math.random()*(fr.x1-fr.x0), y:fr.y0+Math.random()*(fr.y1-fr.y0),
      vx:(Math.random()<0.5?-1:1)*(26+Math.random()*30),
      vy:(Math.random()-0.5)*18,
      c:AQUA_FARBEN[i%6], ph:Math.random()*6, s:(0.75+Math.random()*0.5)*FISCH_K,
      ziel:null
    });
  }
}
function drawAquarium(g){
  var aq=S.aqua; if(!aq) return;
  var A=aquaLayout(), fr=A.fr;
  aquaInit(aq,fr);
  aq._futterR=FUTTER_R;
  var t=performance.now()/1000;
  var W=S.VW,H=S.VH;
  // Becken: Wasser-Gradient + Sand + Glas-Rand
  var bx0=A.bx0, by0=A.by0, bw=A.bw, bh=A.bh;
  var grd=g.createLinearGradient(0,by0,0,by0+bh);
  grd.addColorStop(0,'#9fdcf5'); grd.addColorStop(0.7,'#3f9fd8'); grd.addColorStop(1,'#1a6fae');
  g.fillStyle=grd; g.fillRect(bx0,by0,bw,bh);
  g.fillStyle='#e8d9ac'; g.fillRect(bx0,by0+bh-26,bw,26); // Sand
  for(var sd=0;sd<Math.floor(bw/46);sd++){ circle2(g,bx0+20+sd*46,by0+bh-10-((sd*29)%10),3,'#d9c48c'); }
  g.strokeStyle='rgba(255,255,255,0.75)'; g.lineWidth=4; g.strokeRect(bx0,by0,bw,bh);
  g.strokeStyle='rgba(60,120,160,0.35)'; g.lineWidth=1;
  for(var wl=0;wl<4;wl++){ // Wellen-Linien
    g.beginPath();
    for(var wxl=0;wxl<=20;wxl++) g.lineTo(bx0+wxl*(bw/20), by0+18+wl*bh*0.1+Math.sin(t*2+wxl*0.8+wl)*4);
    g.stroke();
  }
  // Deko (im freien Teil des Beckens)
  var dx=bx0+bw*A.deko;
  if(aq.deko===1){ drawSchiff(g, dx, by0+bh-64, 1); aq._dekoBox=[dx-50,by0+bh-64-54,100,78]; }
  else if(aq.deko===2){ drawSchatz(g, dx, by0+bh-58, 1, t); aq._dekoBox=[dx-34,by0+bh-58-42,68,60]; }
  else aq._dekoBox=null;
  // Futter-Körner: sinken, wabern
  for(var fi=aq.futter.length-1;fi>=0;fi--){
    var fd=aq.futter[fi];
    if(fd.y<by0+6) fd.y=by0+6; // r19: Körner starten an der Dose über dem freien Wasser
    fd.y+=fd.vy*0.016; fd.vy=Math.min(fd.vy+8*0.016, 46);
    fd.x+=Math.sin(t*3+fd.ph)*0.6;
    circle2(g,fd.x,fd.y,FUTTER_R,'#8a5a2a');
    circle2(g,fd.x-1.2,fd.y-1.2,FUTTER_R*0.45,'#c99a4f');
    if(fd.y>by0+bh-30) aq.futter.splice(fi,1);
  }
  // Fische: idle schwimmen; Futter = schwimmen heran und schnappen
  aq.fisch.forEach(function(f){
    var naechstes=null, nd=1e9;
    for(var fx=0;fx<aq.futter.length;fx++){
      var fk=aq.futter[fx];
      var d2=(fk.x-f.x)*(fk.x-f.x)+(fk.y-f.y)*(fk.y-f.y);
      if(d2<nd){ nd=d2; naechstes=fk; }
    }
    if(naechstes){
      var dx=naechstes.x-f.x, dy=naechstes.y-f.y, dd=Math.sqrt(nd)||1;
      f.vx+=(dx/dd)*90*0.016; f.vy+=(dy/dd)*90*0.016;
      if(dd<16*f.s/FISCH_K+4){ // schnappen!
        var idx=aq.futter.indexOf(naechstes); aq.futter.splice(idx,1);
        for(var bp=0;bp<5;bp++) aq.blasen.push({x:f.x+(Math.random()-0.5)*10,y:f.y-8,t:0,v:-60-Math.random()*30});
        window.BSGame && window.BSGame.spaTupfer && window.BSGame.spaTupfer(f.x,f.y);
        if(t-(aq._freuT||0)>0.9){ aq._freuT=t; react('happy',0.5); } // r19: Bär freut sich mit
      }
    } else {
      // sanfte Idle-Wanderung
      f.vx+=(Math.random()-0.5)*18*0.016;
      f.vy+=(Math.random()-0.5)*12*0.016;
    }
    var vmax=70, vmag=Math.hypot(f.vx,f.vy)||1;
    if(vmag>vmax){ f.vx*=vmax/vmag; f.vy*=vmax/vmag; }
    f.x+=f.vx*0.016*3.4; f.y+=f.vy*0.016*3.4;
    if(f.x<fr.x0){ f.x=fr.x0; f.vx=Math.abs(f.vx); }
    if(f.x>fr.x1){ f.x=fr.x1; f.vx=-Math.abs(f.vx); }
    if(f.y<fr.y0){ f.y=fr.y0; f.vy=Math.abs(f.vy)*0.6; }
    if(f.y>fr.y1){ f.y=fr.y1; f.vy=-Math.abs(f.vy)*0.6; }
    drawFisch(g, f.x, f.y, f.s, f.c, f.vx<0, t+f.ph);
    if(Math.random()<0.006) aq.blasen.push({x:f.x,y:f.y-8,t:0,v:-40-Math.random()*25});
  });
  // Blasen: steigen auf
  for(var bi=aq.blasen.length-1;bi>=0;bi--){
    var bl=aq.blasen[bi];
    bl.t+=0.016; bl.y+=bl.v*0.016; bl.x+=Math.sin(bl.t*7)*0.8;
    g.globalAlpha=Math.max(0,0.8-bl.t*0.4);
    g.strokeStyle='rgba(255,255,255,0.9)'; g.lineWidth=1.6;
    g.beginPath(); g.arc(bl.x,bl.y,3+bl.t*2,0,Math.PI*2); g.stroke();
    if(bl.y<by0+6 || bl.t>2.2) aq.blasen.splice(bi,1);
  }
  g.globalAlpha=1;
  // Futter-Dose über dem freien Wasser, kippt beim Füttern
  if(aq.fuetter>0) aq.fuetter=Math.max(0,aq.fuetter-0.016);
  var cx=A.canX, tilt=Math.sin(Math.min(1,aq.fuetter/1.2)*Math.PI)*0.5;
  g.save(); g.translate(cx,by0-26); g.rotate(tilt);
  g.fillStyle='#c0392b'; g.fillRect(-26,-20,52,40);
  g.fillStyle='#e74c3c'; g.fillRect(-30,-26,60,10);
  g.fillStyle='#fff'; g.font='11px sans-serif'; g.textAlign='center';
  g.fillText('Futter',0,2);
  g.restore();
  // Bär steht am Becken und schaut hinein
  Art.drawBear(g,S.baer,{w:W,h:H, spaTarget:S.spaTarget, cx:A.bear.cx, cy:A.bear.cy, s:A.bear.s});
  drawStickers(g);
}
function drawFisch(g,x,y,sc,c,flip,t){
  g.save(); g.translate(x,y); g.scale(flip?-sc:sc, sc);
  g.fillStyle=c;
  g.beginPath(); g.ellipse(0,0,16,9,0,0,Math.PI*2); g.fill();
  // Schwanz
  g.beginPath(); g.moveTo(-14,0); g.lineTo(-26,-8+Math.sin(t*7)*4); g.lineTo(-26,8+Math.sin(t*7)*4); g.closePath(); g.fillStyle=Art.shade(c,-25); g.fill();
  // Streifen
  g.strokeStyle='rgba(255,255,255,0.6)'; g.lineWidth=2;
  g.beginPath(); g.moveTo(-4,-7); g.lineTo(-4,7); g.stroke();
  g.beginPath(); g.moveTo(4,-7); g.lineTo(4,7); g.stroke();
  // Glanz + Auge
  g.fillStyle='rgba(255,255,255,0.55)';
  g.beginPath(); g.ellipse(2,-4,6,2.6,-0.3,0,Math.PI*2); g.fill();
  circle2(g,9,-2,2.6,'#2b2b3a'); circle2(g,10,-3,1,'#fff');
  g.restore();
}
function drawSchiff(g,x,y,sc){
  g.save(); g.translate(x,y); g.scale(sc,sc);
  g.fillStyle='#8a5a2a'; g.strokeStyle='#5a3a1a'; g.lineWidth=2;
  g.beginPath(); g.moveTo(-50,0); g.lineTo(50,0); g.lineTo(34,24); g.lineTo(-34,24); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#a8723a'; g.fillRect(-4,-46,8,46); // Mast
  g.fillStyle='#f7f2e8';
  g.beginPath(); g.moveTo(4,-42); g.lineTo(38,-42); g.lineTo(4,-8); g.closePath(); g.fill(); // Segel
  g.fillStyle='#e74c3c'; g.fillRect(-4,-54,22,10); // Fähnchen
  g.restore();
}
function drawSchatz(g,x,y,sc,t){
  g.save(); g.translate(x,y); g.scale(sc,sc);
  g.fillStyle='#7a4b22'; g.strokeStyle='#4a2c10'; g.lineWidth=2.5;
  g.beginPath(); g.rect(-34,-8,68,26); g.fill(); g.stroke();
  g.beginPath(); g.arc(0,-8,34,Math.PI,0); g.fillStyle='#8a5a2a'; g.fill(); g.stroke();
  g.fillStyle='#f5c542'; g.fillRect(-4,-14,8,20); // Schloss
  // Gold-Funkeln
  for(var i=0;i<3;i++) Art.drawSticker(g,'stern',-22+i*22,-20-((i*13)%8),5+2*Math.sin(t*4+i),'#ffd24d');
  g.restore();
}
})();
