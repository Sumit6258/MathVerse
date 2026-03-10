/* ═══════════════════════════════════════════════
   ART 09 — Strange Loop Visualizer
   Self-referential recursive geometry with zoom
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('strangeLoop'); if(!sec) return;
  const canvas=document.getElementById('strangeCanvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  let W,H,raf=null,t=0;
  let depth=6,scaleFactor=0.5,rotAngle=137.5,zoomSpd=0.3,colorMode='depth';
  let zoomLevel=1,zoomTarget=1;

  function resize(){W=canvas.width=canvas.offsetWidth||800;H=canvas.height=canvas.offsetHeight||540;}

  function hsl(h,s,l){return `hsl(${h%360},${s}%,${l}%)`;}

  function drawLoop(x,y,r,ang,d,parentHue){
    if(d<=0||r<1.5) return;
    const hue=parentHue+(colorMode==='depth'?(d/depth)*240:(colorMode==='angle'?ang*57.3%360:(t*20+d*40)%360));
    const sat=70+d*3;
    const lit=35+d*5;

    // Draw current shape
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(ang);

    // Outer ring
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
    ctx.strokeStyle=hsl(hue,sat,lit); ctx.lineWidth=Math.max(0.5,r*0.04);
    ctx.globalAlpha=0.7; ctx.stroke();

    // Inner geometric pattern — 6-pointed star
    const n=6;
    ctx.beginPath();
    for(let i=0;i<=n;i++){
      const a=i/n*Math.PI*2-Math.PI/2;
      const rr=i%2===0?r*0.9:r*0.45;
      i===0?ctx.moveTo(rr*Math.cos(a),rr*Math.sin(a)):ctx.lineTo(rr*Math.cos(a),rr*Math.sin(a));
    }
    ctx.closePath();
    ctx.strokeStyle=hsl((hue+60)%360,sat,lit+10);
    ctx.lineWidth=Math.max(0.3,r*0.025);
    ctx.globalAlpha=0.5; ctx.stroke();

    // Glow at center
    const grd=ctx.createRadialGradient(0,0,0,0,0,r*0.3);
    grd.addColorStop(0,`hsla(${hue},${sat}%,${lit+20}%,0.4)`);
    grd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(0,0,r*0.3,0,Math.PI*2);
    ctx.globalAlpha=1; ctx.fill();

    ctx.restore();

    // Recursion — place children around the parent
    const childR=r*scaleFactor;
    const childCount=Math.min(d+1,5);
    for(let i=0;i<childCount;i++){
      const a=ang+(i/childCount)*Math.PI*2+rotAngle*Math.PI/180;
      const dist=r*(1-scaleFactor*0.5)+childR;
      drawLoop(x+Math.cos(a)*dist,y+Math.sin(a)*dist,childR,a+rotAngle*Math.PI/180,d-1,(hue+120/childCount)%360);
    }
  }

  function frame(){
    raf=requestAnimationFrame(frame); t+=0.016;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#020205'; ctx.fillRect(0,0,W,H);

    // Smooth zoom animation
    zoomLevel+=(zoomTarget-zoomLevel)*0.03;
    const baseR=Math.min(W,H)*0.18*zoomLevel;

    ctx.save();
    ctx.translate(W/2,H/2);
    ctx.rotate(t*0.05);
    drawLoop(0,0,baseR,t*0.08,depth,t*15%360);
    ctx.restore();

    // Depth glow overlay
    const grd=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.min(W,H)*0.5);
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(1,'rgba(2,2,5,0.4)');
    ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);

    ctx.font='11px JetBrains Mono'; ctx.fillStyle='rgba(255,255,255,0.25)';
    ctx.fillText(`Strange Loop  depth:${depth}  scale:${scaleFactor.toFixed(2)}  rot:${rotAngle.toFixed(1)}°`,8,H-8);
  }

  function start(){if(raf){cancelAnimationFrame(raf);raf=null;}resize();frame();}

  canvas.addEventListener('wheel',e=>{
    zoomTarget=Math.max(0.3,Math.min(4,zoomTarget*Math.pow(0.9,e.deltaY/50)));
    e.preventDefault();
  },{passive:false});

  const b=(id,cb,dId,fmt)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('input',e=>{cb(parseFloat(e.target.value));if(dId)document.getElementById(dId).textContent=fmt?fmt(parseFloat(e.target.value)):e.target.value;});};
  b('slDepth',v=>depth=v,'slDepthVal');
  b('slScale',v=>scaleFactor=v,'slScaleVal',v=>v.toFixed(2));
  b('slRot',v=>rotAngle=v,'slRotVal',v=>v.toFixed(1));
  b('slZoom',v=>zoomSpd=v,'slZoomVal',v=>v.toFixed(2));
  document.getElementById('slColor')?.addEventListener('change',e=>colorMode=e.target.value);

  new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!raf)start();
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
  },{threshold:0.1}).observe(sec);
})();
