/* ═══════════════════════════════════════════
   complex.js — Domain Coloring Explorer
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('complexCanvas');
  if(!canvas) return;
  canvas.width = 700; canvas.height = 500;

  let gl = canvas.getContext('webgl');
  const ctx2d = canvas.getContext('2d');
  let useGL = !!gl;
  let showGrid = true, zoom = 2.0;
  let currentFn = 'z*z';

  // ── Complex arithmetic helpers for CPU ──────────────
  const C = {
    add:(a,b)=>({r:a.r+b.r,i:a.i+b.i}),
    sub:(a,b)=>({r:a.r-b.r,i:a.i-b.i}),
    mul:(a,b)=>({r:a.r*b.r-a.i*b.i,i:a.r*b.i+a.i*b.r}),
    div:(a,b)=>{const d=b.r*b.r+b.i*b.i;return{r:(a.r*b.r+a.i*b.i)/d,i:(a.i*b.r-a.r*b.i)/d}},
    abs:(a)=>Math.sqrt(a.r*a.r+a.i*a.i),
    arg:(a)=>Math.atan2(a.i,a.r),
    exp:(a)=>{const e=Math.exp(a.r);return{r:e*Math.cos(a.i),i:e*Math.sin(a.i)}},
    log:(a)=>({r:Math.log(Math.sqrt(a.r*a.r+a.i*a.i)),i:Math.atan2(a.i,a.r)}),
    pow:(a,n)=>{const r=Math.pow(Math.sqrt(a.r*a.r+a.i*a.i),n),t=Math.atan2(a.i,a.r)*n;return{r:r*Math.cos(t),i:r*Math.sin(t)}},
    sin:(a)=>({r:Math.sin(a.r)*Math.cosh(a.i),i:Math.cos(a.r)*Math.sinh(a.i)}),
    cos:(a)=>({r:Math.cos(a.r)*Math.cosh(a.i),i:-Math.sin(a.r)*Math.sinh(a.i)}),
    tanh:(a)=>{const e2r=Math.exp(2*a.r);const e2i=2*a.i;
      const d=(e2r+1)*(e2r+1)+4*Math.sin(a.i)*Math.sin(a.i)*e2r;
      return{r:(e2r-1)*(e2r+1)/d,i:2*Math.sin(a.i)*Math.cos(a.i)*e2r/d}},
    conj:(a)=>({r:a.r,i:-a.i}),
  };

  function evalComplex(expr, z) {
    const cmul=(a,b)=>C.mul(a,b), cadd=(a,b)=>C.add(a,b),
          csub=(a,b)=>C.sub(a,b), cdiv=(a,b)=>C.div(a,b),
          cexp=(a)=>C.exp(a), clog=(a)=>C.log(a),
          csin=(a)=>C.sin(a), ccos=(a)=>C.cos(a),
          ctanh=(a)=>C.tanh(a), cconj=(a)=>C.conj(a);
    // Handle simple power expressions like z*z or z*z*z
    try {
      const fn = new Function('z','cmul','cadd','csub','cdiv','cexp','clog','csin','ccos','ctanh','cconj',
        `try{return (${expr})}catch(e){return {r:0,i:0}}`);
      return fn(z,cmul,cadd,csub,cdiv,cexp,clog,csin,ccos,ctanh,cconj);
    } catch(e) { return {r:0,i:0}; }
  }

  function hsvToRgb(h,s,v){
    h=(h%(2*Math.PI)+2*Math.PI)%(2*Math.PI)/(2*Math.PI);
    const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
    const c=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
    return [Math.round(c[0]*255),Math.round(c[1]*255),Math.round(c[2]*255)];
  }

  function render() {
    const W=canvas.width, H=canvas.height;
    const ctx=canvas.getContext('2d');
    const img=ctx.createImageData(W,H);

    const step = Math.max(1, Math.floor(W/200));
    for(let py=0;py<H;py+=step){
      for(let px=0;px<W;px+=step){
        const re=(px/W-0.5)*zoom*2*(W/H);
        const im=(0.5-py/H)*zoom*2;
        const z={r:re,i:im};
        let w;
        try { w=evalComplex(currentFn,z); } catch{w={r:0,i:0};}
        const mag=C.abs(w), arg=C.arg(w);
        // Domain coloring: hue=arg, bright based on log magnitude
        const brightness=0.5+0.5*Math.sin(Math.log(mag+0.001)*2);
        const checker=0.5+0.5*(Math.floor(re)+Math.floor(im))%2===0?1:0.85;
        const [r,g,b]=hsvToRgb(arg,0.9,brightness*checker);
        for(let dy=0;dy<step&&py+dy<H;dy++){
          for(let dx=0;dx<step&&px+dx<W;dx++){
            const idx=((py+dy)*W+(px+dx))*4;
            img.data[idx]=r;img.data[idx+1]=g;img.data[idx+2]=b;img.data[idx+3]=255;
          }
        }
      }
    }
    ctx.putImageData(img,0,0);

    if(showGrid) drawGridTransform(ctx,W,H);
  }

  function drawGridTransform(ctx,W,H) {
    const lines=8;
    ctx.globalAlpha=0.4;
    for(let i=-lines;i<=lines;i++){
      // Vertical lines (Re(z)=const)
      ctx.beginPath();
      ctx.strokeStyle=i===0?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.15)';
      ctx.lineWidth=i===0?1.5:0.5;
      let first=true;
      for(let t=-200;t<=200;t++){
        const re=i/lines*zoom*(W/H);
        const im=(t/200)*zoom;
        const z={r:re,i:im};
        let w;
        try{w=evalComplex(currentFn,z);}catch{w={r:0,i:0};}
        const px=(w.r/(zoom*2*(W/H))+0.5)*W;
        const py=(0.5-w.i/(zoom*2))*H;
        if(first){ctx.moveTo(px,py);first=false;}
        else ctx.lineTo(px,py);
      }
      ctx.stroke();

      // Horizontal lines (Im(z)=const)
      ctx.beginPath();
      ctx.strokeStyle=i===0?'rgba(255,150,0,0.6)':'rgba(255,150,0,0.15)';
      ctx.lineWidth=i===0?1.5:0.5;
      first=true;
      for(let t=-200;t<=200;t++){
        const re=(t/200)*zoom*(W/H);
        const im=i/lines*zoom;
        const z={r:re,i:im};
        let w;
        try{w=evalComplex(currentFn,z);}catch{w={r:0,i:0};}
        const px=(w.r/(zoom*2*(W/H))+0.5)*W;
        const py=(0.5-w.i/(zoom*2))*H;
        if(first){ctx.moveTo(px,py);first=false;}
        else ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  // Controls
  document.getElementById('complexInput').addEventListener('keydown',e=>{
    if(e.key==='Enter'){currentFn=e.target.value;render();}
  });
  document.getElementById('complexRender').addEventListener('click',()=>{
    currentFn=document.getElementById('complexInput').value;
    render();
  });
  document.getElementById('complexGrid').addEventListener('change',e=>{
    showGrid=e.target.checked; render();
  });
  document.getElementById('complexZoom').addEventListener('input',e=>{
    zoom=parseFloat(e.target.value);
    document.getElementById('complexZoomVal').textContent=zoom.toFixed(1);
    render();
  });
  document.querySelectorAll('.cpreset').forEach(btn=>{
    btn.addEventListener('click',()=>{
      currentFn=btn.dataset.fn;
      document.getElementById('complexInput').value=currentFn;
      render();
    });
  });

  const obs=new IntersectionObserver(e=>{
    if(e[0].isIntersecting){render();obs.disconnect();}
  },{threshold:0.2});
  obs.observe(document.getElementById('complex'));
})();
