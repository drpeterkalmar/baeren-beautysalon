// stations/karussell.js — Karussell: Pferd-Farbe und Tempo wählen; der Bär reitet im Kreis, beim schnellen Dreh schweben Noten.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'karussell',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Pferd-Farbe wählen — das Karussell dreht sich! 🎠';
    if(!S.karo) S.karo = {pferd:0, w:0.7, ang:0};
    ['#ff9eb5','#7ab8f5','#ffd24d'].forEach(function(c,i){
      H.btn(30+i*66, 100, 58, 58, '', function(){ S.karo.pferd=i; S.buildUI(); },
        {fill:c, active:function(){return S.karo.pferd===i;}});
    });
    H.btn(236,100,190,58,'🐢 Langsam',function(){ S.karo.w=0.45; S.buildUI(); },{active:function(){return S.karo.w<0.7;}});
    H.btn(436,100,190,58,'🐇 Schnell',function(){ S.karo.w=1.6; S.buildUI(); },{active:function(){return S.karo.w>1;}});
  },
  update:function(dt,fr){ if(S.karo) updKarussell(fr); },
  draw:function(g){ if(S.karo) drawKarussell(g); else H.baer(g); },
  tap:function(){ return false; }
});

// Karussell: Zelt, Lichterketten, drehendes Pferd mit Bär (Bewegung in updKarussell)
function drawKarussell(g){
  var t=performance.now()/1000;
  var k=S.karo;
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
    S.H.circle2(g,lx,ly,5+3*blink,['#ffd24d','#ff9eb5','#7ab8f5','#8fd48a'][li%4]);
  }
  for(var li2=0;li2<=10;li2++){
    var f2=li2/10, lx2=W/2-210+f2*420, ly2=150+Math.sin(f2*Math.PI)*34;
    var blink2=0.5+0.5*Math.sin(t*5+li2*1.7);
    S.H.circle2(g,lx2,ly2,4+3*blink2,['#7ab8f5','#ffd24d','#ff9eb5'][li2%3]);
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
  // Musiknoten schweben beim schnellen Dreh (Bewegung in updKarussell; Farbe/Symbol nach Listenplatz wie früher)
  var nb=k._notenBild;
  if(k.w>1 && nb){
    for(var ni=nb.length-1;ni>=0;ni--){
      var no=nb[ni], na=Math.max(0,1-no.t/1.6);
      if(na<=0) continue;
      g.globalAlpha=na; g.font='26px sans-serif'; g.textAlign='center';
      g.fillStyle=['#7a4b8f','#e91e63','#3498db'][ni%3];
      g.fillText(S.H.NICONS[ni%4], no.x, no.y);
    }
    g.globalAlpha=1;
  }
}

// Simulation (aus update): Drehung und Noten; pro 60-Hz-Bild wie früher, × fr.
// Zeichenliste _notenBild = Noten vor dem Entfernen → Listenplätze (Farbe/Symbol) im Bild wie früher.
function updKarussell(fr){
  var k=S.karo, t=performance.now()/1000, W=S.VW, H=S.VH;
  k.ang=(k.ang||0)+k.w*0.02*fr;
  if(k.w>1){
    if(!k.noten) k.noten=[];
    if(Math.random()<0.3*fr) k.noten.push({x:W/2+(Math.random()-0.5)*300, y:H*0.72, t:0, wob:Math.random()*6});
    for(var ni=k.noten.length-1;ni>=0;ni--){
      var no=k.noten[ni]; no.t+=0.016*fr;
      no.y-=2.4*fr; no.x+=Math.sin(t*3+no.wob)*2*fr;
    }
    k._notenBild=k.noten.slice();
    for(ni=k.noten.length-1;ni>=0;ni--) if(Math.max(0,1-k.noten[ni].t/1.6)<=0) k.noten.splice(ni,1);
  } else { if(k.noten) k.noten.length=0; k._notenBild=null; }
}

function drawPferd(g,x,y,d,c){
  g.save(); g.translate(x,y); g.scale(d,d);
  g.fillStyle=c; g.strokeStyle=Art.shade(c,-40); g.lineWidth=3;
  g.beginPath(); g.ellipse(0,0,66,30,0,0,Math.PI*2); g.fill(); g.stroke(); // Körper
  g.beginPath(); g.ellipse(46,-22,22,16,-0.5,0,Math.PI*2); g.fill(); g.stroke(); // Kopf
  H.circle2(g,52,-26,3.5,'#2b2b2b');
  g.fillStyle=Art.shade(c,-40);
  [[-38,26],[-24,30],[24,30],[38,26]].forEach(function(p){
    g.fillRect(p[0]-5,p[1],10,26); // Beine
  });
  g.beginPath(); g.moveTo(-64,-4); g.quadraticCurveTo(-88,-18,-92,4); g.quadraticCurveTo(-86,10,-64,10); g.fill(); // Schweif
  g.fillStyle='#fff'; g.beginPath(); g.ellipse(-10,-8,26,20,0,0,Math.PI*2); g.fill(); // Sattel
  g.restore();
}
})();
