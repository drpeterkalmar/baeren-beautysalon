// stations/zauber.js — Zauber: Zauber wählen, Zauberstab (oder Bereich daneben) antippen → Sternenschweif,
// Blütenregen oder Herz-Kreis. Die Stab-Hit-Box kommt aus hit() (aus Zustand + Uhr), nicht mehr aus dem Zeichnen.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'zauber',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Zauber wählen, dann den Zauberstab antippen! 🌈✨';
    if(!S.zauber) S.zauber = {art:0, fx:null, pfote:0};
    [['⭐ Sternenschweif'],['🌸 Blütenregen'],['❤️ Herz-Kreis']].forEach(function(d,i){
      H.btn(30+i*200, 100, 190, 60, d[0], function(){
        S.zauber.art=i; S.buildUI();
      },{active:function(){return S.zauber.art===i;}, small:1});
    });
  },
  update:function(dt,fr){ if(S.zauber) updZauber(fr); },
  draw:function(g){
    if(!S.zauber){ H.baer(g); return; }
    // Pfoten heben beim Zaubern: kurz jubel-Anteil
    var zb=S.zauber;
    if(S.baer._j===undefined) S.baer._j=0;
    var jAlt=S.baer.jubel; S.baer.jubel=Math.max(jAlt,Math.min(1,zb.pfote||0)*0.7);
    H.baer(g);
    S.baer.jubel=jAlt;
    drawZauberStation(g);
  },
  hit:function(){ return {zauberstab:stabBox()}; },
  tap:function(x,y){
    if(!S.zauber) return false;
    // Zauberstab antippen = Zauberspruch
    var st=stabBox();
    if(x>=st.x&&x<=st.x+st.w&&y>=st.y&&y<=st.y+st.h){
      S.zauber.fx={art:S.zauber.art, t:0.001, d:1.6, seed:Math.random()*6};
      S.zauber.pfote=1;
      window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(S.VW*0.5+128*Math.min(S.VW,S.VH)/420, S.VH*0.58-140);
      S.buildUI();
      return true;
    }
    // Auch Tap aufs obere Drittel neben dem Bären zaubert (Kinder-tolerant)
    var s6=Math.min(S.VW,S.VH)/420;
    if(Math.hypot(x-(S.VW*0.5+128*s6), y-(S.VH*0.58-60*s6))<120*s6){
      S.zauber.fx={art:S.zauber.art, t:0.001, d:1.6, seed:Math.random()*6};
      S.zauber.pfote=1; S.buildUI();
      return true;
    }
    return true;
  }
});

// Zauberstab in der rechten Pfote, schwebt leicht (Lage hängt an der Uhr wie beim Zeichnen)
function stabPos(){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  return {x:S.VW*0.5+128*s, y:S.VH*0.58-30*s+Math.sin(t*1.5)*4, s:s};
}
function stabBox(){ var p=stabPos(), s=p.s; return {x:p.x-30*s, y:p.y-130*s, w:60*s, h:150*s}; }
// Zauber-Station: Stab + 3 Zauber + mystischer Boden-Nebel
function drawZauberStation(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var zb=S.zauber; if(!zb) return;
  var cx=S.VW*0.5, cy=S.VH*0.58;
  // Mystischer Nebel: langsam wandernde halbtransparente Wölkchen am Boden
  for(var n=0;n<7;n++){
    var nx=((t*14+n*173)%(S.VW+220))-110, ny=S.VH*0.72+((n*53)%110)+Math.sin(t*0.8+n)*10;
    g.globalAlpha=0.16+0.08*Math.sin(t*0.7+n*1.9);
    var nc=n%2?'#c39bd3':'#9fb8d8';
    H.circle2(g,nx,ny,34+n*4,nc);
    H.circle2(g,nx+26,ny+5,24+n*3,nc);
    H.circle2(g,nx-26,ny+6,22+n*2,nc);
  }
  g.globalAlpha=1;
  // Zauberstab in der rechten Pfote, leicht schwebend, funkelt idle
  var sp=stabPos(), stx=sp.x, sty=sp.y;
  g.save();
  g.translate(stx,sty); g.rotate(-0.5);
  g.strokeStyle='#8a5a2a'; g.lineWidth=6*s; g.lineCap='round';
  g.beginPath(); g.moveTo(0,0); g.lineTo(0,-86*s); g.stroke();
  var tw=0.6+0.4*Math.sin(t*4.5);
  Art.drawSticker(g,'stern',0,-98*s,(14+5*tw)*s,'#ffd24d');
  Fx.GL.glow(g,0,-98*s,(30+8*tw)*s,'#ffd98a',0.7*tw);          // r21: Schein im Endbild (leer ohne post.js)
  g.globalAlpha=tw*0.6;
  H.circle2(g,0,-98*s,(26+6*Math.sin(t*4.5))*s,'rgba(255,220,120,0.5)');
  g.globalAlpha=1;
  g.restore();
  // Zauberspruch-Effekte (Partikel je Zauber)
  if(zb.fx){
    var f=zb.fx, q=f.t/f.d, oaZ=g.globalAlpha;
    if(q>=1){ /* vorbei – updZauber räumt ab */ }
    else if(f.art===0){ // Sternenschweif: goldene Sterne kreisen aufwärts
      for(var i2=0;i2<14;i2++){
        var a2=f.seed+i2*0.45+q*5;
        var rr2=(60+q*180)*s;
        g.globalAlpha=oaZ*(1-q); // Alpha über globalAlpha statt pro Bild neuer Farbstring (Farb-Cache)
        var zx=cx+Math.cos(a2)*rr2, zy=cy-40*s+Math.sin(a2)*rr2*0.5-q*90*s;
        Art.drawSticker(g,'stern',zx,zy,(9+3*Math.sin(q*9+i2))*s,'#ffd24d');
        Fx.GL.glow(g,zx,zy,22*s,'#ffd98a',0.6*(1-q));
      }
    } else if(f.art===1){ // Blütenregen: Rosa Blumen fallen von oben
      for(var b2=0;b2<16;b2++){
        var bx2=(b2*67 + f.seed*40)%S.VW;
        var by2=-20+q*S.VH*0.8+((b2*29)%40);
        g.globalAlpha=oaZ*(1-q*0.6);
        Art.drawSticker(g,'blume',bx2+Math.sin(t*2+b2)*16,by2,9*s,'#ff9eb5');
      }
    } else { // Herz-Kreis: Herzen im Kreis um den Bären
      for(var h2=0;h2<12;h2++){
        var ah=h2/12*Math.PI*2+q*3+f.seed;
        g.globalAlpha=oaZ*(1-q);
        Art.drawSticker(g,'herz',cx+Math.cos(ah)*150*s,cy+Math.sin(ah)*110*s-40*s,
          (10+4*Math.sin(q*8+h2))*s,'#e91e63');
      }
    }
    g.globalAlpha=oaZ;
  }
}

// Zauberspruch-Uhr (aus update): das erste Bild zeigt den Startwert, danach +0,016 pro 60-Hz-Bild
// (wie früher: erst zeichnen, dann weiterzählen) → Dauer 1,6/0,016 Bilder ≈ 1,67 s, bei jeder Bildrate.
function updZauber(fr){
  var f=S.zauber.fx; if(!f) return;
  if(f.lauf) f.t+=0.016*fr;
  f.lauf=1;
  if(f.t/f.d>=1) S.zauber.fx=null;
}
})();
