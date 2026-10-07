// stations/finish.js — „Fertig!“: großer Knopf startet das Finale (S.startFinale in salon.js).
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'finish',
  build:function(){
    S.hinweis = 'Perfekt! ✨';
    S.hinweis = 'Bereit für den großen Auftritt? ✨';
    H.btn(330,470,240,70,'🎉 Fertig!',function(){ S.startFinale(); },{big:1,cta:1,primary:1,hero:1});
  },
  draw:function(g){ H.baer(g); },
  tap:function(){ return false; }
});
})();
