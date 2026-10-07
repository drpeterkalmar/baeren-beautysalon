// stations/pfoten.js — Pfoten: Lackfarbe oder Sticker wählen, dann auf die Krallen tippen.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'pfoten',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Farbe wählen, dann auf die Krallen tippen! 💅';
    Art.LACK.slice(0,6).forEach(function(c,i){
      H.btn(30+(i%3)*62, 100+Math.floor(i/3)*62, 56, 56, '', function(){
        S.lackColor=c; S.stickerTyp=null; S.buildUI();
      },{fill:c,active:function(){return S.lackColor===c && !S.stickerTyp;}});
    });
    var sticker=[['herz','❤️'],['stern','⭐'],['blume','🌸']];
    sticker.forEach(function(t,i){
      H.btn(30+i*86, 250, 78, 56, t[1], function(){
        S.stickerTyp=t[0]; S.buildUI();
      },{active:function(){return S.stickerTyp===t[0];},big:1});
    });
    H.btn(30,326,150,56,'🧽 Neu',function(){ S.baer.lack={}; S.baer.sticker=[]; S.save(); S.buildUI(); });
  },
  draw:function(g){ H.baer(g); },
  tap:function(x,y){
    ['L0','L1','L2','R0','R1','R2'].forEach(function(k){
      var p=H.clawPos(k);
      if(Math.hypot(x-p[0],y-p[1])<p[2]+8){
        if(S.stickerTyp){
          S.baer.sticker=S.baer.sticker.filter(function(t){return t.ziel!==k;});
          S.baer.sticker.push({ziel:k,typ:S.stickerTyp,farbe:S.lackColor||'#e91e63'});
        } else {
          S.baer.lack[k]=S.lackColor||'#e91e63';
        }
        S.save();
        H.sfx('pop',{pitch:1.4}); H.react('happy',0.6);
        H.emit('star',p[0],p[1],{n:7,speed:170,size:8,life:0.6,grav:200,colors:['#ffe7a8',S.lackColor||'#e91e63']});
      }
    });
    return true;
  }
});
})();
