// art.js — R18 Bär-Renderer (Neubau). Kawaii-Plastik-Look:
// jedes Körperteil ist ein glatter Blob, EINMAL pro Modell × Auflösung in einen Offscreen-Canvas gebacken
// (Grundfarbe → Muster → Flausch-Textur (soft-light) → Form-Schatten (multiply) → Keylight/Bounce (screen) → weiche Kontur).
// Pro Frame: nur drawImage der Sprites mit Pose-Transformationen + wenige Live-Details (Augen, Mund, Zustände).
(function(){
'use strict';
var Art = window.BSArt = {};
var Fx = window.BSFx;
var TAU = Math.PI*2;

// ================================================================ Daten (Identität aus R17 übernommen)
Art.MODELS = [
  {name:'Braunbär',  fell:'#a9744f'},
  {name:'Honigbär',  fell:'#d9a94f'},
  {name:'Panda',     fell:'#f2f0ea', ohren:'#3b3330', arme:'#3b3330', muster:'panda', hell:1},
  {name:'Eisbär',    fell:'#f4f6f7', schnauze:'#dfe9ee', kontur:'#9fb2c0', hell:1},
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
  {name:'Kaktus-Bär', fell:'#3f9e57', schnauze:'#9fd8ae', muster:'kaktus', kontur:'#25703b'},
  {name:'Fee-Bär', fell:'#b8e6b0', schnauze:'#eafbe4', muster:'fee', kontur:'#6fae68', hell:1},
  {name:'Ninja-Bär', fell:'#4a4f58', schnauze:'#8b929e', muster:'ninja', kontur:'#2c3037'},
  {name:'Küsten-Bär', fell:'#e6d3a3', schnauze:'#f7ecd2', muster:'kueste', hell:1},
  {name:'Gala-Bär', fell:'#33477a', schnauze:'#7d90c4', muster:'gala', kontur:'#1e2a4e'},
  {name:'Astronaut-Bär', fell:'#e8ecf2', schnauze:'#cfd8e2', muster:'astro', kontur:'#8d99a8', hell:1},
  {name:'Feuerwehr-Bär', fell:'#c0392b', schnauze:'#f0b8a8', muster:'feuer', kontur:'#7e2318'},
  {name:'Blumen-Bär', fell:'#f2d24b', schnauze:'#fdf0b8', muster:'blumenb', kontur:'#b89b22'},
  {name:'Mond-Bär', fell:'#4a5270', schnauze:'#8d97b5', muster:'mond', kontur:'#2c3248'},
  {name:'Engel-Bär', fell:'#f7f3ea', schnauze:'#f5e0c8', muster:'engel', kontur:'#c9b98a', hell:1},
  {name:'Clown-Bär', fell:'#f4e2c8', schnauze:'#ffe3d0', muster:'clown', kontur:'#b08a5a'},
  {name:'Wikinger-Bär', fell:'#8a7a66', schnauze:'#c9b8a0', muster:'wikinger', kontur:'#55483a'},
  {name:'Cowboy-Bär', fell:'#d0a76b', schnauze:'#eed9ae', muster:'cowboy', kontur:'#8a6438'},
  {name:'Überraschung?', fell:'#dcc9f2', schnauze:'#f3e9ff', muster:'frage', kontur:'#a37fd1', hell:1}
];
Art.HAAR = ['#5a3a1e','#3b3330','#c0392b','#e67e22','#f1c40f','#8e44ad','#16a085','#e91e63'];
Art.LACK = ['#e91e63','#e74c3c','#f39c12','#2ecc71','#3498db','#9b59b6','#ffffff'];
Art.FRISEURE = ['lockig','kurz','zottig','igel','afro'];
Art.HUTE = ['#c0392b','#2980b9','#27ae60'];
Art.BRILLEN = ['#e91e63','#f1c40f','#34495e'];
Art.SCHLEIFEN = ['#e91e63','#9b59b6','#16a085'];
Art.KETTEN = ['#f1c40f','#ecf0f1','#e91e63'];
Art.ROUGE = ['#ff6b81','#ff9eb5','#e75480','#ff7f50','#c94f6d'];
Art.LIDSCHATTEN = ['#9b59b6','#3498db','#f1c40f','#16a085','#ff8fb3'];
Art.EIS_FARBEN = ['#ff9eb5','#e8c878','#8fd48a','#7ab8f5','#c39bd3'];
Art.WAFFELN = ['tue','bech','herz'];
Art.FOTO_RAHMEN = ['sterne','blumen','gold'];
Art.shade = function(c,amt){ return Fx.shade(c,amt); };
Art.liveBear = null;

// ================================================================ Anatomie (Bär-Einheiten, Ursprung = (cx,cy), s=1)
// Kopf (0,-82) · Körper (0,70) · Ohren kopflokal (±70,-68) · Schnauze kopflokal (0,24) · Augen kopflokal (±34,-16)
// Schulter-Pivot (±90,-2) · Füße (±58,158), Zehen/Krallen (±58+(i-1)*16, ~178) — passend zu den Hit-Zonen in salon.js
var HEAD_Y=-82, BODY_Y=70, EAR_X=70, EAR_Y=-68, SNOUT_Y=24, EYE_X=34, EYE_Y=-16, ARM_X=90, ARM_Y=-2, FOOT_X=58, FOOT_Y=158;

function headPath(g){ // EINE glatte Kontur: runde Stirn, volle Wangen
  g.beginPath(); g.moveTo(0,-90);
  g.bezierCurveTo(64,-90,100,-58,104,-16); g.bezierCurveTo(116,18,114,66,62,82);
  g.bezierCurveTo(30,91,-30,91,-62,82); g.bezierCurveTo(-114,66,-116,18,-104,-16);
  g.bezierCurveTo(-100,-58,-64,-90,0,-90); g.closePath();
}
function bodyPath(g){
  g.beginPath(); g.moveTo(0,-112);
  g.bezierCurveTo(80,-112,126,-34,124,34); g.bezierCurveTo(122,92,76,112,0,112);
  g.bezierCurveTo(-76,112,-122,92,-124,34); g.bezierCurveTo(-126,-34,-80,-112,0,-112); g.closePath();
}
function earPath(g){ g.beginPath(); g.arc(0,0,32,0,TAU); }
function snoutPath(g){ g.beginPath(); g.ellipse(0,0,42,30,0,0,TAU); }
function armPath(g){ // linker Arm, Ursprung = Schulter
  g.beginPath(); g.moveTo(-4,-10);
  g.bezierCurveTo(24,-12,26,40,16,82); g.bezierCurveTo(10,114,-42,118,-46,88);
  g.bezierCurveTo(-50,50,-36,-8,-4,-10); g.closePath();
}
function footPath(g){
  g.beginPath(); g.ellipse(0,0,48,32,0,0,TAU);
  for(var i=0;i<3;i++){ var x=(i-1)*16, y=i===1?21:18; g.moveTo(x+13,y); g.arc(x,y,13,0,TAU); }
}

// ================================================================ Farbpalette je Modell (robust gegen fehlende Felder)
var palCache={};
function pal(idx){
  var m=Art.MODELS[idx]||Art.MODELS[0], hit=palCache[m.name];
  if(hit) return hit;
  var f=m.fell||'#a9744f', L=Fx.lum(f);
  var P={ fell:f, lum:L, light:L>0.72, dark:L<0.36,
    schnauze: m.schnauze||Fx.warmLight(f,L>0.72?0.3:0.5),
    ohren: m.ohren||f, arme: m.arme||f, beine: m.arme||f,
    kontur: m.kontur||Fx.warmShadow(f,0.62),
    bauch: m.schnauze ? Fx.mix(f,m.schnauze,0.55) : Fx.warmLight(f,L>0.72?0.35:0.42),
    inner: Fx.mix(m.ohren||f,'#f3a3ad',0.5),
    pad: Fx.mix(m.arme||f,'#e9a3a3',0.45),
    nose: L<0.36 ? '#26191f' : '#4a2c2a',
    nail: '#f7eee4' };
  P.pad=Fx.warmShadow(P.pad,0.12);
  return (palCache[m.name]=P);
}
Art.palette = pal;

// ================================================================ Offscreen-Backen
function bake(x0,y0,w,h,k,fn){
  var c=Fx.canvas(w*k,h*k), g=c.getContext('2d');
  g.scale(c.width/w,c.height/h); g.translate(-x0,-y0);
  fn(g,k);
  return {cv:c,x:x0,y:y0,w:w,h:h};
}
function put(g,sp,x,y){ if(sp) g.drawImage(sp.cv,x+sp.x,y+sp.y,sp.w,sp.h); }
// Auflösungsstufen: Gerätepixel pro Bär-Einheit, nach oben gerundet (Sprites nie hochskaliert)
var KS=[0.12,0.18,0.25,0.35,0.5,0.7,1,1.4,1.8,2.3,2.8,3.4];
function quant(sc){ for(var i=0;i<KS.length;i++) if(KS[i]>=sc*0.94) return KS[i]; return KS[KS.length-1]; }

// Flausch-Textur: EINE neutrale Kachel (helle/dunkle weiche Tupfer, leicht in Fellrichtung gestreckt),
// wird per 'soft-light' eingerechnet → wirkt auf jeder Fellfarbe, ohne sie zu verschmutzen.
var furCv=null;
function furTile(){
  if(furCv) return furCv;
  var N=192, c=Fx.canvas(N,N), g=c.getContext('2d'), R=Fx.rand(4711);
  var lt=Fx.S.glow('#ffffff'), dk=Fx.S.glow('#000000');
  function dab(spr,x,y,rx,ry,rot,a){
    g.globalAlpha=a;
    for(var dx=-N;dx<=N;dx+=N) for(var dy=-N;dy<=N;dy+=N){
      if(x+dx<-rx*3||x+dx>N+rx*3||y+dy<-ry*3||y+dy>N+ry*3) continue;
      g.save(); g.translate(x+dx,y+dy); g.rotate(rot); g.drawImage(spr,-rx,-ry,rx*2,ry*2); g.restore();
    }
  }
  for(var i=0;i<26;i++) dab(R()<0.5?lt:dk,R()*N,R()*N,18+R()*22,18+R()*22,0,0.10);
  for(var j=0;j<620;j++){ var r=2.2+R()*3.6; dab(R()<0.55?lt:dk,R()*N,R()*N,r,r*2.2,(R()-0.5)*0.9,0.12+R()*0.2); }
  g.globalAlpha=1;
  return (furCv=c);
}
function fur(g,x,y,w,h,amt){
  var pat=g.createPattern(furTile(),'repeat');
  g.save(); g.globalCompositeOperation='soft-light'; g.globalAlpha=amt===undefined?0.62:amt;
  g.scale(0.62,0.62); g.fillStyle=pat; g.fillRect(x/0.62,y/0.62,w/0.62,h/0.62);
  g.restore();
}
// Form-Schatten: Keylight oben links, warmer Kernschatten unten rechts, Bounce-Rim ganz außen
function shadeForm(g,ox,oy,rx,ry,str){
  str=str===undefined?1:str;
  var R=Math.max(rx,ry), lx=ox-rx*0.36, ly=oy-ry*0.44;
  var x=ox-rx*1.4, y=oy-ry*1.4, w=rx*2.8, h=ry*2.8;
  g.save();
  g.globalCompositeOperation='multiply'; g.globalAlpha=str;
  var sh=g.createRadialGradient(lx,ly,R*0.08,lx+rx*0.1,ly+ry*0.12,R*1.5);
  sh.addColorStop(0,'#ffffff'); sh.addColorStop(0.46,'#fdf6f2'); sh.addColorStop(0.78,'#e2c3c4'); sh.addColorStop(1,'#b48593');
  g.fillStyle=sh; g.fillRect(x,y,w,h);
  g.globalCompositeOperation='screen'; g.globalAlpha=1;
  var hl=g.createRadialGradient(lx,ly,0,lx,ly,R*0.8);
  hl.addColorStop(0,'rgba(255,240,218,'+(0.42*str)+')'); hl.addColorStop(1,'rgba(255,240,218,0)');
  g.fillStyle=hl; g.fillRect(x,y,w,h);
  var rim=g.createRadialGradient(lx,ly,R*1.2,lx,ly,R*1.62);
  rim.addColorStop(0,'rgba(255,200,168,0)'); rim.addColorStop(1,'rgba(255,200,168,'+(0.34*str)+')');
  g.fillStyle=rim; g.fillRect(x,y,w,h);
  g.restore();
}
// komplettes Körperteil: weiche Kontur (Schatten-Blur) → Farbe → Muster → Flausch → Form-Schatten → Innen-Kante
function paintPart(g,k,path,col,kon,ox,oy,rx,ry,inner,furAmt,noEdge){
  g.save(); g.shadowColor=Fx.alpha(kon,0.85); g.shadowBlur=Math.max(1.2,2.6*k);
  path(g); g.fillStyle=col; g.fill(); g.restore();
  g.save(); path(g); g.clip();
  if(inner) inner(g);
  fur(g,ox-rx*1.3,oy-ry*1.3,rx*2.6,ry*2.6,furAmt);
  shadeForm(g,ox,oy,rx,ry);
  if(!noEdge){ path(g); g.lineWidth=3.2; g.strokeStyle=Fx.alpha(kon,0.4); g.stroke(); }
  g.restore();
}
// weich auslaufende Ellipse (Flecken, Bauch, Wangen)
function softEll(g,x,y,rx,ry,col,rot,feather){
  if(!(rx>0&&ry>0)) return;
  g.save(); g.translate(x,y); g.rotate(rot||0); g.scale(rx,ry);
  var gr=g.createRadialGradient(0,0,0,0,0,1), f=feather===undefined?0.18:feather;
  gr.addColorStop(0,col); gr.addColorStop(Math.max(0,1-f),col); gr.addColorStop(1,Fx.alpha(col,0));
  g.fillStyle=gr; g.beginPath(); g.arc(0,0,1,0,TAU); g.fill(); g.restore();
}
function ell(g,x,y,rx,ry,col,rot){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,Math.max(0.1,rx),Math.max(0.1,ry),rot||0,0,TAU); g.fill(); }
// plastisches Objekt (Hüte, Hörner, Accessoires): Kontur-Blur + Verlauf + Glanz
function obj(g,k,path,col,ox,oy,rx,ry,kon){
  g.save(); g.shadowColor=Fx.alpha(kon||Fx.warmShadow(col,0.7),0.8); g.shadowBlur=Math.max(1,2*k);
  path(g); g.fillStyle=col; g.fill(); g.restore();
  g.save(); path(g); g.clip(); shadeForm(g,ox,oy,rx,ry,0.9); g.restore();
}
function sticker(g,typ,x,y,r,col){
  g.fillStyle=col;
  if(typ==='herz'){ Fx.heartPath(g,x,y,r); g.fill(); }
  else if(typ==='blume'){ Fx.flowerPath(g,x,y,r); g.fill(); g.fillStyle='#ffe07a'; g.beginPath(); g.arc(x,y,r*0.3,0,TAU); g.fill(); }
  else { Fx.starPath(g,x,y,r,0.5); g.fill(); g.lineJoin='round'; g.lineWidth=r*0.3; g.strokeStyle=col; g.stroke(); }
}
function gloss(g,x,y,rx,ry,a){ softEll(g,x,y,rx,ry,'rgba(255,255,255,'+(a||0.7)+')',-0.5,0.6); }

// ================================================================ Modell-Muster
// Jede Funktion zeichnet in Teil-lokale Koordinaten, geclippt aufs Teil (außer top/back).
//  head: Kopf-Mitte, x±112 y-90..86 (Augen ±34,-16; Schnauze 0,24)   body: Körper-Mitte, x±124 y-112..112 (sichtbar ab y≈-66)
//  ear: Ohr-Mitte r32 (links; rechts gespiegelt)   arm: Schulter-Pivot, Pfote bei (-16,92)   foot: Fuß-Mitte   snout: Schnauzen-Mitte
//  top: kopflokal, ungeclippt, NACH der Frisur (Hüte, Hörner)   back: Bär-Einheiten, ungeclippt, HINTER dem Körper (Flügel, Umhang)
var MU={};
function scatter(g,seed,n,x0,y0,w,h,fn){ var R=Fx.rand(seed); for(var i=0;i<n;i++) fn(g,x0+R()*w,y0+R()*h,R(),i); }
MU.panda={
  head:function(g,P){ softEll(g,-38,-10,25,31,'#3b3330',0.55,0.25); softEll(g,38,-10,25,31,'#3b3330',-0.55,0.25); },
  body:function(g,P){ ell(g,0,-96,150,44,'#3b3330'); }
};
MU.grizzly={
  head:function(g,P){ scatter(g,11,70,-100,-92,200,70,function(g,x,y,r){ softEll(g,x,y,3+r*3,5+r*4,'rgba(236,206,168,0.45)',0,0.8); }); softEll(g,0,40,70,40,'rgba(40,22,12,0.35)'); },
  body:function(g,P){ scatter(g,12,90,-120,-70,240,80,function(g,x,y,r){ softEll(g,x,y,3+r*3,5+r*5,'rgba(236,206,168,0.4)',0,0.8); }); ell(g,0,-60,140,34,'rgba(236,206,168,0.18)'); }
};
MU.sterne={
  head:function(g,P){ scatter(g,21,7,-96,-84,192,60,function(g,x,y,r){ sticker(g,'stern',x,y,5+r*4,'#ffe38a'); }); },
  body:function(g,P){ scatter(g,22,14,-110,-50,220,150,function(g,x,y,r){ if(r<0.6) sticker(g,'stern',x,y,6+r*6,'#ffe38a'); else softEll(g,x,y,3,3,'#fff6d0',0,0.5); });
    g.fillStyle='#ffe9a6'; g.beginPath(); g.arc(0,20,26,0,TAU); g.arc(10,12,22,0,TAU,true); g.fill(); },
  arm:function(g){ sticker(g,'stern',-14,40,7,'#ffe38a'); }
};
var RB=['#ff8a8a','#ffc070','#ffe680','#9ed98a','#86c2f2','#c3a0e6'];
MU.regenbogen={
  body:function(g){ g.lineCap='butt'; for(var i=0;i<6;i++){ g.strokeStyle=RB[i]; g.lineWidth=10; g.beginPath(); g.arc(0,64,76-i*10,Math.PI,0); g.stroke(); }
    [[-72,66],[72,66]].forEach(function(c){ ell(g,c[0],c[1],22,14,'#ffffff'); ell(g,c[0]-12,c[1]+4,14,10,'#ffffff'); ell(g,c[0]+12,c[1]+4,14,10,'#ffffff'); }); },
  ear:function(g){ for(var i=0;i<3;i++) ell(g,0,4,18-i*5,18-i*5,RB[i*2]); },
  foot:function(g){ for(var i=0;i<6;i++) ell(g,-30+i*12,-6,6,10,RB[i]); }
};
var DOTS=['#f49ab4','#8ccfe8','#f6cf6a','#a6d88e','#c7a6ea'];
MU.punkte={
  head:function(g){ scatter(g,31,9,-104,-88,208,120,function(g,x,y,r,i){ if(Math.hypot(x-34,y+16)>26&&Math.hypot(x+34,y+16)>26&&Math.hypot(x,y-24)>44) ell(g,x,y,7+r*5,7+r*5,DOTS[i%5]); }); },
  body:function(g){ scatter(g,32,16,-116,-60,232,170,function(g,x,y,r,i){ ell(g,x,y,8+r*7,8+r*7,DOTS[i%5]); }); },
  arm:function(g){ ell(g,-10,30,7,7,DOTS[1]); ell(g,-22,62,6,6,DOTS[3]); },
  foot:function(g){ ell(g,-20,-8,6,6,DOTS[0]); ell(g,18,-6,7,7,DOTS[2]); }
};
MU.herz={
  body:function(g){ sticker(g,'herz',0,36,38,'#f7a3bb'); scatter(g,41,9,-118,-60,236,170,function(g,x,y,r){ if(Math.abs(x)>48||y>90) sticker(g,'herz',x,y,7+r*5,'#f9bccd'); }); },
  head:function(g){ sticker(g,'herz',-62,-54,8,'#f9bccd'); sticker(g,'herz',66,-48,7,'#f9bccd'); },
  foot:function(g){ sticker(g,'herz',0,-6,14,'#f7a3bb'); },
  top:function(g,P,k){ obj(g,k,function(g){ Fx.heartPath(g,56,-78,16); },'#f06f96',56,-78,16,16); }
};
function leaf(g,x,y,r,rot,col){ g.save(); g.translate(x,y); g.rotate(rot); g.fillStyle=col; g.beginPath(); g.moveTo(0,-r); g.quadraticCurveTo(r*0.8,0,0,r); g.quadraticCurveTo(-r*0.8,0,0,-r); g.fill();
  g.strokeStyle=Fx.alpha('#ffffff',0.35); g.lineWidth=r*0.1; g.beginPath(); g.moveTo(0,-r*0.8); g.lineTo(0,r*0.8); g.stroke(); g.restore(); }
MU.wald={
  body:function(g){ scatter(g,51,14,-116,-60,232,170,function(g,x,y,r,i){ leaf(g,x,y,10+r*8,r*6,i%2?'#4f8a5c':'#6fa35f'); }); },
  head:function(g){ leaf(g,-70,-50,12,0.8,'#4f8a5c'); leaf(g,74,-40,10,-0.6,'#6fa35f'); },
  top:function(g,P,k){ g.strokeStyle='#7a5a3a'; g.lineWidth=4; g.lineCap='round'; g.beginPath(); g.moveTo(-6,-84); g.quadraticCurveTo(-8,-104,4,-116); g.stroke();
    leaf(g,-16,-110,14,-0.9,'#5f9e56'); leaf(g,16,-118,13,0.9,'#7cb867');
    obj(g,k,function(g){ g.beginPath(); g.ellipse(36,-96,14,11,0,0,TAU); },'#b98552',36,-96,14,11); ell(g,36,-104,15,7,'#7a5a3a'); }
};
MU.einhorn={
  head:function(g){ softEll(g,-60,14,16,10,'rgba(255,170,210,0.5)'); softEll(g,60,14,16,10,'rgba(255,170,210,0.5)'); },
  ear:function(g){ ell(g,2,4,17,17,'#ffc6de'); },
  body:function(g){ sticker(g,'stern',0,30,20,'#ffd6ea'); scatter(g,61,8,-110,-40,220,140,function(g,x,y,r,i){ softEll(g,x,y,4,4,RB[i%6],0,0.5); }); },
  top:function(g,P,k){
    var mane=['#ffb3cf','#c9b3ff','#a8e0ff','#fff0a8'];
    for(var i=0;i<4;i++) obj(g,k,function(g){ g.beginPath(); g.ellipse(-44+i*10,-80+i*6,16,24,0.6,0,TAU); },mane[i],-44+i*10,-80+i*6,16,24);
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-15,-84); g.quadraticCurveTo(-7,-128,-2,-160); g.quadraticCurveTo(0,-167,2,-160); g.quadraticCurveTo(7,-128,15,-84); g.quadraticCurveTo(0,-78,-15,-84); },'#f7d77a',0,-120,16,42,'#c9a449');
    g.strokeStyle='rgba(255,255,255,0.7)'; g.lineWidth=3; g.lineCap='round';
    for(var j=0;j<4;j++){ var y=-92-j*17, w=12-j*2.6; g.beginPath(); g.moveTo(-w,y+3); g.quadraticCurveTo(0,y-5,w,y-2); g.stroke(); }
  }
};
MU.robo={
  head:function(g){ g.strokeStyle='rgba(60,70,80,0.35)'; g.lineWidth=2.5; g.beginPath(); g.moveTo(-100,-44); g.lineTo(100,-44); g.stroke();
    [[-86,-30],[86,-30],[-92,40],[92,40]].forEach(function(p){ ell(g,p[0],p[1],5,5,'#6d7780'); ell(g,p[0]-1.5,p[1]-1.5,2,2,'#e6ecf0'); }); },
  body:function(g,P,k){ Fx.rr(g,-44,-28,88,70,14); g.fillStyle='#5e6a78'; g.fill(); Fx.rr(g,-34,-20,68,34,8); g.fillStyle='#8ee6d8'; g.fill();
    g.strokeStyle='#e6fffa'; g.lineWidth=3; g.beginPath(); g.moveTo(-26,-2); g.lineTo(-12,-2); g.lineTo(-6,-12); g.lineTo(2,8); g.lineTo(8,-2); g.lineTo(26,-2); g.stroke();
    ['#f36a6a','#f6d25c','#6ad08a'].forEach(function(c,i){ ell(g,-22+i*22,28,7,7,c); ell(g,-24+i*22,26,2.5,2.5,'#ffffff'); }); },
  arm:function(g){ for(var i=0;i<3;i++){ g.fillStyle='rgba(60,70,80,0.3)'; g.fillRect(-46,20+i*22,70,4); } },
  top:function(g,P,k){ g.strokeStyle='#7c8691'; g.lineWidth=5; g.lineCap='round'; g.beginPath(); g.moveTo(0,-86); g.lineTo(0,-124); g.stroke();
    Fx.ball(g,0,-132,11,11,'#f25c5c'); }
};
MU.kirsch={
  body:function(g){ scatter(g,71,12,-116,-60,232,170,function(g,x,y,r){ sticker(g,'blume',x,y,9+r*6,r<0.5?'#ff9fbf':'#ffffff'); }); },
  head:function(g){ sticker(g,'blume',-66,-46,9,'#ff9fbf'); sticker(g,'blume',70,-30,7,'#ffffff'); },
  top:function(g,P,k){ g.strokeStyle='#7a4a3a'; g.lineWidth=4; g.lineCap='round'; g.beginPath(); g.moveTo(-78,-58); g.quadraticCurveTo(-60,-96,-20,-104); g.stroke();
    [[-66,-84],[-44,-100],[-22,-106]].forEach(function(p,i){ sticker(g,'blume',p[0],p[1],11,i%2?'#ffffff':'#ff9fbf'); }); }
};
function cloud(g,k,x,y,r,col){ obj(g,k,function(g){ g.beginPath(); g.arc(x,y,r,0,TAU); g.moveTo(x-r*0.4,y+r*0.3); g.arc(x-r*0.9,y+r*0.3,r*0.66,0,TAU); g.moveTo(x+r*1.5,y+r*0.3); g.arc(x+r*0.9,y+r*0.3,r*0.66,0,TAU); },col,x,y,r*1.6,r); }
MU.wolke={
  body:function(g,P,k){ [[-60,0,22],[50,50,18],[-20,82,16],[70,-30,14]].forEach(function(c){ cloud(g,k,c[0],c[1],c[2],'#ffffff'); }); },
  head:function(g,P,k){ cloud(g,k,-70,-46,10,'#ffffff'); },
  top:function(g,P,k){ cloud(g,k,52,-150,22,'#ffffff'); [[36,-114],[56,-106],[74,-116]].forEach(function(p){ g.drawImage(Fx.S.drop(),p[0]-5,p[1]-8,10,15); }); }
};
MU.prinzessin={
  body:function(g,P,k){ scatter(g,81,12,-110,-50,220,150,function(g,x,y,r){ sticker(g,'stern',x,y,4+r*3,'#fff1f8'); });
    g.strokeStyle='#f7d77a'; g.lineWidth=3; g.beginPath(); g.moveTo(-50,-62); g.quadraticCurveTo(0,-22,50,-62); g.stroke();
    obj(g,k,function(g){ Fx.heartPath(g,0,-26,14); },'#e0457e',0,-26,14,14); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.moveTo(-44,-86); g.lineTo(-48,-126); g.lineTo(-24,-106); g.lineTo(0,-136); g.lineTo(24,-106); g.lineTo(48,-126); g.lineTo(44,-86); g.quadraticCurveTo(0,-76,-44,-86); },'#f7cf5c',0,-108,48,28,'#c49a2c');
    [[-48,-128],[0,-138],[48,-128]].forEach(function(p){ Fx.ball(g,p[0],p[1],6,6,'#fff3b8'); });
    Fx.ball(g,0,-96,8,8,'#e0457e'); Fx.ball(g,-26,-94,5,5,'#7ec8f2'); Fx.ball(g,26,-94,5,5,'#8fe0a0'); }
};
MU.bau={
  body:function(g){ g.fillStyle='#f58a2e'; g.fillRect(-124,-112,70,240); g.fillRect(54,-112,70,240);
    g.fillStyle='#fff3b0'; g.fillRect(-124,10,70,12); g.fillRect(54,10,70,12); g.fillRect(-124,50,70,12); g.fillRect(54,50,70,12); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.ellipse(0,-90,104,16,0,0,TAU); },'#e8b21e',0,-90,104,16);
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-82,-92); g.bezierCurveTo(-82,-160,82,-160,82,-92); g.closePath(); },'#f6c93b',0,-120,82,40,'#b9861a');
    Fx.rr(g,-8,-150,16,58,6); g.fillStyle='rgba(255,255,255,0.35)'; g.fill(); }
};
MU.pirat={
  body:function(g){ for(var i=-6;i<8;i++){ g.fillStyle=i%2?'#f4efe6':'#d9474b'; g.fillRect(-124,i*18,248,18); } },
  top:function(g,P,k){
    g.strokeStyle='#1e1a1c'; g.lineWidth=3.5; g.beginPath(); g.moveTo(-86,-58); g.lineTo(-20,-28); g.stroke();
    obj(g,k,function(g){ g.beginPath(); g.ellipse(-34,-16,19,17,0,0,TAU); },'#2a2426',-34,-16,19,17);
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-104,-86); g.quadraticCurveTo(-60,-160,0,-150); g.quadraticCurveTo(60,-160,104,-86); g.quadraticCurveTo(0,-104,-104,-86); },'#2e2a30',0,-116,104,34,'#141214');
    g.strokeStyle='#e8c35a'; g.lineWidth=3; g.beginPath(); g.moveTo(-96,-90); g.quadraticCurveTo(0,-108,96,-90); g.stroke();
    ell(g,0,-128,13,12,'#f4efe6'); ell(g,-4,-130,3,3.4,'#2e2a30'); ell(g,4,-130,3,3.4,'#2e2a30');
    g.strokeStyle='#f4efe6'; g.lineWidth=3.5; g.lineCap='round'; g.beginPath(); g.moveTo(-12,-112); g.lineTo(12,-104); g.moveTo(12,-112); g.lineTo(-12,-104); g.stroke(); }
};
MU.zauberer={
  body:function(g){ scatter(g,91,12,-116,-60,232,170,function(g,x,y,r,i){ if(i%3) sticker(g,'stern',x,y,5+r*5,'#ffe38a'); else { g.fillStyle='#f0e6ff'; g.beginPath(); g.arc(x,y,7,0,TAU); g.arc(x+4,y-3,6,0,TAU,true); g.fill(); } }); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.ellipse(0,-90,100,17,0,0,TAU); },'#5b3b8f',0,-90,100,17);
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-64,-94); g.quadraticCurveTo(-30,-150,10,-196); g.quadraticCurveTo(40,-214,60,-190); g.quadraticCurveTo(34,-196,26,-170); g.quadraticCurveTo(46,-130,64,-94); g.quadraticCurveTo(0,-84,-64,-94); },'#6f4aa8',0,-140,64,60,'#3f2670');
    sticker(g,'stern',-14,-124,10,'#ffe38a'); sticker(g,'stern',22,-150,7,'#ffe38a'); ell(g,56,-192,6,6,'#ffe38a'); }
};
MU.dino={
  body:function(g){ scatter(g,101,10,-116,-50,232,160,function(g,x,y,r){ softEll(g,x,y,10+r*8,8+r*6,'rgba(46,110,40,0.45)',r*3,0.3); });
    for(var i=0;i<6;i++) ell(g,0,-20+i*22,40-i*3,8,'rgba(255,248,200,0.35)'); },
  head:function(g){ softEll(g,-70,-40,10,8,'rgba(46,110,40,0.45)'); softEll(g,64,-56,8,6,'rgba(46,110,40,0.45)'); },
  top:function(g,P,k){ for(var i=0;i<5;i++){ var a=-2.45+i*0.42, x=Math.cos(a)*92, y=-6+Math.sin(a)*80;
    obj(g,k,function(g){ g.save(); g.translate(x,y); g.rotate(a+Math.PI/2); g.beginPath(); g.moveTo(-15,6); g.quadraticCurveTo(-15,-28,0,-30); g.quadraticCurveTo(15,-28,15,6); g.closePath(); g.restore(); },i%2?'#f0a64b':'#f6c15b',x,y,16,20); } },
  back:{bb:[40,40,220,170],fn:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.moveTo(90,120); g.quadraticCurveTo(200,150,240,110); g.quadraticCurveTo(236,150,200,176); g.quadraticCurveTo(140,200,84,176); g.closePath(); },P.fell,160,150,80,40,P.kontur); }}
};
MU.superheld={
  head:function(g){ g.fillStyle='#1f3a78'; g.beginPath(); g.moveTo(-96,-26); g.quadraticCurveTo(-60,-46,0,-30); g.quadraticCurveTo(60,-46,96,-26); g.quadraticCurveTo(96,4,60,4); g.quadraticCurveTo(20,4,0,-6); g.quadraticCurveTo(-20,4,-60,4); g.quadraticCurveTo(-96,4,-96,-26); g.fill(); },
  body:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.moveTo(-36,-40); g.lineTo(36,-40); g.quadraticCurveTo(40,0,0,26); g.quadraticCurveTo(-40,0,-36,-40); },'#f6cf3c',0,-14,38,34);
    sticker(g,'stern',0,-14,14,'#e2453c'); g.fillStyle='#e2453c'; g.fillRect(-124,60,248,14); },
  back:{bb:[-170,-40,340,250],fn:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.moveTo(-80,-20); g.quadraticCurveTo(0,-34,80,-20); g.quadraticCurveTo(140,90,160,196); g.quadraticCurveTo(0,210,-160,196); g.quadraticCurveTo(-140,90,-80,-20); },'#e2453c',0,90,160,110,'#9a2721'); }}
};
function flake(g,x,y,r,col){ g.strokeStyle=col; g.lineWidth=Math.max(1,r*0.22); g.lineCap='round';
  for(var i=0;i<3;i++){ var a=i*Math.PI/3; g.beginPath(); g.moveTo(x-Math.cos(a)*r,y-Math.sin(a)*r); g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); g.stroke(); }
  ell(g,x,y,r*0.28,r*0.28,col); }
MU.schnee={
  body:function(g){ scatter(g,111,14,-116,-60,232,170,function(g,x,y,r){ flake(g,x,y,6+r*6,'#ffffff'); }); },
  head:function(g){ flake(g,-70,-42,7,'#ffffff'); flake(g,72,-30,6,'#ffffff'); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.moveTo(-86,-70); g.bezierCurveTo(-90,-176,90,-176,86,-70); g.closePath(); },'#6fa8dc',0,-110,86,50,'#3f78a8');
    Fx.rr(g,-92,-86,184,26,13); g.fillStyle='#f2f7fb'; g.fill();
    for(var i=0;i<8;i++){ g.fillStyle='rgba(120,150,180,0.25)'; g.fillRect(-84+i*22,-84,4,22); }
    for(var j=0;j<3;j++) flake(g,-40+j*40,-116,7,'#ffffff');
    Fx.ball(g,0,-160,18,18,'#ffffff'); }
};
MU.kaktus={
  body:function(g){ for(var i=-3;i<=3;i++){ g.strokeStyle='rgba(255,255,255,0.22)'; g.lineWidth=6; g.beginPath(); g.moveTo(i*32,-112); g.quadraticCurveTo(i*40,0,i*32,112); g.stroke(); }
    scatter(g,121,22,-116,-60,232,170,function(g,x,y){ ell(g,x,y,2.4,2.4,'#fff6d8'); }); },
  head:function(g){ scatter(g,122,10,-96,-80,192,60,function(g,x,y){ ell(g,x,y,2.2,2.2,'#fff6d8'); }); },
  top:function(g,P,k){ for(var i=0;i<6;i++){ var a=i*TAU/6; obj(g,k,function(g){ g.beginPath(); g.ellipse(34+Math.cos(a)*11,-92+Math.sin(a)*11,10,6,a,0,TAU); },'#ff7fae',34,-92,12,12); }
    Fx.ball(g,34,-92,6,6,'#ffe07a'); }
};
MU.fee={
  body:function(g){ scatter(g,131,12,-110,-50,220,150,function(g,x,y,r){ g.drawImage(Fx.S.twinkle(),x-7-r*5,y-7-r*5,14+r*10,14+r*10); }); },
  top:function(g,P,k){ ['#ffb3cf','#fff3a8','#c9b3ff','#a8e0ff','#ffb3cf'].forEach(function(c,i){ var a=-2.5+i*0.45; sticker(g,'blume',Math.cos(a)*92,-6+Math.sin(a)*80,12,c); }); },
  back:{bb:[-250,-160,500,240],fn:function(g,P,k){
    [[-1],[1]].forEach(function(sd){ var s=sd[0];
      [[s*120,-70,78,48,s*-0.5],[s*108,20,54,34,s*0.45]].forEach(function(w){
        g.save(); g.translate(w[0],w[1]); g.rotate(w[4]);
        var gr=g.createRadialGradient(0,0,4,0,0,w[2]); gr.addColorStop(0,'rgba(255,255,255,0.85)'); gr.addColorStop(0.6,'rgba(200,236,255,0.6)'); gr.addColorStop(1,'rgba(230,200,255,0.5)');
        g.shadowColor='rgba(150,120,200,0.6)'; g.shadowBlur=3*k; g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,w[2],w[3],0,0,TAU); g.fill();
        g.shadowBlur=0; g.strokeStyle='rgba(255,255,255,0.8)'; g.lineWidth=2; g.beginPath(); g.moveTo(-w[2]*0.8*s,0); g.lineTo(w[2]*0.7*s,0); g.stroke(); g.restore(); }); }); }}
};
MU.ninja={
  head:function(g){ g.fillStyle='#2c2f36'; g.fillRect(-120,-100,240,56); g.fillRect(-120,6,240,90); g.fillStyle='#c83c3c'; g.fillRect(-120,-58,240,16); },
  body:function(g){ g.fillStyle='#2c2f36'; g.beginPath(); g.moveTo(-60,-112); g.lineTo(0,-10); g.lineTo(60,-112); g.fill(); g.fillStyle='#c83c3c'; g.fillRect(-124,58,248,16); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.moveTo(96,-54); g.quadraticCurveTo(130,-60,150,-40); g.quadraticCurveTo(130,-40,98,-40); g.closePath(); g.moveTo(96,-48); g.quadraticCurveTo(128,-30,138,-6); g.quadraticCurveTo(118,-22,94,-40); g.closePath(); },'#c83c3c',120,-40,30,20); }
};
MU.kueste={
  body:function(g){ for(var i=-6;i<8;i++){ if(i%2) { g.fillStyle='#3d6fb6'; g.fillRect(-124,i*16,248,8); } }
    g.strokeStyle='#e0b24a'; g.lineWidth=5; g.lineCap='round'; g.beginPath(); g.moveTo(0,-20); g.lineTo(0,34); g.moveTo(-18,-6); g.lineTo(18,-6); g.moveTo(-22,20); g.quadraticCurveTo(0,44,22,20); g.stroke(); ell(g,0,-26,6,6,'#e0b24a'); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.ellipse(30,-92,54,14,0.18,0,TAU); },'#ffffff',30,-92,54,14,'#9aa8b8');
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-4,-96); g.bezierCurveTo(0,-130,58,-128,64,-88); g.closePath(); },'#f6f8fb',30,-106,34,20,'#9aa8b8');
    g.fillStyle='#3d6fb6'; g.beginPath(); g.moveTo(-2,-98); g.bezierCurveTo(10,-104,50,-100,63,-92); g.lineTo(62,-86); g.bezierCurveTo(50,-94,10,-96,-3,-92); g.fill(); }
};
MU.gala={
  body:function(g,P,k){ g.fillStyle='#fbf8f2'; g.beginPath(); g.moveTo(-44,-112); g.lineTo(0,40); g.lineTo(44,-112); g.fill();
    g.fillStyle='#202c52'; g.beginPath(); g.moveTo(-60,-112); g.lineTo(-10,30); g.lineTo(-40,-112); g.fill(); g.beginPath(); g.moveTo(60,-112); g.lineTo(10,30); g.lineTo(40,-112); g.fill();
    obj(g,k,function(g){ g.beginPath(); g.moveTo(0,-52); g.lineTo(-30,-66); g.quadraticCurveTo(-36,-52,-30,-38); g.closePath(); g.moveTo(0,-52); g.lineTo(30,-66); g.quadraticCurveTo(36,-52,30,-38); g.closePath(); },'#d23c6a',0,-52,32,14);
    Fx.ball(g,0,-52,7,7,'#e2557f'); [[0,-12],[0,10]].forEach(function(p){ ell(g,p[0],p[1],3.5,3.5,'#202c52'); });
    scatter(g,141,8,-110,20,220,90,function(g,x,y){ g.drawImage(Fx.S.twinkle(),x-8,y-8,16,16); }); }
};
MU.astro={
  body:function(g,P,k){ Fx.rr(g,-38,-24,76,52,10); g.fillStyle='#dfe6ee'; g.fill(); ['#e2453c','#4a90d9','#f6cf3c'].forEach(function(c,i){ ell(g,-20+i*20,0,6,6,c); });
    obj(g,k,function(g){ g.beginPath(); g.arc(-80,-40,14,0,TAU); },'#4a7fd6',-80,-40,14,14); sticker(g,'stern',-80,-40,6,'#ffffff');
    g.fillStyle='rgba(120,135,150,0.35)'; g.fillRect(-124,70,248,10); },
  top:function(g,P,k){
    g.save(); var gr=g.createRadialGradient(-40,-60,10,0,-6,138); gr.addColorStop(0,'rgba(230,245,255,0.18)'); gr.addColorStop(0.85,'rgba(190,220,245,0.12)'); gr.addColorStop(1,'rgba(160,200,235,0.35)');
    g.fillStyle=gr; g.beginPath(); g.arc(0,-6,136,0,TAU); g.fill();
    g.lineWidth=9; g.strokeStyle='#cfd8e2'; g.beginPath(); g.arc(0,-6,136,0.35,Math.PI-0.35); g.stroke();
    g.lineWidth=5; g.strokeStyle='rgba(255,255,255,0.8)'; g.lineCap='round'; g.beginPath(); g.arc(0,-6,122,-2.6,-1.9); g.stroke();
    gloss(g,-60,-90,16,8,0.75); g.restore(); },
  back:{bb:[-170,-70,340,220],fn:function(g,P,k){ obj(g,k,function(g){ Fx.rr(g,-150,-50,300,170,36); },'#dfe6ee',0,30,150,85,'#8d99a8'); }}
};
MU.feuer={
  body:function(g){ g.fillStyle='#f6d23c'; g.fillRect(-124,20,248,14); g.fillRect(-124,64,248,14); g.fillStyle='rgba(255,255,255,0.5)'; g.fillRect(-124,24,248,4); g.fillRect(-124,68,248,4); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.ellipse(0,-84,112,18,0,0,TAU); },'#b82c22',0,-84,112,18);
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-80,-88); g.bezierCurveTo(-80,-166,80,-166,80,-88); g.closePath(); },'#d6392c',0,-120,80,40,'#8e1f18');
    obj(g,k,function(g){ Fx.starPath(g,0,-112,20,0.62,6); },'#f6d23c',0,-112,20,20,'#b98a1a'); ell(g,0,-112,7,7,'#d6392c'); }
};
MU.blumenb={
  body:function(g){ var C=['#ff8fb1','#ffffff','#ff9f5a','#b48cf0','#6fc3ef']; scatter(g,151,13,-116,-60,232,170,function(g,x,y,r,i){ sticker(g,'blume',x,y,10+r*6,C[i%5]); }); },
  arm:function(g){ sticker(g,'blume',-14,50,9,'#ffffff'); },
  top:function(g,P,k){ var C=['#ff8fb1','#ffffff','#ff9f5a','#b48cf0','#6fc3ef','#ff8fb1','#ffffff'];
    for(var i=0;i<7;i++){ var a=-2.75+i*0.39; leaf(g,Math.cos(a)*94,-6+Math.sin(a)*82+8,9,a,'#5f9e56'); }
    for(var j=0;j<7;j++){ var b=-2.7+j*0.4; sticker(g,'blume',Math.cos(b)*92,-6+Math.sin(b)*80,14,C[j]); } }
};
function moon(g,x,y,r,col){ g.fillStyle=col; g.beginPath(); g.arc(x,y,r,0,TAU); g.arc(x+r*0.45,y-r*0.3,r*0.85,0,TAU,true); g.fill(); }
MU.mond={
  body:function(g){ scatter(g,161,10,-116,-60,232,170,function(g,x,y,r,i){ if(i%2) moon(g,x,y,9+r*6,'#e8ecf6'); else sticker(g,'stern',x,y,5+r*3,'#cfd6ea'); }); moon(g,0,30,30,'#f3e4a6'); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.moveTo(-84,-70); g.bezierCurveTo(-90,-150,20,-190,110,-150); g.quadraticCurveTo(122,-120,120,-80); g.quadraticCurveTo(100,-120,72,-132); g.bezierCurveTo(90,-110,92,-90,86,-70); g.closePath(); },'#3a5aa8',10,-120,90,50,'#233a78');
    Fx.rr(g,-90,-86,180,24,12); g.fillStyle='#f2f4fb'; g.fill(); sticker(g,'stern',-30,-118,8,'#ffe38a'); moon(g,20,-132,8,'#ffe38a');
    Fx.ball(g,122,-76,15,15,'#f2f4fb'); }
};
MU.engel={
  body:function(g){ scatter(g,171,8,-110,-40,220,140,function(g,x,y){ g.drawImage(Fx.S.twinkle(),x-8,y-8,16,16); }); },
  top:function(g,P,k){ g.save(); g.shadowColor='rgba(255,220,120,0.9)'; g.shadowBlur=6*k; g.strokeStyle='#f6d36a'; g.lineWidth=9;
    g.beginPath(); g.ellipse(0,-130,54,13,0,0,TAU); g.stroke(); g.restore();
    g.strokeStyle='rgba(255,250,220,0.9)'; g.lineWidth=3; g.beginPath(); g.ellipse(0,-132,50,10,0,Math.PI*1.05,Math.PI*1.6); g.stroke(); },
  back:{bb:[-260,-170,520,250],fn:function(g,P,k){
    [-1,1].forEach(function(s){ for(var i=0;i<4;i++){ var x=s*(96+i*30), y=-60+i*24, rx=58-i*8, ry=30-i*3;
      obj(g,k,function(g){ g.beginPath(); g.ellipse(x,y,rx,ry,s*(-0.5+i*0.25),0,TAU); },'#ffffff',x,y,rx,ry,'#c9b98a'); } }); }}
};
MU.clown={
  body:function(g,P,k){ ['#e2453c','#4a90d9','#f6cf3c'].forEach(function(c,i){ obj(g,k,function(g){ g.beginPath(); g.arc(0,-24+i*40,13,0,TAU); },c,0,-24+i*40,13,13); });
    scatter(g,181,10,-116,-50,232,160,function(g,x,y,r,i){ if(Math.abs(x)>30) ell(g,x,y,6,6,DOTS[i%5]); }); },
  nose:'#e8423f',
  top:function(g,P,k){ var C=['#e2453c','#f6cf3c','#4a90d9','#6ad08a'];
    for(var i=0;i<10;i++){ var x=-90+i*20; obj(g,k,function(g){ g.beginPath(); g.ellipse(x,86,16,12,0,0,TAU); },C[i%4],x,86,16,12); }
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-10,-86); g.lineTo(44,-170); g.lineTo(62,-78); g.quadraticCurveTo(26,-72,-10,-86); },'#6ad08a',26,-120,36,48,'#3f8a52');
    g.fillStyle='#f6cf3c'; [[10,-102],[34,-122],[48,-148]].forEach(function(p){ ell(g,p[0],p[1],5,5,'#f6cf3c'); });
    Fx.ball(g,44,-172,12,12,'#e2453c'); }
};
MU.wikinger={
  body:function(g){ g.fillStyle='#6b4a2e'; g.fillRect(-124,-112,64,240); g.fillRect(60,-112,64,240);
    scatter(g,191,30,-124,-80,64,200,function(g,x,y){ softEll(g,x,y,5,8,'rgba(230,210,170,0.35)',0,0.7); }); scatter(g,192,30,60,-80,64,200,function(g,x,y){ softEll(g,x,y,5,8,'rgba(230,210,170,0.35)',0,0.7); }); },
  top:function(g,P,k){ [-1,1].forEach(function(s){ obj(g,k,function(g){ g.beginPath(); g.moveTo(s*70,-104); g.quadraticCurveTo(s*130,-110,s*136,-170); g.quadraticCurveTo(s*140,-176,s*132,-172); g.quadraticCurveTo(s*112,-138,s*62,-128); g.closePath(); },'#f3ead6',s*104,-140,36,36,'#b8a888'); });
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-90,-86); g.bezierCurveTo(-90,-172,90,-172,90,-86); g.closePath(); },'#9aa4ae',0,-120,90,44,'#5a646e');
    Fx.rr(g,-94,-96,188,16,8); g.fillStyle='#c9a44a'; g.fill(); g.fillStyle='#c9a44a'; g.fillRect(-7,-160,14,64);
    [-60,-30,30,60].forEach(function(x){ ell(g,x,-88,3.5,3.5,'#f3e3a0'); }); }
};
MU.cowboy={
  body:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.moveTo(-64,-70); g.quadraticCurveTo(0,-54,64,-70); g.lineTo(0,-8); g.closePath(); },'#d23c3c',0,-40,64,32);
    scatter(g,201,6,-40,-60,80,40,function(g,x,y){ ell(g,x,y,2.5,2.5,'#ffffff'); });
    obj(g,k,function(g){ Fx.starPath(g,-70,20,16,0.5,5); },'#f0c94a',-70,20,16,16,'#a8821e'); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.moveTo(-132,-96); g.quadraticCurveTo(-120,-80,0,-80); g.quadraticCurveTo(120,-80,132,-96); g.quadraticCurveTo(116,-70,0,-68); g.quadraticCurveTo(-116,-70,-132,-96); },'#8a5a32',0,-80,132,14,'#5a3a1e');
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-64,-82); g.bezierCurveTo(-72,-150,-30,-152,-8,-132); g.quadraticCurveTo(0,-126,8,-132); g.bezierCurveTo(30,-152,72,-150,64,-82); g.quadraticCurveTo(0,-74,-64,-82); },'#9a6a3e',0,-112,66,36,'#5a3a1e');
    g.fillStyle='#5a3a1e'; g.fillRect(-62,-98,124,10); }
};
function qmark(g,x,y,r,col){ g.strokeStyle=col; g.lineWidth=r*0.34; g.lineCap='round'; g.beginPath(); g.arc(x,y-r*0.35,r*0.55,-Math.PI*0.95,Math.PI*0.35); g.quadraticCurveTo(x,y+r*0.1,x,y+r*0.4); g.stroke(); ell(g,x,y+r*0.95,r*0.2,r*0.2,col); }
MU.frage={
  body:function(g){ scatter(g,211,9,-110,-50,220,160,function(g,x,y,r,i){ qmark(g,x,y,14+r*8,i%2?'#a37fd1':'#ffffff'); }); qmark(g,0,30,34,'#8a62c4'); },
  head:function(g){ qmark(g,-70,-48,11,'#a37fd1'); qmark(g,72,-40,9,'#ffffff'); },
  top:function(g,P,k){ obj(g,k,function(g){ g.beginPath(); g.arc(62,-146,30,0,TAU); },'#b596e4',62,-146,30,30,'#7c56b8'); qmark(g,62,-150,22,'#ffffff');
    g.drawImage(Fx.S.twinkle(),20,-190,26,26); g.drawImage(Fx.S.twinkle(),96,-120,20,20); }
};
Art.MUSTER = MU;

// ================================================================ Sprite-Sätze (pro Modell × Auflösung, LRU)
var sets=[], SETS_MAX=5; // Speicherbudget: bis ~18 MB je Satz bei k=3,4 (Gutachten P2-6), früher 10 Sätze
// Hysterese: vorhandenen Satz wiederverwenden, wenn er höchstens ~20 % hoch- oder 2,2× herunterskaliert würde
// (Kamera-Zoom im Finale backt so nicht jede Stufe neu)
function getSet(idx,k,sc){
  var best=-1;
  for(var i=0;i<sets.length;i++){ var st=sets[i]; if(st.idx!==idx) continue;
    if(st.k===k || (sc && st.k>=sc*0.82 && st.k<=sc*2.2 && (best<0 || st.k<sets[best].k))) { best=i; if(st.k===k) break; } }
  if(best>=0){ var hit=sets[best]; if(best>0){ sets.splice(best,1); sets.unshift(hit); } return hit; }
  var ns=buildSet(idx,k); sets.unshift(ns); if(sets.length>SETS_MAX) sets.pop(); Art.bakes=(Art.bakes||0)+1; return ns;
}
Art.setCount=function(){ return sets.length; };
function buildSet(idx,k){
  var m=Art.MODELS[idx]||Art.MODELS[0], P=pal(idx), M=MU[m.muster]||{};
  var S={idx:idx,k:k};
  S.body=bake(-136,-124,272,248,k,function(g,k){
    paintPart(g,k,bodyPath,P.fell,P.kontur,0,0,124,112,function(g){
      softEll(g,0,26,72,74,P.bauch,0,0.3);
      if(M.body) M.body(g,P,k);
    });
  });
  S.head=bake(-124,-104,248,204,k,function(g,k){
    paintPart(g,k,headPath,P.fell,P.kontur,0,0,110,92,function(g){ if(M.head) M.head(g,P,k); });
  });
  S.ear=bake(-42,-42,84,84,k,function(g,k){
    paintPart(g,k,earPath,P.ohren,P.kontur,0,0,32,32,function(g){
      softEll(g,3,5,18,18,P.inner,0,0.35);
      if(M.ear) M.ear(g,P,k);
    });
  });
  S.snout=bake(-52,-40,104,80,k,function(g,k){
    paintPart(g,k,snoutPath,P.schnauze,Fx.warmShadow(P.schnauze,0.5),0,0,42,30,function(g){ if(M.snout) M.snout(g,P,k); },0.4);
    // Nase: weiches Dreieck, eigener Verlauf + Glanz
    var nc=M.nose||P.nose;
    g.save(); g.beginPath(); g.moveTo(-15,-17); g.quadraticCurveTo(0,-23,15,-17); g.quadraticCurveTo(18,-12,6,-2); g.quadraticCurveTo(0,3,-6,-2); g.quadraticCurveTo(-18,-12,-15,-17); g.closePath();
    var ng=g.createRadialGradient(-5,-16,1,0,-9,20); ng.addColorStop(0,Fx.warmLight(nc,0.35)); ng.addColorStop(1,nc);
    g.shadowColor='rgba(60,30,30,0.35)'; g.shadowBlur=2*k; g.shadowOffsetY=1.5*k; g.fillStyle=ng; g.fill(); g.restore();
    gloss(g,-5,-15,5.5,2.6,0.8);
  });
  S.arm=bake(-60,-18,94,142,k,function(g,k){
    paintPart(g,k,armPath,P.arme,P.kontur,-12,50,36,64,function(g){
      if(M.arm) M.arm(g,P,k);
      softEll(g,-16,92,17,13,P.pad,0,0.25);
      [[-28,76],[-16,72],[-4,76]].forEach(function(b){ softEll(g,b[0],b[1],4.4,4,P.pad,0,0.3); });
    });
  });
  S.foot=bake(-62,-40,124,82,k,function(g,k){
    paintPart(g,k,footPath,P.beine,P.kontur,0,4,50,36,function(g){
      if(M.foot) M.foot(g,P,k);
      [-8,8].forEach(function(x){ softEll(g,x,24,2.2,9,Fx.alpha(Fx.warmShadow(P.beine,0.6),0.55),0,0.9); });
    },undefined,true);
    for(var i=0;i<3;i++){ var x=(i-1)*16, y=(i===1?21:18)+8; softEll(g,x,y,5,3.6,P.nail,0,0.3); }
  });
  if(M.top) S.top=bake(-160,-240,320,350,k,function(g,k){ M.top(g,P,k); });
  if(M.back){ var bb=M.back.bb; S.back=bake(bb[0],bb[1],bb[2],bb[3],k,function(g,k){ M.back.fn(g,P,k); }); }
  return S;
}

// ================================================================ Frisuren (pro Stil × Farbe × Auflösung gebacken)
// Jede Locke ist ein eigener weicher Blob mit Licht/Schatten — runde Enden, keine Spitzen.
function lump(g,k,x,y,rx,ry,rot,col,kon){
  obj(g,k,function(g){ g.beginPath(); g.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),rot,0,TAU); },col,x,y,rx,ry,kon);
}
function tuft(g,k,x,y,len,w,rot,col,kon){ // abgerundete Strähne (Tropfenform, runde Spitze)
  obj(g,k,function(g){ g.save(); g.translate(x,y); g.rotate(rot); g.beginPath();
    g.moveTo(-w,0); g.bezierCurveTo(-w,-len*0.6,-w*0.35,-len,0,-len); g.bezierCurveTo(w*0.35,-len,w,-len*0.6,w,0); g.quadraticCurveTo(0,w*0.6,-w,0); g.restore(); },
    col,x+Math.sin(rot)*len*0.5,y-Math.cos(rot)*len*0.5,w,len*0.55,kon);
}
var HAIR={
  lockig:function(g,k,c,kon){
    var i,a, hl=Fx.alpha(Fx.warmLight(c,0.7),0.55);
    function curl(x,y,r){ lump(g,k,x,y,r,r*0.92,0,c,kon);
      g.strokeStyle=hl; g.lineWidth=r*0.2; g.lineCap='round'; g.beginPath(); g.arc(x+r*0.08,y+r*0.05,r*0.5,Math.PI*0.9,Math.PI*2.1); g.stroke(); }
    for(i=0;i<11;i++){ a=-2.78+i*0.24; curl(Math.cos(a)*92,-2+Math.sin(a)*80,17+(i%2)*3); }
    for(i=0;i<8;i++){ a=-2.55+i*0.23; curl(Math.cos(a)*62,-6+Math.sin(a)*70,15+(i%3)*2); }
    for(i=0;i<4;i++) curl(-33+i*22,-64+(i%2)*6,13);
  },
  kurz:function(g,k,c,kon){
    obj(g,k,function(g){ g.beginPath(); g.moveTo(-94,-34); g.bezierCurveTo(-104,-120,104,-120,94,-34);
      for(var i=0;i<6;i++){ var x0=94-i*31.3, x1=x0-31.3; g.quadraticCurveTo((x0+x1)/2,-48-(i%2)*4,x1,-34-(i===2||i===3?-6:0)); } g.closePath(); },c,0,-70,98,48,kon);
    tuft(g,k,6,-86,34,11,0.35,c,kon);
  },
  zottig:function(g,k,c,kon){
    var i,a;
    for(i=0;i<8;i++){ a=-2.9+i*0.38; tuft(g,k,Math.cos(a)*86,-4+Math.sin(a)*74,40,16,a+Math.PI/2+Math.PI+(i<4?0.35:-0.35),c,kon); }
    for(i=0;i<7;i++){ var x=-60+i*20; tuft(g,k,x,-86+Math.abs(i-3)*6,44+(i%2)*8,14,Math.PI+(i-3)*0.14,c,kon); }
  },
  igel:function(g,k,c,kon){
    obj(g,k,function(g){ g.beginPath(); g.ellipse(0,-66,84,34,0,0,TAU); },c,0,-66,84,34,kon);
    for(var i=0;i<7;i++){ var a=-2.62+i*0.18; tuft(g,k,Math.cos(a)*74,-10+Math.sin(a)*72,48+(i===3?8:0),13,a+Math.PI/2,c,kon); }
  },
  afro:{
    back:function(g,k,c,kon){
      obj(g,k,function(g){ g.beginPath(); g.arc(0,-56,120,0,TAU); for(var i=0;i<16;i++){ var a=i*TAU/16, x=Math.cos(a)*118, y=-56+Math.sin(a)*112; g.moveTo(x+30,y); g.arc(x,y,30,0,TAU); } },c,0,-56,140,136,kon);
      var R=Fx.rand(99); for(var j=0;j<40;j++){ var a2=R()*TAU, r2=R()*120; softEll(g,Math.cos(a2)*r2,-56+Math.sin(a2)*r2,12,10,Fx.alpha(Fx.warmLight(c,0.4),0.35),0,0.8); }
    },
    front:function(g,k,c,kon){ for(var i=0;i<7;i++){ var a=-2.7+i*0.36; lump(g,k,Math.cos(a)*84,-2+Math.sin(a)*76,22,19,0,c,kon); } }
  },
  wirr:function(g,k,c,kon){ // Vorher-Bild: zerzaust — runde, schief abstehende Büschel (keine Spitzen)
    var R=Fx.rand(7);
    for(var i=0;i<10;i++){ var a=-2.95+i*0.33+R()*0.15, rr=86+R()*14; lump(g,k,Math.cos(a)*rr,-4+Math.sin(a)*(rr-8),16+R()*6,11+R()*4,a+Math.PI/2+(R()-0.5)*0.9,c,kon); }
    for(var j=0;j<4;j++){ var b=[-2.6,-0.5,2.7,0.45][j]; lump(g,k,Math.cos(b)*110,20+Math.sin(b)*40,14,9,b+(R()-0.5),c,kon); }
  }
};
var hairSets=[];
function getHair(style,col,k,sc){
  var key=style+'|'+col+'|'+k, pre=style+'|'+col+'|';
  for(var i=0;i<hairSets.length;i++) if(hairSets[i].key===key) return hairSets[i];
  for(i=0;i<hairSets.length;i++){ var h=hairSets[i]; if(h.key.indexOf(pre)===0){ var hk=+h.key.slice(pre.length); if(sc && hk>=sc*0.82 && hk<=sc*2.2) return h; } }
  var H=HAIR[style]; if(!H) return null;
  var kon=Fx.warmShadow(col,0.6), hs={key:key};
  if(typeof H==='function') hs.front=bake(-170,-190,340,300,k,function(g,k){ H(g,k,col,kon); });
  else { hs.back=bake(-190,-220,380,340,k,function(g,k){ H.back(g,k,col,kon); }); hs.front=bake(-170,-190,340,300,k,function(g,k){ H.front(g,k,col,kon); }); }
  hairSets.unshift(hs); if(hairSets.length>6) hairSets.pop();
  return hs;
}

// ================================================================ kleine gebackene Deko-Sprites
function gurkeSprite(){
  return Fx.sprite('gurke',96,96,function(g){
    g.translate(48,48);
    var gr=g.createRadialGradient(-10,-12,4,0,0,44); gr.addColorStop(0,'#eaf7c8'); gr.addColorStop(0.72,'#c4e39a'); gr.addColorStop(0.8,'#6fae4f'); gr.addColorStop(1,'#3f7a32');
    g.shadowColor='rgba(40,70,30,0.5)'; g.shadowBlur=4; g.fillStyle=gr; g.beginPath(); g.arc(0,0,44,0,TAU); g.fill(); g.shadowBlur=0;
    for(var i=0;i<7;i++){ var a=i*TAU/7; ell(g,Math.cos(a)*18,Math.sin(a)*18,5,3,'rgba(240,250,220,0.9)',a); }
    gloss(g,-16,-18,12,6,0.7);
  });
}

// ================================================================ Pose & Lebendigkeit
var STATIC={t:0,lid:0,happy:0,squint:0,mouth:0,sleepy:0,gx:0,gy:0,tilt:0,arms:0,armR:0,wave:0,wind:0,relax:0,goose:0,jumpY:0,glint:-1,rk:'',rt:0,ra:1,poke:null};
function pose(b){
  if(!b._p){ var p={}; for(var key in STATIC) p[key]=STATIC[key]; p.blinkT=1.5+Math.random()*2; p.blinkPh=0; p.tgx=0; p.tgy=0; p.wT=0; b._p=p; }
  return b._p;
}
Art.updateBear = function(b,dt,env){
  if(!b) return;
  var p=pose(b); env=env||{}; p.t+=dt;
  if(p.rk){ p.rt+=dt; if(p.rt>1.8) p.rk=''; }
  // r20: Landung des Freu-Hüpfers → zwei Funkel-Sterne + goldene Pünktchen an den Füßen
  if(Fx.DEKO && !Fx.RM && Fx.Q.tier>0 && p.rk==='happy' && p.ra>=0.5 && p.rt>=0.46 && p.rt-dt<0.46 && b._geo){
    var LG=b._geo;
    for(var ls=-1;ls<=1;ls+=2){
      Fx.P.emit('twinkle',LG.cx+ls*78*LG.s,LG.cy+186*LG.s,{n:1,speed:30,size:15,life:0.55,grav:-30,drag:2});
      Fx.P.emit('spark',LG.cx+ls*70*LG.s,LG.cy+192*LG.s,{n:3,speed:110,dir:-Math.PI/2+ls*0.7,spread:0.9,size:6,life:0.55,grav:160,drag:2,colors:['#ffe7a8','#fff6dc']});
    }
  }
  // Blinzeln (gelegentlich doppelt)
  p.blinkT-=dt;
  if(p.blinkT<=0 && p.blinkPh===0){ p.blinkPh=0.0001; p.blinkT=2.2+Math.random()*3.4; p.dbl=Math.random()<0.22; }
  if(p.blinkPh>0){ p.blinkPh+=dt; if(p.blinkPh>0.17){ if(p.dbl){ p.dbl=false; p.blinkPh=-0.1; } else p.blinkPh=0; } }
  else if(p.blinkPh<0){ p.blinkPh+=dt; if(p.blinkPh>=0) p.blinkPh=0.0001; }
  p.lid = p.blinkPh>0 ? Math.sin(Math.min(1,p.blinkPh/0.17)*Math.PI) : 0;
  // Blick folgt dem Finger, sonst schaut er sich um
  var geo=b._geo, hx=geo?geo.cx:450, hy=geo?geo.cy-82*geo.s:231;
  if(env.head && !geo){ hx=env.head[0]; hy=env.head[1]; }
  if(env.pointer && env.pointer.age<2.5){
    var dx=env.pointer.x-hx, dy=env.pointer.y-hy, d=Math.hypot(dx,dy)||1, f=Math.min(1,d/170);
    p.tgx=dx/d*f; p.tgy=dy/d*f;
  } else { p.wT-=dt; if(p.wT<=0){ p.wT=1.4+Math.random()*2.6; if(Math.random()<0.45){ p.tgx=0; p.tgy=0; } else { p.tgx=(Math.random()-0.5)*1.3; p.tgy=(Math.random()-0.5)*0.7; } } }
  var e=Math.min(1,dt*9); p.gx+=(p.tgx-p.gx)*e; p.gy+=(p.tgy-p.gy)*e;
  function ap(key,tgt,rate){ p[key]+=(tgt-p[key])*Math.min(1,dt*rate); }
  var j=b.jubel||0, rH=(p.rk==='happy'||p.rk==='pop')&&p.rt<0.9?1:0;
  ap('happy',Math.max(env.happy||0,rH,j>0.45?1:0),12);
  ap('squint',env.squint||0,12);
  ap('mouth',Math.max(env.mouth||0,j*0.9,p.rk==='happy'&&p.rt<0.8?0.8:0),9);
  ap('sleepy',env.sleepy||0,6);
  ap('arms',Math.max(env.arms||0,j*1.05),8);
  ap('armR',env.armR||0,6);
  ap('wave',env.wave||0,5);
  ap('wind',env.wind||0,4);
  ap('relax',Math.max(b.relax||0,b._spa||0),3);
  ap('tilt',p.gx*0.05+Math.sin(p.t*0.7)*0.025,3);
  p.goose=env.goose?1:Math.max(0,p.goose-dt*3);
  p.jumpY=env.jumpY||0;
  p.glint=env.glint===undefined?-1:env.glint;
  if(p.poke){ p.poke.t+=dt; if(p.poke.t>1.1) p.poke=null; }
};
Art.react = function(b,kind,amt){
  if(!b) return;
  var p=pose(b); p.rk=kind; p.rt=0; p.ra=amt===undefined?1:amt;
  if(kind==='blink'||kind==='snip'){ p.blinkPh=0.0001; p.dbl=kind==='blink'; }
};
// Antippen: welches Teil? (Welt-Koordinaten) → kleines Wackeln an genau dem Teil
Art.poke = function(b,x,y,r){
  if(!b || !b._geo) return null;
  var G=b._geo, u=(x-G.cx)/G.s, v=(y-G.cy)/G.s, part=null;
  function inE(cx,cy,rx,ry){ var a=(u-cx)/rx, c=(v-cy)/ry; return a*a+c*c<=1; }
  if(inE(-EAR_X,HEAD_Y+EAR_Y,36,36)) part='earL';
  else if(inE(EAR_X,HEAD_Y+EAR_Y,36,36)) part='earR';
  else if(inE(0,HEAD_Y,114,96)) part='head';
  else if(inE(-FOOT_X,FOOT_Y+6,54,42)) part='footL';
  else if(inE(FOOT_X,FOOT_Y+6,54,42)) part='footR';
  else if(inE(-ARM_X-14,ARM_Y+54,40,70)) part='armL';
  else if(inE(ARM_X+14,ARM_Y+54,40,70)) part='armR';
  else if(inE(0,BODY_Y,126,114)) part='body';
  if(part){ var p=pose(b); p.poke={part:part,t:0,a:Math.min(1.4,(r||40)/60)}; }
  return part;
};
function reactCurves(p){
  var o={sx:1,sy:1,rot:0,dy:0,hrot:0,kiss:0}; if(!p.rk) return o;
  var t=p.rt, a=p.ra, w;
  switch(p.rk){
    case 'pop': w=Math.exp(-t*6)*Math.sin(t*24)*0.09*a; o.sy=1+w; o.sx=1-w*0.8; break;
    case 'happy':
      if(Fx.DEKO && !Fx.RM){ // r20 Freu-Hüpfer: höher, Strecken im Flug, Stauchen + Nachfedern bei der Landung
        var HT=0.46, hq=Math.min(1,t/HT), hv=Math.abs(Math.cos(hq*Math.PI));
        o.dy=-Math.sin(hq*Math.PI)*22*a;
        if(t<HT){ o.sy=1+0.07*a*hv; o.sx=1-0.05*a*hv; }
        else { w=Math.exp(-(t-HT)*9)*Math.cos((t-HT)*24)*0.11*a; o.sy=1-w; o.sx=1+w*0.8; }
        break; }
      o.dy=-Math.max(0,Math.sin(Math.min(1,t/0.42)*Math.PI))*14*a; w=Math.exp(-t*7)*Math.sin(t*20)*0.05*a; o.sy=1+w; o.sx=1-w; break;
    case 'shake': w=Math.max(0,1-t/0.9); o.rot=Math.sin(t*38)*0.07*w; o.hrot=Math.sin(t*38+0.7)*0.14*w; break;
    case 'snip': o.hrot=-Math.exp(-t*8)*Math.sin(t*18)*0.1; break;
    case 'kiss': o.kiss=Math.max(0,Math.min(1,t*6))*Math.max(0,Math.min(1,(1.4-t)*4)); break;
    case 'land': w=Math.exp(-t*7)*Math.cos(t*16)*0.15*a; o.sy=1-w; o.sx=1+w*0.8; break;
  }
  return o;
}
function jig(p,part){ if(!p.poke||p.poke.part!==part) return 0; var t=p.poke.t; return Math.exp(-t*7)*Math.sin(t*26)*p.poke.a; }

// ================================================================ Live-Details: Gesicht
function drawEyes(g,P,p,b,mk,vor){
  var closed=Math.max(p.lid,p.relax>0.55?1:0), happy=p.happy>0.5&&!vor, squint=p.squint>0.5;
  for(var sd=-1;sd<=1;sd+=2){
    var x=sd*EYE_X, y=EYE_Y;
    if(mk && mk.lid) softEll(g,x,y-12,19,12,Fx.alpha(mk.lid,0.6),0,0.6);
    if(P.dark) softEll(g,x,y,19,22,'rgba(255,240,225,0.22)',0,0.5);
    g.lineCap='round'; g.lineJoin='round'; g.strokeStyle='#2a1a1e'; g.lineWidth=4.6;
    if(squint){ g.beginPath(); g.moveTo(x-sd*10,y-8); g.lineTo(x+sd*5,y); g.lineTo(x-sd*10,y+8); g.stroke(); continue; }
    if(happy){ g.beginPath(); g.arc(x,y+7,11,Math.PI*1.12,Math.PI*1.88); g.stroke(); continue; }
    if(closed>0.85){ g.beginPath(); g.arc(x,y-5,11,Math.PI*0.14,Math.PI*0.86); g.stroke(); continue; }
    var open=Math.max(0.1,(1-closed)*(1-0.5*p.sleepy));
    var ex=x+p.gx*3.2, ey=y+p.gy*2.6;
    g.save(); g.translate(ex,ey+(1-open)*6); g.scale(1,open);
    var gr=g.createRadialGradient(-3,-6,1,0,0,17); gr.addColorStop(0,'#5d3b37'); gr.addColorStop(0.55,'#2a1a1e'); gr.addColorStop(1,'#120a0d');
    g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,13,16,0,0,TAU); g.fill();
    g.fillStyle='rgba(120,80,70,0.55)'; g.beginPath(); g.ellipse(0,7,8,5,0,0,TAU); g.fill();
    g.fillStyle='#ffffff'; g.beginPath(); g.ellipse(-4-p.gx*1.5,-6-p.gy,5.4,6,0,0,TAU); g.fill();
    g.fillStyle='rgba(255,255,255,0.8)'; g.beginPath(); g.arc(4.5,5,2.4,0,TAU); g.fill();
    g.restore();
    if(p.sleepy>0.3||vor){ g.strokeStyle='#2a1a1e'; g.lineWidth=3.6; g.beginPath(); g.moveTo(x-13,ey-16*open+4); g.quadraticCurveTo(x,ey-16*open-1,x+13,ey-16*open+4); g.stroke(); }
    else { g.strokeStyle='#2a1a1e'; g.lineWidth=2.6; g.beginPath(); g.moveTo(ex+sd*10,ey-12*open); g.quadraticCurveTo(ex+sd*15,ey-15*open,ex+sd*17,ey-19*open); g.stroke(); }
  }
}
function drawMouth(g,p,R,vor){
  var y=SNOUT_Y+6;
  g.lineCap='round'; g.lineJoin='round'; g.strokeStyle='#4a2a2a'; g.lineWidth=3.2;
  g.beginPath(); g.moveTo(0,y-7); g.lineTo(0,y+1); g.stroke();
  if(vor){ g.beginPath(); g.moveTo(-12,y+10); g.quadraticCurveTo(0,y+2,12,y+10); g.stroke(); return; }
  if(R.kiss>0.2){ g.fillStyle='#d65a74'; g.beginPath(); g.ellipse(0,y+8,6*R.kiss+2,7*R.kiss+2,0,0,TAU); g.fill(); g.fillStyle='#7a2a3a'; g.beginPath(); g.ellipse(0,y+8,2.5,3.5,0,0,TAU); g.fill(); return; }
  var o=Math.max(p.mouth,p.happy*0.55);
  if(o>0.25){
    var h=6+o*10;
    g.fillStyle='#7a2f3e'; g.beginPath(); g.moveTo(-13,y+2); g.quadraticCurveTo(0,y+1,13,y+2); g.quadraticCurveTo(12,y+2+h,0,y+2+h); g.quadraticCurveTo(-12,y+2+h,-13,y+2); g.fill();
    g.save(); g.clip(); ell(g,0,y+2+h,9,6,'#f07f92'); g.restore();
    g.stroke();
  } else {
    g.beginPath(); g.moveTo(-13,y+2); g.quadraticCurveTo(-6,y+10,0,y+2); g.quadraticCurveTo(6,y+10,13,y+2); g.stroke();
  }
}
function drawHut(g,col,tilt,pop){
  g.save(); g.translate(8,-104); g.rotate(-0.1-tilt*0.28); g.scale(pop,pop);
  obj(g,2,function(g){ g.beginPath(); g.ellipse(0,0,62,13,0,0,TAU); },Fx.warmShadow(col,0.25),0,0,62,13);
  obj(g,2,function(g){ Fx.rr(g,-40,-74,80,76,14); },col,0,-36,40,38);
  g.fillStyle=Fx.warmLight(col,0.55); g.fillRect(-40,-20,80,12);
  sticker(g,'blume',26,-14,9,'#fff4ea');
  g.restore();
}
function drawSchleife(g,col,pop){
  g.save(); g.translate(64,-84); g.rotate(0.3); g.scale(pop,pop);
  obj(g,2,function(g){ g.beginPath(); g.moveTo(0,0); g.bezierCurveTo(-18,-26,-44,-16,-34,6); g.bezierCurveTo(-28,22,-10,14,0,0); g.moveTo(0,0); g.bezierCurveTo(18,-26,44,-16,34,6); g.bezierCurveTo(28,22,10,14,0,0); },col,0,-4,36,20);
  Fx.ball(g,0,0,9,8,Fx.warmLight(col,0.1));
  g.restore();
}
function drawBrille(g,col,pop){
  g.save(); g.translate(0,EYE_Y); g.scale(pop,pop);
  for(var sd=-1;sd<=1;sd+=2){
    Fx.rr(g,sd*EYE_X-22,-17,44,34,14);
    var lg=g.createLinearGradient(0,-17,0,17); lg.addColorStop(0,'rgba(40,30,50,0.9)'); lg.addColorStop(1,'rgba(90,60,90,0.82)');
    g.fillStyle=lg; g.fill(); g.lineWidth=6; g.strokeStyle=col; g.stroke();
    g.strokeStyle='rgba(255,255,255,0.55)'; g.lineWidth=3; g.lineCap='round'; g.beginPath(); g.moveTo(sd*EYE_X-12,-8); g.lineTo(sd*EYE_X-4,-12); g.stroke();
  }
  g.strokeStyle=col; g.lineWidth=5; g.beginPath(); g.moveTo(-12,-4); g.quadraticCurveTo(0,-10,12,-4); g.stroke();
  g.restore();
}
function drawKette(g,col,pop){
  g.save(); g.translate(0,6); g.scale(pop,pop);
  for(var i=0;i<=12;i++){ var q=i/12, x=-64+q*128, y=-8+Math.sin(q*Math.PI)*22; Fx.ball(g,x,y,7,7,col); }
  obj(g,2,function(g){ Fx.heartPath(g,0,26,11); },col==='#ecf0f1'?'#f39ab4':Fx.warmLight(col,0.1),0,26,11,11);
  g.restore();
}
var FOAM_HEAD=[[-52,-162,19],[-18,-176,22],[18,-174,21],[52,-160,18],[-80,-128,15],[80,-126,16],[0,-186,14]];
var FOAM_BODY=[[-58,40,17],[-18,72,21],[30,48,19],[64,90,16],[-44,112,18],[12,124,15],[74,22,13],[-84,80,14],[-96,30,12],[98,60,12],[0,24,14]];
function drawFoam(g,amt,t){
  var list=FOAM_HEAD.concat(FOAM_BODY), n=Math.ceil(amt*list.length), bub=Fx.S.bubble();
  for(var i=0;i<n;i++){ var f=list[(i*5)%list.length], r=f[2]*(0.7+0.3*amt), w=Math.sin(t*2+i)*1.2;
    Fx.ball(g,f[0]-r*0.45,f[1]+r*0.15+w,r*0.72,r*0.66,'#fbfdff');
    Fx.ball(g,f[0]+r*0.4,f[1]+r*0.2-w,r*0.6,r*0.55,'#f6fbff');
    Fx.ball(g,f[0],f[1]-r*0.25,r*0.8,r*0.72,'#ffffff');
    if(i%3===0) g.drawImage(bub,f[0]+r*0.5,f[1]-r*1.1,r*0.8,r*0.8);
  }
}

// ================================================================ Der Bär
var silhouette=null;
function silPath(){
  if(silhouette) return silhouette;
  var p=new Path2D();
  p.ellipse(0,HEAD_Y-6,100,84,0,0,TAU); p.moveTo(112,HEAD_Y+26); p.ellipse(0,HEAD_Y+26,112,58,0,0,TAU);
  p.moveTo(124,BODY_Y); p.ellipse(0,BODY_Y,124,112,0,0,TAU);
  p.moveTo(-EAR_X+32,HEAD_Y+EAR_Y); p.arc(-EAR_X,HEAD_Y+EAR_Y,32,0,TAU); p.moveTo(EAR_X+32,HEAD_Y+EAR_Y); p.arc(EAR_X,HEAD_Y+EAR_Y,32,0,TAU);
  p.moveTo(-FOOT_X+48,FOOT_Y); p.ellipse(-FOOT_X,FOOT_Y+6,48,38,0,0,TAU); p.moveTo(FOOT_X+48,FOOT_Y); p.ellipse(FOOT_X,FOOT_Y+6,48,38,0,0,TAU);
  return (silhouette=p);
}
function drawArm(g,sp,side,ang,shadow){
  g.save(); g.translate(side*ARM_X,ARM_Y);
  if(side>0) g.scale(-1,1);
  g.rotate(ang);
  put(g,sp,0,0);
  g.restore();
}
Art.drawBear = function(g,b,opt){
  if(!b) return;
  opt=opt||{};
  var W=opt.w||900, H=opt.h||600, s=Math.min(W,H)/420, cx=W/2, cy=H*0.58;
  // r19: optionale Platzierung (Aquarium: Bär steht neben/unter dem Becken) — _geo/poke/Blick folgen automatisch
  if(opt.s) s=opt.s; if(opt.cx!==undefined) cx=opt.cx; if(opt.cy!==undefined) cy=opt.cy;
  var idx=b.fellIdx||0; if(!Art.MODELS[idx]) idx=0;
  var m=Art.MODELS[idx], P=pal(idx), vor=!!opt.vorher;
  var T=g.getTransform(), sc=Math.sqrt(T.a*T.a+T.b*T.b)*s, k=quant(sc);
  var set=getSet(idx,k,sc), p=b._p||STATIC, R=reactCurves(p);
  if(b._p) b._geo={cx:cx,cy:cy,s:s};
  var t=p.t, now=performance.now()/1000;
  var breath=Math.sin((b.breathe||t)*2.2), fl=b.fluff||0, goose=p.goose?Math.sin(t*60)*0.012*p.goose:0;
  var acc=b.acc||{}, mk=b.makeup||null, accT=b._accT||{};
  function pop(key){ var a=accT[key]; if(!a) return 1; var q=(now-a)/0.55; return q>=1?1:0.4+0.6*Fx.ease.outBack(Math.max(0,q)); }

  g.save();
  g.translate(cx,cy); g.scale(s,s);
  var jumpU=(p.jumpY||0)/s, jf=Math.min(1,jumpU/80);
  // Bodenschatten
  Fx.contactShadow(g,0,196,160*(1-0.35*jf),28*(1-0.3*jf),0.9*(1-0.5*jf));
  g.translate(0,-jumpU+R.dy);
  // Squash & Stretch um die Sitzfläche, Gesamt-Wackeln
  g.translate(0,190); g.scale(R.sx*(1+goose),R.sy*(1-goose)); g.rotate(R.rot); g.translate(0,-190);
  if(set.back) put(g,set.back,0,0);
  // Körper (atmet)
  var bs=1+0.013*breath+jig(p,'body')*0.06;
  g.save(); g.translate(0,182); g.scale(1+(bs-1)*0.5+fl*0.03,bs+fl*0.03); g.translate(0,-182);
  if(fl>0.02){ g.globalAlpha=0.3*fl; g.save(); g.translate(0,BODY_Y); g.scale(1.07,1.06); put(g,set.body,0,0); g.restore(); g.globalAlpha=1; }
  put(g,set.body,0,BODY_Y);
  g.restore();
  // Kette liegt auf der Brust (Kopf deckt den oberen Teil ab)
  if(acc.kette!==null && acc.kette!==undefined && !vor) drawKette(g,Art.KETTEN[acc.kette]||Art.KETTEN[0],pop('kette'));
  // Füße mit Krallen (Lack + Sticker)
  for(var sd=-1;sd<=1;sd+=2){
    var fj=1+jig(p,sd<0?'footL':'footR')*0.1;
    g.save(); g.translate(sd*FOOT_X,FOOT_Y); g.rotate(sd*0.06); g.scale(sd*fj,fj); put(g,set.foot,0,0); g.restore();
  }
  if(!vor) drawNails(g,b);
  // Arme: Schatten auf dem Körper, dann Arm (Pivot Schulter)
  var up=Math.max(p.arms,0), aL=0.1+up*2.25+Math.sin(t*1.6)*0.02, aR=0.1+Math.max(up,p.armR)*2.3+Math.sin(t*1.6+1)*0.02;
  if(p.wave>0.05) aR+=Math.sin(t*9)*0.32*p.wave;
  aL+=jig(p,'armL')*0.25; aR+=jig(p,'armR')*0.25;
  if(p.relax>0) { aL-=p.relax*0.06; aR-=p.relax*0.06; }
  if(aL<0.7) Fx.contactShadow(g,-84,60,30,64,0.55*(1-aL/0.7));
  if(aR<0.7) Fx.contactShadow(g,84,60,30,64,0.55*(1-aR/0.7));
  drawArm(g,set.arm,-1,aL); drawArm(g,set.arm,1,aR);
  // r19: Pfoten-Mitte (Arm-lokal (-16,92)) in Welt-Koordinaten — für Jonglage & Co.
  if(b._p){
    var jU=-jumpU+R.dy, cr=Math.cos(R.rot), sr=Math.sin(R.rot);
    b._paws=[[-1,aL],[1,aR]].map(function(q){
      var a=q[1], u=q[0]*(ARM_X+16*Math.cos(a)+92*Math.sin(a)), v=ARM_Y-16*Math.sin(a)+92*Math.cos(a)-190;
      var x=(u*cr-v*sr)*R.sx*(1+goose), y=(u*sr+v*cr)*R.sy*(1-goose)+190+jU;
      return [cx+x*s, cy+y*s];
    });
  }
  // Kopf-Kontaktschatten auf dem Körper
  Fx.contactShadow(g,0,8,104,30,0.75);
  // Kopf-Gruppe
  var hb=breath*1.4+(p.relax*6), hr=p.tilt+R.hrot+Math.sin(t*14)*0.02*p.wind+(vor?0.06:0);
  var hj=1+jig(p,'head')*0.07;
  g.save(); g.translate(0,HEAD_Y+hb); g.translate(0,70); g.rotate(hr); g.translate(0,-70); g.scale(hj*(1+fl*0.02),hj*(1+fl*0.02));
  var hs=(b.frisur && HAIR[b.frisur]) ? getHair(b.frisur,b.haar||Art.HAAR[0],k,sc) : null;
  if(hs && hs.back) put(g,hs.back,0,0);
  for(sd=-1;sd<=1;sd+=2){
    var ej=jig(p,sd<0?'earL':'earR');
    g.save(); g.translate(sd*EAR_X,EAR_Y); g.rotate(sd*(0.1+ej*0.5+Math.sin(t*2.3+sd)*0.03+p.wind*Math.sin(t*16+sd)*0.08)); if(sd>0) g.scale(-1,1); put(g,set.ear,0,0); g.restore();
  }
  put(g,set.head,0,0);
  // Spa-Maske (mint, weich) unter Augen/Schnauze
  var spa=b._spa||0;
  if(spa>0.02 && !vor && (!window.BSSalon || window.BSSalon.state==='spa')){ g.globalAlpha=Math.min(1,spa)*0.88; softEll(g,0,6,96,70,'#c9ecd2',0,0.35); softEll(g,-30,-40,40,22,'#d7f3dd',0,0.5); g.globalAlpha=1; }
  // Wangen / Rouge
  if(!vor){
    var rc=mk&&mk.rouge?Fx.alpha(mk.rouge,0.62):'rgba(255,140,160,0.28)';
    softEll(g,-62,16,20,12,rc,0,0.9); softEll(g,62,16,20,12,rc,0,0.9);
    if(R.kiss>0.1){ softEll(g,-62,16,24,14,'rgba(255,110,140,'+(0.35*R.kiss)+')',0,0.9); softEll(g,62,16,24,14,'rgba(255,110,140,'+(0.35*R.kiss)+')',0,0.9); }
  }
  put(g,set.snout,0,SNOUT_Y);
  drawMouth(g,p,R,vor);
  drawEyes(g,P,p,b,vor?null:mk,vor);
  if(mk && mk.gp && mk.gp.length && !vor){ var tw=Fx.S.twinkle(); for(var gi=0;gi<mk.gp.length;gi++){ var gp=mk.gp[gi], sz=10+3*Math.sin(now*4+gi*1.7); g.drawImage(tw,gp.dx/s-sz/2,gp.dy/s-8-sz/2,sz,sz); } }
  if(!vor){
    var gs=gurkeSprite();
    if(b.gurkeL) g.drawImage(gs,-EYE_X-22,EYE_Y-22,44,44);
    if(b.gurkeR) g.drawImage(gs,EYE_X-22,EYE_Y-22,44,44);
    if(acc.brille!==null && acc.brille!==undefined) drawBrille(g,Art.BRILLEN[acc.brille]||Art.BRILLEN[0],pop('brille'));
  }
  if(hs){ g.save(); g.rotate(Math.sin(t*15)*0.025*p.wind); put(g,hs.front,0,0); g.restore(); }
  if(set.top) put(g,set.top,0,0);
  if(!vor){
    if(acc.schleife!==null && acc.schleife!==undefined) drawSchleife(g,Art.SCHLEIFEN[acc.schleife]||Art.SCHLEIFEN[0],pop('schleife'));
    if(acc.hut!==null && acc.hut!==undefined) drawHut(g,Art.HUTE[acc.hut]||Art.HUTE[0],b.hutTilt||0,pop('hut'));
  }
  g.restore();
  // Schaum
  if((b.schaum||0)>0.01) drawFoam(g,b.schaum,now);
  // Glanz-Sweep übers Fell (Finale)
  if(p.glint>=0 && p.glint<=1 && Fx.Q.tier>0){
    g.save(); g.clip(silPath()); g.globalCompositeOperation='screen';
    var gx=-260+p.glint*520;
    var lg=g.createLinearGradient(gx-60,-200,gx+60,-140);
    lg.addColorStop(0,'rgba(255,240,210,0)'); lg.addColorStop(0.5,'rgba(255,240,210,0.55)'); lg.addColorStop(1,'rgba(255,240,210,0)');
    g.fillStyle=lg; g.fillRect(-260,-280,520,500); g.restore();
  }
  g.restore();
  // Wassertropfen (Welt-Koordinaten)
  if(b.tropfen && b.tropfen.length){ var dsp=Fx.S.drop(); for(var di=0;di<b.tropfen.length;di++){ var d=b.tropfen[di]; g.drawImage(dsp,d.x-5*s,d.y-7*s,10*s,15*s); } }
};
function drawNails(g,b){
  var lack=b.lack||{}, st=b.sticker||[];
  for(var sd=0;sd<2;sd++){ var side=sd?'R':'L', fx=sd?FOOT_X:-FOOT_X;
    for(var i=0;i<3;i++){
      var key=side+i, x=fx+(i-1)*16*(sd?1:1), y=FOOT_Y+(i===1?29:26);
      var c=lack[key];
      if(c){ g.save(); g.translate(x,y); g.rotate((sd?1:-1)*0.06);
        obj(g,2,function(g){ g.beginPath(); g.ellipse(0,0,6.5,5,0,0,TAU); },c,0,0,6.5,5); gloss(g,-2,-2,2.5,1.4,0.9); g.restore(); }
    }
  }
  for(var j=0;j<st.length;j++){ var s1=st[j]; if(!s1||!s1.ziel) continue;
    var fx2=s1.ziel[0]==='R'?FOOT_X:-FOOT_X, i2=+s1.ziel[1]||0;
    Art.drawSticker(g,s1.typ,fx2+(i2-1)*16,FOOT_Y+14,7.5,s1.farbe||'#e91e63'); }
}

// ================================================================ Sticker (Herz/Stern/Blume) — gecachte Sprites, Alpha aus Farbe
Art.drawSticker = function(g,typ,x,y,r,col){
  if(!(r>0)) return;
  var c=Fx.parse(col), base='rgb('+Math.round(c[0])+','+Math.round(c[1])+','+Math.round(c[2])+')';
  var spr=typ==='herz'?Fx.S.heart(base):typ==='blume'?Fx.S.flower(base):Fx.S.star(base);
  var oa=g.globalAlpha; if(c[3]<1) g.globalAlpha=oa*c[3];
  g.drawImage(spr,x-r*1.19,y-r*1.19,r*2.38,r*2.38);
  g.globalAlpha=oa;
};

// ================================================================ Thumbnails (Wahl, Album) — einmal komponiert, gecacht
// Speicherbudget: nur die zwei zuletzt benutzten Größen bleiben (Wahl-Raster + Album-Bild an der Wand);
// nach einem Größenwechsel (Drehung, anderes Raster) fallen die Kacheln der ältesten Größe weg.
var thumbs={}, thumbSizes=[];
function thumbSize(size){
  var i=thumbSizes.indexOf(size); if(i===0) return;
  if(i>0) thumbSizes.splice(i,1);
  thumbSizes.unshift(size);
  while(thumbSizes.length>2){ var alt='|'+thumbSizes.pop(); for(var key in thumbs) if(key.slice(-alt.length)===alt) delete thumbs[key]; }
}
Art.thumbCount=function(){ return Object.keys(thumbs).length; };
Art.thumb = function(idx,size){
  size=Math.max(16,Math.round(size||128)); idx=Art.MODELS[idx]?idx:0;
  thumbSize(size);
  var key=idx+'|'+size; if(thumbs[key]) return thumbs[key];
  var c=Fx.canvas(size,size), g=c.getContext('2d'), U=size/500;
  g.translate(size/2,size*0.56); g.scale(U,U); g.translate(-210,-243.6);
  Art.drawBear(g,{fellIdx:idx,frisur:null,acc:{},lack:{},sticker:[],makeup:null,schaum:0,fluff:0,tropfen:[]},{w:420,h:420});
  return (thumbs[key]=c);
};
Art.thumbReady = function(idx,size){ return !!thumbs[(Art.MODELS[idx]?idx:0)+'|'+Math.max(16,Math.round(size||128))]; };

// ================================================================ Vorher-Bild (Finale): zerzaust, stumpf, müde
var VORHER_POSE={t:1.3,lid:0,happy:0,squint:0,mouth:0,sleepy:1,gx:0,gy:0.2,tilt:0.05,arms:0,armR:0,wave:0,wind:0,relax:0,goose:0,jumpY:0,glint:-1,rk:'',rt:0,ra:1,poke:null};
Art.renderVorher = function(b,k){
  var W=900,H=600,s=Math.min(W,H)/420,cx=W/2,cy=H*0.58;
  k=Math.max(0.5,Math.min(3,k||1.5));
  var x0=cx-250*s, y0=cy-300*s, w=500*s, h=540*s;
  var c=Fx.canvas(w*k,h*k), g=c.getContext('2d');
  g.scale(c.width/w,c.height/h); g.translate(-x0,-y0);
  var P=pal(b.fellIdx||0);
  var vb={fellIdx:b.fellIdx||0,frisur:'wirr',haar:Fx.warmShadow(P.fell,0.12),acc:{},lack:{},sticker:[],makeup:null,schaum:0,fluff:0,tropfen:[],_p:VORHER_POSE};
  Art.drawBear(g,vb,{w:W,h:H,vorher:true});
  var c2=Fx.canvas(c.width,c.height), g2=c2.getContext('2d');
  g2.drawImage(c,0,0);
  g2.globalCompositeOperation='saturation'; g2.globalAlpha=0.72; g2.fillStyle='#808080'; g2.fillRect(0,0,c2.width,c2.height);
  g2.globalCompositeOperation='multiply'; g2.globalAlpha=0.45; g2.fillStyle='#bcaea2'; g2.fillRect(0,0,c2.width,c2.height);
  g2.globalAlpha=1; g2.globalCompositeOperation='destination-in'; g2.drawImage(c,0,0);
  return {img:c2,x:x0,y:y0,w:w,h:h};
};

// ================================================================ Eisdiele: Eis in der rechten Pfote
Art.drawEis = function(g,eis,x,y,s){
  if(!eis) return;
  var t=performance.now()/1000, n=eis.kugeln?eis.kugeln.length:0;
  g.save(); g.translate(x+86*s,y+30*s); g.scale(s,s);
  var w=eis.waffel||0;
  if(w===1){ // Becher
    obj(g,2,function(g){ g.beginPath(); g.moveTo(-30,-4); g.lineTo(30,-4); g.lineTo(22,52); g.quadraticCurveTo(0,58,-22,52); g.closePath(); },'#f7b6c9',0,24,30,30);
    g.save(); g.beginPath(); g.moveTo(-30,-4); g.lineTo(30,-4); g.lineTo(22,52); g.lineTo(-22,52); g.clip();
    for(var i=0;i<4;i++){ g.fillStyle='rgba(255,255,255,0.55)'; g.fillRect(-30+i*16,-4,7,60); } g.restore();
  } else if(w===2){ // Herz-Waffel
    obj(g,2,function(g){ Fx.heartPath(g,0,18,34); },'#e3ad63',0,18,34,34,'#a8742e');
  } else { // Tüte
    obj(g,2,function(g){ g.beginPath(); g.moveTo(-27,-2); g.lineTo(27,-2); g.quadraticCurveTo(6,50,1,74); g.quadraticCurveTo(0,78,-1,74); g.quadraticCurveTo(-6,50,-27,-2); },'#e6b56a',0,30,27,38,'#a8742e');
    g.save(); g.beginPath(); g.moveTo(-27,-2); g.lineTo(27,-2); g.lineTo(0,78); g.clip(); g.strokeStyle='rgba(150,95,40,0.4)'; g.lineWidth=2;
    for(var j=-4;j<6;j++){ g.beginPath(); g.moveTo(-40+j*12,-2); g.lineTo(-10+j*12,80); g.stroke(); g.beginPath(); g.moveTo(40-j*12,-2); g.lineTo(10-j*12,80); g.stroke(); } g.restore();
    ell(g,0,-2,28,7,'#f0c987');
  }
  for(var q=0;q<n;q++){
    var kg=eis.kugeln[q], sc=kg.scale===undefined?1:Math.max(0.2,kg.scale), col=Art.EIS_FARBEN[kg.c]||Art.EIS_FARBEN[0];
    var r=26*sc, yy=-10-q*32-r*0.4, wob=Math.sin(t*3+q)*0.8;
    Fx.contactShadow(g,wob,yy+r*0.8,r*1.0,r*0.3,0.5);
    Fx.ball(g,wob,yy,r*1.08,r,col);
    for(var d=0;d<3;d++) ell(g,wob-r*0.6+d*r*0.6,yy+r*0.72+(d%2)*4,r*0.2,r*0.26,col);
    if(q===n-1){ var R2=Fx.rand(q+3), SC=['#ff6b8a','#ffe07a','#7ad0f0','#9be08a','#ffffff'];
      for(var sp=0;sp<7;sp++){ g.save(); g.translate(wob+(R2()-0.5)*r*1.3,yy-r*0.2-R2()*r*0.6); g.rotate(R2()*TAU); g.fillStyle=SC[sp%5]; Fx.rr(g,-3.5,-1.3,7,2.6,1.3); g.fill(); g.restore(); } }
  }
  if(n && eis.leck){ var hh=Math.sin(t*5); if(hh>0.4) Art.drawSticker(g,'herz',-40,-20-n*32,6+hh*3,'#f38aa3'); }
  g.restore();
};

// ================================================================ Foto-Rahmen um die Bühne
Art.drawFotoRahmen = function(g,rahmen,flash,badge,W,H){
  var x0=208,y0=36,x1=692,y1=646, bw=20, t=performance.now()/1000;
  var cols=[['#fbe3ee','#f0b6cc'],['#f4f9e8','#b9dca0'],['#fff0c0','#d9a53a']][rahmen]||['#fbe3ee','#f0b6cc'];
  g.save();
  var fr=new Path2D(); fr.rect(x0-bw,y0-bw,x1-x0+bw*2,y1-y0+bw*2); fr.rect(x1,y0,x0-x1,y1-y0);
  g.save(); g.shadowColor='rgba(80,40,40,0.35)'; g.shadowBlur=10; g.shadowOffsetY=4;
  var gr=g.createLinearGradient(x0,y0,x1,y1); gr.addColorStop(0,cols[0]); gr.addColorStop(1,cols[1]);
  g.fillStyle=gr; g.fill(fr,'evenodd'); g.restore();
  g.strokeStyle='rgba(255,255,255,0.7)'; g.lineWidth=3; g.strokeRect(x0-bw+5,y0-bw+5,x1-x0+bw*2-10,y1-y0+bw*2-10);
  g.strokeStyle='rgba(90,50,40,0.18)'; g.lineWidth=2; g.strokeRect(x0,y0,x1-x0,y1-y0);
  var n=14;
  for(var i=0;i<n;i++){
    var q=i/n, per=2*(x1-x0)+2*(y1-y0), d=q*per, px, py;
    if(d<x1-x0){ px=x0+d; py=y0-bw/2; } else if(d<(x1-x0)+(y1-y0)){ px=x1+bw/2; py=y0+d-(x1-x0); }
    else if(d<2*(x1-x0)+(y1-y0)){ px=x1-(d-(x1-x0)-(y1-y0)); py=y1+bw/2; } else { px=x0-bw/2; py=y1-(d-2*(x1-x0)-(y1-y0)); }
    var r=10+2*Math.sin(t*3+i);
    if(rahmen===1) Art.drawSticker(g,'blume',px,py,r,i%2?'#ffffff':'#f7a3bb');
    else if(rahmen===2) Fx.ball(g,px,py,r*0.7,r*0.7,i%2?'#ffe9a6':'#f6c453');
    else Art.drawSticker(g,'stern',px,py,r,i%2?'#ffe38a':'#ffffff');
  }
  if(flash>0.01){ g.globalAlpha=Math.min(1,flash); g.fillStyle='#fffaf0'; g.fillRect(x0-bw,y0-bw,x1-x0+bw*2,y1-y0+bw*2); g.globalAlpha=1; }
  if(badge){
    var bx=450, by=y1+bw/2;
    g.save(); g.translate(bx,by); g.rotate(-0.04);
    obj(g,2,function(g){ Fx.rr(g,-96,-18,192,36,18); },'#f38aa3',0,0,96,18);
    g.fillStyle='#ffffff'; g.font='bold 17px system-ui,sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText('📸 Im Album!',0,1); g.restore();
  }
  g.restore();
};
})();
