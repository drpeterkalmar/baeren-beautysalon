// stations/malbuch.js — Malbuch: Farbe wählen, Flächen des Umriss-Bären antippen; Rahmen-Bereich tippen = Rahmenstil.
// Flächen- und Rahmen-Hit-Boxen kommen aus hit() (feste Geometrie), nicht mehr aus S._mbHit/_mbFrame beim Zeichnen.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;
Art.MAL_FARBEN = ['#e91e63','#e74c3c','#f4c20d','#8fd48a','#3498db','#9b59b6','#e0892f','#ff9eb5'];

S.registerStation({
  id:'malbuch',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Farbe wählen, dann eine Fläche des Bären antippen! 🎨';
    Art.MAL_FARBEN.forEach(function(c,i){
      H.btn(30+(i%4)*56, 100+Math.floor(i/4)*56, 50, 50, '', function(){
        S.mbColor=c; S.buildUI();
      },{fill:c, active:function(){return S.mbColor===c;}});
    });
    H.btn(30, 226, 150, 52, '🖼️ Rahmen', function(){
      if(!S.mb) S.mb={parts:{},rahmen:0};
      S.mb.rahmen=(S.mb.rahmen+1)%4;
      S.toast={txt:'🎨 Meisterwerk!', t:2.2};
      window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(S.VW*0.5, S.VH*0.4);
      S.buildUI();
    }, {active:function(){return S.mb && S.mb.rahmen>0;}});
    H.btn(30, 288, 150, 52, '🧽 Neues Bild', function(){
      S.mb={parts:{},rahmen:0}; S.buildUI();
    });
  },
  draw:function(g){ drawMalbuch(g); },
  hit:function(){ return malHit(); },
  tap:function(x,y){
    if(!S.mb) S.mb={parts:{},rahmen:0};
    if(!S.mbColor) S.mbColor=Art.MAL_FARBEN[0];
    // Rahmen-Bereich tippen = Rahmenstil wechseln (ohne Papier)
    var hb=malHit(), f=hb.rahmen;
    if(x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.h &&
       !(x>f.x+26&&x<f.x+f.w-26&&y>f.y+26&&y<f.y+f.h-26)){
      S.mb.rahmen=(S.mb.rahmen+1)%4; S.buildUI(); return true;
    }
    for(var mi=0;mi<hb.flaechen.length;mi++){
      var h=hb.flaechen[mi];
      if(Math.hypot(x-h.x,y-h.y)<h.r){
        S.mb.parts[h.key]=S.mbColor;
        return true;
      }
    }
    return true;
  }
});

// Papier (Welt-Koordinaten) und Umriss-Bär: virtuelle 450×330-Fläche, Mittelpunkt (225,190), Maßstab 1,05
var RX=230, RY=104, RW=440, RH=320, SC=1.05, MCX=225, MCY=190;
// Antippbare Flächen als Kreise (Mitte relativ zu MCX/MCY, Radius) – Reihenfolge = Vorrang beim Antippen
var FLAECHEN=[['pfoteHL',-55,165,52],['pfoteHR',55,165,52],['pfoteVL',-105,40,44],['pfoteVR',105,40,44],
  ['koerper',0,70,110],['ohrL',-62,-160,28],['ohrR',62,-160,28],['kopf',0,-90,88],['schnauze',0,-62,34]];
function malHit(){
  return {
    rahmen:{x:RX-26,y:RY-26,w:RW+52,h:RH+52},
    flaechen:FLAECHEN.map(function(f){
      return {key:f[0], x:RX+RW/2+(MCX+f[1]-225)*SC, y:RY+RH/2-152+(MCY+f[2]-40)*SC, r:f[3]*SC};
    })
  };
}
function drawMalbuch(g){
  if(!S.mb) S.mb={parts:{},rahmen:0};
  var rx=RX, ry=RY, rw=RW, rh=RH;
  // Papier + Deko-Raum
  g.fillStyle='rgba(0,0,0,0.06)'; g.fillRect(rx+8,ry+10,rw,rh); // Schatten
  g.fillStyle='#fdf9f2'; g.fillRect(rx,ry,rw,rh);
  g.strokeStyle='#d9c8ac'; g.lineWidth=2; g.strokeRect(rx,ry,rw,rh);
  // Bär in der Mitte des Papiers, Scale auf virtuelles 450x330
  var sc=SC;
  g.save();
  g.translate(rx+rw/2, ry+rh/2-152); // Zentrum: virtuelle 225,40 Ziel = rx+rw/2, ry+~40*sc
  g.scale(sc,sc);
  g.translate(-225,-40);
  drawMalBaer(g);
  g.restore();
  // Rahmen-Deko wenn gewählt
  if(S.mb.rahmen>0) drawMalRahmen(g, rx,ry,rw,rh, S.mb.rahmen);
  // Farbkleckse am Rand (Effekt)
  var t9=performance.now()/1000;
  var kl=["#e91e63","#f4c20d","#3498db","#2ecc71","#9b59b6","#e0892f"];
  for(var k9=0;k9<8;k9++){
    var kx9=rx-30+(k9%2)*(rw+60), ky9=ry+22+k9%4*96+((k9*37)%14);
    H.circle2(g,kx9,ky9,7+k9%3*4, kl[k9%6]);
    H.circle2(g,kx9+((k9%2)?-1:1)*12, ky9+16, 3.5, kl[(k9+2)%6]);
  }
  for(var k10=0;k10<4;k10++){ // langsam schwebende Kringel ums Papier
    var a10=t9*0.7+k10*1.6;
    H.circle2(g, rx+rw/2+Math.cos(a10)*(rw/2+44), ry+rh/2+Math.sin(a10)*(rh/2+40), 3.5, kl[k10+1]);
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
  var cx=MCX, cy=MCY; // virtueller Mittelpunkt
  function fillOr(key, drawFn){
    var col=S.mb.parts[key];
    drawFn(col||'#ffffff');
    g.strokeStyle='#5a4637'; g.lineWidth=3.5;
    drawFn(null, true); // nur Outline
  }
  // Hinterpfoten (Füße)
  fillOr('pfoteHL', function(c,outline){ g.fillStyle=c; g.strokeStyle='#5a4637';
    g.beginPath(); g.ellipse(cx-55,cy+165,52,34,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); });
  fillOr('pfoteHR', function(c,outline){ g.fillStyle=c; g.strokeStyle='#5a4637';
    g.beginPath(); g.ellipse(cx+55,cy+165,52,34,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); });
  // Vorderpfoten (Arme)
  fillOr('pfoteVL', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.ellipse(cx-105,cy+40,38,70,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); });
  fillOr('pfoteVR', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.ellipse(cx+105,cy+40,38,70,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); });
  // Körper
  fillOr('koerper', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.ellipse(cx,cy+70,120,110,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); });
  // Ohren
  fillOr('ohrL', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.arc(cx-62,cy-160,26,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); });
  fillOr('ohrR', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.arc(cx+62,cy-160,26,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); });
  // Innenohren immer zartrosa
  H.circle2(g,cx-62,cy-160,13,'#ff9ec4'); H.circle2(g,cx+62,cy-160,13,'#ff9ec4');
  // Kopf
  fillOr('kopf', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.arc(cx,cy-90,88,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); });
  // Schnauze
  fillOr('schnauze', function(c,outline){ g.fillStyle=c;
    g.beginPath(); g.ellipse(cx,cy-62,36,26,0,0,Math.PI*2); if(!outline) g.fill(); else g.stroke(); });
  // Gesichtslinien (Augen, Nase, Mund) immer dunkel
  g.fillStyle='#26221f';
  H.circle2(g,cx-30,cy-105,9,'#26221f'); H.circle2(g,cx+30,cy-105,9,'#26221f');
  H.circle2(g,cx-27,cy-108,3,'#fff'); H.circle2(g,cx+33,cy-108,3,'#fff');
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
})();
