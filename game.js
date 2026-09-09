// game.js — Loop, Input (Pointer), Partikel, Letterbox
(function(){
'use strict';
var S = window.BSSalon;
window.__errors = [];
window.onerror = function(msg,src,line){ window.__errors.push(msg+' @'+line);
  var e=document.getElementById('err'); if(e) e.textContent = '⚠️ '+msg; };

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
      star:Math.random()<0.5});
  }
}
function stepParts(dt){
  for(var i=parts.length-1;i>=0;i--){
    var p=parts[i]; p.t+=dt;
    if(p.t>p.life){ parts.splice(i,1); continue; }
    p.vy+=500*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
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
  lastX=p[0]; lastY=p[1];
}, {passive:false});
function up(e){ e&&e.preventDefault(); down=false; holdBtn=null; S.foehn=false; }
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
    if(S.foehn) spawn(S.VW*0.5+(Math.random()-0.5)*300, S.VH*0.4+Math.random()*200,
      '#cfe8ff',1,60,0.6,3);
  }
  if(S.state==='finish-done'){
    if(S.confetti>0){ S.confetti-=dt*60;
      spawn(Math.random()*S.VW, -10, ['#e91e63','#f1c40f','#2ecc71','#3498db','#9b59b6'][Math.floor(Math.random()*5)],3,120,2.5,7); }
    if(S.stars>0){ S.stars-=dt*60;
      spawn(Math.random()*S.VW, Math.random()*S.VH*0.5, '#ffd24d',2,80,1.5,8); }
  }
  // Verbeugen animieren
  var bt=S.state==='finish-done'?1:0;
  if(!b._bow) b._bow=0;
  b._bow += (bt-b._bow)*Math.min(1,dt*2.5);
  b.bow = b._bow;
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
