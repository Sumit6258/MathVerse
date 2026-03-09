/* ═══════════════════════════════════════════
   complex.js — Domain Coloring (FIXED)
   Pure canvas 2D, no WebGL needed
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('complexCanvas');
  if(!canvas) return;
  canvas.width = 700; canvas.height = 500;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let showGrid = true, zoom = 2.0, currentFn = 'z*z';
  let rendering = false;

  // ── Complex number helpers ────────────────
  function cadd(a,b){return{r:a.r+b.r,i:a.i+b.i};}
  function csub(a,b){return{r:a.r-b.r,i:a.i-b.i};}
  function cmul(a,b){return{r:a.r*b.r-a.i*b.i,i:a.r*b.i+a.i*b.r};}
  function cdiv(a,b){
    const d=b.r*b.r+b.i*b.i;
    if(d<1e-15)return{r:0,i:0};
    return{r:(a.r*b.r+a.i*b.i)/d,i:(a.i*b.r-a.r*b.i)/d};
  }
  function cexp(z){const e=Math.exp(z.r);return{r:e*Math.cos(z.i),i:e*Math.sin(z.i)};}
  function clog(z){return{r:0.5*Math.log(z.r*z.r+z.i*z.i),i:Math.atan2(z.i,z.r)};}
  function csin(z){return{r:Math.sin(z.r)*Math.cosh(z.i),i:Math.cos(z.r)*Math.sinh(z.i)};}
  function ccos(z){return{r:Math.cos(z.r)*Math.cosh(z.i),i:-Math.sin(z.r)*Math.sinh(z.i)};}
  function ctanh(z){
    const e2=Math.exp(2*z.r);
    const cos2=Math.cos(2*z.i),sin2=Math.sin(2*z.i);
    const d=(Math.cosh(2*z.r)+cos2)||1e-15;
    return{r:Math.sinh(2*z.r)/d,i:sin2/d};
  }
  function cconj(z){return{r:z.r,i:-z.i};}
  function cpow(z,n){
    if(z.r===0&&z.i===0)return{r:0,i:0};
    const r=Math.pow(z.r*z.r+z.i*z.i,n/2);
    const a=Math.atan2(z.i,z.r)*n;
    return{r:r*Math.cos(a),i:r*Math.sin(a)};
  }

  // Build eval function from expression string
  function buildFn(expr) {
    // Replace shorthand: z^2 -> cpow(z,2), z*z -> cmul(z,z), etc.
    // We support: cmul, cadd, csub, cdiv, cexp, clog, csin, ccos, ctanh, cconj
    const code = `
      "use strict";
      try {
        var r = z.r, i = z.i;
        var ONE = {r:1,i:0}, TWO = {r:2,i:0};
        return (${expr});
      } catch(e) { return {r:0,i:0}; }
    `;
    return new Function('z','cmul','cadd','csub','cdiv','cexp','clog','csin','ccos','ctanh','cconj','cpow', code);
  }

  let evalFn = null;
  function setFn(expr) {
    currentFn = expr;
    try { evalFn = buildFn(expr); evalFn({r:1,i:0},cmul,cadd,csub,cdiv,cexp,clog,csin,ccos,ctanh,cconj,cpow); }
    catch(e) { evalFn = null; }
  }

  function evalComplex(z) {
    if(!evalFn) return {r:0,i:0};
    try {
      const w = evalFn(z,cmul,cadd,csub,cdiv,cexp,clog,csin,ccos,ctanh,cconj,cpow);
      if(w && isFinite(w.r) && isFinite(w.i)) return w;
      return {r:0,i:0};
    } catch(e) { return {r:0,i:0}; }
  }

  function hsvToRgb(h,s,v) {
    h = ((h%(2*Math.PI))+2*Math.PI)%(2*Math.PI)/(2*Math.PI);
    const i=Math.floor(h*6), f=h*6-i;
    const p=v*(1-s), q=v*(1-f*s), t=v*(1-(1-f)*s);
    const c=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
    return [Math.round(c[0]*255),Math.round(c[1]*255),Math.round(c[2]*255)];
  }

  function render() {
    if(rendering) return;
    rendering = true;

    const img = ctx.createImageData(W, H);
    const step = 2; // render every 2 pixels for speed

    for(let py=0; py<H; py+=step) {
      for(let px=0; px<W; px+=step) {
        const re = (px/W - 0.5)*zoom*2*(W/H);
        const im = (0.5 - py/H)*zoom*2;
        const w = evalComplex({r:re, i:im});
        const mag = Math.sqrt(w.r*w.r+w.i*w.i);
        const arg = Math.atan2(w.i, w.r);
        // Domain coloring: hue=arg, brightness from log(|w|)
        const logMag = Math.log(mag + 0.0001);
        const bright = 0.5 + 0.45*Math.tanh(logMag*0.5);
        const banded = bright*(0.75 + 0.25*Math.sin(logMag*4));
        const [r,g,b] = hsvToRgb(arg, 0.92, Math.max(0.02, Math.min(0.98, banded)));
        for(let dy=0;dy<step&&py+dy<H;dy++) {
          for(let dx=0;dx<step&&px+dx<W;dx++) {
            const idx=((py+dy)*W+(px+dx))*4;
            img.data[idx]=r; img.data[idx+1]=g; img.data[idx+2]=b; img.data[idx+3]=255;
          }
        }
      }
    }
    ctx.putImageData(img,0,0);

    // Draw grid lines if enabled
    if(showGrid) drawGrid();

    // Legend
    ctx.font='11px JetBrains Mono';
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillText('Hue = arg(f(z))  |  Brightness = |f(z)|',10,20);
    ctx.fillText(`f(z) = ${currentFn}`,10,H-10);

    rendering = false;
  }

  function drawGrid() {
    const lines = 7;
    ctx.globalAlpha = 0.35;
    // Vertical lines Re(z)=k
    for(let k=-lines;k<=lines;k++) {
      const re = k/lines * zoom*(W/H);
      ctx.beginPath();
      for(let py=0;py<=H;py+=4) {
        const im=(0.5-py/H)*zoom*2;
        const w = evalComplex({r:re,i:im});
        const px=(w.r/(zoom*2*(W/H))+0.5)*W;
        const qy=(0.5-w.i/(zoom*2))*H;
        if(!isFinite(px)||!isFinite(qy)||Math.abs(px)>W*3||Math.abs(qy)>H*3){ctx.beginPath();continue;}
        py===0?ctx.moveTo(px,qy):ctx.lineTo(px,qy);
      }
      ctx.strokeStyle = k===0?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.15)';
      ctx.lineWidth = k===0?1.5:0.6;
      ctx.stroke();
    }
    // Horizontal lines Im(z)=k
    for(let k=-lines;k<=lines;k++) {
      const im = k/lines * zoom;
      ctx.beginPath();
      for(let px=0;px<=W;px+=4) {
        const re=(px/W-0.5)*zoom*2*(W/H);
        const w = evalComplex({r:re,i:im});
        const qx=(w.r/(zoom*2*(W/H))+0.5)*W;
        const qy=(0.5-w.i/(zoom*2))*H;
        if(!isFinite(qx)||!isFinite(qy)||Math.abs(qx)>W*3||Math.abs(qy)>H*3){ctx.beginPath();continue;}
        px===0?ctx.moveTo(qx,qy):ctx.lineTo(qx,qy);
      }
      ctx.strokeStyle = k===0?'rgba(255,140,0,0.6)':'rgba(255,140,0,0.15)';
      ctx.lineWidth = k===0?1.5:0.6;
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  // ── Controls ──────────────────────────────
  document.getElementById('complexRender')?.addEventListener('click',()=>{
    const expr = document.getElementById('complexInput')?.value?.trim() || currentFn;
    setFn(expr);
    render();
  });

  document.getElementById('complexInput')?.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      setFn(e.target.value.trim());
      render();
    }
  });

  document.getElementById('complexGrid')?.addEventListener('change',e=>{
    showGrid = e.target.checked;
    render();
  });

  document.getElementById('complexZoom')?.addEventListener('input',e=>{
    zoom = parseFloat(e.target.value);
    document.getElementById('complexZoomVal').textContent = zoom.toFixed(1);
    render();
  });

  document.querySelectorAll('.cpreset').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const fn = btn.dataset.fn;
      if(document.getElementById('complexInput')) document.getElementById('complexInput').value = fn;
      setFn(fn);
      render();
    });
  });

  // Initial render on section visible
  const obs = new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting){
      setFn(currentFn);
      render();
      obs.disconnect();
    }
  },{threshold:0.15});
  obs.observe(document.getElementById('complex'));
})();