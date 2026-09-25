// room.js — der Salon: statischer Raum (game.js cacht ihn offscreen pro Kamera-Ruhelage) + leichte Ambient-Ebene
(function(){
'use strict';
var Fx=window.BSFx, TAU=Math.PI*2;
var Room=window.BSRoom={};
var FLOOR=462;

function shelf(g,x,y,w){
  Fx.contactShadow(g,x+w/2,y+14,w*0.55,10,0.5);
  var sg=g.createLinearGradient(0,y-4,0,y+12); sg.addColorStop(0,'#f3d2b4'); sg.addColorStop(1,'#d4a47f');
  g.fillStyle=sg; Fx.rr(g,x,y,w,12,6); g.fill();
  var items=[['#f7a8c0',18,40],['#9fd6c8',14,52],['#ffd98a',20,34],['#c9b3ea',13,46],['#f6b58f',16,38]];
  var px=x+16;
  items.forEach(function(it,i){
    var bw=it[1], bh=it[2], bx=px+bw;
    Fx.contactShadow(g,bx,y+1,bw*1.1,4,0.4);
    g.save(); g.shadowColor='rgba(120,60,60,0.25)'; g.shadowBlur=3;
    var bg=g.createLinearGradient(bx-bw,0,bx+bw,0); bg.addColorStop(0,Fx.warmLight(it[0],0.45)); bg.addColorStop(0.55,it[0]); bg.addColorStop(1,Fx.warmShadow(it[0],0.35));
    g.fillStyle=bg; Fx.rr(g,bx-bw,y-bh,bw*2,bh,bw*0.8); g.fill(); g.restore();
    g.fillStyle=Fx.warmShadow(it[0],0.4); Fx.rr(g,bx-bw*0.45,y-bh-9,bw*0.9,11,3); g.fill();
    g.fillStyle='rgba(255,255,255,0.55)'; Fx.rr(g,bx-bw*0.6,y-bh+6,bw*0.35,bh*0.6,bw*0.2); g.fill();
    px+=bw*2+12;
  });
}
function plant(g,x,y,sc){
  g.save(); g.translate(x,y); g.scale(sc,sc);
  Fx.contactShadow(g,0,4,52,12,0.6);
  var leaves=[[-0.9,70],[-0.45,92],[0,100],[0.45,90],[0.9,72],[-0.2,80],[0.25,84]];
  leaves.forEach(function(l,i){
    g.save(); g.translate(0,-50); g.rotate(l[0]);
    var lg=g.createLinearGradient(-14,0,14,-l[1]); lg.addColorStop(0,'#5f9a64'); lg.addColorStop(1,'#9fcf8e');
    g.fillStyle=lg; g.beginPath(); g.moveTo(0,0); g.bezierCurveTo(-24,-l[1]*0.4,-14,-l[1]*0.9,0,-l[1]); g.bezierCurveTo(14,-l[1]*0.9,24,-l[1]*0.4,0,0); g.fill();
    g.restore();
  });
  var pg=g.createLinearGradient(-36,0,36,0); pg.addColorStop(0,'#f6b89c'); pg.addColorStop(0.6,'#e9937a'); pg.addColorStop(1,'#c9705c');
  g.fillStyle=pg; g.beginPath(); g.moveTo(-36,-56); g.lineTo(36,-56); g.quadraticCurveTo(32,0,24,0); g.lineTo(-24,0); g.quadraticCurveTo(-32,0,-36,-56); g.fill();
  g.fillStyle='#f7c4ac'; Fx.rr(g,-40,-62,80,12,6); g.fill();
  g.restore();
}
function lamp(g,x,y){
  g.strokeStyle='rgba(150,110,90,0.7)'; g.lineWidth=2; g.beginPath(); g.moveTo(x,-400); g.lineTo(x,y-26); g.stroke();
  Fx.glow(g,x,y+30,150,'#ffe2b0',0.55);
  var lg=g.createLinearGradient(0,y-26,0,y+14); lg.addColorStop(0,'#fbd9c4'); lg.addColorStop(1,'#e9a996');
  g.fillStyle=lg; g.beginPath(); g.moveTo(x-12,y-26); g.lineTo(x+12,y-26); g.quadraticCurveTo(x+40,y-6,x+40,y+14); g.lineTo(x-40,y+14); g.quadraticCurveTo(x-40,y-6,x-12,y-26); g.fill();
  Fx.ball(g,x,y+16,14,9,'#fff4d8');
}

Room.draw=function(g,x0,y0,x1,y1){
  var w=x1-x0, h=y1-y0;
  // Wand: warmer Pfirsich-Verlauf + zarte Tapeten-Streifen + Pünktchen
  var wg=g.createLinearGradient(0,y0,0,FLOOR); wg.addColorStop(0,'#f9e3d2'); wg.addColorStop(1,'#f2cdb8');
  g.fillStyle=wg; g.fillRect(x0,y0,w,FLOOR-y0+2);
  g.fillStyle='rgba(255,246,238,0.38)';
  var s0=Math.floor(x0/72)*72;
  for(var sx=s0;sx<x1;sx+=72) g.fillRect(sx,y0,30,FLOOR-y0);
  // Tapeten-Pünktchen: rasterfest (gleiches Muster, egal welcher Ausschnitt gebacken wird)
  for(var cx=Math.floor(x0/64);cx*64<x1;cx++) for(var cy=Math.floor(y0/64);cy*64<FLOOR-90;cy++){
    var hsh=((cx*73856093)^(cy*19349663))>>>0, R=Fx.rand(hsh);
    Art_dot(g,cx*64+R()*64,cy*64+R()*64,R());
  }
  // Sockel-Vertäfelung
  var wy=372;
  var pg=g.createLinearGradient(0,wy,0,FLOOR); pg.addColorStop(0,'#fdf1e6'); pg.addColorStop(1,'#f0dcc8');
  g.fillStyle=pg; g.fillRect(x0,wy,w,FLOOR-wy);
  g.fillStyle='#fff8f0'; g.fillRect(x0,wy-8,w,10); g.fillStyle='rgba(160,100,80,0.18)'; g.fillRect(x0,wy+2,w,3);
  g.strokeStyle='rgba(170,120,100,0.18)'; g.lineWidth=2;
  var p0=Math.floor(x0/120)*120; for(var qx=p0;qx<x1;qx+=120){ Fx.rr(g,qx+14,wy+16,92,FLOOR-wy-30,10); g.stroke(); }
  // Fenster rechts mit Vorhängen + Lichtkegel
  var fx=660, fy=74, fw=170, fh=220;
  g.save(); g.shadowColor='rgba(120,60,50,0.25)'; g.shadowBlur=14; g.shadowOffsetY=6;
  g.fillStyle='#fffaf3'; Fx.rr(g,fx-12,fy-12,fw+24,fh+24,70); g.fill(); g.restore();
  var sky=g.createLinearGradient(0,fy,0,fy+fh); sky.addColorStop(0,'#bfe3f2'); sky.addColorStop(1,'#fbe6cf');
  g.fillStyle=sky; Fx.rr(g,fx,fy,fw,fh,62); g.fill();
  g.save(); Fx.rr(g,fx,fy,fw,fh,62); g.clip();
  [[fx+40,fy+70,22],[fx+120,fy+110,18]].forEach(function(c){ Fx.glow(g,c[0],c[1],c[2]*2.4,'#ffffff',0.9); });
  Fx.ball(g,fx+fw*0.5,fy+fh+40,120,70,'#b9dca0');
  g.restore();
  g.fillStyle='#fffaf3'; g.fillRect(fx+fw/2-4,fy,8,fh); g.fillRect(fx,fy+fh*0.52,fw,8);
  [[fx-26,1],[fx+fw+26,-1]].forEach(function(c){
    var cg=g.createLinearGradient(c[0]-26,0,c[0]+26,0); cg.addColorStop(0,'#f6b5b9'); cg.addColorStop(0.5,'#fbd0cf'); cg.addColorStop(1,'#eea3a8');
    g.fillStyle=cg; g.beginPath(); g.moveTo(c[0]-24,fy-24); g.lineTo(c[0]+24,fy-24);
    g.bezierCurveTo(c[0]+30,fy+80,c[0]+10*c[1]+14,fy+170,c[0]+26,fy+fh+30); g.lineTo(c[0]-26,fy+fh+30);
    g.bezierCurveTo(c[0]-12,fy+170,c[0]-30,fy+80,c[0]-24,fy-24); g.fill();
  });
  g.fillStyle='#e7b28c'; Fx.rr(g,fx-60,fy-34,fw+120,10,5); g.fill();
  // großer Bogen-Spiegel hinter dem Bären (Halo fürs Gesicht)
  var mx=450, my0=26, mw=300, mh=420;
  g.save(); g.shadowColor='rgba(120,60,50,0.28)'; g.shadowBlur=18; g.shadowOffsetY=8;
  var gf=g.createLinearGradient(mx-mw/2,my0,mx+mw/2,my0+mh); gf.addColorStop(0,'#f8dca0'); gf.addColorStop(0.5,'#e6b86a'); gf.addColorStop(1,'#c89048');
  g.fillStyle=gf; Fx.rr(g,mx-mw/2-16,my0-16,mw+32,mh+32,(mw+32)/2); g.fill(); g.restore();
  var mg=g.createRadialGradient(mx-40,my0+120,20,mx,my0+200,mh*0.75); mg.addColorStop(0,'#fdf7f1'); mg.addColorStop(0.6,'#ecf0f0'); mg.addColorStop(1,'#d5dde0');
  g.fillStyle=mg; Fx.rr(g,mx-mw/2,my0,mw,mh,mw/2); g.fill();
  g.save(); Fx.rr(g,mx-mw/2,my0,mw,mh,mw/2); g.clip();
  g.fillStyle='rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(mx-mw/2+30,my0+mh); g.lineTo(mx-mw/2+110,my0); g.lineTo(mx-mw/2+150,my0); g.lineTo(mx-mw/2+70,my0+mh); g.fill();
  g.fillStyle='rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(mx-mw/2+100,my0+mh); g.lineTo(mx-mw/2+180,my0); g.lineTo(mx-mw/2+196,my0); g.lineTo(mx-mw/2+116,my0+mh); g.fill();
  g.restore();
  for(var b=0;b<9;b++){ var a=Math.PI+b*Math.PI/8; Fx.ball(g,mx+Math.cos(a)*(mw/2+8),my0+mw/2+Math.sin(a)*(mw/2+8),7,7,'#fff1c8'); }
  // Regale + Pflanzen links
  shelf(g,40,210,190); shelf(g,60,320,170);
  lamp(g,210,70); lamp(g,690,-10);
  // Boden: warmes Holz
  var fg=g.createLinearGradient(0,FLOOR,0,y1); fg.addColorStop(0,'#e9bf98'); fg.addColorStop(1,'#d8a47c');
  g.fillStyle=fg; g.fillRect(x0,FLOOR,w,y1-FLOOR+2);
  g.fillStyle='rgba(120,70,50,0.25)'; g.fillRect(x0,FLOOR,w,4);
  g.strokeStyle='rgba(150,90,60,0.16)'; g.lineWidth=2;
  for(var fy2=FLOOR+34, n=0; fy2<y1; fy2+=34+n*6, n++){ g.beginPath(); g.moveTo(x0,fy2); g.lineTo(x1,fy2); g.stroke();
    var off=(n%2)*90; for(var vx=Math.floor(x0/180)*180+off; vx<x1; vx+=180){ g.beginPath(); g.moveTo(vx,fy2); g.lineTo(vx,fy2+34+n*6); g.stroke(); } }
  // Licht vom Fenster auf dem Boden
  g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha=0.16;
  var lg2=g.createLinearGradient(fx,fy,fx-160,FLOOR+140); lg2.addColorStop(0,'#ffe9c8'); lg2.addColorStop(1,'rgba(255,233,200,0)');
  g.fillStyle=lg2; g.beginPath(); g.moveTo(fx,fy+30); g.lineTo(fx+fw,fy+30); g.lineTo(fx+60,FLOOR+170); g.lineTo(fx-230,FLOOR+170); g.closePath(); g.fill(); g.restore();
  // runder Teppich unter dem Bären (Wellenrand)
  var rx=450, ry=632;
  Fx.contactShadow(g,rx,ry+8,330,64,0.35);
  g.fillStyle='#f6c2c6'; g.beginPath();
  for(var k=0;k<=48;k++){ var a2=k/48*TAU, rr=1+0.03*Math.cos(a2*16); var X=rx+Math.cos(a2)*310*rr, Y=ry+Math.sin(a2)*58*rr; if(k) g.lineTo(X,Y); else g.moveTo(X,Y); }
  g.fill();
  var tg=g.createRadialGradient(rx-60,ry-20,20,rx,ry,300); tg.addColorStop(0,'#ffe5e2'); tg.addColorStop(1,'#f7c9cb');
  g.fillStyle=tg; g.beginPath(); g.ellipse(rx,ry,280,48,0,0,TAU); g.fill();
  g.strokeStyle='rgba(255,255,255,0.6)'; g.lineWidth=3; g.setLineDash([2,10]); g.lineCap='round'; g.beginPath(); g.ellipse(rx,ry,262,40,0,0,TAU); g.stroke(); g.setLineDash([]);
  plant(g,112,FLOOR+60,1.1); plant(g,800,FLOOR+48,0.9);
};
function Art_dot(g,x,y,r){
  g.fillStyle=r<0.5?'rgba(255,255,255,0.35)':'rgba(236,170,160,0.22)';
  g.beginPath(); g.arc(x,y,1.6+r*1.6,0,TAU); g.fill();
}

// Ambient: Staubkörnchen im Fensterlicht (wenige, günstige Glow-Sprites)
var motes=null;
Room.ambient=function(g,t,tier){
  if(!motes){ motes=[]; var R=Fx.rand(21); for(var i=0;i<18;i++) motes.push([R(),R(),R()*TAU,0.4+R()*0.6]); }
  var n=[6,12,18][tier||0];
  for(var i=0;i<n;i++){
    var m=motes[i], x=560+m[0]*260+Math.sin(t*0.3+m[2])*30, y=90+((m[1]*400+t*8*m[3])%420);
    var a=0.25+0.25*Math.sin(t*1.7+m[2]);
    Fx.glow(g,x,y,5+m[3]*5,'#fff3d6',a);
  }
};
})();
