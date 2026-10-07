// stations/zuckerwatte.js — Zuckerwatte: Wolle antippen = spinnen, Watte-Stab festhalten und ziehen (game.js setzt beim
// Ziehen watte.sx/sy, solange S._stabDrag gilt), der Bär beißt ab (Spinnen/Abbeißen pro Bild noch in game.js update()).
// Stab- und Wolle-Hit-Box kommen aus hit() (aus dem Zustand), nicht mehr aus S._stabHit/_wolleHit beim Zeichnen.
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'zuckerwatte',
  build:function(){
    H.stationTabs();
    S.hinweis = 'Tippe die Wolle an zum Spinnen — halte den Watte-Stab fest und zieh ihn! 🍬';
    if(!S.watte) S.watte = {lvl:0, kau:0, sx:S.VW*0.5+150, sy:S.VH*0.58+120, spin:0};
    H.btn(30,100,190,58,'🍬 Wirbeln!',function(){ S.watte.spin=Math.min(1,(S.watte.spin||0)+0.45); },{active:function(){return S.watte.spin>0;}});
    H.btn(30,168,190,52,'🧽 Neue Watte',function(){ S.watte={lvl:0,kau:0,sx:S.VW*0.5+150,sy:S.VH*0.58+120,spin:0}; S.buildUI(); });
  },
  // Spinnen, Watte wächst, der Bär beißt ab (aus game.js update())
  frueh:function(dt){
    if(!S.watte) return;
    var b=S.baer;
    var wt=S.watte;
    wt.spin=Math.max(0,(wt.spin||0)-dt*0.25);
    if(wt.spin>0) wt.lvl=Math.min(1,(wt.lvl||0)+dt*wt.spin*0.30);
    if(wt._bissT===undefined) wt._bissT=4+Math.random()*3;
    wt._bissT-=dt;
    if(wt._bissT<0 && wt.lvl>0.15){ wt.lvl=Math.max(0.05,wt.lvl-0.22); wt.kau=1.4; wt._bissT=4+Math.random()*3.5; Art.react(b,'happy'); }
    if(wt.kau>0) wt.kau=Math.max(0,wt.kau-dt);
  },
  draw:function(g){ drawZuckerwatte(g); },
  hit:function(){ return watteHit(); },
  tap:function(x,y){
    if(!S.watte) return false;
    var wt2=S.watte, hb=watteHit(), st=hb.stab, wo=hb.wolle;
    // Watte-Stab antippen = Drag aktiv
    if(x>=st.x&&x<=st.x+st.w&&y>=st.y&&y<=st.y+st.h){
      S._stabDrag=true; return true;
    }
    // Zuckerwolle antippen = Spinnen starten
    if(x>=wo.x&&x<=wo.x+wo.w&&y>=wo.y&&y<=wo.y+wo.h){
      wt2.spin=Math.min(1,(wt2.spin||0)+0.45); return true;
    }
    return true;
  }
});

// Spinn-Maschine links (fest) und Watte-Stab (folgt watte.sx/sy, wächst mit watte.lvl)
function maschine(){ return {x:S.VW*0.5-170, y:S.VH*0.55+40}; }
function watteR(wt, s){ return (30+wt.lvl*60)*s*(wt.kau>0?1:1); }
function watteHit(){
  var s=Math.min(S.VW,S.VH)/420, m=maschine(), wt=S.watte, out={wolle:{x:m.x-70,y:m.y-10,w:140,h:110}};
  if(wt){ var wr=watteR(wt,s); out.stab={x:wt.sx-40*s, y:wt.sy-40*s-wr, w:80*s+wr*2*0, h:130*s+wr}; }
  return out;
}
// Zuckerwatte: Wolle-Tap spinnt, Stab per Drag, Bär beißt ab
function drawZuckerwatte(g){
  var t=performance.now()/1000, s=Math.min(S.VW,S.VH)/420;
  var wt=S.watte;
  // Hintergrund: Jahrmarkt-Bude
  g.fillStyle='#ffe9f0'; g.fillRect(0,0,S.VW,S.VH*0.66);
  g.fillStyle='#ffd1e0'; for(var st2=0;st2<9;st2++) g.fillRect(st2*112,0,56,S.VH*0.66);
  // schwebende Zuckerkrümel-Partikel
  for(var p=0;p<16;p++){
    var px=(p*167+Math.sin(t*0.7+p)*30)%S.VW, py=80+((p*131)%300)+Math.sin(t*1.3+p*2)*20;
    g.fillStyle=['#ff9eb5','#ffd24d','#c39bd3','#fff'][p%4];
    g.beginPath(); g.arc(px,py,2.5+Math.sin(t*3+p)*1.2,0,Math.PI*2); g.fill();
  }
  // Spinn-Maschine (Wolle im Topf)
  var mp=maschine(), mx=mp.x, my=mp.y;
  g.fillStyle='#8a97a5'; g.strokeStyle='#5a646e'; g.lineWidth=3;
  g.beginPath(); g.roundRect ? g.roundRect(mx-70,my,140,90,14) : g.rect(mx-70,my,140,90);
  g.fill(); g.stroke();
  g.fillStyle='#ff9ec4';
  g.beginPath(); g.ellipse(mx,my,66,26,0,0,Math.PI*2); g.fill();
  g.fillStyle='#ffb8d6';
  g.beginPath(); g.ellipse(mx,my-4,50,18,0,0,Math.PI*2); g.fill();
  if(wt.spin>0){ // Wirbel im Topf
    for(var w=0;w<5;w++){
      var wa=t*8*wt.spin+w*1.3;
      g.beginPath(); g.ellipse(mx+Math.cos(wa)*38,my-3+Math.sin(wa)*8,6,4,0,0,Math.PI*2); g.fill();
    }
  }
  // Zuckerwolle antippen
  g.fillStyle='#7a4b8f'; g.font='15px sans-serif'; g.textAlign='center';
  g.fillText('👆 Zuckerwolle',mx,my+108);
  // Bär groß
  Art.drawBear(g,S.baer,{w:S.VW,h:S.VH, spaTarget:S.spaTarget});
  // Watte-Stab (Bär hält ihn, Position vom User-Drag)
  var wx2=wt.sx, wy2=wt.sy;
  g.save();
  g.strokeStyle='#e8d5b0'; g.lineWidth=7*s; g.lineCap='round';
  g.beginPath(); g.moveTo(wx2,wy2+90*s); g.lineTo(wx2,wy2-40*s); g.stroke();
  // Watte: rosa Wolke wächst mit lvl
  var wr=watteR(wt,s);
  if(wr>4){
    var wob=1+0.06*Math.sin(t*6);
    g.globalAlpha=0.96;
    H.ell2(g,wx2,wy2-60*s,wr*0.9*wob,wr*0.75,'#ffb8d6');
    H.ell2(g,wx2-wr*0.35,wy2-58*s,wr*0.55,wr*0.5,'#ffc9e0');
    H.ell2(g,wx2+wr*0.35,wy2-66*s,wr*0.6,wr*0.52,'#ffc9e0');
    H.ell2(g,wx2,wy2-80*s,wr*0.5,wr*0.42,'#ff9ec4');
    g.globalAlpha=1;
    // glitzernde Zuckerpunkte in der Watte
    for(var zp=0;zp<8;zp++){
      var za=t*2+zp*0.8;
      var zx=wx2+Math.cos(za)*wr*0.5, zy=wy2-62*s+Math.sin(za*1.3)*wr*0.35;
      g.globalAlpha=0.5+0.5*Math.sin(t*5+zp);
      H.circle2(g,zx,zy,2.5*s,'#fff');
    }
    g.globalAlpha=1;
  }
  // glückliches Kaugesicht: Bär mit hochgezogenen Wangen, wenn kau>0
  if(wt.kau>0){
    var kc=S.VW*0.5, kcy2=S.VH*0.58-15*s;
    g.globalAlpha=Math.min(1,wt.kau);
    Art.drawSticker(g,'herz',kc-55*s,kcy2,14*s,'rgba(255,120,160,0.9)');
    Art.drawSticker(g,'herz',kc+55*s,kcy2,14*s,'rgba(255,120,160,0.9)');
    g.globalAlpha=1;
  }
  g.restore();
}
})();
