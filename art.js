// art.js — Bär prozedural zeichnen. Kein externes Material.
(function(){
'use strict';
window.BS_VER = 5;
console.log('BS v5');

var Art = window.BSArt = {};

// 8 wählbare Bären-Modelle (fellIdx indexiert diese Liste)
Art.MODELS = [
  {name:'Braunbär',  fell:'#a9744f'},
  {name:'Honigbär',  fell:'#d9a94f'},
  {name:'Panda',     fell:'#f2f0ea', ohren:'#2b2b2b', arme:'#2b2b2b', muster:'panda'},
  {name:'Eisbär',    fell:'#f4f6f7', schnauze:'#cfe4f2'},
  {name:'Grizzly',   fell:'#5a3a22', muster:'grizzly'},
  {name:'Rosé-Bär',  fell:'#eba7b8'},
  {name:'Nachtbär',  fell:'#3f4a68', schnauze:'#8d97b5', muster:'sterne'},
  {name:'Teddy',     fell:'#e0892f'},
  {name:'Regenbogen-Bär', fell:'#f4f0e8', muster:'regenbogen'},
  {name:'Punkti-Bär', fell:'#efe4cf', muster:'punkte', hell:1},
  {name:'Herzchen-Bär', fell:'#faf6f0', muster:'herz', schnauze:'#ffd9e0', hell:1},
  {name:'Wald-Bär', fell:'#7fa89a', muster:'wald', schnauze:'#bde0cf'}
];
Art.HAAR = ['#5a3a1e','#2b2b2b','#c0392b','#e67e22','#f1c40f','#8e44ad','#16a085','#e91e63'];
Art.LACK = ['#e91e63','#e74c3c','#f39c12','#2ecc71','#3498db','#9b59b6','#ffffff'];
Art.FRISEURE = ['lockig','kurz','zottig','igel','afro'];
Art.HUTE = ['#c0392b','#2980b9','#27ae60'];
Art.BRILLEN = ['#e91e63','#f1c40f','#34495e'];
Art.SCHLEIFEN = ['#e91e63','#9b59b6','#16a085'];
Art.KETTEN = ['#f1c40f','#ecf0f1','#e91e63'];
Art.ROUGE = ['#ff6b81','#ff9eb5','#e75480','#ff7f50','#c94f6d'];
Art.LIDSCHATTEN = ['#9b59b6','#3498db','#f1c40f','#16a085','#ff8fb3'];

function circle(g,x,y,r,c){ g.fillStyle=c; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
function ell(g,x,y,rx,ry,c){ g.fillStyle=c; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill(); }

function rnd(seed){ // kleiner deterministischer Zufall
  var s = seed>>>0;
  return function(){ s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
}

Art.drawBear = function(g, b, opt){
  // b: {fellIdx, fell, haar, frisur, lack, schaum, tropfen, fluff, bow,
  //     breathe(s), blink(0/1), relax(0..1), makeup:{rouge,lid,gp:[{dx,dy}]}, acc, sticker}
  opt = opt || {};
  var W = opt.w, H = opt.h;
  var cx = W*0.5, cy = H*0.58;
  var s = Math.min(W,H)/420;
  var m = Art.MODELS[b.fellIdx||0] || Art.MODELS[0];
  var fell = m.fell;
  b.fell = fell; // Kompatibilität für alte Save-Stände
  var fluff = 1 + (b.fluff||0)*0.08;
  var bowOff = (b.bow||0)*40*s;
  var rx = b.relax||0;
  var dunkel = shade(fell,-25), hell = shade(fell,25);
  var schnauzeC = m.schnauze || hell;
  var ohrC = m.ohren || fell;
  var armC = m.arme || fell;
  var breathe = 1 + Math.sin((b.breathe||0)*2.2)*0.012;

  g.save();
  // Atmung: sanftes Skalieren um die Körpermitte
  g.translate(cx, cy+70*s); g.scale(1, breathe); g.translate(-cx, -(cy+70*s));
  // Schatten
  ell(g,cx,cy+150*s,150*s,22*s,'rgba(0,0,0,0.12)');
  // Körper
  ell(g,cx,cy+70*s+bowOff,120*s*fluff,110*s,fell);
  // Arme (Panda: schwarz)
  ell(g,cx-(105+rx*8)*s,cy+(40+rx*30)*s+bowOff,38*s,70*s,armC);
  ell(g,cx+(105+rx*8)*s,cy+(40+rx*30)*s+bowOff,38*s,70*s,armC);
  // Beine/Füße
  ell(g,cx-55*s,cy+165*s,52*s,34*s,fell);
  ell(g,cx+55*s,cy+165*s,52*s,34*s,fell);
  ell(g,cx-55*s,cy+160*s,26*s,14*s,schnauzeC);
  ell(g,cx+55*s,cy+160*s,26*s,14*s,schnauzeC);
  drawClaws(g,cx-55*s,cy+175*s,s,b,'L');
  drawClaws(g,cx+55*s,cy+175*s,s,b,'R');

  // Kopf
  var hy = cy-90*s+bowOff;
  var ex = 62+rx*16, eyy = -70+rx*12;
  circle(g,cx-ex*s,hy+eyy*s+bowOff*0.5,26*s,ohrC);
  circle(g,cx+ex*s,hy+eyy*s+bowOff*0.5,26*s,ohrC);
  circle(g,cx-ex*s,hy+eyy*s+bowOff*0.5,13*s, m.ohren? shade(m.ohren,30):hell);
  circle(g,cx+ex*s,hy+eyy*s+bowOff*0.5,13*s, m.ohren? shade(m.ohren,30):hell);
  circle(g,cx,hy+bowOff*0.5,88*s*fluff,fell);

  // Muster (Panda-Flecken, Grizzly-Spitzen, Nachtbär-Sterne)
  if(m.muster) drawMuster(g, m.muster, cx, cy, hy, bowOff, s);

  // Make-up hinter den Augen: Lidschatten + Rouge
  var mk = b.makeup || {};
  var ey = hy-15*s+bowOff*0.5;
  if(mk.lid){
    g.globalAlpha=0.7;
    ell(g,cx-30*s,ey-11*s,15*s,9*s,mk.lid);
    ell(g,cx+30*s,ey-11*s,15*s,9*s,mk.lid);
    g.globalAlpha=1;
  }
  if(mk.rouge){
    g.globalAlpha=0.4;
    circle(g,cx-52*s,hy+14*s+bowOff*0.5,17*s,mk.rouge);
    circle(g,cx+52*s,hy+14*s+bowOff*0.5,17*s,mk.rouge);
    g.globalAlpha=1;
  }

  // Frisur
  drawHair(g,cx,hy+bowOff*0.5,s,b);

  // Gesicht: Augen (mit Blinzeln, Spa-Gurken, Entspannung)
  var augenZu = b.blink || (b.relax>=0.85);
  if(!b.acc.brille && b.acc.brille!==0){
    if(b.gurkeL || b.gurkeR){
      // Geschlossene Augen + Gurkenscheiben
      g.strokeStyle='#26221f'; g.lineWidth=3*s; g.lineCap='round';
      g.beginPath(); g.moveTo(cx-38*s,ey); g.quadraticCurveTo(cx-30*s,ey+6*s,cx-22*s,ey);
      g.moveTo(cx+22*s,ey); g.quadraticCurveTo(cx+30*s,ey+6*s,cx+38*s,ey); g.stroke();
      if(b.gurkeL){
        circle(g,cx-30*s,ey,17*s,'#7ec850'); circle(g,cx-30*s,ey,13*s,'#b8e898');
        circle(g,cx-30*s,ey,3*s,'#e8f7d8'); circle(g,cx-36*s,ey-5*s,1.8*s,'#e8f7d8'); circle(g,cx-24*s,ey+5*s,1.8*s,'#e8f7d8');
      }
      if(b.gurkeR){
        circle(g,cx+30*s,ey,17*s,'#7ec850'); circle(g,cx+30*s,ey,13*s,'#b8e898');
        circle(g,cx+30*s,ey,3*s,'#e8f7d8'); circle(g,cx+24*s,ey-5*s,1.8*s,'#e8f7d8'); circle(g,cx+36*s,ey+5*s,1.8*s,'#e8f7d8');
      }
    } else if(augenZu){
      g.strokeStyle='#26221f'; g.lineWidth=3*s; g.lineCap='round';
      g.beginPath(); g.moveTo(cx-38*s,ey); g.quadraticCurveTo(cx-30*s,ey+(b.relax>=0.85?6*s:0),cx-22*s,ey);
      g.moveTo(cx+22*s,ey); g.quadraticCurveTo(cx+30*s,ey+(b.relax>=0.85?6*s:0),cx+38*s,ey); g.stroke();
    } else {
      circle(g,cx-30*s,ey,9*s,'#26221f'); circle(g,cx+30*s,ey,9*s,'#26221f');
      circle(g,cx-27*s,ey-3*s,3*s,'#fff'); circle(g,cx+33*s,ey-3*s,3*s,'#fff');
    }
  }
  // Schnauze
  ell(g,cx,hy+28*s+bowOff*0.5,36*s,26*s,schnauzeC);
  ell(g,cx,hy+18*s+bowOff*0.5,12*s,9*s,'#4a3227');
  g.strokeStyle='#4a3227'; g.lineWidth=3*s; g.lineCap='round';
  g.beginPath(); g.moveTo(cx,hy+27*s+bowOff*0.5); g.lineTo(cx,hy+36*s+bowOff*0.5);
  g.quadraticCurveTo(cx-12*s,hy+46*s+bowOff*0.5,cx-22*s,hy+40*s+bowOff*0.5);
  g.moveTo(cx,hy+36*s+bowOff*0.5);
  g.quadraticCurveTo(cx+12*s,hy+46*s+bowOff*0.5,cx+22*s,hy+40*s+bowOff*0.5);
  g.stroke();

  // Glitzer-Tupfer (Make-up)
  if(mk.gp && mk.gp.length){
    for(var gi=0; gi<mk.gp.length; gi++){
      var gp = mk.gp[gi];
      Art.drawSticker(g,'stern',cx+gp.dx,hy+bowOff*0.5+gp.dy,6*s,'rgba(255,215,90,0.95)');
    }
  }

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
      // Glanzpunkt auf jeder 2. Blase
      if(i%2===0){ circle(g,bx+br*0.28,by-br*0.32,br*0.14,'rgba(255,255,255,1)');
        circle(g,bx+br*0.28,by-br*0.32,br*0.06,'rgba(200,230,255,1)'); }
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

function drawMuster(g, typ, cx, cy, hy, bowOff, s){
  var i;
  if(typ==='panda'){
    // Schwarze Flecken um die Augen
    ell(g,cx-32*s,hy-14*s+bowOff*0.5,20*s,26*s,'#2b2b2b');
    ell(g,cx+32*s,hy-14*s+bowOff*0.5,20*s,26*s,'#2b2b2b');
  } else if(typ==='grizzly'){
    // Graue Fellspitzen auf Kopf und Körper
    var r=rnd(11);
    for(i=0;i<14;i++){
      var a=-Math.PI*0.85 + i*(Math.PI*0.7/13);
      var x1=cx+Math.cos(a)*88*s, y1=hy+bowOff*0.5+Math.sin(a)*88*s;
      ell(g,x1,y1,7*s,4*s,'rgba(190,190,190,0.5)');
    }
    for(i=0;i<10;i++){
      var a2=-Math.PI*0.8 + i*(Math.PI*0.6/9);
      ell(g,cx+Math.cos(a2)*115*s, cy+70*s+Math.sin(a2)*105*s, 8*s,5*s,'rgba(190,190,190,0.4)');
    }
  } else if(typ==='sterne'){
    // Kleine Sternchen auf Körper und Kopf
    var spots=[[-60,40],[30,110],[-20,-30],[70,60],[-90,110],[10,150]];
    for(i=0;i<spots.length;i++){
      Art.drawSticker(g,'stern',cx+spots[i][0]*s,cy+70*s+bowOff+spots[i][1]*s*0.6,7*s,'rgba(255,230,120,0.85)');
    }
  } else if(typ==='regenbogen'){
    // Farbverlauf-Streifen quer über das Fell (Kopf + Körper)
    var cols=['#e74c3c','#f39c12','#f1c40f','#2ecc71','#3498db','#9b59b6'];
    g.save();
    g.beginPath(); g.arc(cx,hy+bowOff*0.5,88*s,0,Math.PI*2); g.clip();
    for(i=0;i<cols.length;i++){
      g.globalAlpha=0.45; g.fillStyle=cols[i];
      g.fillRect(cx-90*s, hy+bowOff*0.5-88*s+i*(176*s/cols.length), 180*s, 176*s/cols.length);
    }
    g.restore(); g.save();
    g.beginPath(); g.ellipse(cx,cy+70*s+bowOff,120*s,110*s,0,0,Math.PI*2); g.clip();
    for(i=0;i<cols.length;i++){
      g.globalAlpha=0.4; g.fillStyle=cols[(i+2)%6];
      g.fillRect(cx-125*s, cy+70*s+bowOff-110*s+i*(220*s/cols.length), 250*s, 220*s/cols.length);
    }
    g.restore(); g.globalAlpha=1;
  } else if(typ==='punkte'){
    // Dunkle Spots auf hellem Fell (deterministisch)
    var r2=rnd(23);
    for(i=0;i<10;i++){
      var pa=r2()*Math.PI*2, pr2=0.25+r2()*0.6;
      ell(g,cx+Math.cos(pa)*92*s*pr2, cy+70*s+bowOff+Math.sin(pa)*86*s*pr2,
        (8+r2()*8)*s,(7+r2()*8)*s,'rgba(120,90,60,0.55)');
    }
    for(i=0;i<4;i++){
      ell(g,cx+(r2()-0.5)*110*s, hy+bowOff*0.5+(r2()-0.5)*100*s, (6+r2()*5)*s,(6+r2()*5)*s,'rgba(120,90,60,0.5)');
    }
  } else if(typ==='herz'){
    // Roter Herzfleck auf dem Bauch
    Art.drawSticker(g,'herz',cx,cy+85*s+bowOff,44*s,'rgba(230,60,90,0.85)');
  } else if(typ==='wald'){
    // Blätter auf Kopf und Rücken
    var bl=[[-40,-78],[10,-88],[50,-70],[-70,30],[80,20],[10,55]];
    for(i=0;i<bl.length;i++){
      var bx2=cx+bl[i][0]*s, by2=(i<3? hy: cy+60*s)+bowOff* (i<3?0.5:1)+bl[i][1]*s;
      g.save(); g.translate(bx2,by2); g.rotate((i*0.8)-1.6);
      g.fillStyle='rgba(46,125,72,0.85)';
      g.beginPath(); g.ellipse(0,0,14*s,7*s,0,0,Math.PI*2); g.fill();
      g.strokeStyle='rgba(23,80,42,0.8)'; g.lineWidth=1.5*s;
      g.beginPath(); g.moveTo(-13*s,0); g.lineTo(13*s,0); g.stroke();
      g.restore();
    }
  }
}

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
    ell(g,cx,top-6*s,70*s,14*s,hc);
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

// Sticker (Herz, Stern, Blume) – zeichnet bei (x,y), Größe r
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
