/* ═══════════════════════════════════════════
   numtheory.js — Number Theory Visual Art
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('numtheoryCanvas');
  if(!canvas) return;
  canvas.width=600; canvas.height=600;
  const ctx=canvas.getContext('2d');
  let current='modular', animFrame;

  const controlDefs={
    modular:`
      <div class="ctrl-group"><label>Multiplier k = <span id="ntKVal">2</span></label>
        <input type="range" id="ntK" min="2" max="200" value="2" /></div>
      <div class="ctrl-group"><label>Points N = <span id="ntNVal">200</span></label>
        <input type="range" id="ntN" min="10" max="500" value="200" /></div>
      <div class="ctrl-group"><label>Color Mode</label>
        <select id="ntColor"><option value="hsl">HSL</option><option value="gold">Gold</option>
        <option value="neon">Neon</option></select></div>
      <button id="ntAnimate" class="ctrl-btn active-btn">▶ Animate k</button>`,
    collatz:`
      <div class="ctrl-group"><label>Start n = <span id="ntStartVal">27</span></label>
        <input type="range" id="ntStart" min="1" max="1000" value="27" /></div>
      <div class="ctrl-group"><label>Show n trajectories = <span id="ntCountVal">1</span></label>
        <input type="range" id="ntCount" min="1" max="30" value="1" /></div>`,
    prime_gap:`
      <div class="ctrl-group"><label>Up to N = <span id="ntPNVal">1000</span></label>
        <input type="range" id="ntPN" min="100" max="5000" value="1000" /></div>`,
    totient:`
      <div class="ctrl-group"><label>Up to N = <span id="ntTNVal">500</span></label>
        <input type="range" id="ntTN" min="100" max="2000" value="500" /></div>`,
  };

  let ntK=2, ntN=200, ntColor='hsl', ntStart=27, ntCount=1, ntPN=1000, ntTN=500;
  let animating=false, animK=2;

  function drawModular(){
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);
    const cx=W/2,cy=H/2,r=W*0.43;
    // Circle of N points
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(0,200,255,0.15)';ctx.lineWidth=0.5;ctx.stroke();

    for(let i=0;i<ntN;i++){
      const j=(i*ntK)%ntN;
      const a1=(i/ntN)*Math.PI*2-Math.PI/2;
      const a2=(j/ntN)*Math.PI*2-Math.PI/2;
      const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
      const x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
      let color;
      if(ntColor==='hsl') color=`hsla(${(i/ntN)*360},100%,60%,0.4)`;
      else if(ntColor==='gold') color=`rgba(255,215,0,${0.2+0.3*(i/ntN)})`;
      else color=`hsla(${180+(i/ntN)*180},100%,70%,0.35)`;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
      ctx.strokeStyle=color;ctx.lineWidth=0.5;ctx.stroke();
    }
    // Dot ring
    for(let i=0;i<ntN;i++){
      const a=(i/ntN)*Math.PI*2-Math.PI/2;
      ctx.beginPath();ctx.arc(cx+r*Math.cos(a),cy+r*Math.sin(a),1.5,0,Math.PI*2);
      ctx.fillStyle='rgba(0,200,255,0.5)';ctx.fill();
    }
    ctx.font='13px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.7)';
    ctx.fillText(`k = ${Math.round(ntK)}, N = ${ntN}`,10,25);
  }

  function collatzSeq(n){
    const seq=[n];
    while(n!==1){n=n%2===0?n/2:3*n+1;seq.push(n);}
    return seq;
  }

  function drawCollatz(){
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);

    for(let c=0;c<ntCount;c++){
      const n=ntStart+c*7;
      const seq=collatzSeq(n);
      const maxVal=Math.max(...seq);
      ctx.beginPath();
      seq.forEach((v,i)=>{
        const x=(i/seq.length)*W;
        const y=H-20-(v/maxVal)*(H-40);
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      });
      const hue=(c*37)%360;
      ctx.strokeStyle=`hsla(${hue},100%,65%,0.8)`;
      ctx.lineWidth=1.5; ctx.stroke();
      // Start point
      ctx.beginPath();ctx.arc(0,H-20-(ntStart+c*7)/maxVal*(H-40),4,0,Math.PI*2);
      ctx.fillStyle=`hsla(${hue},100%,70%,1)`;ctx.fill();
    }
    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(255,215,0,0.8)';
    ctx.fillText(`Collatz trajectory: n = ${ntStart} (${collatzSeq(ntStart).length} steps)`,10,20);
  }

  function sieve(n){
    const primes=[];
    const composites=new Uint8Array(n+1);
    for(let i=2;i<=n;i++){
      if(!composites[i]){
        primes.push(i);
        for(let j=i*i;j<=n;j+=i) composites[j]=1;
      }
    }
    return primes;
  }

  function drawPrimeGaps(){
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);

    const primes=sieve(ntPN);
    const gaps=primes.slice(1).map((p,i)=>p-primes[i]);
    const maxGap=Math.max(...gaps);

    // Background grid
    ctx.strokeStyle='rgba(0,200,255,0.05)';ctx.lineWidth=0.5;
    for(let g=0;g<=maxGap;g+=2){
      const y=H-10-(g/maxGap)*(H-30);
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    }

    // Plot gaps
    gaps.forEach((g,i)=>{
      const x=(i/gaps.length)*W;
      const y=H-10-(g/maxGap)*(H-30);
      const hue=200+g*15;
      ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);
      ctx.fillStyle=`hsla(${hue},100%,65%,0.7)`;ctx.fill();
    });

    // Trend line
    ctx.beginPath();
    gaps.forEach((g,i)=>{
      const x=(i/gaps.length)*W;
      const avg=Math.log(primes[i+1]||primes[i]);
      const y=H-10-(avg/maxGap)*(H-30)*2;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.strokeStyle='rgba(255,215,0,0.5)';ctx.lineWidth=1.5;ctx.stroke();

    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.8)';
    ctx.fillText(`Prime gaps up to ${ntPN} — ${primes.length} primes`,10,20);
    ctx.fillStyle='rgba(255,215,0,0.6)';
    ctx.fillText('— log(p) trend',10,38);
  }

  function drawTotient(){
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);

    function phi(n){
      let r=n;
      for(let p=2;p*p<=n;p++){if(n%p===0){while(n%p===0)n/=p;r-=r/p;}}
      if(n>1)r-=r/n;
      return Math.floor(r);
    }

    const vals=[];
    for(let n=1;n<=ntTN;n++) vals.push(phi(n));
    const maxV=Math.max(...vals);

    vals.forEach((v,i)=>{
      const n=i+1;
      const x=(n/ntTN)*W;
      const y=H-5-(v/maxV)*(H-20);
      const t=v/n; // φ(n)/n ratio
      ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);
      ctx.fillStyle=`hsla(${t*300+60},90%,65%,0.7)`;ctx.fill();
    });
    // φ(n)/n → 0 curve
    ctx.beginPath();
    for(let n=2;n<=ntTN;n++){
      const x=(n/ntTN)*W;
      // product (1-1/p) over prime factors
      const y=H-5-(n/ntTN)*(H-20)*0.9;
      n===2?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle='rgba(255,100,100,0.3)';ctx.lineWidth=1;ctx.stroke();

    ctx.font='12px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.8)';
    ctx.fillText(`Euler's totient φ(n) for n ≤ ${ntTN}`,10,20);
  }

  const drawFns={modular:drawModular,collatz:drawCollatz,prime_gap:drawPrimeGaps,totient:drawTotient};

  function rebuildControls(name){
    const el=document.getElementById('numtheoryCtrls');
    el.innerHTML=`<button id="ntRegen" class="ctrl-btn active-btn">⟳ Redraw</button>${controlDefs[name]||''}`;
    document.getElementById('ntRegen')?.addEventListener('click',()=>draw());

    // Wire controls
    if(name==='modular'){
      document.getElementById('ntK')?.addEventListener('input',e=>{ntK=parseFloat(e.target.value);document.getElementById('ntKVal').textContent=ntK;if(!animating)draw();});
      document.getElementById('ntN')?.addEventListener('input',e=>{ntN=parseInt(e.target.value);document.getElementById('ntNVal').textContent=ntN;draw();});
      document.getElementById('ntColor')?.addEventListener('change',e=>{ntColor=e.target.value;draw();});
      document.getElementById('ntAnimate')?.addEventListener('click',e=>{
        animating=!animating;e.target.textContent=animating?'⏸ Stop':'▶ Animate k';
        e.target.classList.toggle('active-btn',animating);
        if(animating)animLoop();
        else if(animFrame)cancelAnimationFrame(animFrame);
      });
    }
    if(name==='collatz'){
      document.getElementById('ntStart')?.addEventListener('input',e=>{ntStart=parseInt(e.target.value);document.getElementById('ntStartVal').textContent=ntStart;draw();});
      document.getElementById('ntCount')?.addEventListener('input',e=>{ntCount=parseInt(e.target.value);document.getElementById('ntCountVal').textContent=ntCount;draw();});
    }
    if(name==='prime_gap'){
      document.getElementById('ntPN')?.addEventListener('input',e=>{ntPN=parseInt(e.target.value);document.getElementById('ntPNVal').textContent=ntPN;draw();});
    }
    if(name==='totient'){
      document.getElementById('ntTN')?.addEventListener('input',e=>{ntTN=parseInt(e.target.value);document.getElementById('ntTNVal').textContent=ntTN;draw();});
    }
  }

  function animLoop(){
    ntK+=0.05;if(ntK>ntN)ntK=2;
    document.getElementById('ntK').value=ntK;
    document.getElementById('ntKVal').textContent=Math.round(ntK);
    draw();
    if(animating)animFrame=requestAnimationFrame(animLoop);
  }

  function draw(){drawFns[current]();}

  document.querySelectorAll('.ntab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.ntab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      current=btn.dataset.nt;
      if(animFrame)cancelAnimationFrame(animFrame);
      animating=false;
      rebuildControls(current);
      draw();
    });
  });

  const obs=new IntersectionObserver(e=>{
    if(e[0].isIntersecting){rebuildControls('modular');draw();obs.disconnect();}
  },{threshold:0.2});
  obs.observe(document.getElementById('numtheory'));
})();
