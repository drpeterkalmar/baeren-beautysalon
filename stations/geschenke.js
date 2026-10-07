// stations/geschenke.js — Geschenke: Paket antippen = schütteln, nochmal = aufmachen (Überraschungs-Puff), dann neues Paket.
// Die Paket-Hit-Box kommt aus hit().paket (feste Lage neben dem Bären), nicht mehr aus S._pakHit beim Zeichnen.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;
var GESCHENK_INHALT = ['konfetti','herz','stern','blume','regenbogen'];
Art.PAKET_FARBEN = ['#e91e63','#3498db','#f4c20d','#2ecc71','#9b59b6'];

S.registerStation({
  id:'geschenke',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Paket antippen = schütteln, nochmal = aufmachen! Was ist drin? 🎁';
    if(!S.geschenk) S.geschenk = {idx:0, offen:false, schuettel:0, strahl:0};
  },
  draw:function(g){ drawGeschenke(g); },
  hit:function(){ return {paket:paketBox()}; },
  tap:function(x,y){
    if(!S.geschenk) return false;
    // Paket antippen: schütteln → Deckel fliegt mit Überraschungs-Puff; danach neues Paket
    var gpak=paketBox();
    if(x>=gpak.x&&x<=gpak.x+gpak.w&&y>=gpak.y&&y<=gpak.y+gpak.h){
      var ge=S.geschenk;
      if(ge.offen){
        // erneut antippen = neues Paket
        ge.offen=false; ge.schuettel=0; ge.idx=(ge.idx+1)%5;
        window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(gpak.x+gpak.w/2,gpak.y+gpak.h/2);
        return true;
      }
      if(ge.schuettel<=0){
        ge.schuettel=0.8; // erst schütteln
      } else {
        ge.offen=true; ge.schuettel=0;
        geschenkPuff(ge.idx);
      }
      return true;
    }
    return true;
  }
});

// Paket rechts neben dem Bären; Hit-Box großzügig (auch beim Schütteln)
function paketBox(){ var p=gesPos(); return {x:p.x-80,y:p.y-80,w:170,h:170}; }
function drawGeschenke(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var ge=S.geschenk; if(!ge) return;
  // Bär strahlt beim Öffnen
  var strahlAlt=S.baer.jubel;
  if(ge.offen|| (S.baer.jubelT2||0)>0) S.baer.jubel=Math.max(S.baer.jubel||0, Math.min(1,(S.baer.jubelT2||0))/1.2);
  Art.drawBear(g,S.baer,{w:S.VW,h:S.VH, spaTarget:S.spaTarget});
  S.baer.jubel=strahlAlt;
  // aktives Paket neben dem Bären (schüttelt sich)
  var p=gesPos();
  var wob = ge.schuettel>0 ? Math.sin(t*22)*10*ge.schuettel : 0;
  g.save(); g.translate(p.x+wob,p.y); g.rotate(wob*0.01);
  drawPaket(g,0,0,120,ge.offen,ge.idx,t);
  g.restore();
  // Regenbogen-Aura bei Regenbogen-Inhalt
  if(ge.offen && GESCHENK_INHALT[ge.idx%5]==='regenbogen')
    drawRegenbogen(g,p.x,p.y+30,90);
  // Schleifen-Regen Deko oben
  for(var d=0;d<5;d++){
    var dy2=(t*24+d*97)%(S.VH*0.5);
    Art.drawSticker(g,d%2?'herz':'stern',60+d*170,dy2+40,7,'rgba(154,107,181,0.5)');
  }
}

function drawPaket(g,x,y,w2,offen,idx,t){
  var s=w2/100;
  // Körper
  g.fillStyle=Art.PAKET_FARBEN[idx%Art.PAKET_FARBEN.length];
  g.fillRect(x-w2*0.5,y-w2*0.32,w2,w2*0.72);
  g.strokeStyle='rgba(0,0,0,0.22)'; g.lineWidth=3*s*3; g.strokeRect(x-w2*0.5,y-w2*0.32,w2,w2*0.72);
  // Band
  g.fillStyle='rgba(255,255,255,0.9)';
  g.fillRect(x-w2*0.09,y-w2*0.32,w2*0.18,w2*0.72);
  g.fillRect(x-w2*0.5,y-w2*0.05,w2,w2*0.14);
  if(!offen){
    // Deckel
    g.fillStyle=Art.shade(Art.PAKET_FARBEN[idx%5],-28);
    g.fillRect(x-w2*0.56,y-w2*0.5,w2*1.12,w2*0.2);
    g.strokeRect(x-w2*0.56,y-w2*0.5,w2*1.12,w2*0.2);
    // Schleife
    g.fillStyle='#fff';
    g.beginPath(); g.moveTo(x,y-w2*0.5); g.lineTo(x-w2*0.3,y-w2*0.72); g.lineTo(x-w2*0.3,y-w2*0.5); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x,y-w2*0.5); g.lineTo(x+w2*0.3,y-w2*0.72); g.lineTo(x+w2*0.3,y-w2*0.5); g.closePath(); g.fill();
    H.circle2(g,x,y-w2*0.5,w2*0.12,'#ffe9f2');
  } else {
    // offen: Deckel liegt fliegend daneben, dunkler Innenraum glitzert
    g.fillStyle='rgba(40,20,60,0.85)';
    g.fillRect(x-w2*0.5,y-w2*0.32,w2,w2*0.16);
    for(var s2=0;s2<3;s2++)
      Art.drawSticker(g,'stern',x-w2*0.3+s2*w2*0.3,y-w2*0.26,(7+2*Math.sin(t*6+s2*2))*s*0.5,'#ffd24d');
    var dy=-w2*(0.55+0.12*Math.sin(t*3));
    drawPaketDeckel(g,x+w2*0.55,y+dy,w2*0.9,t);
  }
}

function drawPaketDeckel(g,x,y,w2,t){
  g.save(); g.translate(x,y); g.rotate(0.5+Math.sin(t*4)*0.12);
  g.fillStyle=Art.shade(Art.PAKET_FARBEN[S.geschenk.idx%5]||'#e91e63',-28);
  g.fillRect(-w2*0.56,-w2*0.1,w2*1.12,w2*0.2);
  g.strokeStyle='rgba(0,0,0,0.2)'; g.lineWidth=6; g.strokeRect(-w2*0.56,-w2*0.1,w2*1.12,w2*0.2);
  g.restore();
}

function drawRegenbogen(g,cx,cy,R){
  var cols=['#ff7a7a','#ffbe60','#ffe86e','#8fd48a','#7ab8f5','#c39bd3'];
  g.save(); g.lineCap='round';
  for(var i=0;i<cols.length;i++){
    g.strokeStyle=cols[i]; g.globalAlpha=0.85; g.lineWidth=11;
    g.beginPath(); g.arc(cx,cy,R-i*11,Math.PI,Math.PI*2); g.stroke();
  }
  g.globalAlpha=1;
  // Wölkchen an den Enden
  [-1,1].forEach(function(sgn){
    var wx=cx+sgn*R, wy=cy;
    g.fillStyle='rgba(255,255,255,0.9)';
    g.beginPath(); g.arc(wx,wy,20,0,Math.PI*2); g.fill();
    g.beginPath(); g.arc(wx-16,wy+5,14,0,Math.PI*2); g.fill();
    g.beginPath(); g.arc(wx+16,wy+5,14,0,Math.PI*2); g.fill();
  });
  g.restore();
}

function geschenkPuff(idx){
  var gx=S.VW*0.5+230, gy=S.VH*0.58+40;
  var p=gesPos(); gx=p.x; gy=p.y;
  var G2=window.BSGame; if(!G2) return;
  var typ=GESCHENK_INHALT[idx%5];
  if(typ==='konfetti') G2.konfettiBurst(gx,gy);
  else if(typ==='herz') G2.herzPuff(gx,gy);
  else if(typ==='stern') G2.sternExplosion(gx,gy);
  else if(typ==='blume') G2.blumenPuff(gx,gy);
  else G2.regenbogenPuff(gx,gy);
  if(S.baer) S.baer.jubelT2=Math.max(S.baer.jubelT2||0,1.6);
}

function gesPos(){
  return {x:S.VW*0.5+215, y:S.VH*0.58+60};
}
})();
