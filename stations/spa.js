// stations/spa.js — Spa-Maske: aufs Auge tippen = Gurkenscheibe an/aus; beide Gurken → der Bär entspannt.
// (Entspannung pro Bild läuft noch in game.js update(); Art.drawBear zeigt die Maske nur in dieser Station)
(function(){
'use strict';
var S=window.BSSalon, H=S.H;

S.registerStation({
  id:'spa',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Tippe aufs Auge für eine Gurkenscheibe, nochmal zum Abnehmen! 🥒';
    if(S.baer.gurkeL && S.baer.gurkeR){
      // Ahhhh — Entspannung ansteuern
      S.spaTarget = 1;
    } else S.spaTarget = 0;
    H.btn(330,400,240,56,'🧽 Gurken weg',function(){
      S.baer.gurkeL=false; S.baer.gurkeR=false; S.spaTarget=0; S.save(); S.buildUI();
    },{active:function(){return S.baer.gurkeL||S.baer.gurkeR;}});
  },
  draw:function(g){ H.baer(g); },
  tap:function(x,y){
    var s2=Math.min(S.VW,S.VH)/420;
    var cx2=S.VW*0.5, ey=S.VH*0.58-105*s2;
    // linke Seite / rechte Seite
    if(Math.hypot(x-(cx2-30*s2), y-ey) < 40*s2){
      S.baer.gurkeL = !S.baer.gurkeL; S.save(); S.buildUI();
      window.BSGame && window.BSGame.spaTupfer(x,y);
      return true;
    }
    if(Math.hypot(x-(cx2+30*s2), y-ey) < 40*s2){
      S.baer.gurkeR = !S.baer.gurkeR; S.save(); S.buildUI();
      window.BSGame && window.BSGame.spaTupfer(x,y);
      return true;
    }
    return true;
  }
});
})();
