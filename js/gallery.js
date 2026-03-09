/* ═══════════════════════════════════════════
   gallery.js — Mathematical Beauty Gallery
   ═══════════════════════════════════════════ */

(function() {
  const canvas = document.getElementById('galleryCanvas');
  canvas.width = 700; canvas.height = 500;
  const ctx = canvas.getContext('2d');
  let W = canvas.width, H = canvas.height;
  let currentGallery = 'voronoi';
  let animFrame = null;

  // ── VORONOI DIAGRAM ───────────────────────
  function drawVoronoi() {
    if(animFrame) cancelAnimationFrame(animFrame);
    ctx.clearRect(0,0,W,H);
    const N = parseInt(document.getElementById('voronoiPoints')?.value || 30);
    const pts = Array.from({length:N}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*360, g: Math.random()*360
    }));

    const img = ctx.createImageData(W, H);
    for(let py=0;py<H;py++) {
      for(let px=0;px<W;px++) {
        let minD=Infinity, closest=0;
        pts.forEach((p,i)=>{
          const d=(px-p.x)**2+(py-p.y)**2;
          if(d<minD){minD=d;closest=i;}
        });
        const p=pts[closest];
        const t=Math.sqrt(minD)/Math.sqrt(W*W+H*H);
        const idx=(py*W+px)*4;
        // Color based on point hue and distance
        const h=p.r;
        const [r,g,b]=hslToRgb(h/360, 0.7, 0.2+t*0.5);
        img.data[idx]=r; img.data[idx+1]=g; img.data[idx+2]=b; img.data[idx+3]=255;
      }
    }
    ctx.putImageData(img,0,0);

    // Draw points and borders
    pts.forEach(p=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fill();
    });

    // Animate — slowly move points
    let tick=0;
    const vels=pts.map(()=>({vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5}));
    function animate() {
      tick++;
      if(tick%2===0) {
        pts.forEach((p,i)=>{
          p.x+=vels[i].vx; p.y+=vels[i].vy;
          if(p.x<0||p.x>W) vels[i].vx*=-1;
          if(p.y<0||p.y>H) vels[i].vy*=-1;
        });
        const img=ctx.createImageData(W,H);
        for(let py=0;py<H;py++) {
          for(let px=0;px<W;px++) {
            let minD=Infinity,closest=0;
            pts.forEach((p,i)=>{const d=(px-p.x)**2+(py-p.y)**2;if(d<minD){minD=d;closest=i;}});
            const p=pts[closest],t=Math.sqrt(minD)/Math.sqrt(W*W+H*H);
            const idx=(py*W+px)*4;
            const [r,g,b]=hslToRgb(p.r/360,0.7,0.2+t*0.5);
            img.data[idx]=r;img.data[idx+1]=g;img.data[idx+2]=b;img.data[idx+3]=255;
          }
        }
        ctx.putImageData(img,0,0);
        pts.forEach(p=>{
          ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);
          ctx.fillStyle='rgba(255,255,255,0.8)';ctx.fill();
        });
      }
      animFrame=requestAnimationFrame(animate);
    }
    animate();
  }

  // ── CELLULAR AUTOMATA (Rule 110) ──────────
  function drawCellular() {
    if(animFrame) cancelAnimationFrame(animFrame);
    ctx.clearRect(0,0,W,H);
    const rule=parseInt(document.getElementById('caRule')?.value||110);
    const cellW=4, cols=Math.floor(W/cellW), rows=Math.floor(H/cellW);
    let cells=new Array(cols).fill(0);
    cells[Math.floor(cols/2)]=1;

    function applyRule(l,c,r) {
      const idx=(l<<2)|(c<<1)|r;
      return (rule>>idx)&1;
    }

    ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--bg')||'#040408';
    ctx.fillRect(0,0,W,H);

    let row=0;
    function step() {
      if(row>=rows) { row=0; cells.fill(0); cells[Math.floor(cols/2)]=1; ctx.clearRect(0,0,W,H); }
      cells.forEach((c,i)=>{
        if(c) {
          const t=row/rows;
          ctx.fillStyle=`hsl(${180+t*120},100%,${50+t*20}%)`;
          ctx.fillRect(i*cellW,row*cellW,cellW-0.5,cellW-0.5);
        }
      });
      const next=cells.map((_,i)=>{
        const l=cells[(i-1+cols)%cols], r=cells[(i+1)%cols];
        return applyRule(l,cells[i],r);
      });
      cells=next; row++;
      animFrame=requestAnimationFrame(step);
    }
    step();
  }

  // ── IFS FRACTAL (Barnsley Fern) ───────────
  function drawIFS() {
    if(animFrame) cancelAnimationFrame(animFrame);
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#040408'; ctx.fillRect(0,0,W,H);

    const ferns = {
      barnsley: [
        {a:0,   b:0,   c:0,    d:0.16, e:0,    f:0,    p:0.01},
        {a:0.85,b:0.04,c:-0.04,d:0.85, e:0,    f:1.6,  p:0.85},
        {a:0.2, b:-0.26,c:0.23,d:0.22, e:0,    f:1.6,  p:0.07},
        {a:-0.15,b:0.28,c:0.26,d:0.24, e:0,    f:0.44, p:0.07},
      ],
      tree: [
        {a:0,b:0,c:0,d:0.5,e:0,f:0,p:0.05},
        {a:0.42,b:-0.42,c:0.42,d:0.42,e:0,f:0.2,p:0.4},
        {a:0.42,b:0.42,c:-0.42,d:0.42,e:0,f:0.2,p:0.4},
        {a:0.1,b:0,c:0,d:0.1,e:0,f:0.2,p:0.15},
      ],
    };

    const ifsType = document.getElementById('ifsType')?.value || 'barnsley';
    const transforms = ferns[ifsType] || ferns.barnsley;
    const totalP = transforms.reduce((s,t)=>s+t.p,0);

    let x=0,y=0,count=0;
    const maxPoints=100000;
    const batchSize=2000;

    const imgData=ctx.createImageData(W,H);

    function batch() {
      for(let i=0;i<batchSize&&count<maxPoints;i++,count++) {
        const r=Math.random()*totalP;
        let cum=0, T=transforms[0];
        for(const t of transforms) { cum+=t.p; if(r<cum){T=t;break;} }
        const nx=T.a*x+T.b*y+T.e;
        const ny=T.c*x+T.d*y+T.f;
        x=nx; y=ny;
        const px=Math.floor(W/2+x*(W/12));
        const py=Math.floor(H-y*(H/12)-H*0.05);
        if(px>=0&&px<W&&py>=0&&py<H) {
          const idx=(py*W+px)*4;
          const t=count/maxPoints;
          imgData.data[idx]=Math.min(255,imgData.data[idx]+30);
          imgData.data[idx+1]=Math.min(255,100+t*155);
          imgData.data[idx+2]=Math.min(255,imgData.data[idx+2]+5);
          imgData.data[idx+3]=255;
        }
      }
      ctx.putImageData(imgData,0,0);
      if(count<maxPoints) animFrame=requestAnimationFrame(batch);
    }
    batch();
  }

  // ── CHAOS GAME (Sierpinski) ───────────────
  function drawChaos() {
    if(animFrame) cancelAnimationFrame(animFrame);
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#040408'; ctx.fillRect(0,0,W,H);

    const sides=parseInt(document.getElementById('chaosSides')?.value||3);
    const vertices=[];
    for(let i=0;i<sides;i++) {
      const a=(i/sides)*Math.PI*2 - Math.PI/2;
      vertices.push({
        x:W/2+Math.min(W,H)*0.45*Math.cos(a),
        y:H/2+Math.min(W,H)*0.45*Math.sin(a)
      });
    }

    let px=W/2, py=H/2, count=0;
    const maxPts=80000, batch=3000;
    const img=ctx.createImageData(W,H);

    function step() {
      for(let i=0;i<batch&&count<maxPts;i++,count++) {
        const v=vertices[Math.floor(Math.random()*sides)];
        const ratio=0.5;
        px=px+(v.x-px)*ratio;
        py=py+(v.y-py)*ratio;
        const ix=Math.floor(px), iy=Math.floor(py);
        if(ix>=0&&ix<W&&iy>=0&&iy<H) {
          const idx=(iy*W+ix)*4;
          const t=count/maxPts;
          const hue=(360*t+180)%360;
          const [r,g,b]=hslToRgb(hue/360,1,0.5+t*0.3);
          img.data[idx]=Math.min(255,img.data[idx]+r*0.3+50);
          img.data[idx+1]=Math.min(255,img.data[idx+1]+g*0.3);
          img.data[idx+2]=Math.min(255,img.data[idx+2]+b*0.3+30);
          img.data[idx+3]=255;
        }
      }
      ctx.putImageData(img,0,0);
      if(count<maxPts) animFrame=requestAnimationFrame(step);
    }
    step();
  }

  function hslToRgb(h,s,l) {
    let r,g,b;
    if(s===0){r=g=b=l;}
    else {
      const hue2rgb=(p,q,t)=>{
        if(t<0)t+=1;if(t>1)t-=1;
        if(t<1/6)return p+(q-p)*6*t;
        if(t<1/2)return q;
        if(t<2/3)return p+(q-p)*(2/3-t)*6;
        return p;
      };
      const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
      r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);
    }
    return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
  }

  // ── Control panels ────────────────────────
  const controlPanels = {
    voronoi: `
      <div class="ctrl-group">
        <label>Points <span id="voronoiPointsVal">30</span></label>
        <input type="range" id="voronoiPoints" min="5" max="80" value="30" />
      </div>`,
    cellular: `
      <div class="ctrl-group">
        <label>Rule Number <span id="caRuleVal">110</span></label>
        <input type="range" id="caRule" min="0" max="255" value="110" />
      </div>`,
    ifs: `
      <div class="ctrl-group">
        <label>Fractal Type</label>
        <select id="ifsType">
          <option value="barnsley">Barnsley Fern</option>
          <option value="tree">Fractal Tree</option>
        </select>
      </div>`,
    chaos: `
      <div class="ctrl-group">
        <label>Polygon Sides <span id="chaosSidesVal">3</span></label>
        <input type="range" id="chaosSides" min="3" max="8" value="3" />
      </div>`,
  };

  const drawFns = { voronoi:drawVoronoi, cellular:drawCellular, ifs:drawIFS, chaos:drawChaos };

  function switchGallery(name) {
    if(animFrame) { cancelAnimationFrame(animFrame); animFrame=null; }
    currentGallery=name;
    document.getElementById('galleryCtrls').innerHTML=controlPanels[name]||'';

    // Wire up controls
    const rng=document.querySelector('#galleryCtrls input[type=range]');
    if(rng) {
      const valEl=document.querySelector(`#galleryCtrls span`);
      rng.addEventListener('input',e=>{
        if(valEl) valEl.textContent=e.target.value;
      });
    }
    const sel=document.querySelector('#galleryCtrls select');
    if(sel) sel.addEventListener('change',()=>drawFns[name]());

    drawFns[name]();
  }

  document.querySelectorAll('.gtab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gtab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      switchGallery(btn.dataset.gallery);
    });
  });

  document.getElementById('regenerate').addEventListener('click', () => {
    drawFns[currentGallery]();
  });

  // Init on scroll
  const obs = new IntersectionObserver(entries => {
    if(entries[0].isIntersecting) { switchGallery('voronoi'); obs.disconnect(); }
  }, { threshold: 0.2 });
  obs.observe(document.getElementById('gallery'));
})();

/* ═══════════════════════════════════════════
   playground.js — Function Laboratory
   ═══════════════════════════════════════════ */

(function() {
  const canvas = document.getElementById('playCanvas');
  canvas.width = 700; canvas.height = 500;
  const ctx = canvas.getContext('2d');
  let W = canvas.width, H = canvas.height;
  let a=1, b=0, c=0.1, mode='cartesian';
  let t=0, playing=true, animFrame=null;

  function drawGrid() {
    const cx=W/2, cy=H/2, scale=50;
    ctx.clearRect(0,0,W,H);

    // Grid
    ctx.strokeStyle='rgba(0,200,255,0.05)'; ctx.lineWidth=0.5;
    for(let x=cx%scale;x<W;x+=scale) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
    for(let y=cy%scale;y<H;y+=scale) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }

    // Axes
    ctx.strokeStyle='rgba(0,200,255,0.25)'; ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(W,cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,H);ctx.stroke();

    // Tick labels
    ctx.font="10px 'JetBrains Mono'"; ctx.fillStyle='rgba(136,146,176,0.5)';
    for(let i=-6;i<=6;i++) {
      if(i===0) continue;
      ctx.fillText(i, cx+i*scale-4, cy+12);
      ctx.fillText(i, cx+3, cy-i*scale+3);
    }
  }

  function drawCartesian() {
    drawGrid();
    const cx=W/2, cy=H/2, scale=50;
    ctx.beginPath();
    let started=false;
    for(let px=0;px<W;px++) {
      const x=(px-cx)/scale;
      const y=Math.sin(a*x+b)*Math.exp(-c*Math.abs(x));
      const py=cy-y*scale*2;
      if(!isFinite(py)||Math.abs(py)>H*2){started=false;continue;}
      started ? ctx.lineTo(px,py) : (ctx.moveTo(px,py),started=true);
    }
    const grad=ctx.createLinearGradient(0,0,W,0);
    grad.addColorStop(0,'rgba(0,200,255,0.9)');
    grad.addColorStop(0.5,'rgba(191,90,242,0.9)');
    grad.addColorStop(1,'rgba(255,215,0,0.9)');
    ctx.strokeStyle=grad; ctx.lineWidth=2.5; ctx.stroke();

    // Animate point
    const px_anim=cx+t*scale;
    if(px_anim<W) {
      const x_anim=t;
      const y_anim=Math.sin(a*x_anim+b)*Math.exp(-c*Math.abs(x_anim));
      const py_anim=cy-y_anim*scale*2;
      ctx.beginPath(); ctx.arc(px_anim,py_anim,5,0,Math.PI*2);
      ctx.fillStyle='#fff'; ctx.fill();
    }
  }

  function drawPolar() {
    drawGrid();
    const cx=W/2, cy=H/2, scale=50;
    ctx.beginPath();
    for(let i=0;i<=1000;i++) {
      const theta=(i/1000)*Math.PI*2*8;
      const r=Math.abs(Math.sin(a*theta+b))*Math.exp(-c*theta*0.1)*3;
      const x=cx+r*scale*Math.cos(theta);
      const y=cy-r*scale*Math.sin(theta);
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,200);
    grad.addColorStop(0,'rgba(255,215,0,0.9)');
    grad.addColorStop(1,'rgba(0,200,255,0.9)');
    ctx.strokeStyle=grad; ctx.lineWidth=1.5; ctx.stroke();
  }

  function drawParametric() {
    drawGrid();
    const cx=W/2, cy=H/2, scale=60;
    ctx.beginPath();
    for(let i=0;i<=2000;i++) {
      const theta=(i/2000)*Math.PI*2;
      const x=cx+scale*Math.cos(a*theta+b)*Math.exp(-c*i/500);
      const y=cy-scale*Math.sin(Math.round(a*3)*theta)*Math.exp(-c*i/500);
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    const grad=ctx.createLinearGradient(cx-scale,cy,cx+scale,cy);
    grad.addColorStop(0,'rgba(0,255,157,0.9)');
    grad.addColorStop(1,'rgba(191,90,242,0.9)');
    ctx.strokeStyle=grad; ctx.lineWidth=1.5; ctx.stroke();
  }

  function drawPhase() {
    ctx.fillStyle='rgba(4,4,8,0.06)'; ctx.fillRect(0,0,W,H);
    const cx=W/2, cy=H/2, scale=50;
    for(let bx=-6;bx<=6;bx+=0.5) {
      for(let by=-4;by<=4;by+=0.5) {
        const x=bx, y=by;
        const dx=y, dy=-a*Math.sin(x)-c*y;
        const len=Math.sqrt(dx*dx+dy*dy)+0.001;
        const nx=dx/len*0.3, ny=dy/len*0.3;
        const px=cx+bx*scale, py=cy-by*scale;
        const hue=Math.atan2(dy,dx)/Math.PI*180;
        ctx.beginPath();
        ctx.moveTo(px,py); ctx.lineTo(px+nx*scale,py-ny*scale);
        ctx.strokeStyle=`hsla(${hue+180},80%,60%,0.5)`;
        ctx.lineWidth=1; ctx.stroke();
      }
    }
  }

  const drawFns = { cartesian:drawCartesian, polar:drawPolar, parametric:drawParametric, phase:drawPhase };

  function loop() {
    if(playing) t+=0.03;
    drawFns[mode]();
    if(playing || mode==='phase') animFrame=requestAnimationFrame(loop);
  }

  // Sliders
  document.getElementById('pgA').addEventListener('input', e=>{
    a=parseFloat(e.target.value); document.getElementById('pgAVal').textContent=a.toFixed(1);
  });
  document.getElementById('pgB').addEventListener('input', e=>{
    b=parseFloat(e.target.value); document.getElementById('pgBVal').textContent=b.toFixed(1);
  });
  document.getElementById('pgC').addEventListener('input', e=>{
    c=parseFloat(e.target.value); document.getElementById('pgCVal').textContent=c.toFixed(2);
  });
  document.getElementById('pgMode').addEventListener('change', e=>{
    mode=e.target.value; t=0;
    if(animFrame) cancelAnimationFrame(animFrame);
    loop();
  });
  document.getElementById('pgAnimate').addEventListener('click', e=>{
    playing=!playing;
    e.target.textContent=playing?'⏸ Pause':'▶ Play';
    e.target.classList.toggle('active-btn',playing);
    if(playing&&!animFrame) loop();
  });
  document.getElementById('pgReset').addEventListener('click', ()=>{
    t=0; ctx.clearRect(0,0,W,H); if(!playing) drawFns[mode]();
  });

  const obs=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting){loop();obs.disconnect();}
  },{threshold:0.2});
  obs.observe(document.getElementById('playground'));
})();
