// stations/zirkus.js — Zirkus: Ball-Farbe antippen = ein Ball mehr (max. 3), der Bär jongliert.
// drawJonglage legt S.zirkus._pos/_r an (Ballpositionen dieses Bildes; tools/visual-check.mjs --only=r19 misst daran).
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;
// r19: Bälle starten/landen IN den echten Pfoten (Art.drawBear → baer._paws), Scheitel ≈ Kopfhöhe.
// L→R hoch (Kopf oben), R→L flacher (Augenhöhe): die Bahnen treffen sich nur in den Pfoten, 2–3 Bälle berühren sich nie
// (simuliert: Mindestabstand ≥ 55 Welt-Einheiten bei Ø 46).
var BALL_R=23;      // Ball-Radius (war 17, +35 %)
var JONG_T=1.7;     // Sekunden pro Ball-Runde (L→R fliegen, halten, R→L fliegen, halten)

S.registerStation({
  id:'zirkus',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Ball-Farbe antippen = ein Ball mehr zum Jonglieren (max. 3)! 🎪';
    if(!S.zirkus) S.zirkus = {bälle:[{c:'#e74c3c'}], t:0};
    ['#e74c3c','#f4c20d','#3498db','#2ecc71','#9b59b6'].forEach(function(c,i){
      H.btn(30+i*66, 100, 58, 58, '', function(){
        var z=S.zirkus;
        if(z.bälle.length>=3) return;
        z.bälle.push({c:c}); S.buildUI();
      },{fill:c});
    });
    H.btn(30, 170, 190, 52, '🧽 Neue Bälle', function(){ S.zirkus.bälle=[{c:'#e74c3c'}]; S.buildUI(); });
  },
  draw:function(g){ H.baer(g); if(S.zirkus) drawJonglage(g); },
  tap:function(){ return false; }
});

function drawJonglage(g){
  var z=S.zirkus, bälle=z.bälle, n=bälle.length, b=S.baer, geo=b._geo;
  var t=performance.now()/1000, R=BALL_R, k=R/17;
  var s=geo?geo.s:Math.min(S.VW,S.VH)/420, cy=geo?geo.cy:S.VH*0.58;
  var pw=b._paws||[[S.VW*0.5-160*s,cy+45*s],[S.VW*0.5+160*s,cy+45*s]];
  var hand=[[pw[0][0],pw[0][1]-R*0.5],[pw[1][0],pw[1][1]-R*0.5]]; // Ball liegt in der Pfote
  var apex=[cy-160*s, cy-100*s]; // Kopf oben ≈ cy-172s, Augen ≈ cy-98s
  var FL=0.42, DW=0.08;
  z._pos=[]; z._r=R;
  for(var i=0;i<n;i++){
    var ph=(t/JONG_T+i/n)%1, lr=ph<0.5, q=lr?ph:ph-0.5, P0=hand[lr?0:1], P1=hand[lr?1:0], x, y;
    if(q<FL){ // Flug
      var u=q/FL, h=Math.max(0,Math.min(P0[1],P1[1])-apex[lr?0:1]);
      x=P0[0]+(P1[0]-P0[0])*u; y=P0[1]+(P1[1]-P0[1])*u-4*h*u*(1-u);
    } else { // Halten: kurz in die Pfote plumpsen
      x=P1[0]; y=P1[1]+Math.sin((q-FL)/DW*Math.PI)*8*s;
    }
    z._pos.push([x,y]);
    g.fillStyle=bälle[i].c; g.beginPath(); g.arc(x,y,R,0,Math.PI*2); g.fill();
    g.strokeStyle='rgba(0,0,0,0.25)'; g.lineWidth=2*k; g.stroke();
    g.fillStyle='rgba(255,255,255,0.65)';
    g.beginPath(); g.arc(x-5*k,y-6*k,5*k,0,Math.PI*2); g.fill();
  }
}
})();
