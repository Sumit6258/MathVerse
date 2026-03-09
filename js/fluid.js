/* ═══════════════════════════════════════════
   fluid.js — Stable Fluids (FIXED)
   Jos Stam 1999 — fully working canvas sim
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('fluidCanvas');
  if(!canvas) return;

  const N = 96; // grid cells
  const SZ = (N+2)*(N+2);
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const CW = canvas.width, CH = canvas.height;
  const cellW = CW/N, cellH = CH/N;

  let running=false, animFrame=null;
  let visc=0.0001, diff=0.00001, colorMode='velocity';

  // Fluid field arrays
  let vx=new Float32Array(SZ), vy=new Float32Array(SZ);
  let vx0=new Float32Array(SZ), vy0=new Float32Array(SZ);
  let dens=new Float32Array(SZ), dens0=new Float32Array(SZ);
  // RGB dye channels
  let dyeR=new Float32Array(SZ), dyeG=new Float32Array(SZ), dyeB=new Float32Array(SZ);

  const IX=(x,y)=>x+(N+2)*y;

  let prevMX=-1,prevMY=-1,mouseDown=false,curMX=0,curMY=0;

  // ── Core fluid ops ────────────────────────
  function addSource(x,s,dt){ for(let i=0;i<SZ;i++) x[i]+=dt*s[i]; }

  function setBnd(b,x){
    for(let i=1;i<=N;i++){
      x[IX(0,i)]   = b===1?-x[IX(1,i)]:x[IX(1,i)];
      x[IX(N+1,i)] = b===1?-x[IX(N,i)]:x[IX(N,i)];
      x[IX(i,0)]   = b===2?-x[IX(i,1)]:x[IX(i,1)];
      x[IX(i,N+1)] = b===2?-x[IX(i,N)]:x[IX(i,N)];
    }
    x[IX(0,0)]     = 0.5*(x[IX(1,0)]+x[IX(0,1)]);
    x[IX(0,N+1)]   = 0.5*(x[IX(1,N+1)]+x[IX(0,N)]);
    x[IX(N+1,0)]   = 0.5*(x[IX(N,0)]+x[IX(N+1,1)]);
    x[IX(N+1,N+1)] = 0.5*(x[IX(N,N+1)]+x[IX(N+1,N)]);
  }

  function linSolve(b,x,x0,a,c){
    const inv = 1/c;
    for(let k=0;k<6;k++){
      for(let j=1;j<=N;j++){
        for(let i=1;i<=N;i++){
          x[IX(i,j)]=(x0[IX(i,j)]+a*(x[IX(i-1,j)]+x[IX(i+1,j)]+x[IX(i,j-1)]+x[IX(i,j+1)]))*inv;
        }
      }
      setBnd(b,x);
    }
  }

  function diffuse(b,x,x0,diff_,dt){
    const a=dt*diff_*N*N;
    linSolve(b,x,x0,a,1+4*a);
  }

  function advect(b,d,d0,u,v,dt){
    const dt0=dt*N;
    for(let j=1;j<=N;j++){
      for(let i=1;i<=N;i++){
        let ox=i-dt0*u[IX(i,j)], oy=j-dt0*v[IX(i,j)];
        if(ox<0.5)ox=0.5; if(ox>N+0.5)ox=N+0.5;
        if(oy<0.5)oy=0.5; if(oy>N+0.5)oy=N+0.5;
        const i0=ox|0, i1=i0+1, j0=oy|0, j1=j0+1;
        const s1=ox-i0, s0=1-s1, t1=oy-j0, t0=1-t1;
        d[IX(i,j)]=s0*(t0*d0[IX(i0,j0)]+t1*d0[IX(i0,j1)])+s1*(t0*d0[IX(i1,j0)]+t1*d0[IX(i1,j1)]);
      }
    }
    setBnd(b,d);
  }

  function project(u,v,p,div){
    const h=1/N;
    for(let j=1;j<=N;j++) for(let i=1;i<=N;i++){
      div[IX(i,j)]=-0.5*h*(u[IX(i+1,j)]-u[IX(i-1,j)]+v[IX(i,j+1)]-v[IX(i,j-1)]);
      p[IX(i,j)]=0;
    }
    setBnd(0,div); setBnd(0,p);
    linSolve(0,p,div,1,4);
    for(let j=1;j<=N;j++) for(let i=1;i<=N;i++){
      u[IX(i,j)]-=0.5*(p[IX(i+1,j)]-p[IX(i-1,j)])/h;
      v[IX(i,j)]-=0.5*(p[IX(i,j+1)]-p[IX(i,j-1)])/h;
    }
    setBnd(1,u); setBnd(2,v);
  }

  function velStep(dt){
    addSource(vx,vx0,dt); addSource(vy,vy0,dt);
    [vx0,vx]=[vx,vx0]; diffuse(1,vx,vx0,visc,dt);
    [vy0,vy]=[vy,vy0]; diffuse(2,vy,vy0,visc,dt);
    project(vx,vy,vx0,vy0);
    [vx0,vx]=[vx,vx0]; [vy0,vy]=[vy,vy0];
    advect(1,vx,vx0,vx0,vy0,dt);
    advect(2,vy,vy0,vx0,vy0,dt);
    project(vx,vy,vx0,vy0);
  }

  function densStep(dt){
    addSource(dens,dens0,dt);
    [dens0,dens]=[dens,dens0];
    diffuse(0,dens,dens0,diff,dt);
    [dens0,dens]=[dens,dens0];
    advect(0,dens,dens0,vx,vy,dt);
  }

  function dyeStep(dt){
    [dyeR,dens0]=[dens0,dyeR]; advect(0,dyeR,dens0,vx,vy,dt); [dyeR,dens0]=[dens0,dyeR];
    [dyeG,dens0]=[dens0,dyeG]; advect(0,dyeG,dens0,vx,vy,dt); [dyeG,dens0]=[dens0,dyeG];
    [dyeB,dens0]=[dens0,dyeB]; advect(0,dyeB,dens0,vx,vy,dt); [dyeB,dens0]=[dens0,dyeB];
  }

  // ── Render ────────────────────────────────
  const imgData = ctx.createImageData(CW,CH);

  function hsvToRgb(h,s,v){
    h=((h%1)+1)%1;
    const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
    return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
  }

  function renderFluid(){
    const data=imgData.data;
    for(let j=1;j<=N;j++){
      for(let i=1;i<=N;i++){
        const px=Math.floor((i-1)*cellW), py=Math.floor((j-1)*cellH);
        const pw=Math.ceil(cellW), ph=Math.ceil(cellH);
        const vxv=vx[IX(i,j)], vyv=vy[IX(i,j)];
        const speed=Math.sqrt(vxv*vxv+vyv*vyv);
        let rr,gg,bb;
        if(colorMode==='velocity'){
          const hue=(Math.atan2(vyv,vxv)+Math.PI)/(2*Math.PI);
          const bright=Math.min(1,speed*120+0.05);
          const [r,g,b]=hsvToRgb(hue,0.9,bright);
          rr=r*255; gg=g*255; bb=b*255;
        } else if(colorMode==='pressure'){
          const p=(vxv-vyv)*80;
          rr=Math.max(0,Math.min(255,128+p*3));
          gg=10; bb=Math.max(0,Math.min(255,128-p*3));
        } else if(colorMode==='vorticity'){
          const curl=(vy[IX(i+1,j)]-vy[IX(i-1,j)]-vx[IX(i,j+1)]+vx[IX(i,j-1)])*0.25;
          const c=Math.min(255,Math.abs(curl)*3000);
          rr=curl>0?c:0; gg=Math.max(0,c*0.3); bb=curl<0?c:0;
        } else { // dye
          rr=Math.min(255,dyeR[IX(i,j)]*600);
          gg=Math.min(255,dyeG[IX(i,j)]*600);
          bb=Math.min(255,dyeB[IX(i,j)]*600);
        }
        const R=Math.round(rr),G=Math.round(gg),B=Math.round(bb);
        for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++){
          const idx=((py+dy)*CW+(px+dx))*4;
          data[idx]=R; data[idx+1]=G; data[idx+2]=B; data[idx+3]=255;
        }
      }
    }
    ctx.putImageData(imgData,0,0);

    // Draw velocity arrows
    ctx.globalAlpha=0.4;
    for(let j=4;j<=N;j+=7) for(let i=4;i<=N;i+=7){
      const ux=vx[IX(i,j)]*400, uy=vy[IX(i,j)]*400;
      const spd=Math.sqrt(ux*ux+uy*uy);
      if(spd<1) continue;
      const px=(i-0.5)*cellW, py=(j-0.5)*cellH;
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+ux,py+uy);
      ctx.strokeStyle=`rgba(255,255,255,${Math.min(0.8,spd/20)})`;
      ctx.lineWidth=0.8;ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  // ── Add forces from mouse ─────────────────
  function addMouseForce(){
    if(!mouseDown||prevMX<0) return;
    const i=Math.floor(curMX/cellW)+1, j=Math.floor(curMY/cellH)+1;
    if(i<1||i>N||j<1||j>N) return;
    const fx=(curMX-prevMX)*15, fy=(curMY-prevMY)*15;
    vx0[IX(i,j)]+=fx; vy0[IX(i,j)]+=fy;
    dens0[IX(i,j)]+=30;
    // Colored dye
    const hue=((Date.now()*0.001)%1)*360;
    const h=hue/360, s=1, v=1;
    const [r,g,b]=hsvToRgb(h,s,v);
    dyeR[IX(i,j)]+=r*15; dyeG[IX(i,j)]+=g*15; dyeB[IX(i,j)]+=b*15;
    // Spread to neighbors
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){
      const ni=i+di,nj=j+dj;
      if(ni>=1&&ni<=N&&nj>=1&&nj<=N){
        vx0[IX(ni,nj)]+=fx*0.3; vy0[IX(ni,nj)]+=fy*0.3;
        dens0[IX(ni,nj)]+=8;
      }
    }
    prevMX=curMX; prevMY=curMY;
  }

  function simStep(){
    // Clear source arrays
    for(let i=0;i<SZ;i++){vx0[i]*=0.9;vy0[i]*=0.9;dens0[i]*=0.8;}
    addMouseForce();
    velStep(0.016);
    densStep(0.016);
    dyeStep(0.016);
    renderFluid();
  }

  function loop(){
    simStep();
    if(running) animFrame=requestAnimationFrame(loop);
  }

  // ── Mouse events ──────────────────────────
  function getPos(e){ const r=canvas.getBoundingClientRect(); return{x:e.clientX-r.left,y:e.clientY-r.top}; }
  canvas.addEventListener('mousedown',e=>{const p=getPos(e);mouseDown=true;prevMX=p.x;prevMY=p.y;curMX=p.x;curMY=p.y;});
  canvas.addEventListener('mousemove',e=>{const p=getPos(e);if(mouseDown){prevMX=curMX;prevMY=curMY;}curMX=p.x;curMY=p.y;});
  canvas.addEventListener('mouseup',()=>{mouseDown=false;prevMX=-1;});
  canvas.addEventListener('mouseleave',()=>{mouseDown=false;prevMX=-1;});
  canvas.addEventListener('touchstart',e=>{const p=getPos(e.touches[0]);mouseDown=true;prevMX=p.x;prevMY=p.y;curMX=p.x;curMY=p.y;},{passive:true});
  canvas.addEventListener('touchmove',e=>{e.preventDefault();const p=getPos(e.touches[0]);prevMX=curMX;prevMY=curMY;curMX=p.x;curMY=p.y;},{passive:false});
  canvas.addEventListener('touchend',()=>{mouseDown=false;prevMX=-1;});

  // ── Controls ──────────────────────────────
  document.getElementById('viscosity')?.addEventListener('input',e=>{
    visc=parseFloat(e.target.value);
    document.getElementById('viscVal').textContent=visc.toFixed(5);
  });
  document.getElementById('diffusion')?.addEventListener('input',e=>{
    diff=parseFloat(e.target.value);
    document.getElementById('diffFVal').textContent=diff.toFixed(5);
  });
  document.getElementById('fluidColorMode')?.addEventListener('change',e=>{colorMode=e.target.value;});
  document.getElementById('fluidReset')?.addEventListener('click',()=>{
    for(let i=0;i<SZ;i++){vx[i]=vy[i]=vx0[i]=vy0[i]=dens[i]=dens0[i]=dyeR[i]=dyeG[i]=dyeB[i]=0;}
    ctx.clearRect(0,0,CW,CH);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,CW,CH);
  });
  document.getElementById('fluidVortex')?.addEventListener('click',()=>{
    const ci=Math.floor(N/2), cj=Math.floor(N/2);
    for(let dj=-15;dj<=15;dj++) for(let di=-15;di<=15;di++){
      const r=Math.sqrt(di*di+dj*dj);
      if(r<15&&r>0){
        vx0[IX(ci+di,cj+dj)]+=dj*8/r;
        vy0[IX(ci+di,cj+dj)]+=-di*8/r;
        dens0[IX(ci+di,cj+dj)]+=5;
      }
    }
  });

  const obs=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting && !running){
      running=true;
      ctx.fillStyle='#030307';ctx.fillRect(0,0,CW,CH);
      loop();
      obs.disconnect();
    }
  },{threshold:0.1});
  obs.observe(document.getElementById('fluid'));

  const visObs=new IntersectionObserver(entries=>{
    if(!entries[0].isIntersecting){
      running=false;if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
    } else if(!running){ running=true; loop(); }
  },{threshold:0.05});
  setTimeout(()=>visObs.observe(document.getElementById('fluid')),2000);
})();