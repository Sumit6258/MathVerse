/* ═══════════════════════════════════════════
   animations.js — Dynamical Systems
   ═══════════════════════════════════════════ */

(function() {
  const canvas = document.getElementById('animCanvas');
  canvas.width = 800; canvas.height = 500;
  const ctx = canvas.getContext('2d');
  let W = canvas.width, H = canvas.height;
  let currentAnim = 'lorenz';
  let animFrame = null;
  let animState = {};

  // ── Control builder ───────────────────────
  const controlDefs = {
    lorenz: [
      { id:'sigma', label:'σ (sigma)', min:1, max:30, step:0.5, val:10 },
      { id:'rho',   label:'ρ (rho)',   min:1, max:60, step:0.5, val:28 },
      { id:'beta',  label:'β (beta)',  min:0.1, max:8, step:0.1, val:2.67 },
      { id:'speed', label:'Speed',     min:1, max:10, step:1, val:3 },
    ],
    lissajous: [
      { id:'freqA', label:'Freq A', min:1, max:10, step:1, val:3 },
      { id:'freqB', label:'Freq B', min:1, max:10, step:1, val:2 },
      { id:'phase', label:'Phase δ', min:0, max:6.28, step:0.05, val:1.57 },
      { id:'thick', label:'Thickness', min:1, max:5, step:0.5, val:1.5 },
    ],
    wave: [
      { id:'freq1', label:'Freq 1', min:0.1, max:5, step:0.1, val:1 },
      { id:'freq2', label:'Freq 2', min:0.1, max:5, step:0.1, val:1.5 },
      { id:'amp1',  label:'Amp 1', min:0.1, max:1, step:0.05, val:0.5 },
      { id:'amp2',  label:'Amp 2', min:0.1, max:1, step:0.05, val:0.5 },
    ],
    harmonograph: [
      { id:'f1', label:'Freq 1', min:1, max:5, step:0.1, val:2 },
      { id:'f2', label:'Freq 2', min:1, max:5, step:0.1, val:3 },
      { id:'d1', label:'Decay 1', min:0, max:0.02, step:0.001, val:0.002 },
      { id:'d2', label:'Decay 2', min:0, max:0.02, step:0.001, val:0.003 },
    ],
    pendulum: [
      { id:'len1', label:'Length 1', min:0.5, max:2, step:0.1, val:1 },
      { id:'len2', label:'Length 2', min:0.5, max:2, step:0.1, val:0.8 },
      { id:'m1',   label:'Mass 1',   min:0.5, max:3, step:0.1, val:1 },
      { id:'m2',   label:'Mass 2',   min:0.5, max:3, step:0.1, val:1 },
    ],
  };

  function buildControls(name) {
    const ctrls = document.getElementById('animControls');
    ctrls.innerHTML = '';
    (controlDefs[name]||[]).forEach(c => {
      const div = document.createElement('div');
      div.className = 'ctrl-group';
      div.innerHTML = `
        <label>${c.label} <span id="lbl_${c.id}">${c.val}</span></label>
        <input type="range" id="rng_${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.val}" />
      `;
      ctrls.appendChild(div);
      div.querySelector('input').addEventListener('input', e => {
        animState[c.id] = parseFloat(e.target.value);
        document.getElementById(`lbl_${c.id}`).textContent = parseFloat(e.target.value).toFixed(2);
        if(name==='lorenz') animState.trail=[];
        if(name==='lissajous') animState.phase_t=0;
        if(name==='pendulum') initPendulum();
      });
      animState[c.id] = c.val;
    });
  }

  // ── LORENZ ATTRACTOR ─────────────────────
  function initLorenz() {
    animState.x=0.1; animState.y=0; animState.z=0;
    animState.trail=[];
    // Projection angles
    animState.rotY=0;
  }

  function drawLorenz() {
    const { sigma=10, rho=28, beta=2.67, speed=3 } = animState;
    const dt = 0.005;

    for(let s=0;s<speed;s++) {
      const dx = sigma*(animState.y - animState.x);
      const dy = animState.x*(rho - animState.z) - animState.y;
      const dz = animState.x*animState.y - beta*animState.z;
      animState.x += dx*dt; animState.y += dy*dt; animState.z += dz*dt;
      animState.trail.push({x:animState.x,y:animState.y,z:animState.z});
    }
    if(animState.trail.length > 4000) animState.trail.splice(0,speed);

    animState.rotY += 0.004;
    const cos=Math.cos(animState.rotY), sin=Math.sin(animState.rotY);

    ctx.fillStyle='rgba(4,4,8,0.08)';
    ctx.fillRect(0,0,W,H);

    const scl=7, cx=W/2, cy=H/2;
    const trail=animState.trail;
    for(let i=1;i<trail.length;i++) {
      const p=trail[i-1], q=trail[i];
      const px=p.x*cos+p.z*sin, qx=q.x*cos+q.z*sin;
      const py=p.y, qy=q.y;
      const t=i/trail.length;
      ctx.beginPath();
      ctx.moveTo(cx+px*scl, cy-py*scl+p.z*scl*0.2);
      ctx.lineTo(cx+qx*scl, cy-qy*scl+q.z*scl*0.2);
      const h=200+t*120;
      ctx.strokeStyle=`hsla(${h},100%,60%,${t*0.8})`;
      ctx.lineWidth=0.8;
      ctx.stroke();
    }
  }

  // ── LISSAJOUS ─────────────────────────────
  function initLissajous() {
    animState.phase_t = 0;
    animState.liss_trail = [];
  }

  function drawLissajous() {
    const { freqA=3, freqB=2, phase=1.57, thick=1.5 } = animState;
    animState.phase_t += 0.01;
    const T = animState.phase_t;

    ctx.fillStyle='rgba(4,4,8,0.04)';
    ctx.fillRect(0,0,W,H);

    const R=Math.min(W,H)*0.38;
    const cx=W/2, cy=H/2;

    // Draw static Lissajous
    ctx.beginPath();
    for(let t=0; t<=Math.PI*2; t+=0.01) {
      const x=cx+R*Math.sin(freqA*t+T+phase);
      const y=cy+R*Math.sin(freqB*t+T);
      t===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    const grad=ctx.createLinearGradient(cx-R,cy,cx+R,cy);
    grad.addColorStop(0,'rgba(0,200,255,0.9)');
    grad.addColorStop(0.5,'rgba(191,90,242,0.9)');
    grad.addColorStop(1,'rgba(255,215,0,0.9)');
    ctx.strokeStyle=grad; ctx.lineWidth=thick; ctx.stroke();

    // Moving point
    const px=cx+R*Math.sin(freqA*T+phase);
    const py=cy+R*Math.sin(freqB*T);
    ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2);
    ctx.fillStyle='#fff'; ctx.fill();

    // Axis projections
    ctx.setLineDash([3,6]);
    ctx.beginPath(); ctx.moveTo(px,cy); ctx.lineTo(px,py);
    ctx.strokeStyle='rgba(0,200,255,0.3)'; ctx.lineWidth=1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,py); ctx.lineTo(px,py);
    ctx.strokeStyle='rgba(191,90,242,0.3)'; ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── WAVE INTERFERENCE ─────────────────────
  function initWave() {
    animState.wave_t = 0;
  }

  function drawWave() {
    const { freq1=1, freq2=1.5, amp1=0.5, amp2=0.5 } = animState;
    animState.wave_t += 0.05;
    const t = animState.wave_t;

    ctx.clearRect(0,0,W,H);

    const cy=H/2;
    const drawWaveLine=(freq,amp,color,yOff)=>{
      ctx.beginPath();
      for(let x=0;x<W;x++) {
        const phase = (x/W)*Math.PI*6 - t*freq;
        const y = (cy+yOff) - amp*(H*0.35)*Math.sin(phase);
        x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();
    };

    drawWaveLine(freq1, amp1, 'rgba(0,200,255,0.5)', -H*0.2);
    drawWaveLine(freq2, amp2, 'rgba(191,90,242,0.5)', H*0.2);

    // Interference sum
    ctx.beginPath();
    for(let x=0;x<W;x++) {
      const p1=(x/W)*Math.PI*6 - t*freq1;
      const p2=(x/W)*Math.PI*6 - t*freq2;
      const y = cy - (amp1*Math.sin(p1)+amp2*Math.sin(p2))*(H*0.3);
      x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.strokeStyle='rgba(255,215,0,0.95)'; ctx.lineWidth=2.5; ctx.stroke();

    // Labels
    ctx.font="12px 'JetBrains Mono'";
    ctx.fillStyle='rgba(0,200,255,0.7)'; ctx.fillText('Wave 1',10,H*0.25);
    ctx.fillStyle='rgba(191,90,242,0.7)'; ctx.fillText('Wave 2',10,H*0.75);
    ctx.fillStyle='rgba(255,215,0,0.9)'; ctx.fillText('Sum',10,H*0.5-10);
  }

  // ── HARMONOGRAPH ──────────────────────────
  function initHarmonograph() {
    animState.harm_t = 0;
  }

  function drawHarmonograph() {
    const { f1=2, f2=3, d1=0.002, d2=0.003 } = animState;
    animState.harm_t += 0.3;

    if(animState.harm_t > 800) animState.harm_t = 0;

    ctx.fillStyle='rgba(4,4,8,0.015)';
    ctx.fillRect(0,0,W,H);

    const cx=W/2,cy=H/2, R=Math.min(W,H)*0.42;
    const tMax=animState.harm_t;

    ctx.beginPath();
    for(let t=0; t<=tMax; t+=0.05) {
      const x=cx + R*Math.exp(-d1*t)*Math.sin(f1*t + 1.57);
      const y=cy + R*Math.exp(-d2*t)*Math.sin(f2*t);
      const alpha=Math.min(1, (tMax-t+50)/200)*0.5;
      if(t===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    const hue=120+animState.harm_t*0.3;
    ctx.strokeStyle=`hsla(${hue%360},100%,70%,0.5)`;
    ctx.lineWidth=0.8; ctx.stroke();
  }

  // ── DOUBLE PENDULUM ───────────────────────
  function initPendulum() {
    const { len1=1, len2=0.8, m1=1, m2=1 } = animState;
    animState.th1=Math.PI*0.7; animState.th2=Math.PI*0.5;
    animState.dth1=0; animState.dth2=0;
    animState.pend_trail=[];
  }

  function drawPendulum() {
    const { len1=1, len2=0.8, m1=1, m2=1 } = animState;
    const g=9.8, dt=0.03;
    const {th1,th2,dth1,dth2} = animState;

    const dth1_dt=dth1, dth2_dt=dth2;
    const d=th1-th2, cosD=Math.cos(d), sinD=Math.sin(d);
    const den=2*m1+m2-m2*Math.cos(2*d);
    const a1=(-g*(2*m1+m2)*Math.sin(th1)-m2*g*Math.sin(th1-2*th2)-2*sinD*m2*(dth2*dth2*len2+dth1*dth1*len1*cosD))/(len1*den);
    const a2=(2*sinD*(dth1*dth1*len1*(m1+m2)+g*(m1+m2)*Math.cos(th1)+dth2*dth2*len2*m2*cosD))/(len2*den);

    animState.dth1+=a1*dt; animState.dth2+=a2*dt;
    animState.th1+=dth1_dt*dt; animState.th2+=dth2_dt*dt;
    animState.dth1*=0.9998; animState.dth2*=0.9998;

    const scale=H*0.28;
    const ox=W/2, oy=H*0.3;
    const x1=ox+scale*len1*Math.sin(animState.th1);
    const y1=oy+scale*len1*Math.cos(animState.th1);
    const x2=x1+scale*len2*Math.sin(animState.th2);
    const y2=y1+scale*len2*Math.cos(animState.th2);

    animState.pend_trail.push({x:x2,y:y2});
    if(animState.pend_trail.length>800) animState.pend_trail.shift();

    ctx.fillStyle='rgba(4,4,8,0.15)'; ctx.fillRect(0,0,W,H);

    // Trail
    const trail=animState.pend_trail;
    for(let i=1;i<trail.length;i++) {
      const t=i/trail.length;
      ctx.beginPath();
      ctx.moveTo(trail[i-1].x,trail[i-1].y);
      ctx.lineTo(trail[i].x,trail[i].y);
      ctx.strokeStyle=`hsla(${280+t*80},100%,65%,${t*0.6})`;
      ctx.lineWidth=0.8; ctx.stroke();
    }

    // Rods
    ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(x1,y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();

    // Pivot
    ctx.beginPath(); ctx.arc(ox,oy,5,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fill();

    // Bobs
    [x1,y1,m1,0],[x2,y2,m2,1].forEach(([bx,by,bm,ci])=>false);
    [[x1,y1,m1],[x2,y2,m2]].forEach(([bx,by,bm],ci)=>{
      ctx.beginPath(); ctx.arc(bx,by,6+bm*3,0,Math.PI*2);
      ctx.fillStyle=ci===0?'rgba(0,200,255,0.9)':'rgba(191,90,242,0.9)';
      ctx.fill();
    });
  }

  // ── Animation loop ────────────────────────
  const animFns = {
    lorenz: drawLorenz,
    lissajous: drawLissajous,
    wave: drawWave,
    harmonograph: drawHarmonograph,
    pendulum: drawPendulum
  };

  const initFns = {
    lorenz: initLorenz,
    lissajous: initLissajous,
    wave: initWave,
    harmonograph: initHarmonograph,
    pendulum: initPendulum
  };

  function startAnim(name) {
    if(animFrame) cancelAnimationFrame(animFrame);
    currentAnim = name;
    animState = {};
    buildControls(name);
    ctx.clearRect(0,0,W,H);
    initFns[name]();

    function loop() {
      animFns[name]();
      animFrame = requestAnimationFrame(loop);
    }
    loop();
  }

  document.querySelectorAll('.atab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.atab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      startAnim(btn.dataset.anim);
    });
  });

  // Start on scroll
  const obs = new IntersectionObserver(entries => {
    if(entries[0].isIntersecting) { startAnim('lorenz'); obs.disconnect(); }
  }, { threshold: 0.3 });
  obs.observe(document.getElementById('animations'));
})();
