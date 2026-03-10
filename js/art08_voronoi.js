/* ═══════════════════════════════════════════════
   ART 08 — Voronoi Galaxy Generator
   Animated orbiting Voronoi cells with glow edges
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('voronoiGalaxy'); if(!sec) return;
  const canvas=document.getElementById('voronoiCanvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  let W,H,raf=null,t=0;
  let nCells=60,orbitSpeed=0.5,glowW=2,colorTheme='galaxy';
  let seeds=[];

  const THEMES={
    galaxy:{bg:'#020205',edge:h=>`hsla(${h},80%,70%,`,fill:h=>`hsla(${h},60%,15%,`},
    neon:{bg:'#000',edge:h=>`hsla(${(h+180)%360},100%,70%,`,fill:h=>`hsla(${h},100%,5%,`},
    ice:{bg:'#010510',edge:h=>`hsla(200,90%,${50+h/6}%,`,fill:h=>`hsla(210,80%,10%,`},
    lava:{bg:'#080100',edge:h=>`hsla(${h*0.3},95%,60%,`,fill:h=>`hsla(${h*0.2},80%,8%,`}
  };

  function initSeeds(){
    seeds=[];
    const cx=W/2,cy=H/2;
    for(let i=0;i<nCells;i++){
      const orbit=30+Math.random()*(Math.min(W,H)*0.45);
      const phase=Math.random()*Math.PI*2;
      const speed=(0.3+Math.random()*0.7)*(Math.random()<0.5?1:-1)*0.015;
      const hue=Math.random()*360;
      seeds.push({cx,cy,orbit,phase,speed,hue,px:cx,py:cy});
    }
  }

  // Fortune's algorithm approximation — scan-line Voronoi via pixel closest-point
  // For performance: use a sparse grid approach
  function computeVoronoi(){
    const step=4;
    const cells=new Map();
    seeds.forEach((s,i)=>cells.set(i,[]));

    for(let y=0;y<H;y+=step){
      for(let x=0;x<W;x+=step){
        let minD=Infinity,minI=0;
        for(let i=0;i<seeds.length;i++){
          const dx=x-seeds[i].px,dy=y-seeds[i].py;
          const d=dx*dx+dy*dy;
          if(d<minD){minD=d;minI=i;}
        }
        if(cells.has(minI)) cells.get(minI).push({x,y});
      }
    }
    return cells;
  }

  function resize(){W=canvas.width=canvas.offsetWidth||800;H=canvas.height=canvas.offsetHeight||540;}

  function frame(){
    raf=requestAnimationFrame(frame); t+=0.016;

    // Update seed positions
    seeds.forEach(s=>{
      s.phase+=s.speed*orbitSpeed;
      s.px=s.cx+Math.cos(s.phase)*s.orbit;
      s.py=s.cy+Math.sin(s.phase)*s.orbit*0.6;
    });

    const theme=THEMES[colorTheme]||THEMES.galaxy;
    ctx.fillStyle=theme.bg; ctx.fillRect(0,0,W,H);

    // Draw Voronoi cells efficiently using edge detection
    const imgData=ctx.createImageData(W,H);
    const data=imgData.data;

    // Per-pixel closest seed
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        let d1=Infinity,d2=Infinity,i1=0;
        for(let i=0;i<seeds.length;i++){
          const dx=x-seeds[i].px,dy=y-seeds[i].py;
          const d=dx*dx+dy*dy;
          if(d<d1){d2=d1;d1=d;i1=i;}
          else if(d<d2){d2=d;}
        }
        const edgeDist=Math.sqrt(d2)-Math.sqrt(d1);
        const idx=(y*W+x)*4;
        const h=seeds[i1].hue;
        if(edgeDist<glowW*2){
          // Edge glow
          const g=Math.exp(-edgeDist*edgeDist/(glowW*glowW));
          const c=new THREE?.Color?.()?.setHSL(h/360,0.9,0.5+g*0.4)||null;
          const r2=Math.round((h/360)*255),gb=Math.round(200+g*55);
          // Simplified HSL edge color
          data[idx]=Math.round(100+g*155*Math.sin(h/360*Math.PI));
          data[idx+1]=Math.round(80+g*175*Math.sin((h/360+0.33)*Math.PI));
          data[idx+2]=Math.round(150+g*105*Math.sin((h/360+0.67)*Math.PI));
          data[idx+3]=Math.round(50+g*200);
        } else {
          // Cell interior - subtle gradient
          const r=h/360,depth=1-Math.sqrt(d1)/300;
          data[idx]=Math.round(r*20); data[idx+1]=Math.round(r*15); data[idx+2]=Math.round(30+r*20);
          data[idx+3]=Math.round(depth*60+10);
        }
      }
    }
    ctx.putImageData(imgData,0,0);

    // Draw seed dots with glow
    seeds.forEach(s=>{
      const grad=ctx.createRadialGradient(s.px,s.py,0,s.px,s.py,8);
      grad.addColorStop(0,`hsla(${s.hue},100%,90%,0.9)`);
      grad.addColorStop(0.4,`hsla(${s.hue},80%,60%,0.4)`);
      grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(s.px,s.py,8,0,Math.PI*2); ctx.fill();
    });

    // Info
    ctx.font='11px JetBrains Mono'; ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.fillText(`Voronoi cells:${nCells}  theme:${colorTheme}  t=${t.toFixed(1)}`,8,H-8);
  }

  function start(){if(raf){cancelAnimationFrame(raf);raf=null;}resize();initSeeds();frame();}

  canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect();
    seeds.push({cx:e.clientX-r.left,cy:e.clientY-r.top,orbit:0,phase:0,speed:0.01,hue:Math.random()*360,px:e.clientX-r.left,py:e.clientY-r.top});
  });

  const b=(id,cb,dId)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('input',e=>{cb(parseFloat(e.target.value));if(dId)document.getElementById(dId).textContent=e.target.value;});};
  b('vorNC',v=>{nCells=v;initSeeds();},'vorNCVal');
  b('vorSpeed',v=>orbitSpeed=v,'vorSpeedVal');
  b('vorGlow',v=>glowW=v,'vorGlowVal');
  document.getElementById('vorColor')?.addEventListener('change',e=>colorTheme=e.target.value);

  new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!raf)start();
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
  },{threshold:0.1}).observe(sec);
})();
