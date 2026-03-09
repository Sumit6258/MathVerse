/* ═══════════════════════════════════════════
   global.js — Keyboard shortcuts, background
   shader, fullscreen, Random Wonder, GSAP
   ═══════════════════════════════════════════ */

// ── Background WebGL shader ────────────────────────────
(function() {
  const canvas = document.getElementById('bgShader');
  if(!canvas) return;
  const gl = canvas.getContext('webgl');
  if(!gl) return;

  function resize(){
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  window.addEventListener('resize',resize); resize();

  const VS=`attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
  const FS=`
    precision mediump float;
    uniform vec2 u_res, u_mouse;
    uniform float u_time;
    void main(){
      vec2 uv=gl_FragCoord.xy/u_res;
      vec2 m=u_mouse/u_res;
      // Grid with mouse warp
      vec2 grid=uv*40.+vec2(sin(uv.y*8.+u_time*0.3)*0.3,cos(uv.x*6.+u_time*0.2)*0.3);
      float distM=length(uv-m);
      grid+=normalize(uv-m)*0.4*exp(-distM*8.)*sin(u_time*2.-distM*20.);
      float lx=abs(sin(grid.x*3.14159));
      float ly=abs(sin(grid.y*3.14159));
      float grid_v=pow(1.-min(lx,ly),12.);
      // Subtle aurora
      float aurora=sin(uv.x*3.+u_time*0.15)*0.5+0.5;
      aurora*=smoothstep(0.3,0.7,uv.y);
      vec3 col=vec3(0.0,grid_v*0.025,grid_v*0.05);
      col+=vec3(0.,0.,aurora*0.012);
      gl_FragColor=vec4(col,1);
    }
  `;

  function sh(t,s){const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;}
  const p=gl.createProgram();
  gl.attachShader(p,sh(gl.VERTEX_SHADER,VS));
  gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FS));
  gl.linkProgram(p); gl.useProgram(p);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const u={res:gl.getUniformLocation(p,'u_res'),mouse:gl.getUniformLocation(p,'u_mouse'),
    time:gl.getUniformLocation(p,'u_time')};

  let mx=0,my=0;
  window.addEventListener('mousemove',e=>{mx=e.clientX;my=window.innerHeight-e.clientY;});

  const start=Date.now();
  function frame(){
    requestAnimationFrame(frame);
    const t=(Date.now()-start)/1000;
    gl.uniform2f(u.res,canvas.width,canvas.height);
    gl.uniform2f(u.mouse,mx,my);
    gl.uniform1f(u.time,t);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  frame();
})();

// ── GSAP Scroll Animations ────────────────────────────
(function() {
  if(!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.section').forEach(s=>{
    gsap.fromTo(s,{opacity:0,y:50},{
      opacity:1,y:0,duration:0.9,ease:'power3.out',
      scrollTrigger:{trigger:s,start:'top 85%',toggleActions:'play none none none'}
    });
  });

  // Section numbers counter animation
  gsap.utils.toArray('.section-num').forEach(el=>{
    gsap.from(el,{opacity:0,x:-20,duration:0.5,
      scrollTrigger:{trigger:el,start:'top 80%'}});
  });
})();

// ── Section reveal fallback ────────────────────────────
(function() {
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});
  },{threshold:0.07});
  document.querySelectorAll('.section').forEach(s=>io.observe(s));
})();

// ── Navbar ────────────────────────────────────────────
(function() {
  const nb=document.getElementById('navbar');
  window.addEventListener('scroll',()=>{
    nb.style.background=window.scrollY>50?'rgba(3,3,7,0.98)':'rgba(3,3,7,0.88)';
  });
  document.getElementById('navToggle')?.addEventListener('click',()=>{
    const nl=document.querySelector('.nav-links');
    const open=nl.style.display==='flex';
    if(open){nl.style.display='';}
    else{
      nl.style.cssText='display:flex;flex-direction:column;position:absolute;top:52px;left:0;right:0;background:rgba(3,3,7,0.98);padding:1rem 1.5rem;border-bottom:1px solid rgba(0,200,255,0.1);z-index:999';
    }
  });
})();

// ── Fullscreen ────────────────────────────────────────
(function() {
  document.getElementById('fullscreenBtn')?.addEventListener('click',()=>{
    if(!document.fullscreenElement){document.documentElement.requestFullscreen?.();}
    else{document.exitFullscreen?.();}
  });
  document.querySelectorAll('.fullscreen-icon').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const c=document.getElementById(btn.dataset.target);
      if(c) c.requestFullscreen?.().catch(()=>{});
    });
  });
})();

// ── Keyboard shortcuts ────────────────────────────────
(function() {
  const sectionMap={
    'KeyF':'fractals','KeyR':'riemann','KeyC':'complex','KeyD':'reaction',
    'KeyL':'fluid','KeyH':'hyperbolic','Digit4':'fourd','KeyN':'numtheory',
    'KeyS':'sound','Digit3':'surfaces','KeyG':'gallery',
    'KeyU':null, // Universe (special)
  };

  const hud=document.getElementById('shortcutHud');
  const overlay=document.getElementById('shortcutOverlay');
  hud?.addEventListener('click',()=>overlay?.classList.remove('hidden'));
  document.getElementById('closeShortcuts')?.addEventListener('click',()=>overlay?.classList.add('hidden'));

  document.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    if(e.key==='?'||e.key=='/'){overlay?.classList.toggle('hidden');return;}
    if(e.code==='Escape'){overlay?.classList.add('hidden');return;}
    if(e.code==='KeyU'){
      document.getElementById('universeBtn')?.click();return;
    }
    if(e.code==='F11'){e.preventDefault();
      if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();return;
    }
    const sectionId=sectionMap[e.code];
    if(sectionId){
      e.preventDefault();
      document.getElementById(sectionId)?.scrollIntoView({behavior:'smooth'});
    }
  });
})();

// ── Random Mathematical Wonder ────────────────────────
(function() {
  const wonders=[
    {name:'Burning Ship Fractal',action:()=>{
      document.getElementById('fractals')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{
        document.querySelector('[data-fractal="burning"]')?.click();
      },500);
    }},
    {name:'Julia Set: c = −0.4 + 0.6i',action:()=>{
      document.getElementById('fractals')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{
        document.querySelector('[data-fractal="julia"]')?.click();
        const jr=document.getElementById('juliaReal'),ji=document.getElementById('juliaImag');
        if(jr){jr.value=-0.4;jr.dispatchEvent(new Event('input'));}
        if(ji){ji.value=0.6;ji.dispatchEvent(new Event('input'));}
      },500);
    }},
    {name:'Complex sin(z) Domain Coloring',action:()=>{
      document.getElementById('complex')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{
        document.getElementById('complexInput').value='csin(z)';
        document.getElementById('complexRender')?.click();
      },500);
    }},
    {name:'Reaction-Diffusion: Spots',action:()=>{
      document.getElementById('reaction')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{
        document.getElementById('reactionPreset').value='spots';
        document.getElementById('reactionPreset').dispatchEvent(new Event('change'));
      },500);
    }},
    {name:'Double Pendulum Chaos',action:()=>{
      document.getElementById('animations')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{document.querySelector('[data-anim="pendulum"]')?.click();},500);
    }},
    {name:'Lorenz Attractor',action:()=>{
      document.getElementById('animations')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{document.querySelector('[data-anim="lorenz"]')?.click();},500);
    }},
    {name:'Modular Multiplication k=2',action:()=>{
      document.getElementById('numtheory')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{
        document.querySelector('[data-nt="modular"]')?.click();
      },500);
    }},
    {name:'Hyperbolic Tessellation {7,3}',action:()=>{
      document.getElementById('hyperbolic')?.scrollIntoView({behavior:'smooth'});
    }},
    {name:'4D Tesseract Rotation',action:()=>{
      document.getElementById('fourd')?.scrollIntoView({behavior:'smooth'});
    }},
    {name:'Riemann Zeta Zeros',action:()=>{
      document.getElementById('riemann')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{
        document.getElementById('riemannMode').value='zeros';
        document.getElementById('riemannMode').dispatchEvent(new Event('change'));
      },500);
    }},
    {name:'FM Sound Synthesis',action:()=>{
      document.getElementById('sound')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{
        document.getElementById('soundExpr').value='Math.sin(2*Math.PI*(440+200*Math.sin(2*Math.PI*3*t))*t)';
        document.getElementById('soundExpr').dispatchEvent(new Event('input'));
        document.getElementById('soundPlay')?.click();
      },600);
    }},
    {name:'Clifford Torus (4D)',action:()=>{
      document.getElementById('fourd')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{
        document.getElementById('fourdObject').value='torus';
        document.getElementById('fourdObject').dispatchEvent(new Event('change'));
      },500);
    }},
    {name:'Hénon Map Attractor',action:()=>{
      document.getElementById('animations')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{document.querySelector('[data-anim="henon"]')?.click();},500);
    }},
  ];

  const notif=document.getElementById('wonderNotif');
  let notifTimer;

  document.getElementById('wonderBtn')?.addEventListener('click',()=>{
    const w=wonders[Math.floor(Math.random()*wonders.length)];
    w.action();
    if(notif){
      notif.textContent=`✨ ${w.name}`;
      notif.classList.remove('hidden');
      clearTimeout(notifTimer);
      notifTimer=setTimeout(()=>notif.classList.add('hidden'),3000);
    }
  });
})();

// ── Gallery: L-Systems & Art Generator ──────────────
(function() {
  // These are added to the gallery tabs
  const galleryCanvas=document.getElementById('galleryCanvas');
  if(!galleryCanvas) return;

  // Override or extend gallery for new types
  const origGtabs=document.querySelectorAll('.gtab');

  function drawLSystem(){
    const W=galleryCanvas.width,H=galleryCanvas.height;
    const ctx=galleryCanvas.getContext('2d');
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);

    const systems={
      plant:{axiom:'F',rules:{F:'FF+[+F-F-F]-[-F+F+F]'},angle:22.5,iter:5},
      dragon:{axiom:'FX',rules:{X:'X+YF+',Y:'-FX-Y'},angle:90,iter:14},
      sierpinski:{axiom:'A',rules:{A:'B-A-B',B:'A+B+A'},angle:60,iter:8},
      tree:{axiom:'F',rules:{F:'F[+F]F[-F][F]'},angle:25.7,iter:5},
    };

    const names=Object.keys(systems);
    const sys=systems[names[Math.floor(Math.random()*names.length)]];
    let s=sys.axiom;
    for(let i=0;i<sys.iter;i++){
      s=s.split('').map(c=>sys.rules[c]||c).join('');
      if(s.length>50000){break;}
    }

    ctx.strokeStyle='rgba(0,255,100,0.8)';ctx.lineWidth=0.8;
    let x=W/2,y=H*0.95,a=-Math.PI/2,len=4;
    const stack=[];

    // Estimate length to scale
    let steps=0;
    for(const c of s) if(c==='F')steps++;
    len=Math.min(10,H*0.7/Math.max(1,steps*0.1));

    ctx.beginPath();
    for(const c of s){
      switch(c){
        case 'F':case 'A':case 'B':{
          const nx=x+len*Math.cos(a), ny=y+len*Math.sin(a);
          ctx.moveTo(x,y);ctx.lineTo(nx,ny);x=nx;y=ny;break;}
        case '+':a+=sys.angle*Math.PI/180;break;
        case '-':a-=sys.angle*Math.PI/180;break;
        case '[':stack.push({x,y,a});break;
        case ']':if(stack.length){const p=stack.pop();x=p.x;y=p.y;a=p.a;}break;
      }
    }
    ctx.stroke();
    ctx.font='13px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.7)';
    ctx.fillText(`L-System: ${names.find(n=>systems[n]===sys)}  iter=${sys.iter}`,10,25);
  }

  function drawArtGen(){
    const W=galleryCanvas.width,H=galleryCanvas.height;
    const ctx=galleryCanvas.getContext('2d');
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);

    const style=Math.floor(Math.random()*4);
    if(style===0){
      // Rose curves
      const n=Math.floor(Math.random()*7)+2, d=Math.floor(Math.random()*5)+1;
      ctx.beginPath();
      for(let t=0;t<Math.PI*d*2;t+=0.01){
        const r=(W*0.42)*Math.cos(n/d*t);
        const x=W/2+r*Math.cos(t), y=H/2+r*Math.sin(t);
        t===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      const grad=ctx.createLinearGradient(0,0,W,H);
      grad.addColorStop(0,`hsl(${Math.random()*360},100%,60%)`);
      grad.addColorStop(1,`hsl(${Math.random()*360},100%,60%)`);
      ctx.strokeStyle=grad;ctx.lineWidth=1.5;ctx.stroke();
    } else if(style===1){
      // Spiral of spirals
      const arms=Math.floor(Math.random()*6)+3;
      for(let arm=0;arm<arms;arm++){
        ctx.beginPath();
        for(let t=0;t<Math.PI*12;t+=0.05){
          const r=t*(W*0.035);
          const angle=t+arm*(Math.PI*2/arms);
          const wave=Math.sin(t*Math.random()*3)*10;
          const x=W/2+(r+wave)*Math.cos(angle), y=H/2+(r+wave)*Math.sin(angle);
          if(r>W*0.45) break;
          t===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.strokeStyle=`hsla(${arm*360/arms+Math.random()*30},100%,65%,0.6)`;
        ctx.lineWidth=0.8;ctx.stroke();
      }
    } else if(style===2){
      // Lemniscate art
      const n=2+Math.floor(Math.random()*4);
      for(let i=0;i<200;i++){
        ctx.beginPath();
        const phase=(i/200)*Math.PI*2;
        for(let t=0;t<Math.PI*2;t+=0.02){
          const r=(W*0.35)*Math.sqrt(Math.abs(Math.cos(n*t)));
          const x=W/2+r*Math.cos(t+phase), y=H/2+r*Math.sin(t+phase);
          t===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.strokeStyle=`hsla(${i*1.8+Math.random()*20},100%,60%,0.04)`;
        ctx.lineWidth=1;ctx.stroke();
      }
    } else {
      // Phyllotaxis / sunflower
      const N=1000, golden=(1+Math.sqrt(5))/2;
      for(let i=0;i<N;i++){
        const t=i*(Math.PI*2/golden/golden);
        const r=Math.sqrt(i/N)*W*0.44;
        const x=W/2+r*Math.cos(t), y=H/2+r*Math.sin(t);
        const size=2+r/W*4;
        ctx.beginPath();ctx.arc(x,y,size*0.5,0,Math.PI*2);
        ctx.fillStyle=`hsla(${i*137.5%360},100%,60%,0.7)`;ctx.fill();
      }
    }
    ctx.font='13px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.6)';
    ctx.fillText(['Rose Curve','Spiral Galaxy','Lemniscate','Phyllotaxis'][style],10,25);
  }

  // Patch gallery tabs to handle new types
  const origGtabHandler=()=>{};
  document.querySelectorAll('.gtab').forEach(btn=>{
    if(btn.dataset.gallery==='lsystem'){
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.gtab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('galleryCtrls').innerHTML='<p class="hint-text">Random L-system each time</p>';
        drawLSystem();
      });
    }
    if(btn.dataset.gallery==='artgen'){
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.gtab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('galleryCtrls').innerHTML='<p class="hint-text">Random math art each time</p>';
        drawArtGen();
      });
    }
  });

  // Download gallery canvas
  document.getElementById('downloadGallery')?.addEventListener('click',()=>{
    const link=document.createElement('a');
    link.download='mathverse_art.png';
    link.href=galleryCanvas.toDataURL();
    link.click();
  });

  // Extend regenerate to handle new types
  const origRegen=document.getElementById('regenerate');
  origRegen?.addEventListener('click',()=>{
    const active=document.querySelector('.gtab.active');
    if(active?.dataset.gallery==='lsystem') drawLSystem();
    if(active?.dataset.gallery==='artgen') drawArtGen();
  });
})();

// ── Tooltip system ────────────────────────────────────
(function() {
  const tip=document.getElementById('tooltip');
  document.querySelectorAll('[data-tip]').forEach(el=>{
    el.addEventListener('mouseenter',e=>{
      tip.textContent=el.dataset.tip;
      tip.style.opacity='1';
    });
    el.addEventListener('mousemove',e=>{
      tip.style.left=(e.clientX+12)+'px';
      tip.style.top=(e.clientY-5)+'px';
    });
    el.addEventListener('mouseleave',()=>tip.style.opacity='0');
  });
})();
