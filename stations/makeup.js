// stations/makeup.js — Make-up: Rouge, Lidschatten, Glitzer-Tupfer auf Wange/Stirn (max. 14).
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'makeup',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Farbe wählen, dann Glitzer auf Wange oder Stirn tupfen! ✨';
    var mk = S.baer.makeup;
    // Rouge-Farben
    Art.ROUGE.forEach(function(c,i){
      H.btn(30+i*52, 100, 46, 46, '', function(){
        mk.rouge=c; S.save(); S.buildUI(); H.sfx('kiss'); H.react('kiss');
      },{fill:c,active:function(){return mk.rouge===c;},row:0,rowLabel:i===0?'Rouge':null});
    });
    // Lidschatten
    Art.LIDSCHATTEN.forEach(function(c,i){
      H.btn(30+i*52, 156, 46, 46, '', function(){
        mk.lid=c; S.save(); S.buildUI(); H.sfx('sparkle'); H.react('blink');
      },{fill:c,active:function(){return mk.lid===c;},row:1,rowLabel:i===0?'Lidschatten':null});
    });
    H.btn(30, 216, 200, 50, '✨ Glitzer-Modus', function(){
      S.glitzMode = !S.glitzMode; S.buildUI();
    },{active:function(){return !!S.glitzMode;}});
    H.btn(30, 276, 150, 50, '🧽 Neu', function(){
      S.baer.makeup={rouge:null,lid:null,gp:[]}; S.save(); S.buildUI();
    });
  },
  draw:function(g){ H.baer(g); },
  tap:function(x,y){
    if(!S.glitzMode) return false;
    // Glitzer-Tupfer auf Wange/Stirn (Kopfbereich), max 14
    var s2=Math.min(S.VW,S.VH)/420;
    var cx2=S.VW*0.5, hy2=S.VH*0.58-90*s2;
    var ddx=x-cx2, ddy=y-hy2;
    if(ddx*ddx/(90*s2*90*s2)+ddy*ddy/(90*s2*90*s2)<1.2){
      var mk=S.baer.makeup; if(!mk.gp) mk.gp=[];
      if(mk.gp.length<14){ mk.gp.push({dx:ddx,dy:ddy}); S.save(); }
    }
    return true;
  }
});
})();
