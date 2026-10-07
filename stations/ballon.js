// stations/ballon.js — Ballons: Farbe wählen, pusten bis er fertig ist, schwebenden Ballon antippen = PLATZ!
// Der Schwebe-Ballon (bl.schweb) entsteht in update statt im Zeichenpfad; die Hit-Box kommt aus hit().ballon.
// (Pust-/Schreck-Abbau pro Bild läuft noch in game.js update().)
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;
Art.BALLON_FARBEN = ['#e91e63','#f4c20d','#3498db','#2ecc71','#9b59b6'];

S.registerStation({
  id:'ballon',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Farbe wählen, Pusten-Knopf drücken — fertigen Ballon antippen = PLATZ! 🎈';
    if(!S.ballon) S.ballon = {farb:0, gr:0, pust:0, fertig:false, schweb:null, schreck:0};
    Art.BALLON_FARBEN.forEach(function(c,i){
      H.btn(30+i*66, 100, 58, 58, '', function(){
        S.ballon.farb=i; S.ballon.gr=0; S.ballon.fertig=false; S.ballon.schreck=0; S.ballon.schweb=null; S.buildUI();
      },{fill:c, active:function(){return S.ballon.farb===i && !S.ballon.fertig && S.ballon.gr===0;}});
    });
    H.btn(30,170,190,64,'💨 Pusten!',function(){
      if(S.ballon.fertig) return;
      S.ballon.pust=1.4; S.ballon.gr=Math.min(1,S.ballon.gr+0.2);
      if(S.ballon.gr>=1) S.ballon.fertig=true;
      S.buildUI();
    },{active:function(){return S.ballon.pust>0;}, big:1});
    H.btn(30,246,190,52,'🧽 Neuer Ballon',function(){
      S.ballon={farb:S.ballon.farb,gr:0,pust:0,fertig:false,schweb:null,schreck:0}; S.buildUI();
    });
  },
  update:function(dt,fr){ var bl=S.ballon; if(bl && bl.fertig && bl.schweb===null){ var p=mundBallon(); bl.schweb={x:p.x,y:p.y,c:bl.farb,ph:Math.random()*6}; } },
  draw:function(g){
    // Erschreck-Zucken: Bär springt kurz hoch, dann lacht er (jubel hoch)
    var bl=S.ballon||{schreck:0};
    var shk=Math.max(0,bl.schreck||0);
    g.save();
    g.translate(0,-Math.sin(Math.min(1,shk)*Math.PI)*26);
    H.baer(g);
    g.restore();
    drawBallonStation(g);
  },
  hit:function(){ return {ballon:ballonBox()}; },
  tap:function(x,y){
    if(!S.ballon) return false;
    // Fertigen Ballon antippen = PLATZ!
    var bh=ballonBox();
    if(bh && S.ballon.fertig &&
      x>=bh.x&&x<=bh.x+bh.w&&y>=bh.y&&y<=bh.y+bh.h){
      var bl2=S.ballon;
      var mpx=bh.x+bh.w/2, mpy=bh.y+bh.h/2;
      window.BSGame && window.BSGame.konfettiBurst(mpx, mpy);
      window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(mpx,mpy);
      var cAlt=bl2.farb;
      bl2.schweb=null; bl2.fertig=false; bl2.gr=0; bl2.schreck=1; // Bär zuckt
      // danach schwebt automatisch ein neuer Ballon in anderer Farbe neben den Bären
      setTimeout(function(){
        if(S.state==='ballon' && S.ballon && !S.ballon.fertig && S.ballon.gr===0){
          S.ballon.farb=(cAlt+1)%Art.BALLON_FARBEN.length;
          S.ballon.gr=1; S.ballon.fertig=true; S.ballon.schweb=null; S.buildUI();
        }
      },2600);
      S.buildUI();
      return true;
    }
    return true;
  }
});

// Ballon am Mund: Lage und Radius (wächst mit bl.gr)
function mundBallon(){
  var s=Math.min(S.VW,S.VH)/420, cx=S.VW*0.5, cy=S.VH*0.58, bl=S.ballon;
  return {x:cx+210*s, y:cy-150*s, r:(14+(bl?bl.gr:0)*54)*s};
}
// Schwebe-Ballon wippt mit der Uhr (gleiche Formel wie beim Zeichnen)
function schwebePos(sw){ var t=performance.now()/1000; return {x:sw.x+Math.sin(t*1.1+sw.ph)*10, y:sw.y+Math.sin(t*1.7+sw.ph)*16}; }
// Hit-Box: fertig + schwebend → großzügig um den Schwebe-Ballon (QA-Fix), wachsend → um den Ballon am Mund, sonst keine
function ballonBox(){
  var bl=S.ballon; if(!bl) return null;
  var m=mundBallon(), br=m.r;
  if(bl.fertig && bl.schweb){ var p=schwebePos(bl.schweb); return {x:p.x-br-26,y:p.y-br*1.05-26,w:br*2+52,h:br*2.2+52}; }
  if(!bl.fertig && bl.gr>0) return {x:m.x-br*0.3-br,y:m.y-br,w:br*2,h:br*2};
  return null;
}
// Ballon-Station: Farbe + Pusten + PLATZ + schwebender Ballon + Mini-Herzen
function drawBallonStation(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var bl=S.ballon; if(!bl) return;
  var cx=S.VW*0.5, cy=S.VH*0.58;
  // schwebende Mini-Herzchen als Deko
  for(var h=0;h<8;h++){
    var hx=(h*113+Math.sin(t*0.6+h)*40)%S.VW, hy2=90+((h*89)%260)+Math.sin(t*1.4+h*2.2)*14;
    g.globalAlpha=0.4+0.3*Math.sin(t*2+h*1.3);
    Art.drawSticker(g,'herz',hx,hy2,7+2*Math.sin(t*3+h),'#ff8fb3');
  }
  g.globalAlpha=1;
  // Pust-Wangen (rund) während der Pust-Animation
  if(bl.pust>0){
    g.globalAlpha=Math.min(1,bl.pust);
    H.circle2(g,cx-56*s,cy-52*s,20*s,'rgba(255,160,180,0.75)');
    H.circle2(g,cx+56*s,cy-52*s,20*s,'rgba(255,160,180,0.75)');
    g.globalAlpha=1;
  }
  // Luft-Strahl vom Mund zum Ballon beim Pusten
  var mb=mundBallon(), bx=mb.x, by=mb.y, br=mb.r;
  if(bl.pust>0 && !bl.fertig){
    g.strokeStyle='rgba(160,220,255,0.6)'; g.lineWidth=4; g.lineCap='round';
    for(var l=-1;l<=1;l++){
      g.beginPath(); g.moveTo(cx+30*s,cy-14*s+l*5);
      g.quadraticCurveTo(cx+120*s,cy-60*s+l*20, bx-br*0.6, by+l*10); g.stroke();
    }
  }
  // Ballon am Mund wächst (noch nicht fertig), sonst schwebt er neben dem Bären
  if(!bl.fertig && bl.gr>0){
    g.fillStyle=Art.BALLON_FARBEN[bl.farb];
    g.beginPath(); g.ellipse(bx-br*0.3,by,br*0.8,br,0,0,Math.PI*2); g.fill();
    g.fillStyle='rgba(255,255,255,0.5)';
    g.beginPath(); g.ellipse(bx-br*0.3-br*0.25,by-br*0.3,br*0.22,br*0.3,0,0,Math.PI*2); g.fill();
  }
  if(bl.fertig && bl.schweb){
    var sw=bl.schweb;
    var sp=schwebePos(sw), sx2=sp.x, sy2=sp.y;
    // Schnur
    g.strokeStyle='rgba(120,120,140,0.7)'; g.lineWidth=2;
    g.beginPath(); g.moveTo(cx+86*s,cy-40*s); g.quadraticCurveTo(sx2-20,sy2+80,sx2,sy2+br+4); g.stroke();
    g.fillStyle=Art.BALLON_FARBEN[sw.c];
    g.beginPath(); g.ellipse(sx2,sy2,br*0.85,br*1.05,0,0,Math.PI*2); g.fill();
    g.fillStyle='rgba(255,255,255,0.5)';
    g.beginPath(); g.ellipse(sx2-br*0.28,sy2-br*0.35,br*0.2,br*0.28,0,0,Math.PI*2); g.fill();
    // Zipfel
    g.fillStyle=Art.shade(Art.BALLON_FARBEN[sw.c],-40);
    g.beginPath(); g.moveTo(sx2-6,sy2+br*1.05); g.lineTo(sx2+6,sy2+br*1.05); g.lineTo(sx2,sy2+br*1.05+10); g.closePath(); g.fill();
    // Hinweis-Platzer-Stern pulsierend groß
    Art.drawSticker(g,'stern',sx2+br*0.9,sy2-br*1.1,12+4*Math.sin(t*5),'rgba(255,230,120,0.95)');
    g.font='bold 15px sans-serif'; g.textAlign='center'; g.fillStyle='#7a4b8f';
    g.fillText('Antippen = PLATZ!',sx2,sy2+br*1.5+30);
  }
}
})();
