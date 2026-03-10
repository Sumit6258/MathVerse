/* ═══════════════════════════════════════════
   ADV 11 — Lyapunov Fractal
   Stability heatmap of logistic map sequences
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('lyapunov'); if(!section)return;
  const canvas=document.getElementById('lyapCanvas'); if(!canvas)return;
  canvas.width=canvas.offsetWidth||700; canvas.height=canvas.offsetHeight||500;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;

  let seq='AABAB', aMin=2, aMax=4, bMin=2, bMax=4, iters=200;

  function computeLyapunov(a,b){
    const chars=seq.toUpperCase().split('');
    let x=0.5, lyap=0;
    for(let n=0;n<iters;n++){
      const r=chars[n%chars.length]==='A'?a:b;
      x=r*x*(1-x);
      if(x<=0||x>=1) return 10; // escaped
      const dx=Math.abs(r*(1-2*x));
      lyap+=Math.log(Math.max(dx,1e-12));
    }
    return lyap/iters;
  }

  function colorLyap(v){
    if(v>0){
      // Chaos: fiery red-orange
      const t=Math.min(1,v/3);
      return[Math.round(255*Math.min(1,t*2)),Math.round(255*t*0.4),0,255];
    } else {
      // Stable: blue-green to deep blue
      const t=Math.min(1,-v/3);
      return[0,Math.round(100*t),Math.round(50+200*t),255];
    }
  }

  function render(){
    const img=ctx.createImageData(W,H);
    const step=3; // step size for performance
    for(let py=0;py<H;py+=step){
      const b=bMin+(py/H)*(bMax-bMin);
      for(let px=0;px<W;px+=step){
        const a=aMin+(px/W)*(aMax-aMin);
        const v=computeLyapunov(a,b);
        const [r,g,bl,alpha]=colorLyap(v);
        for(let dy=0;dy<step&&py+dy<H;dy++) for(let dx=0;dx<step&&px+dx<W;dx++){
          const idx=((py+dy)*W+(px+dx))*4;
          img.data[idx]=r;img.data[idx+1]=g;img.data[idx+2]=bl;img.data[idx+3]=alpha;
        }
      }
    }
    ctx.putImageData(img,0,0);
    // Axes
    ctx.font='11px JetBrains Mono';
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillText(`a: [${aMin.toFixed(1)},${aMax.toFixed(1)}]`,5,H-18);
    ctx.fillText(`b: [${bMin.toFixed(1)},${bMax.toFixed(1)}]  seq: ${seq}`,5,H-5);
    // Stability line (λ=0 is boundary)
    ctx.fillStyle='rgba(0,200,255,0.7)'; ctx.fillText('■ Stable (λ<0)',W-130,H-18);
    ctx.fillStyle='rgba(255,100,0,0.7)'; ctx.fillText('■ Chaos (λ>0)',W-130,H-5);
  }

  function updateLabels(){
    document.getElementById('lyapAMinV').textContent=aMin.toFixed(1);
    document.getElementById('lyapAMaxV').textContent=aMax.toFixed(1);
    document.getElementById('lyapBMinV').textContent=bMin.toFixed(1);
    document.getElementById('lyapBMaxV').textContent=bMax.toFixed(1);
    document.getElementById('lyapIterV').textContent=iters;
  }

  document.getElementById('lyapRender')?.addEventListener('click',()=>{
    seq=document.getElementById('lyapSeq')?.value||seq;
    aMin=parseFloat(document.getElementById('lyapAMin')?.value||2);
    aMax=parseFloat(document.getElementById('lyapAMax')?.value||4);
    bMin=parseFloat(document.getElementById('lyapBMin')?.value||2);
    bMax=parseFloat(document.getElementById('lyapBMax')?.value||4);
    iters=parseInt(document.getElementById('lyapIter')?.value||200);
    updateLabels(); render();
  });

  ['lyapAMin','lyapAMax','lyapBMin','lyapBMax'].forEach(id=>{
    document.getElementById(id)?.addEventListener('input',()=>{
      aMin=parseFloat(document.getElementById('lyapAMin')?.value||2);
      aMax=parseFloat(document.getElementById('lyapAMax')?.value||4);
      bMin=parseFloat(document.getElementById('lyapBMin')?.value||2);
      bMax=parseFloat(document.getElementById('lyapBMax')?.value||4);
      updateLabels();
    });
  });
  document.getElementById('lyapIter')?.addEventListener('input',e=>{iters=parseInt(e.target.value);document.getElementById('lyapIterV').textContent=e.target.value;});

  new IntersectionObserver(en=>{if(en[0].isIntersecting){render();}},{threshold:0.1}).observe(section);
})();
