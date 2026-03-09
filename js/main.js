/* ═══════════════════════════════════════════
   main.js — Hero, Nav, Mathematical Icons
   ═══════════════════════════════════════════ */

// ── Section reveal ────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.section').forEach(s => observer.observe(s));

// ── Nav scroll ────────────────────────────
window.addEventListener('scroll', () => {
  const nb = document.getElementById('navbar');
  nb.style.background = window.scrollY > 50
    ? 'rgba(3,3,7,0.98)' : 'rgba(3,3,7,0.88)';
});

document.getElementById('navToggle')?.addEventListener('click', () => {
  const nl = document.querySelector('.nav-links');
  const open = nl.style.display === 'flex';
  if(open){ nl.style.display=''; }
  else {
    Object.assign(nl.style, {
      display:'flex', flexDirection:'column', position:'absolute',
      top:'52px', left:0, right:0, background:'rgba(3,3,7,0.98)',
      padding:'1rem 1.5rem', borderBottom:'1px solid rgba(0,200,255,0.12)', zIndex:999
    });
  }
});

// ── Hero Canvas ───────────────────────────
(function initHero() {
  const canvas = document.getElementById('heroCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = {x:0,y:0};

  const FORMULAS = ['∑','∫','∂','π','φ','∞','ℝ','ℂ','∇','√','Δ','e^iπ','dx','ζ(s)','Γ','λ','σ','∈','⊂','±','≠','≈'];

  function resize(){ W=canvas.width=canvas.offsetWidth; H=canvas.height=canvas.offsetHeight; }

  function createParticles() {
    particles = [];
    for(let i=0;i<130;i++) {
      particles.push({
        x:Math.random()*W, y:Math.random()*H,
        vx:(Math.random()-0.5)*0.4, vy:(Math.random()-0.5)*0.4,
        size:Math.random()*3+1, alpha:Math.random()*0.6+0.1,
        type:Math.random()<0.3?'formula':'dot',
        formula:FORMULAS[Math.floor(Math.random()*FORMULAS.length)],
        hue:Math.random()<0.6?195:Math.random()<0.5?270:50,
        pulse:Math.random()*Math.PI*2, pulseSpeed:0.01+Math.random()*0.02
      });
    }
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    const grad=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.min(W,H)*0.7);
    grad.addColorStop(0,'rgba(0,50,100,0.15)');
    grad.addColorStop(0.5,'rgba(50,0,100,0.08)');
    grad.addColorStop(1,'transparent');
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

    particles.forEach((p,i)=>{
      p.x+=p.vx+(mouse.x-p.x)*0.0003; p.y+=p.vy+(mouse.y-p.y)*0.0003;
      if(p.x<-50)p.x=W+50; if(p.x>W+50)p.x=-50;
      if(p.y<-50)p.y=H+50; if(p.y>H+50)p.y=-50;
      p.pulse+=p.pulseSpeed;
      const a=p.alpha*(0.7+0.3*Math.sin(p.pulse));
      for(let j=i+1;j<particles.length;j++){
        const q=particles[j], dx=p.x-q.x, dy=p.y-q.y, dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<120){
          ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
          ctx.strokeStyle=`rgba(0,200,255,${(1-dist/120)*0.07})`;ctx.lineWidth=0.5;ctx.stroke();
        }
      }
      if(p.type==='formula'){
        ctx.font=`${10+p.size*2}px 'JetBrains Mono'`;
        ctx.fillStyle=`hsla(${p.hue},100%,70%,${a})`;
        ctx.fillText(p.formula,p.x,p.y);
      } else {
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},100%,70%,${a})`;ctx.fill();
      }
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize',()=>{resize();createParticles();});
  window.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
  resize(); createParticles(); draw();
})();

// ═══════════════════════════════════════════
// MATHEMATICAL ICONS — Pop-out Modal System
// ═══════════════════════════════════════════
(function initIcons() {

  // ── Modal infrastructure ─────────────────
  const overlay = document.getElementById('iconModalOverlay');
  const modalCanvas = document.getElementById('iconModalCanvas');
  const modalTitle = document.getElementById('iconModalTitle');
  const modalFormula = document.getElementById('iconModalFormula');
  const modalDesc = document.getElementById('iconModalDesc');
  const closeBtn = document.getElementById('iconModalClose');

  if(!overlay) return;

  let modalAnimFrame = null;
  const mCtx = modalCanvas?.getContext('2d');

  function openModal(iconId) {
    const def = iconDefs[iconId];
    if(!def||!overlay) return;
    overlay.classList.add('active');
    if(modalTitle)  modalTitle.textContent  = def.title;
    if(modalFormula)modalFormula.innerHTML  = def.formula;
    if(modalDesc)   modalDesc.innerHTML     = def.description;
    // Re-render KaTeX
    if(window.renderMathInElement && modalFormula)
      window.renderMathInElement(modalFormula,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]});
    // Start modal animation
    if(modalAnimFrame){cancelAnimationFrame(modalAnimFrame);modalAnimFrame=null;}
    if(mCtx && def.animate){
      modalCanvas.width  = modalCanvas.offsetWidth  || 700;
      modalCanvas.height = modalCanvas.offsetHeight || 420;
      def.animate(mCtx, modalCanvas.width, modalCanvas.height);
    }
    document.body.style.overflow='hidden';
  }

  function closeModal() {
    if(!overlay) return;
    overlay.classList.remove('active');
    if(modalAnimFrame){cancelAnimationFrame(modalAnimFrame);modalAnimFrame=null;}
    document.body.style.overflow='';
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e=>{ if(e.target===overlay) closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

  document.querySelectorAll('.famous-card').forEach(card=>{
    card.addEventListener('click',()=>openModal(card.dataset.icon));
  });

  // ── Icon animation definitions ────────────
  const iconDefs = {

    euler: {
      title: "Euler's Identity",
      formula: '$$e^{i\\pi} + 1 = 0$$',
      description: `<p>Voted the most beautiful equation in mathematics. It unites the five most fundamental constants:<br>
        <strong style="color:#00c8ff">e</strong> (base of natural log) · 
        <strong style="color:#bf5af2">i</strong> (imaginary unit) · 
        <strong style="color:#ffd700">π</strong> (ratio of circumference to diameter) · 
        <strong style="color:#00ff9d">1</strong> (multiplicative identity) · 
        <strong style="color:#ff7f50">0</strong> (additive identity).</p>
        <p>It is a special case of Euler's formula $e^{i\\theta} = \\cos\\theta + i\\sin\\theta$ evaluated at $\\theta = \\pi$.</p>`,
      animate(ctx, W, H) {
        let t=0;
        const trail=[];
        function frame(){
          ctx.clearRect(0,0,W,H);
          ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);
          const cx=W*0.38, cy=H/2, r=Math.min(W,H)*0.32;
          // Axes
          ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(cx-r-30,cy);ctx.lineTo(cx+r+30,cy);ctx.stroke();
          ctx.beginPath();ctx.moveTo(cx,cy-r-30);ctx.lineTo(cx,cy+r+30);ctx.stroke();
          ctx.fillStyle='rgba(255,255,255,0.35)';ctx.font='12px JetBrains Mono';
          ctx.fillText('Re',cx+r+8,cy+4);ctx.fillText('Im',cx+5,cy-r-8);
          // Unit circle
          ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
          ctx.strokeStyle='rgba(0,200,255,0.2)';ctx.lineWidth=1.5;ctx.stroke();
          // Arc
          ctx.beginPath();ctx.arc(cx,cy,r,0,t);
          ctx.strokeStyle='rgba(0,200,255,0.7)';ctx.lineWidth=2.5;ctx.stroke();
          // Animated point
          const px=cx+r*Math.cos(t), py=cy-r*Math.sin(t);
          trail.push({x:px,y:py});
          if(trail.length>120)trail.shift();
          // Real part projection (gold vertical dashed)
          ctx.setLineDash([5,5]);
          ctx.beginPath();ctx.moveTo(px,cy);ctx.lineTo(px,py);
          ctx.strokeStyle='rgba(255,215,0,0.5)';ctx.lineWidth=1;ctx.stroke();
          // Imag part projection
          ctx.beginPath();ctx.moveTo(cx,py);ctx.lineTo(px,py);
          ctx.strokeStyle='rgba(191,90,242,0.5)';ctx.lineWidth=1;ctx.stroke();
          ctx.setLineDash([]);
          // Radius
          ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,py);
          ctx.strokeStyle='rgba(0,200,255,0.5)';ctx.lineWidth=1.5;ctx.stroke();
          // Point
          ctx.beginPath();ctx.arc(px,py,7,0,Math.PI*2);
          const gd=ctx.createRadialGradient(px,py,0,px,py,7);
          gd.addColorStop(0,'rgba(0,200,255,1)');gd.addColorStop(1,'rgba(0,200,255,0)');
          ctx.fillStyle=gd;ctx.fill();
          ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);
          ctx.fillStyle='#fff';ctx.fill();
          // Right side: wave plots
          const gx=W*0.62, gw=W*0.34, gh=H*0.28;
          ctx.font='11px JetBrains Mono';
          ctx.fillStyle='rgba(255,215,0,0.7)';ctx.fillText('cos(θ) — Re',gx,cy-gh-10);
          ctx.fillStyle='rgba(191,90,242,0.7)';ctx.fillText('sin(θ) — Im',gx,cy+15);
          // Draw cos wave
          ctx.beginPath();
          for(let k=0;k<=100;k++){const tt=k/100*t;const wx=gx+k/100*gw;const wy=cy-gh-Math.cos(tt)*gh;k===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);}
          ctx.strokeStyle='rgba(255,215,0,0.8)';ctx.lineWidth=2;ctx.stroke();
          // Draw sin wave
          ctx.beginPath();
          for(let k=0;k<=100;k++){const tt=k/100*t;const wx=gx+k/100*gw;const wy=cy+gh*0.1+Math.sin(tt)*gh;k===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);}
          ctx.strokeStyle='rgba(191,90,242,0.8)';ctx.lineWidth=2;ctx.stroke();
          // At π show explosion
          if(Math.abs(t-Math.PI)<0.12){
            ctx.font='bold 16px JetBrains Mono';
            ctx.fillStyle='rgba(255,215,0,0.9)';
            ctx.fillText('e^(iπ) = −1 ✓',cx-r-10,cy-r+10);
          }
          ctx.font='13px JetBrains Mono';
          ctx.fillStyle='rgba(0,200,255,0.6)';
          ctx.fillText(`θ = ${t.toFixed(3)} rad`,10,H-10);
          t+=0.015; if(t>Math.PI*2+0.3)t=0;
          modalAnimFrame=requestAnimationFrame(frame);
        }
        frame();
      }
    },

    fibonacci: {
      title: 'Golden Ratio & Fibonacci',
      formula: '$$\\varphi = \\frac{1+\\sqrt{5}}{2} \\approx 1.61803\\ldots = 1 + \\cfrac{1}{1+\\cfrac{1}{1+\\cfrac{1}{\\ddots}}}$$',
      description: `<p>The Golden Ratio φ appears throughout nature: nautilus shells, sunflower spirals, galaxy arms, DNA helices. Each Fibonacci number is the sum of the two before it: $F_n = F_{n-1}+F_{n-2}$. Their ratio converges to φ.</p>
        <p>$F_1=1,\\ F_2=1,\\ F_3=2,\\ F_4=3,\\ F_5=5,\\ F_6=8,\\ F_7=13\\ldots$</p>`,
      animate(ctx,W,H){
        let t=0;
        function frame(){
          ctx.clearRect(0,0,W,H);ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
          const fibs=[1,1,2,3,5,8,13,21,34,55,89];
          let mx=0,my=0,Mx=0,My=0;
          // Build positions
          const rects=[];let x=0,y=0,dirIdx=0;
          const dirs=[[1,0],[0,-1],[-1,0],[0,1]];
          for(let k=0;k<fibs.length;k++){
            const s=fibs[k];rects.push({x,y,s});
            const d=dirs[dirIdx%4];
            if(d[0]!==0)x+=d[0]*s;else y+=d[1]*s;
            if(k>0)dirIdx++;
          }
          rects.forEach(r=>{mx=Math.min(mx,r.x);my=Math.min(my,r.y);Mx=Math.max(Mx,r.x+r.s);My=Math.max(My,r.y+r.s);});
          const sc=Math.min((W-60)/(Mx-mx),(H-60)/(My-my));
          const ox=(W-(Mx-mx)*sc)/2-mx*sc,oy=(H-(My-my)*sc)/2-my*sc;
          const showing=Math.min(rects.length,Math.floor(1+t*rects.length*0.6));
          rects.slice(0,showing).forEach((r,i)=>{
            const rx=ox+r.x*sc,ry=oy+r.y*sc,rs=r.s*sc;
            ctx.globalAlpha=0.18;ctx.fillStyle=i%2===0?'#00c8ff':'#bf5af2';ctx.fillRect(rx,ry,rs,rs);
            ctx.globalAlpha=0.7;ctx.strokeStyle=i%2===0?'rgba(0,200,255,0.9)':'rgba(191,90,242,0.9)';
            ctx.lineWidth=1.2;ctx.strokeRect(rx,ry,rs,rs);
            ctx.globalAlpha=1;
            if(i<showing-1){
              const corners=[[rx+rs,ry],[rx,ry],[rx,ry+rs],[rx+rs,ry+rs]];
              const angles=[[Math.PI*0.5,Math.PI],[0,Math.PI*0.5],[Math.PI*1.5,Math.PI*2],[Math.PI,Math.PI*1.5]];
              const [acx,acy]=corners[i%4];
              const [a1,a2]=angles[i%4];
              ctx.beginPath();ctx.arc(acx,acy,rs,a1,a2);
              ctx.strokeStyle='rgba(255,215,0,0.85)';ctx.lineWidth=2;ctx.stroke();
            }
            // Label
            if(rs>25){
              ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font=`${Math.min(14,rs*0.3)}px JetBrains Mono`;
              ctx.fillText(fibs[i],rx+rs/2-5,ry+rs/2+5);
            }
          });
          // Ratio display
          if(showing>2){
            const ratio=fibs[showing-1]/fibs[showing-2];
            ctx.fillStyle='rgba(255,215,0,0.85)';ctx.font='bold 14px JetBrains Mono';
            ctx.fillText(`F${showing}/F${showing-1} = ${ratio.toFixed(6)} → φ`,10,H-10);
          }
          t+=0.007; if(t>1.2)t=0;
          modalAnimFrame=requestAnimationFrame(frame);
        }
        frame();
      }
    },

    ulam: {
      title: 'Ulam Spiral — Prime Patterns',
      formula: '$$\\pi(x) \\sim \\frac{x}{\\ln x} \\qquad \\text{Prime Number Theorem}$$',
      description: `<p>In 1963 Stanislaw Ulam doodled a spiral of integers during a dull meeting. He noticed primes (marked in blue) fall on diagonal lines — hinting at deep structure in their distribution. The pattern grows more surprising with scale.</p>
        <p>The <strong style="color:#00c8ff">Riemann Hypothesis</strong> would explain the exact distribution of these diagonals.</p>`,
      animate(ctx,W,H){
        const SIZE=101;const cw=W/SIZE,ch=H/SIZE;
        function isPrime(n){if(n<2)return false;if(n<4)return true;if(!(n%2)&&!(n%3))return false;for(let i=5;i*i<=n;i+=6)if(!(n%i)||!(n%(i+2)))return false;return true;}
        const grid=new Array(SIZE*SIZE);let x=Math.floor(SIZE/2),y=x,n=1,dx=0,dy=-1;
        grid[y*SIZE+x]=n++;
        while(n<=SIZE*SIZE){
          for(let seg=0;seg<2;seg++){let step=Math.ceil(n**0.5/2);
            for(let i=0;i<step&&n<=SIZE*SIZE;i++){x+=dx;y+=dy;if(x>=0&&x<SIZE&&y>=0&&y<SIZE)grid[y*SIZE+x]=n++;}}
          [dx,dy]=[-dy,dx];
        }
        let drawn=0;let frm;
        function frame(){
          const batch=200;
          for(let k=0;k<batch&&drawn<SIZE*SIZE;k++,drawn++){
            const px=drawn%SIZE,py=Math.floor(drawn/SIZE);
            const v=grid[py*SIZE+px];
            if(isPrime(v)){
              const bright=0.55+0.45*(1-v/(SIZE*SIZE));
              ctx.fillStyle=`rgba(0,${Math.round(bright*255)},${Math.round(bright*255)},0.9)`;
            } else {
              ctx.fillStyle='rgba(3,3,7,1)';
            }
            ctx.fillRect(px*cw,py*ch,cw,ch);
          }
          ctx.fillStyle='rgba(0,200,255,0.65)';ctx.font='12px JetBrains Mono';
          ctx.clearRect(0,H-22,W,22);ctx.fillStyle='rgba(3,3,7,0.8)';ctx.fillRect(0,H-22,W,22);
          ctx.fillStyle='rgba(0,200,255,0.7)';
          ctx.fillText(`${Math.min(drawn,SIZE*SIZE)} / ${SIZE*SIZE} — ${SIZE}×${SIZE} Ulam Spiral`,10,H-7);
          if(drawn<SIZE*SIZE)modalAnimFrame=requestAnimationFrame(frame);
          else{setTimeout(()=>{drawn=0;ctx.clearRect(0,0,W,H);frame();},3000);}
        }
        ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
        frame();
      }
    },

    fourier: {
      title: 'Fourier Series',
      formula: '$$f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty}\\left[a_n\\cos\\frac{n\\pi x}{L} + b_n\\sin\\frac{n\\pi x}{L}\\right]$$',
      description: `<p>Joseph Fourier (1822) showed every periodic signal decomposes into pure sine waves. This underlies all of modern signal processing — audio, image compression (JPEG), radio, MRI, and quantum mechanics.</p>
        <p>The epicycle animation below shows a square wave being reconstructed by rotating circles — each circle is one harmonic.</p>`,
      animate(ctx,W,H){
        let t=0;const trail=[];const N=15;
        function frame(){
          ctx.clearRect(0,0,W,H);ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
          const cx=W*0.3,cy=H/2;let x=cx,y=cy;
          for(let n=1;n<=N;n+=2){
            const r=80/n, angle=n*t;
            const nx=x+r*Math.cos(angle), ny=y+r*Math.sin(angle);
            ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
            ctx.strokeStyle=`rgba(0,200,255,${0.08+0.1*Math.exp(-n*0.1)})`;ctx.lineWidth=0.8;ctx.stroke();
            ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(nx,ny);
            ctx.strokeStyle=`rgba(0,200,255,${0.6-n*0.03})`;ctx.lineWidth=1.2;ctx.stroke();
            ctx.beginPath();ctx.arc(nx,ny,2,0,Math.PI*2);
            ctx.fillStyle='rgba(0,200,255,0.8)';ctx.fill();
            x=nx;y=ny;
          }
          trail.unshift({x,y});if(trail.length>400)trail.pop();
          // Connection line
          ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(W*0.5,y);
          ctx.strokeStyle='rgba(255,215,0,0.3)';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
          // Wave
          ctx.beginPath();
          trail.forEach((p,i)=>{
            const wx=W*0.5+i*(W*0.48/400);
            i===0?ctx.moveTo(wx,p.y):ctx.lineTo(wx,p.y);
          });
          const gd=ctx.createLinearGradient(W*0.5,0,W,0);
          gd.addColorStop(0,'rgba(255,215,0,1)');gd.addColorStop(1,'rgba(255,215,0,0)');
          ctx.strokeStyle=gd;ctx.lineWidth=2.5;ctx.stroke();
          // Label harmonics
          ctx.font='11px JetBrains Mono';ctx.fillStyle='rgba(255,255,255,0.4)';
          ctx.fillText(`${Math.ceil(N/2)} harmonics → square wave`,W*0.5+5,25);
          ctx.fillText(`t = ${t.toFixed(3)}`,10,H-10);
          t+=0.038;modalAnimFrame=requestAnimationFrame(frame);
        }
        frame();
      }
    },

    mandelbrot: {
      title: 'Mandelbrot Set',
      formula: '$$z_{n+1} = z_n^2 + c, \\quad z_0 = 0, \\quad c \\in \\mathbb{C}$$',
      description: `<p>The Mandelbrot set — the most famous fractal — is the set of complex numbers $c$ for which the orbit of 0 under the map $z\\to z^2+c$ remains bounded. Its boundary has Hausdorff dimension 2 and contains infinite complexity.</p>
        <p>Zoom into any point on its boundary and discover entirely new self-similar universes.</p>`,
      animate(ctx,W,H){
        let zoom=1,zx=-0.5,zy=0,frame_t=0;
        const MAX_ITER=200;
        function hsl(h,s,l){
          const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
          let r=0,g=0,b=0;
          if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
          else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
          return[Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
        }
        const step=3;
        const img=ctx.createImageData(W,H);
        function render(){
          const scale=3/zoom;
          for(let py=0;py<H;py+=step){
            for(let px=0;px<W;px+=step){
              const cr=zx+(px/W-0.5)*scale*(W/H);
              const ci=zy+(py/H-0.5)*scale;
              let zr=0,zi=0,iter=0;
              while(zr*zr+zi*zi<4&&iter<MAX_ITER){
                const nzr=zr*zr-zi*zi+cr; zi=2*zr*zi+ci; zr=nzr; iter++;
              }
              let r=0,g=0,b=0;
              if(iter<MAX_ITER){
                const smooth=iter+1-Math.log2(Math.log2(zr*zr+zi*zi));
                const h=(smooth/MAX_ITER)*360+frame_t;
                [r,g,b]=hsl(h%360,1,0.5);
              }
              for(let dy=0;dy<step;dy++) for(let dx=0;dx<step;dx++){
                const idx=((py+dy)*W+(px+dx))*4;
                img.data[idx]=r;img.data[idx+1]=g;img.data[idx+2]=b;img.data[idx+3]=255;
              }
            }
          }
          ctx.putImageData(img,0,0);
          ctx.font='12px JetBrains Mono';ctx.fillStyle='rgba(255,255,255,0.5)';
          ctx.fillText(`Zoom: ${zoom.toFixed(1)}×  Center: (${zx.toFixed(4)}, ${zy.toFixed(4)}i)`,10,H-10);
        }
        // Zoom toward Seahorse Valley
        function animStep(){
          render();
          zoom*=1.012; frame_t+=0.5;
          if(zoom<200){
            zx+=(-0.7436-zx)*0.008; zy+=(0.1318-zy)*0.008;
          } else { zoom=1;zx=-0.5;zy=0; }
          modalAnimFrame=requestAnimationFrame(animStep);
        }
        animStep();
      }
    },

    pythagorean: {
      title: 'Pythagorean Theorem',
      formula: '$$a^2 + b^2 = c^2$$',
      description: `<p>Known to Babylonians 1000 years before Pythagoras, this theorem is the foundation of Euclidean geometry. There are over 370 known proofs — from the simplest visual rearrangement to algebraic, trigonometric, and even quantum mechanical derivations.</p>
        <p>In $n$ dimensions: $|\\mathbf{v}|^2 = v_1^2 + v_2^2 + \\cdots + v_n^2$</p>`,
      animate(ctx,W,H){
        let t=0;
        function frame(){
          ctx.clearRect(0,0,W,H);ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
          const a=100+40*Math.sin(t*0.4),b=80+30*Math.cos(t*0.3);
          const c=Math.sqrt(a*a+b*b);
          const cx=W/2,cy=H/2+30;
          const Ax=cx-a/2,Ay=cy+b/2;
          const Bx=cx+a/2,By=cy+b/2;
          const Cx=cx-a/2,Cy=cy-b/2;
          // Triangle
          ctx.beginPath();ctx.moveTo(Ax,Ay);ctx.lineTo(Bx,By);ctx.lineTo(Cx,Cy);ctx.closePath();
          ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=2.5;ctx.stroke();
          ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fill();
          // Right angle
          const rs=12;
          ctx.beginPath();ctx.moveTo(Ax+rs,Ay);ctx.lineTo(Ax+rs,Ay-rs);ctx.lineTo(Ax,Ay-rs);
          ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=1;ctx.stroke();
          // Square a²
          ctx.fillStyle='rgba(0,200,255,0.15)';ctx.strokeStyle='rgba(0,200,255,0.7)';ctx.lineWidth=1.5;
          ctx.beginPath();ctx.rect(Ax,Ay,a,a);ctx.fill();ctx.stroke();
          ctx.fillStyle='rgba(0,200,255,0.8)';ctx.font='bold 13px JetBrains Mono';
          ctx.fillText(`a²=${Math.round(a*a)}`,Ax+a/2-20,Ay+a/2+5);
          // Square b²
          ctx.fillStyle='rgba(191,90,242,0.15)';ctx.strokeStyle='rgba(191,90,242,0.7)';
          ctx.beginPath();ctx.rect(Cx-b,Cy,b,b);ctx.fill();ctx.stroke();
          ctx.fillStyle='rgba(191,90,242,0.8)';
          ctx.fillText(`b²=${Math.round(b*b)}`,Cx-b+b/2-20,Cy+b/2+5);
          // Hypotenuse square (rotated)
          const angle=Math.atan2(Cy-Ay,Cx-Ax);
          ctx.save();ctx.translate(Ax,Ay);ctx.rotate(angle);
          ctx.fillStyle='rgba(255,215,0,0.15)';ctx.strokeStyle='rgba(255,215,0,0.7)';
          ctx.beginPath();ctx.rect(0,-c,c,c);ctx.fill();ctx.stroke();
          ctx.restore();
          ctx.fillStyle='rgba(255,215,0,0.85)';
          ctx.fillText(`c²=${Math.round(c*c)}`,cx+c*0.3+20,cy-b*0.3);
          // Equation
          ctx.font='bold 18px JetBrains Mono';
          ctx.fillStyle='rgba(255,255,255,0.85)';
          ctx.fillText(`${Math.round(a*a)} + ${Math.round(b*b)} = ${Math.round(c*c)} ✓`,W/2-100,H-20);
          t+=0.02;modalAnimFrame=requestAnimationFrame(frame);
        }
        frame();
      }
    },

    gaussian: {
      title: 'Gaussian / Normal Distribution',
      formula: '$$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$$',
      description: `<p>The Central Limit Theorem guarantees: the sum of many independent random variables converges to the normal distribution. It governs measurement error, heights, IQ scores, stock returns, and quantum wavefunctions.</p>
        <p>The remarkable identity: $\\displaystyle\\int_{-\\infty}^{\\infty} e^{-x^2}dx = \\sqrt{\\pi}$</p>`,
      animate(ctx,W,H){
        let mu=0,sigma=1,t=0;
        function frame(){
          ctx.clearRect(0,0,W,H);ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
          // Animate sigma
          sigma=0.5+0.8*(1+Math.sin(t*0.4));mu=1.5*Math.sin(t*0.15);
          const sx=W*0.7,sy=H*0.6,rx=W*0.4,ry=H*0.5;
          // Fill under curve
          ctx.beginPath();
          for(let k=0;k<=200;k++){
            const x=(k/200)*6-3, y=Math.exp(-0.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
            const px=sx+x*rx/3, py=sy-y*ry*sigma;
            k===0?ctx.moveTo(px,sy):ctx.lineTo(px,py);
          }
          ctx.lineTo(sx+3*rx/3,sy);ctx.closePath();
          const gd=ctx.createLinearGradient(sx-rx,0,sx+rx,0);
          gd.addColorStop(0,'rgba(0,200,255,0)');gd.addColorStop(0.5,'rgba(0,200,255,0.3)');gd.addColorStop(1,'rgba(0,200,255,0)');
          ctx.fillStyle=gd;ctx.fill();
          // Draw curve
          ctx.beginPath();
          for(let k=0;k<=200;k++){
            const x=(k/200)*6-3, y=Math.exp(-0.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
            const px=sx+x*rx/3, py=sy-y*ry*sigma;
            k===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
          }
          ctx.strokeStyle='rgba(0,200,255,0.95)';ctx.lineWidth=3;ctx.stroke();
          // Std dev markers
          [-2,-1,0,1,2].forEach(s=>{
            const px=sx+(mu+s*sigma)*rx/3;
            ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(px,30);ctx.lineTo(px,sy);
            ctx.strokeStyle=s===0?'rgba(255,215,0,0.5)':'rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.stroke();
            ctx.setLineDash([]);
            ctx.font='11px JetBrains Mono';ctx.fillStyle='rgba(255,255,255,0.4)';
            ctx.fillText(s===0?'μ':`${s>0?'+':''}${s}σ`,px-10,sy+15);
          });
          // Baseline
          ctx.beginPath();ctx.moveTo(sx-rx*1.1,sy);ctx.lineTo(sx+rx*1.1,sy);
          ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.setLineDash([]);ctx.stroke();
          ctx.font='13px JetBrains Mono';ctx.fillStyle='rgba(0,200,255,0.7)';
          ctx.fillText(`μ = ${mu.toFixed(2)}   σ = ${sigma.toFixed(2)}`,10,25);
          ctx.fillStyle='rgba(255,215,0,0.6)';
          ctx.fillText('68.2% within ±1σ  |  95.4% within ±2σ',10,H-10);
          t+=0.025;modalAnimFrame=requestAnimationFrame(frame);
        }
        frame();
      }
    },

    basel: {
      title: 'Basel Problem — Euler\'s Sum',
      formula: '$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{1}{1} + \\frac{1}{4} + \\frac{1}{9} + \\frac{1}{16} + \\cdots = \\frac{\\pi^2}{6}$$',
      description: `<p>Solved by Euler in 1734 — a result that stunned the mathematical world. Why would the squares of the integers be related to π, the ratio of a circle's circumference to its diameter?</p>
        <p>Euler's elegant proof uses the product formula for $\\sin(x)$. This result is directly connected to the Riemann zeta function: $\\zeta(2) = \\pi^2/6$.</p>`,
      animate(ctx,W,H){
        let terms=0,sum=0;
        function frame(){
          if(terms<500)for(let i=0;i<3;i++){terms++;sum+=1/(terms*terms);}
          ctx.clearRect(0,0,W,H);ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
          const target=Math.PI*Math.PI/6;
          const maxTerms=500,barW=(W-40)/maxTerms;
          // Draw bars for 1/n²
          for(let n=1;n<=Math.min(terms,maxTerms);n++){
            const h=(1/(n*n))*H*0.55;
            const x=20+(n-1)*barW;
            const frac=n/terms;
            ctx.fillStyle=`hsla(${200+frac*160},100%,60%,0.8)`;
            ctx.fillRect(x,H*0.65-h,Math.max(barW-0.3,0.3),h);
          }
          // Partial sum meter
          const meterX=40,meterY=H*0.82,meterW=W-80,meterH=22;
          ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;
          ctx.strokeRect(meterX,meterY,meterW,meterH);
          const fillW=(sum/target)*meterW;
          const gd=ctx.createLinearGradient(meterX,0,meterX+meterW,0);
          gd.addColorStop(0,'rgba(0,200,255,0.8)');gd.addColorStop(1,'rgba(255,215,0,0.8)');
          ctx.fillStyle=gd;ctx.fillRect(meterX,meterY,Math.min(fillW,meterW),meterH);
          // Target line
          ctx.beginPath();ctx.moveTo(meterX+meterW,meterY);ctx.lineTo(meterX+meterW,meterY+meterH);
          ctx.strokeStyle='rgba(255,215,0,0.8)';ctx.lineWidth=2;ctx.stroke();
          ctx.font='bold 15px JetBrains Mono';ctx.fillStyle='rgba(0,200,255,0.85)';
          ctx.fillText(`Sum after ${terms} terms: ${sum.toFixed(8)}`,10,25);
          ctx.fillStyle='rgba(255,215,0,0.85)';
          ctx.fillText(`π²/6 = ${target.toFixed(8)}`,10,48);
          ctx.fillStyle='rgba(255,255,255,0.5)';
          ctx.fillText(`Error: ${(target-sum).toExponential(3)}`,10,70);
          ctx.fillText('Progress to π²/6:',meterX,meterY-8);
          if(terms>=maxTerms){setTimeout(()=>{terms=0;sum=0;},2000);}
          modalAnimFrame=requestAnimationFrame(frame);
        }
        frame();
      }
    },
  }; // end iconDefs

  // Wire up card clicks
  document.querySelectorAll('.famous-card').forEach(card=>{
    card.style.cursor='pointer';
    card.addEventListener('click',()=>openModal(card.dataset.icon));
  });

})(); // end initIcons

// ── Small card canvases (unchanged from before) ──────
(function initSmallCards(){
  // Euler small
  (function(){
    const canvas=document.getElementById('eulerCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;let t=0;
    function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
      const cx=W/2,cy=H/2,r=75;
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='rgba(0,200,255,0.2)';ctx.lineWidth=1;ctx.stroke();
      ctx.beginPath();ctx.arc(cx,cy,r,0,t);ctx.strokeStyle='rgba(0,200,255,0.7)';ctx.lineWidth=2;ctx.stroke();
      const px=cx+r*Math.cos(t),py=cy-r*Math.sin(t);
      ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,cy);ctx.strokeStyle='rgba(255,215,0,0.4)';ctx.lineWidth=1;ctx.stroke();
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(cx,py);ctx.strokeStyle='rgba(191,90,242,0.4)';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,py);ctx.strokeStyle='rgba(0,200,255,0.5)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fillStyle='#00c8ff';ctx.fill();
      t+=0.015;if(t>Math.PI*2+0.2)t=0;requestAnimationFrame(draw);}
    draw();
  })();
  // Fibonacci small
  (function(){
    const canvas=document.getElementById('fibCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;let p=0;
    const fibs=[1,1,2,3,5,8,13,21,34,55,89];
    function draw(){ctx.clearRect(0,0,W,H);
      const rects=[];let x=0,y=0,dIdx=0;const dirs=[[1,0],[0,-1],[-1,0],[0,1]];
      for(let k=0;k<fibs.length;k++){const s=fibs[k];rects.push({x,y,s});const d=dirs[dIdx%4];if(d[0])x+=d[0]*s;else y+=d[1]*s;if(k>0)dIdx++;}
      let mx=Infinity,my=Infinity,Mx=-Infinity,My=-Infinity;
      rects.forEach(r=>{mx=Math.min(mx,r.x);my=Math.min(my,r.y);Mx=Math.max(Mx,r.x+r.s);My=Math.max(My,r.y+r.s);});
      const sc=Math.min((W-20)/(Mx-mx),(H-20)/(My-my));
      const ox=(W-(Mx-mx)*sc)/2-mx*sc,oy=(H-(My-my)*sc)/2-my*sc;
      const showing=Math.floor(p*fibs.length);
      rects.slice(0,showing+1).forEach((r,i)=>{
        const rx=ox+r.x*sc,ry=oy+r.y*sc,rs=r.s*sc;
        ctx.globalAlpha=0.12;ctx.fillStyle=i%2?'#bf5af2':'#00c8ff';ctx.fillRect(rx,ry,rs,rs);
        ctx.globalAlpha=0.5;ctx.strokeStyle=i%2?'#bf5af2':'#00c8ff';ctx.lineWidth=1;ctx.strokeRect(rx,ry,rs,rs);
        ctx.globalAlpha=1;
        if(i<showing){
          const corners=[[rx+rs,ry],[rx,ry],[rx,ry+rs],[rx+rs,ry+rs]];
          const angles=[[Math.PI*.5,Math.PI],[0,Math.PI*.5],[Math.PI*1.5,Math.PI*2],[Math.PI,Math.PI*1.5]];
          ctx.beginPath();ctx.arc(corners[i%4][0],corners[i%4][1],rs,angles[i%4][0],angles[i%4][1]);
          ctx.strokeStyle='rgba(255,215,0,0.7)';ctx.lineWidth=1.5;ctx.stroke();
        }
      });
      p+=0.007;if(p>1.1)p=0;requestAnimationFrame(draw);}
    draw();
  })();
  // Ulam small
  (function(){
    const canvas=document.getElementById('ulamCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
    const SZ=61;const cw=W/SZ,ch=H/SZ;
    function isPrime(n){if(n<2)return false;for(let i=2;i*i<=n;i++)if(!(n%i))return false;return true;}
    const grid=new Array(SZ*SZ);let x=Math.floor(SZ/2),y=x,n=1,dx=0,dy=-1;
    grid[y*SZ+x]=n++;
    while(n<=SZ*SZ){for(let seg=0;seg<2;seg++){let step=Math.ceil(n**0.4);for(let i=0;i<step&&n<=SZ*SZ;i++){x+=dx;y+=dy;if(x>=0&&x<SZ&&y>=0&&y<SZ)grid[y*SZ+x]=n++;}}[dx,dy]=[-dy,dx];}
    let anim=0;
    function draw(){const t=Math.min(anim/(SZ*SZ),1);
      for(let j=0;j<SZ;j++) for(let i=0;i<SZ;i++){
        const v=grid[j*SZ+i]||0;if((j*SZ+i)/(SZ*SZ)>t)continue;
        if(isPrime(v)){ctx.fillStyle=`rgba(0,${Math.round(180+75*(1-v/(SZ*SZ)))},255,0.9)`;ctx.fillRect(i*cw,j*ch,cw,ch);}
        else{ctx.fillStyle='rgba(3,3,7,1)';ctx.fillRect(i*cw,j*ch,cw,ch);}
      }
      anim+=250;if(anim<SZ*SZ*1.1)requestAnimationFrame(draw);}
    ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);draw();
  })();
  // Fourier small
  (function(){
    const canvas=document.getElementById('fourierCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
    let t=0;const trail=[];const N=7;
    function draw(){
      ctx.clearRect(0,0,W,H);ctx.fillStyle='rgba(3,3,7,0.3)';ctx.fillRect(0,0,W,H);
      const cx=W*0.35,cy=H/2;let x=cx,y=cy;
      for(let n=1;n<=N;n+=2){const r=55/n,angle=n*t;const nx=x+r*Math.cos(angle),ny=y+r*Math.sin(angle);
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=`rgba(0,200,255,${0.1+0.05*(N-n)/N})`;ctx.lineWidth=0.7;ctx.stroke();
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(nx,ny);ctx.strokeStyle=`rgba(0,200,255,${0.5+0.2*(N-n)/N})`;ctx.lineWidth=1;ctx.stroke();
        x=nx;y=ny;}
      trail.push({x,y});if(trail.length>280)trail.shift();
      ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(W*0.55,y);ctx.strokeStyle='rgba(255,215,0,0.25)';ctx.lineWidth=0.8;ctx.stroke();ctx.setLineDash([]);
      if(trail.length>1){ctx.beginPath();trail.forEach((p,i)=>{const wx=W*0.55+i*(W*0.43/280);i===0?ctx.moveTo(wx,p.y):ctx.lineTo(wx,p.y);});ctx.strokeStyle='rgba(255,215,0,0.85)';ctx.lineWidth=1.5;ctx.stroke();}
      t+=0.04;requestAnimationFrame(draw);}
    draw();
  })();
})();

// ── Small preview canvases for 4 new cards ──────────────
(function initNewSmallCards() {

  // Mandelbrot small preview
  (function(){
    const canvas=document.getElementById('mandelbrotSmall');if(!canvas)return;
    const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
    const MAX=120;
    function hsl2rgb(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
      let r=0,g=0,b=0;if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
      else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
      return[Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];}
    const img=ctx.createImageData(W,H);
    const step=3;
    for(let py=0;py<H;py+=step)for(let px=0;px<W;px+=step){
      const cr=(px/W)*3.2-2.2,ci=(py/H)*2.4-1.2;
      let zr=0,zi=0,n=0;
      while(zr*zr+zi*zi<4&&n<MAX){const nzr=zr*zr-zi*zi+cr;zi=2*zr*zi+ci;zr=nzr;n++;}
      let r=0,g=0,b=0;
      if(n<MAX){const sm=n+1-Math.log2(Math.log2(zr*zr+zi*zi));[r,g,b]=hsl2rgb((sm/MAX*360+220)%360,1,0.55);}
      for(let dy=0;dy<step;dy++)for(let dx=0;dx<step;dx++){const i=((py+dy)*W+(px+dx))*4;img.data[i]=r;img.data[i+1]=g;img.data[i+2]=b;img.data[i+3]=255;}
    }
    ctx.putImageData(img,0,0);
    ctx.font='11px JetBrains Mono';ctx.fillStyle='rgba(0,200,255,0.6)';
    ctx.fillText('Mandelbrot Set — click to zoom',8,H-8);
  })();

  // Pythagorean small
  (function(){
    const canvas=document.getElementById('pythagoreanSmall');if(!canvas)return;
    const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
    let t=0;
    function draw(){
      ctx.clearRect(0,0,W,H);ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
      const a=70+20*Math.sin(t*0.5),b=55+18*Math.cos(t*0.3),c=Math.sqrt(a*a+b*b);
      const cx=W/2,cy=H/2+20;
      const Ax=cx-a/2,Ay=cy+b/2,Bx=cx+a/2,By=cy+b/2,Cx=cx-a/2,Cy=cy-b/2;
      ctx.beginPath();ctx.moveTo(Ax,Ay);ctx.lineTo(Bx,By);ctx.lineTo(Cx,Cy);ctx.closePath();
      ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fill();
      // Square a
      ctx.fillStyle='rgba(0,200,255,0.12)';ctx.strokeStyle='rgba(0,200,255,0.6)';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.rect(Ax,Ay,a,Math.min(a,50));ctx.fill();ctx.stroke();
      ctx.fillStyle='rgba(0,200,255,0.7)';ctx.font='11px JetBrains Mono';ctx.fillText(`a²`,Ax+a/2-8,Ay+22);
      // Square b
      ctx.fillStyle='rgba(191,90,242,0.12)';ctx.strokeStyle='rgba(191,90,242,0.6)';
      ctx.beginPath();ctx.rect(Cx-Math.min(b,50),Cy,Math.min(b,50),b);ctx.fill();ctx.stroke();
      ctx.fillStyle='rgba(191,90,242,0.7)';ctx.fillText(`b²`,Cx-38,Cy+b/2+4);
      ctx.fillStyle='rgba(255,215,0,0.8)';
      ctx.fillText(`a²+b²=c² ✓`,W/2-45,H-8);
      t+=0.02;requestAnimationFrame(draw);}
    draw();
  })();

  // Gaussian small
  (function(){
    const canvas=document.getElementById('gaussianSmall');if(!canvas)return;
    const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
    let t=0;
    function draw(){
      ctx.clearRect(0,0,W,H);ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
      const sigma=0.6+0.5*(1+Math.sin(t*0.5));
      const sx=W/2,sy=H*0.72,rx=W*0.42,ry=H*0.55;
      ctx.beginPath();
      for(let k=0;k<=200;k++){const x=(k/200)*6-3;const y=Math.exp(-0.5*(x/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
        const px=sx+x*rx/3,py=sy-y*ry*sigma;k===0?ctx.moveTo(px,sy):ctx.lineTo(px,py);}
      ctx.lineTo(sx+rx,sy);ctx.closePath();
      const gd=ctx.createLinearGradient(sx-rx,0,sx+rx,0);
      gd.addColorStop(0,'rgba(0,200,255,0)');gd.addColorStop(0.5,'rgba(0,200,255,0.25)');gd.addColorStop(1,'rgba(0,200,255,0)');
      ctx.fillStyle=gd;ctx.fill();
      ctx.beginPath();
      for(let k=0;k<=200;k++){const x=(k/200)*6-3;const y=Math.exp(-0.5*(x/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
        ctx.lineTo(sx+x*rx/3,sy-y*ry*sigma);}
      ctx.strokeStyle='rgba(0,200,255,0.9)';ctx.lineWidth=2.5;ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx-rx*1.1,sy);ctx.lineTo(sx+rx*1.1,sy);ctx.stroke();
      ctx.font='11px JetBrains Mono';ctx.fillStyle='rgba(0,200,255,0.6)';
      ctx.fillText(`σ = ${sigma.toFixed(2)}`,10,20);
      t+=0.025;requestAnimationFrame(draw);}
    draw();
  })();

  // Basel small
  (function(){
    const canvas=document.getElementById('baselSmall');if(!canvas)return;
    const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
    const target=Math.PI*Math.PI/6;
    let terms=0,sum=0,phase=0;
    function draw(){
      if(terms<300)for(let i=0;i<2;i++){terms++;sum+=1/(terms*terms);}
      ctx.clearRect(0,0,W,H);ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
      const maxN=Math.min(terms,200),barW=(W-20)/maxN;
      for(let n=1;n<=maxN;n++){
        const h=(1/(n*n))*H*0.58;const x=10+(n-1)*barW;
        ctx.fillStyle=`hsla(${200+n/maxN*140},100%,58%,0.8)`;
        ctx.fillRect(x,H*0.72-h,Math.max(barW-0.4,0.2),h);}
      const mW=W-30,mX=15,mY=H*0.82;
      ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;ctx.strokeRect(mX,mY,mW,16);
      ctx.fillStyle='rgba(0,200,255,0.7)';ctx.fillRect(mX,mY,Math.min(sum/target*mW,mW),16);
      ctx.font='11px JetBrains Mono';ctx.fillStyle='rgba(0,200,255,0.75)';
      ctx.fillText(`Σ 1/n² → ${sum.toFixed(5)}`,10,18);
      ctx.fillStyle='rgba(255,215,0,0.75)';ctx.fillText(`π²/6 = ${target.toFixed(5)}`,10,35);
      if(terms>=300){setTimeout(()=>{terms=0;sum=0;},1500);}
      requestAnimationFrame(draw);}
    draw();
  })();

})(); // end initNewSmallCards