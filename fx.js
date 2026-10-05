// fx.js — Farb-Mathe, Easing, gecachte Weich-Sprites (Glow/Schatten/Kugel/Strahlen), Grading,
// Qualitätsstufen und Partikel-Pool. Alles prozedural, alles Offscreen gebacken.
(function(){
'use strict';
var Fx = window.BSFx = {};
var TAU = Math.PI*2;
Fx.TAU = TAU;
window.BS_VERSION = '20.3';
// r20 Deko-Runde: neue Optik (Licht, Einrichtung, Glitzer) — ?deko=0 zeigt das alte Aussehen (A/B-Vergleich)
Fx.DEKO = !/[?&]deko=0(&|$)/.test(location.search||'');
// "Bewegung reduzieren" (Betriebssystem): weniger Wackeln, kein Bildschirm-Schütteln, weniger Partikelregen
Fx.RM = false;
try{
  var rmq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if(rmq){ Fx.RM = !!rmq.matches; var rmf=function(e){ Fx.RM=!!e.matches; Fx.RMver=(Fx.RMver||0)+1; };
    if(rmq.addEventListener) rmq.addEventListener('change',rmf); else if(rmq.addListener) rmq.addListener(rmf); }
}catch(e){}

// ---------------------------------------------------------------- Mathe / Easing
Fx.lerp = function(a,b,t){ return a+(b-a)*t; };
Fx.clamp = function(v,a,b){ return v<a?a:(v>b?b:v); };
Fx.seg = function(t,a,b){ return b===a ? (t>=b?1:0) : Fx.clamp((t-a)/(b-a),0,1); };
Fx.ease = {
  inQuad: function(t){ return t*t; },
  outQuad: function(t){ return 1-(1-t)*(1-t); },
  outCubic: function(t){ var u=1-t; return 1-u*u*u; },
  inOutCubic: function(t){ return t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; },
  outBack: function(t){ var c=1.70158, u=t-1; return 1+(c+1)*u*u*u+c*u*u; },
  outElastic: function(t){ if(t<=0) return 0; if(t>=1) return 1; return Math.pow(2,-10*t)*Math.sin((t*10-0.75)*TAU/3)+1; }
};
// deterministisches Rauschen (für gebackene Texturen)
Fx.rand = function(seed){ var s=seed>>>0||1; return function(){ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)%100000)/100000; }; };

// ---------------------------------------------------------------- Farben
var cache = {};
function parse(c){
  if(typeof c!=='string' || !c) return [196,160,128,1];
  var hit = cache[c]; if(hit) return hit;
  var r=196,g=160,b=128,a=1, m;
  if(c[0]==='#'){
    var h=c.slice(1);
    if(h.length===3||h.length===4){ r=parseInt(h[0]+h[0],16); g=parseInt(h[1]+h[1],16); b=parseInt(h[2]+h[2],16); if(h.length===4) a=parseInt(h[3]+h[3],16)/255; }
    else if(h.length>=6){ r=parseInt(h.slice(0,2),16); g=parseInt(h.slice(2,4),16); b=parseInt(h.slice(4,6),16); if(h.length===8) a=parseInt(h.slice(6,8),16)/255; }
  } else if((m=c.match(/rgba?\(([^)]+)\)/))){
    var p=m[1].split(',').map(parseFloat); r=p[0]; g=p[1]; b=p[2]; a=p.length>3?p[3]:1;
  }
  if(!(r>=0)) r=196; if(!(g>=0)) g=160; if(!(b>=0)) b=128; if(!(a>=0)) a=1;
  return (cache[c]=[r,g,b,a]);
}
Fx.parse = parse;
function str(r,g,b,a){
  r=Math.round(Fx.clamp(r,0,255)); g=Math.round(Fx.clamp(g,0,255)); b=Math.round(Fx.clamp(b,0,255));
  return (a===undefined||a>=1) ? 'rgb('+r+','+g+','+b+')' : 'rgba('+r+','+g+','+b+','+(+a).toFixed(3)+')';
}
Fx.mix = function(c1,c2,t){
  var a=parse(c1), b=parse(c2);
  return str(a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t, a[3]+(b[3]-a[3])*t);
};
Fx.alpha = function(c,al){ var a=parse(c); return str(a[0],a[1],a[2],a[3]*al); };
Fx.lum = function(c){ var a=parse(c); return (0.299*a[0]+0.587*a[1]+0.114*a[2])/255; };
// warmes Licht (Keylight oben links) und warmer, leicht violetter Schatten — nie grau/schwarz
Fx.warmLight = function(c,t){ return Fx.mix(c,'#fff3de',t===undefined?0.4:t); };
Fx.warmShadow = function(c,t){
  var a=parse(c);
  var d=str(a[0]*0.58+22, a[1]*0.46+8, a[2]*0.52+22);
  return Fx.mix(c,d,t===undefined?0.5:t);
};
// shade(c, -100..100): negativ = dunkler (warm), positiv = heller
Fx.shade = function(c,amt){
  amt=+amt||0;
  return amt>=0 ? Fx.warmLight(c,Math.min(1,amt/100)) : Fx.warmShadow(c,Math.min(1,-amt/60));
};

// ---------------------------------------------------------------- Pfad-Helfer
Fx.rr = function(g,x,y,w,h,r){
  r=Math.max(0,Math.min(r,w/2,h/2));
  g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
};
// Stern-Polygon (weich wird er über lineJoin:'round'-Kontur in derselben Farbe)
Fx.starPath = function(g,x,y,r,inner,pts){
  inner=inner||0.5; pts=pts||5;
  g.beginPath();
  for(var i=0;i<pts*2;i++){
    var a=-Math.PI/2+i*Math.PI/pts, rr=i%2?r*inner:r;
    if(i===0) g.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); else g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);
  }
  g.closePath();
};
Fx.heartPath = function(g,x,y,r){
  g.beginPath();
  g.moveTo(x,y+r*0.9);
  g.bezierCurveTo(x-r*1.25,y+r*0.05, x-r*0.95,y-r*1.0, x,y-r*0.38);
  g.bezierCurveTo(x+r*0.95,y-r*1.0, x+r*1.25,y+r*0.05, x,y+r*0.9);
  g.closePath();
};
Fx.flowerPath = function(g,x,y,r){
  g.beginPath();
  for(var i=0;i<5;i++){ var a=-Math.PI/2+i*TAU/5; g.moveTo(x+Math.cos(a)*r*0.55+r*0.45,y+Math.sin(a)*r*0.55); g.arc(x+Math.cos(a)*r*0.55,y+Math.sin(a)*r*0.55,r*0.45,0,TAU); }
};

// ---------------------------------------------------------------- Sprite-Cache
function canvas(w,h){ var c=document.createElement('canvas'); c.width=Math.max(1,Math.ceil(w)); c.height=Math.max(1,Math.ceil(h)); return c; }
Fx.canvas = canvas;
var SP = {};
function sprite(key,w,h,fn){ var c=SP[key]; if(c) return c; c=canvas(w,h); fn(c.getContext('2d'),c.width,c.height); SP[key]=c; return c; }
Fx.sprite = sprite;
var S = Fx.S = {};
S.glow = function(col){
  return sprite('glow'+col,128,128,function(g){
    var gr=g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,Fx.alpha(col,1)); gr.addColorStop(0.25,Fx.alpha(col,0.6)); gr.addColorStop(0.6,Fx.alpha(col,0.16)); gr.addColorStop(1,Fx.alpha(col,0));
    g.fillStyle=gr; g.fillRect(0,0,128,128);
  });
};
S.shadow = function(){
  return sprite('shadow',128,64,function(g){
    g.save(); g.scale(1,0.5);
    var gr=g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,'rgba(70,36,40,0.55)'); gr.addColorStop(0.45,'rgba(70,36,40,0.32)'); gr.addColorStop(1,'rgba(70,36,40,0)');
    g.fillStyle=gr; g.fillRect(0,0,128,128); g.restore();
  });
};
// plastische Kugel: Licht oben links, Schatten unten rechts, Rückstrahlung, Glanzpunkt
S.ball = function(col){
  return sprite('ball'+col,96,96,function(g){
    var c=48, R=47;
    var gr=g.createRadialGradient(c-16,c-18,2,c+4,c+6,R*1.15);
    gr.addColorStop(0,Fx.warmLight(col,0.6)); gr.addColorStop(0.45,col); gr.addColorStop(1,Fx.warmShadow(col,0.55));
    g.fillStyle=gr; g.beginPath(); g.arc(c,c,R,0,TAU); g.fill();
    g.save(); g.clip();
    var rim=g.createRadialGradient(c-8,c-10,R*0.7,c,c,R*1.02);
    rim.addColorStop(0,'rgba(255,240,220,0)'); rim.addColorStop(1,Fx.alpha(Fx.warmLight(col,0.7),0.35));
    g.globalCompositeOperation='source-atop'; g.fillStyle=rim; g.fillRect(c,c,R,R);
    g.restore();
    var hl=g.createRadialGradient(c-17,c-19,0,c-17,c-19,15);
    hl.addColorStop(0,'rgba(255,255,255,0.85)'); hl.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=hl; g.fillRect(0,0,96,96);
  });
};
S.rays = function(){
  return sprite('rays',512,512,function(g){
    g.translate(256,256);
    for(var i=0;i<14;i++){
      g.save(); g.rotate(i*TAU/14);
      var gr=g.createLinearGradient(0,0,256,0);
      gr.addColorStop(0,'rgba(255,236,196,0.55)'); gr.addColorStop(1,'rgba(255,236,196,0)');
      g.fillStyle=gr; g.beginPath(); g.moveTo(0,0); g.lineTo(256,-26); g.quadraticCurveTo(262,0,256,26); g.closePath(); g.fill();
      g.restore();
    }
    var fade=g.createRadialGradient(0,0,0,0,0,256);
    fade.addColorStop(0,'rgba(0,0,0,0)'); fade.addColorStop(0.8,'rgba(0,0,0,0)'); fade.addColorStop(1,'rgba(0,0,0,1)');
    g.globalCompositeOperation='destination-out'; g.fillStyle=fade; g.fillRect(-256,-256,512,512);
  });
};
function tinted(key,col,size,fn){
  return sprite(key+col,size,size,function(g,w){
    fn(g,w/2,w*0.42);
    // weiche Volumen-Schattierung über jedem Sticker-Sprite
    g.globalCompositeOperation='source-atop';
    var gr=g.createLinearGradient(0,0,w,w);
    gr.addColorStop(0,'rgba(255,248,236,0.5)'); gr.addColorStop(0.5,'rgba(255,248,236,0)'); gr.addColorStop(1,'rgba(90,40,60,0.25)');
    g.fillStyle=gr; g.fillRect(0,0,w,w);
  });
}
S.star = function(col){ return tinted('star',col,64,function(g,c,r){ g.fillStyle=col; Fx.starPath(g,c,c+2,r,0.52); g.fill(); g.lineJoin='round'; g.lineWidth=r*0.22; g.strokeStyle=col; g.stroke(); }); };
S.heart = function(col){ return tinted('heart',col,64,function(g,c,r){ g.fillStyle=col; Fx.heartPath(g,c,c+2,r); g.fill(); }); };
S.flower = function(col){ return tinted('flower',col,64,function(g,c,r){ g.fillStyle=col; Fx.flowerPath(g,c,c,r); g.fill(); g.fillStyle='#ffe07a'; g.beginPath(); g.arc(c,c,r*0.3,0,TAU); g.fill(); }); };
S.dot = function(col){
  return sprite('dot'+col,48,48,function(g){
    var gr=g.createRadialGradient(24,24,0,24,24,24);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.25,Fx.alpha(col,0.95)); gr.addColorStop(1,Fx.alpha(col,0));
    g.fillStyle=gr; g.fillRect(0,0,48,48);
  });
};
S.twinkle = function(){
  return sprite('twinkle',64,64,function(g){
    var gr=g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,252,240,0.9)'); gr.addColorStop(0.3,'rgba(255,236,190,0.35)'); gr.addColorStop(1,'rgba(255,236,190,0)');
    g.fillStyle=gr; g.fillRect(0,0,64,64);
    g.fillStyle='rgba(255,255,248,0.95)';
    g.beginPath(); g.moveTo(32,2); g.quadraticCurveTo(35,29,62,32); g.quadraticCurveTo(35,35,32,62); g.quadraticCurveTo(29,35,2,32); g.quadraticCurveTo(29,29,32,2); g.fill();
  });
};
S.bubble = function(){
  return sprite('bubble',64,64,function(g){
    var gr=g.createRadialGradient(26,24,4,32,32,30);
    gr.addColorStop(0,'rgba(255,255,255,0.15)'); gr.addColorStop(0.75,'rgba(225,240,255,0.25)'); gr.addColorStop(0.93,'rgba(200,225,255,0.75)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(32,32,30,0,TAU); g.fill();
    g.globalCompositeOperation='source-atop';
    var ir=g.createLinearGradient(0,10,64,54); ir.addColorStop(0,'rgba(255,170,210,0.3)'); ir.addColorStop(0.5,'rgba(170,230,255,0.25)'); ir.addColorStop(1,'rgba(255,240,160,0.3)');
    g.fillStyle=ir; g.fillRect(0,0,64,64);
    g.globalCompositeOperation='source-over';
    g.fillStyle='rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(22,20,8,5,-0.6,0,TAU); g.fill();
    g.beginPath(); g.arc(42,44,2.5,0,TAU); g.fill();
  });
};
S.drop = function(){
  return sprite('drop',32,48,function(g){
    var gr=g.createLinearGradient(6,0,28,44); gr.addColorStop(0,'rgba(240,252,255,0.95)'); gr.addColorStop(1,'rgba(120,190,225,0.85)');
    g.fillStyle=gr; g.beginPath(); g.moveTo(16,2); g.bezierCurveTo(20,14,29,22,29,31); g.arc(16,31,13,0,Math.PI); g.bezierCurveTo(3,22,12,14,16,2); g.fill();
    g.fillStyle='rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(11,31,3,5,0.3,0,TAU); g.fill();
  });
};
S.puff = function(col){
  return sprite('puff'+col,96,96,function(g){
    var lumps=[[48,52,30],[30,56,20],[66,56,21],[40,38,20],[58,38,19]];
    lumps.forEach(function(l){
      var gr=g.createRadialGradient(l[0]-l[2]*0.3,l[1]-l[2]*0.35,1,l[0],l[1],l[2]);
      gr.addColorStop(0,Fx.warmLight(col,0.6)); gr.addColorStop(0.7,Fx.alpha(col,0.9)); gr.addColorStop(1,Fx.alpha(col,0));
      g.fillStyle=gr; g.beginPath(); g.arc(l[0],l[1],l[2],0,TAU); g.fill();
    });
  });
};
S.hair = function(col){
  return sprite('hair'+col,48,48,function(g){
    g.fillStyle=col; g.beginPath(); g.moveTo(8,30); g.quadraticCurveTo(22,6,42,14); g.quadraticCurveTo(26,16,14,34); g.closePath(); g.fill();
    g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(255,245,230,0.35)'; g.fillRect(0,0,48,20);
  });
};

// ---------------------------------------------------------------- Zeichen-Helfer
Fx.ball = function(g,x,y,rx,ry,col){ g.drawImage(S.ball(col),x-rx,y-ry,rx*2,ry*2); };
Fx.glow = function(g,x,y,r,col,a){
  if(a<=0.003) return;
  var o=g.globalAlpha; g.globalAlpha=o*(a===undefined?1:a);
  g.drawImage(S.glow(col||'#fff1d6'),x-r,y-r,r*2,r*2); g.globalAlpha=o;
};
Fx.contactShadow = function(g,x,y,rx,ry,a){
  var o=g.globalAlpha; g.globalAlpha=o*(a===undefined?1:Math.min(1,a));
  g.drawImage(S.shadow(),x-rx,y-ry,rx*2,ry*2); g.globalAlpha=o;
};

// Color-Grading: warme Vignette + zarter Licht-Schleier von oben (einmal pro Größe gebacken)
var grad={cv:null,key:''};
Fx.grading = function(W,H){
  var key=W+'x'+H;
  if(grad.key===key) return grad.cv;
  var c=grad.cv||canvas(1,1), w=Math.ceil(W/2), h=Math.ceil(H/2);
  c.width=w; c.height=h;
  var g=c.getContext('2d');
  var R=Math.hypot(w,h)/2;
  var vg=g.createRadialGradient(w/2,h*0.46,R*0.35,w/2,h*0.5,R*1.05);
  vg.addColorStop(0,'rgba(110,52,50,0)'); vg.addColorStop(0.7,'rgba(110,52,50,0.08)'); vg.addColorStop(1,'rgba(96,40,48,0.26)');
  g.fillStyle=vg; g.fillRect(0,0,w,h);
  var lg=g.createLinearGradient(0,0,0,h*0.5);
  lg.addColorStop(0,'rgba(255,226,180,0.10)'); lg.addColorStop(1,'rgba(255,226,180,0)');
  g.fillStyle=lg; g.fillRect(0,0,w,h);
  grad.cv=c; grad.key=key; return c;
};
// r20: dasselbe Grading direkt auf ein Rechteck in Bildschirm-Koordinaten malen (CSS-px, Bildschirm W×H).
// Wird einmal in den Raum-Cache gebacken → kein Vollbild-Durchgang pro Bild mehr.
Fx.gradingPaint = function(g,W,H,x,y,w,h){
  var R=Math.hypot(W,H)/2;
  var vg=g.createRadialGradient(W/2,H*0.46,R*0.35,W/2,H*0.5,R*1.05);
  vg.addColorStop(0,'rgba(110,52,50,0)'); vg.addColorStop(0.7,'rgba(110,52,50,0.08)'); vg.addColorStop(1,'rgba(96,40,48,0.26)');
  g.fillStyle=vg; g.fillRect(x,y,w,h);
  var lg=g.createLinearGradient(0,0,0,H*0.5);
  lg.addColorStop(0,'rgba(255,226,180,0.10)'); lg.addColorStop(1,'rgba(255,226,180,0)');
  g.fillStyle=lg; g.fillRect(x,y,w,h);
};

// ---------------------------------------------------------------- Qualitätsstufen
Fx.Q = { tier:2,
  dpr: function(){ return [1.25,1.6,2][Fx.Q.tier]; },
  pmul: function(){ var m=[0.45,0.75,1][Fx.Q.tier]; return (Fx.DEKO && Fx.RM) ? m*0.6 : m; } };

// ---------------------------------------------------------------- Partikel
var DEF = {
  puff:['#fff6ea','#fbe7d2'], spark:['#fff1c8','#ffd9a0'], twinkle:['#fff'], drop:['#bfe6f6'],
  confetti:['#f6a57a','#f7d774','#a9c79c','#9fd0c0','#c9b3e6','#f4a6b8','#ffffff'],
  star:['#ffe19a','#fff4d6'], ring:['#fff1d6'], flower:['#f7b6c9','#fff4ea'], heart:['#f38aa3','#f7b6c9'],
  bubble:['#fff'], hair:['#8a5a3a']
};
var P = Fx.P = { list:[] };
var MAXP=[260,480,760];
P.emit = function(type,x,y,o){
  o=o||{};
  var n=Math.max(1,Math.round((o.n||1)*Fx.Q.pmul())), L=P.list;
  var cols=o.colors||DEF[type]||['#fff'];
  var hasDir=o.dir!==undefined, spread=o.spread===undefined?(hasDir?0.8:TAU):o.spread;
  for(var i=0;i<n;i++){
    if(L.length>=MAXP[Fx.Q.tier]) L.splice(0,1);
    var a=hasDir ? o.dir+(Math.random()-0.5)*spread : Math.random()*TAU;
    var sp=(o.speed===undefined?120:o.speed)*(0.35+0.65*Math.random());
    var life=(o.life||1)*(0.7+0.5*Math.random());
    L.push({type:type, x:x+(Math.random()-0.5)*2*(o.jx||0), y:y+(Math.random()-0.5)*2*(o.jy||0),
      vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:life, max:life,
      size:(o.size||10)*(0.7+0.6*Math.random()), col:cols[Math.floor(Math.random()*cols.length)],
      rot:Math.random()*TAU, vr:(Math.random()-0.5)*8, grav:o.grav===undefined?200:o.grav,
      drag:o.drag===undefined?1:o.drag, layer:o.layer||'world', ph:Math.random()*TAU});
  }
};
P.update = function(dt){
  var L=P.list;
  for(var i=L.length-1;i>=0;i--){
    var p=L[i]; p.life-=dt;
    if(p.life<=0){ L[i]=L[L.length-1]; L.pop(); continue; }
    var d=Math.exp(-p.drag*dt);
    p.vx*=d; p.vy=p.vy*d+p.grav*dt;
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt;
  }
};
P.clear = function(layer){ P.list=P.list.filter(function(p){ return layer && p.layer!==layer; }); };
P.count = function(){ return P.list.length; };
P.draw = function(g,layer){
  var L=P.list; if(!L.length) return;
  var T=g.getTransform(), oa=g.globalAlpha;
  for(var i=0;i<L.length;i++){
    var p=L[i]; if(p.layer!==layer) continue;
    var q=1-p.life/p.max, s=p.size, a;
    switch(p.type){
      case 'puff':
        a=(1-q)*(1-q)*0.85; var r=s*(0.55+0.6*Fx.ease.outCubic(q));
        g.globalAlpha=oa*a; g.drawImage(S.puff(p.col),p.x-r,p.y-r,r*2,r*2); break;
      case 'spark':
        a=1-q; g.globalAlpha=oa*a; g.drawImage(S.dot(p.col),p.x-s,p.y-s,s*2,s*2); break;
      case 'twinkle':
        var k=Math.sin(q*Math.PI); g.globalAlpha=oa*k;
        g.setTransform(T); g.translate(p.x,p.y); g.rotate(p.rot*0.2); g.drawImage(S.twinkle(),-s*k,-s*k,s*2*k,s*2*k); g.setTransform(T); break;
      case 'drop':
        g.globalAlpha=oa*Math.min(1,(1-q)*2);
        g.setTransform(T); g.translate(p.x,p.y); g.rotate(Math.atan2(p.vy,p.vx)+Math.PI/2+Math.PI);
        g.drawImage(S.drop(),-s*0.6,-s*1.1,s*1.2,s*1.8); g.setTransform(T); break;
      case 'confetti':
        g.globalAlpha=oa*Math.min(1,(1-q)*3);
        g.setTransform(T); g.translate(p.x,p.y); g.rotate(p.rot); g.scale(Math.cos(p.ph+p.rot*2.2),1);
        g.fillStyle=p.col; g.fillRect(-s*0.5,-s*0.3,s,s*0.6); g.setTransform(T); break;
      case 'star': case 'flower': case 'heart':
        g.globalAlpha=oa*Math.min(1,(1-q)*2.5);
        var spr=p.type==='star'?S.star(p.col):p.type==='heart'?S.heart(p.col):S.flower(p.col);
        g.setTransform(T); g.translate(p.x,p.y); g.rotate(p.type==='heart'?Math.sin(p.rot)*0.3:p.rot);
        g.drawImage(spr,-s,-s,s*2,s*2); g.setTransform(T); break;
      case 'ring':
        var rr=s*(0.25+0.75*Fx.ease.outCubic(q));
        g.globalAlpha=oa*(1-q)*0.9; g.strokeStyle=p.col; g.lineWidth=Math.max(0.5,s*0.09*(1-q));
        g.beginPath(); g.arc(p.x,p.y,rr,0,TAU); g.stroke(); break;
      case 'bubble':
        g.globalAlpha=oa*Math.min(1,(1-q)*3);
        var wb=1+0.08*Math.sin(p.ph+q*20);
        g.drawImage(S.bubble(),p.x-s*wb,p.y-s/wb,s*2*wb,s*2/wb); break;
      case 'hair':
        g.globalAlpha=oa*Math.min(1,(1-q)*2);
        g.setTransform(T); g.translate(p.x,p.y); g.rotate(p.rot); g.drawImage(S.hair(p.col),-s,-s,s*2,s*2); g.setTransform(T); break;
      default:
        g.globalAlpha=oa*(1-q); g.drawImage(S.dot(p.col),p.x-s,p.y-s,s*2,s*2);
    }
  }
  g.globalAlpha=oa; g.setTransform(T);
};
})();
