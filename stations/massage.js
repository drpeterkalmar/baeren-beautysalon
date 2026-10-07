// stations/massage.js — Massage: mit dem Finger in Kreisen über den Bären streichen → er entspannt, Herzchen steigen auf.
// (Entspannung und Herzchen-Bahnen pro Bild laufen noch in game.js update(); game.js ruft beim Ziehen S.dragBear.)
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'massage',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Streiche mit dem Finger in Kreisen über den Bären! 💆';
    if(!S.mass) S.mass = {prog:0, ang:null, herzen:[]};
  },
  draw:function(g){ drawHerzen(g); H.baer(g); },
  tap:function(x,y){ S.dragBear(x,y); return true; }
});

// Massage-Bewegung: Kreis-Drag auf dem Bär-Körper
S.dragBear = function(x,y,px,py){
  if(S.state!=='massage'||!S.mass) return;
  var s=Math.min(S.VW,S.VH)/420;
  var cx=S.VW*0.5, cy=S.VH*0.58+70*s;
  var dx=(x-cx)/(140*s), dy=(y-cy)/(130*s);
  if(dx*dx+dy*dy>1.6) { S.mass.ang=null; return; }
  var a=Math.atan2(y-cy,x-cx);
  if(S.mass.ang!==null && px!==undefined){
    var da=a-S.mass.ang;
    if(da>Math.PI) da-=Math.PI*2;
    if(da<-Math.PI) da+=Math.PI*2;
    S.mass.prog=Math.min(100,S.mass.prog+Math.abs(da)*2.2);
    if(Math.abs(da)>0.05 && Math.random()<0.3){
      S.mass.herzen.push({ox:x,oy:y, x:x, y:y, a:1, t:0, a0:Math.random()*Math.PI*2, r0:6+Math.random()*10});
      if(S.mass.herzen.length>18) S.mass.herzen.shift();
    }
  }
  S.mass.ang=a;
};

function drawHerzen(g){
  if(!S.mass) return;
  S.mass.herzen.forEach(function(h){
    g.globalAlpha = h.a;
    Art.drawSticker(g,'herz',h.x,h.y,10,'#ff6b9d');
  });
  g.globalAlpha=1;
}
})();
