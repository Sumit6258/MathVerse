/* ═══════════════════════════════════════════
   ADV 12 — Kuramoto Oscillator Network
   Emergent synchronization simulation
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('kuramoto'); if(!section)return;
  const canvas=document.getElementById('kuramotoCanvas'); if(!canvas)return;
  canvas.width=canvas.offsetWidth||600; canvas.height=canvas.offsetHeight||500;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;

  const opCanvas=document.getElementById('kurOrderPlot');
  const opCtx=opCanvas?.getContext('2d');
  const OW=opCanvas?.width||240, OH=opCanvas?.height||100;

  let N=40, K=2.0, sigFreq=1.0;
  let phases=[], freqs=[], raf=null;
  const orderHistory=[];
  let t=0;

  function init(){
    phases=[], freqs=[];
    for(let i=0;i<N;i++){
      phases.push(Math.random()*Math.PI*2);
      freqs.push((Math.random()-0.5)*2*sigFreq*2);
    }
    orderHistory.length=0;
  }

  function step(dt){
    const newPhases=new Array(N);
    let sx=0, sy=0;
    for(let i=0;i<N;i++){sx+=Math.cos(phases[i]);sy+=Math.sin(phases[i]);}
    const r=Math.sqrt(sx*sx+sy*sy)/N;
    const psi=Math.atan2(sy,sx);
    for(let i=0;i<N;i++){
      const dph=freqs[i]+K*r*Math.sin(psi-phases[i]);
      newPhases[i]=phases[i]+dph*dt;
    }
    phases=newPhases;
    orderHistory.push(r);
    if(orderHistory.length>300) orderHistory.shift();
    return r;
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);

    const cx=W/2, cy=H/2, outerR=Math.min(W,H)*0.38, innerR=Math.min(W,H)*0.22;

    // Order circle
    let sx=0,sy=0;
    for(let i=0;i<N;i++){sx+=Math.cos(phases[i]);sy+=Math.sin(phases[i]);}
    const r=Math.sqrt(sx*sx+sy*sy)/N;
    const psi=Math.atan2(sy,sx);

    // Background ring
    ctx.beginPath(); ctx.arc(cx,cy,outerR,0,Math.PI*2);
    ctx.strokeStyle='rgba(0,200,255,0.08)'; ctx.lineWidth=1; ctx.stroke();

    // Order parameter arrow
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+r*outerR*Math.cos(psi),cy+r*outerR*Math.sin(psi));
    ctx.strokeStyle=`rgba(255,215,0,${0.4+r*0.6})`; ctx.lineWidth=3; ctx.stroke();
    // Arrow head
    ctx.beginPath(); ctx.arc(cx+r*outerR*Math.cos(psi),cy+r*outerR*Math.sin(psi),6,0,Math.PI*2);
    ctx.fillStyle='rgba(255,215,0,0.9)'; ctx.fill();

    // Oscillators
    for(let i=0;i<N;i++){
      const px=cx+outerR*Math.cos(phases[i]);
      const py=cy+outerR*Math.sin(phases[i]);
      const vel=freqs[i];
      const hue=(vel+sigFreq*2)/(sigFreq*4)*0.8;
      const c=new THREE?.Color?.()?.setHSL(hue,0.9,0.6)||null;
      const hsl2hex=(h,s,l)=>{
        h=((h%1)+1)%1; const c2=(1-Math.abs(2*l-1))*s,x=c2*(1-Math.abs((h*6)%2-1)),m=l-c2/2;
        let r=0,g=0,b=0;
        if(h<1/6){r=c2;g=x;}else if(h<2/6){r=x;g=c2;}else if(h<3/6){g=c2;b=x;}
        else if(h<4/6){g=x;b=c2;}else if(h<5/6){r=x;b=c2;}else{r=c2;b=x;}
        return`rgb(${Math.round((r+m)*255)},${Math.round((g+m)*255)},${Math.round((b+m)*255)})`;
      };
      const col=hsl2hex(hue,0.9,0.6);
      // Phase line to center
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py);
      ctx.strokeStyle=col.replace('rgb','rgba').replace(')',',0.12)'); ctx.lineWidth=0.5; ctx.stroke();
      // Oscillator dot
      ctx.beginPath(); ctx.arc(px,py,4+r*3,0,Math.PI*2);
      ctx.fillStyle=col; ctx.fill();
      // Glow for synchronized
      if(r>0.7){
        const grad=ctx.createRadialGradient(px,py,0,px,py,10+r*5);
        grad.addColorStop(0,col.replace('rgb','rgba').replace(')',',0.5)'));
        grad.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(px,py,10+r*5,0,Math.PI*2); ctx.fill();
      }
    }

    // Inner order indicator
    ctx.beginPath(); ctx.arc(cx,cy,innerR*r,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,215,0,${0.2+r*0.5})`; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle=`rgba(255,215,0,${r*0.1})`; ctx.fill();

    // Stats
    ctx.font='bold 14px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.85)'; ctx.fillText(`r = ${r.toFixed(3)}`,10,24);
    const syncState=r<0.3?'Incoherent':r<0.6?'Partial Sync':r<0.9?'Synchronizing':'Synchronized!';
    const syncCol=r<0.3?'rgba(255,100,100,0.7)':r<0.6?'rgba(255,165,0,0.8)':'rgba(0,200,255,0.9)';
    ctx.fillStyle=syncCol; ctx.fillText(syncState,10,42);
    ctx.font='11px JetBrains Mono';
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillText(`N=${N} K=${K.toFixed(1)} σ=${sigFreq.toFixed(1)} t=${t.toFixed(0)}`,10,H-8);
    document.getElementById('kurOrder').textContent=r.toFixed(3);
    document.getElementById('kurSync').textContent=syncState;
  }

  function drawOrderPlot(){
    if(!opCtx||orderHistory.length<2)return;
    opCtx.clearRect(0,0,OW,OH); opCtx.fillStyle='#030307'; opCtx.fillRect(0,0,OW,OH);
    // Threshold K_c ≈ 2σ/π
    const kc=2*sigFreq/Math.PI;
    opCtx.font='9px JetBrains Mono';
    opCtx.fillStyle='rgba(255,255,255,0.2)';
    opCtx.fillText('r(t) order parameter',2,10);
    opCtx.strokeStyle='rgba(255,215,0,0.3)'; opCtx.lineWidth=0.5;
    opCtx.setLineDash([3,3]);
    opCtx.beginPath(); opCtx.moveTo(0,OH*0.5); opCtx.lineTo(OW,OH*0.5);
    opCtx.stroke(); opCtx.setLineDash([]);
    opCtx.beginPath();
    orderHistory.forEach((v,i)=>{const x=i/orderHistory.length*OW,y=OH-(v*OH*0.9+OH*0.05);i===0?opCtx.moveTo(x,y):opCtx.lineTo(x,y);});
    opCtx.strokeStyle='rgba(0,200,255,0.8)'; opCtx.lineWidth=1.5; opCtx.stroke();
  }

  function loop(){
    for(let s=0;s<5;s++) step(0.05);
    t+=0.25;
    draw();
    drawOrderPlot();
    raf=requestAnimationFrame(loop);
  }

  document.getElementById('kurN')?.addEventListener('input',e=>{N=parseInt(e.target.value);document.getElementById('kurNVal').textContent=e.target.value;init();});
  document.getElementById('kurK')?.addEventListener('input',e=>{K=parseFloat(e.target.value);document.getElementById('kurKVal').textContent=e.target.value;});
  document.getElementById('kurSig')?.addEventListener('input',e=>{sigFreq=parseFloat(e.target.value);document.getElementById('kurSigVal').textContent=e.target.value;init();});
  document.getElementById('kurReset')?.addEventListener('click',init);

  new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!raf){init();loop();}
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
  },{threshold:0.1}).observe(section);
})();
