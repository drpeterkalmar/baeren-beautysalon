// music.js — Salon-Hintergrundmusik (iOS-sicher: EIN <audio>-Element, Medienpfad)
// Regeln: kein WebAudio, keine SFX, Unlock per erstem pointerdown, Mute persistiert.
(function(){
'use strict';
var S = window.BSSalon = window.BSSalon || {};

S.muted = false;
try{ S.muted = localStorage.getItem('bs_muted')==='1'; }catch(e){}
S.musicWanted = false;

var musicEl = new Audio('audio/salon.m4a?v=16');
musicEl.loop = true;
musicEl.preload = 'auto';
musicEl.volume = 1.0;

function tryPlay(){
  if(S.muted || !S.musicWanted) return;
  var p = musicEl.play();
  if(p && p.catch) p.catch(function(){/* iOS: Geste noetig, naechster Tap versucht erneut */});
}
musicEl.addEventListener('ended', function(){ musicEl.currentTime=0; tryPlay(); });

window.addEventListener('pointerdown', function(){
  S.musicWanted = true;
  tryPlay();
}, {capture:true, passive:true});

document.addEventListener('visibilitychange', function(){
  if(document.hidden){ musicEl.pause(); }
  else{ tryPlay(); }
});

S.toggleMute = function(){
  S.muted = !S.muted;
  try{ localStorage.setItem('bs_muted', S.muted?'1':'0'); }catch(e){}
  if(S.muted){ musicEl.pause(); } else { S.musicWanted = true; tryPlay(); }
  if(S.buildUI) S.buildUI();
};

window.BSMusic = {
  el: musicEl,
  muted: function(){ return S.muted; },
  wanted: function(){ return S.musicWanted; }
};
})();
