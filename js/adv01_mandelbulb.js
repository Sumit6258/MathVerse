/* ═══════════════════════════════════════════
   ADV 01 — Mandelbulb 3D Ray-Marching
   Full GLSL fragment shader renderer
   ═══════════════════════════════════════════ */
(function(){
  const section = document.getElementById('mandelbulb');
  if(!section) return;

  let canvas, gl, prog, raf=null;
  let power=8, iters=6, bail=2, lightAng=45, palette='cosmic', autoRotate=true;
  let rotX=0.4, rotY=0.0, zoom=2.5, dragging=false, lastMX=0, lastMY=0;
  let t=0;

  function init(){
    canvas = document.getElementById('mandelbulbCanvas');
    canvas.width = canvas.offsetWidth||700;
    canvas.height = canvas.offsetHeight||500;
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if(!gl){ canvas.insertAdjacentHTML('afterend','<p style="color:#f55;padding:1rem">WebGL not supported</p>'); return; }

    const vsrc = `attribute vec2 a; void main(){gl_Position=vec4(a,0,1);}`;
    const fsrc = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uPow, uIter, uBail, uZoom, uRotX, uRotY, uLightAng;
uniform int uPal;

float DE(vec3 p){
  vec3 z=p; float dr=1.; float r=0.;
  for(int i=0;i<12;i++){
    if(float(i)>=uIter) break;
    r=length(z);
    if(r>uBail) break;
    float theta=acos(z.z/r)*uPow;
    float phi=atan(z.y,z.x)*uPow;
    float zr=pow(r,uPow);
    dr=pow(r,uPow-1.)*uPow*dr+1.;
    z=zr*vec3(sin(theta)*cos(phi),sin(theta)*sin(phi),cos(theta))+p;
  }
  return .5*log(r)*r/dr;
}

mat3 rotY(float a){return mat3(cos(a),0,sin(a),0,1,0,-sin(a),0,cos(a));}
mat3 rotX(float a){return mat3(1,0,0,0,cos(a),-sin(a),0,sin(a),cos(a));}

vec3 getNorm(vec3 p){
  float e=.001;
  return normalize(vec3(DE(p+vec3(e,0,0))-DE(p-vec3(e,0,0)),
                        DE(p+vec3(0,e,0))-DE(p-vec3(0,e,0)),
                        DE(p+vec3(0,0,e))-DE(p-vec3(0,0,e))));
}

vec3 palette1(float t){ // cosmic
  return .5+.5*cos(6.28*t*vec3(.9,1.1,.5)+vec3(.3,1.,.9));
}
vec3 palette2(float t){ // lava
  return mix(vec3(.8,.1,.0),vec3(1.,.7,.0),t);
}
vec3 palette3(float t){ // ice
  return mix(vec3(.0,.3,.8),vec3(.7,.95,1.),t);
}
vec3 palette4(float t){ // gold
  return mix(vec3(.15,.08,.0),vec3(1.,.85,.2),t);
}

void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  vec3 ro=vec3(0,0,uZoom);
  vec3 rd=normalize(vec3(uv,-1.5));
  mat3 Rx=rotX(uRotX); mat3 Ry=rotY(uRotY);
  ro=Ry*Rx*ro; rd=Ry*Rx*rd;

  float d=0., td=0.;
  int hit=0;
  for(int i=0;i<120;i++){
    vec3 p=ro+rd*td;
    d=DE(p);
    if(d<.001){ hit=i; break; }
    if(td>8.) break;
    td+=max(d*.8,.0002);
  }

  vec3 col=vec3(0.01,0.01,0.03);
  if(d<.001){
    vec3 p=ro+rd*td;
    vec3 n=getNorm(p);
    float ang=radians(uLightAng);
    vec3 ldir=normalize(vec3(cos(ang),sin(ang)*.8+.4,sin(ang)));
    float diff=max(dot(n,ldir),.0);
    float spec=pow(max(dot(reflect(-ldir,n),-rd),.0),40.);
    float ao=1.-float(hit)/uIter*.5;
    float t2=length(p)*.5;
    vec3 base;
    if(uPal==0) base=palette1(t2+uTime*.05);
    else if(uPal==1) base=palette2(t2);
    else if(uPal==2) base=palette3(t2);
    else base=palette4(t2);
    col=base*(diff*.85+.15)*ao + vec3(1)*spec*.4;
    // rim light
    float rim=1.-max(dot(-rd,n),.0);
    col+=vec3(0,.3,.6)*pow(rim,3.)*.5;
    // glow at edge
    col=mix(col,vec3(0,.5,1.),pow(rim,8.)*.3);
  }
  // background nebula
  float bg=dot(rd,vec3(0,1,0))*.5+.5;
  col+=vec3(0.005,0.01,0.03)*bg;
  col=pow(clamp(col,0.,1.),vec3(.45));
  gl_FragColor=vec4(col,1);
}`;

    function mkShader(type,src){
      const s=gl.createShader(type);
      gl.shaderSource(s,src); gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
        console.error('Shader err:',gl.getShaderInfoLog(s)); return null;
      }
      return s;
    }
    const vs=mkShader(gl.VERTEX_SHADER,vsrc);
    const fs=mkShader(gl.FRAGMENT_SHADER,fsrc);
    if(!vs||!fs) return;
    prog=gl.createProgram();
    gl.attachShader(prog,vs); gl.attachShader(prog,fs);
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){
      console.error('Link err:',gl.getProgramInfoLog(prog)); return;
    }
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

    function frame(){
      if(autoRotate) rotY+=0.005;
      t+=0.016;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.useProgram(prog);
      const palMap={cosmic:0,lava:1,ice:2,gold:3};
      gl.uniform2f(gl.getUniformLocation(prog,'uRes'),canvas.width,canvas.height);
      gl.uniform1f(gl.getUniformLocation(prog,'uTime'),t);
      gl.uniform1f(gl.getUniformLocation(prog,'uPow'),power);
      gl.uniform1f(gl.getUniformLocation(prog,'uIter'),iters);
      gl.uniform1f(gl.getUniformLocation(prog,'uBail'),bail);
      gl.uniform1f(gl.getUniformLocation(prog,'uZoom'),zoom);
      gl.uniform1f(gl.getUniformLocation(prog,'uRotX'),rotX);
      gl.uniform1f(gl.getUniformLocation(prog,'uRotY'),rotY);
      gl.uniform1f(gl.getUniformLocation(prog,'uLightAng'),lightAng);
      gl.uniform1i(gl.getUniformLocation(prog,'uPal'),palMap[palette]||0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      raf=requestAnimationFrame(frame);
    }

    // Mouse rotate
    canvas.addEventListener('mousedown',e=>{dragging=true;lastMX=e.clientX;lastMY=e.clientY;});
    canvas.addEventListener('mousemove',e=>{
      if(!dragging)return;
      rotY+=(e.clientX-lastMX)*0.008; rotX+=(e.clientY-lastMY)*0.008;
      rotX=Math.max(-1.5,Math.min(1.5,rotX));
      lastMX=e.clientX; lastMY=e.clientY;
    });
    canvas.addEventListener('mouseup',()=>dragging=false);
    canvas.addEventListener('mouseleave',()=>dragging=false);
    canvas.addEventListener('wheel',e=>{ zoom=Math.max(1.2,Math.min(6,zoom+e.deltaY*0.003)); e.preventDefault(); },{passive:false});

    frame();
  }

  // Controls
  const bind=(id,cb)=>{const el=document.getElementById(id);if(el)el.addEventListener('input',cb);};
  bind('mbPower',e=>{ power=parseFloat(e.target.value); document.getElementById('mbPowerVal').textContent=parseFloat(e.target.value).toFixed(1); });
  bind('mbIter',e=>{ iters=parseInt(e.target.value); document.getElementById('mbIterVal').textContent=e.target.value; });
  bind('mbBail',e=>{ bail=parseFloat(e.target.value); document.getElementById('mbBailVal').textContent=parseFloat(e.target.value).toFixed(1); });
  bind('mbLight',e=>{ lightAng=parseFloat(e.target.value); document.getElementById('mbLightVal').textContent=e.target.value; });
  document.getElementById('mbPalette')?.addEventListener('change',e=>palette=e.target.value);
  document.getElementById('mbRotate')?.addEventListener('change',e=>autoRotate=e.target.checked);
  document.getElementById('mbSave')?.addEventListener('click',()=>{
    const a=document.createElement('a'); a.download='mandelbulb.png'; a.href=canvas.toDataURL(); a.click();
  });

  const obs=new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!prog){init();}
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
    else if(en[0].isIntersecting&&prog&&!raf){
      (function loop(){raf=requestAnimationFrame(loop);})();
    }
  },{threshold:0.1});
  obs.observe(section);
})();
