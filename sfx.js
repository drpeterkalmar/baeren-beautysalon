// sfx.js — prozedurale Soundeffekte (WebAudio, keine Dateien). Entsperrt bei der ersten Geste.
(function(){
'use strict';
var X=window.BSSfx={};
var ac=null, master=null, noiseBuf=null, loops={}, duckT=1, duckV=1;
function S(){ return window.BSSalon||{}; }
function ensure(){
  if(ac) return ac;
  var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
  try{ ac=new AC(); }catch(e){ return null; }
  master=ac.createGain(); master.gain.value=S().muted?0:0.5; master.connect(ac.destination);
  var n=ac.sampleRate*2; noiseBuf=ac.createBuffer(1,n,ac.sampleRate);
  var d=noiseBuf.getChannelData(0); for(var i=0;i<n;i++) d[i]=Math.random()*2-1;
  return ac;
}
window.addEventListener('pointerdown',function(){
  var a=ensure(); if(a && a.state==='suspended' && a.resume) a.resume();
},{capture:true,passive:true});
function ok(){ return ac && ac.state==='running' && !S().muted; }

function env(gn,t0,a,peak,dec){
  gn.gain.setValueAtTime(0.0001,t0); gn.gain.linearRampToValueAtTime(peak,t0+a); gn.gain.exponentialRampToValueAtTime(0.0001,t0+a+dec);
}
function tone(f0,f1,dur,type,vol,delay,att){
  var t0=ac.currentTime+(delay||0), o=ac.createOscillator(), gn=ac.createGain();
  o.type=type||'sine'; o.frequency.setValueAtTime(f0,t0); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  env(gn,t0,att||0.005,vol,dur); o.connect(gn); gn.connect(master); o.start(t0); o.stop(t0+dur+0.05);
}
function noise(dur,ftype,f0,f1,q,vol,delay,att){
  var t0=ac.currentTime+(delay||0), src=ac.createBufferSource(), fl=ac.createBiquadFilter(), gn=ac.createGain();
  src.buffer=noiseBuf; fl.type=ftype; fl.Q.value=q||1; fl.frequency.setValueAtTime(f0,t0); if(f1) fl.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  env(gn,t0,att||0.005,vol,dur); src.connect(fl); fl.connect(gn); gn.connect(master); src.start(t0,Math.random()); src.stop(t0+dur+0.05);
}
var SND={
  tap:function(o){ tone(700,900,0.06,'sine',0.12); },
  bubble:function(o){ var f=500+Math.random()*300; tone(f,f*2.2,0.09,'sine',0.18); },
  splash:function(){ noise(0.5,'bandpass',1800,600,0.8,0.35); },
  boing:function(){ tone(180,520,0.16,'triangle',0.22); tone(520,300,0.22,'sine',0.14,0.14); },
  snip:function(){ noise(0.04,'highpass',4000,0,1,0.3); noise(0.04,'highpass',5000,0,1,0.26,0.08); tone(2600,2200,0.05,'square',0.03,0.02); },
  sparkle:function(){ [1320,1660,1980,2640].forEach(function(f,i){ tone(f,f*1.01,0.18,'sine',0.08,i*0.05); }); },
  kiss:function(){ tone(900,1600,0.08,'sine',0.16); },
  pop:function(o){ var p=(o&&o.pitch)||1; tone(380*p,900*p,0.07,'sine',0.2); },
  klingel:function(){ tone(1319,1319,0.55,'sine',0.13,0,0.004); tone(2638,2638,0.25,'sine',0.03); tone(1047,1047,0.8,'sine',0.13,0.3,0.004); tone(2094,2094,0.3,'sine',0.03,0.3); },  // r22 Türglocke
  chime:function(){ [880,1320,1760].forEach(function(f,i){ tone(f,f,0.9,'sine',0.1,i*0.06,0.01); }); },
  tada:function(){ [523,659,784,1047].forEach(function(f,i){ tone(f,f,0.7,'triangle',0.13,i*0.07,0.01); }); },
  whoosh:function(){ noise(0.45,'bandpass',400,2400,1.2,0.22,0,0.12); },
  poof:function(){ noise(0.35,'lowpass',1200,300,0.7,0.35); },
  magic:function(){ tone(400,1600,1.2,'sine',0.08,0,0.3); SND.sparkle(); },
  cannon:function(){ noise(0.35,'lowpass',900,200,0.7,0.4); tone(110,40,0.3,'sine',0.35); },
  ding:function(o){ var f=[1047,1319,1568][(o&&o.i)||0]||1047; tone(f,f,0.8,'sine',0.14,0,0.005); tone(f*2,f*2,0.4,'sine',0.04); },
  drumroll:function(o){ var d=(o&&o.dur)||2, n=Math.floor(d/0.045); for(var i=0;i<n;i++) noise(0.04,'bandpass',900,0,0.8,0.05+0.12*i/n,i*0.045); }
};
X.play=function(name,o){
  if(!ok()) return;
  var fn=SND[name]; if(!fn) return;
  try{
    if(o && o.delay){ setTimeout(function(){ if(ok()) fn(o); },o.delay*1000); }
    else fn(o);
  }catch(e){}
};
function makeLoop(name){
  var src=ac.createBufferSource(); src.buffer=noiseBuf; src.loop=true;
  var fl=ac.createBiquadFilter(), gn=ac.createGain(); gn.gain.value=0;
  if(name==='shower'){ fl.type='bandpass'; fl.frequency.value=3200; fl.Q.value=0.6; }
  else { fl.type='lowpass'; fl.frequency.value=900; fl.Q.value=0.8; }
  src.connect(fl); fl.connect(gn); gn.connect(master); src.start();
  var L={src:src,gn:gn,vol:name==='shower'?0.16:0.12};
  if(name==='foehn'){ var o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=118; var og=ac.createGain(); og.gain.value=0.25; o.connect(og); og.connect(fl); o.start(); L.osc=o; }
  return L;
}
X.loop=function(name,on){
  if(!ac) return;
  var L=loops[name];
  if(on && ok()){ if(!L) L=loops[name]=makeLoop(name); L.gn.gain.setTargetAtTime(L.vol,ac.currentTime,0.06); }
  else if(L){ L.gn.gain.setTargetAtTime(0,ac.currentTime,0.08); }
};
X.duck=function(v){ duckT=v; };
X.tick=function(dt){
  if(Math.abs(duckV-duckT)>0.001){ duckV+=(duckT-duckV)*Math.min(1,dt*4);
    var M=window.BSMusic; if(M && M.el) try{ M.el.volume=Math.max(0,Math.min(1,duckV)); }catch(e){} }
};
X.syncMute=function(){
  if(!master) return;
  master.gain.setTargetAtTime(S().muted?0:0.5,ac.currentTime,0.03);
  if(S().muted) for(var k in loops) loops[k].gn.gain.value=0;
};
})();
