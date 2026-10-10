// ui.js — Screen-Space-UI (CSS-Pixel): Kopfzeile, Werkzeug-Tablett, scrollbare Stations-Leiste, Hinweis,
// Bären-Wahl (Raster), Menü-Titel, Finale-Overlay. Buttons kommen als Daten aus salon.js (virtuelle 900×600-Koordinaten)
// und werden hier für Hoch-/Querformat neu angeordnet; b.r = Bildschirm-Rechteck (Touch ≥ 48 px).
(function(){
'use strict';
var S=window.BSSalon, Fx=window.BSFx, Art=window.BSArt, TAU=Math.PI*2;
var UI=window.BSUI={dirty:true};
var L=UI.L={vp:{x:0,y:0,w:100,h:100},W:0,H:0,dpr:1,port:true,safe:{t:0,r:0,b:0,l:0}};
var FONT='system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', INK='#6b3f4a', ACCENT='#f2837a';
var mc=document.createElement('canvas').getContext('2d');
function now(){ return performance.now()/1000; }
function sfx(n,o){ if(window.BSSfx) window.BSSfx.play(n,o); }
function inR(r,x,y,m){ m=m||0; return r && x>=r.x-m && x<=r.x+r.w+m && y>=r.y-m && y<=r.y+r.h+m; }
function textW(txt,font){ mc.font=font; return mc.measureText(txt).width; }

// buildUI → Layout neu (auch bei Zustandswechsel, damit die Kamera sofort das neue Ziel hat)
var origBuild=S.buildUI;
S.buildUI=function(){ var r=origBuild.apply(this,arguments); UI.dirty=true; return r; };

var lastView=null, laidState=null;
var tabScroll=0, tabTarget=null, trayScroll=0, trayMax=0, gridScroll=0, gridMax=0;

// ------------------------------------------------------------------ Layout
UI.layout=function(view){
  lastView=view;
  var W=view.W, H=view.H, sf=view.safe||{t:0,r:0,b:0,l:0}, st=S.state;
  L.W=W; L.H=H; L.dpr=view.dpr; L.safe=sf; L.port=H>=W*0.9;
  var top=sf.t+8, P=L.port;
  L.top={x:sf.l+10,y:top,w:W-sf.l-sf.r-20,h:56};
  L.tabs=null; L.tray=null; L.cta=null; L.grid=null;
  if(st==='menu'){
    L.title={x:0,y:top,w:W,h:P?150:86};
    var nCta=S.buttons.filter(function(b){ return !b.nav; }).length, ch=P?(Math.max(2,nCta)*66+16+24):(90);   // r22: bis 3 Knöpfe
    L.cta={x:sf.l+16,y:H-sf.b-ch,w:W-sf.l-sf.r-32,h:ch-16};
    L.vp={x:0,y:L.title.y+L.title.h-10,w:W,h:L.cta.y-(L.title.y+L.title.h-10)};
  } else if(st==='wahl'){
    L.grid={x:sf.l+12,y:top+70,w:W-sf.l-sf.r-24,h:H-sf.b-(top+70)};
    L.vp={x:0,y:top+64,w:W,h:H-top-64};
  } else if(st==='finish-done'){
    var titleH=P?140:96, ctaH=P?96:84;
    L.cta={x:sf.l+16,y:H-sf.b-ctaH,w:W-sf.l-sf.r-32,h:ctaH-12};
    L.vp={x:0,y:top+titleH,w:W,h:L.cta.y-(top+titleH)};
    if(!P){ L.vp={x:0,y:top+60,w:W,h:L.cta.y-(top+60)}; }
  } else {
    var hasTabs=S.buttons.some(function(b){ return b.tab; });
    if(P){
      var tabsH=hasTabs?68:0, trayH=226;
      if(hasTabs) L.tabs={x:0,y:H-sf.b-tabsH,w:W,h:tabsH+sf.b};
      var ty=H-sf.b-tabsH-trayH;
      L.tray={x:0,y:ty,w:W,h:trayH};
      L.vp={x:0,y:top+58,w:W,h:ty-(top+58)};
    } else {
      var tabsH2=hasTabs?64:0, trayW=Math.round(Math.min(360,Math.max(270,W*0.34)));
      if(hasTabs) L.tabs={x:0,y:H-sf.b-tabsH2,w:W,h:tabsH2+sf.b};
      L.tray={x:W-sf.r-trayW,y:top+60,w:trayW+sf.r,h:H-sf.b-tabsH2-(top+60)};
      L.vp={x:sf.l,y:top+52,w:L.tray.x-sf.l,h:H-sf.b-tabsH2-(top+52)};
    }
  }
  L.vp.h=Math.max(80,L.vp.h); L.vp.w=Math.max(80,L.vp.w);
  layoutButtons();
  if(laidState!==st){ laidState=st; trayScroll=0; gridScroll=st==='wahl'?gridScroll:0; tabTarget='active'; }
};
function btnSize(b,maxW){
  if(b.fill && !b.label) return b.tiny?[48,48]:[52,52];
  if(b.hero) return [Math.min(maxW,300),76];
  var f=(b.big?'700 17px ':'600 15px ')+FONT, w=Math.ceil(textW(b.label,f))+34;
  return [Math.max(56,Math.min(maxW,w)), b.big?60:54];
}
function layoutButtons(){
  var B=S.buttons, st=S.state, P=L.port, sf=L.safe, W=L.W;
  var tray=[], tabs=[], nav=[], cta=[];
  B.forEach(function(b){
    b.r=null; b._zone=null;
    if(b.hideInTray) return;
    if(b.nav) nav.push(b); else if(b.tab) tabs.push(b); else if(b.finCta||st==='menu') cta.push(b); else tray.push(b);
  });
  // Kopfzeile: Haus links, Ton rechts, Weiter links vom Ton
  nav.forEach(function(b){
    var y=L.top.y;
    if(b.nav==='home') b.r={x:L.top.x,y:y,w:56,h:56};
    else if(b.nav==='mute') b.r={x:L.top.x+L.top.w-56,y:y,w:56,h:56};
    else if(b.nav==='next') b.r={x:L.top.x+L.top.w-56-10-72,y:y,w:72,h:56};
    else if(b.nav==='wunsch'){ var KW=window.BSKunden, lw=KW&&KW.leisteBreite?KW.leisteBreite():100; b.r={x:L.top.x,y:y+56+6,w:lw,h:48}; }   // r22
    b._zone='top';
  });
  // CTA (Menü / Finale)
  if(cta.length && L.cta){
    var C=L.cta, side=!P && cta.length>1;
    if(side||st==='finish-done'){
      var gw=12, bw=Math.min(300,(C.w-gw*(cta.length-1))/cta.length), tot=bw*cta.length+gw*(cta.length-1), x0=C.x+(C.w-tot)/2;
      cta.forEach(function(b,i){ b.r={x:x0+i*(bw+gw),y:C.y+(C.h-62)/2,w:bw,h:62}; b._zone='cta'; });
    } else {
      var bw2=Math.min(360,C.w), h2=cta.length>1?62:70, yy=C.y+C.h-(h2*cta.length+14*(cta.length-1));
      cta.forEach(function(b,i){ b.r={x:C.x+(C.w-bw2)/2,y:yy+i*(h2+14),w:bw2,h:h2}; b._zone='cta'; });
    }
  }
  // Werkzeug-Tablett: Fließlayout, Reihen zentriert, vertikal scrollbar falls nötig
  if(L.tray){
    var T=L.tray, pad=12, gap=8, hintH=34, x=0, y=0, rowH=0, rows=[[]], maxW=T.w-sf.r-pad*2;
    var only=tray.length===1 && tray[0].hero;
    tray.forEach(function(b){
      var sz=btnSize(b,maxW);
      if(x>0 && x+sz[0]>maxW){ x=0; y+=rowH+gap; rowH=0; rows.push([]); }
      b._bx=x; b._by=y; b._w=sz[0]; b._h=sz[1]; rows[rows.length-1].push(b);
      x+=sz[0]+gap; rowH=Math.max(rowH,sz[1]);
    });
    var contentH=y+rowH, avail=T.h-hintH-pad*2-(L.tabs&&P?0:8);
    trayMax=Math.max(0,contentH-avail);
    var oy=T.y+hintH+pad+(only?Math.max(0,(avail-contentH)/2):0);
    rows.forEach(function(r){ if(!r.length) return; var last=r[r.length-1], rw=last._bx+last._w, ox=T.x+pad+(maxW-rw)/2;
      r.forEach(function(b){ b._ox=ox; b._oy=oy; b.r={x:ox+b._bx,y:oy+b._by-trayScroll,w:b._w,h:b._h}; b._zone='tray'; }); });
    L.trayInner={x:T.x,y:T.y+hintH+2,w:T.w,h:T.h-hintH-2};
  }
  // Stations-Leiste: horizontal scrollbar
  if(L.tabs){
    var tw=62, tg=6, total=tabs.length*(tw+tg)-tg, x1=Math.max(10,(L.W-total)/2);
    L.tabMax=Math.max(0,total-(L.W-20));
    tabs.forEach(function(b,i){ b._bx=(L.tabMax>0?10:x1)+i*(tw+tg); b.r={x:b._bx-tabScroll,y:L.tabs.y+6,w:tw,h:56}; b._zone='tabs'; });
  }
}
function refreshScrolls(){
  S.buttons.forEach(function(b){
    if(!b.r) return;
    if(b._zone==='tray') b.r.y=b._oy+b._by-trayScroll;
    else if(b._zone==='tabs') b.r.x=b._bx-tabScroll;
  });
}

// ------------------------------------------------------------------ Eingabe
var press=null, drag=null, moved=false, sx=0, sy=0;
function hitButton(x,y){
  var B=S.buttons;
  for(var i=B.length-1;i>=0;i--){ var b=B[i]; if(!b.r) continue;
    if(b._zone==='tray' && !inR(L.trayInner,x,y)) continue;
    if(b._zone==='tabs' && !inR(L.tabs,x,y)) continue;
    if(inR(b.r,x,y,2)) return b; }
  return null;
}
function finaleUI(){ return S.state!=='finish-done' || (S.fin && S.fin.t>=S.FIN.cta); }
UI.down=function(x,y){
  press=null; drag=null; moved=false; sx=x; sy=y;
  var st=S.state;
  if(st==='finish-done' && !finaleUI()) return false;
  var b=hitButton(x,y);
  if(b){ press={b:b,t:now()}; if(b.hold){ S.foehn=true; }
    if(b._zone==='tabs') drag={kind:'tabs',s0:tabScroll};
    else if(b._zone==='tray' && trayMax>0) drag={kind:'tray',s0:trayScroll};
    return true; }
  if(st==='wahl'){ if(inR(L.grid,x,y)) drag={kind:'grid',s0:gridScroll}; return true; }
  if(L.tabs && inR(L.tabs,x,y)){ drag={kind:'tabs',s0:tabScroll}; return true; }
  if(L.tray && inR(L.tray,x,y)){ drag={kind:'tray',s0:trayScroll}; return true; }
  if(inR(L.cta,x,y) && S.buttons.some(function(q){ return q._zone==='cta'; })) return true;
  return false;
};
UI.move=function(x,y){
  if(!press && !drag) return false;
  var dx=x-sx, dy=y-sy;
  if(Math.abs(dx)>10||Math.abs(dy)>10) moved=true;
  if(drag && moved){
    if(drag.kind==='tabs'){ tabScroll=Fx.clamp(drag.s0-dx,0,L.tabMax||0); tabTarget=null; }
    else if(drag.kind==='tray') trayScroll=Fx.clamp(drag.s0-dy,0,trayMax);
    else if(drag.kind==='grid') gridScroll=Fx.clamp(drag.s0-dy,0,gridMax);
    refreshScrolls();
  }
  return true;
};
UI.up=function(x,y){
  var b=press&&press.b, wasDrag=drag&&moved;
  if(b && !b.hold && !wasDrag && inR(b.r,x,y,14)){
    b._tapT=now(); sfx('tap');
    try{ b.onTap&&b.onTap(); }catch(e){ setTimeout(function(){ throw e; }); }
  } else if(S.state==='wahl' && !wasDrag && drag && drag.kind==='grid'){
    var i=gridHit(x,y); if(i>=0){ sfx('tap'); S.chooseBear(i); }
  }
  press=null; drag=null; moved=false;
};

// ------------------------------------------------------------------ Sprite-Cache für UI-Elemente
var cache={}, ncache=0;
function cached(key,w,h,fn){
  var c=cache[key]; if(c) return c;
  if(ncache>260){ cache={}; ncache=0; }
  var d=L.dpr||1, pad=10;
  c=Fx.canvas((w+pad*2)*d,(h+pad*2)*d); var g=c.getContext('2d'); g.scale(d,d); g.translate(pad,pad); fn(g,w,h);
  c._pad=pad; cache[key]=c; ncache++; return c;
}
function blit(g,c,x,y,w,h,sc){
  var p=c._pad; sc=sc||1;
  if(sc!==1){ g.save(); g.translate(x+w/2,y+h/2); g.scale(sc,sc); g.drawImage(c,-w/2-p,-h/2-p,w+p*2,h+p*2); g.restore(); }
  else g.drawImage(c,x-p,y-p,w+p*2,h+p*2);
}
function pill(g,w,h,r,base,edge){
  g.save(); g.shadowColor='rgba(110,50,50,0.26)'; g.shadowBlur=8; g.shadowOffsetY=3;
  var gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,Fx.warmLight(base,0.35)); gr.addColorStop(1,Fx.warmShadow(base,0.12));
  g.fillStyle=gr; Fx.rr(g,0,0,w,h,r); g.fill(); g.restore();
  g.fillStyle='rgba(255,255,255,0.42)'; Fx.rr(g,4,3,w-8,h*0.42,Math.max(2,r-3)); g.fill();
  if(edge){ g.strokeStyle=edge; g.lineWidth=3; Fx.rr(g,1.5,1.5,w-3,h-3,r-1); g.stroke(); }
}
function label(g,txt,x,y,font,col,maxW){
  g.font=font; g.fillStyle=col; g.textAlign='center'; g.textBaseline='middle';
  var w=g.measureText(txt).width;
  if(maxW && w>maxW){ g.save(); g.translate(x,y); g.scale(maxW/w,1); g.fillText(txt,0,0); g.restore(); }
  else g.fillText(txt,x,y);
}
function btnSprite(b,act){
  var w=b.r.w, h=b.r.h, prim=!!b.primary;
  var key='b|'+(b.label||'')+'|'+(b.fill||'')+'|'+w+'x'+h+'|'+(act?1:0)+(prim?1:0)+(b.nav||'')+(b.hero?1:0)+'|'+L.dpr;
  return cached(key,w,h,function(g,w,h){
    if(b.fill && !b.label){
      var r=Math.min(w,h)/2-3, cx=w/2, cy=h/2;
      g.save(); g.shadowColor='rgba(110,50,50,0.28)'; g.shadowBlur=6; g.shadowOffsetY=2;
      g.fillStyle='#fffaf4'; g.beginPath(); g.arc(cx,cy,r+1,0,TAU); g.fill(); g.restore();
      g.drawImage(Fx.S.ball(b.fill),cx-r+3,cy-r+3,(r-3)*2,(r-3)*2);
      if(act){ g.strokeStyle=ACCENT; g.lineWidth=3.5; g.beginPath(); g.arc(cx,cy,r+0.5,0,TAU); g.stroke();
        g.strokeStyle='#ffffff'; g.lineWidth=3; g.lineCap='round'; g.lineJoin='round'; g.beginPath(); g.moveTo(cx-6,cy); g.lineTo(cx-1,cy+5); g.lineTo(cx+7,cy-5); g.stroke(); }
      return;
    }
    var base=prim?ACCENT:(act?'#ffe0d2':'#fffaf4');
    var r=b.nav?h/2:Math.min(h/2,b.hero?38:22);
    pill(g,w,h,r,base,act&&!prim?'#f4a597':null);
    var f=(b.hero?'800 24px ':b.big?'700 17px ':'600 15px ')+FONT;
    if(b.nav) f='600 24px '+FONT;
    if(b.fill){ g.drawImage(Fx.S.ball(b.fill),8,h/2-10,20,20); }
    label(g,b.label||'',w/2,h/2+1,f,prim?'#ffffff':INK,w-16);
  });
}
function tabSprite(b,act){
  var w=b.r.w, h=b.r.h, key='t|'+b.tab+'|'+(act?1:0)+'|'+L.dpr;
  return cached(key,w,h,function(g,w,h){
    pill(g,w,h,16,act?'#ffd9cb':'#fff8f1',act?ACCENT:null);
    label(g,b.icon||'',w/2,h/2-8,'26px '+FONT,INK);
    label(g,b.name||'',w/2,h-10,'600 10px '+FONT,INK,w-6);
  });
}
function panel(g,r,topRound,col){
  var key='p|'+r.w+'x'+r.h+'|'+topRound+'|'+col+'|'+L.dpr;
  var c=cached(key,r.w,r.h,function(g,w,h){
    g.save(); g.shadowColor='rgba(110,50,50,0.2)'; g.shadowBlur=10; g.shadowOffsetY=-2;
    g.fillStyle=col; Fx.rr(g,0,0,w,h+(topRound?24:0),22); g.fill(); g.restore();
    g.fillStyle='rgba(255,255,255,0.5)'; g.fillRect(22,2,w-44,2);
  });
  blit(g,c,r.x,r.y,r.w,r.h);
}
function wrapText(txt,font,maxW){
  mc.font=font; var words=String(txt||'').split(' '), lines=[], cur='';
  words.forEach(function(wd){ var t=cur?cur+' '+wd:wd; if(mc.measureText(t).width>maxW && cur){ lines.push(cur); cur=wd; } else cur=t; });
  if(cur) lines.push(cur); return lines;
}

// ------------------------------------------------------------------ Zeichnen
UI.draw=function(g,view){
  if(!lastView) return;
  g.save(); g.setTransform(view.dpr,0,0,view.dpr,0,0);
  var st=S.state;
  if(st==='wahl') drawWahl(g);
  else if(st==='menu') drawMenu(g);
  else if(st==='finish-done') drawFinale(g);
  else drawStation(g);
  g.restore();
};
function drawButtons(g,zone,alpha,scaleFn){
  var B=S.buttons, t=now();
  for(var i=0;i<B.length;i++){ var b=B[i]; if(!b.r||b._zone!==zone||b.selbst) continue;
    var act=false; try{ act=!!(b.active&&b.active()); }catch(e){}
    var spr=b._zone==='tabs'?tabSprite(b,act):btnSprite(b,act);
    var sc=1, pt=b._tapT?t-b._tapT:9;
    if(press && press.b===b) sc=0.93; else if(pt<0.35) sc=1+0.08*Math.sin(pt/0.35*Math.PI);
    if(b.hold && S.foehn) sc=0.95+0.02*Math.sin(t*30);
    if(scaleFn) sc*=scaleFn(b);
    if(b.primary && b.cta && !b.finCta) sc*=1+0.025*Math.sin(t*4);
    if(alpha!==undefined) g.globalAlpha=alpha;
    blit(g,spr,b.r.x,b.r.y,b.r.w,b.r.h,sc);
    g.globalAlpha=1;
  }
}
function drawStation(g){
  var T=L.tray, st=S.state, t=now();
  // Stations-Titel in der Kopfzeile
  var sd=S.STATIONS.filter(function(s){ return s.id===st; })[0]||(S.TITEL&&S.TITEL[st]);
  if(sd){ var tt=sd.icon+' '+sd.name, key='title|'+tt+'|'+L.dpr;
    // zwischen Haus- und Weiter-Knopf zentriert
    var x0=L.top.x+56+10, x1=L.top.x+L.top.w-56-10-(S.buttons.some(function(b){ return b.nav==='next'; })?82:0);
    var tw=Math.min(x1-x0,Math.ceil(textW(tt,'800 20px '+FONT))+36);
    if(tw>60){ var c=cached(key+'|'+tw,tw,44,function(g,w,h){ pill(g,w,h,22,'#fff6ee'); label(g,tt,w/2,h/2+1,'800 20px '+FONT,INK,w-20); });
      blit(g,c,x0+(x1-x0-tw)/2,L.top.y+6,tw,44); } }
  drawButtons(g,'top');
  var KD=window.BSKunden;
  if(KD && KD.zeichneLeiste && st!=='kunde') KD.zeichneLeiste(g,L);   // r22: Wunsch-Leiste unter dem Haus-Knopf
  if(T){
    if(L.port){ panel(g,{x:T.x,y:T.y,w:T.w,h:L.H-T.y},true,'rgba(255,246,238,0.96)'); }
    else { panel(g,{x:T.x,y:T.y,w:T.w+30,h:T.h+4},true,'rgba(255,246,238,0.95)'); }
    // Hinweis
    var hint=S.hinweis||'', hf='600 14px '+FONT, hw=T.w-L.safe.r-28, lines=wrapText(hint,hf,hw).slice(0,2);
    g.font=hf; g.fillStyle=INK; g.textAlign='center'; g.textBaseline='middle';
    var hx=T.x+(T.w-L.safe.r)/2;
    if(lines.length===1) g.fillText(lines[0],hx,T.y+19);
    else { g.font='600 12.5px '+FONT; g.fillText(lines[0],hx,T.y+11); g.fillText(lines[1],hx,T.y+27); }
    g.save(); g.beginPath(); g.rect(L.trayInner.x,L.trayInner.y,L.trayInner.w,L.trayInner.h); g.clip();
    drawButtons(g,'tray');
    g.restore();
    if(trayMax>0){ g.fillStyle='rgba(107,63,74,0.25)'; var sh=L.trayInner.h*L.trayInner.h/(L.trayInner.h+trayMax);
      Fx.rr(g,T.x+T.w-L.safe.r-7,L.trayInner.y+(L.trayInner.h-sh)*trayScroll/trayMax,4,sh,2); g.fill(); }
  }
  if(L.tabs){
    if(!L.port) panel(g,{x:0,y:L.tabs.y,w:L.W,h:L.tabs.h},true,'rgba(252,236,224,0.97)');
    else { g.fillStyle='rgba(107,63,74,0.08)'; g.fillRect(16,L.tabs.y,L.W-32,1.5); }
    if(tabTarget==='active' && L.tabMax>0){
      var act=S.buttons.filter(function(b){ return b.tab===st; })[0];
      if(act) { tabScroll=Fx.clamp(act._bx+31-L.W/2,0,L.tabMax); refreshScrolls(); }
      tabTarget=null;
    }
    g.save(); g.beginPath(); g.rect(0,L.tabs.y,L.W,L.tabs.h); g.clip();
    drawButtons(g,'tabs');
    if(KD && KD.reiterMarke) S.buttons.forEach(function(b){ if(b._zone==='tabs') KD.reiterMarke(g,b); });   // r22: Wunsch-Marken
    g.restore();
    if(L.tabMax>0){ // Scroll-Hinweis: sanfte Ränder
      var fg=g.createLinearGradient(0,0,26,0); fg.addColorStop(0,'rgba(255,240,230,0.95)'); fg.addColorStop(1,'rgba(255,240,230,0)');
      if(tabScroll>2){ g.fillStyle=fg; g.fillRect(0,L.tabs.y,26,62); }
      if(tabScroll<L.tabMax-2){ g.save(); g.translate(L.W,0); g.scale(-1,1); g.fillStyle=fg; g.fillRect(0,L.tabs.y,26,62); g.restore(); }
    }
  }
}

// ---- Menü
function drawMenu(g){
  var R=L.title, t=now(), P=L.port;
  var key='menuTitle|'+L.W+'|'+P+'|'+L.dpr;
  var c=cached(key,L.W,R.h,function(g,w,h){
    var f1=(P?'900 46px ':'900 40px ')+FONT, f2=(P?'900 40px ':'900 40px ')+FONT;
    function word(txt,x,y,f,c1,c2){
      g.font=f; g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round';
      g.save(); g.shadowColor='rgba(110,40,60,0.3)'; g.shadowBlur=10; g.shadowOffsetY=4; g.lineWidth=12; g.strokeStyle='#ffffff'; g.strokeText(txt,x,y); g.restore();
      var gr=g.createLinearGradient(0,y-24,0,y+22); gr.addColorStop(0,c1); gr.addColorStop(1,c2);
      g.fillStyle=gr; g.fillText(txt,x,y);
      g.save(); g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(0,y-24,w,16); g.restore();
    }
    if(P){ word('Bären-',w/2,h*0.34,f1,'#c77a52','#9a5236'); word('Beautysalon',w/2,h*0.72,f2,'#f4889a','#d95c7a'); }
    else word('Bären-Beautysalon',w/2,h*0.55,f1,'#f08a8a','#c95a6e');
  });
  blit(g,c,0,R.y,L.W,R.h);
  var tw=Fx.S.twinkle();
  for(var i=0;i<4;i++){ var a=t*1.4+i*1.7, s=10+8*Math.max(0,Math.sin(a)); g.globalAlpha=Math.max(0,Math.sin(a));
    g.drawImage(tw,L.W*(0.18+i*0.21)-s/2,R.y+R.h*(0.2+0.5*((i*37)%10)/10)-s/2,s,s); }
  g.globalAlpha=1;
  drawButtons(g,'top'); drawButtons(g,'cta');
  // Versions-Kennung (klein, oben links, frei von Knöpfen und Titel) — "alte Optik" bei ?deko=0
  g.font='600 10.5px '+FONT; g.fillStyle='rgba(107,63,74,0.5)'; g.textAlign='left'; g.textBaseline='alphabetic';
  g.fillText('v'+(window.BS_VERSION||'')+(Fx.DEKO?'':' · alte Optik'),L.safe.l+10,L.safe.t+16);
}

// ---- Bären-Wahl
var built=0;
function gridGeom(){
  var G=L.grid, cols=L.port?3:Math.max(4,Math.floor(G.w/150)), gap=12;
  var tw=(G.w-gap*(cols-1))/cols, th=tw*1.2;
  var rows=Math.ceil(Art.MODELS.length/cols);
  gridMax=Math.max(0,rows*(th+gap)-gap-G.h+20);
  return {cols:cols,gap:gap,tw:tw,th:th};
}
function gridHit(x,y){
  var G=L.grid; if(!inR(G,x,y)) return -1;
  var q=gridGeom(), cx=Math.floor((x-G.x)/(q.tw+q.gap)), cy=Math.floor((y-G.y+gridScroll)/(q.th+q.gap));
  var lx=(x-G.x)-cx*(q.tw+q.gap), ly=(y-G.y+gridScroll)-cy*(q.th+q.gap);
  if(cx<0||cx>=q.cols||lx>q.tw||ly>q.th) return -1;
  var i=cy*q.cols+cx; return i<Art.MODELS.length?i:-1;
}
function drawWahl(g){
  var G=L.grid, q=gridGeom(), t=now(), d=L.dpr||1;
  var key='wahlTitle|'+L.W+'|'+L.dpr;
  var c=cached(key,Math.min(L.W-150,320),46,function(g,w,h){ pill(g,w,h,23,'#fff6ee'); label(g,'Wähle deinen Bären! 🧸',w/2,h/2+1,'800 19px '+FONT,INK,w-20); });
  var tw0=Math.min(L.W-150,320); blit(g,c,(L.W-tw0)/2,L.top.y+5,tw0,46);
  built=0;
  g.save(); g.beginPath(); g.rect(0,G.y-6,L.W,G.h+6); g.clip();
  var n=Art.MODELS.length, thumbPx=Math.round(q.tw*0.92*d);
  for(var i=0;i<n;i++){
    var cx=i%q.cols, cy=Math.floor(i/q.cols), x=G.x+cx*(q.tw+q.gap), y=G.y+cy*(q.th+q.gap)-gridScroll;
    if(y>G.y+G.h||y+q.th<G.y-6) continue;
    var surprise=i===n-1, m=Art.MODELS[i];
    var card=cached('card|'+i+'|'+Math.round(q.tw)+'|'+L.dpr,q.tw,q.th,function(g,w,h){
      pill(g,w,h,20,surprise?'#efe4ff':'#fffaf4');
      var bg=g.createRadialGradient(w/2,h*0.42,4,w/2,h*0.42,w*0.55); bg.addColorStop(0,Fx.alpha(Fx.warmLight(m.fell,0.6),0.55)); bg.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=bg; g.fillRect(0,0,w,h*0.85);
      var f='700 '+(w<110?11:12.5)+'px '+FONT;
      label(g,m.name,w/2,h-15,f,INK,w-10);
    });
    blit(g,card,x,y,q.tw,q.th);
    if(Art.thumbReady(i,thumbPx) || built<1){ if(!Art.thumbReady(i,thumbPx)) built++; g.drawImage(Art.thumb(i,thumbPx),x+q.tw*0.04,y+2,q.tw*0.92,q.tw*0.92); }
    else { Fx.glow(g,x+q.tw/2,y+q.tw*0.46,q.tw*0.3,m.fell,0.6); }
    var KW=window.BSKunden; if(KW && KW.karteMarke && !surprise) KW.karteMarke(g,i,x,y,q.tw,q.th);   // r22: Herzen, beste Freunde, Geburtstag
    if(surprise){ var tw=Fx.S.twinkle(); for(var s=0;s<3;s++){ var a=t*2+s*2.1, z=8+8*Math.max(0,Math.sin(a)); g.drawImage(tw,x+q.tw*(0.2+0.3*s)-z/2,y+q.tw*(0.2+0.25*(s%2))-z/2,z,z); } }
  }
  g.restore();
  drawButtons(g,'top');
}

// ---- Finale-Overlay
UI.starPos=function(i){ var y=(L.top?L.top.y:20)+(L.port?100:78); var gap=L.port?60:52; return [L.W/2+(i-1)*gap+(L.port?0:0), y+(i===1?-8:0)]; };
function drawFinale(g){
  var F=S.fin, FIN=S.FIN; if(!F) return;
  var t=F.t, P=L.port, top=L.top.y;
  // Titel
  var qt=Fx.seg(t,FIN.title,FIN.title+0.45);
  if(qt>0){
    var m=Art.MODELS[S.baer.fellIdx||0]||Art.MODELS[0];
    var tw=P?Math.min(420,L.W-2*(L.top.x+62)):Math.min(L.W-2*(L.top.x+140),520), th=P?78:56;
    var c=cached('finTitle|'+m.name+'|'+tw+'|'+P+'|'+L.dpr,tw,th,function(g,w,h){
      var f=(P?'900 38px ':'900 32px ')+FONT;
      g.font=f; g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round';
      var y1=P?h*0.36:h*0.5, txt=P?'Wunderschön!':'Wunderschön, '+m.name+'!';
      g.save(); g.shadowColor='rgba(80,30,50,0.35)'; g.shadowBlur=10; g.shadowOffsetY=3; g.lineWidth=10; g.strokeStyle='#ffffff'; g.strokeText(txt,w/2,y1,w-10); g.restore();
      var gr=g.createLinearGradient(0,y1-20,0,y1+18); gr.addColorStop(0,'#f59aa8'); gr.addColorStop(1,'#d9587a');
      g.fillStyle=gr; g.fillText(txt,w/2,y1,w-10);
      if(P){ g.font='800 18px '+FONT; g.lineWidth=6; g.strokeStyle='#ffffff'; g.strokeText('✨ '+m.name+' ✨',w/2,h*0.82,w-10); g.fillStyle=INK; g.fillText('✨ '+m.name+' ✨',w/2,h*0.82,w-10); }
    });
    var sc=Fx.ease.outBack(qt);
    g.globalAlpha=Math.min(1,qt*2); blit(g,c,(L.W-tw)/2,top+(P?4:2),tw,th,sc); g.globalAlpha=1;
  }
  // drei Sterne
  for(var i=0;i<3;i++){
    var qs=Fx.seg(t,FIN.star+i*0.25,FIN.star+i*0.25+0.35); if(qs<=0) continue;
    var p=UI.starPos(i), r=(P?22:18)*Fx.ease.outBack(qs)*(1+0.04*Math.sin(t*3+i));
    Fx.glow(g,p[0],p[1],r*2.4,'#ffe6a0',0.6*qs);
    Art.drawSticker(g,'stern',p[0],p[1],r,'#ffcf4a');
  }
  // Vorher-Polaroid fliegt in die Ecke
  var qp=Fx.seg(t,FIN.pola,FIN.pola+0.7);
  if(qp>0 && F.vorher){
    var e=Fx.ease.outCubic(qp), pw=P?92:80, ph=pw*1.2;
    var tx=L.safe.l+14+pw/2, ty=top+(P?150:70)+ph/2, fx=L.W/2, fy=L.H*0.45;
    var x=Fx.lerp(fx,tx,e), y=Fx.lerp(fy,ty,e)-Math.sin(e*Math.PI)*60, rot=Fx.lerp(0.4,-0.12,e), sc2=Fx.lerp(1.8,1,e);
    g.save(); g.translate(x,y); g.rotate(rot); g.scale(sc2,sc2);
    g.shadowColor='rgba(60,30,30,0.35)'; g.shadowBlur=10; g.shadowOffsetY=4;
    g.fillStyle='#fffdf8'; g.fillRect(-pw/2,-ph/2,pw,ph); g.shadowBlur=0; g.shadowOffsetY=0;
    var V=F.vorher, iw=pw-10, ih=iw, ar=V.w/V.h;
    g.save(); g.beginPath(); g.rect(-iw/2,-ph/2+5,iw,ih); g.clip(); g.fillStyle='#e8ddd2'; g.fillRect(-iw/2,-ph/2+5,iw,ih);
    var dw=ih*ar*1.05, dh=ih*1.05; g.drawImage(V.img,-dw/2,-ph/2+5+(ih-dh)*0.2,dw,dh); g.restore();
    label(g,'Vorher',0,ph/2-10,'700 12px '+FONT,'#8a6a5a');
    g.restore();
  }
  // Knöpfe erscheinen zuletzt
  if(t>=FIN.cta){
    var qc=Fx.seg(t,FIN.cta,FIN.cta+0.45);
    drawButtons(g,'top',Math.min(1,qc*2));
    drawButtons(g,'cta',Math.min(1,qc*2),function(){ return 0.6+0.4*Fx.ease.outBack(qc); });
  }
}
})();
