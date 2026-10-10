// stations/foto.js — Foto-Studio: Rahmen wählen, „Klick!“ legt einen Schnappschuss ins Album (max. 4),
// Album-Kachel antippen lädt den Look zurück. Die Kachel-Rechtecke kommen aus hit() (aus dem Zustand berechnet),
// nicht mehr als Nebenwirkung des Zeichnens.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

// Album-Vorschau unten rechts: Lage der (höchstens 4) Kacheln
var AX=330, AY=230, AW=72, AH=86, GAP=14;
function albumBoxen(){
  var out=[];
  if(!S.album || !S.album.length) return out;
  var ax=S.VW-AX, ay=S.VH-AY;
  S.album.slice(-4).forEach(function(p,i){
    out.push({x:ax+i*(AW+GAP),y:ay,w:AW,h:AH,idx:S.album.length-Math.min(4,S.album.length)+i});
  });
  return out;
}

S.registerStation({
  id:'foto',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Rahmen wählen und Klick! 📸';
    if(S.fotoRahmen===undefined) S.fotoRahmen=0;
    ['✨ Sternchen','🌸 Blümchen','👑 Gold'].forEach(function(t,i){
      H.btn(30+i*140, 100, 132, 54, t, function(){ S.fotoRahmen=i; S.buildUI(); },
        {active:function(){return S.fotoRahmen===i;}, small:1});
    });
    H.btn(30, 170, 170, 60, '📸 Klick!', function(){
      S.flash=1; S.fotoBadge=true; S.buildUI();
      // Schnappschuss ins Album (max 4, älteste verschwinden) — tiefe Kopien, nie geteilte Objekte
      var d = new Date();
      var tag = ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.';
      S.album.push({modell: Art.MODELS[S.baer.fellIdx||0].name, datum: tag,
        fellIdx: S.baer.fellIdx||0, haar: S.baer.haar, frisur: S.baer.frisur,
        rahmen: S.fotoRahmen||0,
        lack:H.kopie(S.baer.lack), acc:H.kopie(S.baer.acc), sticker:H.kopie(S.baer.sticker),
        makeup:H.kopie(S.baer.makeup), gurkeL:S.baer.gurkeL, gurkeR:S.baer.gurkeR, duft:S.baer.duft});
      var KA=window.BSKunden, maxF=KA&&KA.albumMax?KA.albumMax():4;           // r22: Album mit 12 Fotos (?album=4 = wie vorher)
      while(S.album.length>maxF) S.album.shift();
      if(window.BSKunden && window.BSKunden.foto) window.BSKunden.foto();   // r22: Foto zählt für die Freundschaft
      try{ localStorage.setItem('bs_album', JSON.stringify(S.album)); }catch(e){}
    },{big:1});
  },
  // Foto-Studio: warme Scheinwerfer (Hintergrund, vor den Duftwolken)
  back:function(g){
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
  },
  draw:function(g){
    H.baer(g);
    drawAlbumVorschau(g);
    Art.drawFotoRahmen(g, S.fotoRahmen||0, S.flash||0, !!S.fotoBadge, S.VW, S.VH);
  },
  hit:function(){ return {album:albumBoxen()}; },
  tap:function(x,y){
    // Album-Kachel tippen: Look zurückladen (Kopien, nie die Album-Objekte selbst)
    var boxen=albumBoxen();
    for(var ai=0; ai<boxen.length; ai++){
      var ab=boxen[ai];
      if(x>=ab.x&&x<=ab.x+ab.w&&y>=ab.y&&y<=ab.y+ab.h){
        var snap=S.album[ab.idx]; if(!snap) return false;
        var m=Art.MODELS[snap.fellIdx]||Art.MODELS[0];
        S.baer=Object.assign(H.neuerBaer(snap.fellIdx||0), {
          haar:snap.haar||Art.HAAR[0], frisur:snap.frisur||'lockig',
          lack:H.kopie(snap.lack||{}), acc:H.kopie(snap.acc||{hut:null,schleife:null,brille:null,kette:null}),
          sticker:H.kopie(snap.sticker||[]), makeup:H.kopie(snap.makeup||{rouge:null,lid:null,gp:[]}),
          gurkeL:!!snap.gurkeL, gurkeR:!!snap.gurkeR, duft:(snap.duft===undefined?null:snap.duft)
        });
        S.baer.fellIdx=snap.fellIdx||0; S.baer.fell=m.fell;
        if(snap.rahmen!==undefined) S.fotoRahmen=snap.rahmen;
        S.save(); S.buildUI();
        return true;
      }
    }
    return false;
  }
});

function drawAlbumVorschau(g){
  var boxen=albumBoxen(); if(!boxen.length) return;
  var ax=S.VW-AX, ay=S.VH-AY, aw=AW, gap=GAP;
  g.save(); g.font='11px sans-serif'; g.textAlign='center';
  g.fillStyle='#7a4b8f'; g.fillText('Meine Schnappschüsse (antippen = laden)', ax+ (4*(aw+gap)-gap)/2, ay-6);
  boxen.forEach(function(b){
    var p=S.album[b.idx], x=b.x;
    g.fillStyle='#fff'; g.strokeStyle='#c9aede'; g.lineWidth=2;
    g.beginPath(); g.rect(x,ay,aw,AH); g.fill(); g.stroke();
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
})();
