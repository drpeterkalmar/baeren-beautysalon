// game.js — Loop, Input (Pointer), Partikel, Letterbox — v9
(function(){
'use strict';
var S = window.BSSalon;
window.__errors = [];
window.onerror = function(msg,src,line){ window.__errors.push(msg+' @'+line);
  var e=document.getElementById('err'); if(e) e.textContent = '⚠️ '+msg; };
var G = window.BSGame = {};

var cv = document.getElementById('cv');
var g = cv.getContext('2d');
var scale=1, offX=0, offY=0;

function resize(){
  var dpr = Math.min(2, window.devicePixelRatio||1);
  cv.width = innerWidth*dpr; cv.height = innerHeight*dpr;
  cv.style.width = innerWidth+'px'; cv.style.height = innerHeight+'px';
  scale = Math.min(innerWidth/S.VW, innerHeight/S.VH);
  offX = (innerWidth - S.VW*scale)/2;
  offY = (innerHeight - S.VH*scale)/2;
  g.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resize);
resize();
S.buildUI();

// Partikel
var parts = [];
function spawn(x,y,c,n,spd,life,size){
  for(var i=0;i<n;i++){
    var a=Math.random()*Math.PI*2, v=(0.3+Math.random()*0.7)*spd;
    parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-spd*0.6,
      c:c,life:life*(0.6+Math.random()*0.6),t:0,size:size*(0.6+Math.random()*0.8),
      star:Math.random()<0.5, wave:0});
  }
}
// Parfum-Sprühstoß: Duft-Farbwolken vom Flakon zum Bären
G.parfumSpray = function(c){
  var x0=30, y0=S.VH*0.5;
  for(var i=0;i<26;i++){
    var t=i/26;
    parts.push({x:x0+t*(S.VW*0.48-x0)+(Math.random()-0.5)*30,
      y:y0+(S.VH*0.42-y0)*t+(Math.random()-0.5)*40,
      vx:60+Math.random()*40, vy:-30+Math.random()*30,
      c:c, life:1.2+Math.random(), t:0, size:5+Math.random()*6, star:false, wave:2});
  }
};
// Spa-Gurkentupfer: grünes Spritzen
G.spaTupfer = function(x,y){
  spawn(x,y,'#7ec850',8,70,0.8,5);
};
// Geburtstags-Konfetti-Burst
G.konfettiBurst = function(x,y){
  var cols=['#e91e63','#f1c40f','#2ecc71','#3498db','#9b59b6','#ff8fb3'];
  for(var i=0;i<60;i++){
    var a=Math.random()*Math.PI*2, v=120+Math.random()*260;
    parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-200,
      c:cols[i%cols.length],life:1.4+Math.random()*0.8,t:0,size:6+Math.random()*6,star:false,wave:0});
  }
};
// Überraschungs-Wahl: kurze Sternchen-Explosion
G.sternExplosion = function(x,y){
  var cols=['#ffd24d','#ff9eb5','#fff','#c39bd3'];
  for(var i=0;i<28;i++){
    var a=Math.random()*Math.PI*2, v=150+Math.random()*240;
    parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,
      c:cols[i%cols.length],life:0.9+Math.random()*0.5,t:0,size:10+Math.random()*10,star:true,wave:0});
  }
};
function stepParts(dt){
  for(var i=parts.length-1;i>=0;i--){
    var p=parts[i]; p.t+=dt;
    if(p.t>p.life){ parts.splice(i,1); continue; }
    if(p.wAmp){ // wellenförmige Föhn-Partikel
      p.x+=p.vx*dt;
      p.y+=Math.sin((performance.now()/1000)*10+p.wave)*p.wAmp*dt*3 - 20*dt;
    } else {
      p.vy+=500*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
    }
  }
}
function drawParts(){
  parts.forEach(function(p){
    var a=1-p.t/p.life;
    g.globalAlpha=a;
    if(p.star) window.BSArt.drawSticker(g,'stern',p.x,p.y,p.size,p.c);
    else { g.fillStyle=p.c; g.fillRect(p.x,p.y,p.size,p.size*1.4); }
  });
  g.globalAlpha=1;
}

// Input
var down=false, holdBtn=null, lastX=0, lastY=0;
function toVirt(e){
  var r=cv.getBoundingClientRect();
  return [(e.clientX-r.left-offX)/scale, (e.clientY-r.top-offY)/scale];
}
cv.addEventListener('pointerdown', function(e){
  e.preventDefault(); down=true;
  var p=toVirt(e); lastX=p[0]; lastY=p[1];
  var b=S.hitButton(p[0],p[1]);
  if(b){
    if(b.hold){ holdBtn=b; S.foehn=true; }
    else if(b.onTap) b.onTap();
    return;
  }
  S.tapBear(p[0],p[1]);
}, {passive:false});
cv.addEventListener('pointermove', function(e){
  e.preventDefault();
  if(!down) return;
  var p=toVirt(e);
  if(S.state==='waschen') S.tapBear(p[0],p[1]);
  if(S.state==='massage') S.dragBear(p[0],p[1],lastX,lastY);
  if(S.state==='zuckerwatte' && S._stabDrag && S.watte){ S.watte.sx=p[0]; S.watte.sy=p[1]; }
  lastX=p[0]; lastY=p[1];
}, {passive:false});
function up(e){ e&&e.preventDefault(); down=false; holdBtn=null; S.foehn=false; S._stabDrag=false; }
cv.addEventListener('pointerup', up, {passive:false});
cv.addEventListener('pointercancel', up, {passive:false});
document.addEventListener('touchmove', function(e){ e.preventDefault(); }, {passive:false});

// Update-Logik pro Station
function update(dt){
  var b=S.baer;
  if(S.state==='waschen'){
    if(S.dusche && b.schaum>0){
      b.schaum=Math.max(0,b.schaum-dt*0.7);
      b.tropfen.length=0;
      var s=Math.min(S.VW,S.VH)/420;
      for(var i=0;i<4;i++) b.tropfen.push({x:S.VW*0.5+(Math.random()-0.5)*200*s,
        y:S.VH*0.35+Math.random()*260*s});
    } else { b.tropfen.length=0; if(b.schaum<=0) S.dusche=false; }
  }
  if(S.state==='foehnen'){
    var tgt = (S.foehn && b.schaum<0.1) ? 1 : 0;
    b.fluff += (tgt-b.fluff)*Math.min(1,dt*3);
    if(S.foehn){
      var t0=performance.now()/1000;
      for(var wi=0; wi<2; wi++){
        parts.push({x:200, y:150+(Math.random()-0.5)*40,
          vx:160+Math.random()*80, vy:0, c:'#cfe8ff', life:1.4, t:0,
          size:3, star:false, wave:t0*6+wi*2, wAmp:50});
      }
    }
  }
  if(S.state==='finish-done'){
    if(S.confetti>0){ S.confetti-=dt*60;
      spawn(Math.random()*S.VW, -10, ['#e91e63','#f1c40f','#2ecc71','#3498db','#9b59b6'][Math.floor(Math.random()*5)],3,120,2.5,7); }
    if(S.stars>0){ S.stars-=dt*60;
      spawn(Math.random()*S.VW, Math.random()*S.VH*0.5, '#ffd24d',2,80,1.5,8); }
  }
  if(S.state==='spa'){
    var stgt=(S.spaTarget)?1:0;
    b._spa=(b._spa||0)+((stgt?1:0)-(b._spa||0))*Math.min(1,dt*1.4);
    b.relax=Math.max(b.relax, b._spa);
  }
  // Eis: oberste Kugel schrumpft langsam beim Schlecken
  if(S.state==='eis' && S.eis && S.eis.leck && S.eis.kugeln.length){
    var top=S.eis.kugeln[S.eis.kugeln.length-1];
    top.scale=(top.scale===undefined?1:top.scale)-dt*0.06;
    if(top.scale<0.3) S.eis.kugeln.pop();
  }
  // Foto-Flash-Decay
  if(S.flash>0) S.flash=Math.max(0,S.flash-dt*5);
  if(S.state!=='spa' && S.spaTarget!==undefined && S.spaTarget===0 && b._spa!==undefined){
    b._spa=Math.max(0,b._spa-dt*0.6);
  }
  // Idle: Atmen + Blinzeln (alle Screens)
  b.breathe = (b.breathe||0)+dt;
  // Tanz: Pirouette abbauen
  if(S.tanz && S.tanz.spin>0) S.tanz.spin=Math.max(0, S.tanz.spin-dt*1.2);
  // Zuckerwatte: spin wächst Watte, Bär beißt zwischendurch ab
  if(S.state==='zuckerwatte' && S.watte){
    var wt=S.watte;
    wt.spin=Math.max(0,(wt.spin||0)-dt*0.25); // Spin lässt nach
    if(wt.spin>0) wt.lvl=Math.min(1, (wt.lvl||0)+dt*wt.spin*0.30);
    // gelegentlicher Abbeißer
    if(wt._bissT===undefined) wt._bissT=4+Math.random()*3;
    wt._bissT-=dt;
    if(wt._bissT<0 && wt.lvl>0.15){
      wt.lvl=Math.max(0.05, wt.lvl-0.22); wt.kau=1.4;
      wt._bissT=4+Math.random()*3.5;
    }
    if(wt.kau>0) wt.kau=Math.max(0,wt.kau-dt);
  }
  if(b._blinkT===undefined) b._blinkT = 2+Math.random()*3;
  b._blinkT -= dt;
  if(b._blinkT<0){ b.blink=1; if(b._blinkT<-0.12){ b.blink=0; b._blinkT=2.5+Math.random()*3.5; } }
  // Massage: Entspannung + Herzen
  if(S.state==='massage' && S.mass){
    var rt = Math.min(1, S.mass.prog/100);
    b.relax += (rt-b.relax)*Math.min(1,dt*2.5);
    for(var hi=S.mass.herzen.length-1;hi>=0;hi--){
      var h=S.mass.herzen[hi]; h.t=(h.t||0)+dt; h.a-=dt*0.7;
      // Spiral-Flug statt gerade auf
      var r=h.r0+h.t*70;
      h.x=h.ox+Math.cos(h.a0+h.t*3.2)*r;
      h.y=h.oy+Math.sin(h.a0+h.t*3.2)*r - h.t*30;
      if(h.a<=0) S.mass.herzen.splice(hi,1);
    }
  } else if(b.relax>0){
    b.relax=Math.max(0,b.relax-dt*0.8);
  }
  // Verbeugen animieren (finish-done: bow auslassen, stattdessen Jubel)
  var bt=0; // Verbeugung aus, wir feiern stattdessen
  if(!b._bow) b._bow=0;
  b._bow += (bt-b._bow)*Math.min(1,dt*2.5);
  b.bow = b._bow;
  // Jubel in finish-done hochfahren
  var jt = (S.state==='finish-done')?1:0;
  if(b._j===undefined) b._j=0;
  b._j = b._j + (jt-b._j)*Math.min(1,dt*3);
  b.jubel = b._j;
  // Ballon: Pust-Decay, Schreck-Zuck → danach lachen
  if(S.ballon){
    if(S.ballon.pust>0) S.ballon.pust=Math.max(0,S.ballon.pust-dt*1.6);
    if(S.ballon.schreck>0){
      S.ballon.schreck=Math.max(0,S.ballon.schreck-dt*0.9);
      if(S.ballon.schreck===0){ b.jubelT2=1.2; } // danach lacht er
    }
  }
  if(b.jubelT2>0){ b.jubelT2=Math.max(0,b.jubelT2-dt); b.jubel=Math.min(1,b.jubelT2); }
  if(S.zauber && S.zauber.pfote>0) S.zauber.pfote=Math.max(0,S.zauber.pfote-dt*1.1);
  // Hut kippt leicht beim Lachen (jubel>0) und in finish-done
  var hutTgt = (S.state==='finish-done' || (b.jubel||0)>0.3)?1:0;
  if(b._hutTil===undefined) b._hutTil=0;
  b._hutTil += (hutTgt-b._hutTil)*Math.min(1,dt*4);
  b.hutTilt = b._hutTil;
  stepParts(dt);
}

// Render + Loop
var lastT = performance.now();
function frame(t){
  var dt = Math.min(0.05,(t-lastT)/1000); lastT=t;
  update(dt);
  // Clear + Letterbox
  g.fillStyle='#2b1d3a';
  g.fillRect(0,0,innerWidth,innerHeight);
  g.save();
  g.translate(offX,offY);
  g.scale(scale,scale);
  g.beginPath(); g.rect(0,0,S.VW,S.VH); g.clip();
  S.draw(g);
  drawParts();
  // Föhn-Strahl visualisieren
  if(S.state==='foehnen' && S.foehn && S.baer.schaum<0.1){
    g.strokeStyle='rgba(160,220,255,0.7)'; g.lineWidth=3; g.setLineDash([8,10]);
    var s=Math.min(S.VW,S.VH)/420;
    for(var i=-2;i<=2;i++){
      g.beginPath();
      g.moveTo(195,150+i*12);
      g.quadraticCurveTo(300,180+i*30, S.VW*0.5, S.VH*0.45+i*20*s);
      g.stroke();
    }
    g.setLineDash([]);
  }
  // Dusche visualisieren
  if(S.state==='waschen' && S.dusche){
    g.fillStyle='#8a97a5';
    roundR(60,60,54,40,10); g.fill();
    g.strokeStyle='rgba(120,190,255,0.9)'; g.lineWidth=3;
    for(var k=-3;k<=3;k++){
      g.beginPath(); g.moveTo(87+k*7,100); g.lineTo(87+k*22,S.VH*0.55); g.stroke();
    }
  }
  g.restore();
  requestAnimationFrame(frame);
}
function roundR(x,y,w,h,r){
  g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
}
requestAnimationFrame(frame);
})();
