// stations/waschen.js — Waschen: Seife antippen, Schaum rubbeln (game.js ruft beim Ziehen tapBear), Dusche spült ab.
// Wanne hinten/vorn um den Bären, letztes Album-Foto an der Wand (back). Die Brause-Position (für den Duschstrahl in
// game.js) kommt aus hit().brause statt aus S._brause beim Zeichnen. (Dusche/Abschütteln pro Bild noch in game.js.)
(function(){
'use strict';
var S=window.BSSalon, H=S.H, Art=window.BSArt, Fx=window.BSFx;

S.registerStation({
  id:'waschen',
  onLeave:function(){ S.baer.schaum=0; S.baer.tropfen=[]; S.dusche=false; },
  // Dusche spült Schaum ab, Tropfen, Abschütteln (aus game.js update(), läuft vor der Pose)
  frueh:function(dt){
    var b=S.baer;
    if(S.dusche && b.schaum>0){
      b.schaum=Math.max(0,b.schaum-dt*0.55);
      b.tropfen.length=0;
      var s=Math.min(S.VW,S.VH)/420;
      for(var i=0;i<5;i++) b.tropfen.push({x:S.VW*0.5+(Math.random()-0.5)*200*s,y:S.VH*0.35+Math.random()*260*s});
      if(Math.random()<dt*20) Fx.P.emit('drop',400+Math.random()*120,190+Math.random()*30,{n:2,speed:220,dir:-Math.PI/2,spread:2.4,size:6,life:0.8,grav:900,drag:0.5});
      if(b.schaum===0){ // fertig abgeduscht: Schütteln wie ein nasser Hund
        Art.react(b,'shake'); if(window.BSSfx) window.BSSfx.play('splash');
        Fx.P.emit('drop',S.VW*0.5,S.VH*0.58,{n:40,speed:620,size:7,life:0.9,grav:900,drag:0.8,jx:120,jy:100});
        S.dusche=false;
      }
    } else { b.tropfen.length=0; if(b.schaum<=0) S.dusche=false; }
  },
  build:function(){
    H.stationTabs();
    S.hinweis = 'Seife antippen, dann Schaum rubbeln! 🧼';
    H.btn(30,110,150,64,'🧼 Seife',function(){
      S.baer.schaum=Math.min(1,S.baer.schaum+0.5);
      H.sfx('bubble'); H.sfx('bubble',{delay:0.08}); H.react('happy',0.8);
      H.emit('bubble',S.VW*0.5,S.VH*0.58+40,{n:14,speed:160,dir:-Math.PI/2,spread:2.2,grav:-60,drag:1.4,size:14,life:1.8,jx:90,jy:50});
    },{active:function(){return S.baer.schaum>0.2;}});
    H.btn(30,186,150,64,'🚿 Dusche',function(){ S.dusche=true; S._duschT=0; },{active:function(){return !!S.dusche;}});
  },
  // Bilderrahmen mit dem letzten Album-Foto an der Wand (Hintergrund, vor den Duftwolken)
  back:function(g){
    if(!(S.album && S.album.length)) return;
    var last=S.album[S.album.length-1];
    var bx=205, by=118, bw=104, bh=116;
    Fx.contactShadow(g,bx+bw/2+6,by+bh/2+8,bw*0.62,bh*0.62,0.35);
    var fg=g.createLinearGradient(bx,by,bx+bw,by+bh); fg.addColorStop(0,'#e6b98f'); fg.addColorStop(1,'#b98460');
    g.fillStyle=fg; g.fillRect(bx-7,by-7,bw+14,bh+14);
    g.fillStyle='#fbf3e8'; g.fillRect(bx,by,bw,bh);
    var mod2=Art.MODELS[last.fellIdx]||Art.MODELS[0];
    var th=Art.thumb(last.fellIdx||0,160);
    g.drawImage(th,bx+6,by+4,bw-12,bw-12);
    g.fillStyle='#6b4a3a'; g.font='bold 11px sans-serif'; g.textAlign='center';
    g.fillText('⭐ '+(last.modell||mod2.name), bx+bw/2, by+bh-6);
  },
  draw:function(g){ drawWanne(g,false); H.baer(g); drawWanne(g,true); },
  hit:function(){ return {brause:brause()}; },
  tap:function(x,y){
    var s=Math.min(S.VW,S.VH)/420;
    var cx=S.VW*0.5, cy=S.VH*0.58+70*s;
    var dx=(x-cx)/(120*s), dy=(y-cy)/(110*s);
    if(dx*dx+dy*dy < 1.4){ S.baer.schaum=Math.min(1,S.baer.schaum+0.03); return true; }
    return false;
  }
});

// Brause-Kopf über dem Bären (Messing); der Duschstrahl startet an seiner Düse
function brauseKopf(){ var s=Math.min(S.VW,S.VH)/420; return {x:S.VW*0.5-150*s, y:S.VH*0.58-250*s, s:s}; }
function brause(){ var b=brauseKopf(); return [b.x+26*b.s, b.y+26*b.s]; }
// Badewanne (Waschen): Rückwand hinter dem Bären, Front davor — der Bär sitzt IN der Wanne
function drawWanne(g,front){
  var s=Math.min(S.VW,S.VH)/420, cx=S.VW*0.5, y=S.VH*0.58+128*s;
  var w=210*s, h=92*s, t=performance.now()/1000;
  if(!front){
    Fx.contactShadow(g,cx,y+h+14*s,w*1.05,26*s,0.8);
    var bg=g.createLinearGradient(0,y-30*s,0,y+10*s);
    bg.addColorStop(0,'#f3e6d6'); bg.addColorStop(1,'#e2cfb9');
    g.fillStyle=bg; g.beginPath(); g.ellipse(cx,y,w,26*s,0,Math.PI,0); g.fill();
    // Brause-Kopf über dem Bären (Messing)
    var bk=brauseKopf(), hx=bk.x, hyb=bk.y;
    g.strokeStyle='#caa06a'; g.lineWidth=7*s; g.lineCap='round';
    g.beginPath(); g.moveTo(hx-60*s,hyb-120*s); g.lineTo(hx-60*s,hyb-20*s); g.quadraticCurveTo(hx-60*s,hyb,hx-30*s,hyb); g.lineTo(hx,hyb); g.stroke();
    g.save(); g.translate(hx+14*s,hyb+8*s); g.rotate(0.5);
    var sg=g.createLinearGradient(-22*s,0,22*s,0); sg.addColorStop(0,'#f2d49c'); sg.addColorStop(0.5,'#d8ab6a'); sg.addColorStop(1,'#a97a45');
    g.fillStyle=sg; g.beginPath(); g.moveTo(-10*s,-14*s); g.lineTo(10*s,-14*s); g.lineTo(26*s,10*s); g.lineTo(-26*s,10*s); g.closePath(); g.fill();
    Fx.ball(g,0,10*s,26*s,7*s,'#e7c28a');
    g.restore();
    return;
  }
  // Wannen-Front (Emaille creme, Rand apricot) + Schaum-Krone am Rand
  var DK=Fx.DEKO && window.BSDeko && window.BSDeko.tubFront;
  if(DK){ window.BSDeko.tubFront(g); } else {
  var fg=g.createLinearGradient(0,y,0,y+h);
  fg.addColorStop(0,'#fffaf2'); fg.addColorStop(0.55,'#f6ebdd'); fg.addColorStop(1,'#e5d2bd');
  g.fillStyle=fg;
  g.beginPath(); g.moveTo(cx-w,y); g.lineTo(cx+w,y); g.quadraticCurveTo(cx+w*0.98,y+h,cx+w*0.7,y+h); g.lineTo(cx-w*0.7,y+h); g.quadraticCurveTo(cx-w*0.98,y+h,cx-w,y); g.fill();
  g.fillStyle='rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(cx-w*0.55,y+h*0.35,w*0.22,h*0.14,-0.1,0,Math.PI*2); g.fill();
  var rg=g.createLinearGradient(0,y-10*s,0,y+12*s); rg.addColorStop(0,'#f7c09c'); rg.addColorStop(1,'#e2946e');
  g.fillStyle=rg; g.beginPath(); g.ellipse(cx,y,w+8*s,11*s,0,0,Math.PI*2); g.fill();
  // Füße (Messing)
  [-1,1].forEach(function(sg){ Fx.ball(g,cx+sg*w*0.62,y+h+8*s,16*s,11*s,'#d8ab6a'); });
  }
  // Schaumkrone (wächst mit Schaum)
  var sc=Math.max(0.25,S.baer.schaum||0);
  for(var i=0;i<16;i++){
    var q=i/15, bx=cx-w*0.95+q*w*1.9, br=(12+((i*37)%9))*s*(0.6+0.6*sc);
    Fx.ball(g,bx,y-4*s-Math.sin(q*Math.PI)*6*s+Math.sin(t*2+i)*1.5*s,br,br*0.85,'#fffaf3');
  }
  if(DK) window.BSDeko.duck(g,t,!!S.dusche || (S.baer.schaum||0)>0.3); // r20: Badeente schaukelt auf dem Wannenrand
}
})();
