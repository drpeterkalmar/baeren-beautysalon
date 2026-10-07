// stations/eis.js — Eisdiele: Waffel wählen, bis zu 3 Kugeln; der Bär schleckt (Abschmelzen pro Bild noch in game.js update()).
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'eis',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Waffel wählen, dann Kugel-Farben antippen — der Bär schleckt! 🍦';
    if(!S.eis) S.eis = {waffel:0, kugeln:[], leck:true};
    ['🍦 Tüte','🥤 Becher','❤️ Herz'].forEach(function(t,i){
      H.btn(30+i*120, 100, 112, 54, t, function(){ S.eis.waffel=i; S.buildUI(); },
        {active:function(){return S.eis.waffel===i;}, small:1});
    });
    Art.EIS_FARBEN.forEach(function(c,i){
      H.btn(30+i*60, 166, 54, 54, '', function(){
        if(S.eis.kugeln.length>=3) return;
        S.eis.kugeln.push({c:i, scale:1}); S.eis.leck=true; S.buildUI();
      },{fill:c});
    });
    H.btn(30, 232, 170, 50, '🧽 Neues Eis', function(){ S.eis.kugeln=[]; S.buildUI(); });
  },
  // Eis-Stand rechts (Hintergrund, vor den Duftwolken)
  back:function(g){
    Fx.contactShadow(g,780,430,110,14,0.4);
    var sg=g.createLinearGradient(0,296,0,318); sg.addColorStop(0,'#f0d2ae'); sg.addColorStop(1,'#c7976f');
    g.fillStyle=sg; g.fillRect(690,300,180,16);
    g.fillStyle='#e99f78'; g.fillRect(700,316,12,110); g.fillRect(848,316,12,110);
    Art.EIS_FARBEN.forEach(function(c,i){ Fx.ball(g,720+i*30,288,13,13,c); });
    g.fillStyle='#d9a94f';
    g.beginPath(); g.moveTo(800,296); g.lineTo(830,296); g.lineTo(815,340); g.closePath(); g.fill();
  },
  draw:function(g){
    H.baer(g);
    if(S.eis){
      var s3=Math.min(S.VW,S.VH)/420;
      Art.drawEis(g, S.eis, S.VW*0.5, S.VH*0.58+40*s3, s3);
    }
  },
  tap:function(){ return false; }
});
})();
