// salon.js — Stationen als State-Machine + Buttons (DOM-frei, alles auf Canvas)
(function(){
'use strict';
var Art = window.BSArt;

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
  {id:'karussell', icon:'🎠', name:'Karussell'},
  {id:'geburtstag',icon:'🎂', name:'Geburtstag'},
  {id:'disco',     icon:'🪩', name:'Disco'},
  {id:'foto',      icon:'📸', name:'Foto'},
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

S.buildUI = function(){
  buttons.length = 0;
  var st = S.state;
  if(st==='menu'){
    var ri=Math.floor(Math.random()*Art.MODELS.length);
    S.menuBaer = Object.assign(neuerBaer(ri), {breath:0});
  } else if(st!=='wahl'){ S.flash=0; }
  if(S._prev==='waschen' && st!=='waschen'){ S.baer.schaum=0; S.baer.tropfen=[]; S.dusche=false; }
  if(S._prev==='foehnen' && st!=='foehnen'){ S.foehn=false; }
  S._prev = st;
  if(st==='menu'){
    if(S.saved && S.saved.fell){
      btn(230,458,440,64,'🧸 Weiter mit meinem Bären',function(){ S.state='waschen'; S.buildUI(); },{big:1});
      btn(230,534,440,64,'🌟 Bär wählen',function(){ S.state='wahl'; S.buildUI(); },{big:1});
    } else {
      btn(230,500,440,70,'▶️ Start',function(){ S.state='wahl'; S.buildUI(); },{big:1});
    }
    return;
  }
  if(st==='wahl'){
    btn(16,16,120,56,'⬅️ Start',function(){ S.state='menu'; S.buildUI(); });
    // Kacheln (5 Spalten, dynamisch), Hit-Test in tapBear
    return;
  }
  if(st==='finish-done'){
    btn(150,518,280,62,'🐻 Bär wählen',function(){ S.state='wahl'; S.buildUI(); },{big:1});
    btn(470,518,280,62,'🔄 Von vorne',function(){ S.baer=neuerBaer(S.baer.fellIdx); S.state='waschen'; S.buildUI(); },{big:1});
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
  else if(st==='karussell') buildKarussell();
  else if(st==='geburtstag') buildGeburtstag();
  else if(st==='disco') buildDisco();
  else if(st==='foto') buildFoto();
  else if(st==='finish') buildFinish();
};

function backButtons(){
  btn(16,16,120,56,'⬅️ Start',function(){ S.state='menu'; S.buildUI(); });
  var i = S.STATIONS.map(function(s){return s.id;}).indexOf(S.state);
  if(i>=0 && i < S.STATIONS.length-1){
    btn(S.VW-150,16,134,56,'Weiter ➡️',function(){
      S.state = S.STATIONS[i+1].id; S.buildUI(); S.save();
    });
  }
}

function stationTabs(){
  // Reihen à 9 Tabs (18 Stationen), 2 Reihen — kompakt
  for(var j=0;j<S.STATIONS.length;j++){
    (function(st,j){
      btn(6+(j%9)*99, S.VH-118+Math.floor(j/9)*56, 94, 52, st.icon+' '+st.name, function(){
        S.state = st.id; S.buildUI();
      }, {active:function(){ return S.state===st.id; }, small:1, tiny:1});
    })(S.STATIONS[j],j);
  }
}
// ---- Stations-Builder --------------------------------------
function buildWaschen(){
  stationTabs();
  S.hinweis = 'Seife antippen, dann Schaum rubbeln! 🧼';
  btn(30,110,150,64,'🧼 Seife',function(){ S.baer.schaum=Math.min(1,S.baer.schaum+0.5); },{active:function(){return S.baer.schaum>0.2;}});
  btn(30,186,150,64,'🚿 Dusche',function(){ S.dusche=true; },{active:function(){return !!S.dusche;}});
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
    btn(30+(i%2)*130, 100+Math.floor(i/2)*62, 122, 56, FRISUR_NAMEN[f], function(){
      S.baer.frisur=f; S.save(); S.buildUI();
    },{active:function(){return S.baer.frisur===f;},small:1});
  });
  Art.HAAR.forEach(function(c,i){
    btn(30+(i%4)*62, 310+Math.floor(i/4)*62, 56, 56, '', function(){
      S.baer.haar=c; S.save(); S.buildUI();
    },{fill:c,active:function(){return S.baer.haar===c;}});
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
    },{active:function(){return S.baer.duft===i;}});
    // kleiner Flakon unter dem Knopf
    btn(80+(i%2)*170, 162+Math.floor(i/2)*130, 30, 46, '', function(){
      S.baer.duft=i; S.save(); S.buildUI();
      window.BSGame && window.BSGame.parfumSpray(Art.DUFTE[i].c);
    },{fill:d.c,tiny:1});
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
      mk.rouge=c; S.save(); S.buildUI();
    },{fill:c,active:function(){return mk.rouge===c;}});
  });
  // Lidschatten
  Art.LIDSCHATTEN.forEach(function(c,i){
    btn(30+i*52, 156, 46, 46, '', function(){
      mk.lid=c; S.save(); S.buildUI();
    },{fill:c,active:function(){return mk.lid===c;}});
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
      if(cur===null||cur===undefined) S.baer.acc[a.key]=0;
      else S.baer.acc[a.key]=null;
      S.save(); S.buildUI();
    },{active:function(){return on;}});
    if(on){
      a.colors.forEach(function(c,k){
        btn(30+(i%2)*150+k*46, 166+Math.floor(i/2)*130, 40, 40, '', function(){
          S.baer.acc[a.key]=k; S.save(); S.buildUI();
        },{fill:c,active:function(){return S.baer.acc[a.key]===k;},tiny:1});
      });
    }
  });
}
function buildFinish(){
  S.hinweis = 'Perfekt! ✨';
  btn(330,470,240,70,'🎉 Fertig!',function(){
    S.state='finish-done'; S.baer.bowTarget=1; S.confetti=220; S.stars=120; S.glitzerRing=1; S.badge=1; S.rainbow=1;
    startFeuerwerk();
    S.save(); S.buildUI();
  },{big:1});
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

// ---- Zeichnen ----------------------------------------------
S.draw = function(g){
  var W=S.VW,H=S.VH;
  var grad=g.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#ffe6f2'); grad.addColorStop(0.65,'#fff3e0'); grad.addColorStop(0.65,'#d9b38c'); grad.addColorStop(1,'#c49a6c');
  g.fillStyle=grad; g.fillRect(0,0,W,H);
  drawDeko(g);

  if(S.state==='menu'){ drawSchmetterlinge(g); drawMenu(g); return; }
  if(S.state==='wahl'){ drawSchmetterlinge(g); drawWahl(g); return; }

  if(S.state==='finish-done'){
    g.textAlign='center';
    g.font='bold 54px sans-serif';
    g.lineWidth=8; g.strokeStyle='#fff';
    g.strokeText('Perfekt! ✨', W/2, 72);
    g.fillStyle='#7a4b8f'; g.fillText('Perfekt! ✨', W/2, 72);
    if(S.rainbow) drawRegenbogen(g, W/2, 250, 190);
    // 10/10 Badge mit Sternen-Animation über dem Bär
    if(S.badge){
      var bt=(performance.now()/1000)%10;
      var by=118+Math.sin(bt*2)*4;
      g.save();
      g.translate(W/2,by);
      // Kapsel
      g.beginPath();
      g.roundRect ? g.roundRect(-110,-30,220,60,30) : g.rect(-110,-30,220,60);
      g.fillStyle='rgba(255,215,77,0.95)'; g.fill();
      g.lineWidth=4; g.strokeStyle='#b8860b'; g.stroke();
      g.fillStyle='#7a4b00'; g.font='bold 32px sans-serif';
      g.fillText('10/10 ⭐',0,12);
      // animierte Sterne drumherum
      for(var si=0;si<5;si++){
        var sa=bt*1.3+si*(Math.PI*2/5);
        var sr=95+Math.sin(bt*3+si*2)*14;
        Art.drawSticker(g,'stern',Math.cos(sa)*sr,Math.sin(sa)*sr*0.5,10+Math.sin(bt*4+si)*3,'#ffd24d');
      }
      g.restore();
    }
    g.save();
    g.translate(0,-34);
    S.baer.jubel = Math.min(1,(S.baer.jubel||0)+0); // Wert kommt aus update()
    Art.drawBear(g,S.baer,{w:W,h:H});
    drawStickers(g);
    if(S.baer.duft!==null && S.baer.duft!==undefined) drawDuftWolken(g);
    if(S.glitzerRing) drawGlitzerRing(g);
    drawShootingStar(g);
    g.restore();
    drawFeuerwerk(g);
    drawButtons(g);
    return;
  }

  if(S.state==='finish-done') return; // schon in finish-done gezeichnet
  // Duft-Wolken im Stations-Screen
  if(S.baer && S.baer.duft!==null && S.baer.duft!==undefined && S.state!=='wahl' && S.state!=='menu') drawDuftWolken(g);

  // Sternschnuppe über dem Menü
  if(S.state==='menu') drawShootingStar(g);

  // Massage-Deko (unter Titel)
  if(S.state==='massage') drawHerzen(g);

  g.fillStyle='#7a4b8f'; g.font='bold 26px sans-serif'; g.textAlign='center';
  var st=S.STATIONS.filter(function(x){return x.id===S.state;})[0];
  g.fillText(st? st.icon+' '+st.name : '', W/2, 50);
  if(S.hinweis){
    g.fillStyle='#9c6bb5'; g.font='20px sans-serif';
    g.fillText(S.hinweis, W/2, 82);
  }

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
  } else {
  Art.drawBear(g,S.baer,{w:W,h:H, spaTarget:S.spaTarget});
  drawStickers(g);
  }
  }
  // Zirkus: jonglierende Bälle auf Parabel-Bahnen über den Pfoten
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
  drawButtons(g);
};

// Stations-Deko: kleine prozedurale Details, zurückhaltend
function drawDeko(g){
  var W=S.VW,H=S.VH;
  if(S.state==='wahl') return;
  if(S.state==='schneiden'){ // Spiegel links oben
    g.fillStyle='#d7ecf5'; g.strokeStyle='#b08cc7'; g.lineWidth=5;
    g.beginPath(); g.arc(790,150,72,0,Math.PI*2); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,0.5)';
    g.beginPath(); g.arc(768,128,26,0,Math.PI*2); g.fill();
  }
  if(S.state==='waschen'||S.state==='foehnen'){ // Duschkopf-Deko
    g.fillStyle='#8a97a5';
    g.fillRect(824,40,10,54);
    g.beginPath(); g.arc(829,104,26,0,Math.PI); g.fill();
    g.fillStyle='rgba(120,190,255,0.75)';
    for(var k=-2;k<=2;k++) g.fillRect(829+k*9,108,3,16);
    // Bilderrahmen mit letztem Album-Foto an der Wand
    if(S.album && S.album.length){
      var last=S.album[S.album.length-1];
      var bx=760, by=170, bw=110, bh=118;
      g.fillStyle='#8a5a2a'; g.fillRect(bx-6,by-6,bw+12,bh+12);
      g.fillStyle='#f7ede2'; g.fillRect(bx,by,bw,bh);
      g.strokeStyle='#5a3a1e'; g.lineWidth=2; g.strokeRect(bx,by,bw,bh);
      var mod2=Art.MODELS[last.fellIdx]||Art.MODELS[0];
      var mini2={
        fellIdx:last.fellIdx, fell:mod2.fell, haar:last.haar||Art.HAAR[0], frisur:last.frisur||'lockig',
        lack:{}, schaum:0, tropfen:[], fluff:0, bow:0, breathe:0, blink:0, relax:0,
        gurkeL:false, gurkeR:false, duft:null,
        makeup:{rouge:null,lid:null,gp:[]},
        acc:{hut:null,schleife:null,brille:null,kette:null}, sticker:[]
      };
      g.save(); g.beginPath(); g.rect(bx,by,bw,bh-22); g.clip();
      g.translate(bx+bw/2, by+8); g.scale(0.2,0.2); g.translate(-225,-40);
      Art.drawBear(g, mini2, {w:450,h:330});
      g.restore();
      g.fillStyle='#5d3a75'; g.font='10px sans-serif'; g.textAlign='center';
      g.fillText('⭐ '+last.modell, bx+bw/2, by+bh-6);
    }
  }
  if(S.state==='spa'||S.state==='parfum'||S.state==='pfoten'||S.state==='makeup'||S.state==='massage'){ // Teppich
    g.fillStyle='rgba(154,107,181,0.16)';
    g.beginPath(); g.ellipse(W/2,H-160,250,60,0,0,Math.PI*2); g.fill();
    g.strokeStyle='rgba(122,75,143,0.35)'; g.lineWidth=3;
    g.beginPath(); g.ellipse(W/2,H-160,220,48,0,0,Math.PI*2); g.stroke();
    g.beginPath(); g.ellipse(W/2,H-160,180,35,0,0,Math.PI*2); g.stroke();
  }
  if(S.state==='schmuecken'){ // Regal mit Fläschchen
    g.fillStyle='#c49a6c'; g.fillRect(690,180,180,14);
    var fl=['#e91e63','#9b59b6','#f1c40f'];
    for(var i=0;i<3;i++){
      g.fillStyle=fl[i]; g.fillRect(710+i*50,146,26,34);
      g.fillStyle='#fff'; g.fillRect(716+i*50,138,14,10);
    }
  }
  if(S.state==='eis'){ // Eis-Stand-Deko
    g.fillStyle='#c49a6c'; g.fillRect(690,300,180,16);
    g.fillStyle='#7a4b8f'; g.fillRect(700,316,12,110); g.fillRect(848,316,12,110);
    Art.EIS_FARBEN.forEach(function(c,i){
      g.fillStyle=c; g.beginPath(); g.arc(720+i*30,288,13,0,Math.PI*2); g.fill();
    });
    g.fillStyle='#d9a94f';
    g.beginPath(); g.moveTo(800,296); g.lineTo(830,296); g.lineTo(815,340); g.closePath(); g.fill();
  }
  if(S.state==='foto'){ // Foto-Studio: Scheinwerfer
    g.fillStyle='#2b2b2b'; g.fillRect(60,60,10,90); g.fillRect(830,60,10,90);
    g.save();
    [['#fff0b3',65,58,-0.5],['#fff0b3',835,58,0.5]].forEach(function(d){
      g.fillStyle=d[0];
      g.beginPath(); g.arc(d[1],d[2],20,0,Math.PI*2); g.fill();
      g.globalAlpha=0.12;
      g.beginPath(); g.moveTo(d[1],d[2]);
      g.lineTo(d[1]+(d[3]>0?-160:160)+d[3]*200, 400); g.lineTo(d[1]+d[3]*280, 430);
      g.closePath(); g.fill(); g.globalAlpha=1;
    });
    g.restore();
  }
}
function drawMenu(g){
  var W=S.VW,H=S.VH;
  var grad=g.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#ffe6f2'); grad.addColorStop(1,'#e8d5f5');
  g.fillStyle=grad; g.fillRect(0,0,W,H);
  for(var i=0;i<14;i++){
    var x=(i*167)%W, y=40+((i*97)%520);
    Art.drawSticker(g,'stern',x,y,8+(i%3)*4,'rgba(255,210,77,0.45)');
  }
  g.textAlign='center';
  g.fillStyle='#7a4b8f'; g.font='bold 52px sans-serif';
  g.fillText('🧸 Bären-Beautysalon', W/2, 64);
  g.fillStyle='#9c6bb5'; g.font='24px sans-serif';
  g.fillText('Mach den Bären ganz hübsch!', W/2, 106);
  g.fillStyle='#8a6aa0'; g.font='14px sans-serif';
  g.fillText('🧸 Bären-Beautysalon v'+window.BS_VER, W/2, H-14);
  g.save();
  g.translate(0, H*0.10);
  Art.drawBear(g,S.menuBaer||S.baer,{w:W,h:H*0.66});
  g.restore();
  drawButtons(g);
}

// ---- Bären-Auswahl: Raster dynamisch aus MODELS -------
function kacheln(){
  var n=Art.MODELS.length, cols=5, rows=Math.ceil(n/cols);
  var pitchX=150, w=136, pitchY=94, h=84;
  var x0=(S.VW-(cols*pitchX-14))/2, y0=118;
  var out=[];
  for(var i=0;i<n;i++){
    out.push({i:i, x:x0+(i%cols)*pitchX, y:y0+Math.floor(i/cols)*pitchY, w:w, h:h});
  }
  return out;
}
// Kontrast-Hintergrund für helle Kacheln: Modell-Kontur aufhellen (sonst hellblau)
function shadeK(hex){
  var n=parseInt(hex.slice(1),16);
  var r=Math.min(255,((n>>16)&255)+70), gn=Math.min(255,((n>>8)&255)+70), bl=Math.min(255,(n&255)+70);
  return 'rgba('+r+','+gn+','+bl+',0.35)';
}

function drawWahl(g){
  var W=S.VW,H=S.VH;
  var grad=g.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#e8f4ff'); grad.addColorStop(1,'#f5e6ff');
  g.fillStyle=grad; g.fillRect(0,0,W,H);
  for(var i=0;i<10;i++){
    Art.drawSticker(g,'stern',(i*211)%W, 30+((i*131)%540), 7+(i%3)*3, 'rgba(154,107,181,0.25)');
  }
  g.textAlign='center';
  g.fillStyle='#7a4b8f'; g.font='bold 44px sans-serif';
  g.fillText('Wähle deinen Bären! 🐻', W/2, 70);
  g.fillStyle='#9c6bb5'; g.font='20px sans-serif';
  g.fillText('Antippen und los geht’s!', W/2, 104);
  kacheln().forEach(function(k){
    var m=Art.MODELS[k.i];
    var act = S.baer.fellIdx===k.i;
    g.save();
    g.beginPath();
    g.roundRect ? g.roundRect(k.x,k.y,k.w,k.h,16) : g.rect(k.x,k.y,k.w,k.h);
    // helle Bären: Kontrast-Hintergrund abhängig von Fellhelligkeit
    g.fillStyle = act?'#fbeaff':'rgba(255,255,255,0.94)';
    if(!act){
      var nhex=parseInt(m.fell.slice(1),16);
      var lum=((nhex>>16)&255)*0.3+((nhex>>8)&255)*0.59+(nhex&255)*0.11;
      if(m.hell||lum>190) g.fillStyle = m.kontur ? shadeK(m.kontur) : '#d8ecff';
    }
    g.fill();
    g.lineWidth = act?5:2; g.strokeStyle = act?'#7a4b8f':'#c9aede';
    g.stroke();
    // Mini-Bär (auf Kachel skaliert)
    var mini = Object.assign({}, S.baer, {fellIdx:k.i, fell:m.fell, schaum:0, tropfen:[],
      fluff:0, bow:0, relax:0, blink:0, lack:{}, sticker:[], makeup:{rouge:null,lid:null,gp:[]},
      gurkeL:false, gurkeR:false, duft:null,
      acc:{hut:null,schleife:null,brille:null,kette:null}});
    // Idle-Bounce: aktives Bärchen hüpft leicht (nur im Wahl-Screen)
    var bounceY = act ? -Math.abs(Math.sin(performance.now()/1000*4.2+k.i*1.7))*8 : 0;
    // Überraschungs-Kachel: wackelnde Animation
    if(k.i===Art.MODELS.length-1){
      var wt=performance.now()/1000;
      g.rotate(0); // noop für Klarheit
      bounceY = -Math.abs(Math.sin(wt*5))*6;
      g.translate(0,0);
    }
    g.save();
    g.beginPath(); g.rect(k.x,k.y,k.w,k.h-24); g.clip();
    g.translate(k.x+k.w/2, k.y+2+bounceY); g.scale(0.26,0.26);
    if(k.i===Art.MODELS.length-1) g.rotate(Math.sin(performance.now()/1000*6)*0.12);
    g.translate(-225,-40);
    Art.drawBear(g, mini, {w:450, h:330});
    g.restore();
    g.fillStyle='#5d3a75'; g.font='bold 15px sans-serif';
    g.fillText(m.name, k.x+k.w/2, k.y+k.h-10);
    g.restore();
  });
  drawButtons(g);
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

function drawJonglage(g){
  var z=S.zirkus, bälle=z.bälle, n=bälle.length;
  var t=performance.now()/1000;
  var cx=S.VW*0.5, cy=S.VH*0.36;
  var handL=cx-150, handR=cx+150, handY=S.VH*0.6;
  for(var i=0;i<n;i++){
    // Jeder Ball eine phasenverschobene Parabel zwischen den Pfoten
    var ph=(t*1.4 + i/n)%1; var p=ph<0.5? ph*2 : 2-ph*2;
    var x=handL+(handR-handL)*p;
    var y=cy - Math.sin(p*Math.PI)*(90+ (i%2)*40) - 40*Math.sin(((t*1.4+i/n)%1)*Math.PI*2);
    var b=bälle[i];
    g.fillStyle=b.c; g.beginPath(); g.arc(x,y,17,0,Math.PI*2); g.fill();
    g.strokeStyle='rgba(0,0,0,0.25)'; g.lineWidth=2; g.stroke();
    g.fillStyle='rgba(255,255,255,0.65)';
    g.beginPath(); g.arc(x-5,y-6,5,0,Math.PI*2); g.fill();
  }
  // Pfoten-Stubs als Jonglier-Hände andeuten
  g.fillStyle='rgba(122,75,143,0.5)';
  g.beginPath(); g.arc(handL,handY,13,0,Math.PI*2); g.fill();
  g.beginPath(); g.arc(handR,handY,13,0,Math.PI*2); g.fill();
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
  // Zuletzt gewählter Bär hüpft in drawWahl/drawMenu separat
}
// Finish-Feuerwerk: Raketen steigen + große Bursts + Boden-Fontänen links/rechts
function drawFeuerwerk(g){
  if(!S.fw) return;
  var t=performance.now()/1000;
  S.fw.raketen.forEach(function(f){
    var dt2=t-f.t0;
    if(dt2<0) return;
    if(f.phase===0){ // Rakete steigt
      var p=Math.min(1,dt2/0.9);
      var x=f.x0+(f.x1-f.x0)*p, y=f.y0-f.h*p;
      g.globalAlpha=Math.min(1,dt2*6);
      g.strokeStyle='rgba(255,240,180,0.95)'; g.lineWidth=3.5; g.lineCap='round';
      g.beginPath(); g.moveTo(x,y+30); g.lineTo(x,y); g.stroke();
      g.fillStyle='#fff'; g.beginPath(); g.arc(x,y,4.5,0,Math.PI*2); g.fill();
      g.globalAlpha=1;
      if(p>=1){ f.phase=1; f.t0=t; }
    } else { // Burst: breite Farb-Fontäne, länger sichtbar
      var q=dt2/2.0;
      if(q>1){ f.dead=1; return; }
      for(var i=0;i<f.nP;i++){
        var a=f.ang[i], sp=f.spd[i]*(1-q*0.25);
        var x=f.x1+Math.cos(a)*sp*q*150;
        var y=f.y0-f.h+Math.sin(a)*sp*q*150 + q*q*130;
        g.globalAlpha=Math.max(0,1-q*0.95);
        g.fillStyle=f.cols[i%f.cols.length];
        g.beginPath(); g.arc(x,y,4.6-q*2.2,0,Math.PI*2); g.fill();
      }
      g.globalAlpha=1;
    }
  });
  // Fontänen links+rechts am Boden (2 s lang, Farbfontäne)
  S.fw.fontaenen.forEach(function(ft){
    var dt3=t-ft.t0;
    if(dt3<0) return;
    var q=dt3/2.0;
    if(q>1){ ft.dead=1; return; }
    for(var i=0;i<ft.nP;i++){
      var p2=ft.parts[i];
      var px=ft.x + Math.sin(p2.seed*7+t*3)*6;
      var py=ft.y - p2.vy*q*90 + 180*q*q*0.6;
      var drift=p2.vx*q*40;
      g.globalAlpha=Math.max(0,1-q);
      g.fillStyle=p2.c;
      g.beginPath(); g.arc(px+drift, py, 3.4-q*1.4, 0, Math.PI*2); g.fill();
    }
    g.globalAlpha=1;
  });
  S.fw.raketen=S.fw.raketen.filter(function(f){return !f.dead;});
  S.fw.fontaenen=S.fw.fontaenen.filter(function(f){return !f.dead;});
  if(!S.fw.raketen.length && !S.fw.fontaenen.length) S.fw=null;
}
function startFeuerwerk(){
  var cols=[['#e74c3c','#f4c20d','#3498db'],['#9b59b6','#ff9eb5','#ffd24d'],['#2ecc71','#7ab8f5','#fff'],['#ff8fb3','#8fd48a','#ffd24d']];
  var t0=performance.now()/1000;
  S.fw={raketen:[],fontaenen:[]};
  var n=4+Math.floor(Math.random()*3); // 4-6 Raketen
  for(var k=0;k<n;k++){
    var ang=[], spd=[];
    for(var i=0;i<34;i++){ ang.push(-Math.PI*0.12-Math.random()*Math.PI*0.76); spd.push(0.5+Math.random()*0.9); }
    S.fw.raketen.push({x0:S.VW*(0.22+Math.random()*0.56), y0:S.VH*0.92,
      x1:S.VW*(0.16+k*(0.68/Math.max(1,n-1))+Math.random()*0.06), h:230+Math.random()*90,
      t0:t0+k*0.42, phase:0, nP:34, ang:ang, spd:spd, cols:cols[k%4]});
  }
  // zwei Fontänen: links & rechts am Boden, je 2 s
  [0.06,0.94].forEach(function(fr,fi){
    var ps=[];
    for(var j=0;j<64;j++){
      ps.push({vx:(Math.random()-0.5)*3, vy:1.6+Math.random()*1.5, seed:Math.random(),
        c:cols[(j+fi)%4][j%3]});
    }
    S.fw.fontaenen.push({x:S.VW*fr, y:S.VH-14, t0:t0, parts:ps, nP:64});
  });
}

function drawShootingStar(g){
  // Sternschnuppe: alle ~6 s quer über den oberen Bereich
  var t = performance.now()/1000;
  var cyc = t % 6;
  if(cyc>1) return;
  var p = cyc/1;
  var x = S.VW*0.15 + p*S.VW*0.7;
  var y = 40 + p*60 + Math.sin(p*Math.PI)*10;
  g.globalAlpha = Math.sin(p*Math.PI);
  var grd=g.createLinearGradient(x-40,y-8,x,y);
  grd.addColorStop(0,'rgba(255,255,255,0)'); grd.addColorStop(1,'rgba(255,235,140,0.9)');
  g.strokeStyle=grd; g.lineWidth=2.5; g.lineCap='round';
  g.beginPath(); g.moveTo(x-40,y-8); g.lineTo(x,y); g.stroke();
  Art.drawSticker(g,'stern',x,y,7,'#fff5c8');
  g.globalAlpha=1;
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

function drawGlitzerRing(g){
  // Kreis aus Sternen um den Bären (Finish)
  var t = (performance.now()/1000)%10;
  for(var i=0;i<18;i++){
    var a = i/18*Math.PI*2 + t*0.6;
    var R = 235 + Math.sin(t*3+i)*12;
    var x = S.VW*0.5 + Math.cos(a)*R;
    var y = S.VH*0.55 + Math.sin(a)*R*0.72;
    var sz = 9 + Math.sin(t*5+i*1.7)*4;
    Art.drawSticker(g,'stern',x,y,Math.max(4,sz), i%2?'#ffd24d':'#ff9eb5');
  }
}

function drawStickers(g){
  var s = Math.min(S.VW,S.VH)/420;
  var cy = S.VH*0.58;
  var pos = {L0:[-85,180],L1:[-55,180],L2:[-25,180],R0:[25,180],R1:[55,180],R2:[85,180]};
  S.baer.sticker.forEach(function(st){
    var p = pos[st.ziel]; if(!p) return;
    Art.drawSticker(g, st.typ, S.VW*0.5+p[0]*s, cy+p[1]*s, 10*s, st.farbe);
  });
}

function clawPos(key){
  var s = Math.min(S.VW,S.VH)/420;
  var cy = S.VH*0.58, cx=S.VW*0.5;
  var map = {L:[-55,175],R:[55,175]};
  var side=key[0], i=+key[1];
  var p=map[side];
  return [cx + (p[0]+(i-1)*16)*s, cy+p[1]*s, 14*s];
}
S.tapBear = function(x,y){
  if(S.state==='wahl'){
    var ks=kacheln();
    for(var i=0;i<ks.length;i++){
      var k=ks[i];
      if(x>=k.x&&x<=k.x+k.w&&y>=k.y&&y<=k.y+k.h){
        if(k.i===Art.MODELS.length-1){ // Überraschungs-Kachel: zufälliger Bär 0..23
          var rix=Math.floor(Math.random()*(Art.MODELS.length-1));
          S.baer = neuerBaer(rix); S.save();
          S.state='waschen'; S.buildUI();
          // Konfetti-Puff + Sternchen-Explosion beim Erscheinen
          window.BSGame && window.BSGame.konfettiBurst(S.VW/2, S.VH*0.4);
          window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(S.VW/2, S.VH*0.5);
        } else {
          S.baer = neuerBaer(k.i); S.save();
          S.state='waschen'; S.buildUI();
        }
        return true;
      }
    }
    return false;
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

function drawButtons(g){
  buttons.forEach(function(b){
    var act = b.active && b.active();
    g.save();
    roundRect(g,b.x,b.y,b.w,b.h,14);
    if(b.fill){ g.fillStyle=b.fill; }
    else g.fillStyle = act ? '#7a4b8f' : 'rgba(255,255,255,0.92)';
    g.fill();
    g.lineWidth = act?4:2;
    g.strokeStyle = act ? '#ffd24d' : '#b08cc7';
    g.stroke();
    if(b.label){
      g.fillStyle = act ? '#fff' : '#5d3a75';
      g.font = (b.tiny?'13px sans-serif':b.small?'16px sans-serif':b.big?'bold 24px sans-serif':'19px sans-serif');
      g.textAlign='center'; g.textBaseline='middle';
      g.fillText(b.label, b.x+b.w/2, b.y+b.h/2);
    }
    g.restore();
  });
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
})();
