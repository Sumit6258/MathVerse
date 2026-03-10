/* ═══════════════════════════════════════════
   ADV 13 — Boids + Chaotic Attractors
   Emergent flocking on strange attractors
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('boids'); if(!section)return;
  const canvas=document.getElementById('boidsCanvas'); if(!canvas)return;
  canvas.width=canvas.offsetWidth||700; canvas.height=canvas.offsetHeight||500;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;

  let N=200, attractorType='none', chaosStr=0.3, visionR=60, trailLen=20;
  let boids=[], raf=null;
  // Attractor state
  let ax=0.1, ay=0, az=0, at=0;

  class Boid{
    constructor(){
      this.x=Math.random()*W; this.y=Math.random()*H;
      this.vx=(Math.random()-0.5)*3; this.vy=(Math.random()-0.5)*3;
      this.trail=[]; this.hue=Math.random()*360;
    }
    update(attractorForce){
      const maxSpeed=3.5, minSpeed=1;
      // Boid rules
      let sep_x=0,sep_y=0,aln_x=0,aln_y=0,coh_x=0,coh_y=0,cnt=0;
      boids.forEach(b=>{
        if(b===this)return;
        const dx=b.x-this.x,dy=b.y-this.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<visionR&&d>0){
          if(d<20){sep_x-=dx/d;sep_y-=dy/d;}
          aln_x+=b.vx;aln_y+=b.vy;
          coh_x+=dx;coh_y+=dy;
          cnt++;
        }
      });
      if(cnt>0){
        aln_x/=cnt;aln_y/=cnt;
        coh_x/=cnt;coh_y/=cnt;
      }
      this.vx+=sep_x*0.08+aln_x*0.04+coh_x*0.005;
      this.vy+=sep_y*0.08+aln_y*0.04+coh_y*0.005;
      // Attractor force
      if(attractorForce&&attractorType!=='none'){
        this.vx+=attractorForce.x*chaosStr;
        this.vy+=attractorForce.y*chaosStr;
      }
      // Clamp speed
      const spd=Math.sqrt(this.vx*this.vx+this.vy*this.vy);
      if(spd>maxSpeed){this.vx=this.vx/spd*maxSpeed;this.vy=this.vy/spd*maxSpeed;}
      if(spd<minSpeed&&spd>0){this.vx=this.vx/spd*minSpeed;this.vy=this.vy/spd*minSpeed;}
      // Wrap
      this.trail.push({x:this.x,y:this.y});
      if(this.trail.length>trailLen)this.trail.shift();
      this.x=(this.x+this.vx+W)%W;
      this.y=(this.y+this.vy+H)%H;
    }
    draw(){
      // Trail
      if(trailLen>0&&this.trail.length>1){
        for(let i=1;i<this.trail.length;i++){
          const alpha=i/this.trail.length*0.4;
          ctx.beginPath();
          ctx.moveTo(this.trail[i-1].x,this.trail[i-1].y);
          ctx.lineTo(this.trail[i].x,this.trail[i].y);
          ctx.strokeStyle=`hsla(${this.hue},80%,65%,${alpha})`;
          ctx.lineWidth=0.8; ctx.stroke();
        }
      }
      // Body (triangle pointing in velocity direction)
      const ang=Math.atan2(this.vy,this.vx);
      const size=5;
      ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(size*1.5,0); ctx.lineTo(-size,size*0.7); ctx.lineTo(-size,-size*0.7); ctx.closePath();
      ctx.fillStyle=`hsla(${this.hue},90%,65%,0.85)`; ctx.fill();
      ctx.restore();
    }
  }

  function stepAttractor(){
    const dt=0.015;
    let fx=0,fy=0;
    if(attractorType==='lorenz'){
      const sigma=10,rho=28,beta=2.67;
      const dx=sigma*(ay-ax),dy=ax*(rho-az)-ay,dz=ax*ay-beta*az;
      ax+=dx*dt;ay+=dy*dt;az+=dz*dt;
      fx=(ax/25)*0.5; fy=(ay/25)*0.5;
    } else if(attractorType==='rossler'){
      const a=0.2,b=0.2,c=5.7;
      const dx=-ay-az,dy=ax+a*ay,dz=b+az*(ax-c);
      ax+=dx*dt*2;ay+=dy*dt*2;az+=dz*dt*2;
      fx=(ax/12)*0.5; fy=(ay/12)*0.5;
    } else if(attractorType==='thomas'){
      const b=0.19;
      const dx=Math.sin(ay)-b*ax,dy=Math.sin(az)-b*ay,dz=Math.sin(ax)-b*az;
      ax+=dx*dt*3;ay+=dy*dt*3;az+=dz*dt*3;
      fx=ax*0.3; fy=ay*0.3;
    }
    return{x:fx,y:fy};
  }

  function initBoids(){
    boids=[];
    for(let i=0;i<N;i++)boids.push(new Boid());
    ax=0.1;ay=0;az=0;
  }

  function loop(){
    ctx.fillStyle='rgba(3,3,7,0.2)'; ctx.fillRect(0,0,W,H);
    const af=stepAttractor();
    boids.forEach(b=>{b.update(af);b.draw();});
    // Info
    ctx.font='11px JetBrains Mono';
    ctx.fillStyle='rgba(255,255,255,0.3)';
    ctx.fillText(`N=${N}  attractor:${attractorType}  chaos:${chaosStr.toFixed(2)}`,8,H-8);
    raf=requestAnimationFrame(loop);
  }

  document.getElementById('boidN')?.addEventListener('input',e=>{N=parseInt(e.target.value);document.getElementById('boidNVal').textContent=e.target.value;initBoids();});
  document.getElementById('boidAttract')?.addEventListener('change',e=>{attractorType=e.target.value;ax=0.1;ay=0;az=0;});
  document.getElementById('boidChaos')?.addEventListener('input',e=>{chaosStr=parseFloat(e.target.value);document.getElementById('boidChaosVal').textContent=e.target.value;});
  document.getElementById('boidVision')?.addEventListener('input',e=>{visionR=parseInt(e.target.value);document.getElementById('boidVisionVal').textContent=e.target.value;});
  document.getElementById('boidTrail')?.addEventListener('input',e=>{trailLen=parseInt(e.target.value);document.getElementById('boidTrailVal').textContent=e.target.value;});

  new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!raf){ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);initBoids();loop();}
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
  },{threshold:0.1}).observe(section);
})();
