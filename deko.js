// deko.js — r20 "Deko-Runde": mehr Details, Licht und Leben, ressourcenschonend.
// Regeln: alles Statische wird EINMAL in den Raum-Cache von game.js gebacken (kostet pro Bild nichts);
// pro Bild nur wenige kleine, gecachte Sprites (Funkeln, Vorhang, Wolken, Fischglas), gekoppelt an die
// Qualitätsstufe Fx.Q.tier (0 = nur statisch) und an "Bewegung reduzieren" (Fx.RM).
// ?deko=0 → dieses Modul bleibt still, Room.draw/ambient bleiben im alten Zustand (A/B-Vergleich).
(function(){
'use strict';
var Fx=window.BSFx, Room=window.BSRoom, TAU=Math.PI*2;
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

// ---------------------------------------------------------------- Wand: Tapete, Vertäfelung, Wandlicht
function wallpaper(g,x0,y0,x1){
  // Grundton etwas satter als vorher — die Lampen und das Fenster hellen ihn danach warm auf (Licht statt Einheitsfläche)
  var wg=g.createLinearGradient(0,y0,0,FLOOR); wg.addColorStop(0,'#f5d9c7'); wg.addColorStop(1,'#efc8b2');
  g.fillStyle=wg; g.fillRect(x0,y0,x1-x0,FLOOR-y0+2);
  var s0=Math.floor(x0/72)*72, sx;
  g.fillStyle='rgba(255,246,238,0.38)';
  for(sx=s0;sx<x1;sx+=72) g.fillRect(sx,y0,30,FLOOR-y0);
  g.fillStyle='rgba(226,160,146,0.17)'; // feine Nadelstreifen an den Streifenkanten
  for(sx=s0;sx<x1;sx+=72){ g.fillRect(sx-3.2,y0,1.5,FLOOR-y0); g.fillRect(sx+31.7,y0,1.5,FLOOR-y0); }
  // kleine Motive zwischen den Streifen: Blümchen und Herzchen im Wechsel (rasterfest)
  for(var cx=Math.floor(x0/72); cx*72<x1+72; cx++){
    for(var cy=Math.floor((y0-40)/64); cy*64<FLOOR-110; cy++){
      var mx=cx*72+51, my=cy*64+((cx&1)?32:0)+18;
      if(((cx+cy)&1)===0) tinyFlower(g,mx,my,4.6,'rgba(255,250,244,0.62)','rgba(236,160,150,0.45)');
      else tinyHeart(g,mx,my,3.4,'rgba(236,150,155,0.30)');
    }
  }
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
  add(g,function(g){
    [[210,150,240,0.10],[690,70,250,0.09],[745,190,200,0.07],[450,120,330,0.05]].forEach(function(L){
      var rg=g.createRadialGradient(L[0],L[1],8,L[0],L[1]+30,L[2]);
      rg.addColorStop(0,'rgba(255,214,150,'+L[3]+')'); rg.addColorStop(1,'rgba(255,214,150,0)');
      g.fillStyle=rg; g.fillRect(L[0]-L[2]-10,L[1]-L[2],2*L[2]+20,2*L[2]+60);
    });
  });
  // Ecken: links/rechts außerhalb der Bühne weich abdunkeln (Raum wirkt geschlossen, Blick zur Mitte)
  [[-260,-620,1],[1160,1520,-1]].forEach(function(c){
    if((c[2]>0 && x0>c[0]) || (c[2]<0 && x1<c[0])) return;
    var lg=g.createLinearGradient(c[0],0,c[1],0); lg.addColorStop(0,'rgba(120,62,58,0)'); lg.addColorStop(1,'rgba(120,62,58,0.22)');
    g.fillStyle=lg; if(c[2]>0) g.fillRect(x0,y0-10,c[0]-x0,FLOOR-y0+10); else g.fillRect(c[0],y0-10,x1-c[0],FLOOR-y0+10);
  });
}

// ---------------------------------------------------------------- Boden: Holzdielen mit Maserung, Glanz, Sonnenfleck
function floor(g,x0,x1,y1){
  var fg=g.createLinearGradient(0,FLOOR,0,y1); fg.addColorStop(0,'#e9bf98'); fg.addColorStop(1,'#d8a47c');
  g.fillStyle=fg; g.fillRect(x0,FLOOR,x1-x0,y1-FLOOR+2);
  var y=FLOOR, n=0;
  while(y<y1+2){
    var hgt=34+n*6, off=(n%2)*90;
    for(var vx=Math.floor((x0-off)/180)*180+off; vx<x1; vx+=180){
      var R=rnd(Math.round(vx/90),n+3), tone=R()-0.5;
      g.fillStyle=tone>0?'rgba(255,236,212,'+(tone*0.26).toFixed(3)+')':'rgba(150,88,58,'+(-tone*0.17).toFixed(3)+')';
      g.fillRect(vx,y,180,hgt);
      g.lineWidth=1.1; g.strokeStyle='rgba(146,86,56,0.13)';
      var nl=2+Math.floor(R()*3);
      for(var l=0;l<nl;l++){
        var ly=y+hgt*(0.18+0.64*R()), amp=hgt*0.1*(R()-0.5);
        g.beginPath(); g.moveTo(vx+3,ly); g.bezierCurveTo(vx+55,ly+amp*3,vx+125,ly-amp*3,vx+177,ly+amp); g.stroke();
      }
      if(R()<0.2){ var kx=vx+30+R()*120, ky=y+hgt*(0.35+0.3*R()); // Astloch: langgezogen, sehr zart
        ell(g,kx,ky,13,hgt*0.07,'rgba(138,78,50,0.10)'); ell(g,kx+1,ky,5,hgt*0.035,'rgba(138,78,50,0.14)'); }
      g.fillStyle='rgba(128,72,48,0.22)'; g.fillRect(vx-1,y,2,hgt);
      g.fillStyle='rgba(255,240,220,0.28)'; g.fillRect(vx+1,y,1.2,hgt);
    }
    g.fillStyle='rgba(128,72,48,0.24)'; g.fillRect(x0,y+hgt-1.2,x1-x0,2.2);
    g.fillStyle='rgba(255,240,222,0.26)'; g.fillRect(x0,y+hgt+1,x1-x0,1.4);
    y+=hgt; n++;
  }
  // Umgebungs-Schatten unter der Fußleiste
  var ao=g.createLinearGradient(0,FLOOR,0,FLOOR+42); ao.addColorStop(0,'rgba(110,58,40,0.30)'); ao.addColorStop(1,'rgba(110,58,40,0)');
  g.fillStyle=ao; g.fillRect(x0,FLOOR,x1-x0,42);
}
// Sonnenstrahl vom Fenster + Sonnenfleck mit Fensterkreuz auf dem Boden (weiche Ränder durch Schichten)
function sunlight(g){
  var fx=660, fy=74, fw=170;
  add(g,function(g){
    g.globalAlpha=0.15;
    var lg=g.createLinearGradient(fx,fy,fx-170,FLOOR+150); lg.addColorStop(0,'#ffe9c8'); lg.addColorStop(1,'rgba(255,233,200,0)');
    g.fillStyle=lg; g.beginPath(); g.moveTo(fx,fy+30); g.lineTo(fx+fw,fy+30); g.lineTo(fx+60,FLOOR+170); g.lineTo(fx-230,FLOOR+170); g.closePath(); g.fill();
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
function rug(g){
  var rx=450, ry=632;
  Fx.contactShadow(g,rx,ry+8,330,64,0.35);
  g.fillStyle='#f6c2c6'; g.beginPath();
  for(var k=0;k<=64;k++){ var a2=k/64*TAU, rr=1+0.03*Math.cos(a2*16), X=rx+Math.cos(a2)*310*rr, Y=ry+Math.sin(a2)*58*rr; if(k) g.lineTo(X,Y); else g.moveTo(X,Y); }
  g.fill();
  var tg=g.createRadialGradient(rx-60,ry-20,20,rx,ry,300); tg.addColorStop(0,'#ffe5e2'); tg.addColorStop(1,'#f7c9cb');
  g.fillStyle=tg; g.beginPath(); g.ellipse(rx,ry,280,48,0,0,TAU); g.fill();
  // Flor: feine helle Tupfer (rasterfest), Herzchen-Ring, innerer Rand
  var R=Fx.rand(4711);
  g.fillStyle='rgba(255,255,255,0.22)';
  for(var i=0;i<140;i++){ var a=R()*TAU, d=Math.sqrt(R()); ell(g,rx+Math.cos(a)*270*d,ry+Math.sin(a)*45*d,1.6,1,'rgba(255,255,255,0.20)'); }
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
  g.save(); g.shadowColor='rgba(120,60,50,0.25)'; g.shadowBlur=14; g.shadowOffsetY=6;
  g.fillStyle='#fffaf3'; Fx.rr(g,fx-12,fy-12,fw+24,fh+24,70); g.fill(); g.restore();
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
function mirror(g){
  var mx=MIR.x, my0=MIR.y0, mw=MIR.w, mh=MIR.h;
  g.save(); g.shadowColor='rgba(120,60,50,0.30)'; g.shadowBlur=20; g.shadowOffsetY=9;
  var gf=g.createLinearGradient(mx-mw/2,my0,mx+mw/2,my0+mh); gf.addColorStop(0,'#fbe4ae'); gf.addColorStop(0.45,'#e9bb6b'); gf.addColorStop(1,'#c58b44');
  g.fillStyle=gf; Fx.rr(g,mx-mw/2-16,my0-16,mw+32,mh+32,(mw+32)/2); g.fill(); g.restore();
  g.lineWidth=2.5; g.strokeStyle='rgba(255,247,218,0.8)'; Fx.rr(g,mx-mw/2-13,my0-13,mw+26,mh+26,(mw+26)/2); g.stroke();
  g.lineWidth=3; g.strokeStyle='rgba(140,84,34,0.45)'; Fx.rr(g,mx-mw/2-3,my0-3,mw+6,mh+6,(mw+6)/2); g.stroke();
  var mg=g.createRadialGradient(mx-40,my0+120,20,mx,my0+200,mh*0.75); mg.addColorStop(0,'#fdf8f2'); mg.addColorStop(0.6,'#e9f0f1'); mg.addColorStop(1,'#d0dade');
  g.fillStyle=mg; Fx.rr(g,mx-mw/2,my0,mw,mh,mw/2); g.fill();
  g.save(); Fx.rr(g,mx-mw/2,my0,mw,mh,mw/2); g.clip();
  // Spiegelung: warmer Boden unten, rosa Dunst, ein heller Fenster-Fleck oben rechts
  var rf=g.createLinearGradient(0,my0+mh*0.5,0,my0+mh); rf.addColorStop(0,'rgba(236,186,160,0)'); rf.addColorStop(1,'rgba(226,166,136,0.38)');
  g.fillStyle=rf; g.fillRect(mx-mw/2,my0,mw,mh);
  Fx.glow(g,mx+92,my0+150,70,'#dff2fb',0.55);
  g.fillStyle='rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(mx-mw/2+30,my0+mh); g.lineTo(mx-mw/2+110,my0); g.lineTo(mx-mw/2+150,my0); g.lineTo(mx-mw/2+70,my0+mh); g.fill();
  g.fillStyle='rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(mx-mw/2+100,my0+mh); g.lineTo(mx-mw/2+180,my0); g.lineTo(mx-mw/2+196,my0); g.lineTo(mx-mw/2+116,my0+mh); g.fill();
  g.lineWidth=16; g.strokeStyle='rgba(110,100,116,0.10)'; Fx.rr(g,mx-mw/2,my0,mw,mh,mw/2); g.stroke();
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
  if(cone>0) add(g,function(g){ // weicher Lichtkegel: 3 verschachtelte Schichten = weiche Ränder
    var lg=g.createLinearGradient(0,y+14,0,y+230); lg.addColorStop(0,'rgba(255,224,168,'+(0.05*cone).toFixed(3)+')'); lg.addColorStop(1,'rgba(255,224,168,0)');
    g.fillStyle=lg;
    [1,0.72,0.45].forEach(function(s){ g.beginPath(); g.moveTo(x-30*s,y+14); g.lineTo(x+30*s,y+14); g.lineTo(x+120*s,y+230); g.lineTo(x-120*s,y+230); g.closePath(); g.fill(); });
  });
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
  g.save(); g.shadowColor='rgba(110,55,45,0.28)'; g.shadowBlur=12; g.shadowOffsetY=6;
  var fg=g.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2); fg.addColorStop(0,'#f7dba8'); fg.addColorStop(1,'#c79354');
  g.fillStyle=fg; Fx.rr(g,x-w/2,y-h/2,w,h,8); g.fill(); g.restore();
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
  g.fillStyle='rgba(255,255,255,0.20)'; Fx.rr(g,x-70,y-200,60,120,40); g.fill();
  for(var r=0;r<3;r++) for(var c=0;c<(r%2?2:3);c++){ var bx=x+(r%2?-26+c*52:-52+c*52), by=y-182+r*36;
    ell(g,bx,by,3.4,3.4,'rgba(170,70,95,0.55)'); ell(g,bx-1,by-1.2,1.3,1.3,'rgba(255,255,255,0.6)'); }
  [-1,1].forEach(function(s){
    var ag=g.createLinearGradient(x+s*92-20,0,x+s*92+20,0); ag.addColorStop(0,s<0?'#f7b3c1':'#ee9aae'); ag.addColorStop(1,s<0?'#e78ea2':'#d97c93');
    g.fillStyle=ag; Fx.rr(g,x+s*92-21,y-124,42,108,21); g.fill();
    g.fillStyle='rgba(255,255,255,0.28)'; Fx.rr(g,x+s*92-14,y-120,22,12,6); g.fill();
  });
  var st=g.createLinearGradient(0,y-74,0,y-22); st.addColorStop(0,'#fdcbd5'); st.addColorStop(1,'#e2869d');
  g.fillStyle=st; Fx.rr(g,x-74,y-76,148,54,22); g.fill();
  g.fillStyle='#d87b93'; Fx.rr(g,x-100,y-28,200,16,8); g.fill();
  g.fillStyle='rgba(255,236,240,0.5)'; g.fillRect(x-94,y-27,188,2);
  g.save(); g.translate(x+26,y-104); g.rotate(0.12);
  g.fillStyle='#e9a7b8'; Fx.heartPath(g,1,3,27); g.fill();
  var hg=g.createLinearGradient(-20,-24,20,22); hg.addColorStop(0,'#fff6f8'); hg.addColorStop(1,'#f6cdd8');
  g.fillStyle=hg; Fx.heartPath(g,0,0,26); g.fill(); g.restore();
}

// ---------------------------------------------------------------- Raum zusammensetzen (gebacken) + Leben pro Bild
var BOWL_X=WIN.x+58, BOWL_SY=WIN.y+WIN.h+12;
Room.draw=function(g,x0,y0,x1,y1){
  var live=anim(Fx.Q.tier);
  wallpaper(g,x0,y0,x1);
  wainscot(g,x0,x1);
  wallLight(g,x0,y0,x1);
  drawGarland(g,x0,x1);
  windowDeko(g,live);
  mirror(g);
  picture(g,-178,196,124,150,'baer'); picture(g,1010,146,136,108,'blume');
  shelf2(g,40,210,190,SHELF_A); shelf2(g,60,320,170,SHELF_B);
  lamp(g,210,70,1); lamp(g,690,-10,0.5);
  floor(g,x0,x1,y1);
  sunlight(g);
  rug(g);
  plant2(g,112,FLOOR+60,1.1,false); plant2(g,800,FLOOR+48,0.9,false); plant2(g,-122,FLOOR+92,1.45,true);
  armchair(g,1010,FLOOR+74);
  if(!live) drawCurtains(g,0,false);
  bakedGlows(g,x0,x1);
};
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
function twinkle(g,t,tier,x0,x1){
  add(g,function(g){
    var B=garland().bulbs, step=tier>=2?1:2;
    for(var i=0;i<B.length;i+=step){ var b=B[i]; if(b.x<x0-20||b.x>x1+20) continue;
      var a=Math.sin(t*1.6+b.ph); if(a>0.15) Fx.glow(g,b.x,b.y,13,b.c,0.34*a); }
    for(var j=0;j<MB.length;j++){ var m=MB[j], a2=0.5+0.5*Math.sin(t*1.15+j*0.85); Fx.glow(g,m[0],m[1],22,'#fff0c0',0.24*a2); }
  });
}
Room.ambient=function(g,t,tier){
  oldAmbient(g,t,tier);
  if(!anim(tier)) return;
  var T=g.getTransform(), x0=-T.e/T.a, x1=(g.canvas.width-T.e)/T.a;
  clouds(g,t); liveFish(g,t); drawCurtains(g,t,true); twinkle(g,t,tier,x0,x1);
};
})();
