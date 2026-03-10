/* ═══════════════════════════════════════════════
   ART 10 — Mathematical Light Interference
   Real-time wave superposition (WebGL shader)
   Mouse adds wave sources
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('waveInterference'); if(!sec) return;
  const canvas=document.getElementById('waveCanvas'); if(!canvas) return;
  let gl,prog,raf=null,t=0;
  let nWaves=4,freq=3.0,wavelength=80,colorMode='thermal';
  let sources=[]; // [{x,y,phase,amp}]

  const VS=`attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
  const FS=`
precision highp float;
uniform vec2 uRes;
uniform float uTime,uFreq,uWL;
uniform int uN,uColor;
// Up to 12 wave sources
uniform vec2 uSrc[12];
uniform float uPhase[12];

vec3 thermal(float t){return vec3(t*1.5,t*t,.5*t*t*t);}
vec3 ocean(float t){return mix(vec3(0,.05,.15),vec3(.1,.6,.9),t);}
vec3 plasma(float t){return .5+.5*cos(6.28*(t+vec3(.0,.33,.67)));}
vec3 mono(float t){float v=t*.8+.1;return vec3(v);}

void main(){
  vec2 uv=gl_FragCoord.xy;
  float sum=0.;
  float wl=uWL;
  for(int i=0;i<12;i++){
    if(i>=uN)break;
    float r=length(uv-uSrc[i]);
    sum+=sin(6.28*r/wl-uTime*uFreq+uPhase[i]);
  }
  float v=sum/float(uN)*.5+.5;
  float bright=pow(v,1.2);
  vec3 col;
  if(uColor==0) col=thermal(bright);
  else if(uColor==1) col=ocean(bright);
  else if(uColor==2) col=plasma(bright);
  else col=mono(bright);
  // Interference fringe boost
  float fringe=pow(abs(sin(sum*1.5)),3.);
  col+=vec3(.2,.3,.4)*fringe*.4;
  col=pow(clamp(col,0.,1.),vec3(.55));
  gl_FragColor=vec4(col,1);
}`;

  const colorMap={thermal:0,ocean:1,plasma:2,bw:3};

  function defaultSources(){
    sources=[];
    const cx=canvas.width/2,cy=canvas.height/2,r=Math.min(canvas.width,canvas.height)*0.25;
    for(let i=0;i<nWaves;i++){
      const a=i/nWaves*Math.PI*2;
      sources.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a),phase:i/nWaves*Math.PI*2,amp:1});
    }
  }

  function mk(t,s){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh;}

  function init(){
    canvas.width=canvas.offsetWidth||800; canvas.height=canvas.offsetHeight||540;
    gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
    if(!gl)return;
    prog=gl.createProgram();
    gl.attachShader(prog,mk(gl.VERTEX_SHADER,VS));
    gl.attachShader(prog,mk(gl.FRAGMENT_SHADER,FS));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(prog));return;}
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

    defaultSources();

    canvas.addEventListener('click',e=>{
      const r=canvas.getBoundingClientRect();
      if(sources.length>=12) sources.shift();
      sources.push({x:e.clientX-r.left,y:canvas.height-(e.clientY-r.top),phase:Math.random()*Math.PI*2,amp:1});
    });

    function frame(){
      t+=0.016; raf=requestAnimationFrame(frame);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.useProgram(prog);
      const u=n=>gl.getUniformLocation(prog,n);
      gl.uniform2f(u('uRes'),canvas.width,canvas.height);
      gl.uniform1f(u('uTime'),t);
      gl.uniform1f(u('uFreq'),freq);
      gl.uniform1f(u('uWL'),wavelength);
      gl.uniform1i(u('uN'),sources.length);
      gl.uniform1i(u('uColor'),colorMap[colorMode]||0);
      // Upload source arrays
      const srcArr=new Float32Array(24);
      const phArr=new Float32Array(12);
      sources.forEach((s,i)=>{srcArr[i*2]=s.x;srcArr[i*2+1]=s.y;phArr[i]=s.phase;});
      gl.uniform2fv(u('uSrc'),srcArr);
      gl.uniform1fv(u('uPhase'),phArr);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }
    frame();
  }

  const b=(id,cb,dId,fmt)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('input',e=>{cb(parseFloat(e.target.value));if(dId)document.getElementById(dId).textContent=fmt?fmt(parseFloat(e.target.value)):e.target.value;});};
  b('waveN',v=>{nWaves=v;if(prog)defaultSources();},'waveNVal');
  b('waveFreq',v=>freq=v,'waveFreqVal',v=>v.toFixed(1));
  b('waveWL',v=>wavelength=v,'waveWLVal');
  document.getElementById('waveColor')?.addEventListener('change',e=>colorMode=e.target.value);
  document.getElementById('waveReset')?.addEventListener('click',()=>{if(prog)defaultSources();});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!prog)init();},{threshold:0.1}).observe(sec);
})();
