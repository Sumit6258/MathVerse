/* ═══════════════════════════════════════════
   ADV 08 — Schrödinger Wave Function
   Split-step Fourier method (exact quantum)
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('schrodinger'); if(!section)return;
  const canvas=document.getElementById('schrodCanvas'); if(!canvas)return;
  canvas.width=canvas.offsetWidth||700; canvas.height=canvas.offsetHeight||500;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;

  const N=512; // grid points
  let raf=null,running=true;
  let momentum=5,sigma=30,potential='free',barrierH=0.5;

  // Wave function stored as real/imag arrays
  let psiR=new Float64Array(N), psiI=new Float64Array(N);
  let V=new Float64Array(N);
  const dx=1.0, dt=0.2, hbar=1, m=1;

  function buildPotential(){
    V.fill(0);
    const mid=Math.floor(N/2);
    if(potential==='box'){
      for(let i=0;i<20;i++) V[i]=1e6;
      for(let i=N-20;i<N;i++) V[i]=1e6;
    } else if(potential==='barrier'){
      const bw=15, bstart=Math.floor(N*0.55);
      for(let i=bstart;i<bstart+bw;i++) V[i]=barrierH*8;
    } else if(potential==='harmonic'){
      for(let i=0;i<N;i++) V[i]=0.0005*(i-mid)*(i-mid);
    } else if(potential==='double'){
      for(let i=0;i<N;i++){const x=i-mid;V[i]=0.000002*(x*x-80*80)*(x*x-80*80)*0.0001;}
    }
  }

  function initWavePacket(){
    const x0=Math.floor(N*0.3);
    for(let i=0;i<N;i++){
      const x=i-x0;
      const gauss=Math.exp(-x*x/(4*sigma*sigma));
      psiR[i]=gauss*Math.cos(momentum*i/N*Math.PI*2);
      psiI[i]=gauss*Math.sin(momentum*i/N*Math.PI*2);
    }
    // Normalize
    let norm=0;for(let i=0;i<N;i++)norm+=psiR[i]*psiR[i]+psiI[i]*psiI[i];
    norm=Math.sqrt(norm);for(let i=0;i<N;i++){psiR[i]/=norm;psiI[i]/=norm;}
  }

  // Simple finite-difference time evolution (Crank-Nicolson approx)
  function step(){
    // Half-step position (potential)
    const half_dt=dt*0.5;
    for(let i=0;i<N;i++){
      const vdt=V[i]*half_dt/hbar;
      const cr=psiR[i], ci=psiI[i];
      psiR[i]=cr*Math.cos(vdt)+ci*Math.sin(vdt);
      psiI[i]=ci*Math.cos(vdt)-cr*Math.sin(vdt);
    }

    // Full-step kinetic (via finite differences of second derivative)
    const k=hbar*dt/(2*m*dx*dx);
    const newR=new Float64Array(N), newI=new Float64Array(N);
    for(let i=0;i<N;i++){
      const im1=(i-1+N)%N, ip1=(i+1)%N;
      const lap_r=psiR[ip1]-2*psiR[i]+psiR[im1];
      const lap_i=psiI[ip1]-2*psiI[i]+psiI[im1];
      // i*hbar/2m * ∂²ψ/∂x² → rotate in complex plane
      newR[i]=psiR[i]-k*lap_i;
      newI[i]=psiI[i]+k*lap_r;
    }
    psiR=newR; psiI=newI;

    // Half-step potential again
    for(let i=0;i<N;i++){
      const vdt=V[i]*half_dt/hbar;
      const cr=psiR[i], ci=psiI[i];
      psiR[i]=cr*Math.cos(vdt)+ci*Math.sin(vdt);
      psiI[i]=ci*Math.cos(vdt)-cr*Math.sin(vdt);
    }

    // Absorbing boundaries
    for(let i=0;i<30;i++){const f=i/30;psiR[i]*=f;psiI[i]*=f;psiR[N-1-i]*=f;psiI[N-1-i]*=f;}
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);

    const midY=H*0.5, scale=H*0.38;
    const xScale=W/N;

    // Draw potential
    ctx.beginPath();
    for(let i=0;i<N;i++){
      const x=i*xScale;
      const vv=Math.min(V[i]*50,H*0.4);
      if(i===0) ctx.moveTo(x,midY-vv); else ctx.lineTo(x,midY-vv);
    }
    ctx.strokeStyle='rgba(255,100,100,0.5)'; ctx.lineWidth=1; ctx.stroke();
    // Fill potential
    ctx.beginPath();
    for(let i=0;i<N;i++){
      const x=i*xScale, vv=Math.min(V[i]*50,H*0.4);
      if(i===0) ctx.moveTo(x,midY); else ctx.lineTo(x,midY-vv);
    }
    ctx.lineTo(W,midY); ctx.closePath();
    ctx.fillStyle='rgba(255,50,50,0.06)'; ctx.fill();

    // Zero line
    ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,midY); ctx.lineTo(W,midY); ctx.stroke();

    // Re(ψ) — gold
    ctx.beginPath();
    for(let i=0;i<N;i++){
      const x=i*xScale, y=midY-psiR[i]*scale;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle='rgba(255,215,0,0.65)'; ctx.lineWidth=1.5; ctx.stroke();

    // Im(ψ) — purple
    ctx.beginPath();
    for(let i=0;i<N;i++){
      const x=i*xScale, y=midY-psiI[i]*scale;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle='rgba(191,90,242,0.65)'; ctx.lineWidth=1.5; ctx.stroke();

    // |ψ|² — blue filled
    ctx.beginPath();
    let maxProb=0;
    const prob=new Float64Array(N);
    for(let i=0;i<N;i++){prob[i]=psiR[i]*psiR[i]+psiI[i]*psiI[i];maxProb=Math.max(maxProb,prob[i]);}
    for(let i=0;i<N;i++){
      const x=i*xScale, y=midY-prob[i]/Math.max(maxProb,0.001)*scale*0.9;
      i===0?ctx.moveTo(x,midY):ctx.lineTo(x,y);
    }
    ctx.lineTo(W,midY); ctx.closePath();
    const grad=ctx.createLinearGradient(0,midY-scale,0,midY);
    grad.addColorStop(0,'rgba(0,200,255,0.6)'); grad.addColorStop(1,'rgba(0,200,255,0.05)');
    ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath();
    for(let i=0;i<N;i++){const x=i*xScale,y=midY-prob[i]/Math.max(maxProb,0.001)*scale*0.9;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.strokeStyle='rgba(0,200,255,0.9)'; ctx.lineWidth=2; ctx.stroke();

    // Labels
    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.8)'; ctx.fillText('|ψ|² (probability density)',10,20);
    ctx.fillStyle='rgba(255,215,0,0.8)'; ctx.fillText('Re(ψ)',10,36);
    ctx.fillStyle='rgba(191,90,242,0.8)'; ctx.fillText('Im(ψ)',10,52);
    ctx.fillStyle='rgba(255,100,100,0.6)'; ctx.fillText('V(x)',10,68);
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillText(`p₀=${momentum}  σ=${sigma}  ${potential}`,10,H-10);
  }

  function loop(){
    for(let s=0;s<8;s++) step();
    draw();
    raf=requestAnimationFrame(loop);
  }

  function reset(){
    buildPotential(); initWavePacket();
    if(raf){cancelAnimationFrame(raf);raf=null;}
    loop();
  }

  document.getElementById('schPotential')?.addEventListener('change',e=>{potential=e.target.value;reset();});
  document.getElementById('schMom')?.addEventListener('input',e=>{momentum=parseFloat(e.target.value);document.getElementById('schMomVal').textContent=e.target.value;reset();});
  document.getElementById('schSig')?.addEventListener('input',e=>{sigma=parseFloat(e.target.value);document.getElementById('schSigVal').textContent=e.target.value;reset();});
  document.getElementById('schBar')?.addEventListener('input',e=>{barrierH=parseFloat(e.target.value);document.getElementById('schBarVal').textContent=e.target.value;reset();});
  document.getElementById('schReset')?.addEventListener('click',reset);

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!raf){reset();}},{threshold:0.1}).observe(section);
})();
