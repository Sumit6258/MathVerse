/* ═══════════════════════════════════════════
   fluid.js — Stable Fluids (Jos Stam method)
   Canvas-based, visually rich fluid simulation
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('fluidCanvas');
  if(!canvas) return;
  const N = 128;
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');

  let visc=0.0001, diff=0.0001, colorMode='velocity';
  let running=false, animFrame;
  let prevMX=0,prevMY=0,mouseDown=false;

  // Fluid arrays
  let vx=new Float32Array((N+2)*(N+2));
  let vy=new Float32Array((N+2)*(N+2));
  let vxPrev=new Float32Array((N+2)*(N+2));
  let vyPrev=new Float32Array((N+2)*(N+2));
  let dens=new Float32Array((N+2)*(N+2));
  let densPrev=new Float32Array((N+2)*(N+2));
  let dye=new Float32Array((N+2)*(N+2)*3);
  let dyePrev=new Float32Array((N+2)*(N+2)*3);

  const IX=(i,j)=>i+(N+2)*j;

  function addSource(x,s,dt){for(let i=0;i<x.length;i++)x[i]+=dt*s[i];}

  function setBnd(b,x){
    for(let i=1;i<=N;i++){
      x[IX(0,i)]=b===1?-x[IX(1,i)]:x[IX(1,i)];
      x[IX(N+1,i)]=b===1?-x[IX(N,i)]:x[IX(N,i)];
      x[IX(i,0)]=b===2?-x[IX(i,1)]:x[IX(i,1)];
      x[IX(i,N+1)]=b===2?-x[IX(i,N)]:x[IX(i,N)];
    }
    x[IX(0,0)]=0.5*(x[IX(1,0)]+x[IX(0,1)]);
    x[IX(0,N+1)]=0.5*(x[IX(1,N+1)]+x[IX(0,N)]);
    x[IX(N+1,0)]=0.5*(x[IX(N,0)]+x[IX(N+1,1)]);
    x[IX(N+1,N+1)]=0.5*(x[IX(N,N+1)]+x[IX(N+1,N)]);
  }

  function linSolve(b,x,x0,a,c){
    for(let k=0;k<4;k++){
      for(let j=1;j<=N;j++)for(let i=1;i<=N;i++)
        x[IX(i,j)]=(x0[IX(i,j)]+a*(x[IX(i-1,j)]+x[IX(i+1,j)]+x[IX(i,j-1)]+x[IX(i,j+1)]))/c;
      setBnd(b,x);
    }
  }

  function diffuse(b,x,x0,diff,dt){
    const a=dt*diff*N*N;
    linSolve(b,x,x0,a,1+4*a);
  }

  function advect(b,d,d0,u,v,dt){
    const dt0=dt*N;
    for(let j=1;j<=N;j++){
      for(let i=1;i<=N;i++){
        let x=i-dt0*u[IX(i,j)], y=j-dt0*v[IX(i,j)];
        if(x<0.5)x=0.5;if(x>N+0.5)x=N+0.5;
        const i0=Math.floor(x),i1=i0+1;
        if(y<0.5)y=0.5;if(y>N+0.5)y=N+0.5;
        const j0=Math.floor(y),j1=j0+1;
        const s1=x-i0,s0=1-s1,t1=y-j0,t0=1-t1;
        d[IX(i,j)]=s0*(t0*d0[IX(i0,j0)]+t1*d0[IX(i0,j1)])+s1*(t0*d0[IX(i1,j0)]+t1*d0[IX(i1,j1)]);
      }
    }
    setBnd(b,d);
  }

  function project(u,v,p,div){
    const h=1/N;
    for(let j=1;j<=N;j++)for(let i=1;i<=N;i++){
      div[IX(i,j)]=-0.5*h*(u[IX(i+1,j)]-u[IX(i-1,j)]+v[IX(i,j+1)]-v[IX(i,j-1)]);
      p[IX(i,j)]=0;
    }
    setBnd(0,div);setBnd(0,p);
    linSolve(0,p,div,1,4);
    for(let j=1;j<=N;j++)for(let i=1;i<=N;i++){
      u[IX(i,j)]-=0.5*(p[IX(i+1,j)]-p[IX(i-1,j)])/h;
      v[IX(i,j)]-=0.5*(p[IX(i,j+1)]-p[IX(i,j-1)])/h;
    }
    setBnd(1,u);setBnd(2,v);
  }

  function velStep(u,v,u0,v0,visc,dt){
    addSource(u,u0,dt);addSource(v,v0,dt);
    let t;
    t=u0;u0=u;u=t; diffuse(1,u,u0,visc,dt);
    t=v0;v0=v;v=t; diffuse(2,v,v0,visc,dt);
    project(u,v,u0,v0);
    t=u0;u0=u;u=t;t=v0;v0=v;v=t;
    advect(1,u,u0,u0,v0,dt);advect(2,v,v0,u0,v0,dt);
    project(u,v,u0,v0);
    vx=u;vy=v;vxPrev=u0;vyPrev=v0;
  }

  function densStep(x,x0,u,v,diff,dt){
    addSource(x,x0,dt);
    let t=x0;x0=x;x=t;
    diffuse(0,x,x0,diff,dt);
    t=x0;x0=x;x=t;
    advect(0,x,x0,u,v,dt);
    dens=x;densPrev=x0;
  }

  const imgData=ctx.createImageData(canvas.width,canvas.height);
  const cellW=canvas.width/N, cellH=canvas.height/N;

  function render(){
    const data=imgData.data;
    for(let j=1;j<=N;j++){
      for(let i=1;i<=N;i++){
        const px=Math.floor((i-1)*cellW), py=Math.floor((j-1)*cellH);
        const pw=Math.ceil(cellW), ph=Math.ceil(cellH);
        const v=dens[IX(i,j)];
        const vxv=vx[IX(i,j)], vyv=vy[IX(i,j)];
        const speed=Math.sqrt(vxv*vxv+vyv*vyv);
        let r,g,b;

        if(colorMode==='velocity'){
          const hue=(Math.atan2(vyv,vxv)+Math.PI)/(2*Math.PI);
          const bright=Math.min(1,speed*200);
          [r,g,b]=hsvToRgb(hue,1,bright);
        } else if(colorMode==='pressure'){
          const p=(vxv+vyv)*100;
          r=Math.max(0,Math.min(255,128+p*10));
          g=10; b=Math.max(0,Math.min(255,128-p*10));
        } else if(colorMode==='vorticity'){
          const curl=(vy[IX(i+1,j)]-vy[IX(i-1,j)]-vx[IX(i,j+1)]+vx[IX(i,j-1)])*0.5;
          const c=Math.min(1,Math.abs(curl)*50);
          r=curl>0?Math.floor(c*255):0;
          g=0;
          b=curl<0?Math.floor(c*255):0;
        } else {
          // Dye
          r=Math.min(255,v*800);g=Math.min(255,v*400);b=Math.min(255,v*200);
        }

        for(let dy=0;dy<ph;dy++){
          for(let dx=0;dx<pw;dx++){
            const idx=((py+dy)*canvas.width+(px+dx))*4;
            if(idx>=0&&idx<data.length-3){
              data[idx]=r;data[idx+1]=g;data[idx+2]=b;data[idx+3]=255;
            }
          }
        }
      }
    }
    ctx.putImageData(imgData,0,0);

    // Draw velocity arrows (sparse)
    ctx.globalAlpha=0.5;
    for(let j=4;j<=N;j+=6){
      for(let i=4;i<=N;i+=6){
        const vxv=vx[IX(i,j)]*200, vyv=vy[IX(i,j)]*200;
        const speed=Math.sqrt(vxv*vxv+vyv*vyv);
        if(speed<0.5) continue;
        const px=(i-0.5)*cellW, py=(j-0.5)*cellH;
        ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+vxv*2,py+vyv*2);
        ctx.strokeStyle=`rgba(255,255,255,${Math.min(1,speed/5)})`;
        ctx.lineWidth=0.5;ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
  }

  function hsvToRgb(h,s,v){
    h=h%1;const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
    const c=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
    return [Math.floor(c[0]*255),Math.floor(c[1]*255),Math.floor(c[2]*255)];
  }

  function update(){
    // Clear sources
    vxPrev.fill(0); vyPrev.fill(0); densPrev.fill(0);

    if(mouseDown){
      const ci=Math.floor(prevMX/cellW)+1, cj=Math.floor(prevMY/cellH)+1;
      if(ci>0&&ci<=N&&cj>0&&cj<=N){
        vxPrev[IX(ci,cj)]=60*(prevMX-lastMX);
        vyPrev[IX(ci,cj)]=60*(prevMY-lastMY);
        densPrev[IX(ci,cj)]=80;
      }
    }

    velStep(vx,vy,vxPrev,vyPrev,visc,0.016);
    densStep(dens,densPrev,vx,vy,diff,0.016);
    render();
    if(running) animFrame=requestAnimationFrame(update);
  }

  let lastMX=0,lastMY=0;
  function mouseHandler(e){
    const r=canvas.getBoundingClientRect();
    lastMX=prevMX; lastMY=prevMY;
    prevMX=e.clientX-r.left; prevMY=e.clientY-r.top;
    mouseDown=true;
  }

  canvas.addEventListener('mousedown',e=>{mouseHandler(e);});
  canvas.addEventListener('mousemove',e=>{if(mouseDown)mouseHandler(e);});
  canvas.addEventListener('mouseup',()=>mouseDown=false);
  canvas.addEventListener('mouseleave',()=>mouseDown=false);
  canvas.addEventListener('touchstart',e=>{mouseHandler(e.touches[0]);},{passive:true});
  canvas.addEventListener('touchmove',e=>{mouseHandler(e.touches[0]);},{passive:true});
  canvas.addEventListener('touchend',()=>mouseDown=false);

  document.getElementById('viscosity').addEventListener('input',e=>{
    visc=parseFloat(e.target.value);
    document.getElementById('viscVal').textContent=visc.toFixed(5);
  });
  document.getElementById('diffusion').addEventListener('input',e=>{
    diff=parseFloat(e.target.value);
    document.getElementById('diffFVal').textContent=diff.toFixed(5);
  });
  document.getElementById('fluidColorMode').addEventListener('change',e=>{colorMode=e.target.value;});
  document.getElementById('fluidReset').addEventListener('click',()=>{
    vx.fill(0);vy.fill(0);vxPrev.fill(0);vyPrev.fill(0);dens.fill(0);densPrev.fill(0);
  });
  document.getElementById('fluidVortex').addEventListener('click',()=>{
    const ci=Math.floor(N/2), cj=Math.floor(N/2);
    for(let dj=-12;dj<=12;dj++){
      for(let di=-12;di<=12;di++){
        const r=Math.sqrt(di*di+dj*dj);
        if(r<12){
          vxPrev[IX(ci+di,cj+dj)]+=dj*3;
          vyPrev[IX(ci+di,cj+dj)]+=-di*3;
        }
      }
    }
  });

  const obs=new IntersectionObserver(e=>{
    if(e[0].isIntersecting){running=true;update();obs.disconnect();}
  },{threshold:0.2});
  obs.observe(document.getElementById('fluid'));
})();
