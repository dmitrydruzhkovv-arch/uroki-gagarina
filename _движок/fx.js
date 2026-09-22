/* Грапер функций. Взят у Методиста (g3_print_гипербола.html), 21.09.2026.
   Добавлено: seg [{x1,y1,x2,y2,col,dash}], профиль quad (A·x²+B·x+C), выколотая точка pts[].o=true.
   Подключение: <svg class="fx" viewBox="0 0 W H" data-g='{...}'> + <script src="../_движок/fx.js"></script> */
(function(){
  var svgNS='http://www.w3.org/2000/svg';
  function run(){
  document.querySelectorAll('svg.fx').forEach(function(svg){
    try{ fxRender(svg); }catch(e){ /* noop */ }
  });
  function fxRender(svg){
    var cfg=JSON.parse(svg.getAttribute('data-g'));
    var vb=(svg.getAttribute('viewBox')||'0 0 200 140').split(/\s+/).map(Number);
    var W=vb[2],H=vb[3];
    var pL=cfg.padL!=null?cfg.padL:10, pR=cfg.padR!=null?cfg.padR:10, pT=cfg.padT!=null?cfg.padT:8, pB=cfg.padB!=null?cfg.padB:8;
    var xmin=cfg.x[0],xmax=cfg.x[1],ymin=cfg.y[0],ymax=cfg.y[1];
    var X=function(x){return pL+(x-xmin)/(xmax-xmin)*(W-pL-pR);};
    var Y=function(y){return H-pB-(y-ymin)/(ymax-ymin)*(H-pT-pB);};
    function E(tag,a){var e=document.createElementNS(svgNS,tag);for(var k in a)e.setAttribute(k,a[k]);return e;}
    var GRID='#e8eef5', AX='#1c1917';
    var step=cfg.grid!=null?cfg.grid:1;
    if(step>0){
      for(var gx=Math.ceil(xmin/step)*step; gx<=xmax+1e-9; gx+=step){ if(Math.abs(gx)<1e-9)continue; svg.appendChild(E('line',{x1:X(gx),y1:Y(ymax),x2:X(gx),y2:Y(ymin),stroke:GRID,'stroke-width':1})); }
      for(var gy=Math.ceil(ymin/step)*step; gy<=ymax+1e-9; gy+=step){ if(Math.abs(gy)<1e-9)continue; svg.appendChild(E('line',{x1:X(xmin),y1:Y(gy),x2:X(xmax),y2:Y(gy),stroke:GRID,'stroke-width':1})); }
    }
    (cfg.asym||[]).forEach(function(a){
      if(a.v!=null) svg.appendChild(E('line',{x1:X(a.v),y1:Y(ymax),x2:X(a.v),y2:Y(ymin),stroke:a.col||'#c4b5fd','stroke-width':1.4,'stroke-dasharray':'4 3'}));
      if(a.h!=null) svg.appendChild(E('line',{x1:X(xmin),y1:Y(a.h),x2:X(xmax),y2:Y(a.h),stroke:a.col||'#c4b5fd','stroke-width':1.4,'stroke-dasharray':'4 3'}));
    });
    (cfg.seg||[]).forEach(function(q){
      var at={x1:X(q.x1),y1:Y(q.y1),x2:X(q.x2),y2:Y(q.y2),stroke:q.col||'#0369a1','stroke-width':q.w||1.6};
      if(q.dash) at['stroke-dasharray']='4 3';
      svg.appendChild(E('line',at));
    });
    /* оси */
    svg.appendChild(E('line',{x1:X(xmin),y1:Y(0),x2:X(xmax),y2:Y(0),stroke:AX,'stroke-width':1.4}));
    svg.appendChild(E('polygon',{points:X(xmax)+','+Y(0)+' '+(X(xmax)-7)+','+(Y(0)-3.5)+' '+(X(xmax)-7)+','+(Y(0)+3.5),fill:AX}));
    svg.appendChild(E('line',{x1:X(0),y1:Y(ymin),x2:X(0),y2:Y(ymax),stroke:AX,'stroke-width':1.4}));
    svg.appendChild(E('polygon',{points:X(0)+','+Y(ymax)+' '+(X(0)-3.5)+','+(Y(ymax)+7)+' '+(X(0)+3.5)+','+(Y(ymax)+7),fill:AX}));
    if(cfg.axl!==false){
      var tx=E('text',{x:X(xmax)-3,y:Y(0)+14,'font-family':'Cambria,Georgia,serif','font-style':'italic','font-size':11,fill:AX,'text-anchor':'end'});tx.textContent='x';svg.appendChild(tx);
      var ty=E('text',{x:X(0)+6,y:Y(ymax)+10,'font-family':'Cambria,Georgia,serif','font-style':'italic','font-size':11,fill:AX});ty.textContent='y';svg.appendChild(ty);
      var to=E('text',{x:X(0)-4,y:Y(0)+13,'font-family':'Cambria,Georgia,serif','font-style':'italic','font-size':10,fill:'#a8a29e','text-anchor':'end'});to.textContent='O';svg.appendChild(to);
    }
    (cfg.ticks||[]).forEach(function(t){
      if(t.x!=null){ svg.appendChild(E('line',{x1:X(t.x),y1:Y(0)-3,x2:X(t.x),y2:Y(0)+3,stroke:AX,'stroke-width':1.2})); var e=E('text',{x:X(t.x),y:Y(0)+14,'font-family':'JetBrains Mono,monospace','font-size':9,fill:'#57534e','text-anchor':'middle'});e.textContent=t.x;svg.appendChild(e); }
      if(t.y!=null){ svg.appendChild(E('line',{x1:X(0)-3,y1:Y(t.y),x2:X(0)+3,y2:Y(t.y),stroke:AX,'stroke-width':1.2})); var e2=E('text',{x:X(0)-6,y:Y(t.y)+3.5,'font-family':'JetBrains Mono,monospace','font-size':9,fill:'#57534e','text-anchor':'end'});e2.textContent=t.y;svg.appendChild(e2); }
    });
    function fval(c,x){
      var a=c.a||0,b=c.b||0;
      if(c.f==='hyp') return c.k/(x-a)+b;
      if(c.f==='absrecip') return c.k/Math.abs(x-a)+b;
      if(c.f==='recipabs') return Math.abs(c.k/(x-a))+b;
      if(c.f==='sqrt'){var dir=c.dir||1,s=c.s||1,u=dir*(x-a); return u<0?NaN:s*Math.sqrt(u)+b;}
      if(c.f==='line') return c.k*(x-a)+b;
      if(c.f==='parab') return (c.A||1)*(x-a)*(x-a)+b;
      if(c.f==='abs') return (c.s||1)*Math.abs(x-a)+b;
      if(c.f==='quad') return (c.A||0)*x*x+(c.B||0)*x+(c.C||0);
      return NaN;
    }
    (cfg.curves||[]).forEach(function(c){
      var N=360, segs=[], cur=[], x0=c.from!=null?c.from:xmin, x1=c.to!=null?c.to:xmax;
      for(var i=0;i<=N;i++){
        var x=x0+(x1-x0)*i/N, y=fval(c,x);
        if(isNaN(y)||y>ymax+1e-6||y<ymin-1e-6){ if(cur.length>1)segs.push(cur); cur=[]; continue; }
        cur.push([X(x),Y(y)]);
      }
      if(cur.length>1)segs.push(cur);
      segs.forEach(function(pts){
        var d=pts.map(function(p,i){return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ');
        if(c.glow) svg.appendChild(E('path',{d:d,fill:'none',stroke:c.glowcol||c.col,'stroke-width':(c.w||2.6)+4,'stroke-opacity':0.3,'stroke-linecap':'round','stroke-linejoin':'round'}));
        svg.appendChild(E('path',{d:d,fill:'none',stroke:c.col,'stroke-width':c.w||2.6,'stroke-linecap':'round','stroke-linejoin':'round'}));
      });
    });
    (Array.isArray(cfg.rect)?cfg.rect:(cfg.rect?[cfg.rect]:[])).forEach(function(r){ var cc=r.col||'#0d9488';
      svg.appendChild(E('rect',{x:Math.min(X(0),X(r.x)),y:Math.min(Y(0),Y(r.y)),width:Math.abs(X(r.x)-X(0)),height:Math.abs(Y(r.y)-Y(0)),fill:cc,'fill-opacity':(r.op!=null?r.op:0.12),stroke:cc,'stroke-width':1.3,'stroke-dasharray':'4 3'}));
    });
    (cfg.pts||[]).forEach(function(p){
      svg.appendChild(E('circle',p.o?{cx:X(p.x),cy:Y(p.y),r:p.r||4,fill:'#fff',stroke:p.col||'#d97706','stroke-width':1.8}:{cx:X(p.x),cy:Y(p.y),r:p.r||4,fill:p.col||'#d97706'}));
      if(p.lab){var t=E('text',{x:X(p.x)+(p.dx!=null?p.dx:6),y:Y(p.y)+(p.dy!=null?p.dy:-6),'font-family':'JetBrains Mono,monospace','font-size':p.fs||10,'font-weight':700,fill:p.col||'#d97706'});t.textContent=p.lab;svg.appendChild(t);}
    });
    (cfg.labels||[]).forEach(function(l){
      var t=E('text',{x:X(l.x),y:Y(l.y),'font-size':l.fs||12,fill:l.col||'#1c1917','font-weight':l.w||700});
      if(l.it){t.setAttribute('font-family','Cambria,Georgia,serif');t.setAttribute('font-style','italic');}else{t.setAttribute('font-family','JetBrains Mono,monospace');}
      if(l.anchor)t.setAttribute('text-anchor',l.anchor);
      t.textContent=l.t;svg.appendChild(t);
    });
  }

  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();
