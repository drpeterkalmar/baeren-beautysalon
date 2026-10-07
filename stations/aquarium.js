// stations/aquarium.js — Aquarium: Deko wählen, Futter-Dose antippen → Körner fallen, Fische schnappen zu; der Bär steht
// neben (quer) bzw. unter (hoch) dem Becken und schaut hinein. Simulation in update (Schritt 6, bildraten-unabhängig).
// S.aquaFocus (Kamera-Ausschnitt) und S.aquaBlick (Blickziel des Bären) nutzt game.js; aq._futterR/_dekoBox liest
// tools/visual-check.mjs --only=r19 (Verdeckungsprüfung).
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;
var AQUA_FARBEN = ['#ff8a5c','#ffd24d','#7ab8f5','#9b59b6','#ff6b9d','#2ecc71'];

S.registerStation({
  id:'aquarium',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Futter-Dose antippen: Futterkörner fallen — Fische schnappen zu! 🐟';
    if(!S.aqua) S.aqua={fisch:null, futter:[], blasen:[], deko:0, fuetter:0};
    [['⚓ Schiff','1'],['👑 Schatzkiste','2']].forEach(function(d,i){
      H.btn(30+i*160, 100, 150, 58, d[0], function(){
        S.aqua.deko=i+1; S.buildUI();
      },{active:function(){return S.aqua.deko===i+1;}, small:1});
    });
    H.btn(30, 170, 190, 64, '🥫 Futter!', function(){
      var aq=S.aqua;
      for(var i=0;i<8;i++){
        var AL=aquaLayout(); // r19: Körner fallen aus der Dose ins freie Wasser
        aq.futter.push({x:AL.canX+(Math.random()-0.5)*120, y:AL.by0+6-Math.random()*10, vy:22+Math.random()*30,
          ph:Math.random()*6});
      }
      aq.fuetter=1.2;
      S.baer.jubelT2=Math.max(S.baer.jubelT2||0,1.2);
      S.buildUI();
    }, {active:function(){return S.aqua && S.aqua.futter.length>0;}, big:1});
  },
  update:function(dt,fr){ if(S.aqua) updAquarium(fr); },
  draw:function(g){ drawAquarium(g); },
  tap:function(){ return false; }
});

// ---- Runde 9: Aquarium ------------------------------------------------------
// r19: Der Bär steht NEBEN (quer) bzw. UNTER (hoch) dem Becken und schaut hinein — Fische, Futter, Blasen und Deko
// bleiben sichtbar. Fische schwimmen nur im freien Teil des Beckens (fr). Kamera-Ausschnitt: S.aquaFocus (game.js).
var FISCH_K=1.35, FUTTER_R=5; // r19: Fische ×1.35, Futterkorn 4 → 5
function aquaLayout(){
  var L=window.BSUI && window.BSUI.L, port=L ? L.port!==false : true, o;
  if(port) o={port:true, bx0:140, by0:30, bw:620, bh:350, bear:{cx:450, cy:625, s:1.05}, deko:0.2, focus:[120,-35,780,860]};
  else o={port:false, bx0:-30, by0:60, bw:720, bh:430, bear:{cx:855, cy:392, s:1.0}, deko:0.3, focus:[-60,-10,1085,625]};
  var fr={x0:o.bx0+26, x1:o.bx0+o.bw-26, y0:o.by0+24, y1:o.by0+o.bh-40};
  if(!port) fr.x1=Math.min(fr.x1, o.bear.cx-150*o.bear.s-30); // quer: nicht hinter den Bären schwimmen
  o.fr=fr; o.canX=(fr.x0+fr.x1)/2; return o;
}
S.aquaFocus=function(){ return aquaLayout().focus; };
// Blickziel für den Bären: Futter, sonst abwechselnd ein Fisch
S.aquaBlick=function(){
  var aq=S.aqua; if(!aq || !aq.fisch) return null;
  if(aq.futter.length) { var f=aq.futter[0]; return [f.x,f.y]; }
  var fi=aq.fisch[Math.floor(performance.now()/2600)%aq.fisch.length]; return fi?[fi.x,fi.y]:null;
};
function aquaInit(aq,fr){
  if(aq.fisch) return;
  aq.fisch=[];
  for(var i=0;i<6;i++){
    aq.fisch.push({
      x:fr.x0+Math.random()*(fr.x1-fr.x0), y:fr.y0+Math.random()*(fr.y1-fr.y0),
      vx:(Math.random()<0.5?-1:1)*(26+Math.random()*30),
      vy:(Math.random()-0.5)*18,
      c:AQUA_FARBEN[i%6], ph:Math.random()*6, s:(0.75+Math.random()*0.5)*FISCH_K,
      ziel:null
    });
  }
}
// Simulation (aus S.update): Futter sinkt und wabert, Fische schwimmen/schnappen, Blasen steigen, Dose kippt zurück.
// Reihenfolge und Zufallsaufrufe wie früher im Zeichenpfad; Schritte pro Bild × fr (bei 60 Hz identisch).
// Wie früher sind Körner, die in diesem Schritt am Boden ankommen oder gefressen werden, in diesem Bild noch zu
// sehen (Zeichenlisten aq._futterBild/_blasenBild); ebenso Blasen, die in diesem Schritt oben ankommen.
function updAquarium(fr){
  var aq=S.aqua, A=aquaLayout(), fr0=A.fr, by0=A.by0, bh=A.bh;
  aquaInit(aq,fr0);
  var t=performance.now()/1000;
  // Futter-Körner: sinken, wabern
  for(var fi=aq.futter.length-1;fi>=0;fi--){
    var fd=aq.futter[fi];
    if(fd.y<by0+6) fd.y=by0+6; // r19: Körner starten an der Dose über dem freien Wasser
    fd.y+=fd.vy*0.016*fr; fd.vy=Math.min(fd.vy+8*0.016*fr, 46);
    fd.x+=Math.sin(t*3+fd.ph)*0.6*fr;
  }
  aq._futterBild=aq.futter.slice();
  for(fi=aq.futter.length-1;fi>=0;fi--) if(aq.futter[fi].y>by0+bh-30) aq.futter.splice(fi,1);
  // Fische: idle schwimmen; Futter = schwimmen heran und schnappen
  aq.fisch.forEach(function(f){
    var naechstes=null, nd=1e9;
    for(var fx=0;fx<aq.futter.length;fx++){
      var fk=aq.futter[fx];
      var d2=(fk.x-f.x)*(fk.x-f.x)+(fk.y-f.y)*(fk.y-f.y);
      if(d2<nd){ nd=d2; naechstes=fk; }
    }
    if(naechstes){
      var dx=naechstes.x-f.x, dy=naechstes.y-f.y, dd=Math.sqrt(nd)||1;
      f.vx+=(dx/dd)*90*0.016*fr; f.vy+=(dy/dd)*90*0.016*fr;
      if(dd<16*f.s/FISCH_K+4){ // schnappen!
        var idx=aq.futter.indexOf(naechstes); aq.futter.splice(idx,1);
        for(var bp=0;bp<5;bp++) aq.blasen.push({x:f.x+(Math.random()-0.5)*10,y:f.y-8,t:0,v:-60-Math.random()*30});
        window.BSGame && window.BSGame.spaTupfer && window.BSGame.spaTupfer(f.x,f.y);
        if(t-(aq._freuT||0)>0.9){ aq._freuT=t; S.H.react('happy',0.5); } // r19: Bär freut sich mit
      }
    } else {
      // sanfte Idle-Wanderung
      f.vx+=(Math.random()-0.5)*18*0.016*fr;
      f.vy+=(Math.random()-0.5)*12*0.016*fr;
    }
    var vmax=70, vmag=Math.hypot(f.vx,f.vy)||1;
    if(vmag>vmax){ f.vx*=vmax/vmag; f.vy*=vmax/vmag; }
    f.x+=f.vx*0.016*3.4*fr; f.y+=f.vy*0.016*3.4*fr;
    if(f.x<fr0.x0){ f.x=fr0.x0; f.vx=Math.abs(f.vx); }
    if(f.x>fr0.x1){ f.x=fr0.x1; f.vx=-Math.abs(f.vx); }
    if(f.y<fr0.y0){ f.y=fr0.y0; f.vy=Math.abs(f.vy)*0.6; }
    if(f.y>fr0.y1){ f.y=fr0.y1; f.vy=-Math.abs(f.vy)*0.6; }
    if(Math.random()<0.006*fr) aq.blasen.push({x:f.x,y:f.y-8,t:0,v:-40-Math.random()*25});
  });
  // Blasen: steigen auf
  for(var bi=aq.blasen.length-1;bi>=0;bi--){
    var bl=aq.blasen[bi];
    bl.t+=0.016*fr; bl.y+=bl.v*0.016*fr; bl.x+=Math.sin(bl.t*7)*0.8*fr;
  }
  aq._blasenBild=aq.blasen.slice();
  for(bi=aq.blasen.length-1;bi>=0;bi--){ var b0=aq.blasen[bi]; if(b0.y<by0+6 || b0.t>2.2) aq.blasen.splice(bi,1); }
  if(aq.fuetter>0) aq.fuetter=Math.max(0,aq.fuetter-0.016*fr);
}
function drawAquarium(g){
  var aq=S.aqua; if(!aq) return;
  var A=aquaLayout(), fr=A.fr;
  aquaInit(aq,fr);
  aq._futterR=FUTTER_R;
  var t=performance.now()/1000;
  var W=S.VW,H=S.VH;
  // Becken: Wasser-Gradient + Sand + Glas-Rand
  var bx0=A.bx0, by0=A.by0, bw=A.bw, bh=A.bh;
  if(Fx.DEKO && window.BSDeko && window.BSDeko.aquaBack){ window.BSDeko.aquaBack(g,A,t); } else { // r20: gebackenes Becken + Pflanzen
  var grd=g.createLinearGradient(0,by0,0,by0+bh);
  grd.addColorStop(0,'#9fdcf5'); grd.addColorStop(0.7,'#3f9fd8'); grd.addColorStop(1,'#1a6fae');
  g.fillStyle=grd; g.fillRect(bx0,by0,bw,bh);
  g.fillStyle='#e8d9ac'; g.fillRect(bx0,by0+bh-26,bw,26); // Sand
  for(var sd=0;sd<Math.floor(bw/46);sd++){ S.H.circle2(g,bx0+20+sd*46,by0+bh-10-((sd*29)%10),3,'#d9c48c'); }
  g.strokeStyle='rgba(255,255,255,0.75)'; g.lineWidth=4; g.strokeRect(bx0,by0,bw,bh);
  g.strokeStyle='rgba(60,120,160,0.35)'; g.lineWidth=1;
  for(var wl=0;wl<4;wl++){ // Wellen-Linien
    g.beginPath();
    for(var wxl=0;wxl<=20;wxl++) g.lineTo(bx0+wxl*(bw/20), by0+18+wl*bh*0.1+Math.sin(t*2+wxl*0.8+wl)*4);
    g.stroke();
  }
  }
  // Deko (im freien Teil des Beckens)
  var dx=bx0+bw*A.deko;
  if(aq.deko===1){ drawSchiff(g, dx, by0+bh-64, 1); aq._dekoBox=[dx-50,by0+bh-64-54,100,78]; }
  else if(aq.deko===2){ drawSchatz(g, dx, by0+bh-58, 1, t); aq._dekoBox=[dx-34,by0+bh-58-42,68,60]; }
  else aq._dekoBox=null;
  // Futter-Körner (Bewegung in updAquarium; Zeichenliste enthält auch die eben gefressenen/gelandeten)
  var fb=aq._futterBild||aq.futter;
  for(var fi=fb.length-1;fi>=0;fi--){
    var fd=fb[fi];
    S.H.circle2(g,fd.x,fd.y,FUTTER_R,'#8a5a2a');
    S.H.circle2(g,fd.x-1.2,fd.y-1.2,FUTTER_R*0.45,'#c99a4f');
  }
  // Fische
  aq.fisch.forEach(function(f){ drawFisch(g, f.x, f.y, f.s, f.c, f.vx<0, t+f.ph); });
  // Blasen
  var bb=aq._blasenBild||aq.blasen;
  for(var bi=bb.length-1;bi>=0;bi--){
    var bl=bb[bi];
    g.globalAlpha=Math.max(0,0.8-bl.t*0.4);
    g.strokeStyle='rgba(255,255,255,0.9)'; g.lineWidth=1.6;
    g.beginPath(); g.arc(bl.x,bl.y,3+bl.t*2,0,Math.PI*2); g.stroke();
  }
  g.globalAlpha=1;
  // Futter-Dose über dem freien Wasser, kippt beim Füttern
  var cx=A.canX, tilt=Math.sin(Math.min(1,aq.fuetter/1.2)*Math.PI)*0.5;
  g.save(); g.translate(cx,by0-26); g.rotate(tilt);
  g.fillStyle='#c0392b'; g.fillRect(-26,-20,52,40);
  g.fillStyle='#e74c3c'; g.fillRect(-30,-26,60,10);
  g.fillStyle='#fff'; g.font='11px sans-serif'; g.textAlign='center';
  g.fillText('Futter',0,2);
  g.restore();
  // Bär steht am Becken und schaut hinein
  Art.drawBear(g,S.baer,{w:W,h:H, spaTarget:S.spaTarget, cx:A.bear.cx, cy:A.bear.cy, s:A.bear.s});
}
function drawFisch(g,x,y,sc,c,flip,t){
  g.save(); g.translate(x,y); g.scale(flip?-sc:sc, sc);
  g.fillStyle=c;
  g.beginPath(); g.ellipse(0,0,16,9,0,0,Math.PI*2); g.fill();
  // Schwanz
  g.beginPath(); g.moveTo(-14,0); g.lineTo(-26,-8+Math.sin(t*7)*4); g.lineTo(-26,8+Math.sin(t*7)*4); g.closePath(); g.fillStyle=Art.shade(c,-25); g.fill();
  // Streifen
  g.strokeStyle='rgba(255,255,255,0.6)'; g.lineWidth=2;
  g.beginPath(); g.moveTo(-4,-7); g.lineTo(-4,7); g.stroke();
  g.beginPath(); g.moveTo(4,-7); g.lineTo(4,7); g.stroke();
  // Glanz + Auge
  g.fillStyle='rgba(255,255,255,0.55)';
  g.beginPath(); g.ellipse(2,-4,6,2.6,-0.3,0,Math.PI*2); g.fill();
  S.H.circle2(g,9,-2,2.6,'#2b2b3a'); S.H.circle2(g,10,-3,1,'#fff');
  g.restore();
}
function drawSchiff(g,x,y,sc){
  g.save(); g.translate(x,y); g.scale(sc,sc);
  g.fillStyle='#8a5a2a'; g.strokeStyle='#5a3a1a'; g.lineWidth=2;
  g.beginPath(); g.moveTo(-50,0); g.lineTo(50,0); g.lineTo(34,24); g.lineTo(-34,24); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#a8723a'; g.fillRect(-4,-46,8,46); // Mast
  g.fillStyle='#f7f2e8';
  g.beginPath(); g.moveTo(4,-42); g.lineTo(38,-42); g.lineTo(4,-8); g.closePath(); g.fill(); // Segel
  g.fillStyle='#e74c3c'; g.fillRect(-4,-54,22,10); // Fähnchen
  g.restore();
}
function drawSchatz(g,x,y,sc,t){
  g.save(); g.translate(x,y); g.scale(sc,sc);
  g.fillStyle='#7a4b22'; g.strokeStyle='#4a2c10'; g.lineWidth=2.5;
  g.beginPath(); g.rect(-34,-8,68,26); g.fill(); g.stroke();
  g.beginPath(); g.arc(0,-8,34,Math.PI,0); g.fillStyle='#8a5a2a'; g.fill(); g.stroke();
  g.fillStyle='#f5c542'; g.fillRect(-4,-14,8,20); // Schloss
  // Gold-Funkeln
  for(var i=0;i<3;i++) Art.drawSticker(g,'stern',-22+i*22,-20-((i*13)%8),5+2*Math.sin(t*4+i),'#ffd24d');
  g.restore();
}
})();
