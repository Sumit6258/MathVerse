/* ═══════════════════════════════════════════════
   ART 02 — Fourier Flow Field
   GPU-instanced glowing particle trails
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('fourierFlow'); if(!sec) return;
  const canvas=document.getElementById('flowCanvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  let W,H,raf=null;
  let harmonics=6,partCount=4000,decay=0.97,speed=1.0;
  let particles=[],field=[];
  let coeffs=[];

  function resize(){
    W=canvas.width=canvas.offsetWidth||800;
    H=canvas.height=canvas.offsetHeight||540;
  }

  function genCoeffs(){
    coeffs=[];
    for(let k=0;k<harmonics;k++){
      coeffs.push({
        ax: (Math.random()-0.5)*0.04,
        ay: (Math.random()-0.5)*0.04,
        bx: (Math.random()-0.5)*0.04,
        by: (Math.random()-0.5)*0.04,
        fx: 0.5+Math.random()*2.5,
        fy: 0.5+Math.random()*2.5,
        ph: Math.random()*Math.PI*2
      });
    }
  }

  function vectorAt(x,y,t){
    let vx=0,vy=0;
    for(const c of coeffs){
      const nx=x/W*6.28,ny=y/H*6.28;
      vx+=Math.sin(c.fx*nx+c.ay*ny+c.ph+t*0.2);
      vy+=Math.cos(c.bx*nx+c.fy*ny+c.ph*1.3+t*0.17);
    }
    return{vx:vx/harmonics,vy:vy/harmonics};
  }

  function spawnParticles(){
    particles=[];
    for(let i=0;i<partCount;i++){
      particles.push({
        x:Math.random()*W, y:Math.random()*H,
        vx:0, vy:0,
        hue:Math.random()*360, life:Math.random()*200+50,
        alpha:0.8+Math.random()*0.2
      });
    }
  }

  let t=0;
  function frame(){
    raf=requestAnimationFrame(frame);
    t+=0.016*speed;
    // Fade background
    ctx.fillStyle=`rgba(2,2,5,${1-decay})`;
    ctx.fillRect(0,0,W,H);

    // Update & draw particles
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      const {vx,vy}=vectorAt(p.x,p.y,t);
      p.vx=p.vx*0.85+vx*1.8*speed;
      p.vy=p.vy*0.85+vy*1.8*speed;
      const px=p.x,py=p.y;
      p.x+=p.vx; p.y+=p.vy;
      p.life--;
      if(p.life<=0||p.x<0||p.x>W||p.y<0||p.y>H){
        particles[i]={x:Math.random()*W,y:Math.random()*H,vx:0,vy:0,hue:Math.random()*360,life:200+Math.random()*100,alpha:0.8};
        continue;
      }
      const spd=Math.sqrt(p.vx*p.vx+p.vy*p.vy);
      const brightness=50+spd*40;
      const a=Math.min(0.9,p.life/30)*p.alpha;
      ctx.beginPath();
      ctx.moveTo(px,py); ctx.lineTo(p.x,p.y);
      ctx.strokeStyle=`hsla(${p.hue},90%,${brightness}%,${a})`;
      ctx.lineWidth=0.8+spd*0.3;
      ctx.stroke();
      // Glow dot at head
      if(spd>0.5){
        const grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,3+spd);
        grad.addColorStop(0,`hsla(${p.hue},100%,90%,${a*0.6})`);
        grad.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(p.x,p.y,3+spd,0,Math.PI*2); ctx.fill();
      }
    }
    // Info
    ctx.font='11px JetBrains Mono';
    ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.fillText(`Fourier harmonics: ${harmonics}  particles: ${partCount}  t=${t.toFixed(1)}`,8,H-8);
  }

  function start(){
    if(raf){cancelAnimationFrame(raf);raf=null;}
    resize(); genCoeffs(); spawnParticles();
    ctx.fillStyle='#020205'; ctx.fillRect(0,0,W,H);
    frame();
  }

  canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect(),cx=e.clientX-r.left,cy=e.clientY-r.top;
    for(let i=0;i<200;i++) particles.push({x:cx+(Math.random()-0.5)*30,y:cy+(Math.random()-0.5)*30,vx:0,vy:0,hue:Math.random()*60+180,life:300,alpha:1});
  });

  const b=(id,cb,dId,fmt)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('input',e=>{cb(parseFloat(e.target.value));if(dId)document.getElementById(dId).textContent=fmt?fmt(parseFloat(e.target.value)):e.target.value;});};
  b('flowHarm',v=>{harmonics=v;genCoeffs();},'flowHarmVal');
  b('flowPart',v=>{partCount=v;spawnParticles();},'flowPartVal');
  b('flowDecay',v=>decay=v,'flowDecayVal',v=>v.toFixed(3));
  b('flowSpeed',v=>speed=v,'flowSpeedVal',v=>v.toFixed(1));
  document.getElementById('flowRegen')?.addEventListener('click',start);

  new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!raf)start();
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
  },{threshold:0.1}).observe(sec);
})();
