// stations/schmuecken.js — Schmücken: Hut, Schleife, Brille, Kette an/aus und Farbe wählen.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;
var ACC = [
  {key:'hut',icon:'🎩',name:'Hut',colors:Art.HUTE},
  {key:'schleife',icon:'🎀',name:'Schleife',colors:Art.SCHLEIFEN},
  {key:'brille',icon:'🕶️',name:'Brille',colors:Art.BRILLEN},
  {key:'kette',icon:'📿',name:'Kette',colors:Art.KETTEN}
];

S.registerStation({
  id:'schmuecken',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Antippen = an/aus, Farben wechseln! 🎀';
    ACC.forEach(function(a,i){
      var on = S.baer.acc[a.key]!==null && S.baer.acc[a.key]!==undefined;
      H.btn(30+(i%2)*150, 100+Math.floor(i/2)*130, 142, 60, a.icon+' '+a.name, function(){
        var cur = S.baer.acc[a.key];
        if(cur===null||cur===undefined){ S.baer.acc[a.key]=0; H.accPop(a.key); H.sfx('pop'); H.react('happy');
          var hp=H.headPos(); H.emit('star',hp[0],hp[1]-40,{n:10,speed:240,size:10,life:0.8,grav:260}); }
        else { S.baer.acc[a.key]=null; H.sfx('pop',{pitch:0.7}); }
        S.save(); S.buildUI();
      },{active:function(){return on;},row:i});
      if(on){
        a.colors.forEach(function(c,k){
          H.btn(30+(i%2)*150+k*46, 166+Math.floor(i/2)*130, 40, 40, '', function(){
            S.baer.acc[a.key]=k; H.accPop(a.key); S.save(); S.buildUI(); H.sfx('sparkle');
          },{fill:c,active:function(){return S.baer.acc[a.key]===k;},tiny:1,row:i});
        });
      }
    });
  },
  draw:function(g){ H.baer(g); },
  tap:function(){ return false; }
});
})();
