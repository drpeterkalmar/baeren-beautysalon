// stations/keks.js — Kekse: Teig ausrollen (Finger drüberziehen; game.js erhöht dabei keks.teig), Förmchen wählen,
// Teig antippen = ausstechen, backen, der Bär nascht (Backen/Naschen pro Bild noch in game.js update()).
// Die Teig-Hit-Box kommt aus hit().teig (aus keks.teig/stich), nicht mehr aus S._teigHit beim Zeichnen.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;
Art.KEKS_FOERMCHEN = ['stern','herz','baer'];

S.registerStation({
  id:'keks',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Streiche über den Teig zum Ausrollen, wähle ein Förmchen, tippe den Teig an — dann backen! 🍪';
    if(!S.keks) S.keks = {teig:0, form:null, stich:null, glow:0, biss:0, roll:[]};
    var kk=S.keks;
    var FN=[['⭐ Stern','stern'],['❤️ Herz','herz'],['🧸 Bär','baer']];
    FN.forEach(function(f,i){
      H.btn(30+i*150, 100, 140, 54, f[0], function(){ kk.form=f[1]; S.buildUI(); },
        {active:function(){return kk.form===f[1];}, small:1});
    });
    H.btn(30,168,150,58,'🔥 Backen!',function(){
      if(kk.stich && kk.glow<=0 && kk.biss<=0){ kk.glow=1.6; S.buildUI(); }
    },{active:function(){return kk.glow>0;}, big:1});
    H.btn(190,168,150,58,'🧽 Neuer Teig',function(){
      S.keks={teig:0,form:null,stich:null,glow:0,biss:0,roll:[]}; S.buildUI();
    });
  },
  draw:function(g){ drawKeks(g); },
  hit:function(){ return {teig:teigBox()}; },
  tap:function(x,y){
    if(!S.keks) return false;
    var kk=S.keks, s9=Math.min(S.VW,S.VH)/420;
    // Teig-Tap: mit gewähltem Förmchen ausstechen
    var th=teigBox();
    if(kk.form!==null && th && !kk.stich && kk.teig>0.6 &&
      x>=th.x&&x<=th.x+th.w&&y>=th.y&&y<=th.y+th.h){
      kk.stich={form:kk.form, gebacken:0};
      window.BSGame && window.BSGame.sternExplosion && window.BSGame.sternExplosion(th.x+th.w/2,th.y);
      S.buildUI();
      return true;
    }
    return true;
  }
});

// Teigbrett links vor dem Bären; der Teig wird beim Ausrollen flacher und breiter (flach 0,55 … 1)
var BX=0.28, BY=0.68, BW=250, BH=110;
function brett(){ return {x:S.VW*BX, y:S.VH*BY, w:BW, h:BH}; }
function teigFlach(kk){ return 0.55+kk.teig*0.45; }
function teigBox(){
  var kk=S.keks; if(!kk || kk.stich) return null;
  var b=brett(), flach=teigFlach(kk);
  return {x:b.x-b.w*0.45, y:b.y+b.h*0.5-b.h*0.75*flach, w:b.w*0.9, h:b.h*1.5*flach};
}
function drawKeks(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var kk=S.keks; if(!kk) return;
  // Backofen-Backwand rechts
  var ox=S.VW-270, oy=S.VH*0.42, ow=210, oh=170;
  g.fillStyle='#5a4a3a'; g.beginPath(); g.roundRect?g.roundRect(ox,oy,ow,oh,18):g.rect(ox,oy,ow,oh); g.fill();
  g.fillStyle='#3a2f24'; g.beginPath(); g.roundRect?g.roundRect(ox+18,oy+18,ow-36,oh-72,10):g.rect(ox+18,oy+18,ow-36,oh-72); g.fill();
  // Ofen-Glow wenn gebacken wird
  if(kk.glow>0){
    g.save(); g.globalAlpha=Math.min(1,kk.glow);
    var grd=g.createRadialGradient(ox+ow/2,oy+oh/2-24,8,ox+ow/2,oy+oh/2-24,110);
    grd.addColorStop(0,'#ffd24d'); grd.addColorStop(1,'rgba(255,120,40,0)');
    g.fillStyle=grd; g.fillRect(ox+18,oy+8,ow-36,oh-52);
    g.restore();
  }
  g.fillStyle='#c8a06a'; g.font='13px sans-serif'; g.textAlign='center';
  g.fillText('Ofen',ox+ow/2,oy+oh-18);
  // Bär
  Art.drawBear(g,S.baer,{w:S.VW,h:S.VH, spaTarget:S.spaTarget});
  // Teigbrett links-vor dem Bären
  var br=brett(), bx=br.x, by=br.y, bw=br.w, bh=br.h;
  g.fillStyle='#c49a6c'; g.beginPath(); g.roundRect?g.roundRect(bx-bw/2,by,bw,bh,16):g.rect(bx-bw/2,by,bw,bh); g.fill();
  g.strokeStyle='#8a6238'; g.lineWidth=3; g.strokeRect(bx-bw/2+6,by+6,bw-12,bh-12);
  var flach=teigFlach(kk);
  if(!kk.stich){
    g.save();
    g.translate(bx,by+bh*0.5); g.scale(1,flach);
    g.fillStyle='#f0d8a8';
    g.beginPath(); g.ellipse(0,0,bw*0.42,bh*0.7,0,0,Math.PI*2); g.fill();
    g.strokeStyle='#d9bd85'; g.lineWidth=2.5;
    g.beginPath(); g.ellipse(0,0,bw*0.42,bh*0.7,0,0,Math.PI*2); g.stroke();
    // Mehl-Sprenkel
    g.fillStyle='rgba(255,255,255,0.7)';
    for(var m=0;m<8;m++) H.circle2(g,-70+m*20-((m*37)%14),((m*53)%40)-20,2,'#fff');
    g.restore();
    if(kk.teig>0.6 && kk.form===null){
      g.fillStyle='#9c6bb5'; g.font='15px sans-serif';
      g.fillText('Teig ist glatt! Wähle ein Förmchen 👆',bx,by-16);
    }
  }
  // Ausgestochener Keks im Ofen: Farbe hell→goldbraun mit glow
  if(kk.stich){
    var kx6=ox+ow/2, ky6=oy+oh/2-26;
    var col=kk.glow>0.5?'#c98a3a':(kk.glow>0?'#dfae62':'#f0d8a8');
    g.fillStyle=col;
    if(kk.stich.form==='baer'){
      H.circle2(g,kx6,ky6,24,col); H.circle2(g,kx6-19,ky6-19,9,col); H.circle2(g,kx6+19,ky6-19,9,col);
    } else {
      Art.drawSticker(g,kk.stich.form,kx6,ky6,26,col);
    }
    // Schokotröpfchen
    H.circle2(g,kx6-8,ky6-4,3,'#6b4226'); H.circle2(g,kx6+7,ky6+6,3,'#6b4226'); H.circle2(g,kx6+2,ky6-10,2.5,'#6b4226');
    // Sichtbarer Biß: dunkler Hintergrund-Sektor frisst den Keks oben rechts weg
    if(kk.biss>0 || kk.glow===0){
      var bissA=Math.max(0,Math.min(1, kk.biss>0 ? (1.4-kk.biss)*2.5 : 1)); // wächst während des Kauens
      if(bissA>0.05){
        g.save();
        g.globalAlpha=bissA;
        g.fillStyle='#3a2f24'; // Ofen-Hintergrundfarbe = Biß-Loch
        g.beginPath(); g.arc(kx6+20,ky6-16,17,0,Math.PI*2); g.fill();
        g.beginPath(); g.arc(kx6+30,ky6-2,11,0,Math.PI*2); g.fill(); // zweiter Knabser
        // Krümel am Bißrand
        g.fillStyle='#c98a3a';
        H.circle2(g,kx6+8,ky6-4,2.2,'#c98a3a');
        H.circle2(g,kx6+2,ky6-12,2,'#c98a3a');
        H.circle2(g,kx6+13,ky6-14,1.6,'#6b4226');
        g.restore();
      }
    }
    // Dampf beim Naschen (nach glow)
    if(kk.biss>0){
      g.globalAlpha=Math.min(1,kk.biss);
      Art.drawSticker(g,'herz',kx6-30,ky6-50,9,'rgba(255,150,170,0.9)');
      Art.drawSticker(g,'herz',kx6+34,ky6-58,7,'rgba(255,150,170,0.8)');
      g.globalAlpha=1;
    }
  }
}
})();
