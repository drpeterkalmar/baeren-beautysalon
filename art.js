// art.js — Bär prozedural zeichnen. Kein externes Material.
(function(){
'use strict';
window.BS_VER = 8;
console.log('BS v8');

var Art = window.BSArt = {};

// 16 wählbare Bären-Modelle (fellIdx indexiert diese Liste)
Art.MODELS = [
  {name:'Braunbär',  fell:'#a9744f'},
  {name:'Honigbär',  fell:'#d9a94f'},
  {name:'Panda',     fell:'#f2f0ea', ohren:'#2b2b2b', arme:'#2b2b2b', muster:'panda'},
  {name:'Eisbär',    fell:'#f4f6f7', schnauze:'#cfe4f2', kontur:'#8fa8bc', hell:1},
  {name:'Grizzly',   fell:'#5a3a22', muster:'grizzly'},
  {name:'Rosé-Bär',  fell:'#eba7b8'},
  {name:'Nachtbär',  fell:'#3f4a68', schnauze:'#8d97b5', muster:'sterne'},
  {name:'Teddy',     fell:'#e0892f'},
  {name:'Regenbogen-Bär', fell:'#f4f0e8', muster:'regenbogen'},
  {name:'Punkti-Bär', fell:'#efe4cf', muster:'punkte', hell:1},
  {name:'Herzchen-Bär', fell:'#faf6f0', muster:'herz', schnauze:'#ffd9e0', hell:1},
  {name:'Wald-Bär', fell:'#7fa89a', muster:'wald', schnauze:'#bde0cf'},
  {name:'Einhorn-Bär', fell:'#eef0f6', schnauze:'#ffd9e8', muster:'einhorn', kontur:'#b0b8d0', hell:1},
  {name:'Robo-Bär', fell:'#9aa4ae', schnauze:'#c8d2da', muster:'robo', kontur:'#5a646e'},
  {name:'Kirschblüten-Bär', fell:'#ffd3e0', schnauze:'#fff0f4', muster:'kirsch', kontur:'#d89aab', hell:1},
  {name:'Wolken-Bär', fell:'#bcd8f2', schnauze:'#eaf4fd', muster:'wolke', kontur:'#7ba7cc', hell:1},
  {name:'Prinzessinnen-Bär', fell:'#f2a7c8', schnauze:'#ffd9e8', muster:'prinzessin', kontur:'#c97ea5'},
  {name:'Bauarbeiter-Bär', fell:'#c8913f', schnauze:'#e8c88f', muster:'bau'},
  {name:'Piraten-Bär', fell:'#4d5259', schnauze:'#9aa4ae', muster:'pirat', kontur:'#31353a'},
  {name:'Zauberer-Bär', fell:'#8e6bbf', schnauze:'#cbb3ea', muster:'zauberer', kontur:'#5f3f96'},
  {name:'Dino-Bär', fell:'#6fae4f', schnauze:'#b8e09a', muster:'dino', kontur:'#3e6b28'},
  {name:'Superhelden-Bär', fell:'#4a7fd6', schnauze:'#9fc0ee', muster:'superheld', kontur:'#274b8a'},
  {name:'Schnee-Bär', fell:'#cfe6f5', schnauze:'#ffffff', muster:'schnee', kontur:'#89aec9', hell:1},
  {name:'Kaktus-Bär', fell:'#3f9e57', schnauze:'#9fd8ae', muster:'kaktus', kontur:'#25703b'}
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
  // Arme (Panda: schwarz); Jubel-Pose: Arme hoch statt hängen
  var jub = b.jubel||0;
  var axL = cx-(105+rx*8)*s + jub*40*s, axR = cx+(105+rx*8)*s - jub*40*s;
  var ay = cy+(40+rx*30)*s+bowOff - jub*120*s;
  g.save();
  if(jub>0.01){
    // gedrehte Jubel-Arme schräg nach oben
    g.translate(axL,ay); g.rotate(-0.7*jub);
    ell(g,0,-20*s*jub,34*s,64*s,armC);
    g.restore(); g.save();
    g.translate(axR,ay); g.rotate(0.7*jub);
    ell(g,0,-20*s*jub,34*s,64*s,armC);
  } else {
    ell(g,axL,ay,38*s,70*s,armC);
    ell(g,axR,ay,38*s,70*s,armC);
  }
  g.restore();
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

  // Deutliche Kontur für helle Bären (Eisbär etc.)
  if(m.kontur){
    g.strokeStyle=m.kontur; g.lineWidth=3.5*s; g.lineJoin='round';
    g.beginPath(); g.ellipse(cx,cy+70*s+bowOff,120*s*fluff,110*s,0,0,Math.PI*2); g.stroke();
    g.beginPath(); g.arc(cx,hy+bowOff*0.5,88*s*fluff,0,Math.PI*2); g.stroke();
    g.beginPath(); g.arc(cx-ex*s,hy+eyy*s+bowOff*0.5,26*s,0,Math.PI*2); g.stroke();
    g.beginPath(); g.arc(cx+ex*s,hy+eyy*s+bowOff*0.5,26*s,0,Math.PI*2); g.stroke();
  }

  // Fell-Glanz: weiche weiße Glanzflecken (fluff hoch oder Spa fertig)
  if((b.fluff||0)>0.7 || opt.spaTarget===1){
    g.save(); g.globalAlpha=0.35; g.fillStyle='#fff';
    g.beginPath(); g.ellipse(cx-50*s,cy+30*s+bowOff,40*s,18*s,-0.5,0,Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(cx+44*s,hy-30*s+bowOff*0.5,30*s,13*s,0.4,0,Math.PI*2); g.fill();
    g.beginPath(); g.ellipse(cx-30*s,hy+50*s+bowOff*0.5,18*s,8*s,0.2,0,Math.PI*2); g.fill();
    g.restore();
  }

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
  // Kopf-Deko ÜBER der Frisur (Horn, Antenne, Krone, Helm, Hüte der Modelle)
  drawKopfDeko(g, m, cx, hy+bowOff*0.5, s);

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
  // Piraten-Augenklappe (über dem linken Auge)
  if(m.muster==='pirat'){
    g.save();
    circle(g,cx-30*s,ey,15*s,'#1d1f23');
    g.strokeStyle='#1d1f23'; g.lineWidth=3.5*s; g.lineCap='round';
    g.beginPath(); g.moveTo(cx-44*s,ey-4*s); g.lineTo(cx-84*s,hy-40*s+bowOff*0.5); g.stroke();
    g.beginPath(); g.moveTo(cx-16*s,ey-6*s); g.lineTo(cx+62*s,hy-44*s+bowOff*0.5); g.stroke();
    g.strokeStyle='#f5c542'; g.lineWidth=1.6*s;
    g.beginPath(); g.arc(cx-30*s,ey,15*s,0,Math.PI*2); g.stroke();
    g.restore();
  }
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
  } else if(typ==='einhorn'){
    // Glitzer im Fell (Horn wird nach der Frisur gezeichnet, siehe drawKopfDeko)
    ell(g,cx-16*s,hy-64*s+bowOff*0.5,8*s,5*s,'rgba(255,182,206,0.7)');
    ell(g,cx+16*s,hy-64*s+bowOff*0.5,8*s,5*s,'rgba(255,182,206,0.7)');
    var re=rnd(31);
    for(i=0;i<16;i++){
      var ga=re()*Math.PI*2, gr=re()*0.85;
      var gx=cx+Math.cos(ga)*100*s*gr, gy=(i<9? cy+70*s+Math.sin(ga)*95*s*gr : hy+bowOff*0.5+Math.sin(ga)*72*s*gr);
      Art.drawSticker(g,'stern',gx,gy,(3.5+re()*3)*s, i%3?'rgba(255,215,90,0.9)':'rgba(255,160,200,0.9)');
    }
  } else if(typ==='robo'){
    // LED-Augen-Punkte + Metallnähte (Antenne in drawKopfDeko)
    var ledT=performance.now()/1000;
    circle(g,cx-30*s,hy-34*s+bowOff*0.5,4*s,'rgba(80,220,255,'+(0.6+0.4*Math.sin(ledT*3)).toFixed(2)+')');
    // Nähte/Platten auf dem Körper
    g.strokeStyle='rgba(80,92,102,0.6)'; g.lineWidth=2*s;
    g.beginPath(); g.moveTo(cx-80*s,cy+60*s+bowOff); g.lineTo(cx+80*s,cy+60*s+bowOff); g.stroke();
    g.beginPath(); g.moveTo(cx,cy-30*s+bowOff); g.lineTo(cx,cy+150*s+bowOff); g.stroke();
    for(i=0;i<6;i++){ circle(g,cx-72*s+i*28*s, cy+60*s+bowOff, 2.5*s, '#6b7680'); }
    // Bauch-Panel mit Herz-LED
    g.fillStyle='rgba(200,212,222,0.85)';
    g.fillRect(cx-30*s,cy+80*s+bowOff,60*s,36*s);
    g.strokeStyle='#5a646e'; g.strokeRect(cx-30*s,cy+80*s+bowOff,60*s,36*s);
    Art.drawSticker(g,'herz',cx,cy+94*s+bowOff,10*s,'rgba(231,76,60,'+(0.55+0.45*Math.sin(ledT*4)).toFixed(2)+')');
  } else if(typ==='kirsch'){
    // Winzige Blüten im Fell
    var rk=rnd(47);
    for(i=0;i<14;i++){
      var ka=rk()*Math.PI*2, kr=0.25+rk()*0.65;
      var kx=cx+Math.cos(ka)*105*s*kr;
      var ky=(i<9? cy+70*s+Math.sin(ka)*92*s*kr : hy+bowOff*0.5+Math.sin(ka)*70*s*kr);
      Art.drawSticker(g,'blume',kx,ky,(5+rk()*3)*s, i%2?'rgba(255,255,255,0.9)':'rgba(255,170,195,0.9)');
    }
  } else if(typ==='wolke'){
    // Wölkchen-Muster
    var wpos=[[-60,30],[35,-15],[-15,90],[70,75],[-80,110],[20,140]];
    for(i=0;i<wpos.length;i++){
      var wx=cx+wpos[i][0]*s, wy=cy+50*s+bowOff+wpos[i][1]*s*0.7;
      g.fillStyle='rgba(255,255,255,0.85)';
      circle(g,wx,wy,11*s,'rgba(255,255,255,0.85)');
      circle(g,wx-10*s,wy+3*s,8*s,'rgba(255,255,255,0.85)');
      circle(g,wx+10*s,wy+3*s,8*s,'rgba(255,255,255,0.85)');
    }
    for(i=0;i<2;i++){
      var wx2=cx+[-25,30][i]*s, wy2=hy+[-25,-5][i]*s+bowOff*0.5;
      circle(g,wx2,wy2,8*s,'rgba(255,255,255,0.8)');
      circle(g,wx2+7*s,wy2+2*s,6*s,'rgba(255,255,255,0.8)');
    }
  } else if(typ==='dino'){
    // Rücken-Stacheln entlang Kopf (oben) und Rücken (Körper), plus Tupfen
    var tN=performance.now()/1000;
    g.save();
    g.fillStyle='#4c8033'; g.strokeStyle='#3e6b28'; g.lineWidth=1.6*s;
    for(i=0;i<5;i++){ // Kamm über dem Kopf
      var f=i/4, spX=cx+(f-0.5)*100*s, spY=hy+bowOff*0.5-76*s-Math.sin(f*Math.PI)*14*s;
      var hr=(16-Math.abs(f-0.5)*10)*s*(1+0.06*Math.sin(tN*3+i));
      g.beginPath(); g.moveTo(spX-9*s,spY);
      g.lineTo(spX,spY-hr); g.lineTo(spX+9*s,spY); g.closePath(); g.fill(); g.stroke();
    }
    for(i=0;i<6;i++){ // Stacheln am Rücken (rechte Körperseite)
      var ba=-0.9+i*0.36;
      var bx3=cx+Math.cos(ba)*116*s, by3=cy+70*s+bowOff+Math.sin(ba)*106*s;
      g.beginPath(); g.moveTo(bx3-6*s,by3);
      g.lineTo(bx3+8*s,by3-18*s); g.lineTo(bx3+16*s,by3+4*s); g.closePath(); g.fill(); g.stroke();
    }
    var rd=rnd(59);
    for(i=0;i<8;i++){
      var da=rd()*Math.PI*2, dr2=0.3+rd()*0.55;
      ell(g,cx+Math.cos(da)*95*s*dr2, cy+70*s+bowOff+Math.sin(da)*90*s*dr2,
        (5+rd()*5)*s,(4+rd()*4)*s,'rgba(46,100,34,0.45)');
    }
    g.restore();
  } else if(typ==='superheld'){
    // Rotes Cape hinter den Schultern + Brust-Stern-Emblem
    var tS=performance.now()/1000;
    var wob=Math.sin(tS*2.4)*10*s;
    g.save();
    g.fillStyle='#d0342c'; g.strokeStyle='#9c2115'; g.lineWidth=2*s; g.lineJoin='round';
    g.beginPath();
    g.moveTo(cx-80*s,hy+34*s+bowOff*0.5);
    g.quadraticCurveTo(cx-150*s,cy+120*s+bowOff,cx-96*s,cy+232*s+bowOff);
    g.quadraticCurveTo(cx,cy+270*s+bowOff+wob,cx+96*s,cy+232*s+bowOff);
    g.quadraticCurveTo(cx+150*s,cy+120*s+bowOff,cx+80*s,hy+34*s+bowOff*0.5);
    g.closePath(); g.fill(); g.stroke();
    g.restore();
    // Brust-Emblem: goldener Schild mit Stern
    g.save();
    ell(g,cx,cy+92*s+bowOff,34*s,38*s,'#f5c542');
    g.strokeStyle='#b8860b'; g.lineWidth=2.5*s;
    g.beginPath(); g.ellipse(cx,cy+92*s+bowOff,34*s,38*s,0,0,Math.PI*2); g.stroke();
    Art.drawSticker(g,'stern',cx,cy+92*s+bowOff,22*s,'#d0342c');
    Art.drawSticker(g,'stern',cx,cy+92*s+bowOff,9*s,'#ffe9a8');
    g.restore();
  } else if(typ==='schnee'){
    // Schneeflocken-Muster + Glitzer-Funkeln
    var tW=performance.now()/1000;
    var fl=[[-55,20],[35,-45],[ -10,85],[70,55],[-80,95],[20,145]];
    for(i=0;i<fl.length;i++){
      var fx=cx+fl[i][0]*s, fy=cy+60*s+bowOff+fl[i][1]*s*0.75;
      g.strokeStyle='rgba(255,255,255,0.9)'; g.lineWidth=2*s; g.lineCap='round';
      for(var k6=0;k6<6;k6++){
        var fa2=k6*Math.PI/3;
        g.beginPath(); g.moveTo(fx,fy);
        g.lineTo(fx+Math.cos(fa2)*11*s, fy+Math.sin(fa2)*11*s); g.stroke();
      }
      circle(g,fx,fy,2.4*s,'rgba(255,255,255,0.95)');
    }
    var rs=rnd(77);
    for(i=0;i<12;i++){ // Funkeln
      var sa=rs()*Math.PI*2, sr=0.2+rs()*0.65;
      var sx2=cx+Math.cos(sa)*105*s*sr;
      var sy2=(i<8? cy+70*s+bowOff+Math.sin(sa)*92*s*sr : hy+bowOff*0.5+Math.sin(sa)*70*s*sr);
      var twk=0.5+0.5*Math.sin(tW*3.5+i*1.3);
      Art.drawSticker(g,'stern',sx2,sy2,(2.5+2.5*twk)*s,'rgba(255,255,255,'+(0.4+0.55*twk).toFixed(2)+')');
    }
  } else if(typ==='kaktus'){
    // Kleine V-Stacheln über Körper+Kopf (rosa Blüte: drawKopfDeko)
    var rk2=rnd(91);
    g.strokeStyle='rgba(255,242,220,0.85)'; g.lineWidth=1.7*s; g.lineCap='round';
    for(i=0;i<18;i++){
      var ka2=rk2()*Math.PI*2, kr3=0.25+rk2()*0.6;
      var kx3=cx+Math.cos(ka2)*100*s*kr3;
      var ky3=(i<12? cy+70*s+bowOff+Math.sin(ka2)*92*s*kr3 : hy+bowOff*0.5+Math.sin(ka2)*74*s*kr3);
      g.beginPath(); g.moveTo(kx3-4*s,ky3+3*s); g.lineTo(kx3,ky3-2*s); g.lineTo(kx3+4*s,ky3+3*s); g.stroke();
    }
    // hellere Bauch-Rippen
    g.strokeStyle='rgba(21,70,30,0.35)'; g.lineWidth=2.2*s;
    for(i=-1;i<=1;i++){
      g.beginPath(); g.moveTo(cx+i*40*s,cy-8*s+bowOff);
      g.quadraticCurveTo(cx+i*52*s,cy+80*s+bowOff,cx+i*40*s,cy+160*s+bowOff); g.stroke();
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

// Kopf-Deko nach der Frisur: Einhorn-Horn, Robo-Antenne, Krone, Helm, Piratenhut, Zauberhut
function drawKopfDeko(g, m, cx, hy, s){
  var t = performance.now()/1000;
  if(m.muster==='einhorn'){
    // Goldenes Horn, groß und deutlich, mit Glanzpunkt
    var baseY = hy-70*s, wB=17*s, h=64*s;
    g.save();
    g.fillStyle='#f5c542'; g.strokeStyle='#b8860b'; g.lineWidth=2.5*s; g.lineJoin='round';
    g.beginPath(); g.moveTo(cx-wB,baseY); g.lineTo(cx+wB,baseY); g.lineTo(cx,baseY-h); g.closePath();
    g.fill(); g.stroke();
    // Gold-Windungen
    g.strokeStyle='#de9f22'; g.lineWidth=2.2*s;
    for(var i=1;i<5;i++){ var f=i/5; var ty=baseY-f*h; var tw=wB*(1-f);
      g.beginPath(); g.moveTo(cx-tw,ty); g.lineTo(cx+tw,ty); g.stroke(); }
    // Glanzpunkt an der Spitze
    circle(g,cx,baseY-h+4*s,6*s,'rgba(255,255,255,0.9)');
    circle(g,cx,baseY-h+4*s,2.5*s,'#fff');
    Art.drawSticker(g,'stern',cx+10*s,baseY-h+10*s,6*s+2*s*Math.sin(t*4),'rgba(255,240,160,0.95)');
    g.restore();
  } else if(m.muster==='robo'){
    // Antenne mit Kugel, ragt sichtbar über die Kopfform
    g.strokeStyle='#454e57'; g.lineWidth=4.5*s; g.lineCap='round';
    g.beginPath(); g.moveTo(cx,hy-84*s); g.lineTo(cx,hy-126*s); g.stroke();
    g.strokeStyle='#7b8894'; g.lineWidth=1.6*s;
    g.beginPath(); g.moveTo(cx-5*s,hy-96*s); g.lineTo(cx+5*s,hy-96*s); g.stroke();
    g.beginPath(); g.moveTo(cx-4*s,hy-108*s); g.lineTo(cx+4*s,hy-108*s); g.stroke();
    ring(g,cx,hy-136*s,11*s,'#e74c3c');
    circle(g,cx,hy-136*s,11*s,'#c0392b');
    circle(g,cx,hy-136*s,7*s,'#e74c3c');
    circle(g,cx-3*s,hy-139*s,3*s,'#ffd6cd');
    // Blitz-Funkeln an der Kugel
    var fa=(0.5+0.5*Math.sin(t*5));
    Art.drawSticker(g,'stern',cx+14*s,hy-142*s,(4+3*fa)*s,'rgba(255,220,120,'+(0.5+0.5*fa).toFixed(2)+')');
  } else if(m.muster==='prinzessin'){
    // Goldene Krone mit 3 Zacken + Rubinen
    var by=hy-84*s;
    g.save();
    g.fillStyle='#f5c542'; g.strokeStyle='#b8860b'; g.lineWidth=2.5*s; g.lineJoin='round';
    g.beginPath();
    g.moveTo(cx-46*s,by); g.lineTo(cx-46*s,by-26*s); g.lineTo(cx-23*s,by-8*s);
    g.lineTo(cx,by-38*s); g.lineTo(cx+23*s,by-8*s); g.lineTo(cx+46*s,by-26*s);
    g.lineTo(cx+46*s,by); g.closePath(); g.fill(); g.stroke();
    circle(g,cx,by-38*s,5*s,'#e74c3c');
    circle(g,cx-46*s,by-28*s,4*s,'#e74c3c'); circle(g,cx+46*s,by-28*s,4*s,'#e74c3c');
    circle(g,cx-20*s,by+8*s,4.5*s,'#e74c3c'); circle(g,cx+20*s,by+8*s,4.5*s,'#9b59b6');
    circle(g,cx,by+8*s,4.5*s,'#3498db');
    Art.drawSticker(g,'stern',cx,by-50*s,(5+2*Math.sin(t*3))*s,'rgba(255,250,190,0.95)');
    g.restore();
  } else if(m.muster==='bau'){
    // Gelber Bauarbeiter-Helm
    var hyy=hy-58*s;
    g.save();
    g.fillStyle='#f4c20d'; g.strokeStyle='#c79408'; g.lineWidth=2.5*s;
    g.beginPath(); g.arc(cx,hyy,64*s,Math.PI,0); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(cx,hyy,72*s,10*s,0,0,0); g.fill(); g.stroke();
    g.fillStyle='#de9f22'; g.fillRect(cx-5*s,hyy-64*s,10*s,64*s);
    g.fillStyle='rgba(255,255,255,0.4)';
    g.beginPath(); g.ellipse(cx-30*s,hyy-38*s,16*s,8*s,-0.5,0,Math.PI*2); g.fill();
    g.restore();
  } else if(m.muster==='pirat'){
    // Dreieckshut mit Totenkopf
    var py=hy-70*s;
    g.save();
    g.fillStyle='#23262b'; g.strokeStyle='#0e1013'; g.lineWidth=2.5*s; g.lineJoin='round';
    g.beginPath();
    g.moveTo(cx-72*s,py); g.quadraticCurveTo(cx,py-70*s,cx+72*s,py);
    g.quadraticCurveTo(cx,py-18*s,cx-72*s,py); g.closePath(); g.fill(); g.stroke();
    // Goldener Rand
    g.strokeStyle='#f5c542'; g.lineWidth=3*s;
    g.beginPath(); g.moveTo(cx-72*s,py); g.quadraticCurveTo(cx,py-18*s,cx+72*s,py); g.stroke();
    // Totenkopf
    circle(g,cx,py-34*s,10*s,'#f7f2e8');
    circle(g,cx-4*s,py-37*s,2.2*s,'#23262b'); circle(g,cx+4*s,py-37*s,2.2*s,'#23262b');
    g.fillStyle='#f7f2e8'; g.fillRect(cx-6*s,py-27*s,12*s,5*s);
    g.restore();
  } else if(m.muster==='zauberer'){
    // Spitzer Sternhut + schwebende Zauber-Punkt-Partikel
    var zy=hy-66*s;
    g.save();
    g.fillStyle='#5f3f96'; g.strokeStyle='#3d2566'; g.lineWidth=2.5*s; g.lineJoin='round';
    g.beginPath();
    g.moveTo(cx-56*s,zy+16*s); g.quadraticCurveTo(cx,zy+34*s,cx+56*s,zy+16*s);
    g.lineTo(cx+14*s,zy+8*s); g.lineTo(cx-4*s,zy-88*s); g.lineTo(cx-16*s,zy+8*s);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle='#f5c542'; g.lineWidth=3*s;
    g.beginPath(); g.moveTo(cx-52*s,zy+15*s); g.quadraticCurveTo(cx,zy+31*s,cx+52*s,zy+15*s); g.stroke();
    Art.drawSticker(g,'stern',cx-10*s,zy-38*s,7*s,'#ffd24d');
    Art.drawSticker(g,'stern',cx+8*s,zy-12*s,5*s,'#ff9eb5');
    Art.drawSticker(g,'stern',cx-2*s,zy-64*s,5*s,'#c39bd3');
    // schwebende Partikel (idle)
    for(var i=0;i<5;i++){
      var pa=t*0.9+i*(Math.PI*2/5);
      var px=cx+Math.cos(pa)*52*s, pyy=zy+8*s+Math.sin(pa)*14*s-10*s;
      circle(g,px,pyy,(2.5+Math.sin(t*3+i))*s, i%2?'rgba(255,210,77,0.9)':'rgba(195,155,211,0.9)');
    }
    circle(g,cx-4*s,zy-88*s,4*s,'#ffd24d');
    g.restore();
  } else if(m.muster==='kaktus'){
    // Rosa Blüte auf dem Kopf
    var tK=performance.now()/1000;
    var byb=hy-86*s, puls=1+0.08*Math.sin(tK*2.6);
    g.save();
    Art.drawSticker(g,'blume',cx,byb,17*s*puls,'#ff9ec4');
    ellipsePetals(g,cx,byb,17*s*puls,'#ff9ec4');
    circle(g,cx,byb,5.5*s,'#ffe06e');
    g.restore();
  }
}
function ellipsePetals(g,x,y,r,c){ // größere Blütenblätter für die Kaktus-Blüte
  g.save(); g.translate(x,y); g.fillStyle=c;
  for(var j=0;j<7;j++){ var a=j*Math.PI*2/7;
    g.save(); g.rotate(a);
    g.beginPath(); g.ellipse(0,-r*0.72,r*0.4,r*0.62,0,0,Math.PI*2); g.fill();
    g.restore();
  }
  g.restore();
}
function ring(g,x,y,r,c){ g.strokeStyle=c; g.lineWidth=2; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.stroke(); }

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

// Eis: Waffel + Kugeln, gezeichnet in der Bären-Perspektive (rechte Seite)
Art.EIS_FARBEN = ['#ff9eb5','#e8c878','#8fd48a','#7ab8f5','#c39bd3'];
Art.WAFFELN = ['tue','bech','herz'];
Art.drawEis = function(g, eis, cx, cy, s){
  // eis: {waffel, kugeln:[{c,scale}..], leck}
  var wx=cx+150*s, wy=cy+80*s;
  g.save();
  // Waffel
  g.fillStyle='#d9a94f'; g.strokeStyle='#b8842f'; g.lineWidth=2.5*s;
  if(eis.waffel===0){ // Tüte
    g.beginPath(); g.moveTo(wx-34*s,wy); g.lineTo(wx+34*s,wy); g.lineTo(wx,wy+86*s); g.closePath();
    g.fill(); g.stroke();
    g.strokeStyle='rgba(150,100,40,0.5)'; g.lineWidth=1.6*s;
    for(var i=-2;i<=2;i++){ g.beginPath(); g.moveTo(wx+i*13*s-8*s,wy+4*s); g.lineTo(wx+i*7*s,wy+80*s); g.stroke(); }
    for(var j=1;j<5;j++){ g.beginPath(); g.moveTo(wx-34*s+34*s*j/2.5,wy+j*17*s); g.lineTo(wx+34*s-34*s*j/2.5,wy+j*17*s); g.stroke(); }
  } else if(eis.waffel===1){ // Becher
    g.beginPath(); g.roundRect ? g.roundRect(wx-38*s,wy,76*s,60*s,8*s) : g.rect(wx-38*s,wy,76*s,60*s);
    g.fillStyle='#f2e2c4'; g.fill(); g.stroke();
    g.fillStyle='#d9a94f'; g.fillRect(wx-38*s,wy,76*s,10*s);
  } else { // Herzwaffel
    Art.drawSticker(g,'herz',wx,wy+34*s,44*s,'#d9a94f');
    g.strokeStyle='#b8842f';
    Art.drawSticker(g,'herz',wx,wy+34*s,44*s,'rgba(0,0,0,0)');
    g.beginPath();
  }
  // Kugeln gestapelt (unterste zuerst)
  for(var k=0;k<eis.kugeln.length;k++){
    var kg=eis.kugeln[k];
    var ky2=wy-(k*26+14)*s;
    var kr=22*s*(kg.scale===undefined?1:kg.scale);
    circle(g,wx,ky2,kr, Art.EIS_FARBEN[kg.c]);
    g.strokeStyle='rgba(0,0,0,0.12)'; g.lineWidth=2*s;
    g.beginPath(); g.arc(wx,ky2,kr,0,Math.PI*2); g.stroke();
    circle(g,wx-kr*0.3,ky2-kr*0.35,kr*0.22,'rgba(255,255,255,0.7)');
  }
  // Zunge zum obersten Kugel-Lecken
  if(eis.leck && eis.kugeln.length){
    var topKY=wy-((eis.kugeln.length-1)*26+14)*s;
    var lt=performance.now()/1000;
    var lx=cx+60*s, ly=cy-20*s;
    var dx=wx-lx, dy=topKY-ly;
    var len=Math.hypot(dx,dy)||1;
    var p=(Math.sin(lt*6)+1)/2;
    g.strokeStyle='#ff8fa8'; g.lineWidth=7*s; g.lineCap='round';
    g.beginPath(); g.moveTo(lx,ly);
    g.quadraticCurveTo(lx+dx*0.5, ly+dy*0.5+10*s, lx+dx*p, ly+dy*p); g.stroke();
    Art.drawSticker(g,'herz',lx+dx*p, ly+dy*p-8*s, 5*s, 'rgba(255,143,168,0.8)');
  }
  g.restore();
};

// Foto-Rahmen: Sternchen / Blümchen / Gold + Polaroid-Look + Blitz/Flash
Art.FOTO_RAHMEN = ['sterne','blumen','gold'];
Art.drawFotoRahmen = function(g, rahmen, flash, badge, W, H){
  var t=performance.now()/1000;
  var x0=W/2-250, y0=40, fw=500, fh=470;
  g.save();
  if(rahmen===2){ // Gold
    g.strokeStyle='#d4af37'; g.lineWidth=10;
    g.strokeRect(x0,y0,fw,fh);
    g.strokeStyle='#8a6d1a'; g.lineWidth=3; g.strokeRect(x0+8,y0+8,fw-16,fh-16);
    [[x0,y0],[x0+fw,y0],[x0,y0+fh],[x0+fw,y0+fh]].forEach(function(p){
      Art.drawSticker(g,'stern',p[0],p[1],16,'#d4af37');
    });
  } else if(rahmen===1){ // Blumen
    g.strokeStyle='#e89ab8'; g.lineWidth=6; g.strokeRect(x0,y0,fw,fh);
    for(var i=0;i<12;i++){
      var px=x0+(i%6)*fw/5, py=(i<6? y0 : y0+fh);
      Art.drawSticker(g,'blume',px,py,12,'rgba(232,154,184,0.95)');
    }
  } else { // Sterne
    g.strokeStyle='#9b59b6'; g.lineWidth=6; g.setLineDash([18,12]);
    g.strokeRect(x0,y0,fw,fh); g.setLineDash([]);
    for(var j=0;j<14;j++){
      var sa=j/14*Math.PI*2 + t*0.3;
      Art.drawSticker(g,'stern',x0+fw/2+Math.cos(sa)*(fw/2+14), y0+fh/2+Math.sin(sa)*(fh/2+14), 10,'#ffd24d');
    }
  }
  if(badge){
    g.fillStyle='rgba(255,255,255,0.95)'; g.strokeStyle='#7a4b8f'; g.lineWidth=3;
    g.beginPath(); g.roundRect ? g.roundRect(W/2-120,H-70,240,48,24) : g.rect(W/2-120,H-70,240,48);
    g.fill(); g.stroke();
    g.fillStyle='#7a4b8f'; g.font='bold 24px sans-serif'; g.textAlign='center';
    g.fillText('📸 Klick!', W/2, H-38);
  }
  if(flash>0){
    g.globalAlpha=Math.min(1,flash);
    g.fillStyle='#fff'; g.fillRect(0,0,W,H);
    g.globalAlpha=1;
  }
  g.restore();
};

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
