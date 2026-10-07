// stations/tanz.js — Tanz: Musikstil wählen, der Bär tanzt (Disco hüpfen, Klassik wiegen, Rock nicken),
// Antippen = Pirouette; bunte Noten steigen auf (Simulation in update, bildraten-unabhängig).
// (Abbau der Pirouette S.tanz.spin läuft weiter in game.js update(), auch außerhalb der Station.)
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt;

S.registerStation({
  id:'tanz',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Musikstil wählen und mit dem Bären tanzen! Antippen = Pirouette! 🎵';
    if(!S.tanz) S.tanz = {stil:'disco', noten:[], spin:0};
    [['disco','🕺 Disco'],['klassik','🎻 Klassik'],['rock','🎸 Rock']].forEach(function(d,i){
      H.btn(30+i*160, 100, 150, 60, d[1], function(){
        S.tanz.stil=d[0]; S.buildUI();
      },{active:function(){return S.tanz.stil===d[0];}, small:1});
    });
  },
  update:function(dt,fr){
    var T=S.tanz; if(!T) return;
    updNoten(fr);
    // Pirouette: Wipp-Rotation 0→π→0 über spin 1→0 (abgeleitet fürs Zeichnen)
    T.spinA = T.spin>0 ? Math.sin((1-T.spin)*Math.PI)*6.2 : 0;
  },
  draw:function(g){
    if(!S.tanz){ H.baer(g); return; }
    // Bär wippt/wiegt/nickt je nach Stil; Pirouette bei spin
    var W=S.VW, H2=S.VH, tNow=performance.now()/1000;
    var tOffY=0, tRot=0, tStretch=1;
    var stil=S.tanz.stil||'disco';
    if(stil==='disco'){ // auf-und-ab hüpfen
      tOffY=-Math.abs(Math.sin(tNow*4.4))*34;
      tRot=Math.sin(tNow*4.4)*0.09;
    } else if(stil==='klassik'){ // sanft wiegend
      tRot=Math.sin(tNow*1.8)*0.22;
      tOffY=Math.sin(tNow*3.6)*8;
    } else { // rock: Kopf-Nicken (Vorbeugen)
      tStretch=1-Math.abs(Math.sin(tNow*5.2))*0.10;
      tOffY=Math.abs(Math.sin(tNow*5.2))*14;
    }
    tRot += (S.tanz.spinA||0);
    g.save();
    g.translate(W/2, S.VH*0.58+150*Math.min(W,H2)/420);
    g.rotate(tRot); g.scale(1,tStretch);
    g.translate(-W/2, -(S.VH*0.58+150*Math.min(W,H2)/420)-tOffY);
    H.baer(g);
    g.restore();
    // bunte Noten steigen auf
    drawNoten(g);
  },
  tap:function(x,y){
    if(!S.tanz) return false;
    // Antippen des Bären: Pirouette (Spin)
    var s4=Math.min(S.VW,S.VH)/420;
    var bx=S.VW*0.5, byc=S.VH*0.58;
    if(Math.hypot(x-bx,y-byc)<160*s4) S.tanz.spin=1;
    return true;
  }
});

function drawNoten(g){
  var nb=S.tanz._notenBild||S.tanz.noten; // Bewegung in updNoten
  for(var i=nb.length-1;i>=0;i--){
    var n=nb[i];
    var a=Math.min(1,(S.VH*0.72-n.y)/80)-Math.max(0, (S.VH*0.16-n.y)/90);
    g.globalAlpha=Math.max(0,Math.min(1,a));
    g.font=(20+Math.sin(n.t*0.12)*4)+'px sans-serif'; g.textAlign='center';
    g.fillStyle=n.c; g.fillText(n.ic, n.x, n.y);
  }
  g.globalAlpha=1;
}
// Noten: alle 0,4 s eine neue (Uhrzeit wie bisher), Schritte pro 60-Hz-Bild × fr.
// Zeichenliste _notenBild: Noten, die oben ankommen, sind wie früher in ihrem letzten Bild noch zu sehen.
function updNoten(fr){
  var t=performance.now()/1000, T=S.tanz;
  if(!S._noteT) S._noteT=0;
  // neue Noten nachführen
  if(t>S._noteT){
    S._noteT=t+0.4;
    var cols=['#e91e63','#f4c20d','#3498db','#2ecc71','#9b59b6'];
    T.noten.push({x:S.VW*0.5+(Math.random()-0.5)*320, y:S.VH*0.72,
      w:(Math.random()-0.5)*30, c:cols[Math.floor(Math.random()*5)],
      ic:H.NICONS[Math.floor(Math.random()*4)], t:0});
    if(T.noten.length>14) T.noten.shift();
  }
  for(var i=T.noten.length-1;i>=0;i--){
    var n=T.noten[i]; n.t+=fr;
    n.y-=1.9*fr; n.x+=(Math.sin(n.t*0.1)*1.4+n.w*0.006)*fr;
  }
  T._notenBild=T.noten.slice();
  for(i=T.noten.length-1;i>=0;i--) if(T.noten[i].y<S.VH*0.1) T.noten.splice(i,1);
}
})();
