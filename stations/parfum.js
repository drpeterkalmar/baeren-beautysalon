// stations/parfum.js — Parfum: Duft wählen (Sprühwolke); ein Schnupper-Wölkchen bleibt am Bären (Duftwolken zeichnet salon.js).
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'parfum',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Wähle einen Duft — ein Schnupper-Wölkchen bleibt! 🌸';
    Art.DUFTE.forEach(function(d,i){
      H.btn(30+(i%2)*170, 100+Math.floor(i/2)*130, 162, 56, d.icon+' '+d.name, function(){
        S.baer.duft=i; S.save(); S.buildUI();
        window.BSGame && window.BSGame.parfumSpray(Art.DUFTE[i].c);
        H.sfx('sparkle'); H.react('happy',1.2);
      },{active:function(){return S.baer.duft===i;},row:0});
      // kleiner Flakon unter dem Knopf
      H.btn(80+(i%2)*170, 162+Math.floor(i/2)*130, 30, 46, '', function(){
        S.baer.duft=i; S.save(); S.buildUI();
        window.BSGame && window.BSGame.parfumSpray(Art.DUFTE[i].c);
      },{fill:d.c,tiny:1,hideInTray:1});
    });
    H.btn(30, 372, 150, 50, '🧽 Kein Duft', function(){
      S.baer.duft=null; S.save(); S.buildUI();
    });
  },
  draw:function(g){ H.baer(g); },
  tap:function(){ return false; }
});
})();
