// stations/foehnen.js — Föhnen: Föhn-Knopf gedrückt halten, das Fell wird flauschig.
// (Flausch-Wert und Funken pro Bild laufen noch in game.js update(); Aufräumen beim Verlassen: S.foehn=false)
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Fx=window.BSFx;

S.registerStation({
  id:'foehnen',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Halte den Föhn gedrückt! 💨';
    H.btn(30,110,170,80,'🌬️ Föhn',function(){},{hold:true, active:function(){return S.foehn;}});
    if(S.baer.schaum>0.1) H.btn(30,206,170,56,'🚿 Erst duschen!',function(){ S.setState('waschen'); });
  },
  draw:function(g){ H.baer(g); drawFoehn(g); },
  // Flausch beim Föhnen + warme Funken (aus game.js update())
  frueh:function(dt){
    var b=S.baer;
    var tgt=(S.foehn && b.schaum<0.1)?1:0;
    b.fluff+=(tgt-b.fluff)*Math.min(1,dt*3);
    if(S.foehn && b.schaum<0.1 && Math.random()<dt*14)
      Fx.P.emit('spark',S.VW*0.5-110,S.VH*0.58-150,{n:1,speed:380,dir:0.35,spread:0.5,size:9,life:0.7,grav:-40,drag:1,colors:['#ffe8c8','#fff6e8']});
  },
  onLeave:function(){ S.foehn=false; }
});

// Föhn (hängt links oben, zielt auf den Kopf) + warme Luftwellen
function drawFoehn(g){
  var s=Math.min(S.VW,S.VH)/420, t=performance.now()/1000;
  var fx=S.VW*0.5-175*s, fy=S.VH*0.58-190*s, on=!!S.foehn;
  var wob=on?Math.sin(t*40)*1.2*s:0;
  g.save(); g.translate(fx+wob,fy); g.rotate(0.35);
  Fx.contactShadow(g,6*s,40*s,50*s,14*s,0.25);
  // Griff
  var hg=g.createLinearGradient(-12*s,0,12*s,0); hg.addColorStop(0,'#f6c29f'); hg.addColorStop(1,'#d88a63');
  g.fillStyle=hg; g.beginPath(); g.moveTo(-26*s,6*s); g.lineTo(-6*s,6*s); g.lineTo(-14*s,70*s); g.lineTo(-34*s,66*s); g.closePath(); g.fill();
  // Körper
  Fx.ball(g,-10*s,0,40*s,30*s,'#f2a57e');
  var ng=g.createLinearGradient(0,-18*s,0,18*s); ng.addColorStop(0,'#f0d3a0'); ng.addColorStop(1,'#b98c55');
  g.fillStyle=ng; g.beginPath(); g.moveTo(20*s,-18*s); g.lineTo(58*s,-13*s); g.lineTo(58*s,13*s); g.lineTo(20*s,18*s); g.closePath(); g.fill();
  Fx.ball(g,58*s,0,6*s,13*s,'#8f6a4a');
  g.fillStyle='rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-22*s,-14*s,14*s,6*s,-0.3,0,Math.PI*2); g.fill();
  g.restore();
  if(on && S.baer.schaum<0.1){
    g.save(); g.lineCap='round';
    for(var i=0;i<5;i++){
      var ph=((t*1.6+i/5)%1);
      g.globalAlpha=Math.sin(ph*Math.PI)*0.55;
      g.strokeStyle=i%2?'#ffe6c4':'#fff4e4'; g.lineWidth=(5-ph*3)*s;
      var sx=fx+60*s, sy=fy+22*s, ex=S.VW*0.5+10*s, ey=S.VH*0.58-100*s+(i-2)*22*s;
      var mx=sx+(ex-sx)*ph, my=sy+(ey-sy)*ph;
      g.beginPath(); g.moveTo(mx-30*s,my-8*s);
      g.quadraticCurveTo(mx-15*s,my-8*s+Math.sin(t*14+i)*9*s,mx,my); g.quadraticCurveTo(mx+15*s,my+Math.sin(t*14+i+1)*9*s,mx+30*s,my+6*s);
      g.stroke();
    }
    g.restore();
  }
}
})();
