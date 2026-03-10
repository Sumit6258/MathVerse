/* ═══════════════════════════════════════════
   ADV 15 — Mean Curvature Flow
   Shapes deforming toward circles
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('curvflow'); if(!section)return;
  const canvas=document.getElementById('curvCanvas'); if(!canvas)return;
  canvas.width=canvas.offsetWidth||700; canvas.height=canvas.offsetHeight||500;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;

  let shape='star',flowSpeed=0.5,colorCurv=true,raf=null,t=0;
  let pts=[],curvatures=[];
  const N=256; // polygon vertices

  function makeShape(type){
    const ps=[];
    const cx=W/2,cy=H/2,R=Math.min(W,H)*0.3;
    for(let i=0;i<N;i++){
      const ang=(i/N)*Math.PI*2;
      let r=R;
      if(type==='star'){const sp=8;r=R*(0.5+0.5*Math.abs(Math.cos(sp*ang/2)));}
      else if(type==='ellipse'){r=R;const a=1.8,b=0.6;r=R*a*b/Math.sqrt(a*a*Math.sin(ang)**2+b*b*Math.cos(ang)**2)*0.8;}
      else if(type==='gear'){const teeth=12;r=R*(0.8+0.2*Math.cos(teeth*ang));}
      else{ // random blob
        const freq=[1,2,3,4,5,7], amps=[0.3,0.15,0.1,0.08,0.06,0.04];
        let mod=0; freq.forEach((f,k)=>mod+=amps[k]*(Math.cos(f*ang+k)+Math.sin(f*ang*1.3+k)));
        r=R*(0.7+0.3*mod/freq.length);
      }
      ps.push({x:cx+r*Math.cos(ang),y:cy+r*Math.sin(ang)});
    }
    return ps;
  }

  function computeCurvature(ps){
    const n=ps.length;
    const curv=new Float32Array(n);
    for(let i=0;i<n;i++){
      const p=ps[(i-1+n)%n],q=ps[i],r=ps[(i+1)%n];
      const dx1=q.x-p.x,dy1=q.y-p.y;
      const dx2=r.x-q.x,dy2=r.y-q.y;
      const cross=dx1*dy2-dy1*dx2;
      const len1=Math.sqrt(dx1*dx1+dy1*dy1)||0.001;
      const len2=Math.sqrt(dx2*dx2+dy2*dy2)||0.001;
      curv[i]=2*cross/(len1*len2*(len1+len2));
    }
    return curv;
  }

  function stepFlow(ps,dt){
    const n=ps.length;
    const curv=computeCurvature(ps);
    curvatures=curv;
    const newPts=[];
    for(let i=0;i<n;i++){
      const p=ps[(i-1+n)%n],q=ps[i],r=ps[(i+1)%n];
      // Normal direction: inward = normalized (q - centroid)
      const dx1=r.x-p.x,dy1=r.y-p.y;
      const len=Math.sqrt(dx1*dx1+dy1*dy1)||0.001;
      const nx=-dy1/len, ny=dx1/len; // perpendicular to tangent
      const H=curv[i];
      newPts.push({x:q.x+nx*H*dt*50,y:q.y+ny*H*dt*50});
    }
    // Re-parameterize (equidistribute)
    const rePts=[];
    let totalLen=0;
    for(let i=0;i<n;i++){const q=newPts[i],r=newPts[(i+1)%n];const dx=r.x-q.x,dy=r.y-q.y;totalLen+=Math.sqrt(dx*dx+dy*dy);}
    let acc=0,j=0;
    for(let i=0;i<n;i++){
      const target=(i/n)*totalLen;
      while(j<n){
        const q=newPts[j],r=newPts[(j+1)%n];
        const segLen=Math.sqrt((r.x-q.x)**2+(r.y-q.y)**2);
        if(acc+segLen>=target){const f=(target-acc)/segLen;rePts.push({x:q.x+f*(r.x-q.x),y:q.y+f*(r.y-q.y)});break;}
        acc+=segLen;j=(j+1)%n;
      }
    }
    return rePts.length===n?rePts:newPts;
  }

  function isCollapsed(ps){
    let cx=0,cy=0;ps.forEach(p=>{cx+=p.x;cy+=p.y;});cx/=ps.length;cy/=ps.length;
    const d=ps.reduce((m,p)=>Math.max(m,Math.sqrt((p.x-cx)**2+(p.y-cy)**2)),0);
    return d<5;
  }

  function hsvToRgb(h,s,v){
    h=((h%1)+1)%1;const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),tt=v*(1-(1-f)*s);
    return[[v,tt,p],[q,v,p],[p,v,tt],[p,q,v],[tt,p,v],[v,p,q]][i%6].map(x=>Math.round(x*255));
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);
    if(pts.length<3)return;
    const n=pts.length;
    const maxC=curvatures.length?Math.max(...curvatures.map(Math.abs))||1:1;

    if(colorCurv){
      // Draw colored segments
      for(let i=0;i<n;i++){
        const p=pts[i],q=pts[(i+1)%n];
        const cv=curvatures[i]||0;
        const t2=cv/maxC;
        const hue=t2>0?0.6:0.0;
        const [r,g,b]=hsvToRgb(hue,0.9,0.5+Math.abs(t2)*0.5);
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
        ctx.strokeStyle=`rgba(${r},${g},${b},0.9)`; ctx.lineWidth=3; ctx.stroke();
      }
      // Curvature normals
      for(let i=0;i<n;i+=4){
        const q=pts[i];
        const p=pts[(i-1+n)%n],r=pts[(i+1)%n];
        const dx1=r.x-p.x,dy1=r.y-p.y;
        const len=Math.sqrt(dx1*dx1+dy1*dy1)||0.001;
        const nx=-dy1/len,ny=dx1/len;
        const cv=curvatures[i]||0;
        const scale=Math.min(20,Math.abs(cv)*2000);
        ctx.beginPath(); ctx.moveTo(q.x,q.y);
        ctx.lineTo(q.x+nx*scale*Math.sign(cv),q.y+ny*scale*Math.sign(cv));
        ctx.strokeStyle='rgba(255,215,0,0.3)'; ctx.lineWidth=0.7; ctx.stroke();
      }
    } else {
      ctx.beginPath(); pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.closePath();
      const grad=ctx.createLinearGradient(0,0,W,H);
      grad.addColorStop(0,'rgba(0,200,255,0.9)'); grad.addColorStop(1,'rgba(191,90,242,0.9)');
      ctx.strokeStyle=grad; ctx.lineWidth=3; ctx.stroke();
      ctx.fillStyle='rgba(0,200,255,0.05)'; ctx.fill();
    }

    // Area computation
    let area=0;
    for(let i=0;i<n;i++){const q=pts[i],r=pts[(i+1)%n];area+=q.x*r.y-r.x*q.y;}
    area=Math.abs(area/2);

    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillText(`shape:${shape}  area:${Math.round(area)}  t:${t.toFixed(1)}`,8,H-6);
    ctx.fillStyle='rgba(0,200,255,0.6)'; ctx.fillText('■ Positive curvature',W-180,H-18);
    ctx.fillStyle='rgba(255,100,100,0.6)'; ctx.fillText('■ Negative curvature',W-180,H-5);
  }

  function loop(){
    raf=requestAnimationFrame(loop);
    for(let s=0;s<3;s++){
      pts=stepFlow(pts,flowSpeed*0.01);
      if(isCollapsed(pts)){pts=makeShape(shape);t=0;break;}
    }
    t+=flowSpeed*0.03;
    draw();
  }

  function reset(){pts=makeShape(shape);t=0;if(raf){cancelAnimationFrame(raf);raf=null;}loop();}

  document.getElementById('curvShape')?.addEventListener('change',e=>{shape=e.target.value;reset();});
  document.getElementById('curvSpeed')?.addEventListener('input',e=>{flowSpeed=parseFloat(e.target.value);document.getElementById('curvSpeedVal').textContent=e.target.value;});
  document.getElementById('curvColorOn')?.addEventListener('change',e=>colorCurv=e.target.checked);
  document.getElementById('curvReset')?.addEventListener('click',reset);

  new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!raf)reset();
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
  },{threshold:0.1}).observe(section);
})();
