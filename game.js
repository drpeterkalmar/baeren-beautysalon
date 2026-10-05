// game.js — Loop (performance.now-Delta), Kamera, Raum-Cache, Licht/Grading, Qualitätsstufen, Eingabe
(function(){
'use strict';
var S=window.BSSalon, Fx=window.BSFx, Art=window.BSArt, UI=window.BSUI, Room=window.BSRoom;
window.__errors=[];
window.onerror=function(msg,src,line){ window.__errors.push(msg+' @'+line);
  var e=document.getElementById('err'); if(e) e.textContent='⚠️ '+msg; };
var G=window.BSGame={};
var cv=document.getElementById('cv'), g=cv.getContext('2d');
var view={W:0,H:0,dpr:1,safe:{t:0,r:0,b:0,l:0}};
G.view=view;
function now(){ return performance.now()/1000; }

// ---- Größe, DPR (max 2 bzw. Qualitätsstufe), Safe-Areas über CSS env() ----
var probe=document.createElement('div');
probe.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;'+
  'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
document.body.appendChild(probe);
function resize(){
  var wrap=document.getElementById('wrap');
  view.W=Math.max(200,wrap.clientWidth||innerWidth); view.H=Math.max(200,wrap.clientHeight||innerHeight);
  view.dpr=Math.min(Fx.Q.dpr(),window.devicePixelRatio||1);
  cv.width=Math.round(view.W*view.dpr); cv.height=Math.round(view.H*view.dpr);
  cv.style.width=view.W+'px'; cv.style.height=view.H+'px';
  var cs=getComputedStyle(probe);
  view.safe={t:parseFloat(cs.paddingTop)||0,r:parseFloat(cs.paddingRight)||0,b:parseFloat(cs.paddingBottom)||0,l:parseFloat(cs.paddingLeft)||0};
  UI.dirty=true; room.key=''; tw=null; firstCam=true;
}
window.addEventListener('resize',resize);
if(window.visualViewport) window.visualViewport.addEventListener('resize',resize);
cv.addEventListener('contextmenu',function(e){ e.preventDefault(); });

// ---- Kamera: Welt(900x600-Bühne) -> Bildschirm, getweent mit easeInOutCubic ----
var cam={x:450,y:335,z:0.8}, vp={x:0,y:0,w:100,h:100}, tw=null, firstCam=true, camKey='', shx=0, shy=0;
var FOCUS={ _def:[205,15,695,655], menu:[190,-20,710,660], 'finish-done':[150,-75,750,655],
  geburtstag:[190,15,810,655], eis:[205,15,770,655], geschenke:[205,15,820,655], keks:[110,15,850,655],
  zuckerwatte:[190,15,760,655], ballon:[205,-40,860,655], zauber:[205,-40,760,655], karussell:[150,20,760,665],
  malbuch:[190,70,710,450], foto:[190,25,710,655], disco:[190,15,710,655],
  zirkus:[170,-20,730,655], tanz:[190,-30,710,655], wahl:[205,15,695,655] };
S.focusRect=function(st){ if(st==='aquarium' && S.aquaFocus) return S.aquaFocus(); return FOCUS[st]||FOCUS._def; }; // r19: Aquarium je Orientierung
function camTarget(){
  var fr=S.focusRect(S.state), v=UI.L.vp, fw=fr[2]-fr[0], fh=fr[3]-fr[1];
  var z=Math.min(v.w/fw,v.h/fh);
  return {cam:{x:(fr[0]+fr[2])/2,y:(fr[1]+fr[3])/2,z:z},vp:{x:v.x,y:v.y,w:v.w,h:v.h}};
}
function updateCamera(dt){
  var T=camTarget();
  var key=[T.cam.x,T.cam.y,T.cam.z*1000,T.vp.x,T.vp.y,T.vp.w,T.vp.h].map(Math.round).join(',');
  if(key!==camKey){
    camKey=key;
    if(firstCam){ cam={x:T.cam.x,y:T.cam.y,z:T.cam.z}; vp=Object.assign({},T.vp); tw=null; firstCam=false; }
    else tw={t:0,dur:0.7,fc:{x:cam.x,y:cam.y,z:cam.z},fv:Object.assign({},vp),T:T};
  }
  if(tw){
    tw.t+=dt; var q=Fx.ease.inOutCubic(Math.min(1,tw.t/tw.dur)), L=Fx.lerp;
    cam={x:L(tw.fc.x,T.cam.x,q),y:L(tw.fc.y,T.cam.y,q),z:L(tw.fc.z,T.cam.z,q)};
    vp={x:L(tw.fv.x,T.vp.x,q),y:L(tw.fv.y,T.vp.y,q),w:L(tw.fv.w,T.vp.w,q),h:L(tw.fv.h,T.vp.h,q)};
    if(tw.t>=tw.dur) tw=null;
  } else { cam={x:T.cam.x,y:T.cam.y,z:T.cam.z}; vp=T.vp; }
  G.camRest=T;
  shx=shy=0;
  var fc=S.state==='finish-done'&&S.finaleCam?S.finaleCam():null;
  if(fc){ cam.z*=fc.z; cam.y+=fc.oy; if(fc.shake>0 && !(Fx.DEKO && Fx.RM)){ shx=(Math.random()-0.5)*fc.shake; shy=(Math.random()-0.5)*fc.shake; } }
}
function w2s(wx,wy){ return [vp.x+vp.w/2+(wx-cam.x)*cam.z+shx, vp.y+vp.h/2+(wy-cam.y)*cam.z+shy]; }
function s2w(sx,sy){ return [(sx-vp.x-vp.w/2-shx)/cam.z+cam.x, (sy-vp.y-vp.h/2-shy)/cam.z+cam.y]; }
G.worldToScreen=w2s; G.screenToWorld=s2w;
G.virtToScreen=function(x,y){ return w2s(x,y); };
UI.worldPt=w2s;
UI.worldRect=function(x,y,w,h){ var a=w2s(x,y); return {x:a[0],y:a[1],w:w*cam.z,h:h*cam.z}; };
// Gerätepixel pro Welt-Einheit in der Ruhelage des Finales (für den Vorher-Schnappschuss)
G.pxPerUnit=function(){
  var fr=FOCUS['finish-done'], v=UI.L.vp;
  return Math.min(v.w/(fr[2]-fr[0]),v.h/(fr[3]-fr[1]))*view.dpr;
};

// ---- Raum-Cache: nur bei neuer Kamera-Ruhelage neu rendern ----
var room={cv:null,key:'',x0:0,y0:0,ww:0,wh:0};
function ensureRoom(){
  var T=G.camRest; if(!T) return;
  var c=T.cam, v=T.vp, cxs=v.x+v.w/2, cys=v.y+v.h/2;
  var x0=c.x-cxs/c.z, x1=c.x+(view.W-cxs)/c.z, y0=c.y-cys/c.z, y1=c.y+(view.H-cys)/c.z;
  var mx=(x1-x0)*0.14, my=(y1-y0)*0.14; x0-=mx; x1+=mx; y0-=my; y1+=my;
  var k=c.z*view.dpr;
  var key=[x0,y0,x1,y1,k*100].map(Math.round).join(',')+'|'+Fx.Q.tier+(Fx.DEKO?'|'+(Fx.RMver||0)+'|'+(Room.ver||0):'');
  if(key===room.key) return;
  var pw=(x1-x0)*k, ph=(y1-y0)*k, maxPx=[1.6e6,2.6e6,4e6][Fx.Q.tier];
  if(pw*ph>maxPx){ var f=Math.sqrt(maxPx/(pw*ph)); k*=f; pw*=f; ph*=f; }
  if(!room.cv) room.cv=document.createElement('canvas');
  room.cv.width=Math.ceil(pw); room.cv.height=Math.ceil(ph);
  var rg=room.cv.getContext('2d');
  rg.setTransform(k,0,0,k,-x0*k,-y0*k);
  Room.draw(rg,x0,y0,x1,y1);
  if(Fx.DEKO){ // r20: Grading (Vignette + Lichtschleier) einmal in den Raum backen statt jedes Bild als Vollbild-Ebene
    var gz=k/c.z;
    rg.setTransform(gz,0,0,gz,k*(c.x-x0)-gz*cxs,k*(c.y-y0)-gz*cys);
    var sxa=cxs+(x0-c.x)*c.z, sya=cys+(y0-c.y)*c.z;
    Fx.gradingPaint(rg,view.W,view.H,sxa,sya,(x1-x0)*c.z,(y1-y0)*c.z);
  }
  room.key=key; room.x0=x0; room.y0=y0; room.ww=room.cv.width/k; room.wh=room.cv.height/k;
}

// ---- Partikel-Helfer (API für salon.js) ----
G.parfumSpray=function(c){
  for(var i=0;i<3;i++) Fx.P.emit('puff',300+i*60,300-i*30,{n:4,speed:120,dir:-0.3,spread:1,size:30,life:1.4,grav:-30,drag:1.5,colors:[c,Fx.warmLight(c,0.5)]});
  Fx.P.emit('spark',330,280,{n:18,speed:260,dir:-0.2,spread:1.2,size:10,life:1.3,grav:-40,drag:1.2,colors:[c,'#fff4e0']});
  Fx.P.emit('twinkle',450,250,{n:6,speed:200,size:22,life:0.9,grav:0,drag:2});
};
G.spaTupfer=function(x,y){ Fx.P.emit('spark',x,y,{n:8,speed:120,size:9,life:0.6,grav:200,colors:['#b9e39a','#eaffd8']}); Fx.P.emit('drop',x,y,{n:5,speed:200,size:6,life:0.7,grav:700}); };
G.konfettiBurst=function(x,y){ Fx.P.emit('confetti',x,y,{n:60,speed:560,size:11,life:2.4,grav:700,drag:1.2}); };
G.sternExplosion=function(x,y){ Fx.P.emit('star',x,y,{n:26,speed:400,size:12,life:1.0,grav:300,drag:1.6,colors:['#ffe19a','#f4a6b8','#fff4d6','#c9b3e6']}); Fx.P.emit('ring',x,y,{n:1,speed:0,size:160,life:0.5,grav:0,drag:0,colors:['#fff1d6']}); };
G.blumenPuff=function(x,y){ Fx.P.emit('flower',x,y,{n:22,speed:360,size:10,life:1.4,grav:420,drag:1.4,colors:['#f7b6c9','#fff4ea','#f6d68a']}); };
G.herzPuff=function(x,y){ Fx.P.emit('heart',x,y,{n:20,speed:360,size:10,life:1.4,grav:420,drag:1.4,colors:['#f38aa3','#f7b6c9','#ef8f7a']}); };
G.regenbogenPuff=function(x,y){ Fx.P.emit('star',x,y,{n:30,speed:380,size:11,life:1.3,grav:380,drag:1.4,colors:['#f6a57a','#f7d774','#a9c79c','#9fd0c0','#c9b3e6','#f4a6b8']}); };
G.cannons=function(){
  var W=view.W,H=view.H;
  Fx.P.emit('confetti',-10,H*0.92,{n:120,speed:1350,dir:-1.05,spread:0.55,size:13,life:3.4,grav:900,drag:1.25,layer:'screen'});
  Fx.P.emit('confetti',W+10,H*0.92,{n:120,speed:1350,dir:-Math.PI+1.05,spread:0.55,size:13,life:3.4,grav:900,drag:1.25,layer:'screen'});
  Fx.P.emit('ring',W/2,H*0.45,{n:1,speed:0,size:Math.max(W,H)*0.7,life:0.6,grav:0,drag:0,layer:'screen',colors:['#fff4dc']});
};
G.drizzle=function(){
  Fx.P.emit('confetti',Math.random()*view.W,-12,{n:2,speed:60,dir:Math.PI/2,spread:0.6,size:11,life:6,grav:160,drag:0.6,layer:'screen'});
};
G.starBurst=function(i){
  var p=UI.starPos(i);
  Fx.P.emit('star',p[0],p[1],{n:10,speed:260,size:8,life:0.7,grav:260,drag:2,layer:'screen',colors:['#ffe19a','#fff4d6']});
  Fx.P.emit('twinkle',p[0],p[1],{n:2,speed:40,size:26,life:0.6,grav:0,layer:'screen'});
};
G.tier=function(){ return Fx.Q.tier; };

// ---- Eingabe (Touch zuerst; Maus bewegt nur den Blick) ----
var down=false, worldDown=false, activeId=null, lastW=[0,0], rubT=0;
G.pointer=null;
var PASSIV={schneiden:1,schmuecken:1,parfum:1,foehnen:1,zirkus:1,eis:1,foto:1,finish:1,menu:1,karussell:0};
cv.addEventListener('pointerdown',function(e){
  e.preventDefault();
  if(down && activeId!==null && e.pointerId!==activeId) return;
  activeId=e.pointerId; down=true;
  try{ cv.setPointerCapture(e.pointerId); }catch(_){}
  var x=e.clientX, y=e.clientY;
  if(UI.down(x,y)){ worldDown=false; return; }
  worldDown=true;
  var w=s2w(x,y); lastW=w;
  G.pointer={x:w[0],y:w[1],t:now()};
  var live=Art.liveBear;
  if(live && S.state!=='finish-done' && S.state!=='wahl'){
    var part=Art.poke(live,w[0],w[1],85);
    if(part && PASSIV[S.state]){ Art.react(live,'pop',0.5); if(window.BSSfx) window.BSSfx.play('boing'); Fx.P.emit('heart',w[0],w[1]-10,{n:3,speed:160,size:9,life:0.9,grav:-60,drag:1.5}); }
  }
  S.tapBear(w[0],w[1]);
},{passive:false});
cv.addEventListener('pointermove',function(e){
  e.preventDefault();
  var x=e.clientX, y=e.clientY;
  if(!down){ if(e.pointerType==='mouse'){ var wm=s2w(x,y); G.pointer={x:wm[0],y:wm[1],t:now()}; } return; }
  if(e.pointerId!==activeId) return;
  if(UI.move(x,y)) return;
  if(!worldDown) return;
  var p=s2w(x,y);
  G.pointer={x:p[0],y:p[1],t:now()};
  var live=Art.liveBear;
  if(S.state==='waschen'){
    var before=S.baer.schaum;
    S.tapBear(p[0],p[1]);
    if(live) Art.poke(live,p[0],p[1],22);
    if(S.baer.schaum>before && now()-rubT>0.12){ rubT=now();
      Fx.P.emit('bubble',p[0],p[1],{n:2,speed:90,dir:-Math.PI/2,spread:2,grav:-80,drag:1.5,size:12,life:1.5});
      if(window.BSSfx) window.BSSfx.play('bubble'); }
  }
  if(S.state==='massage'){ S.dragBear(p[0],p[1],lastW[0],lastW[1]); if(live) Art.poke(live,p[0],p[1],14); G._massT=now(); }
  if(S.state==='zuckerwatte' && S._stabDrag && S.watte){ S.watte.sx=p[0]; S.watte.sy=p[1]; }
  if(S.state==='keks' && S.keks && S._teigHit && !S.keks.stich){
    var th=S._teigHit;
    if(p[0]>=th.x&&p[0]<=th.x+th.w&&p[1]>=th.y&&p[1]<=th.y+th.h) S.keks.teig=Math.min(1,S.keks.teig+0.03);
  }
  lastW=p;
},{passive:false});
function up(e){
  if(e){ e.preventDefault(); if(activeId!==null && e.pointerId!==activeId) return; }
  if(down) UI.up(e?e.clientX:0,e?e.clientY:0);
  down=false; worldDown=false; activeId=null; S.foehn=false; S._stabDrag=false;
}
cv.addEventListener('pointerup',up,{passive:false});
cv.addEventListener('pointercancel',up,{passive:false});
document.addEventListener('touchmove',function(e){ e.preventDefault(); },{passive:false});

// ---- Update pro Station ----
var prevSchaum=0;
function update(dt){
  var b=S.baer, t=now(), st=S.state;
  if(st==='waschen'){
    if(S.dusche && b.schaum>0){
      b.schaum=Math.max(0,b.schaum-dt*0.55);
      b.tropfen.length=0;
      var s=Math.min(S.VW,S.VH)/420;
      for(var i=0;i<5;i++) b.tropfen.push({x:S.VW*0.5+(Math.random()-0.5)*200*s,y:S.VH*0.35+Math.random()*260*s});
      if(Math.random()<dt*20) Fx.P.emit('drop',400+Math.random()*120,190+Math.random()*30,{n:2,speed:220,dir:-Math.PI/2,spread:2.4,size:6,life:0.8,grav:900,drag:0.5});
      if(b.schaum===0){ // fertig abgeduscht: Schütteln wie ein nasser Hund
        Art.react(b,'shake'); if(window.BSSfx) window.BSSfx.play('splash');
        Fx.P.emit('drop',S.VW*0.5,S.VH*0.58,{n:40,speed:620,size:7,life:0.9,grav:900,drag:0.8,jx:120,jy:100});
        S.dusche=false;
      }
    } else { b.tropfen.length=0; if(b.schaum<=0) S.dusche=false; }
  }
  if(st==='foehnen'){
    var tgt=(S.foehn && b.schaum<0.1)?1:0;
    b.fluff+=(tgt-b.fluff)*Math.min(1,dt*3);
    if(S.foehn && b.schaum<0.1 && Math.random()<dt*14)
      Fx.P.emit('spark',S.VW*0.5-110,S.VH*0.58-150,{n:1,speed:380,dir:0.35,spread:0.5,size:9,life:0.7,grav:-40,drag:1,colors:['#ffe8c8','#fff6e8']});
  }
  if(st==='spa'){
    b._spa=(b._spa||0)+(((S.spaTarget)?1:0)-(b._spa||0))*Math.min(1,dt*1.4);
    b.relax=Math.max(b.relax,b._spa);
  }
  if(st==='eis' && S.eis && S.eis.leck && S.eis.kugeln.length){
    var top=S.eis.kugeln[S.eis.kugeln.length-1];
    top.scale=(top.scale===undefined?1:top.scale)-dt*0.06;
    if(top.scale<0.3) S.eis.kugeln.pop();
  }
  if(S.flash>0) S.flash=Math.max(0,S.flash-dt*5);
  if(st!=='spa' && S.spaTarget===0 && b._spa!==undefined) b._spa=Math.max(0,b._spa-dt*0.6);
  b.breathe=(b.breathe||0)+dt;
  if(S.tanz && S.tanz.spin>0) S.tanz.spin=Math.max(0,S.tanz.spin-dt*1.2);
  if(st==='zuckerwatte' && S.watte){
    var wt=S.watte;
    wt.spin=Math.max(0,(wt.spin||0)-dt*0.25);
    if(wt.spin>0) wt.lvl=Math.min(1,(wt.lvl||0)+dt*wt.spin*0.30);
    if(wt._bissT===undefined) wt._bissT=4+Math.random()*3;
    wt._bissT-=dt;
    if(wt._bissT<0 && wt.lvl>0.15){ wt.lvl=Math.max(0.05,wt.lvl-0.22); wt.kau=1.4; wt._bissT=4+Math.random()*3.5; Art.react(b,'happy'); }
    if(wt.kau>0) wt.kau=Math.max(0,wt.kau-dt);
  }
  if(st==='massage' && S.mass){
    var rt=Math.min(1,S.mass.prog/100);
    b.relax+=(rt-b.relax)*Math.min(1,dt*2.5);
    for(var hi=S.mass.herzen.length-1;hi>=0;hi--){
      var h=S.mass.herzen[hi]; h.t=(h.t||0)+dt; h.a-=dt*0.7;
      var r=h.r0+h.t*70;
      h.x=h.ox+Math.cos(h.a0+h.t*3.2)*r; h.y=h.oy+Math.sin(h.a0+h.t*3.2)*r-h.t*30;
      if(h.a<=0) S.mass.herzen.splice(hi,1);
    }
  } else if(b.relax>0 && st!=='spa') b.relax=Math.max(0,b.relax-dt*0.8);
  if(S.geschenk && S.geschenk.schuettel>0) S.geschenk.schuettel=Math.max(0,S.geschenk.schuettel-dt);
  if(S.keks && S.keks.glow>0){ S.keks.glow=Math.max(0,S.keks.glow-dt); if(S.keks.glow===0 && S.keks.stich) S.keks.biss=1.4; }
  if(S.keks && S.keks.biss>0){ S.keks.biss=Math.max(0,S.keks.biss-dt); b.jubel=Math.min(1,Math.max(b.jubel||0,S.keks.biss*0.8)); }
  if(S.toast && S.toast.t>0) S.toast.t=Math.max(0,S.toast.t-dt);
  b.bow=0;
  if(b._j===undefined) b._j=0;
  b._j+=(0-b._j)*Math.min(1,dt*3); b.jubel=b._j;
  if(S.ballon){
    if(S.ballon.pust>0) S.ballon.pust=Math.max(0,S.ballon.pust-dt*1.6);
    if(S.ballon.schreck>0){ S.ballon.schreck=Math.max(0,S.ballon.schreck-dt*0.9); if(S.ballon.schreck===0) b.jubelT2=1.2; }
  }
  if(b.jubelT2>0){ b.jubelT2=Math.max(0,b.jubelT2-dt); b.jubel=Math.min(1,b.jubelT2); }
  if(S.zauber && S.zauber.pfote>0) S.zauber.pfote=Math.max(0,S.zauber.pfote-dt*1.1);
  var hutTgt=(st==='finish-done'||(b.jubel||0)>0.3)?1:0;
  if(b._hutTil===undefined) b._hutTil=0;
  b._hutTil+=(hutTgt-b._hutTil)*Math.min(1,dt*4); b.hutTilt=b._hutTil;

  // ---- Lebendigkeit des sichtbaren Bären ----
  var live=Art.liveBear=(st==='menu')?S.menuBaer:b;
  if(live){
    var env={head:[450,231]};
    if(G.pointer) env.pointer={x:G.pointer.x,y:G.pointer.y,age:t-G.pointer.t};
    if(st==='waschen'){ if(S.dusche && b.schaum>0) env.squint=1; else if(down && worldDown && b.schaum>0) env.happy=1; }
    if(st==='foehnen' && S.foehn && b.schaum<0.1){ env.wind=1; env.happy=1; }
    if(st==='massage' && G._massT && t-G._massT<0.35){ env.goose=1; env.happy=b.relax<0.6?1:0; }
    if(st==='tanz'){ env.mouth=0.7; env.sway=0; }
    if(st==='aquarium' && S.aquaBlick && !(env.pointer && env.pointer.age<2.5)){ var aqb=S.aquaBlick(); if(aqb) env.pointer={x:aqb[0],y:aqb[1],age:0}; }
    if(st==='zirkus') env.arms=0.3; // r19: Pfoten zum Jonglieren seitlich vorgestreckt
    if(st==='menu'){ var ph=(t%7); env.wave=ph<2.2?1:0; env.armR=ph<2.2?1:0; }
    if(st==='finish-done' && S.finaleEnv) S.finaleEnv(env);
    Art.updateBear(live,dt,env);
  }
  if(st==='finish-done' && S.updateFinale) S.updateFinale(dt);
  // Dauer-Sounds
  if(window.BSSfx){
    window.BSSfx.loop('shower',st==='waschen' && !!S.dusche && b.schaum>0);
    window.BSSfx.loop('foehn',st==='foehnen' && !!S.foehn);
    window.BSSfx.tick(dt);
  }
  Fx.P.update(dt);
}

// ---- Rendern ----
function showerFx(g,t){
  if(S.state!=='waschen' || !S.dusche || !S._brause || !(S.baer.schaum>0)) return;
  var bx=S._brause[0], by=S._brause[1];
  g.save(); g.lineCap='round';
  for(var i=0;i<9;i++){
    var x0=bx+(i-4)*5, x1=440+(i-4)*26, y1=170+((i*37)%50);
    g.strokeStyle='rgba(232,246,246,0.7)'; g.lineWidth=3.2;
    g.setLineDash([16,20]); g.lineDashOffset=-t*520-i*9;
    g.beginPath(); g.moveTo(x0,by); g.quadraticCurveTo((x0+x1)/2-30,(by+y1)/2-30,x1,y1); g.stroke();
  }
  g.setLineDash([]);
  Fx.glow(g,420,180,170,'#f6fcfb',0.28);
  g.restore();
}
var snap=null, snapT=-9, prevState=null;
function render(t){
  var dpr=view.dpr, W=view.W, H=view.H;
  g.setTransform(dpr,0,0,dpr,0,0);
  g.globalAlpha=1; g.globalCompositeOperation='source-over';
  g.fillStyle='#f4e2cf'; g.fillRect(0,0,W,H);
  g.save();
  g.translate(vp.x+vp.w/2+shx,vp.y+vp.h/2+shy); g.scale(cam.z,cam.z); g.translate(-cam.x,-cam.y);
  if(room.cv) g.drawImage(room.cv,room.x0,room.y0,room.ww,room.wh);
  Room.ambient(g,t,Fx.Q.tier);
  // Finale: Spot — Raum dimmt, Lichtkegel auf dem Bären
  var dim=S.state==='finish-done'&&S.finaleDim?S.finaleDim():0;
  if(dim>0.005){
    g.save(); g.setTransform(dpr,0,0,dpr,0,0);
    var c=w2s(450,390), R=Math.max(W,H);
    var sg=g.createRadialGradient(c[0],c[1],250*cam.z,c[0],c[1],R*0.75);
    sg.addColorStop(0,'rgba(46,24,30,0)'); sg.addColorStop(0.35,'rgba(46,24,30,'+(dim*0.75)+')'); sg.addColorStop(1,'rgba(40,20,28,'+dim+')');
    g.fillStyle=sg; g.fillRect(0,0,W,H);
    g.restore();
  }
  S.draw(g);
  showerFx(g,t);
  Fx.P.draw(g,'world');
  g.restore();
  // Blitz der Enthüllung
  var fl=S.state==='finish-done'&&S.finaleFlash?S.finaleFlash():0;
  if(fl>0.005){ g.fillStyle='rgba(255,247,232,'+fl+')'; g.fillRect(0,0,W,H); }
  // Color-Grading: warmer Vignetten-Layer (gecacht) — r20 (Deko): steckt schon im Raum-Cache
  if(!Fx.DEKO) g.drawImage(Fx.grading(W,H,dpr),0,0,W,H);
  UI.draw(g,view);
  Fx.P.draw(g,'screen');
  // Crossfade vom alten Bild (kein harter Schnitt)
  var q=(t-snapT)/0.38;
  if(snap && q<1){
    g.save(); g.setTransform(1,0,0,1,0,0);
    g.globalAlpha=1-Fx.ease.inOutCubic(q);
    var z=1+0.04*q; g.translate(cv.width/2,cv.height/2); g.scale(z,z); g.translate(-cv.width/2,-cv.height/2);
    g.drawImage(snap,0,0); g.restore();
  }
}

// ---- Qualitätsstufen: Frame-Zeit > 20 ms → weniger Auflösung/Partikel statt FPS-Einbruch ----
var perf={ema:16.7,work:6,slow:0,fast:0,flips:0,warm:0};
G.perf=perf;
function tiers(dtMs,work,dt){
  perf.warm+=dt; if(perf.warm<2.5) return;
  perf.ema+=(Math.min(dtMs,60)-perf.ema)*0.05;
  perf.work+=(work-perf.work)*0.05;
  if(perf.ema>20.5) perf.slow+=dt; else perf.slow=Math.max(0,perf.slow-dt*0.5);
  if(perf.slow>1.3 && Fx.Q.tier>0){ Fx.Q.tier--; perf.slow=0; perf.fast=0; perf.flips++; resize(); return; }
  if(perf.ema<17.4 && perf.work<6) perf.fast+=dt; else perf.fast=0;
  if(perf.fast>8 && Fx.Q.tier<2 && perf.flips<2){ Fx.Q.tier++; perf.fast=0; resize(); }
}

var last=performance.now();
function frame(ts){
  var dtRaw=(ts-last)/1000; last=ts;
  var dt=Math.min(0.05,Math.max(0,dtRaw)), t=ts/1000;
  if(S.state!==prevState){
    if(prevState!==null && Fx.Q.tier>0){
      if(!snap || snap.width!==cv.width || snap.height!==cv.height){ snap=document.createElement('canvas'); snap.width=cv.width; snap.height=cv.height; }
      var sc=snap.getContext('2d'); sc.setTransform(1,0,0,1,0,0); sc.clearRect(0,0,snap.width,snap.height); sc.drawImage(cv,0,0);
      snapT=t;
    }
    if(S.state!=='finish-done') Fx.P.clear('screen');
    prevState=S.state;
  }
  if(UI.dirty){ UI.layout(view,g); UI.dirty=false; }
  update(dt);
  updateCamera(dt);
  if(!tw) ensureRoom();
  var w0=performance.now();
  render(t);
  tiers(dtRaw*1000,performance.now()-w0,dt);
  requestAnimationFrame(frame);
}
resize();
S.buildUI();
UI.layout(view,g); UI.dirty=false;
updateCamera(0); ensureRoom();
requestAnimationFrame(frame);
})();
