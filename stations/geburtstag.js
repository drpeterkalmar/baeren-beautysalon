// stations/geburtstag.js — Geburtstag: Kuchen mit 3 Kerzen; antippen = ausblasen (Rauch) bzw. wieder anzünden.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'geburtstag',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Kerzen antippen: anzünden und wieder ausblasen! 🎂';
    if(!S.kuchen) S.kuchen = {kerzen:[{an:true},{an:true},{an:true}], rauch:[], feier:0};
    H.btn(30,100,190,56,'🕯️ Alle anzünden',function(){
      S.kuchen.kerzen.forEach(function(k){k.an=true;}); S.kuchen.feier=0; S.buildUI();
    });
    H.btn(30,166,190,56,'🎂 Neuer Kuchen',function(){
      S.kuchen={kerzen:[{an:true},{an:true},{an:true}],rauch:[],feier:0}; S.buildUI();
    });
  },
  update:function(dt,fr){ if(S.kuchen) updRauch(fr); },
  draw:function(g){ H.baer(g); drawKuchen(g); },
  tap:function(x,y){
    if(!S.kuchen) return false;
    // Kerzen antippen
    var kp=kerzenPos();
    for(var ci=0; ci<3; ci++){
      var kx2=kp.kerzen[ci][0], ky2=kp.kerzen[ci][1];
      if(x>=kx2-16&&x<=kx2+16&&y>=ky2-30&&y<=ky2+56){
        var ker=S.kuchen.kerzen[ci];
        if(ker.an){ // ausblasen: Rauchwölkchen
          ker.an=false;
          for(var rm=0; rm<3; rm++) S.kuchen.rauch.push({x:kx2+(rm-1)*6, y:ky2-14, t:rm*-8});
          if(S.kuchen.kerzen.every(function(z){return !z.an;})){
            S.kuchen.feier=1;
            window.BSGame && window.BSGame.konfettiBurst(S.VW/2, 170);
          }
          S.buildUI();
        } else { ker.an=true; S.kuchen.feier=0; S.buildUI(); }
        return true;
      }
    }
    return true;
  }
});

// Geburtstag: Kuchen mit 3 Kerzen + Flamme/Rauch/Konfetti; kerzenPos = Lage von Kuchen und Kerzen
function kerzenPos(){
  // 3 Kerzen auf dem Kuchen vor dem Bären (rechts unten)
  var cx=S.VW*0.5+200, cy=S.VH*0.58+150;
  var out=[];
  for(var i=0;i<3;i++) out.push([cx-38+i*38, cy-96]);
  return {kx:cx, ky:cy, kerzen:out};
}

function drawKuchen(g){
  if(!S.kuchen) return;
  var kp=kerzenPos(), t=performance.now()/1000;
  var cx=kp.kx, cy=kp.ky;
  // Tisch
  g.fillStyle='#c49a6c'; g.fillRect(cx-110,cy+34,220,14);
  // Kuchen: 2 Stöcke + Deko
  g.fillStyle='#f6d8b0'; g.fillRect(cx-86,cy-6,172,44);
  g.fillStyle='#ff9eb5'; g.fillRect(cx-86,cy-14,172,12);
  g.fillStyle='#f2c490'; g.fillRect(cx-70,cy-48,140,40);
  g.fillStyle='#ff9eb5'; g.fillRect(cx-70,cy-56,140,12);
  // Streusel
  var cols=['#e91e63','#f4c20d','#3498db','#2ecc71','#9b59b6'];
  for(var i=0;i<14;i++){
    g.fillStyle=cols[i%5];
    g.fillRect(cx-78+i*12, cy-12+((i*7)%8), 6, 3);
  }
  // Kerzen
  for(var k=0;k<3;k++){
    var px=kp.kerzen[k][0], py=kp.kerzen[k][1];
    // Kerzenkörper (gestreift)
    g.fillStyle='#fff'; g.fillRect(px-6,py,12,52);
    g.fillStyle=cols[k*2]; 
    for(var s2=0;s2<3;s2++) g.fillRect(px-6,py+6+s2*16,12,6);
    g.strokeStyle='rgba(0,0,0,0.12)'; g.lineWidth=1.5; g.strokeRect(px-6,py,12,52);
    // Docht
    g.strokeStyle='#5a4637'; g.lineWidth=2;
    g.beginPath(); g.moveTo(px,py); g.lineTo(px,py-7); g.stroke();
    var kerze=S.kuchen.kerzen[k];
    if(kerze.an){
      // Flamme (flackernd)
      var fl=Math.sin(t*13+k*2.4)*2.4 + Math.sin(t*7.3+k)*1.6;
      var fy=py-9;
      g.save();
      g.globalAlpha=0.9;
      H.ell2(g,px+fl*0.4,fy-8,7+Math.sin(t*11+k)*1.4,12+Math.cos(t*9+k)*1.8,'rgba(255,196,64,0.95)');
      H.ell2(g,px+fl*0.2,fy-7,4,7,'rgba(255,240,170,0.95)');
      H.circle2(g,px,fy-4,2.4,'#fff');
      g.restore();
      // Halo
      g.globalAlpha=0.18; H.circle2(g,px,fy-6,26,'#ffcf63'); g.globalAlpha=1;
    }
  }
  // Rauchwölkchen für gelöschte Kerzen (Bewegung in updRauch)
  var rb=S.kuchen._rauchBild||S.kuchen.rauch;
  for(var r2=rb.length-1;r2>=0;r2--){
    var rp=rb[r2];
    var ra=Math.max(0, 1-rp.t/60);
    g.globalAlpha=ra*0.6;
    g.fillStyle='#cfd6de';
    var wob2=Math.sin(rp.t*0.13)*12;
    H.circle2(g,rp.x+wob2*0.2, rp.y-rp.t*1.6, 6+rp.t*0.16, '#cfd6de');
    H.circle2(g,rp.x+8+wob2*0.3, rp.y-rp.t*1.6-8, 4+rp.t*0.12, '#dfe5ec');
  }
  g.globalAlpha=1;
  // Feier-Text, wenn alle aus
  if(S.kuchen.feier>0){
    g.textAlign='center';
    var pul=1+0.12*Math.sin(t*6);
    g.save();
    g.translate(S.VW/2,150); g.scale(pul,pul);
    g.font='bold 44px sans-serif';
    g.lineWidth=7; g.strokeStyle='#fff';
    g.strokeText('🎉 Alles Gute! 🎂',0,0);
    g.fillStyle='#7a4b8f'; g.fillText('🎉 Alles Gute! 🎂',0,0);
    g.restore();
  }
}

// Rauch (aus update): rp.t zählt 60-Hz-Bilder (× fr), nach 60 Bildern (1 s) weg;
// Zeichenliste _rauchBild zeigt das letzte Bild wie früher noch (Alpha dort 0).
function updRauch(fr){
  var R=S.kuchen.rauch;
  for(var i=R.length-1;i>=0;i--) R[i].t+=fr;
  S.kuchen._rauchBild=R.slice();
  for(i=R.length-1;i>=0;i--) if(R[i].t>60) R.splice(i,1);
}
})();
