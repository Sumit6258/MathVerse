/* ═══════════════════════════════════════════
   reaction.js — Gray-Scott Reaction-Diffusion
   Pure canvas 2D — no WebGL required (FIXED)
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('reactionCanvas');
  if(!canvas) return;

  const N = 200; // grid size
  canvas.width = N; canvas.height = N;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.width  = '100%';
  canvas.style.height = '100%';

  const ctx = canvas.getContext('2d');
  let animFrame = null, running = false;
  let feed = 0.055, kill = 0.062, dA = 1.0, dB = 0.5;
  let mouseDown = false, mouseX = 0, mouseY = 0;

  // Two chemical grids A and B
  let A  = new Float32Array(N*N);
  let B  = new Float32Array(N*N);
  let nA = new Float32Array(N*N);
  let nB = new Float32Array(N*N);

  function idx(x,y){ return ((y+N)%N)*N + ((x+N)%N); }

  function seed() {
    // Fill A=1 everywhere, B=0
    for(let i=0;i<N*N;i++){ A[i]=1; B[i]=0; }
    // Seed random B blobs
    const count = 12 + Math.floor(Math.random()*8);
    for(let k=0;k<count;k++){
      const cx=5+Math.floor(Math.random()*(N-10));
      const cy=5+Math.floor(Math.random()*(N-10));
      const r = 4 + Math.floor(Math.random()*4);
      for(let dy=-r;dy<=r;dy++){
        for(let dx=-r;dx<=r;dx++){
          if(dx*dx+dy*dy<=r*r){
            const i=idx(cx+dx,cy+dy);
            A[i]=0.5; B[i]=0.5;
          }
        }
      }
    }
  }

  function step() {
    const dt=1.0;
    for(let y=0;y<N;y++){
      for(let x=0;x<N;x++){
        const c=idx(x,y);
        const a=A[c], b=B[c];
        // Laplacian (5-point stencil)
        const lapA = A[idx(x+1,y)]+A[idx(x-1,y)]+A[idx(x,y+1)]+A[idx(x,y-1)] - 4*a;
        const lapB = B[idx(x+1,y)]+B[idx(x-1,y)]+B[idx(x,y+1)]+B[idx(x,y-1)] - 4*b;
        const reaction = a*b*b;
        nA[c] = Math.max(0, Math.min(1, a + dt*(dA*0.2*lapA - reaction + feed*(1-a))));
        nB[c] = Math.max(0, Math.min(1, b + dt*(dB*0.2*lapB + reaction - (kill+feed)*b)));
      }
    }
    // Mouse paint: add B where mouse is
    if(mouseDown){
      const cx=Math.floor(mouseX*(N/canvas.offsetWidth||1));
      const cy=Math.floor(mouseY*(N/canvas.offsetHeight||1));
      for(let dy=-6;dy<=6;dy++) for(let dx=-6;dx<=6;dx++){
        if(dx*dx+dy*dy<=36){
          const i=idx(cx+dx,cy+dy);
          nB[i]=Math.min(1,nB[i]+0.5);
          nA[i]=Math.max(0,nA[i]-0.3);
        }
      }
    }
    // Swap buffers
    let tmp=A; A=nA; nA=tmp;
    tmp=B; B=nB; nB=tmp;
  }

  // Render to canvas
  const imgData = ctx.createImageData(N,N);
  function render() {
    for(let i=0;i<N*N;i++){
      const b = B[i];
      const a = A[i];
      // Beautiful chemical coloring
      const t = b;
      const r = Math.round(Math.max(0,Math.min(255, (1-t*2)*10 + t*50)));
      const g = Math.round(Math.max(0,Math.min(255, t*255*1.2)));
      const bl= Math.round(Math.max(0,Math.min(255, 50+t*200)));
      imgData.data[i*4]   = r;
      imgData.data[i*4+1] = g;
      imgData.data[i*4+2] = bl;
      imgData.data[i*4+3] = 255;
    }
    ctx.putImageData(imgData,0,0);
  }

  let frameCount=0;
  function loop() {
    // Run multiple steps per frame for speed
    for(let i=0;i<8;i++) step();
    if(frameCount%2===0) render();
    frameCount++;
    if(running) animFrame=requestAnimationFrame(loop);
  }

  // ── Mouse/touch input ──────────────────────
  function getPos(e,el){
    const r=el.getBoundingClientRect();
    return{x:e.clientX-r.left, y:e.clientY-r.top};
  }
  canvas.addEventListener('mousedown',e=>{mouseDown=true;const p=getPos(e,canvas);mouseX=p.x;mouseY=p.y;});
  canvas.addEventListener('mousemove',e=>{const p=getPos(e,canvas);mouseX=p.x;mouseY=p.y;});
  canvas.addEventListener('mouseup',()=>mouseDown=false);
  canvas.addEventListener('mouseleave',()=>mouseDown=false);
  canvas.addEventListener('touchstart',e=>{mouseDown=true;const p=getPos(e.touches[0],canvas);mouseX=p.x;mouseY=p.y;},{passive:true});
  canvas.addEventListener('touchmove',e=>{const p=getPos(e.touches[0],canvas);mouseX=p.x;mouseY=p.y;e.preventDefault();},{passive:false});
  canvas.addEventListener('touchend',()=>mouseDown=false);

  // ── Presets ───────────────────────────────
  const presets = {
    coral:  {feed:0.055, kill:0.062, dA:1.0, dB:0.5},
    spots:  {feed:0.035, kill:0.065, dA:1.0, dB:0.5},
    stripes:{feed:0.026, kill:0.055, dA:1.0, dB:0.5},
    mitosis:{feed:0.028, kill:0.062, dA:1.0, dB:0.5},
    custom: {feed:0.055, kill:0.062, dA:1.0, dB:0.5},
  };

  document.getElementById('reactionPreset')?.addEventListener('change',e=>{
    const p=presets[e.target.value];
    if(!p) return;
    feed=p.feed; kill=p.kill; dA=p.dA; dB=p.dB;
    ['feedRate','killRate','diffA','diffB'].forEach(id=>{
      const el=document.getElementById(id);
      if(el){
        if(id==='feedRate')el.value=feed;
        if(id==='killRate')el.value=kill;
        if(id==='diffA')el.value=dA;
        if(id==='diffB')el.value=dB;
      }
    });
    document.getElementById('feedVal').textContent=feed.toFixed(3);
    document.getElementById('killVal').textContent=kill.toFixed(3);
    document.getElementById('diffAVal').textContent=dA.toFixed(2);
    document.getElementById('diffBVal').textContent=dB.toFixed(2);
    seed();
  });

  document.getElementById('feedRate')?.addEventListener('input',e=>{
    feed=parseFloat(e.target.value);
    document.getElementById('feedVal').textContent=feed.toFixed(3);
  });
  document.getElementById('killRate')?.addEventListener('input',e=>{
    kill=parseFloat(e.target.value);
    document.getElementById('killVal').textContent=kill.toFixed(3);
  });
  document.getElementById('diffA')?.addEventListener('input',e=>{
    dA=parseFloat(e.target.value);
    document.getElementById('diffAVal').textContent=dA.toFixed(2);
  });
  document.getElementById('diffB')?.addEventListener('input',e=>{
    dB=parseFloat(e.target.value);
    document.getElementById('diffBVal').textContent=dB.toFixed(2);
  });
  document.getElementById('reactionReset')?.addEventListener('click',seed);
  document.getElementById('reactionSeed')?.addEventListener('click',seed);

  // ── Start on scroll ────────────────────────
  const obs=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting && !running){
      running=true;
      seed();
      loop();
      obs.disconnect();
    }
  },{threshold:0.1});
  obs.observe(document.getElementById('reaction'));

  // Stop when not visible
  const visObs=new IntersectionObserver(entries=>{
    if(!entries[0].isIntersecting){
      running=false;
      if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
    } else if(!running) {
      running=true; loop();
    }
  },{threshold:0.05});
  setTimeout(()=>visObs.observe(document.getElementById('reaction')),2000);
})();