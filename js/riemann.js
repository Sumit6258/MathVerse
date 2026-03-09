/* ═══════════════════════════════════════════
   riemann.js — Riemann Zeta Visualization (FIXED)
   Pure canvas rendering, no WebGL dependency
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('riemannCanvas');
  if(!canvas) return;
  canvas.width = 700; canvas.height = 500;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let mode = 'domain';
  let tRange = 50;
  let precision = 40;
  let animating = false, animFrame = null;
  let animT = 0;

  // Known non-trivial zeros of ζ(s) on critical line Re(s)=0.5
  const ZEROS = [14.1347, 21.0220, 25.0109, 30.4249, 32.9351,
    37.5862, 40.9187, 43.3271, 48.0052, 49.7738,
    52.9703, 56.4462, 59.3470, 60.8318, 65.1125,
    67.0798, 69.5465, 72.0672, 75.7047, 77.1448];

  // ── Complex arithmetic ────────────────────
  function zetaApprox(sr, si, N) {
    let zr=0, zi=0;
    for(let n=1; n<=N; n++) {
      const logN = Math.log(n);
      const mag = Math.exp(-sr * logN);
      const ang = -si * logN;
      zr += mag * Math.cos(ang);
      zi += mag * Math.sin(ang);
    }
    return [zr, zi];
  }

  function hsvToRgb(h, s, v) {
    h = ((h % 1) + 1) % 1;
    const i = Math.floor(h*6), f = h*6-i;
    const p=v*(1-s), q=v*(1-f*s), t=v*(1-(1-f)*s);
    const c = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
    return [Math.round(c[0]*255), Math.round(c[1]*255), Math.round(c[2]*255)];
  }

  // ── MODE: Domain Coloring ─────────────────
  function renderDomain() {
    const img = ctx.createImageData(W, H);
    const step = 2;
    for(let py=0; py<H; py+=step) {
      for(let px=0; px<W; px+=step) {
        // Map to complex plane: Re(s) ∈ [-1, 2], Im(s) ∈ [-tRange, tRange]
        const sr = (px/W)*3 - 1;
        const si = ((H-py)/H)*tRange*2 - tRange;
        const [zr, zi] = zetaApprox(sr, si, precision);
        const mag = Math.sqrt(zr*zr + zi*zi);
        const arg = Math.atan2(zi, zr);
        const hue = (arg + Math.PI) / (2*Math.PI);
        const logMag = Math.log(mag+0.001);
        const bright = 0.5 + 0.3*Math.sin(logMag*2);
        const banded = bright * (0.7 + 0.3*Math.sin(logMag*6));
        const [r,g,b] = hsvToRgb(hue, 0.9, Math.max(0.05, Math.min(0.98, banded)));
        for(let dy=0;dy<step;dy++) for(let dx=0;dx<step;dx++) {
          const idx=((py+dy)*W+(px+dx))*4;
          img.data[idx]=r; img.data[idx+1]=g; img.data[idx+2]=b; img.data[idx+3]=255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    // Draw critical line at Re(s)=0.5
    const critX = (0.5+1)/3 * W;
    ctx.beginPath(); ctx.moveTo(critX,0); ctx.lineTo(critX,H);
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5;
    ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
    ctx.font='11px JetBrains Mono';
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillText('Re(s)=½',critX+4,20);

    // Axes labels
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='10px JetBrains Mono';
    ctx.fillText('Re(s)=-1',4,H-5); ctx.fillText('Re(s)=2',W-55,H-5);
    ctx.fillText(`Im(s)=${tRange}`,4,15); ctx.fillText(`Im(s)=-${tRange}`,4,H-18);
  }

  // ── MODE: Zeros visualization ─────────────
  function renderZeros(t=0) {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);

    // Grid
    ctx.strokeStyle='rgba(0,200,255,0.06)'; ctx.lineWidth=0.5;
    for(let i=0;i<=10;i++){
      ctx.beginPath();ctx.moveTo(i*W/10,0);ctx.lineTo(i*W/10,H);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,i*H/10);ctx.lineTo(W,i*H/10);ctx.stroke();
    }

    const critX = W/2;
    // Critical line
    ctx.beginPath();ctx.moveTo(critX,0);ctx.lineTo(critX,H);
    ctx.strokeStyle='rgba(255,215,0,0.3)';ctx.lineWidth=2;ctx.stroke();

    // Critical strip
    const reScale = W/4;
    ctx.fillStyle='rgba(0,200,255,0.04)';
    ctx.fillRect(critX-reScale,0,reScale*2,H);

    // Plot zeta magnitude along critical line as heatmap
    const imScale = H/(tRange*2);
    for(let py=0;py<H;py++) {
      const si = tRange - py/imScale;
      const [zr,zi] = zetaApprox(0.5, si, precision);
      const mag = Math.sqrt(zr*zr+zi*zi);
      const bright = Math.max(0,Math.min(1, 1-mag*0.3));
      const hue = 195+bright*60;
      ctx.fillStyle=`hsla(${hue},100%,${30+bright*40}%,0.8)`;
      ctx.fillRect(critX-2,py,4,1);
    }

    // Known zeros as glowing circles
    ZEROS.forEach((zero, i) => {
      const py = (tRange - zero) * imScale;
      if(py < 0 || py > H) return;
      const phase = (t*2+i*0.3) % (Math.PI*2);
      const glow = 0.6 + 0.4*Math.sin(phase);
      const radius = 6 + 3*Math.sin(phase*2);
      // Outer glow
      const grad = ctx.createRadialGradient(critX,py,0,critX,py,radius*3);
      grad.addColorStop(0,`rgba(0,200,255,${glow*0.8})`);
      grad.addColorStop(1,'rgba(0,200,255,0)');
      ctx.fillStyle=grad;
      ctx.beginPath();ctx.arc(critX,py,radius*3,0,Math.PI*2);ctx.fill();
      // Core
      ctx.beginPath();ctx.arc(critX,py,radius,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${glow})`;ctx.fill();
      // Label
      ctx.font='10px JetBrains Mono';
      ctx.fillStyle='rgba(0,200,255,0.8)';
      ctx.fillText(`t=${zero.toFixed(3)}`,critX+10,py+4);
    });

    // Animate: show traveling point along critical line
    const travY = ((t*30) % (tRange*2));
    const travPy = (tRange - travY) * imScale;
    if(travPy>=0 && travPy<=H){
      ctx.beginPath();ctx.arc(critX,travPy,4,0,Math.PI*2);
      ctx.fillStyle='rgba(255,215,0,0.9)';ctx.fill();
      const [zr,zi] = zetaApprox(0.5, travY, Math.min(20,precision));
      ctx.fillStyle='rgba(255,215,0,0.6)';ctx.font='11px JetBrains Mono';
      ctx.fillText(`|ζ(½+${travY.toFixed(1)}i)|=${Math.sqrt(zr*zr+zi*zi).toFixed(3)}`,critX+15,Math.max(15,travPy));
    }

    ctx.font='13px JetBrains Mono';
    ctx.fillStyle='rgba(255,215,0,0.7)';
    ctx.fillText('Riemann Hypothesis: all non-trivial zeros on Re(s)=½',10,H-15);
  }

  // ── MODE: Critical line spiral ────────────
  function renderCritical(t=0) {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);

    const cx=W/2, cy=H/2;
    const maxT = Math.min(ZEROS[ZEROS.length-1]+5, tRange);
    const scl = Math.min(cx,cy)*0.85;

    // Draw path of ζ(½+it) as t increases
    ctx.beginPath();
    let started=false;
    for(let i=0;i<=200;i++){
      const ti = (i/200)*maxT;
      const [zr,zi] = zetaApprox(0.5, ti, Math.min(20,precision));
      const mag = Math.sqrt(zr*zr+zi*zi);
      const px = cx + (zr/Math.max(1,mag*0.3))*scl*0.3;
      const py = cy - (zi/Math.max(1,mag*0.3))*scl*0.3;
      if(!started){ctx.moveTo(px,py);started=true;}
      else ctx.lineTo(px,py);
    }
    const grad=ctx.createLinearGradient(cx-scl,cy,cx+scl,cy);
    grad.addColorStop(0,'rgba(0,200,255,0.8)');
    grad.addColorStop(0.5,'rgba(191,90,242,0.8)');
    grad.addColorStop(1,'rgba(255,215,0,0.8)');
    ctx.strokeStyle=grad; ctx.lineWidth=1.5; ctx.stroke();

    // Animated point
    const curT = ((t*8) % maxT);
    const [czr,czi] = zetaApprox(0.5, curT, Math.min(20,precision));
    const cmag=Math.sqrt(czr*czr+czi*czi);
    const cpx=cx+(czr/Math.max(1,cmag*0.3))*scl*0.3;
    const cpy=cy-(czi/Math.max(1,cmag*0.3))*scl*0.3;
    ctx.beginPath();ctx.arc(cpx,cpy,6,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fill();
    ctx.beginPath();ctx.arc(cx,cy,6,0,Math.PI*2);
    ctx.fillStyle='rgba(255,215,0,0.7)';ctx.fill();
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cpx,cpy);
    ctx.strokeStyle='rgba(255,215,0,0.3)';ctx.lineWidth=1;ctx.stroke();

    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.7)';
    ctx.fillText(`Path of ζ(½+it) in complex plane, t=${curT.toFixed(2)}`,10,20);
    ctx.fillStyle='rgba(255,215,0,0.6)';
    ctx.fillText(`|ζ|=${cmag.toFixed(3)}  arg=${Math.atan2(czi,czr).toFixed(3)}`,10,H-15);
  }

  // ── MODE: Primes ──────────────────────────
  function renderPrimes() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);

    function sieve(n){
      const s=new Uint8Array(n+1);const p=[];
      for(let i=2;i<=n;i++){if(!s[i]){p.push(i);for(let j=i*i;j<=n;j+=i)s[j]=1;}}
      return p;
    }
    const primes=sieve(500);
    const scaleX=W/500,scaleY=H/30;

    ctx.fillStyle='rgba(0,200,255,0.05)';
    ctx.fillRect(0,0,W,H*0.6);

    primes.forEach(p=>{
      const x=p*scaleX;
      ctx.beginPath();ctx.moveTo(x,H*0.6);ctx.lineTo(x,H*0.6-8);
      ctx.strokeStyle=`rgba(0,200,255,0.6)`;ctx.lineWidth=0.8;ctx.stroke();
    });

    // Li(x) approximation
    ctx.beginPath();
    for(let x=3;x<=500;x++){
      const li=x/Math.log(x);
      const px=x*scaleX,py=H*0.6-li*scaleY*0.8;
      x===3?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.strokeStyle='rgba(255,215,0,0.7)';ctx.lineWidth=2;ctx.stroke();

    // π(x) actual
    ctx.beginPath();
    let count=0,pp=0;
    primes.forEach((p,i)=>{
      count++;
      for(let x=pp+1;x<=p;x++){
        const px=x*scaleX,py=H*0.6-count*scaleY*0.8;
        i===0&&x===2?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }
      pp=p;
    });
    ctx.strokeStyle='rgba(191,90,242,0.7)';ctx.lineWidth=2;ctx.stroke();

    ctx.font='13px JetBrains Mono';
    ctx.fillStyle='rgba(191,90,242,0.8)';ctx.fillText('— π(x) prime counting function',10,25);
    ctx.fillStyle='rgba(255,215,0,0.8)';ctx.fillText('— Li(x) = x/ln(x) approximation',10,45);
    ctx.fillStyle='rgba(0,200,255,0.6)';ctx.fillText('| prime locations',10,65);
    ctx.fillStyle='rgba(255,255,255,0.3)';
    ctx.fillText('Riemann zeros control the error in π(x)',10,H-15);
  }

  const renderFns={domain:renderDomain,zeros:renderZeros,critical:renderCritical,primes:renderPrimes};

  function render(t=0) {
    const fn=renderFns[mode];
    if(fn) fn(t);
  }

  // Controls
  document.getElementById('riemannMode')?.addEventListener('change',e=>{
    mode=e.target.value;
    if(!animating) render(animT);
  });
  document.getElementById('riemannT')?.addEventListener('input',e=>{
    tRange=parseFloat(e.target.value);
    document.getElementById('riemannTVal').textContent=tRange;
    if(!animating) render(animT);
  });
  document.getElementById('riemannPrec')?.addEventListener('input',e=>{
    precision=parseInt(e.target.value);
    document.getElementById('riemannPrecVal').textContent=precision;
    if(!animating) render(animT);
  });

  const animBtn=document.getElementById('riemannAnimate');
  animBtn?.addEventListener('click',()=>{
    animating=!animating;
    animBtn.textContent=animating?'⏸ Pause':'▶ Animate Zeros';
    animBtn.classList.toggle('active-btn',animating);
    if(animating) {
      // Switch to zeros mode for best animation
      document.getElementById('riemannMode').value='zeros';
      mode='zeros';
      startAnimLoop();
    } else {
      if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
    }
  });

  function startAnimLoop() {
    function loop() {
      animT+=0.015;
      render(animT);
      if(animating) animFrame=requestAnimationFrame(loop);
    }
    if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
    loop();
  }

  const obs=new IntersectionObserver(e=>{
    if(e[0].isIntersecting){render(0);obs.disconnect();}
  },{threshold:0.15});
  obs.observe(document.getElementById('riemann'));
})();