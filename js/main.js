/* ═══════════════════════════════════════════
   main.js — Hero, Nav, Famous Visualizations
   ═══════════════════════════════════════════ */

// ── Section reveal on scroll ──────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.section').forEach(s => observer.observe(s));

// ── Nav scroll ────────────────────────────
window.addEventListener('scroll', () => {
  const nb = document.getElementById('navbar');
  nb.style.background = window.scrollY > 50
    ? 'rgba(4,4,8,0.97)' : 'rgba(4,4,8,0.85)';
});

document.getElementById('navToggle').addEventListener('click', () => {
  const nl = document.querySelector('.nav-links');
  nl.style.display = nl.style.display === 'flex' ? 'none' : 'flex';
  if(nl.style.display === 'flex') {
    Object.assign(nl.style, {
      flexDirection:'column', position:'absolute',
      top:'60px', left:0, right:0,
      background:'rgba(4,4,8,0.98)', padding:'1rem 2rem',
      borderBottom:'1px solid rgba(0,200,255,0.12)'
    });
  }
});

// ── Hero Canvas ───────────────────────────
(function initHero() {
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = {x:0,y:0};

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  const FORMULAS = ['∑', '∫', '∂', 'π', 'φ', '∞', 'ℝ', 'ℂ', '∇', '⊗', '√', 'Δ',
    'e^iπ', 'dx', 'dy', 'ℕ', 'ζ(s)', 'Γ', 'λ', 'σ', '∈', '⊂'];

  function createParticles() {
    particles = [];
    for(let i=0;i<120;i++) {
      particles.push({
        x: Math.random()*W, y: Math.random()*H,
        vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
        size: Math.random()*3+1,
        alpha: Math.random()*0.6+0.1,
        type: Math.random()<0.3?'formula':'dot',
        formula: FORMULAS[Math.floor(Math.random()*FORMULAS.length)],
        hue: Math.random()<0.6 ? 195 : Math.random()<0.5 ? 270 : 50,
        pulse: Math.random()*Math.PI*2,
        pulseSpeed: 0.01+Math.random()*0.02
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0,0,W,H);

    // Background nebula glow
    const cx=W*0.5, cy=H*0.5;
    const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(W,H)*0.7);
    grad.addColorStop(0, 'rgba(0,50,100,0.15)');
    grad.addColorStop(0.5, 'rgba(50,0,100,0.08)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    particles.forEach((p,i) => {
      p.x += p.vx + (mouse.x - p.x) * 0.0003;
      p.y += p.vy + (mouse.y - p.y) * 0.0003;
      if(p.x<-50) p.x=W+50; if(p.x>W+50) p.x=-50;
      if(p.y<-50) p.y=H+50; if(p.y>H+50) p.y=-50;
      p.pulse += p.pulseSpeed;
      const a = p.alpha * (0.7 + 0.3*Math.sin(p.pulse));

      // Connect nearby particles
      for(let j=i+1;j<particles.length;j++) {
        const q=particles[j];
        const dx=p.x-q.x, dy=p.y-q.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<120) {
          ctx.beginPath();
          ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
          ctx.strokeStyle = `rgba(0,200,255,${(1-dist/120)*0.08})`;
          ctx.lineWidth=0.5;
          ctx.stroke();
        }
      }

      if(p.type==='formula') {
        ctx.font = `${10+p.size*2}px 'JetBrains Mono'`;
        ctx.fillStyle = `hsla(${p.hue},100%,70%,${a})`;
        ctx.fillText(p.formula, p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x,p.y, p.size, 0, Math.PI*2);
        ctx.fillStyle = `hsla(${p.hue},100%,70%,${a})`;
        ctx.fill();
      }
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createParticles(); });
  window.addEventListener('mousemove', e => { mouse.x=e.clientX; mouse.y=e.clientY; });
  resize(); createParticles(); draw(0);
})();

// ── Famous Visualizations ─────────────────

// 1. Euler's Identity — Complex plane animation
(function initEuler() {
  const canvas = document.getElementById('eulerCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const cx=W/2, cy=H/2, r=90;
  let t=0;

  function draw() {
    ctx.clearRect(0,0,W,H);
    // Axes
    ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();

    // Unit circle
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(0,200,255,0.25)'; ctx.lineWidth=1.5;
    ctx.stroke();

    // Animated arc
    ctx.beginPath();
    ctx.arc(cx,cy,r, 0, t);
    ctx.strokeStyle='rgba(0,200,255,0.7)'; ctx.lineWidth=2;
    ctx.stroke();

    // Point on circle
    const px=cx+r*Math.cos(t), py=cy-r*Math.sin(t);
    ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2);
    ctx.fillStyle='#00c8ff'; ctx.fill();

    // Radius line
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py);
    ctx.strokeStyle='rgba(0,200,255,0.4)'; ctx.lineWidth=1;
    ctx.stroke();

    // Real/Imag projections
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,cy);
    ctx.strokeStyle='rgba(255,215,0,0.4)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(cx,py);
    ctx.strokeStyle='rgba(191,90,242,0.4)'; ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font="12px 'JetBrains Mono'";
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillText('Re', W-25, cy-5);
    ctx.fillText('Im', cx+5, 15);

    // Angle label
    if(t<Math.PI+0.1) {
      ctx.fillStyle='rgba(0,200,255,0.7)';
      ctx.fillText(`θ=${t.toFixed(2)}`, 10, H-10);
    }

    // At π show the -1 point highlight
    if(Math.abs(t - Math.PI) < 0.05) {
      ctx.beginPath(); ctx.arc(cx-r,cy,8,0,Math.PI*2);
      ctx.fillStyle='rgba(255,215,0,0.8)'; ctx.fill();
      ctx.font="bold 13px 'JetBrains Mono'";
      ctx.fillStyle='#ffd700';
      ctx.fillText('e^(iπ) = −1', cx-r-20, cy-15);
    }

    t += 0.012;
    if(t > Math.PI*2+0.5) t = 0;
    requestAnimationFrame(draw);
  }
  draw();
})();

// 2. Fibonacci Spiral
(function initFib() {
  const canvas = document.getElementById('fibCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  let progress=0;

  const fibs = [1,1,2,3,5,8,13,21,34,55,89];
  const scale=3;

  function getFibLayout() {
    // Build rect positions for fibonacci spiral
    const rects=[];
    let x=0,y=0;
    const dirs=[[1,0],[0,-1],[-1,0],[0,1]];
    let dx=1,dy=0,step=0,dirIdx=0;
    for(let i=0;i<fibs.length;i++) {
      const s=fibs[i];
      rects.push({x,y,s,i});
      const dir=dirs[dirIdx%4];
      if(dir[0]!==0) x+=dir[0]*s;
      else y+=dir[1]*s;
      if(i>0) dirIdx++;
    }
    return rects;
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    const rects=getFibLayout();

    // Find bounds
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    rects.forEach(r=>{
      minX=Math.min(minX,r.x); minY=Math.min(minY,r.y);
      maxX=Math.max(maxX,r.x+r.s); maxY=Math.max(maxY,r.y+r.s);
    });
    const bw=maxX-minX, bh=maxY-minY;
    const sc=Math.min((W-40)/bw,(H-40)/bh);
    const ox=(W-bw*sc)/2-minX*sc;
    const oy=(H-bh*sc)/2-minY*sc;

    const showing=Math.floor(progress*fibs.length);
    rects.slice(0,showing+1).forEach((r,i)=>{
      const alpha=i===showing ? (progress*fibs.length-i) : 1;
      const rx=ox+r.x*sc, ry=oy+r.y*sc, rs=r.s*sc;

      // Rectangle
      ctx.globalAlpha=alpha*0.15;
      ctx.fillStyle=i%2===0?'rgba(0,200,255,1)':'rgba(191,90,242,1)';
      ctx.fillRect(rx,ry,rs,rs);
      ctx.globalAlpha=alpha*0.5;
      ctx.strokeStyle=i%2===0?'rgba(0,200,255,1)':'rgba(191,90,242,1)';
      ctx.lineWidth=1;
      ctx.strokeRect(rx,ry,rs,rs);

      // Arc
      if(i<showing) {
        ctx.globalAlpha=alpha*0.8;
        const [sx,sy,ex,ey,arcR] = getArcParams(r,rx,ry,rs,i);
        ctx.beginPath();
        ctx.arc(sx,sy,arcR,ex,ey);
        ctx.strokeStyle='#ffd700'; ctx.lineWidth=1.5;
        ctx.stroke();
      }
      ctx.globalAlpha=1;
    });

    progress+=0.008;
    if(progress>1.1) progress=0;
    requestAnimationFrame(draw);
  }

  function getArcParams(r,rx,ry,rs,i) {
    const corners=[[rx+rs,ry+rs],[-Math.PI,-.5*Math.PI],
                   [rx,ry+rs],[-.5*Math.PI,0],
                   [rx,ry],[0,.5*Math.PI],
                   [rx+rs,ry],[.5*Math.PI,Math.PI]];
    const idx=i%4;
    const cx=corners[idx*2][0], cy=corners[idx*2][1];
    return [cx,cy,corners[idx*2+1][0],corners[idx*2+1][1],rs];
  }

  draw();
})();

// 3. Ulam Spiral
(function initUlam() {
  const canvas = document.getElementById('ulamCanvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const SIZE=71; // odd
  const cellW=W/SIZE, cellH=H/SIZE;

  function isPrime(n) {
    if(n<2) return false;
    if(n===2) return true;
    if(n%2===0) return false;
    for(let i=3;i<=Math.sqrt(n);i+=2) if(n%i===0) return false;
    return true;
  }

  function buildSpiral() {
    const grid=Array.from({length:SIZE},()=>new Array(SIZE).fill(0));
    let x=Math.floor(SIZE/2), y=Math.floor(SIZE/2);
    let n=1, step=1, dx=0, dy=-1;
    grid[y][x]=n++;
    while(n<=SIZE*SIZE) {
      for(let seg=0;seg<2;seg++) {
        for(let i=0;i<step;i++) {
          x+=dx; y+=dy;
          if(x>=0&&x<SIZE&&y>=0&&y<SIZE) grid[y][x]=n++;
        }
        [dx,dy]=[-dy,dx];
      }
      step++;
    }
    return grid;
  }

  const grid=buildSpiral();
  let anim=0;

  function draw() {
    ctx.clearRect(0,0,W,H);
    const t=Math.min(anim/SIZE/SIZE,1);
    let drawn=0;
    for(let y=0;y<SIZE;y++) {
      for(let x=0;x<SIZE;x++) {
        const n=grid[y][x];
        drawn++;
        if(drawn/SIZE/SIZE > t) continue;
        if(isPrime(n)) {
          const brightness=0.5+0.5*(1-n/(SIZE*SIZE));
          ctx.fillStyle=`rgba(0,200,255,${brightness*0.9})`;
          ctx.fillRect(x*cellW+0.5,y*cellH+0.5,cellW-0.5,cellH-0.5);
        }
      }
    }
    if(anim<SIZE*SIZE*1.1) { anim+=300; requestAnimationFrame(draw); }
  }
  draw();
})();

// 4. Fourier Series Animation
(function initFourier() {
  const canvas = document.getElementById('fourierCanvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  let t=0;
  const N=7; // harmonics
  const trail=[];

  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='rgba(4,4,8,0.3)';
    ctx.fillRect(0,0,W,H);

    const cx=W*0.35, cy=H/2;
    let x=cx, y=cy;

    // Draw rotating circles
    for(let n=1;n<=N;n+=2) {
      const r=60/n;
      const angle=n*t;
      const nx=x+r*Math.cos(angle);
      const ny=y+r*Math.sin(angle);

      // Circle
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(0,200,255,${0.15+0.1*(N-n)/N})`;
      ctx.lineWidth=0.8; ctx.stroke();

      // Radius arm
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(nx,ny);
      ctx.strokeStyle=`rgba(0,200,255,${0.5+0.3*(N-n)/N})`;
      ctx.lineWidth=1; ctx.stroke();

      x=nx; y=ny;
    }

    // Trail
    trail.push({x,y});
    if(trail.length>300) trail.shift();

    // Connection line to graph
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(W*0.55, y);
    ctx.strokeStyle='rgba(255,215,0,0.3)'; ctx.lineWidth=0.8;
    ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);

    // Draw trail as wave
    if(trail.length>1) {
      ctx.beginPath();
      trail.forEach((p,i)=>{
        const wx = W*0.55 + i*(W*0.43/300);
        if(i===0) ctx.moveTo(wx,p.y);
        else ctx.lineTo(wx,p.y);
      });
      ctx.strokeStyle='rgba(255,215,0,0.9)'; ctx.lineWidth=1.5;
      ctx.stroke();
    }

    t+=0.04;
    requestAnimationFrame(draw);
  }
  draw();
})();

