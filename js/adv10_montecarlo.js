/* ═══════════════════════════════════════════
   ADV 10 — Monte Carlo π Estimation
   Real-time stochastic geometry
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('montecarlo'); if(!section)return;
  const canvas=document.getElementById('mcCanvas'); if(!canvas)return;
  canvas.width=canvas.offsetWidth||600; canvas.height=canvas.offsetHeight||500;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;

  const convCanvas=document.getElementById('mcConverge');
  const cctx=convCanvas?.getContext('2d');
  const CW=convCanvas?.width||240, CH=convCanvas?.height||120;

  let total=0,inside=0,raf=null,rate=100,ptSize=2;
  const piHistory=[];

  function reset(){
    total=0; inside=0; piHistory.length=0;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);
    // Draw square border
    const S=Math.min(W,H)-20, ox=(W-S)/2, oy=(H-S)/2;
    ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5;
    ctx.strokeRect(ox,oy,S,S);
    // Draw circle
    ctx.beginPath(); ctx.arc(ox+S/2,oy+S/2,S/2,0,Math.PI*2);
    ctx.strokeStyle='rgba(0,200,255,0.5)'; ctx.lineWidth=1.5; ctx.stroke();
    updateStats();
    if(cctx){cctx.clearRect(0,0,CW,CH);cctx.fillStyle='#030307';cctx.fillRect(0,0,CW,CH);}
  }

  function addPoints(n){
    const S=Math.min(W,H)-20, ox=(W-S)/2, oy=(H-S)/2, r=S/2, cx=ox+r, cy=oy+r;
    for(let i=0;i<n;i++){
      const rx=Math.random(), ry=Math.random();
      const px=ox+rx*S, py=oy+ry*S;
      const dx=rx-0.5, dy=ry-0.5;
      const hit=(dx*dx+dy*dy)<=0.25;
      if(hit)inside++;
      total++;
      ctx.beginPath(); ctx.arc(px,py,ptSize,0,Math.PI*2);
      ctx.fillStyle=hit?'rgba(0,200,255,0.7)':'rgba(255,100,100,0.5)';
      ctx.fill();
    }
    if(total>0) piHistory.push(4*inside/total);
    if(piHistory.length>200) piHistory.shift();
  }

  function updateStats(){
    const piEst=total>0?(4*inside/total):0;
    document.getElementById('mcTotal').textContent=total.toLocaleString();
    document.getElementById('mcInside').textContent=inside.toLocaleString();
    document.getElementById('mcPi').textContent=total>0?piEst.toFixed(6):'—';
    document.getElementById('mcError').textContent=total>0?Math.abs(piEst-Math.PI).toFixed(6):'—';
  }

  function drawConvergence(){
    if(!cctx||piHistory.length<2)return;
    cctx.clearRect(0,0,CW,CH);
    cctx.fillStyle='#030307'; cctx.fillRect(0,0,CW,CH);
    // π reference line
    const piY=CH-(Math.PI-2.5)/(4-2.5)*CH;
    cctx.setLineDash([4,4]);
    cctx.beginPath(); cctx.moveTo(0,piY); cctx.lineTo(CW,piY);
    cctx.strokeStyle='rgba(255,215,0,0.6)'; cctx.lineWidth=1; cctx.stroke();
    cctx.setLineDash([]);
    // Convergence line
    cctx.beginPath();
    piHistory.forEach((v,i)=>{
      const x=(i/piHistory.length)*CW;
      const y=CH-(v-2.5)/(4-2.5)*CH;
      i===0?cctx.moveTo(x,y):cctx.lineTo(x,y);
    });
    cctx.strokeStyle='rgba(0,200,255,0.9)'; cctx.lineWidth=1.5; cctx.stroke();
    cctx.font='9px JetBrains Mono';
    cctx.fillStyle='rgba(255,215,0,0.7)'; cctx.fillText('π=3.14159',2,piY-3);
    cctx.fillStyle='rgba(0,200,255,0.6)'; cctx.fillText('Convergence to π',2,CH-3);
  }

  function loop(){
    addPoints(rate);
    updateStats();
    drawConvergence();
    raf=requestAnimationFrame(loop);
  }

  document.getElementById('mcRate')?.addEventListener('input',e=>{rate=parseInt(e.target.value);document.getElementById('mcRateVal').textContent=e.target.value;});
  document.getElementById('mcSz')?.addEventListener('input',e=>{ptSize=parseFloat(e.target.value);document.getElementById('mcSzVal').textContent=e.target.value;});
  document.getElementById('mcReset')?.addEventListener('click',()=>{if(raf){cancelAnimationFrame(raf);raf=null;}reset();loop();});

  new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!raf){reset();loop();}
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
  },{threshold:0.1}).observe(section);
})();
