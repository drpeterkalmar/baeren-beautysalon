// stations/schneiden.js — Schneiden: Frisur und Haarfarbe wählen (Schnipp-Haare, Funkeln).
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;
var FRISUR_NAMEN = {lockig:'Lockig',kurz:'Kurz',zottig:'Zottig',igel:'Igel',afro:'Afro'};

S.registerStation({
  id:'schneiden',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Wähle Frisur und Farbe! ✂️';
    Art.FRISEURE.forEach(function(f,i){
      H.btn(30+(i%2)*130, 100+Math.floor(i/2)*62, 122, 56, '✂️ '+FRISUR_NAMEN[f], function(){
        S.baer.frisur=f; S.save(); S.buildUI();
        H.sfx('snip'); H.react('snip');
        var hp=H.headPos(); H.emit('hair',hp[0],hp[1]-70,{n:16,speed:180,dir:-Math.PI/2,spread:2.6,grav:520,drag:1.8,size:9,life:1.4,colors:[S.baer.haar],jx:60});
      },{active:function(){return S.baer.frisur===f;},small:1,row:0});
    });
    Art.HAAR.forEach(function(c,i){
      H.btn(30+(i%4)*62, 310+Math.floor(i/4)*62, 56, 56, '', function(){
        S.baer.haar=c; S.save(); S.buildUI();
        H.sfx('sparkle'); H.react('happy',0.7);
        var hp=H.headPos(); H.emit('puff',hp[0],hp[1]-80,{n:8,speed:90,size:26,life:0.6,grav:-40,colors:[c],jx:50});
        H.emit('star',hp[0],hp[1]-80,{n:8,speed:260,size:10,life:0.8,grav:300,colors:['#ffe7a8',c]});
      },{fill:c,active:function(){return S.baer.haar===c;},row:1});
    });
  },
  draw:function(g){ H.baer(g); },
  tap:function(){ return false; }
});
})();
