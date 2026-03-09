/* ═══════════════════════════════════════════
   animations.js — Dynamical Systems (FIXED)
   All 8 animations in one unified module
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('animCanvas');
  if(!canvas) return;
  canvas.width = 800; canvas.height = 500;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let currentAnim = 'lorenz';
  let animFrame = null;
  let animState = {};

  // ── Control definitions ───────────────────
  const controlDefs = {
    lorenz:[
      {id:'sigma',label:'σ (sigma)',min:1,max:30,step:0.5,val:10},
      {id:'rho',label:'ρ (rho)',min:1,max:60,step:0.5,val:28},
      {id:'beta',label:'β (beta)',min:0.1,max:8,step:0.1,val:2.67},
      {id:'speed',label:'Speed',min:1,max:10,step:1,val:3},
    ],
    lissajous:[
      {id:'freqA',label:'Freq A',min:1,max:10,step:1,val:3},
      {id:'freqB',label:'Freq B',min:1,max:10,step:1,val:2},
      {id:'phase',label:'Phase δ',min:0,max:6.28,step:0.05,val:1.57},
      {id:'thick',label:'Thickness',min:1,max:5,step:0.5,val:1.5},
    ],
    wave:[
      {id:'freq1',label:'Freq 1',min:0.1,max:5,step:0.1,val:1},
      {id:'freq2',label:'Freq 2',min:0.1,max:5,step:0.1,val:1.5},
      {id:'amp1',label:'Amp 1',min:0.1,max:1,step:0.05,val:0.5},
      {id:'amp2',label:'Amp 2',min:0.1,max:1,step:0.05,val:0.5},
    ],
    harmonograph:[
      {id:'f1',label:'Freq 1',min:1,max:5,step:0.1,val:2},
      {id:'f2',label:'Freq 2',min:1,max:5,step:0.1,val:3},
      {id:'d1',label:'Decay 1',min:0,max:0.02,step:0.001,val:0.002},
      {id:'d2',label:'Decay 2',min:0,max:0.02,step:0.001,val:0.003},
    ],
    pendulum:[
      {id:'len1',label:'Length 1',min:0.5,max:2,step:0.1,val:1},
      {id:'len2',label:'Length 2',min:0.5,max:2,step:0.1,val:0.8},
      {id:'m1',label:'Mass 1',min:0.5,max:3,step:0.1,val:1},
      {id:'m2',label:'Mass 2',min:0.5,max:3,step:0.1,val:1},
    ],
    rossler:[
      {id:'rA',label:'a',min:0.05,max:0.5,step:0.01,val:0.2},
      {id:'rB',label:'b',min:0.05,max:0.5,step:0.01,val:0.2},
      {id:'rC',label:'c',min:2,max:14,step:0.1,val:5.7},
    ],
    henon:[
      {id:'hA',label:'a',min:0.5,max:2,step:0.01,val:1.4},
      {id:'hB',label:'b',min:0.1,max:0.5,step:0.01,val:0.3},
    ],
    ikeda:[
      {id:'iU',label:'u',min:0.5,max:0.99,step:0.01,val:0.9},
    ],
  };

  function buildControls(name) {
    const ctrls = document.getElementById('animControls');
    ctrls.innerHTML = '';
    (controlDefs[name]||[]).forEach(c => {
      const div = document.createElement('div');
      div.className = 'ctrl-group';
      div.innerHTML = `<label>${c.label} <span id="lbl_${c.id}">${c.val}</span></label>
        <input type="range" id="rng_${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.val}" />`;
      ctrls.appendChild(div);
      div.querySelector('input').addEventListener('input', e => {
        const v = parseFloat(e.target.value);
        animState[c.id] = v;
        document.getElementById(`lbl_${c.id}`).textContent = v.toFixed(2);
        // Reset trail on param change
        if(animState.trail) animState.trail = [];
        if(animState.pend_trail) { initPendulum(); }
        if(name==='henon'||name==='ikeda') { initFns[name](); }
      });
      animState[c.id] = c.val;
    });
  }

  // ── LORENZ ───────────────────────────────
  function initLorenz() {
    animState.lx=0.1; animState.ly=0; animState.lz=0;
    animState.trail=[];
    animState.rotY=0;
  }
  function drawLorenz() {
    const {sigma=10,rho=28,beta=2.67,speed=3}=animState;
    const dt=0.005;
    for(let s=0;s<speed;s++){
      const dx=sigma*(animState.ly-animState.lx);
      const dy=animState.lx*(rho-animState.lz)-animState.ly;
      const dz=animState.lx*animState.ly-beta*animState.lz;
      animState.lx+=dx*dt; animState.ly+=dy*dt; animState.lz+=dz*dt;
      animState.trail.push({x:animState.lx,y:animState.ly,z:animState.lz});
    }
    if(animState.trail.length>4000) animState.trail.splice(0,speed);
    animState.rotY+=0.004;
    const cosR=Math.cos(animState.rotY),sinR=Math.sin(animState.rotY);
    ctx.fillStyle='rgba(3,3,7,0.08)'; ctx.fillRect(0,0,W,H);
    const scl=7,cxc=W/2,cyc=H/2;
    for(let i=1;i<animState.trail.length;i++){
      const p=animState.trail[i-1],q=animState.trail[i];
      const t=i/animState.trail.length;
      ctx.beginPath();
      ctx.moveTo(cxc+(p.x*cosR+p.z*sinR)*scl, cyc-p.y*scl+p.z*scl*0.2);
      ctx.lineTo(cxc+(q.x*cosR+q.z*sinR)*scl, cyc-q.y*scl+q.z*scl*0.2);
      ctx.strokeStyle=`hsla(${200+t*120},100%,60%,${t*0.8})`;
      ctx.lineWidth=0.8; ctx.stroke();
    }
    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.6)';
    ctx.fillText(`Lorenz: σ=${sigma} ρ=${rho} β=${beta.toFixed(2)}`,10,25);
  }

  // ── LISSAJOUS ────────────────────────────
  function initLissajous() { animState.phase_t=0; }
  function drawLissajous() {
    const {freqA=3,freqB=2,phase=1.57,thick=1.5}=animState;
    animState.phase_t+=0.01;
    const T=animState.phase_t;
    ctx.fillStyle='rgba(3,3,7,0.04)'; ctx.fillRect(0,0,W,H);
    const R=Math.min(W,H)*0.38,cxc=W/2,cyc=H/2;
    ctx.beginPath();
    for(let t=0;t<=Math.PI*2;t+=0.008){
      const x=cxc+R*Math.sin(freqA*t+T+phase);
      const y=cyc+R*Math.sin(freqB*t+T);
      t===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    const grad=ctx.createLinearGradient(cxc-R,cyc,cxc+R,cyc);
    grad.addColorStop(0,'rgba(0,200,255,0.9)');
    grad.addColorStop(0.5,'rgba(191,90,242,0.9)');
    grad.addColorStop(1,'rgba(255,215,0,0.9)');
    ctx.strokeStyle=grad; ctx.lineWidth=thick; ctx.stroke();
    const px=cxc+R*Math.sin(freqA*T+phase),py=cyc+R*Math.sin(freqB*T);
    ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);
    ctx.fillStyle='#fff';ctx.fill();
  }

  // ── WAVE INTERFERENCE ────────────────────
  function initWave() { animState.wave_t=0; }
  function drawWave() {
    const {freq1=1,freq2=1.5,amp1=0.5,amp2=0.5}=animState;
    animState.wave_t+=0.05;
    const t=animState.wave_t;
    ctx.clearRect(0,0,W,H);
    const drawLine=(fr,am,col,yo)=>{
      ctx.beginPath();
      for(let x=0;x<W;x++){
        const p=(x/W)*Math.PI*6-t*fr;
        const y=H/2+yo-am*(H*0.3)*Math.sin(p);
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.stroke();
    };
    drawLine(freq1,amp1,'rgba(0,200,255,0.5)',-H*0.18);
    drawLine(freq2,amp2,'rgba(191,90,242,0.5)',H*0.18);
    ctx.beginPath();
    for(let x=0;x<W;x++){
      const p1=(x/W)*Math.PI*6-t*freq1, p2=(x/W)*Math.PI*6-t*freq2;
      const y=H/2-(amp1*Math.sin(p1)+amp2*Math.sin(p2))*(H*0.28);
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle='rgba(255,215,0,0.95)';ctx.lineWidth=2.5;ctx.stroke();
    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.7)';ctx.fillText('Wave 1',10,H*0.2);
    ctx.fillStyle='rgba(191,90,242,0.7)';ctx.fillText('Wave 2',10,H*0.8);
    ctx.fillStyle='rgba(255,215,0,0.9)';ctx.fillText('Sum',10,H*0.5-10);
  }

  // ── HARMONOGRAPH ─────────────────────────
  function initHarmonograph() { animState.harm_t=0; }
  function drawHarmonograph() {
    const {f1=2,f2=3,d1=0.002,d2=0.003}=animState;
    animState.harm_t+=0.4;
    if(animState.harm_t>900) animState.harm_t=0;
    ctx.fillStyle='rgba(3,3,7,0.015)'; ctx.fillRect(0,0,W,H);
    const cxc=W/2,cyc=H/2,R=Math.min(W,H)*0.42;
    ctx.beginPath();
    for(let t=0;t<=animState.harm_t;t+=0.05){
      const x=cxc+R*Math.exp(-d1*t)*Math.sin(f1*t+1.57);
      const y=cyc+R*Math.exp(-d2*t)*Math.sin(f2*t);
      t===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    const hue=(120+animState.harm_t*0.3)%360;
    ctx.strokeStyle=`hsla(${hue},100%,70%,0.6)`;ctx.lineWidth=0.9;ctx.stroke();
  }

  // ── DOUBLE PENDULUM ───────────────────────
  function initPendulum() {
    animState.th1=Math.PI*0.75; animState.th2=Math.PI*0.6;
    animState.dth1=0; animState.dth2=0;
    animState.pend_trail=[];
  }
  function drawPendulum() {
    const {len1=1,len2=0.8,m1=1,m2=1}=animState;
    const g=9.8, dt=0.025;
    for(let step=0;step<3;step++){
      const {th1,th2,dth1,dth2}=animState;
      const d=th1-th2;
      const den=2*m1+m2-m2*Math.cos(2*d);
      if(Math.abs(den)<1e-10) break;
      const a1=(-g*(2*m1+m2)*Math.sin(th1)-m2*g*Math.sin(th1-2*th2)
        -2*Math.sin(d)*m2*(dth2*dth2*len2+dth1*dth1*len1*Math.cos(d)))/(len1*den);
      const a2=(2*Math.sin(d)*(dth1*dth1*len1*(m1+m2)+g*(m1+m2)*Math.cos(th1)
        +dth2*dth2*len2*m2*Math.cos(d)))/(len2*den);
      animState.dth1+=a1*dt; animState.dth2+=a2*dt;
      animState.th1+=animState.dth1*dt; animState.th2+=animState.dth2*dt;
      animState.dth1*=0.9999; animState.dth2*=0.9999;
    }
    const scale=H*0.22,ox=W/2,oy=H*0.28;
    const x1=ox+scale*len1*Math.sin(animState.th1);
    const y1=oy+scale*len1*Math.cos(animState.th1);
    const x2=x1+scale*len2*Math.sin(animState.th2);
    const y2=y1+scale*len2*Math.cos(animState.th2);
    animState.pend_trail.push({x:x2,y:y2});
    if(animState.pend_trail.length>1000) animState.pend_trail.shift();
    ctx.fillStyle='rgba(3,3,7,0.12)'; ctx.fillRect(0,0,W,H);
    const trail=animState.pend_trail;
    for(let i=1;i<trail.length;i++){
      const t=i/trail.length;
      ctx.beginPath();
      ctx.moveTo(trail[i-1].x,trail[i-1].y);
      ctx.lineTo(trail[i].x,trail[i].y);
      ctx.strokeStyle=`hsla(${270+t*90},100%,65%,${t*0.7})`;
      ctx.lineWidth=0.9;ctx.stroke();
    }
    ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.7)';
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(x1,y1);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    ctx.beginPath();ctx.arc(ox,oy,5,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fill();
    [[x1,y1,m1,0],[x2,y2,m2,1]].forEach(([bx,by,bm,ci])=>{
      ctx.beginPath();ctx.arc(bx,by,7+bm*3,0,Math.PI*2);
      ctx.fillStyle=ci===0?'rgba(0,200,255,0.95)':'rgba(191,90,242,0.95)';
      ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;ctx.stroke();
    });
    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.fillText(`θ₁=${animState.th1.toFixed(2)}  θ₂=${animState.th2.toFixed(2)}`,10,25);
  }

  // ── RÖSSLER ATTRACTOR ────────────────────
  function initRossler() {
    animState.rx=0.5; animState.ry=0; animState.rz=0;
    animState.rtail=[]; animState.rot=0;
  }
  function drawRossler() {
    const {rA=0.2,rB=0.2,rC=5.7}=animState;
    const dt=0.04;
    for(let i=0;i<6;i++){
      const dx=-animState.ry-animState.rz;
      const dy=animState.rx+rA*animState.ry;
      const dz=rB+animState.rz*(animState.rx-rC);
      animState.rx+=dx*dt; animState.ry+=dy*dt; animState.rz+=dz*dt;
      animState.rtail.push({x:animState.rx,y:animState.ry,z:animState.rz});
    }
    if(animState.rtail.length>3500) animState.rtail.splice(0,6);
    animState.rot+=0.004;
    const cosR=Math.cos(animState.rot),sinR=Math.sin(animState.rot);
    ctx.fillStyle='rgba(3,3,7,0.07)'; ctx.fillRect(0,0,W,H);
    const scl=16,cxc=W/2,cyc=H/2;
    for(let i=1;i<animState.rtail.length;i++){
      const p=animState.rtail[i-1],q=animState.rtail[i];
      const t=i/animState.rtail.length;
      ctx.beginPath();
      ctx.moveTo(cxc+(p.x*cosR-p.z*sinR)*scl,cyc-p.y*scl);
      ctx.lineTo(cxc+(q.x*cosR-q.z*sinR)*scl,cyc-q.y*scl);
      ctx.strokeStyle=`hsla(${40+t*300},100%,65%,${t*0.75})`;
      ctx.lineWidth=0.7;ctx.stroke();
    }
    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(255,215,0,0.6)';
    ctx.fillText(`Rössler: a=${rA.toFixed(2)} b=${rB.toFixed(2)} c=${rC.toFixed(1)}`,10,25);
  }

  // ── HÉNON MAP ────────────────────────────
  function initHenon() {
    animState.hx=0.1; animState.hy=0.1;
    animState.hpts=0;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);
  }
  function drawHenon() {
    const {hA=1.4,hB=0.3}=animState;
    for(let i=0;i<600;i++){
      const nx=1-hA*animState.hx*animState.hx+animState.hy;
      const ny=hB*animState.hx;
      animState.hx=nx; animState.hy=ny;
      if(Math.abs(animState.hx)>3||Math.abs(animState.hy)>3){
        animState.hx=Math.random()*2-1; animState.hy=Math.random()*0.5;
      } else {
        const px=W/2+animState.hx*(W*0.2), py=H/2-animState.hy*(H*0.35);
        animState.hpts++;
        const t=Math.min(1,animState.hpts/40000);
        ctx.beginPath();ctx.arc(px,py,0.8,0,Math.PI*2);
        ctx.fillStyle=`hsla(${190+t*180},100%,65%,0.65)`;ctx.fill();
      }
    }
    ctx.fillStyle='rgba(3,3,7,0.0)';
    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.65)';
    ctx.fillText(`Hénon Map  a=${hA.toFixed(2)} b=${hB.toFixed(2)}  pts: ${animState.hpts}`,10,25);
  }

  // ── IKEDA ATTRACTOR ──────────────────────
  function initIkeda() {
    animState.ix=0.5; animState.iy=0.5;
    animState.ipts=0;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);
  }
  function drawIkeda() {
    const {iU=0.9}=animState;
    for(let i=0;i<800;i++){
      const t=0.4-6/(1+animState.ix*animState.ix+animState.iy*animState.iy);
      const nx=1+iU*(animState.ix*Math.cos(t)-animState.iy*Math.sin(t));
      const ny=iU*(animState.ix*Math.sin(t)+animState.iy*Math.cos(t));
      animState.ix=nx; animState.iy=ny;
      if(!isFinite(animState.ix)||!isFinite(animState.iy)){
        animState.ix=Math.random()-0.5; animState.iy=Math.random()-0.5;
      }
      const px=W/2+animState.ix*(W*0.07), py=H/2-animState.iy*(H*0.09);
      if(px>=0&&px<W&&py>=0&&py<H){
        animState.ipts++;
        const t2=Math.min(1,animState.ipts/80000);
        ctx.beginPath();ctx.arc(px,py,0.5,0,Math.PI*2);
        ctx.fillStyle=`hsla(${280+t2*100},100%,70%,0.5)`;ctx.fill();
      }
    }
    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(191,90,242,0.65)';
    ctx.fillText(`Ikeda Attractor  u=${iU.toFixed(2)}  pts: ${animState.ipts}`,10,25);
  }

  // ── Animation registry ────────────────────
  const animFns = {lorenz:drawLorenz,lissajous:drawLissajous,wave:drawWave,
    harmonograph:drawHarmonograph,pendulum:drawPendulum,
    rossler:drawRossler,henon:drawHenon,ikeda:drawIkeda};
  const initFns = {lorenz:initLorenz,lissajous:initLissajous,wave:initWave,
    harmonograph:initHarmonograph,pendulum:initPendulum,
    rossler:initRossler,henon:initHenon,ikeda:initIkeda};

  function startAnim(name) {
    if(animFrame) { cancelAnimationFrame(animFrame); animFrame=null; }
    currentAnim=name;
    animState={};
    buildControls(name);
    ctx.clearRect(0,0,W,H);
    if(initFns[name]) initFns[name]();

    function loop() {
      if(animFns[name]) animFns[name]();
      animFrame=requestAnimationFrame(loop);
    }
    loop();
  }

  // Single listener for all tabs
  document.querySelectorAll('.atab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.atab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      startAnim(btn.dataset.anim);
    });
  });

  const obs=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting){startAnim('lorenz');obs.disconnect();}
  },{threshold:0.2});
  obs.observe(document.getElementById('animations'));
})();