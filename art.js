// art.js — Bär prozedural zeichnen. Kein externes Material.
(function(){
'use strict';
window.BS_VER = 3;
console.log('BS v3');

var Art = window.BSArt = {};

Art.FELL = ['#a9744f','#8a5a3b','#c79a6b','#e0c39a','#9aa3ad','#7a4b8f'];
Art.HAAR = ['#5a3a1e','#2b2b2b','#c0392b','#e67e22','#f1c40f','#8e44ad','#16a085','#e91e63'];
Art.LACK = ['#e91e63','#e74c3c','#f39c12','#2ecc71','#3498db','#9b59b6','#ffffff'];
Art.FRISEURE = ['lockig','kurz','zottig','igel','afro'];
Art.HUTE = ['#c0392b','#2980b9','#27ae60'];
Art.BRILLEN = ['#e91e63','#f1c40f','#34495e'];
Art.SCHLEIFEN = ['#e91e63','#9b59b6','#16a085'];
Art.KETTEN = ['#f1c40f','#ecf0f1','#e91e63'];

function circle(g,x,y,r,c){ g.fillStyle=c; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
function ell(g,x,y,rx,ry,c){ g.fillStyle=c; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill(); }

function rnd(seed){ // kleiner deterministischer Zufall für Zotten
  var s = seed>>>0;
  return function(){ s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
}

Art.drawBear = function(g, b, opt){
  // b: {fell, haar, frisur, lack:{i:color}, schaum:0..1, tropfen:[], fluff:0..1,
  //     acc:{hut:null|i,brille:null|i,schleife:null|i,kette:null|i}, bow:0 (Verbeugen 0..1)}
  opt = opt || {};
  var W = opt.w, H = opt.h;
  var cx = W*0.5, cy = H*0.58;
  var s = Math.min(W,H)/420;                    // Basis-Skalierung
  var fluff = 1 + (b.fluff||0)*0.08;
  var bowOff = (b.bow||0)*40*s;                 // Oberkörper beim Verbeugen nach unten
  var fell = b.fell;
  var dunkel = shade(fell,-25), hell = shade(fell,25);

  g.save();
  // Schatten
  ell(g,cx,cy+150*s,150*s,22*s,'rgba(0,0,0,0.12)');
  // Körper
  ell(g,cx,cy+70*s+bowOff,120*s*fluff,110*s,fell);
  // Arme
  ell(g,cx-105*s,cy+40*s+bowOff,38*s,70*s,fell);
  ell(g,cx+105*s,cy+40*s+bowOff,38*s,70*s,fell);
  // Beine/Füße
  ell(g,cx-55*s,cy+165*s,52*s,34*s,fell);
  ell(g,cx+55*s,cy+165*s,52*s,34*s,fell);
  // Fußballen
  ell(g,cx-55*s,cy+160*s,26*s,14*s,hell);
  ell(g,cx+55*s,cy+160*s,26*s,14*s,hell);
  // Krallen + Nagellack
  drawClaws(g,cx-55*s,cy+175*s,s,b,'L');
  drawClaws(g,cx+55*s,cy+175*s,s,b,'R');

  // Kopf
  var hy = cy-90*s+bowOff;
  circle(g,cx-62*s,hy-70*s+bowOff*0.5,26*s,fell); // Ohren
  circle(g,cx+62*s,hy-70*s+bowOff*0.5,26*s,fell);
  circle(g,cx-62*s,hy-70*s+bowOff*0.5,13*s,hell);
  circle(g,cx+62*s,hy-70*s+bowOff*0.5,13*s,hell);
  circle(g,cx,hy+bowOff*0.5,88*s*fluff,fell);

  // Frisur
  drawHair(g,cx,hy+bowOff*0.5,s,b);

  // Gesicht
  var ey = hy-15*s+bowOff*0.5;
  if(!b.acc.brille && b.acc.brille!==0){
    circle(g,cx-30*s,ey,9*s,'#26221f'); circle(g,cx+30*s,ey,9*s,'#26221f');
    circle(g,cx-27*s,ey-3*s,3*s,'#fff'); circle(g,cx+33*s,ey-3*s,3*s,'#fff');
  }
  // Schnauze
  ell(g,cx,hy+28*s+bowOff*0.5,36*s,26*s,hell);
  ell(g,cx,hy+18*s+bowOff*0.5,12*s,9*s,'#4a3227');       // Nase
  g.strokeStyle='#4a3227'; g.lineWidth=3*s; g.lineCap='round';
  g.beginPath(); g.moveTo(cx,hy+27*s+bowOff*0.5); g.lineTo(cx,hy+36*s+bowOff*0.5);
  g.quadraticCurveTo(cx-12*s,hy+46*s+bowOff*0.5,cx-22*s,hy+40*s+bowOff*0.5);
  g.moveTo(cx,hy+36*s+bowOff*0.5);
  g.quadraticCurveTo(cx+12*s,hy+46*s+bowOff*0.5,cx+22*s,hy+40*s+bowOff*0.5);
  g.stroke();

  // Accessoires
  drawAcc(g,cx,hy,bowOff,s,b);

  // Schaum (weiße Blasen am Körper)
  if(b.schaum>0){
    var r = rnd(7);
    g.globalAlpha = Math.min(1,b.schaum);
    for(var i=0;i<26;i++){
      var a = r()*Math.PI*2, rr = r()*1.0;
      var bx = cx+Math.cos(a)*110*s*rr, by = cy+70*s+bowOff*0.5+Math.sin(a)*100*s*rr;
      var br = (6+r()*16)*s;
      circle(g,bx,by,br,'rgba(255,255,255,0.85)');
      circle(g,bx-br*0.25,by-br*0.25,br*0.35,'rgba(255,255,255,0.95)');
    }
    g.globalAlpha=1;
  }
  // Tropfen beim Abduschen
  if(b.tropfen && b.tropfen.length){
    g.strokeStyle='rgba(120,190,255,0.8)'; g.lineWidth=3*s;
    for(var k=0;k<b.tropfen.length;k++){
      var t=b.tropfen[k];
      g.beginPath(); g.moveTo(t.x,t.y); g.lineTo(t.x,t.y+14*s); g.stroke();
    }
  }
  g.restore();
};

function drawClaws(g,x,y,s,b,side){
  for(var i=0;i<3;i++){
    var cxp = x + (i-1)*16*s;
    var c = (b.lack && b.lack[side+i]) || '#f7ede2';
    ell(g,cxp,y,7*s,10*s,c);
  }
}

function drawHair(g,cx,hy,s,b){
  var c = b.haar, f = b.frisur, i;
  if(f==='lockig'){
    // 6 Locken-Kreise am Kopfrand oben
    for(i=0;i<6;i++){ var t=i/5; var x=cx+(t-0.5)*110*s;
      circle(g,x, hy-75*s+Math.abs(t-0.5)*20*s, (16-Math.abs(t-0.5)*8)*s, c); }
  } else if(f==='kurz'){
    ell(g,cx,hy-66*s,58*s,22*s,c);
  } else if(f==='zottig'){
    var r=rnd(3); g.fillStyle=c;
    for(i=0;i<12;i++){ var x=cx+(r()-0.5)*130*s, y=hy-70*s+r()*30*s;
      ell(g,x,y,(12+r()*10)*s,(20+r()*14)*s,c); }
    ell(g,cx,hy-70*s,66*s,26*s,c);
  } else if(f==='igel'){
    g.fillStyle=c; g.strokeStyle=c; g.lineWidth=8*s; g.lineCap='round';
    for(i=0;i<13;i++){ var t2=i/12; var bx=cx+(t2-0.5)*100*s, by=hy-62*s;
      g.beginPath(); g.moveTo(bx,by); g.lineTo(bx+(t2-0.5)*40*s, by-45*s); g.stroke(); }
  } else if(f==='afro'){
    circle(g,cx,hy-80*s,52*s,c);
    circle(g,cx-38*s,hy-58*s,34*s,c); circle(g,cx+38*s,hy-58*s,34*s,c);
  }
}

function drawAcc(g,cx,hy,bowOff,s,b){
  var top = hy-88*s+bowOff*0.5;
  if(b.acc.hut!==null && b.acc.hut!==undefined){
    var hc = Art.HUTE[b.acc.hut];
    ell(g,cx,top-6*s,70*s,14*s,hc);           // Krempe
    g.fillStyle=hc; g.beginPath();
    g.moveTo(cx-42*s,top-6*s); g.lineTo(cx-32*s,top-62*s);
    g.lineTo(cx+32*s,top-62*s); g.lineTo(cx+42*s,top-6*s); g.closePath(); g.fill();
    ell(g,cx,top-30*s,44*s,10*s,shade(hc,-30));
  }
  if(b.acc.schleife!==null && b.acc.schleife!==undefined){
    var sc = Art.SCHLEIFEN[b.acc.schleife];
    var sx = cx-62*s, sy = top+6*s;
    g.fillStyle=sc;
    g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx-26*s,sy-16*s); g.lineTo(sx-26*s,sy+16*s); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+26*s,sy-16*s); g.lineTo(sx+26*s,sy+16*s); g.closePath(); g.fill();
    circle(g,sx,sy,9*s,shade(sc,-25));
  }
  if(b.acc.brille!==null && b.acc.brille!==undefined){
    var bc = Art.BRILLEN[b.acc.brille];
    var ey = hy-15*s+bowOff*0.5;
    g.strokeStyle=bc; g.lineWidth=5*s;
    g.fillStyle='rgba(40,40,60,0.75)';
    g.beginPath(); g.arc(cx-30*s,ey,20*s,0,Math.PI*2); g.fill(); g.stroke();
    g.beginPath(); g.arc(cx+30*s,ey,20*s,0,Math.PI*2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx-10*s,ey); g.lineTo(cx+10*s,ey); g.stroke();
  }
  if(b.acc.kette!==null && b.acc.kette!==undefined){
    var kc = Art.KETTEN[b.acc.kette];
    for(var i=0;i<9;i++){ var t=i/8;
      var x = cx + (t-0.5)*110*s;
      var y = hy+92*s+bowOff*0.5 + Math.sin(t*Math.PI)*26*s;
      circle(g,x,y,7*s,kc);
    }
  }
}

function shade(hex,amt){
  var n=parseInt(hex.slice(1),16);
  var r=Math.max(0,Math.min(255,(n>>16)+amt));
  var gn=Math.max(0,Math.min(255,((n>>8)&255)+amt));
  var bl=Math.max(0,Math.min(255,(n&255)+amt));
  return '#'+((r<<16)|(gn<<8)|bl).toString(16).padStart(6,'0');
}
Art.shade=shade;

// Sticker (Herz, Stern, Blume) für Pfoten – zeichnet bei (x,y), Größe r
Art.drawSticker=function(g,typ,x,y,r,c){
  g.save(); g.translate(x,y); g.fillStyle=c;
  if(typ==='herz'){
    g.beginPath(); g.moveTo(0,r*0.9);
    g.bezierCurveTo(-r,-r*0.1,-r*0.6,-r,0,-r*0.35);
    g.bezierCurveTo(r*0.6,-r,r,-r*0.1,0,r*0.9); g.fill();
  } else if(typ==='stern'){
    g.beginPath();
    for(var i=0;i<10;i++){ var a=-Math.PI/2+i*Math.PI/5; var rr=i%2?r*0.45:r;
      g[i?'lineTo':'moveTo'](Math.cos(a)*rr,Math.sin(a)*rr); }
    g.closePath(); g.fill();
  } else { // blume
    for(var j=0;j<5;j++){ var a2=j*Math.PI*2/5;
      circle(g,Math.cos(a2)*r*0.6,Math.sin(a2)*r*0.6,r*0.45,c); }
    circle(g,0,0,r*0.4,'#f1c40f');
  }
  g.restore();
};
})();
