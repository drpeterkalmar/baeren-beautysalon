// deko.js — r20 "Deko-Runde": mehr Details, Licht und Leben, ressourcenschonend.
// Regeln: alles Statische wird EINMAL in den Raum-Cache von game.js gebacken (kostet pro Bild nichts);
// pro Bild nur wenige kleine, gecachte Sprites (Funkeln, Vorhang, Wolken, Fischglas), gekoppelt an die
// Qualitätsstufe Fx.Q.tier (0 = nur statisch) und an "Bewegung reduzieren" (Fx.RM).
// ?deko=0 → dieses Modul bleibt still, Room.draw/ambient bleiben im alten Zustand (A/B-Vergleich).
(function(){
'use strict';
var Fx=window.BSFx, Room=window.BSRoom, TAU=Math.PI*2;
// r21 (Grafik-Audit #7): Stoff-Struktur mit Licht aus dem Fenster (relief.js), nur beim Backen; ohne relief.js leer
var RF=window.BSRelief||{ flaeche:function(){}, auftragen:function(){}, fenster:function(){ return [0,0,1]; } };
var D=window.BSDeko={on:!!Fx.DEKO};
if(!Fx.DEKO) return;
var FLOOR=462;
var oldDraw=Room.draw, oldAmbient=Room.ambient;
D.oldDraw=oldDraw;

// ---------------------------------------------------------------- Helfer
function hash(i,j){ return (((i|0)*73856093)^((j|0)*19349663)^0x5bd1e995)>>>0; }
function rnd(i,j){ return Fx.rand(hash(i,j)||1); }
function add(g,fn){ g.save(); g.globalCompositeOperation='lighter'; fn(g); g.restore(); }
function glowAdd(g,x,y,r,col,a){ add(g,function(g){ Fx.glow(g,x,y,r,col,a); }); }
function ell(g,x,y,rx,ry,col,rot){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,Math.max(0.1,rx),Math.max(0.1,ry),rot||0,0,TAU); g.fill(); }
function anim(tier){ return (tier||0)>0 && !Fx.RM; }
D.anim=function(){ return anim(Fx.Q.tier); };
function tinyFlower(g,x,y,r,petal,mid){
  g.fillStyle=petal; g.beginPath();
  for(var i=0;i<5;i++){ var a=-Math.PI/2+i*TAU/5, px=x+Math.cos(a)*r*0.62, py=y+Math.sin(a)*r*0.62; g.moveTo(px+r*0.45,py); g.arc(px,py,r*0.45,0,TAU); }
  g.fill(); ell(g,x,y,r*0.3,r*0.3,mid);
}
function tinyHeart(g,x,y,r,col){ g.fillStyle=col; Fx.heartPath(g,x,y,r); g.fill(); }
// Herz als Teilpfad (für gebündelte Path2D-Füllungen, ohne beginPath)
function heartP(p,x,y,r){ p.moveTo(x,y+r*0.9); p.bezierCurveTo(x-r*1.25,y+r*0.05,x-r*0.95,y-r*1.0,x,y-r*0.38); p.bezierCurveTo(x+r*0.95,y-r*1.0,x+r*1.25,y+r*0.05,x,y+r*0.9); p.closePath(); }

// ---------------------------------------------------------------- Wand: Tapete, Vertäfelung, Wandlicht
function wallpaper(g,x0,y0,x1,lite){
  // Grundton etwas satter als vorher — die Lampen und das Fenster hellen ihn danach warm auf (Licht statt Einheitsfläche)
  var wg=g.createLinearGradient(0,y0,0,FLOOR); wg.addColorStop(0,'#f5d9c7'); wg.addColorStop(1,'#efc8b2');
  g.fillStyle=wg; g.fillRect(x0,y0,x1-x0,FLOOR-y0+2);
  var s0=Math.floor(x0/72)*72, sx, y2=Math.min(FLOOR,372);
  var st=new Path2D(), pin=new Path2D(), pet=new Path2D(), mid=new Path2D(), hrt=new Path2D();
  for(sx=s0;sx<x1;sx+=72){ st.rect(sx,y0,30,y2-y0); pin.rect(sx-3.2,y0,1.5,y2-y0); pin.rect(sx+31.7,y0,1.5,y2-y0); }
  // kleine Motive zwischen den Streifen: Blümchen und Herzchen im Wechsel (rasterfest), alles in wenigen Pfaden
  for(var cx=Math.floor(x0/72); cx*72<x1+72 && !lite; cx++){
    for(var cy=Math.floor((y0-40)/64); cy*64<FLOOR-110; cy++){
      var mx=cx*72+51, my=cy*64+((cx&1)?32:0)+18;
      if(((cx+cy)&1)===0){ for(var i=0;i<5;i++){ var a=-Math.PI/2+i*TAU/5, px=mx+Math.cos(a)*2.85, py=my+Math.sin(a)*2.85; pet.moveTo(px+2.07,py); pet.arc(px,py,2.07,0,TAU); }
        mid.moveTo(mx+1.38,my); mid.arc(mx,my,1.38,0,TAU); }
      else heartP(hrt,mx,my,3.4);
    }
  }
  g.fillStyle='rgba(255,246,238,0.38)'; g.fill(st); g.fillStyle='rgba(226,160,146,0.17)'; g.fill(pin);
  g.fillStyle='rgba(255,250,244,0.62)'; g.fill(pet); g.fillStyle='rgba(236,160,150,0.45)'; g.fill(mid);
  g.fillStyle='rgba(236,150,155,0.30)'; g.fill(hrt);
}
function wainscot(g,x0,x1){
  var wy=372, w=x1-x0;
  var pg=g.createLinearGradient(0,wy,0,FLOOR); pg.addColorStop(0,'#fdf1e6'); pg.addColorStop(1,'#f0dcc8');
  g.fillStyle=pg; g.fillRect(x0,wy,w,FLOOR-wy);
  for(var qx=Math.floor(x0/120)*120;qx<x1;qx+=120){
    var px=qx+14, py=wy+15, pw=92, ph=52;
    var ig=g.createLinearGradient(0,py,0,py+ph);
    ig.addColorStop(0,'rgba(170,112,92,0.12)'); ig.addColorStop(0.4,'rgba(255,255,255,0)'); ig.addColorStop(1,'rgba(255,255,255,0.40)');
    Fx.rr(g,px,py,pw,ph,10); g.fillStyle=ig; g.fill();
    g.lineWidth=2; g.strokeStyle='rgba(170,118,98,0.22)'; g.stroke();
    Fx.rr(g,px+1.6,py+2.2,pw-3.2,ph-3.4,9); g.lineWidth=1.3; g.strokeStyle='rgba(255,255,255,0.6)'; g.stroke();
  }
  // Stuhlleiste mit Glanzkante
  g.fillStyle='#fff8f0'; g.fillRect(x0,wy-8,w,10);
  g.fillStyle='rgba(255,255,255,0.95)'; g.fillRect(x0,wy-8,w,2);
  g.fillStyle='rgba(160,100,80,0.20)'; g.fillRect(x0,wy+2,w,3);
  // Fußleiste
  var bg=g.createLinearGradient(0,FLOOR-15,0,FLOOR); bg.addColorStop(0,'#fffaf3'); bg.addColorStop(1,'#e9d1ba');
  g.fillStyle=bg; g.fillRect(x0,FLOOR-15,w,15);
  g.fillStyle='rgba(255,255,255,0.95)'; g.fillRect(x0,FLOOR-15,w,1.6);
  g.fillStyle='rgba(150,95,70,0.22)'; g.fillRect(x0,FLOOR-17,w,2);
}
// warmes Lampenlicht an der Wand, dunklere Decke und Raumecken (alles weich, alles gebacken)
function wallLight(g,x0,y0,x1){
  var w=x1-x0;
  var cg=g.createLinearGradient(0,-170,0,70); cg.addColorStop(0,'rgba(120,60,50,0.16)'); cg.addColorStop(1,'rgba(120,60,50,0)');
  g.fillStyle=cg; g.fillRect(x0,Math.min(y0,-170),w,Math.max(0,70-Math.min(y0,-170)));
  // Ecken: links/rechts außerhalb der Bühne weich abdunkeln (Raum wirkt geschlossen, Blick zur Mitte)
  [[-260,-620,1],[1160,1520,-1]].forEach(function(c){
    if((c[2]>0 && x0>c[0]) || (c[2]<0 && x1<c[0])) return;
    var lg=g.createLinearGradient(c[0],0,c[1],0); lg.addColorStop(0,'rgba(120,62,58,0)'); lg.addColorStop(1,'rgba(120,62,58,0.22)');
    g.fillStyle=lg; if(c[2]>0) g.fillRect(x0,y0-10,c[0]-x0,FLOOR-y0+10); else g.fillRect(c[0],y0-10,x1-c[0],FLOOR-y0+10);
  });
}

// Lichtkarte: alle weichen Lichter (Lampen-Pfützen, Lichtkegel, Sonnenstrahl) EINMAL in eine winzige Karte
// (0,1 px pro Welteinheit) — beim Backen nur noch ein vergrößertes Bild mit 'lighter' (statt vieler großer Verläufe)
var LMR={x:-1000,y:-260,w:2900,h:1000,k:0.1}, LMC=null;
function lightMap(){
  if(LMC) return LMC;
  var R=LMR, c=Fx.canvas(R.w*R.k,R.h*R.k), g=c.getContext('2d');
  g.setTransform(R.k,0,0,R.k,-R.x*R.k,-R.y*R.k); g.globalCompositeOperation='lighter';
  [[210,150,240,0.10],[690,70,250,0.09],[745,190,200,0.07],[450,120,330,0.05]].forEach(function(L){
    var rg=g.createRadialGradient(L[0],L[1],8,L[0],L[1]+30,L[2]);
    rg.addColorStop(0,'rgba(255,214,150,'+L[3]+')'); rg.addColorStop(1,'rgba(255,214,150,0)');
    g.fillStyle=rg; g.fillRect(L[0]-L[2]-10,L[1]-L[2],2*L[2]+20,2*L[2]+60);
  });
  [[210,70,1],[690,-10,0.5]].forEach(function(L){ var x=L[0], y=L[1];
    var lg=g.createLinearGradient(0,y+14,0,y+230); lg.addColorStop(0,'rgba(255,224,168,'+(0.05*L[2]).toFixed(3)+')'); lg.addColorStop(1,'rgba(255,224,168,0)');
    g.fillStyle=lg;
    [1,0.72,0.45].forEach(function(s){ g.beginPath(); g.moveTo(x-30*s,y+14); g.lineTo(x+30*s,y+14); g.lineTo(x+120*s,y+230); g.lineTo(x-120*s,y+230); g.closePath(); g.fill(); });
  });
  var fx=660, fy=74, fw=170;
  var bg=g.createLinearGradient(fx,fy,fx-170,FLOOR+150); bg.addColorStop(0,'rgba(255,233,200,0.15)'); bg.addColorStop(1,'rgba(255,233,200,0)');
  g.fillStyle=bg; g.beginPath(); g.moveTo(fx,fy+30); g.lineTo(fx+fw,fy+30); g.lineTo(fx+60,FLOOR+170); g.lineTo(fx-230,FLOOR+170); g.closePath(); g.fill();
  return (LMC=c);
}
function applyLight(g){ add(g,function(g){ var R=LMR; g.drawImage(lightMap(),R.x,R.y,R.w,R.h); }); }
// weicher Schlagschatten: zwei leicht versetzte, transparente Vollflächen (beim Backen billig, auch ohne GPU)
function softShadow(g,x,y,w,h,rf,a){
  var r=Math.min(w,h)*rf;
  g.fillStyle='rgba(110,55,48,'+(a*0.45).toFixed(3)+')'; Fx.rr(g,x-3,y+2,w+6,h+3,r+3); g.fill();
  g.fillStyle='rgba(110,55,48,'+(a*0.55).toFixed(3)+')'; Fx.rr(g,x-1,y,w+2,h,r+1); g.fill();
}

// ---------------------------------------------------------------- Boden: Holzdielen mit Maserung, Glanz, Sonnenfleck
function floor(g,x0,x1,y1,lite){
  var fg=g.createLinearGradient(0,FLOOR,0,y1); fg.addColorStop(0,'#e9bf98'); fg.addColorStop(1,'#d8a47c');
  g.fillStyle=fg; g.fillRect(x0,FLOOR,x1-x0,y1-FLOOR+2);
  // alles gebündelt: Farbton-Stufen, Maserung, Astlöcher, Fugen → wenige Füll-/Strich-Aufrufe
  var tones=[[],[],[],[],[],[]], grain=new Path2D(), knot=new Path2D(), knot2=new Path2D(), jd=new Path2D(), jl=new Path2D();
  var y=FLOOR, n=0;
  while(y<y1+2){
    var hgt=34+n*6, off=(n%2)*90;
    for(var vx=Math.floor((x0-off)/180)*180+off; vx<x1; vx+=180){
      var R=rnd(Math.round(vx/90),n+3), tone=R()-0.5;
      tones[tone>0?Math.min(2,Math.floor(tone*6)):3+Math.min(2,Math.floor(-tone*6))].push(vx,y,hgt);
      var nl=lite?0:2+Math.floor(R()*3);
      for(var l=0;l<nl;l++){
        var ly=y+hgt*(0.18+0.64*R()), amp=hgt*0.1*(R()-0.5);
        grain.moveTo(vx+3,ly); grain.bezierCurveTo(vx+55,ly+amp*3,vx+125,ly-amp*3,vx+177,ly+amp);
      }
      if(!lite && R()<0.2){ var kx=vx+30+R()*120, ky=y+hgt*(0.35+0.3*R());
        knot.moveTo(kx+13,ky); knot.ellipse(kx,ky,13,hgt*0.07,0,0,TAU); knot2.moveTo(kx+6,ky); knot2.ellipse(kx+1,ky,5,hgt*0.035,0,0,TAU); }
      jd.rect(vx-1,y,2,hgt); jl.rect(vx+1,y,1.2,hgt);
    }
    jd.rect(x0,y+hgt-1.2,x1-x0,2.2); jl.rect(x0,y+hgt+1,x1-x0,1.4);
    y+=hgt; n++;
  }
  for(var b=0;b<6;b++){ var T=tones[b]; if(!T.length || b===0 || b===3 || lite) continue;
    g.fillStyle=b<3?'rgba(255,236,212,'+((b+0.5)/6*0.26).toFixed(3)+')':'rgba(150,88,58,'+((b-2.5)/6*0.17).toFixed(3)+')';
    g.beginPath(); for(var i=0;i<T.length;i+=3) g.rect(T[i],T[i+1],180,T[i+2]); g.fill(); }
  g.lineWidth=1.1; g.strokeStyle='rgba(146,86,56,0.13)'; g.stroke(grain);
  g.fillStyle='rgba(138,78,50,0.10)'; g.fill(knot); g.fillStyle='rgba(138,78,50,0.14)'; g.fill(knot2);
  g.fillStyle='rgba(128,72,48,0.23)'; g.fill(jd); g.fillStyle='rgba(255,240,221,0.27)'; g.fill(jl);
  // Umgebungs-Schatten unter der Fußleiste
  var ao=g.createLinearGradient(0,FLOOR,0,FLOOR+42); ao.addColorStop(0,'rgba(110,58,40,0.30)'); ao.addColorStop(1,'rgba(110,58,40,0)');
  g.fillStyle=ao; g.fillRect(x0,FLOOR,x1-x0,42);
}
// Sonnenstrahl vom Fenster + Sonnenfleck mit Fensterkreuz auf dem Boden (weiche Ränder durch Schichten)
function sunlight(g){
  var fx=660, fy=74, fw=170;
  add(g,function(g){
    // Sonnenfleck: Parallelogramm mit Fensterkreuz, 4 Schichten = weiche Kante
    var P=[[468,548],[640,548],[724,640],[552,640]], c=[(468+724)/2,594];
    for(var k=0;k<4;k++){
      var s=1.06-k*0.05; g.globalAlpha=0.07+k*0.025;
      g.fillStyle='#ffeccc'; g.beginPath();
      P.forEach(function(p,i){ var X=c[0]+(p[0]-c[0])*s, Y=c[1]+(p[1]-c[1])*s; if(i) g.lineTo(X,Y); else g.moveTo(X,Y); });
      g.closePath(); g.fill();
    }
  });
  // Fensterkreuz-Schatten im Sonnenfleck
  g.save(); g.globalAlpha=0.10; g.strokeStyle='#b07a58'; g.lineWidth=7; g.lineCap='round';
  g.beginPath(); g.moveTo(554,552); g.lineTo(638,636); g.moveTo(498,594); g.lineTo(684,594); g.stroke(); g.restore();
}
function rug(g,lite){
  var rx=450, ry=632;
  Fx.contactShadow(g,rx,ry+8,330,64,0.35);
  g.fillStyle='#f6c2c6'; g.beginPath();
  for(var k=0;k<=64;k++){ var a2=k/64*TAU, rr=1+0.03*Math.cos(a2*16), X=rx+Math.cos(a2)*310*rr, Y=ry+Math.sin(a2)*58*rr; if(k) g.lineTo(X,Y); else g.moveTo(X,Y); }
  g.fill();
  var tg=g.createRadialGradient(rx-60,ry-20,20,rx,ry,300); tg.addColorStop(0,'#ffe5e2'); tg.addColorStop(1,'#f7c9cb');
  g.fillStyle=tg; g.beginPath(); g.ellipse(rx,ry,280,48,0,0,TAU); g.fill();
  if(!lite) RF.flaeche(g,'teppich',function(g){ g.beginPath(); g.ellipse(rx,ry,306,57,0,0,TAU); },rx-310,ry-60,620,120);
  // Flor: feine helle Tupfer (rasterfest), Herzchen-Ring, innerer Rand
  var R=Fx.rand(4711);
  var pile=new Path2D();
  for(var i=0;i<(lite?0:140);i++){ var a=R()*TAU, d=Math.sqrt(R()), px=rx+Math.cos(a)*270*d, py=ry+Math.sin(a)*45*d; pile.moveTo(px+1.6,py); pile.ellipse(px,py,1.6,1,0,0,TAU); }
  g.fillStyle='rgba(255,255,255,0.20)'; g.fill(pile);
  g.strokeStyle='rgba(232,140,150,0.45)'; g.lineWidth=2.4; g.beginPath(); g.ellipse(rx,ry,232,33,0,0,TAU); g.stroke();
  for(var h=0;h<22;h++){ var ha=h/22*TAU; tinyHeart(g,rx+Math.cos(ha)*252,ry+Math.sin(ha)*40,4.2,'rgba(236,128,146,0.55)'); }
  g.strokeStyle='rgba(255,255,255,0.6)'; g.lineWidth=3; g.setLineDash([2,10]); g.lineCap='round'; g.beginPath(); g.ellipse(rx,ry,268,44,0,0,TAU); g.stroke(); g.setLineDash([]);
  g.fillStyle='rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(rx-70,ry-16,150,16,0,0,TAU); g.fill();
}

// ---------------------------------------------------------------- Fenster: Himmel, Sonne, Hügel, Fensterbank mit Fischglas
var WIN={x:660,y:74,w:170,h:220};
function cloudSprite(){
  return Fx.sprite('dk-cloud',128,64,function(g){
    [[40,40,22],[64,30,26],[88,40,20],[62,46,22]].forEach(function(c){
      var gr=g.createRadialGradient(c[0]-c[2]*0.3,c[1]-c[2]*0.4,2,c[0],c[1],c[2]);
      gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.75,'rgba(250,250,255,0.95)'); gr.addColorStop(1,'rgba(240,244,255,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(c[0],c[1],c[2],0,TAU); g.fill();
    });
  });
}
function muntins(g){ var W=WIN; g.fillStyle='#fffaf3'; g.fillRect(W.x+W.w/2-4,W.y,8,W.h); g.fillRect(W.x,W.y+W.h*0.52,W.w,8); }
function windowDeko(g,live){
  var fx=WIN.x, fy=WIN.y, fw=WIN.w, fh=WIN.h;
  softShadow(g,fx-12,fy-6,fw+24,fh+24,0.36,0.25);
  g.fillStyle='#fffaf3'; Fx.rr(g,fx-12,fy-12,fw+24,fh+24,70); g.fill();
  var sky=g.createLinearGradient(0,fy,0,fy+fh); sky.addColorStop(0,'#a8d9ef'); sky.addColorStop(0.6,'#d3ecf3'); sky.addColorStop(1,'#fbe6cf');
  g.fillStyle=sky; Fx.rr(g,fx,fy,fw,fh,62); g.fill();
  g.save(); Fx.rr(g,fx,fy,fw,fh,62); g.clip();
  Fx.glow(g,fx+40,fy+44,78,'#fff8e2',0.95); ell(g,fx+40,fy+44,12,12,'#fffdf0');
  if(!live){ g.drawImage(cloudSprite(),fx+52,fy+56,70,35); g.drawImage(cloudSprite(),fx+100,fy+92,54,27); }
  Fx.ball(g,fx+28,fy+fh+16,96,56,'#d2e8c6');
  Fx.ball(g,fx+fw*0.5,fy+fh+40,120,70,'#b9dca0');
  g.fillStyle='#a77d5c'; g.fillRect(fx+126,fy+fh-64,5,26); Fx.ball(g,fx+128,fy+fh-72,17,15,'#9fcf8e');
  var R=Fx.rand(99); for(var i=0;i<9;i++) ell(g,fx+40+R()*110,fy+fh-18+R()*14,2.2,2.2,['#ffffff','#ffd1dc','#fff2a8'][i%3]);
  g.fillStyle='rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(fx+18,fy+fh); g.lineTo(fx+96,fy); g.lineTo(fx+122,fy); g.lineTo(fx+44,fy+fh); g.fill();
  g.restore();
  muntins(g);
  g.lineWidth=3; g.strokeStyle='rgba(150,100,90,0.18)'; Fx.rr(g,fx+1.5,fy+1.5,fw-3,fh-3,60); g.stroke();
  // Fensterbank
  var sy=fy+fh+12;
  Fx.contactShadow(g,fx+fw/2,sy+14,fw*0.7,8,0.45);
  var sg=g.createLinearGradient(0,sy,0,sy+12); sg.addColorStop(0,'#fffaf4'); sg.addColorStop(1,'#e8cdb4');
  g.fillStyle=sg; Fx.rr(g,fx-26,sy,fw+52,12,4); g.fill();
  fishbowl(g,fx+58,sy,live?null:0);
  // Blumentopf auf der Fensterbank
  var px=fx+138;
  Fx.contactShadow(g,px,sy+1,16,4,0.4);
  [[-7,-34,'#f58fae'],[6,-38,'#ffb3c7'],[0,-28,'#f7a1b8']].forEach(function(f){
    g.strokeStyle='#6faa6a'; g.lineWidth=2; g.beginPath(); g.moveTo(px,sy-14); g.lineTo(px+f[0],sy+f[1]+6); g.stroke();
    tinyFlower(g,px+f[0],sy+f[1],7,f[2],'#ffe27a');
  });
  var pg=g.createLinearGradient(px-12,0,px+12,0); pg.addColorStop(0,'#f6b89c'); pg.addColorStop(1,'#d9806a');
  g.fillStyle=pg; g.beginPath(); g.moveTo(px-12,sy-16); g.lineTo(px+12,sy-16); g.lineTo(px+9,sy); g.lineTo(px-9,sy); g.closePath(); g.fill();
  // Vorhangstange mit Knäufen
  g.fillStyle='#e7b28c'; Fx.rr(g,fx-60,fy-34,fw+120,10,5); g.fill();
  g.fillStyle='rgba(255,240,220,0.6)'; g.fillRect(fx-56,fy-33,fw+112,2);
  Fx.ball(g,fx-64,fy-29,9,9,'#e6b27a'); Fx.ball(g,fx+fw+64,fy-29,9,9,'#e6b27a');
}
// Fischglas: Glas + Wasser gebacken; Fisch live (pro Bild) oder statisch (Stufe 0 / Bewegung reduziert)
var BOWL={r:25};
function fishbowl(g,x,sy,fishT){
  var r=BOWL.r, cy=sy-r+1; BOWL.x=x; BOWL.y=cy;
  Fx.contactShadow(g,x,sy+1,r*0.9,5,0.5);
  g.save(); g.beginPath(); g.arc(x,cy,r,0,TAU); g.clip();
  var wg=g.createLinearGradient(0,cy-r*0.3,0,cy+r); wg.addColorStop(0,'rgba(150,215,240,0.75)'); wg.addColorStop(1,'rgba(70,150,205,0.85)');
  g.fillStyle='rgba(235,248,252,0.45)'; g.fillRect(x-r,cy-r,2*r,2*r);
  g.fillStyle=wg; g.fillRect(x-r,cy-r*0.3,2*r,r*1.3);
  ell(g,x,cy+r*0.86,r*0.8,r*0.22,'#ead9a8');
  g.strokeStyle='#5fae6f'; g.lineWidth=2.2; g.lineCap='round';
  g.beginPath(); g.moveTo(x+9,cy+r*0.8); g.quadraticCurveTo(x+15,cy+8,x+10,cy-2); g.moveTo(x+13,cy+r*0.8); g.quadraticCurveTo(x+19,cy+10,x+18,cy+3); g.stroke();
  if(fishT!==null) fish(g,x-4,cy+5,1,false);
  g.restore();
  bowlGlass(g);
}
function bowlGlass(g){
  var x=BOWL.x, cy=BOWL.y, r=BOWL.r;
  g.strokeStyle='rgba(255,255,255,0.75)'; g.lineWidth=1.6; g.beginPath(); g.arc(x,cy,r,0,TAU); g.stroke();
  g.strokeStyle='rgba(255,255,255,0.85)'; g.lineWidth=2.4; g.lineCap='round'; g.beginPath(); g.arc(x,cy,r-5,Math.PI*1.12,Math.PI*1.42); g.stroke();
  ell(g,x,cy-r+3,r*0.55,3.2,'rgba(255,255,255,0.55)');
}
function fish(g,x,y,sc,flip){
  g.save(); g.translate(x,y); g.scale(flip?-sc:sc,sc);
  g.fillStyle='#ff9a4d'; g.beginPath(); g.ellipse(0,0,7,4.6,0,0,TAU); g.fill();
  g.beginPath(); g.moveTo(-5,0); g.lineTo(-11,-4.5); g.lineTo(-11,4.5); g.closePath(); g.fillStyle='#ff7a3a'; g.fill();
  ell(g,3.6,-1,1.2,1.2,'#2b2b3a');
  g.fillStyle='rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(0,-2,3,1.2,-0.2,0,TAU); g.fill();
  g.restore();
}
// Vorhänge: einmal als Sprite gebacken (Falten, Raffhalter), pro Bild leicht schwingend (Scherung um die Stange)
function curtainSprite(d){
  return Fx.sprite('dk-curtain'+d,140,568,function(g){
    g.scale(2,2); var c=35, fy=0, fh=WIN.h, top=0;
    var path=function(){ g.beginPath(); g.moveTo(c-24,top); g.lineTo(c+24,top);
      g.bezierCurveTo(c+30,top+104,c+10*d+14,top+194,c+26,fh+54); g.lineTo(c-26,fh+54);
      g.bezierCurveTo(c-12,top+194,c-30,top+104,c-24,top); g.closePath(); };
    var cg=g.createLinearGradient(c-26,0,c+26,0); cg.addColorStop(0,'#f2adb3'); cg.addColorStop(0.5,'#fbd2d1'); cg.addColorStop(1,'#eba0a6');
    path(); g.fillStyle=cg; g.fill();
    g.save(); path(); g.clip();
    // r21: Webstoff, Licht aus dem Fenster (linker Vorhang d=1 bekommt es von rechts, rechter von links)
    RF.auftragen(g,'vorhang',RF.fenster(d>0?WIN.x-26:WIN.x+WIN.w+26,WIN.y+WIN.h*0.5),0,0,70,fh+60);
    [-14,-2,11].forEach(function(o,i){ // Falten: weiche dunkle/helle Bahnen
      var fg=g.createLinearGradient(c+o-6,0,c+o+6,0); fg.addColorStop(0,'rgba(200,110,120,0)'); fg.addColorStop(0.5,'rgba(200,110,120,0.22)'); fg.addColorStop(1,'rgba(200,110,120,0)');
      g.fillStyle=fg; g.fillRect(c+o-8,0,16,fh+60);
      g.fillStyle='rgba(255,240,240,0.28)'; g.fillRect(c+o+5,0,2.5,fh+60);
    });
    var sh=g.createLinearGradient(0,fh+20,0,fh+54); sh.addColorStop(0,'rgba(190,100,110,0)'); sh.addColorStop(1,'rgba(190,100,110,0.25)');
    g.fillStyle=sh; g.fillRect(0,fh+20,70,40);
    g.restore();
    // Raffhalter (goldene Kordel) an der schmalsten Stelle
    var ty=top+178, tx=c+5*d+2;
    g.strokeStyle='#e2b066'; g.lineWidth=3.2; g.lineCap='round'; g.beginPath(); g.moveTo(tx-15,ty-2); g.quadraticCurveTo(tx,ty+5,tx+15,ty-2); g.stroke();
    Fx.ball(g,tx+15*d,ty+4,4.5,6,'#f0c477');
  });
}
function drawCurtains(g,t,live){
  var fy=WIN.y;
  [[WIN.x-26,1],[WIN.x+WIN.w+26,-1]].forEach(function(c){
    var sp=curtainSprite(c[1]);
    g.save(); g.translate(c[0],fy-24);
    if(live){ var sh=0.022*Math.sin(t*0.55+c[1]*1.3)+0.01*Math.sin(t*1.45+c[1]); g.transform(1,0,sh,1,0,0); }
    g.drawImage(sp,-35,0,70,284); g.restore();
  });
}

// ---------------------------------------------------------------- Spiegel mit Glanz + Hollywood-Lämpchen
var MIR={x:450,y0:26,w:300,h:420}, MB=[];
(function(){ for(var b=0;b<9;b++){ var a=Math.PI+b*Math.PI/8; MB.push([MIR.x+Math.cos(a)*(MIR.w/2+8),MIR.y0+MIR.w/2+Math.sin(a)*(MIR.w/2+8)]); } })();
function mirror(g,lite){
  var mx=MIR.x, my0=MIR.y0, mw=MIR.w, mh=MIR.h;
  softShadow(g,mx-mw/2-16,my0-7,mw+32,mh+32,0.5,0.30);
  var gf=g.createLinearGradient(mx-mw/2,my0,mx+mw/2,my0+mh); gf.addColorStop(0,'#fbe4ae'); gf.addColorStop(0.45,'#e9bb6b'); gf.addColorStop(1,'#c58b44');
  g.fillStyle=gf; Fx.rr(g,mx-mw/2-16,my0-16,mw+32,mh+32,(mw+32)/2); g.fill();
  g.lineWidth=2.5; g.strokeStyle='rgba(255,247,218,0.8)'; Fx.rr(g,mx-mw/2-13,my0-13,mw+26,mh+26,(mw+26)/2); g.stroke();
  g.lineWidth=3; g.strokeStyle='rgba(140,84,34,0.45)'; Fx.rr(g,mx-mw/2-3,my0-3,mw+6,mh+6,(mw+6)/2); g.stroke();
  var mg=g.createRadialGradient(mx-40,my0+120,20,mx,my0+200,mh*0.75); mg.addColorStop(0,'#fdf8f2'); mg.addColorStop(0.6,'#e9f0f1'); mg.addColorStop(1,'#d0dade');
  g.fillStyle=mg; Fx.rr(g,mx-mw/2,my0,mw,mh,mw/2); g.fill();
  g.save(); Fx.rr(g,mx-mw/2,my0,mw,mh,mw/2); g.clip();
  // Spiegelung: warmer Boden unten, rosa Dunst, ein heller Fenster-Fleck oben rechts
  if(!lite){
    var rf=g.createLinearGradient(0,my0+mh*0.5,0,my0+mh); rf.addColorStop(0,'rgba(236,186,160,0)'); rf.addColorStop(1,'rgba(226,166,136,0.38)');
    g.fillStyle=rf; g.fillRect(mx-mw/2,my0+mh*0.5,mw,mh*0.5);
    Fx.glow(g,mx+92,my0+150,70,'#dff2fb',0.55); }
  g.fillStyle='rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(mx-mw/2+30,my0+mh); g.lineTo(mx-mw/2+110,my0); g.lineTo(mx-mw/2+150,my0); g.lineTo(mx-mw/2+70,my0+mh); g.fill();
  g.fillStyle='rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(mx-mw/2+100,my0+mh); g.lineTo(mx-mw/2+180,my0); g.lineTo(mx-mw/2+196,my0); g.lineTo(mx-mw/2+116,my0+mh); g.fill();
  if(!lite){ g.lineWidth=16; g.strokeStyle='rgba(110,100,116,0.10)'; Fx.rr(g,mx-mw/2,my0,mw,mh,mw/2); g.stroke(); }
  g.restore();
  MB.forEach(function(p){ Fx.ball(g,p[0],p[1],8.5,8.5,'#fff3cf'); ell(g,p[0]-2,p[1]-2.5,3,2.4,'rgba(255,255,255,0.95)'); });
}

// ---------------------------------------------------------------- Lichterkette quer über die Wand
var GAR=null;
function garland(){
  if(GAR) return GAR; GAR={wire:[],bulbs:[]};
  var cols=['#fff0b8','#ffb3c8','#ffcf9c','#b8ecd9','#d8c6f6'];
  for(var i=0;i<10;i++){
    var xa=-820+i*260, xb=xa+260, ya=50, sag=26, seg=[];
    for(var k=0;k<=12;k++){ var q=k/12; seg.push([xa+(xb-xa)*q, ya+4*sag*q*(1-q)]); }
    GAR.wire.push(seg);
    for(var j=1;j<8;j++){ var q2=j/8; GAR.bulbs.push({x:xa+(xb-xa)*q2, y:ya+4*sag*q2*(1-q2)+8, c:cols[(i*3+j)%5], ph:(i*7+j)*1.93}); }
  }
  return GAR;
}
function drawGarland(g,x0,x1){
  var G=garland();
  g.lineWidth=1.6; g.strokeStyle='rgba(110,74,64,0.55)'; g.lineCap='round';
  G.wire.forEach(function(seg){ if(seg[12][0]<x0-20||seg[0][0]>x1+20) return;
    g.beginPath(); seg.forEach(function(p,k){ if(k) g.lineTo(p[0],p[1]); else g.moveTo(p[0],p[1]); }); g.stroke();
    Fx.ball(g,seg[0][0],seg[0][1]-1,3.2,3.2,'#d9a95c'); });
  G.bulbs.forEach(function(b){ if(b.x<x0-20||b.x>x1+20) return;
    g.fillStyle='#8d6a5a'; g.fillRect(b.x-2,b.y-9,4,5);
    Fx.ball(g,b.x,b.y,5.2,6.4,b.c); ell(g,b.x-1.6,b.y-2.4,1.6,2,'rgba(255,255,255,0.9)'); });
}
// additive Glüh-Höfe (gebacken): Lichterkette, Spiegel-Lämpchen
function bakedGlows(g,x0,x1){
  add(g,function(g){
    garland().bulbs.forEach(function(b){ if(b.x<x0-30||b.x>x1+30) return; Fx.glow(g,b.x,b.y,15,b.c,0.42); });
    MB.forEach(function(p){ Fx.glow(g,p[0],p[1],28,'#ffe0a0',0.55); });
  });
}

// ---------------------------------------------------------------- Hängelampen mit Lichtkegel
function lamp(g,x,y,cone){
  g.strokeStyle='rgba(150,110,90,0.7)'; g.lineWidth=2; g.beginPath(); g.moveTo(x,-1200); g.lineTo(x,y-26); g.stroke();
  Fx.glow(g,x,y+30,150,'#ffe2b0',0.55);
  var lg2=g.createLinearGradient(0,y-26,0,y+14); lg2.addColorStop(0,'#fbd9c4'); lg2.addColorStop(1,'#e9a996');
  g.fillStyle=lg2; g.beginPath(); g.moveTo(x-12,y-26); g.lineTo(x+12,y-26); g.quadraticCurveTo(x+40,y-6,x+40,y+14); g.lineTo(x-40,y+14); g.quadraticCurveTo(x-40,y-6,x-12,y-26); g.fill();
  g.strokeStyle='rgba(255,236,222,0.75)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(x-8,y-22); g.quadraticCurveTo(x-30,y-8,x-34,y+10); g.stroke();
  g.fillStyle='rgba(200,120,100,0.35)'; g.fillRect(x-40,y+12,80,2.4);
  Fx.ball(g,x,y+16,14,9,'#fff4d8');
  glowAdd(g,x,y+18,34,'#fff0c8',0.6);
}

// ---------------------------------------------------------------- Regale mit Fläschchen, Tiegeln, Handtuchrollen
function bottle(g,x,y,col,w,h,pump){
  Fx.contactShadow(g,x,y+1,w*1.1,4,0.4);
  var bg=g.createLinearGradient(x-w,0,x+w,0); bg.addColorStop(0,Fx.warmLight(col,0.45)); bg.addColorStop(0.55,col); bg.addColorStop(1,Fx.warmShadow(col,0.38));
  g.fillStyle=bg; Fx.rr(g,x-w,y-h,w*2,h,w*0.8); g.fill();
  g.fillStyle='rgba(255,252,246,0.85)'; Fx.rr(g,x-w*0.62,y-h*0.62,w*1.24,h*0.3,3); g.fill();
  g.fillStyle=Fx.alpha(Fx.warmShadow(col,0.25),0.9); Fx.heartPath(g,x,y-h*0.48,Math.min(w*0.42,h*0.13)); g.fill();
  if(pump){ g.fillStyle='#f4ece4'; Fx.rr(g,x-w*0.3,y-h-10,w*0.6,10,2); g.fill(); g.fillRect(x-2,y-h-16,4,7); Fx.rr(g,x-2,y-h-18,w*0.9,4,2); g.fill(); }
  else { g.fillStyle=Fx.warmShadow(col,0.45); Fx.rr(g,x-w*0.45,y-h-9,w*0.9,11,3); g.fill(); }
  g.fillStyle='rgba(255,255,255,0.55)'; Fx.rr(g,x-w*0.68,y-h+5,w*0.3,h*0.62,w*0.15); g.fill();
}
function jar(g,x,y,col,watte){
  Fx.contactShadow(g,x,y+1,22,4,0.4);
  g.fillStyle='rgba(236,246,250,0.75)'; Fx.rr(g,x-17,y-30,34,30,7); g.fill();
  if(watte){ [[-8,-10],[5,-11],[-2,-19],[8,-20],[-10,-20]].forEach(function(p){ Fx.ball(g,x+p[0],y+p[1],6.5,6,'#ffffff'); }); }
  else { g.fillStyle=col; Fx.rr(g,x-15,y-18,30,17,5); g.fill(); }
  g.strokeStyle='rgba(255,255,255,0.9)'; g.lineWidth=1.5; Fx.rr(g,x-17,y-30,34,30,7); g.stroke();
  g.fillStyle=Fx.warmShadow(col,0.15); Fx.rr(g,x-18,y-37,36,9,4); g.fill();
  g.fillStyle='rgba(255,255,255,0.5)'; g.fillRect(x-12,y-35,24,2);
  g.fillStyle='rgba(255,255,255,0.6)'; Fx.rr(g,x-13,y-26,5,20,2.5); g.fill();
}
function rolls(g,x,y,cols){
  Fx.contactShadow(g,x,y+1,34,5,0.45);
  [[-13,-12,cols[0]],[13,-12,cols[1]],[0,-34,cols[2]]].forEach(function(r){
    var cx=x+r[0], cy=y+r[1], rr=12;
    var gr=g.createRadialGradient(cx-4,cy-4,1,cx,cy,rr); gr.addColorStop(0,Fx.warmLight(r[2],0.5)); gr.addColorStop(1,Fx.warmShadow(r[2],0.3));
    g.fillStyle=gr; g.beginPath(); g.arc(cx,cy,rr,0,TAU); g.fill();
    RF.flaeche(g,'frottee',function(g){ g.beginPath(); g.arc(cx,cy,rr,0,TAU); },cx-rr,cy-rr,2*rr,2*rr);
    g.strokeStyle=Fx.alpha(Fx.warmShadow(r[2],0.5),0.55); g.lineWidth=1.4; g.beginPath();
    for(var a=0;a<4*Math.PI;a+=0.35){ var q=1.5+a*1.6; if(a) g.lineTo(cx+Math.cos(a)*q,cy+Math.sin(a)*q); else g.moveTo(cx+q,cy); } g.stroke();
  });
}
function soap(g,x,y,col){
  Fx.contactShadow(g,x,y+1,16,3,0.35);
  g.fillStyle=Fx.warmShadow(col,0.3); Fx.heartPath(g,x,y-9,11); g.fill();
  g.fillStyle=col; Fx.heartPath(g,x,y-11,10.5); g.fill();
  ell(g,x-4,y-14,3.4,2,'rgba(255,255,255,0.75)');
}
function succulent(g,x,y){
  Fx.contactShadow(g,x,y+1,16,4,0.4);
  for(var i=0;i<7;i++){ var a=-Math.PI/2+(i-3)*0.42; g.save(); g.translate(x,y-15); g.rotate(a+Math.PI/2);
    var lg=g.createLinearGradient(0,0,0,-17); lg.addColorStop(0,'#6fae7a'); lg.addColorStop(1,'#bfe3b0');
    g.fillStyle=lg; g.beginPath(); g.ellipse(0,-9,5,10,0,0,TAU); g.fill(); g.restore(); }
  var pg=g.createLinearGradient(x-12,0,x+12,0); pg.addColorStop(0,'#fff3ea'); pg.addColorStop(1,'#e9cdbf');
  g.fillStyle=pg; g.beginPath(); g.moveTo(x-12,y-16); g.lineTo(x+12,y-16); g.lineTo(x+9,y); g.lineTo(x-9,y); g.closePath(); g.fill();
  g.fillStyle='#f5a3b5'; g.fillRect(x-11,y-11,22,3);
}
function shelf2(g,x,y,w,items){
  Fx.contactShadow(g,x+w/2,y+15,w*0.55,10,0.5);
  [x+22,x+w-22].forEach(function(bx){ g.fillStyle='#d9a882'; g.beginPath(); g.moveTo(bx-4,y+10); g.lineTo(bx+4,y+10); g.lineTo(bx+4,y+28); g.quadraticCurveTo(bx,y+16,bx-4,y+12); g.fill(); });
  var sg=g.createLinearGradient(0,y-4,0,y+12); sg.addColorStop(0,'#f6d8bb'); sg.addColorStop(1,'#d2a17b');
  g.fillStyle=sg; Fx.rr(g,x,y,w,12,6); g.fill();
  g.fillStyle='rgba(255,246,232,0.8)'; g.fillRect(x+5,y+1,w-10,1.8);
  items.forEach(function(it){ var ix=x+it[1];
    if(it[0]==='b') bottle(g,ix,y,it[2],it[3],it[4],false);
    else if(it[0]==='p') bottle(g,ix,y,it[2],it[3],it[4],true);
    else if(it[0]==='j') jar(g,ix,y,it[2],!!it[3]);
    else if(it[0]==='r') rolls(g,ix,y,it[2]);
    else if(it[0]==='s') soap(g,ix,y,it[2]);
    else if(it[0]==='k') succulent(g,ix,y);
  });
}
var SHELF_A=[['b',26,'#f7a8c0',13,40],['j',62,'#bfe8da',1],['r',108,['#fbd4dc','#cfe8f6','#fff0c4']],['p',150,'#ffd98a',12,34],['b',176,'#c9b3ea',10,44]];
var SHELF_B=[['k',22],['b',54,'#9fd6c8',12,50],['s',86,'#f7b0c4'],['p',120,'#f6b58f',13,36],['b',152,'#f7a8c0',11,42]];

// ---------------------------------------------------------------- Pflanzen, Bilder, Sessel
function plant2(g,x,y,sc,big){
  g.save(); g.translate(x,y); g.scale(sc,sc);
  Fx.contactShadow(g,0,4,56,13,0.6);
  var leaves=big?[[-1.05,80],[-0.7,104],[-0.35,122],[0,132],[0.35,118],[0.7,100],[1.05,78],[-0.15,96],[0.18,102],[-0.55,86],[0.55,84]]
                :[[-0.9,70],[-0.45,92],[0,100],[0.45,90],[0.9,72],[-0.2,80],[0.25,84]];
  leaves.forEach(function(l){
    var L=l[1], wv=big?30:24;
    g.save(); g.translate(0,-50); g.rotate(l[0]);
    var lg=g.createLinearGradient(-14,0,14,-L); lg.addColorStop(0,'#4b8957'); lg.addColorStop(0.55,'#77b773'); lg.addColorStop(1,'#a9d996');
    g.fillStyle=lg; g.beginPath(); g.moveTo(0,0); g.bezierCurveTo(-wv,-L*0.4,-wv*0.6,-L*0.9,0,-L); g.bezierCurveTo(wv*0.6,-L*0.9,wv,-L*0.4,0,0); g.fill();
    g.fillStyle='rgba(255,255,255,0.10)'; g.beginPath(); g.moveTo(0,-4); g.bezierCurveTo(-wv*0.8,-L*0.4,-wv*0.5,-L*0.85,0,-L*0.95); g.closePath(); g.fill();
    g.strokeStyle='rgba(226,250,212,0.5)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(0,-3); g.quadraticCurveTo(-2,-L*0.5,0,-L*0.93); g.stroke();
    g.restore();
  });
  var pg=g.createLinearGradient(-36,0,36,0); pg.addColorStop(0,'#f8c0a6'); pg.addColorStop(0.6,'#e9937a'); pg.addColorStop(1,'#c46a58');
  g.fillStyle=pg; g.beginPath(); g.moveTo(-36,-56); g.lineTo(36,-56); g.quadraticCurveTo(32,0,24,0); g.lineTo(-24,0); g.quadraticCurveTo(-32,0,-36,-56); g.fill();
  g.fillStyle='rgba(255,242,232,0.88)'; g.beginPath(); g.moveTo(-34.5,-40); g.lineTo(34.5,-40); g.lineTo(33.5,-31); g.lineTo(-33.5,-31); g.closePath(); g.fill();
  for(var d=-26;d<=26;d+=13) ell(g,d,-35.5,2.6,2.6,'#ef8e9e');
  g.fillStyle='rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(-21,-26,5,18,0.12,0,TAU); g.fill();
  var rg=g.createLinearGradient(0,-62,0,-50); rg.addColorStop(0,'#fbd2bf'); rg.addColorStop(1,'#eaa58b');
  g.fillStyle=rg; Fx.rr(g,-40,-62,80,12,6); g.fill();
  g.restore();
}
function picture(g,x,y,w,h,kind){
  g.strokeStyle='rgba(120,80,60,0.5)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-w*0.3,y-h/2+6); g.lineTo(x,y-h/2-20); g.lineTo(x+w*0.3,y-h/2+6); g.stroke();
  Fx.ball(g,x,y-h/2-20,3.2,3.2,'#c9a06a');
  softShadow(g,x-w/2,y-h/2+6,w,h,0.08,0.28);
  var fg=g.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2); fg.addColorStop(0,'#f7dba8'); fg.addColorStop(1,'#c79354');
  g.fillStyle=fg; Fx.rr(g,x-w/2,y-h/2,w,h,8); g.fill();
  g.fillStyle='#fff8ef'; Fx.rr(g,x-w/2+8,y-h/2+8,w-16,h-16,4); g.fill();
  var ix=x-w/2+15, iy=y-h/2+15, iw=w-30, ih=h-30, cx=ix+iw/2;
  g.save(); g.beginPath(); g.rect(ix,iy,iw,ih); g.clip();
  if(kind==='baer'){
    var bg=g.createRadialGradient(cx,iy+ih*0.45,4,cx,iy+ih*0.5,iw*0.8); bg.addColorStop(0,'#ffe8ee'); bg.addColorStop(1,'#f6bccb');
    g.fillStyle=bg; g.fillRect(ix,iy,iw,ih);
    var cy=iy+ih*0.6, r=Math.min(iw,ih)*0.3;
    Fx.ball(g,cx,cy+r*1.7,r*1.25,r*0.9,'#c08a5f');
    Fx.ball(g,cx-r*0.8,cy-r*0.78,r*0.36,r*0.36,'#b7835a'); Fx.ball(g,cx+r*0.8,cy-r*0.78,r*0.36,r*0.36,'#b7835a');
    Fx.ball(g,cx,cy,r,r*0.92,'#c8915f');
    Fx.ball(g,cx,cy+r*0.33,r*0.43,r*0.31,'#f2d6b8');
    ell(g,cx,cy+r*0.2,r*0.13,r*0.09,'#4a2a2a');
    ell(g,cx-r*0.37,cy-r*0.12,r*0.09,r*0.115,'#2a1a1e'); ell(g,cx+r*0.37,cy-r*0.12,r*0.09,r*0.115,'#2a1a1e');
    ell(g,cx-r*0.39,cy-r*0.16,r*0.035,r*0.04,'#fff'); ell(g,cx+r*0.35,cy-r*0.16,r*0.035,r*0.04,'#fff');
    ell(g,cx-r*0.62,cy+r*0.2,r*0.15,r*0.085,'rgba(255,120,145,0.5)'); ell(g,cx+r*0.62,cy+r*0.2,r*0.15,r*0.085,'rgba(255,120,145,0.5)');
    g.fillStyle='#ef5f8c'; g.beginPath(); g.moveTo(cx+r*0.55,cy-r*0.8); g.lineTo(cx+r*0.2,cy-r*1.05); g.lineTo(cx+r*0.22,cy-r*0.58); g.closePath();
    g.moveTo(cx+r*0.55,cy-r*0.8); g.lineTo(cx+r*0.92,cy-r*1.02); g.lineTo(cx+r*0.86,cy-r*0.55); g.closePath(); g.fill();
    Fx.ball(g,cx+r*0.55,cy-r*0.8,r*0.12,r*0.12,'#f48aa9');
  } else {
    var mg=g.createLinearGradient(0,iy,0,iy+ih); mg.addColorStop(0,'#e6f6ee'); mg.addColorStop(1,'#c4e6d8');
    g.fillStyle=mg; g.fillRect(ix,iy,iw,ih);
    var vy=iy+ih;
    [[-16,-0.35,'#f58fae'],[0,0,'#ffd36e'],[15,0.35,'#f7a1c0'],[-6,-0.12,'#ffffff'],[8,0.18,'#ffb38a']].forEach(function(f,i){
      var len=ih*(0.52+0.08*(i%2)), ex=cx+Math.sin(f[1])*len*0.7+f[0]*0.3, ey=vy-ih*0.25-len*0.6;
      g.strokeStyle='#6fae6c'; g.lineWidth=2; g.beginPath(); g.moveTo(cx,vy-ih*0.25); g.quadraticCurveTo(cx+f[0]*0.4,ey+len*0.3,ex,ey); g.stroke();
      tinyFlower(g,ex,ey,9,f[2],'#ffe27a');
    });
    var vg=g.createLinearGradient(cx-14,0,cx+14,0); vg.addColorStop(0,'#cfe3f6'); vg.addColorStop(1,'#8fb4dd');
    g.fillStyle=vg; g.beginPath(); g.moveTo(cx-10,vy-ih*0.3); g.quadraticCurveTo(cx-22,vy-ih*0.12,cx-12,vy); g.lineTo(cx+12,vy); g.quadraticCurveTo(cx+22,vy-ih*0.12,cx+10,vy-ih*0.3); g.closePath(); g.fill();
  }
  g.fillStyle='rgba(255,255,255,0.20)'; g.beginPath(); g.moveTo(ix,iy+ih*0.65); g.lineTo(ix+iw*0.55,iy); g.lineTo(ix+iw*0.8,iy); g.lineTo(ix+iw*0.1,iy+ih); g.lineTo(ix,iy+ih); g.closePath(); g.fill();
  g.restore();
}
function armchair(g,x,y){
  Fx.contactShadow(g,x,y+4,128,18,0.55);
  g.fillStyle='#d6a35c'; [-74,74].forEach(function(o){ Fx.rr(g,x+o-5,y-18,10,22,4); g.fill(); });
  var bk=g.createLinearGradient(0,y-210,0,y-50); bk.addColorStop(0,'#f9bfca'); bk.addColorStop(1,'#e68ca0');
  g.fillStyle=bk; Fx.rr(g,x-84,y-210,168,160,64); g.fill();
  RF.flaeche(g,'polster',function(g){ Fx.rr(g,x-84,y-210,168,160,64); },x-84,y-210,168,160);
  g.fillStyle='rgba(255,255,255,0.20)'; Fx.rr(g,x-70,y-200,60,120,40); g.fill();
  for(var r=0;r<3;r++) for(var c=0;c<(r%2?2:3);c++){ var bx=x+(r%2?-26+c*52:-52+c*52), by=y-182+r*36;
    ell(g,bx,by,3.4,3.4,'rgba(170,70,95,0.55)'); ell(g,bx-1,by-1.2,1.3,1.3,'rgba(255,255,255,0.6)'); }
  [-1,1].forEach(function(s){
    var ag=g.createLinearGradient(x+s*92-20,0,x+s*92+20,0); ag.addColorStop(0,s<0?'#f7b3c1':'#ee9aae'); ag.addColorStop(1,s<0?'#e78ea2':'#d97c93');
    g.fillStyle=ag; Fx.rr(g,x+s*92-21,y-124,42,108,21); g.fill();
    RF.flaeche(g,'polster',function(g){ Fx.rr(g,x+s*92-21,y-124,42,108,21); },x+s*92-21,y-124,42,108);
    g.fillStyle='rgba(255,255,255,0.28)'; Fx.rr(g,x+s*92-14,y-120,22,12,6); g.fill();
  });
  var st=g.createLinearGradient(0,y-74,0,y-22); st.addColorStop(0,'#fdcbd5'); st.addColorStop(1,'#e2869d');
  g.fillStyle=st; Fx.rr(g,x-74,y-76,148,54,22); g.fill();
  RF.flaeche(g,'polster',function(g){ Fx.rr(g,x-74,y-76,148,54,22); },x-74,y-76,148,54);
  g.fillStyle='#d87b93'; Fx.rr(g,x-100,y-28,200,16,8); g.fill();
  g.fillStyle='rgba(255,236,240,0.5)'; g.fillRect(x-94,y-27,188,2);
  g.save(); g.translate(x+26,y-104); g.rotate(0.12);
  g.fillStyle='#e9a7b8'; Fx.heartPath(g,1,3,27); g.fill();
  var hg=g.createLinearGradient(-20,-24,20,22); hg.addColorStop(0,'#fff6f8'); hg.addColorStop(1,'#f6cdd8');
  g.fillStyle=hg; Fx.heartPath(g,0,0,26); g.fill(); g.restore();
}

// ---------------------------------------------------------------- Raum zusammensetzen (gebacken) + Leben pro Bild
var BOWL_X=WIN.x+58, BOWL_SY=WIN.y+WIN.h+12;
// Der Raum in Portionen: game.js kann ihn während einer Kamerafahrt Schritt für Schritt in einen zweiten
// Zwischenspeicher backen (kein großer Ruckler am Ende der Fahrt); Room.draw macht alles auf einmal.
D.roomSteps=function(g,x0,y0,x1,y1){
  var live=anim(Fx.Q.tier), lite=Fx.Q.tier===0;
  return [
    function(){ wallpaper(g,x0,y0,x1,lite); },
    function(){ wainscot(g,x0,x1); wallLight(g,x0,y0,x1); drawGarland(g,x0,x1); },
    function(){ windowDeko(g,live); },
    function(){ mirror(g,lite); },
    function(){ picture(g,-178,196,124,150,'baer'); picture(g,1010,146,136,108,'blume'); shelf2(g,40,210,190,SHELF_A); shelf2(g,60,320,170,SHELF_B); lamp(g,210,70,1); lamp(g,690,-10,0.5); },
    function(){ floor(g,x0,x1,y1,lite); },
    function(){ sunlight(g); rug(g,lite); },
    function(){ if(!lite) applyLight(g); },
    function(){ plant2(g,112,FLOOR+60,1.1,false); plant2(g,800,FLOOR+48,0.9,false); plant2(g,-122,FLOOR+92,1.45,true); armchair(g,1010,FLOOR+74); },
    function(){ if(!live) drawCurtains(g,0,false); bakedGlows(g,x0,x1); }
  ];
};
Room.steps=D.roomSteps;
Room.draw=function(g,x0,y0,x1,y1){ var S=D.roomSteps(g,x0,y0,x1,y1); for(var i=0;i<S.length;i++) S[i](); };
function clouds(g,t){
  var W=WIN, sp=cloudSprite(), span=W.w+150;
  g.save(); Fx.rr(g,W.x,W.y,W.w,W.h,62); g.clip();
  [[0,70,70,35,6],[110,106,54,27,3.8]].forEach(function(c){ var x=W.x-75+(((c[0]+t*c[4])%span)+span)%span; g.drawImage(sp,x,W.y+c[1]-c[3]/2,c[2],c[3]); });
  g.restore();
  muntins(g);
}
function liveFish(g,t){
  var x=BOWL_X, cy=BOWL.y, r=BOWL.r; if(cy===undefined) return;
  var u=Math.sin(t*0.62), right=Math.cos(t*0.62)>0, fx=x+u*11, fy=cy+5+Math.sin(t*1.4)*3;
  g.save(); g.beginPath(); g.arc(x,cy,r-1.5,0,TAU); g.clip();
  fish(g,fx,fy,1,!right);
  var bq=(t*0.55)%1; ell(g,fx+(right?8:-8),fy-3-bq*16,1.5,1.5,'rgba(255,255,255,'+(0.85*(1-bq)).toFixed(3)+')');
  g.restore();
  bowlGlass(g);
}
// r21: Lämpchen der Lichterkette und Finale-Funkeln zusätzlich in die Glow-Ebene des Endbilds (nur wenn es läuft).
// false = nur Partikel glühen (falls der ständige Schein im Salon im Budget zu teuer ist; TODO Heavy-Job messen)
var GLOW_DEKO=true;
function twinkle(g,t,tier,x0,x1){
  add(g,function(g){
    var B=garland().bulbs, step=tier>=2?1:2;
    for(var i=0;i<B.length;i+=step){ var b=B[i]; if(b.x<x0-20||b.x>x1+20) continue;
      var a=Math.sin(t*1.6+b.ph); if(a>0.15){ Fx.glow(g,b.x,b.y,13,b.c,0.34*a); if(GLOW_DEKO) Fx.GL.glow(g,b.x,b.y,20,b.c,0.5*a); } }
    for(var j=0;j<MB.length;j++){ var m=MB[j], a2=0.5+0.5*Math.sin(t*1.15+j*0.85); Fx.glow(g,m[0],m[1],22,'#fff0c0',0.24*a2); }
  });
}
Room.ambient=function(g,t,tier){
  oldAmbient(g,t,tier);
  if(!anim(tier)) return;
  var T=g.getTransform(), x0=-T.e/T.a, x1=(g.canvas.width-T.e)/T.a;
  clouds(g,t); liveFish(g,t); drawCurtains(g,t,true); twinkle(g,t,tier,x0,x1);
};

// ================================================================ Etappe 2: Stationen
// Welt-Sprite: einmal in Welt-Koordinaten gebacken, mit Hysterese (±25 %) gegen Neu-Backen während Kamerafahrten
var WS={};
function devScale(g){ var T=g.getTransform(); return Math.sqrt(T.a*T.a+T.b*T.b)||1; }
function worldSprite(key,x,y,w,h,k,fn){
  var e=WS[key];
  if(e && k<=e.k*1.25 && k>=e.k*0.8) return e;
  var kk=Math.min(2.5,Math.max(0.5,Math.round(k*4)/4));
  var c=(e&&e.cv)||Fx.canvas(1,1); c.width=Math.ceil(w*kk)+2; c.height=Math.ceil(h*kk)+2;
  var cg=c.getContext('2d'); cg.setTransform(kk,0,0,kk,-x*kk+1,-y*kk+1); fn(cg);
  return (WS[key]={cv:c,k:kk,x:x-1/kk,y:y-1/kk,w:c.width/kk,h:c.height/kk});
}
function putWS(g,e){ g.drawImage(e.cv,e.x,e.y,e.w,e.h); }

// ---------------------------------------------------------------- Waschen: verzierte Wanne, Badeente, Seifenblasen
var TUB=(function(){ var s=Math.min(900,600)/420; return {s:s,cx:450,y:600*0.58+128*s,w:210*s,h:92*s}; })();
function tubPath(g){ var T=TUB, cx=T.cx, y=T.y, w=T.w, h=T.h;
  g.beginPath(); g.moveTo(cx-w,y); g.lineTo(cx+w,y); g.quadraticCurveTo(cx+w*0.98,y+h,cx+w*0.7,y+h); g.lineTo(cx-w*0.7,y+h); g.quadraticCurveTo(cx-w*0.98,y+h,cx-w,y); }
function tubBake(g){
  var T=TUB, s=T.s, cx=T.cx, y=T.y, w=T.w, h=T.h;
  var fg=g.createLinearGradient(0,y,0,y+h); fg.addColorStop(0,'#fffaf2'); fg.addColorStop(0.55,'#f6ebdd'); fg.addColorStop(1,'#e2cdb6');
  tubPath(g); g.fillStyle=fg; g.fill();
  g.save(); tubPath(g); g.clip();
  var b0=y+h*0.30, b1=y+h*0.46;
  g.fillStyle='#f8c3cc'; g.fillRect(cx-w,b0,2*w,b1-b0);
  g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(cx-w,b0,2*w,(b1-b0)*0.35);
  g.fillStyle='#e7c07c'; g.fillRect(cx-w,b0-3*s,2*w,2*s); g.fillRect(cx-w,b1+1*s,2*w,2*s);
  for(var hx=cx-w+20*s;hx<cx+w;hx+=36*s){ tinyHeart(g,hx,(b0+b1)/2,5.2*s,'rgba(255,255,255,0.92)'); }
  for(var sx=cx-w+38*s;sx<cx+w;sx+=36*s){ ell(g,sx,(b0+b1)/2,1.8*s,1.8*s,'#f39ab0'); }
  var sh=g.createLinearGradient(0,y+h*0.7,0,y+h); sh.addColorStop(0,'rgba(170,120,100,0)'); sh.addColorStop(1,'rgba(170,120,100,0.22)');
  g.fillStyle=sh; g.fillRect(cx-w,y+h*0.7,2*w,h*0.3);
  g.restore();
  g.fillStyle='rgba(255,255,255,0.62)'; g.beginPath(); g.ellipse(cx-w*0.55,y+h*0.62,w*0.2,h*0.1,-0.08,0,TAU); g.fill();
  g.fillStyle='rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(cx+w*0.6,y+h*0.7,w*0.07,h*0.05,0.2,0,TAU); g.fill();
  var rg=g.createLinearGradient(0,y-10*s,0,y+12*s); rg.addColorStop(0,'#f8c6a3'); rg.addColorStop(1,'#df906a');
  g.fillStyle=rg; g.beginPath(); g.ellipse(cx,y,w+8*s,11*s,0,0,TAU); g.fill();
  g.strokeStyle='rgba(255,236,214,0.85)'; g.lineWidth=2*s; g.beginPath(); g.ellipse(cx,y-1*s,w+4*s,8*s,0,Math.PI*1.05,Math.PI*1.95); g.stroke();
  [-1,1].forEach(function(sg){ Fx.ball(g,cx+sg*w*0.62,y+h+8*s,16*s,11*s,'#d8ab6a'); ell(g,cx+sg*w*0.62-4*s,y+h+5*s,4*s,2.2*s,'rgba(255,248,220,0.8)'); });
}
D.tubFront=function(g){
  var T=TUB, s=T.s, e=worldSprite('tub',T.cx-T.w-14*s,T.y-14*s,2*T.w+28*s,T.h+34*s,devScale(g),tubBake);
  putWS(g,e);
};
function duckSprite(){
  return Fx.sprite('dk-duck',150,140,function(g){
    g.scale(2.5,2.5); g.translate(30,30);
    var bg=g.createRadialGradient(-6,-2,2,2,6,26); bg.addColorStop(0,'#fff6a8'); bg.addColorStop(0.6,'#ffd43b'); bg.addColorStop(1,'#e8a51c');
    g.fillStyle=bg; g.beginPath(); g.moveTo(-20,4); g.bezierCurveTo(-22,22,18,24,22,8); g.quadraticCurveTo(27,-4,22,-10); g.quadraticCurveTo(18,0,10,-2); g.quadraticCurveTo(-6,-6,-20,4); g.fill();
    g.fillStyle='rgba(232,160,30,0.55)'; g.beginPath(); g.moveTo(-2,6); g.quadraticCurveTo(8,0,15,8); g.quadraticCurveTo(6,14,-2,6); g.fill();
    var hg=g.createRadialGradient(-14,-18,1,-11,-12,12); hg.addColorStop(0,'#fff6a8'); hg.addColorStop(1,'#f2b928');
    g.fillStyle=hg; g.beginPath(); g.arc(-11,-12,11,0,TAU); g.fill();
    g.fillStyle='#ff8a3d'; g.beginPath(); g.ellipse(-23,-9,7.5,3.6,0.12,0,TAU); g.fill();
    g.fillStyle='rgba(255,220,180,0.7)'; g.beginPath(); g.ellipse(-24,-10.5,4.5,1.2,0.12,0,TAU); g.fill();
    ell(g,-14.5,-15,2.3,2.7,'#2a1a1e'); ell(g,-15.2,-15.9,0.8,0.9,'#fff');
    ell(g,-8,-8,3.4,2,'rgba(255,120,120,0.45)');
    ell(g,-13,-20,4,2,'rgba(255,255,255,0.7)');
  });
}
D.duck=function(g,t,wet){
  var T=TUB, s=T.s, x=T.cx+T.w*0.68, y=T.y-10*s, a=wet?1:0.45;
  var bob=Math.sin(t*2.3)*1.6*s*a, rot=Math.sin(t*1.7)*0.07*a;
  if(!anim(Fx.Q.tier)){ bob=0; rot=0; }
  g.save(); g.translate(x,y+bob); g.rotate(rot); g.scale(s*0.92,s*0.92);
  Fx.contactShadow(g,0,10,22,5,0.35);
  g.drawImage(duckSprite(),-30,-30,60,56); g.restore();
};

// ---------------------------------------------------------------- Aquarium: Tiefe, Lichtstrahlen, Sand mit Steinchen/Muscheln, Wasserpflanzen
function weed(g,x,yb,len,col,ph,t,amp){
  var n=9, L=[], R=[];
  for(var i=0;i<=n;i++){ var q=i/n, sway=Math.sin(t*1.25+ph+q*2.2)*q*amp, cx=x+sway, cy=yb-q*len, w=(1-q)*7+1.5;
    L.push([cx-w,cy]); R.push([cx+w,cy]); }
  g.fillStyle=col; g.beginPath(); g.moveTo(L[0][0],L[0][1]);
  for(var a=1;a<L.length;a++) g.lineTo(L[a][0],L[a][1]);
  for(var b=R.length-1;b>=0;b--) g.lineTo(R[b][0],R[b][1]);
  g.closePath(); g.fill();
}
function weeds(g,A,t,amp){
  var x=A.bx0, w=A.bw, yb=A.by0+A.bh-18, h=A.bh;
  [[x+26,0.42,'#3f9a6a',0.0],[x+44,0.6,'#5cb87a',1.3],[x+62,0.36,'#2f8a5e',2.1],
   [x+w-34,0.5,'#4aa872',0.7],[x+w-54,0.34,'#2f8a5e',2.8],[x+w-18,0.28,'#6cc488',1.9]].forEach(function(s){ weed(g,s[0],yb,h*s[1],s[2],s[3],t,amp); });
}
function aquaBake(g,A,staticLife){
  var x=A.bx0, y=A.by0, w=A.bw, h=A.bh, R=Fx.rand(A.port?31:37);
  softShadow(g,x-9,y,w+18,h+18,0.03,0.32);
  g.fillStyle='#5f93a3'; Fx.rr(g,x-9,y-9,w+18,h+18,14); g.fill();
  var wg=g.createLinearGradient(0,y,0,y+h); wg.addColorStop(0,'#aee6f7'); wg.addColorStop(0.3,'#6cc0e6'); wg.addColorStop(0.75,'#3990cc'); wg.addColorStop(1,'#2470ad');
  g.fillStyle=wg; g.fillRect(x,y,w,h);
  g.save(); g.beginPath(); g.rect(x,y,w,h); g.clip();
  Fx.glow(g,x+w*0.45,y-30,w*0.55,'#eafcff',0.55);
  add(g,function(g){ for(var i=0;i<4;i++){ var bx=x+w*(0.14+i*0.24);
    var lg=g.createLinearGradient(0,y,0,y+h*0.9); lg.addColorStop(0,'rgba(220,250,255,0.17)'); lg.addColorStop(1,'rgba(220,250,255,0)');
    g.fillStyle=lg; g.beginPath(); g.moveTo(bx-12,y); g.lineTo(bx+16,y); g.lineTo(bx+78,y+h); g.lineTo(bx+26,y+h); g.closePath(); g.fill(); } });
  for(var p=0;p<7;p++){ var px=x+w*(0.06+p*0.15)+R()*20, ph2=h*(0.10+R()*0.10), yb2=y+h-24; // ferne Korallen-Büsche (weich, blass)
    g.fillStyle='rgba(76,156,170,0.20)'; g.beginPath();
    [[-14,0.5],[0,0.8],[14,0.6]].forEach(function(c){ var rr=ph2*c[1]; g.moveTo(px+c[0]+rr,yb2); g.arc(px+c[0],yb2,rr,0,TAU); });
    g.fill(); }
  Fx.ball(g,x+w*0.07,y+h-26,46,30,'#7f9db0'); Fx.ball(g,x+w*0.13,y+h-22,28,18,'#93b0c0');
  Fx.ball(g,x+w*0.93,y+h-28,40,32,'#7895aa'); Fx.ball(g,x+w*0.86,y+h-20,24,15,'#9ab5c4');
  var sy=y+h-30, sg=g.createLinearGradient(0,sy-6,0,y+h); sg.addColorStop(0,'#f4e4b8'); sg.addColorStop(1,'#d9bf86');
  g.fillStyle=sg; g.beginPath(); g.moveTo(x,y+h);
  for(var i2=0;i2<=24;i2++){ var qx=x+w*i2/24; g.lineTo(qx,sy+Math.sin(i2*0.9)*3.5+Math.sin(i2*0.37+1)*3); }
  g.lineTo(x+w,y+h); g.closePath(); g.fill();
  g.strokeStyle='rgba(255,250,232,0.55)'; g.lineWidth=1.4;
  for(var r2=0;r2<9;r2++){ var rx=x+w*(0.08+r2*0.11)+R()*14, ry=y+h-14+R()*8; g.beginPath(); g.arc(rx,ry+8,12,Math.PI*1.2,Math.PI*1.8); g.stroke(); }
  var PC=['#f6a5b5','#ffd27a','#a8d8f0','#c9b3ea','#ffffff','#9fd9b9'];
  for(var k=0;k<16;k++){ var kx=x+16+R()*(w-32), ky=y+h-12+R()*8, kc=PC[k%PC.length];
    ell(g,kx,ky,3.4+R()*2.2,2.6+R()*1.2,kc); ell(g,kx-1,ky-1,1.2,0.8,'rgba(255,255,255,0.7)'); }
  [[0.3,'#ffc1cc'],[0.58,'#fff1d6'],[0.78,'#ffd2b0']].forEach(function(sh){ var mx=x+w*sh[0], my=y+h-10; // Muscheln
    g.fillStyle=sh[1]; g.beginPath(); g.moveTo(mx,my+3); g.arc(mx,my+3,8,Math.PI,0); g.closePath(); g.fill();
    g.strokeStyle='rgba(190,120,110,0.5)'; g.lineWidth=0.9; g.beginPath();
    for(var f=0;f<5;f++){ var fa=Math.PI+f*Math.PI/4; g.moveTo(mx,my+3); g.lineTo(mx+Math.cos(fa)*7.5,my+3+Math.sin(fa)*7.5); } g.stroke(); });
  g.save(); g.translate(x+w*0.68,y+h-12); g.rotate(0.3); g.fillStyle='#ff9a7a'; // Seestern
  Fx.starPath(g,0,0,10,0.45,5); g.fill(); ell(g,-2,-2,2,1.4,'rgba(255,230,220,0.8)'); g.restore();
  if(staticLife){ weeds(g,A,0,0);
    g.strokeStyle='rgba(255,255,255,0.75)'; g.lineWidth=2.2; g.beginPath();
    for(var s2=0;s2<=24;s2++) g.lineTo(x+w*s2/24,y+9+Math.sin(s2*0.8)*2.4); g.stroke(); }
  var tg=g.createLinearGradient(0,y,0,y+16); tg.addColorStop(0,'rgba(255,255,255,0.45)'); tg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=tg; g.fillRect(x,y,w,16);
  g.fillStyle='rgba(255,255,255,0.10)'; g.beginPath(); g.moveTo(x,y+h*0.55); g.lineTo(x+w*0.22,y); g.lineTo(x+w*0.3,y); g.lineTo(x,y+h*0.8); g.closePath(); g.fill();
  g.restore();
  g.lineWidth=7; g.strokeStyle='#6fa7b8'; Fx.rr(g,x-3.5,y-3.5,w+7,h+7,9); g.stroke();
  g.lineWidth=1.8; g.strokeStyle='rgba(255,255,255,0.7)'; Fx.rr(g,x-0.5,y-0.5,w+1,h+1,7); g.stroke();
  var lg2=g.createLinearGradient(0,y-20,0,y-6); lg2.addColorStop(0,'#bfe0ea'); lg2.addColorStop(1,'#6f9fb0');
  g.fillStyle=lg2; Fx.rr(g,x-12,y-20,w+24,14,7); g.fill();
  g.fillStyle='rgba(255,255,255,0.6)'; g.fillRect(x-4,y-18,w+8,2);
}
D.aquaBack=function(g,A,t){
  var live=anim(Fx.Q.tier);
  var e=worldSprite('aq|'+(A.port?'p':'l')+(live?'L':'S'),A.bx0-30,A.by0-34,A.bw+60,A.bh+70,devScale(g),function(cg){ aquaBake(cg,A,!live); });
  putWS(g,e);
  if(!live) return;
  weeds(g,A,t,9);
  var x=A.bx0, y=A.by0, w=A.bw, h=A.bh, bx=x+w*0.9;   // Sprudelstein + Blasensäule
  g.strokeStyle='rgba(255,255,255,0.85)'; g.lineWidth=1.4;
  for(var i=0;i<7;i++){ var q=((t*0.42+i/7)%1), by=y+h-34-q*(h-50), r=1.6+q*3.2;
    g.globalAlpha=Math.min(1,(1-q)*1.6); g.beginPath(); g.arc(bx+Math.sin(t*2.6+i*1.7)*4*q,by,r,0,TAU); g.stroke(); }
  g.globalAlpha=1;
  Fx.ball(g,bx,y+h-28,9,6,'#8aa9bb');
  g.strokeStyle='rgba(255,255,255,0.75)'; g.lineWidth=2.2; g.beginPath();
  for(var s2=0;s2<=24;s2++) g.lineTo(x+w*s2/24,y+9+Math.sin(s2*0.8+t*1.6)*2.4); g.stroke();
};


// ================================================================ Etappe 3: Glitzer beim Finale, Übergänge, Freu-Hüpfer
// Finale: weiche Licht-Kugeln hinter dem Bären + Funkel-Sterne, die den Bären umkreisen (hintere Hälfte dahinter)
function orbit(g,t,cx,cy,s,front,fade){
  var tw=Fx.S.twinkle(), n=Fx.Q.tier>=2?7:4;
  for(var i=0;i<n;i++){
    var a=t*0.75+i*TAU/n, sn=Math.sin(a); if((sn>0)!==front) continue;
    var x=cx+Math.cos(a)*215*s, y=cy-40*s+sn*70*s-Math.cos(a*0.5)*10*s;
    var z=(12+6*sn+5*Math.sin(t*5+i*1.7))*s, al=fade*(front?1:0.45)*(0.65+0.35*Math.sin(t*4.2+i));
    g.globalAlpha=Math.max(0,al); g.drawImage(tw,x-z,y-z,2*z,2*z);
    if(GLOW_DEKO) Fx.GL.glow(g,x,y,z*1.6,'#ffe8b8',0.8*Math.max(0,al));
  }
  g.globalAlpha=1;
}
D.finaleBack=function(g,t,cx,cy,s,FIN){
  if(t<FIN.tada || !anim(Fx.Q.tier)) return;
  orbit(g,t,cx,cy,s,false,Math.min(1,(t-FIN.tada)/0.8));
};
D.finaleFront=function(g,t,cx,cy,s,FIN){
  if(t<FIN.tada+0.3 || !anim(Fx.Q.tier)) return;
  orbit(g,t,cx,cy,s,true,Math.min(1,(t-FIN.tada-0.3)/0.6));
};
// Übergang: funkelnder Diagonal-Schwung über die Spielfläche (Bildschirm-Ebene, verschwindet in < 1 s)
function sweep(){
  var L=window.BSUI && window.BSUI.L; if(!L || !L.vp) return; var v=L.vp;
  for(var i=0;i<11;i++){ var q=i/10, x=v.x+v.w*(-0.02+q*1.04), y=v.y+v.h*(0.9-q*0.8)+(Math.random()-0.5)*v.h*0.1;
    Fx.P.emit('twinkle',x,y,{n:1,speed:24,size:15+Math.random()*12,life:0.32+q*0.5,grav:-24,drag:1,layer:'screen'}); }
}
var NOSTATION={menu:1,wahl:1,'finish-done':1,kunde:1};   // r22: Kundenbesuch hat eigenen Auftritt (Hereinlaufen)
var prevSt=null, hopT=-1, lastFinT=-1;

// ---------------------------------------------------------------- pro Bild: kleine Effekte je Station (Partikel aus dem vorhandenen Pool)
var acc={bub:0,fin:0,glit:0};
D.update=function(dt,t,st,S){
  if(!S) return;
  var fx=anim(Fx.Q.tier);
  // Stationswechsel: Funkel-Schwung + der Bär hüpft vor Freude, sobald die Überblendung halb durch ist
  if(st!==prevSt){
    if(prevSt!==null && !NOSTATION[st]){ if(fx) sweep(); if(!Fx.RM) hopT=t+0.3; }
    prevSt=st;
  }
  if(hopT>0 && t>=hopT){ hopT=-1; if(S.baer && window.BSArt && S.state===st && !NOSTATION[st]) window.BSArt.react(S.baer,'happy',0.6); }
  if(!fx) return;
  if(st==='waschen' && S.baer && S.baer.schaum>0.05){
    acc.bub+=dt;
    if(acc.bub>0.5){ acc.bub=0; var T=TUB;
      Fx.P.emit('bubble',T.cx+(Math.random()-0.5)*T.w*1.5,T.y-8,{n:1,speed:36,dir:-Math.PI/2,spread:0.7,grav:-46,drag:0.5,size:11,life:2.6}); }
  }
  // "Fertig?"-Station: leises Funkeln um den Bären (Vorfreude)
  if(st==='finish'){ acc.fin+=dt; if(acc.fin>0.7){ acc.fin=0; var a=Math.random()*TAU;
    Fx.P.emit('twinkle',450+Math.cos(a)*210,300+Math.sin(a)*230,{n:1,speed:12,size:20,life:0.9,grav:-10,drag:1}); } }
  // Finale: goldener Funkel-Kranz beim TA-DA, danach sanfter Glitzerregen (Bildschirm-Ebene)
  if(st==='finish-done' && S.fin && S.FIN){
    var ft=S.fin.t, FIN=S.FIN;
    if(lastFinT>=0 && lastFinT<FIN.tada+0.05 && ft>=FIN.tada+0.05){
      for(var i=0;i<14;i++){ var q=i/14*TAU;
        Fx.P.emit('twinkle',450+Math.cos(q)*60,250+Math.sin(q)*60,{n:1,speed:520,dir:q,spread:0.05,size:26,life:0.9,grav:0,drag:2.6}); }
      Fx.P.emit('spark',450,250,{n:30,speed:620,size:9,life:1.1,grav:240,drag:2,colors:['#ffe7a0','#fff8e0','#ffd0dc']});
    }
    lastFinT=ft;
    if(ft>FIN.tada+1 && !Fx.RM){ acc.fin+=dt; // Gold-Glitzer funkelt auf dem Fell
      if(acc.fin>(Fx.Q.tier>=2?0.11:0.22)){ acc.fin=0; var ga=Math.random()*TAU, gr=Math.sqrt(Math.random());
        var gx=450+Math.cos(ga)*150*gr, gy=330+Math.sin(ga)*190*gr; acc.gn=(acc.gn||0)+1;
        if(acc.gn%3===0) Fx.P.emit('twinkle',gx,gy,{n:1,speed:6,size:11,life:0.7,grav:0,drag:1});
        else Fx.P.emit('spark',gx,gy,{n:1,speed:10,size:8.5,life:0.75,grav:-8,drag:1,colors:['#ffe08a','#fff6d8','#ffc6d8','#ffd060']}); } }
    if(ft>FIN.cta && !Fx.RM){ acc.glit+=dt;
      if(acc.glit>(Fx.Q.tier>=2?0.22:0.4)){ acc.glit=0; var V=window.BSUI && window.BSUI.L ? window.BSUI.L : {W:400};
        Fx.P.emit('spark',Math.random()*V.W,-8,{n:1,speed:40,dir:Math.PI/2,spread:0.5,size:7,life:4.5,grav:26,drag:0.3,layer:'screen',colors:['#ffe7a0','#fff6dc','#ffd2e0']}); } }
  } else lastFinT=-1;
};
})();
