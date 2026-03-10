/* ═══════════════════════════════════════════════
   ART 05 — Recursive Geometric Kaleidoscope
   WebGL GLSL — complex rotations & reflection groups
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('kaleidoscope'); if(!sec) return;
  const canvas=document.getElementById('kaleidoCanvas'); if(!canvas) return;
  let gl,prog,raf=null,t=0;
  let symN=6,depth=4,rotSpeed=0.5,pattern='flower',mx=0.5,my=0.5;

  const VS=`attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
  const FS=`
precision highp float;
uniform vec2 uRes,uMouse;
uniform float uTime,uN,uDepth,uPattern;

#define PI 3.14159265

vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 cdiv(vec2 a,vec2 b){float d=dot(b,b);return vec2(dot(a,b),a.y*b.x-a.x*b.y)/d;}
float carg(vec2 z){return atan(z.y,z.x);}
float cmod(vec2 z){return length(z);}

// Fold to fundamental domain of dihedral group D_n
vec2 fold(vec2 z, float n){
  float a=carg(z);
  float sector=PI*2./n;
  a=mod(a,sector);
  if(a>sector*.5) a=sector-a;
  return cmod(z)*vec2(cos(a),sin(a));
}

// Pattern function
float pattern1(vec2 z,float dep){ // flower
  float v=0.;
  for(float i=0.;i<7.;i++){
    if(i>=dep)break;
    z=fold(z,uN);
    z=vec2(abs(z.x)-0.5,z.y);
    z=cmul(z,z)*1.5;
    v+=.5/pow(2.,i)*sin(length(z)*3.+uTime*.5);
  }
  return v;
}
float pattern2(vec2 z,float dep){ // islamic star
  float v=0.;
  for(float i=0.;i<7.;i++){
    if(i>=dep)break;
    z=fold(z,uN);
    float l=length(z);
    v+=cos(l*10.-uTime)+cos(uN*carg(fold(z,uN))+uTime*.3);
    z*=1.4;
  }
  return v*.5;
}
float pattern3(vec2 z,float dep){ // mandala
  float v=0.;
  for(float i=0.;i<7.;i++){
    if(i>=dep)break;
    z=fold(z,uN);
    v+=sin(length(z)*6.+uTime*.4)*cos(uN*0.5*carg(z)+uTime*.2);
    z=cdiv(vec2(1),z+vec2(.3,0));
  }
  return v;
}
float pattern4(vec2 z,float dep){ // snowflake
  float v=0.;
  for(float i=0.;i<7.;i++){
    if(i>=dep)break;
    z=fold(z,uN);
    z.x=abs(z.x)-.4;
    v+=cos(length(z)*8.+uTime*.3)/pow(1.5,i);
  }
  return v;
}

vec3 rainbow(float t){return .5+.5*cos(6.28*(t+vec3(0,.33,.67)));}

void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y)*2.;
  // Mouse influences rotation
  vec2 mouse=(uMouse-.5)*2.;
  float baseAng=uTime*0.2+mouse.x*.5;
  float c=cos(baseAng),s2=sin(baseAng);
  uv=vec2(c*uv.x-s2*uv.y,s2*uv.x+c*uv.y);

  float v;
  if(uPattern<0.5) v=pattern1(uv,uDepth);
  else if(uPattern<1.5) v=pattern2(uv,uDepth);
  else if(uPattern<2.5) v=pattern3(uv,uDepth);
  else v=pattern4(uv,uDepth);

  float hue=v*.5+uTime*.04+mouse.y*.2;
  vec3 col=rainbow(hue);
  // Glow rings at zero crossings
  float ring=pow(abs(sin(v*PI)),6.);
  col=mix(col,vec3(1),ring*.5);
  col=pow(clamp(col,0.,1.),vec3(.7));
  gl_FragColor=vec4(col,1);
}`;

  function mk(t,s){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh;}

  function init(){
    canvas.width=canvas.offsetWidth||800; canvas.height=canvas.offsetHeight||540;
    gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
    if(!gl)return;
    prog=gl.createProgram();
    gl.attachShader(prog,mk(gl.VERTEX_SHADER,VS));
    gl.attachShader(prog,mk(gl.FRAGMENT_SHADER,FS));
    gl.linkProgram(prog);
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mx=e.clientX/r.width;my=1-(e.clientY-r.top)/r.height;});

    const patMap={flower:0,islamic:1,mandala:2,snowflake:3};
    function frame(){
      t+=0.016*rotSpeed; raf=requestAnimationFrame(frame);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.useProgram(prog);
      const u=n=>gl.getUniformLocation(prog,n);
      gl.uniform2f(u('uRes'),canvas.width,canvas.height);
      gl.uniform2f(u('uMouse'),mx,my);
      gl.uniform1f(u('uTime'),t);
      gl.uniform1f(u('uN'),symN);
      gl.uniform1f(u('uDepth'),depth);
      gl.uniform1f(u('uPattern'),patMap[pattern]||0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }
    frame();
  }

  const b=(id,cb,dId)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('input',e=>{cb(parseFloat(e.target.value));if(dId)document.getElementById(dId).textContent=e.target.value;});};
  b('kalN',v=>symN=v,'kalNVal');
  b('kalDepth',v=>depth=v,'kalDepthVal');
  b('kalSpeed',v=>rotSpeed=v,'kalSpeedVal',v=>v.toFixed(2));
  document.getElementById('kalPattern')?.addEventListener('change',e=>pattern=e.target.value);

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!prog)init();},{threshold:0.1}).observe(sec);
})();
