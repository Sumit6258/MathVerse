/* ═══════════════════════════════════════════════
   ART 01 — Cosmic Fractal Nebula
   WebGL fBm + domain warping + Perlin noise
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('cosmicNebula'); if(!sec) return;
  const canvas=document.getElementById('nebulaCanvas'); if(!canvas) return;
  let gl,prog,raf=null,t=0;
  let mx=0.5,my=0.5,octaves=7,warp=1.5,zoomSpd=0.3,theme='nebula';

  const VS=`attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
  const FS=`
precision highp float;
uniform vec2 uRes,uMouse;
uniform float uTime,uOct,uWarp,uZoom;
uniform int uTheme;

vec2 hash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);vec2 a=hash2(i),b=hash2(i+vec2(1,0)),c=hash2(i+vec2(0,1)),d=hash2(i+vec2(1,1));return mix(mix(dot(a,f),dot(b,f-vec2(1,0)),u.x),mix(dot(c,f-vec2(0,1)),dot(d,f-vec2(1,1)),u.x),u.y);}
float fbm(vec2 p,float oct){float v=0.,a=0.5;for(int i=0;i<12;i++){if(float(i)>=oct)break;v+=a*noise(p);p=p*2.+vec2(1.7,9.2);a*=.5;}return v;}
vec3 nebulaColor(float v,float v2){return .5+.5*cos(6.28*vec3(v+.1,v+.4,v+.7)+vec3(0,2.1,4.2));}
vec3 auroraColor(float v,float v2){return vec3(v*.3,v*.9+.1,v2*.8+.2);}
vec3 fireColor(float v,float v2){return vec3(v*1.2,v*v*.7,v*v*v*.2);}
vec3 voidColor(float v,float v2){return vec3(.02+v2*.1,v*.05,v*.15+v2*.2);}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  uv*=1.2+uZoom*uTime*.01;
  vec2 mouse=(uMouse-.5)*2.;
  vec2 q=vec2(fbm(uv+uTime*.05,uOct),fbm(uv+vec2(5.2,1.3)+uTime*.04,uOct));
  vec2 warpOff=mouse*.3*uWarp;
  vec2 r=vec2(fbm(uv+uWarp*q+warpOff+vec2(1.7,9.2)+uTime*.03,uOct),
              fbm(uv+uWarp*q+warpOff+vec2(8.3,2.8)+uTime*.025,uOct));
  float f=fbm(uv+uWarp*r,uOct);
  f=smoothstep(0.,1.,f);
  float f2=fbm(uv*3.+uTime*.07+r,min(uOct,5.));
  vec3 col;
  if(uTheme==0) col=nebulaColor(f,f2);
  else if(uTheme==1) col=auroraColor(f,f2);
  else if(uTheme==2) col=fireColor(f,f2);
  else col=voidColor(f,f2);
  col=pow(col*1.2,vec3(.8));
  // Star field overlay
  float star=pow(max(0.,1.-length(fract(uv*80.+hash2(floor(uv*80.))*.5)-.5)*4.),3.);
  col+=vec3(star*.6,star*.8,star)*step(.97,hash2(floor(uv*80.)).x);
  gl_FragColor=vec4(clamp(col,0.,1.),1);
}`;

  function mkShader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}

  function init(){
    canvas.width=canvas.offsetWidth||800; canvas.height=canvas.offsetHeight||540;
    gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
    if(!gl)return;
    prog=gl.createProgram();
    gl.attachShader(prog,mkShader(gl.VERTEX_SHADER,VS));
    gl.attachShader(prog,mkShader(gl.FRAGMENT_SHADER,FS));
    gl.linkProgram(prog);
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mx=e.clientX/r.width;my=1-(e.clientY-r.top)/r.height;});

    const palMap={nebula:0,aurora:1,fire:2,void:3};
    function frame(){
      t+=0.016; raf=requestAnimationFrame(frame);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.useProgram(prog);
      const u=n=>gl.getUniformLocation(prog,n);
      gl.uniform2f(u('uRes'),canvas.width,canvas.height);
      gl.uniform2f(u('uMouse'),mx,my);
      gl.uniform1f(u('uTime'),t);
      gl.uniform1f(u('uOct'),octaves);
      gl.uniform1f(u('uWarp'),warp);
      gl.uniform1f(u('uZoom'),zoomSpd);
      gl.uniform1i(u('uTheme'),palMap[theme]||0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }
    frame();
  }

  const b=(id,cb,dId,fmt)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('input',e=>{cb(parseFloat(e.target.value));if(dId)document.getElementById(dId).textContent=fmt?fmt(parseFloat(e.target.value)):e.target.value;});};
  b('nebOct',v=>octaves=v,'nebOctVal');
  b('nebWarp',v=>warp=v,'nebWarpVal',v=>v.toFixed(1));
  b('nebZoom',v=>zoomSpd=v,'nebZoomVal',v=>v.toFixed(1));
  document.getElementById('nebColor')?.addEventListener('change',e=>theme=e.target.value);
  document.getElementById('nebSave')?.addEventListener('click',()=>{const a=document.createElement('a');a.download='nebula.png';a.href=canvas.toDataURL();a.click();});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!prog)init();},{threshold:0.1}).observe(sec);
})();
