// salon.js — Stationen als State-Machine + Buttons (DOM-frei, alles auf Canvas)
(function(){
'use strict';
var Art = window.BSArt;

var S = window.BSSalon = {};

// Virtuelle Spielebene 900x600 (wird letterboxed skaliert)
S.VW = 900; S.VH = 600;

S.STATIONS = [
  {id:'waschen',  icon:'🛁', name:'Waschen'},
  {id:'foehnen',  icon:'🚿', name:'Föhnen'},
  {id:'schneiden',icon:'✂️', name:'Schneiden'},
  {id:'pfoten',   icon:'💅', name:'Pfoten'},
  {id:'schmuecken',icon:'🎀', name:'Schmücken'},
  {id:'finish',   icon:'✨', name:'Fertig!'}
];

var FRISUR_NAMEN = {lockig:'Lockig',kurz:'Kurz',zottig:'Zottig',igel:'Igel',afro:'Afro'};
var ACC = [
  {key:'hut',icon:'🎩',name:'Hut',colors:Art.HUTE},
  {key:'schleife',icon:'🎀',name:'Schleife',colors:Art.SCHLEIFEN},
  {key:'brille',icon:'🕶️',name:'Brille',colors:Art.BRILLEN},
  {key:'kette',icon:'📿',name:'Kette',colors:Art.KETTEN}
];

function neuerBaer(fellIdx){
  return { fell: Art.FELL[fellIdx], fellIdx: fellIdx,
    haar: Art.HAAR[0], frisur: 'lockig', lack:{}, schaum:0, fluff:0,
    tropfen:[], bow:0,
    acc:{hut:null,schleife:null,brille:null,kette:null},
    sticker:[] };
}

S.state = 'menu';          // menu | station-<id> | finish-done
S.baer = neuerBaer(0);
S.station = null;
S.saved = null;
try{ S.saved = JSON.parse(localStorage.getItem('bs_baer')||'null'); }catch(e){}
if(S.saved && S.saved.fell){ // gespeicherten Bären anbieten
  S.baer = Object.assign(neuerBaer(S.saved.fellIdx||0), S.saved);
  S.baer.tropfen=[]; S.baer.schaum=0; S.baer.fluff=0; S.baer.bow=0;
}

S.save = function(){
  try{ localStorage.setItem('bs_baer', JSON.stringify({
    fellIdx:S.baer.fellIdx, fell:S.baer.fell, haar:S.baer.haar,
    frisur:S.baer.frisur, lack:S.baer.lack, acc:S.baer.acc, sticker:S.baer.sticker
  })); }catch(e){}
};

// ---- Buttons ----------------------------------------------
// {x,y,w,h,label,icon,sub,onTap,active:fn}
var buttons = [];
S.buttons = buttons;

function btn(x,y,w,h,label,fn,opt){
  var b = {x:x,y:y,w:w,h:h,label:label,onTap:fn};
  if(opt) for(var k in opt) b[k]=opt[k];
  buttons.push(b); return b;
}

// Layout pro Zustand neu aufbauen
S.buildUI = function(){
  buttons.length = 0;
  var st = S.state;
  // Station-Verlassen aufräumen: kein Schaum/Tropfen-Rest im weiteren Verlauf
  if(S._prev==='waschen' && st!=='waschen'){ S.baer.schaum=0; S.baer.tropfen=[]; S.dusche=false; }
  if(S._prev==='foehnen' && st!=='foehnen'){ S.foehn=false; }
  S._prev = st;
  if(st==='menu'){
    if(S.saved && S.saved.fell){
      btn(230,458,440,64,'🧸 Weiter mit meinem Bären',function(){ S.state='waschen'; S.buildUI(); },{big:1});
      btn(230,534,440,64,'🌟 Neuer Bär',function(){ neuRandom(); S.state='waschen'; S.buildUI(); },{big:1});
    } else {
      btn(230,500,440,70,'▶️ Start',function(){ S.state='waschen'; S.buildUI(); },{big:1});
    }
    return;
  }
  if(st==='finish-done'){
    btn(150,518,280,62,'🐻 Noch ein Bär',function(){ neuRandom(); S.state='waschen'; S.buildUI(); },{big:1});
    btn(470,518,280,62,'🔄 Von vorne',function(){ S.baer=neuerBaer(S.baer.fellIdx); S.state='waschen'; S.buildUI(); },{big:1});
    return;
  }
  // Stations-UI
  backButtons();
  if(st==='waschen') buildWaschen();
  else if(st==='foehnen') buildFoehnen();
  else if(st==='schneiden') buildSchneiden();
  else if(st==='pfoten') buildPfoten();
  else if(st==='schmuecken') buildSchmuecken();
  else if(st==='finish') buildFinish();
};

function neuRandom(){
  var idx = Math.floor(Math.random()*Art.FELL.length);
  S.baer = neuerBaer(idx); S.save();
}

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
  for(var j=0;j<S.STATIONS.length;j++){
    (function(st,j){
      btn(130+j*112, S.VH-72, 104, 60, st.icon+' '+st.name, function(){
        S.state = st.id; S.buildUI();
      }, {active:function(){ return S.state===st.id; }, small:1});
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
  btn(330,480,240,70,'🎉 Fertig!',function(){
    S.state='finish-done'; S.baer.bowTarget=1; S.confetti=220; S.stars=120;
    S.save(); S.buildUI();
  },{big:1});
}

// ---- Zeichnen ------------------------------------------------
S.draw = function(g){
  var W=S.VW,H=S.VH;
  // Hintergrund: Salon mit Wand + Boden
  var grad=g.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#ffe6f2'); grad.addColorStop(0.65,'#fff3e0'); grad.addColorStop(0.65,'#d9b38c'); grad.addColorStop(1,'#c49a6c');
  g.fillStyle=grad; g.fillRect(0,0,W,H);

  if(S.state==='menu'){ drawMenu(g); return; }

  if(S.state==='finish-done'){
    // Feier-Screen: großes Perfekt, Bär freudig oben, Buttons darunter
    g.textAlign='center';
    g.font='bold 54px sans-serif';
    g.lineWidth=8; g.strokeStyle='#fff';
    g.strokeText('Perfekt! ✨', W/2, 72);
    g.fillStyle='#7a4b8f'; g.fillText('Perfekt! ✨', W/2, 72);
    g.save();
    g.translate(0,-34);
    Art.drawBear(g,S.baer,{w:W,h:H});
    drawStickers(g);
    g.restore();
    drawButtons(g);
    return;
  }

  // Titel + Hinweis
  g.fillStyle='#7a4b8f'; g.font='bold 26px sans-serif'; g.textAlign='center';
  var st=S.STATIONS.filter(function(x){return x.id===S.state;})[0];
  g.fillText(st? st.icon+' '+st.name : '', W/2, 50);
  if(S.hinweis){
    g.fillStyle='#9c6bb5'; g.font='20px sans-serif';
    g.fillText(S.hinweis, W/2, 82);
  }

  // Bär (bei Pfoten-Station größer ausgerichtet)
  Art.drawBear(g,S.baer,{w:W,h:H});

  // Sticker auf Pfoten
  drawStickers(g);
  drawButtons(g);
};

function drawMenu(g){
  var W=S.VW,H=S.VH;
  var grad=g.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#ffe6f2'); grad.addColorStop(1,'#e8d5f5');
  g.fillStyle=grad; g.fillRect(0,0,W,H);
  // deko Sterne (Hintergrund, vor Titel+Bär)
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
  Art.drawBear(g,S.baer,{w:W,h:H*0.66});
  g.restore();
  var oldLen = buttons.length;
  drawButtons(g);
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
  // virtuelle Koordinaten der Krallen für Hit-Tests
  var s = Math.min(S.VW,S.VH)/420;
  var cy = S.VH*0.58, cx=S.VW*0.5;
  var map = {L:[-55,175],R:[55,175]};
  var side=key[0], i=+key[1];
  var p=map[side];
  return [cx + (p[0]+(i-1)*16)*s, cy+p[1]*s, 14*s];
}

S.tapBear = function(x,y){
  // Rubbeln beim Waschen: Schaum erhöhen
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
  return false;
};

function roundRect(g,x,y,w,h,r){
  g.beginPath();
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
      g.font = (b.tiny?'13px':b.small?'16px':b.big?'bold 24px sans-serif':'19px sans-serif');
      g.textAlign='center'; g.textBaseline='middle';
      g.fillText(b.label, b.x+b.w/2, b.y+b.h/2);
    }
    g.restore();
  });
};

S.hitButton = function(x,y){
  for(var i=buttons.length-1;i>=0;i--){
    var b=buttons[i];
    if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h) return b;
  }
  return null;
};
})();
