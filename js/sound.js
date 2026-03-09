/* ═══════════════════════════════════════════
   sound.js — Mathematics → Sound Synthesis
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('soundCanvas');
  if(!canvas) return;
  canvas.width=600; canvas.height=300;
  const ctx=canvas.getContext('2d');
  const fftCanvas=document.getElementById('fftCanvas');
  const fftCtx=fftCanvas?.getContext('2d');

  let audioCtx=null, source=null, analyser=null;
  let vol=0.3, dur=2, playing=false, animFrame;

  function getAudioCtx(){
    if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    return audioCtx;
  }

  function evalWave(expr, t){
    try{
      const fn=new Function('t','Math','PI','return '+expr.replace(/PI/g,'Math.PI'));
      return fn(t,Math,Math.PI)||0;
    }catch{return 0;}
  }

  function generateBuffer(expr, duration, sampleRate=44100){
    const ac=getAudioCtx();
    const frames=Math.floor(sampleRate*duration);
    const buf=ac.createBuffer(1,frames,sampleRate);
    const data=buf.getChannelData(0);
    let maxVal=0;
    for(let i=0;i<frames;i++){
      const t=i/sampleRate;
      data[i]=evalWave(expr,t);
      maxVal=Math.max(maxVal,Math.abs(data[i]));
    }
    if(maxVal>0) for(let i=0;i<frames;i++) data[i]/=maxVal;
    // Fade in/out
    const fade=Math.min(0.01*sampleRate,frames/4);
    for(let i=0;i<fade;i++){data[i]*=i/fade;data[frames-1-i]*=i/fade;}
    return buf;
  }

  function drawWaveform(expr,duration=2){
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#030307';ctx.fillRect(0,0,W,H);

    // Grid
    ctx.strokeStyle='rgba(0,200,255,0.08)';ctx.lineWidth=0.5;
    for(let i=0;i<=8;i++){ctx.beginPath();ctx.moveTo(0,i*H/8);ctx.lineTo(W,i*H/8);ctx.stroke();}
    for(let i=0;i<=16;i++){ctx.beginPath();ctx.moveTo(i*W/16,0);ctx.lineTo(i*W/16,H);ctx.stroke();}

    // Zero line
    ctx.strokeStyle='rgba(0,200,255,0.25)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();

    // Waveform
    const N=W*2;
    ctx.beginPath();
    for(let i=0;i<=N;i++){
      const t=(i/N)*duration;
      const y=evalWave(expr,t);
      const sx=(i/N)*W;
      const sy=H/2-y*H*0.42;
      i===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);
    }
    const grad=ctx.createLinearGradient(0,0,W,0);
    grad.addColorStop(0,'rgba(0,200,255,0.9)');
    grad.addColorStop(0.5,'rgba(191,90,242,0.9)');
    grad.addColorStop(1,'rgba(255,215,0,0.9)');
    ctx.strokeStyle=grad;ctx.lineWidth=2;ctx.stroke();

    ctx.font='11px JetBrains Mono';
    ctx.fillStyle='rgba(0,200,255,0.6)';
    ctx.fillText(`f(t) = ${expr.slice(0,50)}`,10,18);
    ctx.fillStyle='rgba(136,146,176,0.5)';
    ctx.fillText(`t ∈ [0, ${duration}s]  sample rate: 44100 Hz`,10,H-8);
  }

  function drawFFT(){
    if(!analyser||!fftCtx) return;
    const W=fftCanvas.width,H=fftCanvas.height;
    const data=new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    fftCtx.clearRect(0,0,W,H);
    fftCtx.fillStyle='#030307';fftCtx.fillRect(0,0,W,H);
    const binW=W/data.length;
    data.forEach((v,i)=>{
      const bh=v/255*H;
      const hue=200+i/data.length*120;
      fftCtx.fillStyle=`hsl(${hue},100%,${50+v/5}%)`;
      fftCtx.fillRect(i*binW,H-bh,binW-0.5,bh);
    });
    if(playing) requestAnimationFrame(drawFFT);
  }

  function playSound(){
    const expr=document.getElementById('soundExpr').value;
    stopSound();
    try{
      const ac=getAudioCtx();
      if(ac.state==='suspended') ac.resume();
      analyser=ac.createAnalyser();
      analyser.fftSize=512;
      const buf=generateBuffer(expr,dur);
      source=ac.createBufferSource();
      source.buffer=buf;
      const gain=ac.createGain();
      gain.gain.value=vol;
      source.connect(gain);gain.connect(analyser);analyser.connect(ac.destination);
      source.start();
      playing=true;
      source.onended=()=>{playing=false;};
      drawFFT();
    } catch(e){
      console.warn('Audio error:',e);
      alert('Audio error: '+e.message);
    }
  }

  function stopSound(){
    if(source){try{source.stop();}catch(e){}}
    source=null; playing=false;
  }

  document.getElementById('soundPlay')?.addEventListener('click',()=>{
    const expr=document.getElementById('soundExpr').value;
    drawWaveform(expr,dur);
    playSound();
  });
  document.getElementById('soundStop')?.addEventListener('click',stopSound);
  document.getElementById('soundVol')?.addEventListener('input',e=>{
    vol=parseFloat(e.target.value);
    document.getElementById('soundVolVal').textContent=vol.toFixed(2);
  });
  document.getElementById('soundDur')?.addEventListener('input',e=>{
    dur=parseFloat(e.target.value);
    document.getElementById('soundDurVal').textContent=dur;
  });
  document.getElementById('soundExpr')?.addEventListener('input',e=>{
    drawWaveform(e.target.value,dur);
  });
  document.querySelectorAll('.spreset').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const fn=btn.dataset.fn;
      document.getElementById('soundExpr').value=fn;
      drawWaveform(fn,dur);
    });
  });

  const obs=new IntersectionObserver(e=>{
    if(e[0].isIntersecting){
      drawWaveform(document.getElementById('soundExpr')?.value||'Math.sin(2*Math.PI*440*t)',dur);
      obs.disconnect();
    }
  },{threshold:0.2});
  obs.observe(document.getElementById('sound'));
})();
