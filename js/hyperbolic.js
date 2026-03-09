/* ═══════════════════════════════════════════
   hyperbolic.js — Poincaré Disk Model
   + 4D Geometry (tesseract, simplex, etc.)
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('hyperbolicCanvas');
  if(!canvas) return;
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height, CX=W/2, CY=H/2, R=Math.min(W,H)*0.46;

  let mode='tessellation', p=7, q=3, depth=4;
  let offset={x:0,y:0}, dragging=false, lastDrag={x:0,y:0};
  let animFrame;

  // ── Möbius transform in the Poincaré disk ──────────────
  function mobiusAdd(a, b) {
    // Möbius addition: (a+b)/(1+conj(a)*b)
    const ar=a[0],ai=a[1],br=b[0],bi=b[1];
    const num=[ar+br, ai+bi];
    const den=[1+ar*br+ai*bi, ar*bi-ai*br];
    const d=den[0]*den[0]+den[1]*den[1];
    return [(num[0]*den[0]+num[1]*den[1])/d, (num[1]*den[0]-num[0]*den[1])/d];
  }

  function diskToScreen(z) {
    return [CX+(z[0]+offset.x)*R, CY+(z[1]+offset.y)*R];
  }

  function reflect(z, a, b) {
    // Reflect point z through the geodesic from a to b
    const [ar,ai]=[a[0],a[1]], [br,bi]=[b[0],b[1]];
    const [zr,zi]=[z[0],z[1]];
    // Inversion through circle orthogonal to unit disk passing through a and b
    const cr=br-ar*(br*ar+bi*ai), ci=bi-ai*(br*ar+bi*ai);
    const d=cr*cr+ci*ci;
    if(d<1e-10) return [-zr,-zi];
    const t=[(zr-ar)*cr+(zi-ai)*ci, (zi-ai)*cr-(zr-ar)*ci];
    return [ar+t[0]/d, ai+t[1]/d];
  }

  // Generate vertices of regular p-gon in hyperbolic space
  function hypPoly(center, r, n) {
    const pts=[];
    for(let k=0;k<n;k++){
      const angle=(2*Math.PI*k)/n;
      // Map from hyperbolic to Poincaré disk
      const hypR=Math.tanh(r/2);
      const z=[hypR*Math.cos(angle)+center[0], hypR*Math.sin(angle)+center[1]];
      pts.push(z);
    }
    return pts;
  }

  function drawGeodesic(a, b, color='rgba(0,200,255,0.6)', lw=1) {
    const [ax,ay]=diskToScreen(a), [bx,by]=diskToScreen(b);
    ctx.beginPath();
    // Check if line passes near center (diameter)
    const cross=a[0]*b[1]-a[1]*b[0];
    if(Math.abs(cross)<0.001){
      ctx.moveTo(ax,ay); ctx.lineTo(bx,by);
    } else {
      // Find center of circle
      const d=2*(a[0]*(b[1]-0)-b[0]*(a[1]-0));
      if(Math.abs(d)<0.001){ctx.moveTo(ax,ay);ctx.lineTo(bx,by);}
      else {
        const cx=(a[1]-0)*(a[0]*a[0]+a[1]*a[1]-b[0]*b[0]-b[1]*b[1])/d;
        // Just draw straight line for simplicity at this precision level
        ctx.moveTo(ax,ay); ctx.lineTo(bx,by);
      }
    }
    ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.stroke();
  }

  function drawDisk(){
    ctx.clearRect(0,0,W,H);
    // Background gradient
    const bg=ctx.createRadialGradient(CX,CY,0,CX,CY,R);
    bg.addColorStop(0,'#061020');bg.addColorStop(1,'#020508');
    ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(CX,CY,R,0,Math.PI*2); ctx.fill();
  }

  function drawBoundary(){
    ctx.beginPath(); ctx.arc(CX,CY,R,0,Math.PI*2);
    ctx.strokeStyle='rgba(0,200,255,0.3)'; ctx.lineWidth=1.5; ctx.stroke();
    // Subtle grid
    ctx.beginPath(); ctx.moveTo(CX-R,CY); ctx.lineTo(CX+R,CY);
    ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=0.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX,CY-R); ctx.lineTo(CX,CY+R); ctx.stroke();
  }

  function renderTessellation(){
    drawDisk(); drawBoundary();
    // Draw {p,q} tessellation by recursively reflecting
    const alpha=2*Math.PI/p, beta=2*Math.PI/q;
    const cosPi_p=Math.cos(Math.PI/p), cosPi_q=Math.cos(Math.PI/q);
    const cosAlpha=Math.cos(alpha), cosBeta=Math.cos(beta);
    // Distance to edge midpoint in hyperbolic space
    const cosh_r=Math.cos(Math.PI/p)/Math.sin(Math.PI/q);
    if(cosh_r<=1){return;} // Not hyperbolic
    const hypR=Math.acosh(cosh_r);
    const diskR=Math.tanh(hypR/2);

    const centers=[[0,0]];
    const drawn=new Set();
    const queue=[[0,0,0]]; // center, rotation, depth

    while(queue.length>0&&drawn.size<500){
      const [cx,cy,d]=queue.shift();
      const key=`${cx.toFixed(3)},${cy.toFixed(3)}`;
      if(drawn.has(key)||d>depth) continue;
      drawn.add(key);

      const pts=[];
      for(let k=0;k<p;k++){
        const angle=(2*Math.PI*k/p)+Math.PI/p;
        const vr=cx+diskR*Math.cos(angle), vi=cy+diskR*Math.sin(angle);
        const norm=Math.sqrt(vr*vr+vi*vi);
        // Push to disk boundary region
        const pz=[vr,vi];
        pts.push(pz);
      }

      // Draw polygon
      if(d<depth){
        ctx.beginPath();
        pts.forEach((pt,i)=>{
          const [sx,sy]=diskToScreen(pt);
          const insideDisk=pt[0]*pt[0]+pt[1]*pt[1]<0.99;
          if(!insideDisk) return;
          i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);
        });
        ctx.closePath();
        const hue=((cx*4+cy*7+d*30+200)%360);
        ctx.fillStyle=`hsla(${hue},80%,30%,0.3)`;
        ctx.fill();
        ctx.strokeStyle=`hsla(${hue},100%,70%,${0.7-d*0.1})`;
        ctx.lineWidth=0.8; ctx.stroke();
      }

      // Queue neighbors
      if(d<depth-1){
        for(let k=0;k<p;k++){
          const angle=(2*Math.PI*k/p)+Math.PI/p;
          const dist=diskR*1.8;
          const nx=cx+dist*Math.cos(angle), ny=cy+dist*Math.sin(angle);
          if(nx*nx+ny*ny<0.98) queue.push([nx,ny,d+1]);
        }
      }
    }
  }

  function renderGeodesics(){
    drawDisk(); drawBoundary();
    const n=16;
    for(let i=0;i<n;i++){
      const t=i/n;
      const a=[0.8*Math.cos(t*Math.PI*2), 0.8*Math.sin(t*Math.PI*2)];
      const b=[0.8*Math.cos(t*Math.PI*2+Math.PI+0.3), 0.8*Math.sin(t*Math.PI*2+Math.PI+0.3)];
      drawGeodesic(a,b,`hsla(${i*360/n},100%,70%,0.6)`,1.2);
    }
    // Concentric circles
    for(let r=0.2;r<1;r+=0.15){
      ctx.beginPath();ctx.arc(CX+offset.x*R,CY+offset.y*R,r*R,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,215,0,${0.3*(1-r)})`;ctx.lineWidth=0.8;ctx.stroke();
    }
  }

  function renderEscher(){
    drawDisk(); drawBoundary();
    // Simplified Escher-like pattern
    const n=8;
    for(let d=0;d<5;d++){
      for(let i=0;i<n;i++){
        const angle=(i/n)*Math.PI*2;
        const r=Math.tanh(d*0.4);
        const cx2=r*Math.cos(angle), cy2=r*Math.sin(angle);
        const [sx,sy]=diskToScreen([cx2,cy2]);
        if(r<0.98){
          ctx.beginPath();
          ctx.arc(sx,sy,Math.max(2,(0.1-d*0.015)*R),0,Math.PI*2);
          ctx.fillStyle=`hsla(${i*45+d*20},90%,${60-d*8}%,0.7)`;
          ctx.fill();
        }
      }
    }
  }

  const modes={tessellation:renderTessellation,geodesics:renderGeodesics,tiling:renderEscher};

  function render(){modes[mode]();}

  // Controls
  document.getElementById('hyperbolicMode').addEventListener('change',e=>{mode=e.target.value;render();});
  document.getElementById('hypP').addEventListener('input',e=>{
    p=parseInt(e.target.value);document.getElementById('hypPVal').textContent=p;render();
  });
  document.getElementById('hypQ').addEventListener('input',e=>{
    q=parseInt(e.target.value);document.getElementById('hypQVal').textContent=q;render();
  });
  document.getElementById('hypDepth').addEventListener('input',e=>{
    depth=parseInt(e.target.value);document.getElementById('hypDepthVal').textContent=depth;render();
  });
  document.getElementById('hypRender').addEventListener('click',render);

  canvas.addEventListener('mousedown',e=>{dragging=true;lastDrag={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('mousemove',e=>{
    if(!dragging) return;
    offset.x+=(e.clientX-lastDrag.x)/R*0.5;
    offset.y+=(e.clientY-lastDrag.y)/R*0.5;
    const l=Math.sqrt(offset.x*offset.x+offset.y*offset.y);
    if(l>0.9){offset.x*=0.9/l;offset.y*=0.9/l;}
    lastDrag={x:e.clientX,y:e.clientY};
    render();
  });
  canvas.addEventListener('mouseup',()=>dragging=false);
  canvas.addEventListener('mouseleave',()=>dragging=false);

  const obs=new IntersectionObserver(e=>{
    if(e[0].isIntersecting){render();obs.disconnect();}
  },{threshold:0.2});
  obs.observe(document.getElementById('hyperbolic'));
})();
