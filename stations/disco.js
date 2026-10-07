// stations/disco.js — Disco: Lichtfarbe wählen oder den Bären antippen (Farbe wechselt), Discokugel dreht sich.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt;
var DISCO_FARBEN = ['#ff5da2','#7ab8f5','#ffd24d','#8fd48a','#c39bd3'];

S.registerStation({
  id:'disco',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Bären antippen = Licht wechselt Farbe! 🪩';
    if(S.discoFarbe===undefined || S.discoFarbe===null) S.discoFarbe=0;
    DISCO_FARBEN.forEach(function(c,i){
      H.btn(30+i*62, 100, 56, 56, '', function(){ S.discoFarbe=i; S.buildUI(); },
        {fill:c, active:function(){return S.discoFarbe===i;}});
    });
  },
  draw:function(g){
    var W=S.VW,H2=S.VH, tNow=performance.now()/1000;
    // Groove: sanftes Seiten-Neigen
    var gro=Math.sin(tNow*2.6)*0.09;
    g.save();
    g.translate(W/2, S.VH*0.58+150*Math.min(W,H2)/420);
    g.rotate(gro);
    g.translate(-W/2, -(S.VH*0.58+150*Math.min(W,H2)/420)-Math.abs(Math.sin(tNow*2.6))*8);
    H.baer(g);
    g.restore();
    drawDisco(g);
  },
  tap:function(x,y){
    // Bär antippen: Lichtfarbe wechseln
    var s5=Math.min(S.VW,S.VH)/420;
    if(Math.hypot(x-S.VW*0.5, y-S.VH*0.58)<180*s5){
      S.discoFarbe=((S.discoFarbe||0)+1)%DISCO_FARBEN.length;
      S.buildUI();
    }
    return true;
  }
});

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
    S.H.circle2(g,px2,py2,Math.max(2,sz),farb);
  }
  // Wandpunkte oben
  for(var w=0;w<10;w++){
    var wx2=(t*40+w*97)%W;
    var wy2=40+((w*67)%120);
    g.globalAlpha=0.4;
    S.H.circle2(g,wx2,wy2,4,'#ffffff');
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
})();
