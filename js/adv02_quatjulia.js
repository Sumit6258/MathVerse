/* ═══════════════════════════════════════════
   ADV 02 — Quaternion Julia Set (WebGL)
   4D fractal cross-section via ray marching
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('quatjulia'); if(!section)return;
  let canvas,gl,prog,raf=null,rotX=0.3,rotY=0,dragging=false,lx=0,ly=0,t=0;
  let cR=-0.2,cI=0.4,cJ=0.1,cK=0,sliceW=0,iters=8,pal='fire';

  function init(){
    canvas=document.getElementById('quatCanvas');
    if(!canvas)return;
    canvas.width=canvas.offsetWidth||680; canvas.height=canvas.offsetHeight||500;
    gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
    if(!gl)return;

    const vs=`attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
    const fs=`
precision highp float;
uniform vec2 uRes;
uniform float uRotX,uRotY,uCR,uCI,uCJ,uCK,uSlice,uIter,uT;
uniform int uPal;

// Quaternion multiplication
vec4 qmul(vec4 a,vec4 b){
  return vec4(a.x*b.x-a.y*b.y-a.z*b.z-a.w*b.w,
              a.x*b.y+a.y*b.x+a.z*b.w-a.w*b.z,
              a.x*b.z-a.y*b.w+a.z*b.x+a.w*b.y,
              a.x*b.w+a.y*b.z-a.z*b.y+a.w*b.x);
}

float DE(vec3 p){
  vec4 q=vec4(p.x,p.y,p.z,uSlice);
  vec4 c=vec4(uCR,uCI,uCJ,uCK);
  vec4 dq=vec4(1,0,0,0);
  for(int i=0;i<16;i++){
    if(float(i)>=uIter)break;
    dq=2.*qmul(q,dq);
    q=qmul(q,q)+c;
    if(dot(q,q)>16.)break;
  }
  float r=length(q);
  float dr=length(dq);
  return .5*log(r)*r/(dr+.0001);
}

mat3 rotY(float a){return mat3(cos(a),0,sin(a),0,1,0,-sin(a),0,cos(a));}
mat3 rotX(float a){return mat3(1,0,0,0,cos(a),-sin(a),0,sin(a),cos(a));}

vec3 norm(vec3 p){float e=.002;return normalize(vec3(DE(p+vec3(e,0,0))-DE(p-vec3(e,0,0)),DE(p+vec3(0,e,0))-DE(p-vec3(0,e,0)),DE(p+vec3(0,0,e))-DE(p-vec3(0,0,e))));}

vec3 fire(float t){return vec3(t*t,t*t*t,.1*t)*1.5;}
vec3 ice(float t){return vec3(.05,t*.5,t*1.2);}
vec3 alien(float t){return vec3(t*.3,t*1.2,.8+t*.2);}

void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  vec3 ro=vec3(0,0,3.); vec3 rd=normalize(vec3(uv,-1.8));
  mat3 R=rotY(uRotY)*rotX(uRotX);
  ro=R*ro; rd=R*rd;
  float td=0.;bool hit=false;int hi=0;
  for(int i=0;i<100;i++){
    float d=DE(ro+rd*td);
    if(d<.001){hit=true;hi=i;break;}
    if(td>6.)break;
    td+=max(d*.7,.0003);
  }
  vec3 col=vec3(.01,.01,.03);
  if(hit){
    vec3 p=ro+rd*td;
    vec3 n=norm(p);
    vec3 l=normalize(vec3(.8,.6,.4));
    float diff=max(dot(n,l),0.);
    float spec=pow(max(dot(reflect(-l,n),-rd),0.),60.);
    float ao=1.-float(hi)/uIter*.6;
    float t2=length(p)*.4+uT*.02;
    vec3 base;
    if(uPal==0) base=fire(clamp(t2,0.,1.));
    else if(uPal==1) base=ice(clamp(t2,0.,1.));
    else base=alien(clamp(t2,0.,1.));
    col=base*(diff*.8+.2)*ao+vec3(1)*spec*.5;
    float rim=pow(1.-max(dot(-rd,n),0.),4.);
    col+=vec3(.2,.4,.9)*rim*.4;
  }
  col=pow(clamp(col,0.,1.),vec3(.45));
  gl_FragColor=vec4(col,1);
}`;

    function mk(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
    prog=gl.createProgram();
    gl.attachShader(prog,mk(gl.VERTEX_SHADER,vs));
    gl.attachShader(prog,mk(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(prog);
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

    canvas.addEventListener('mousedown',e=>{dragging=true;lx=e.clientX;ly=e.clientY;});
    canvas.addEventListener('mousemove',e=>{if(!dragging)return;rotY+=(e.clientX-lx)*.008;rotX+=(e.clientY-ly)*.008;lx=e.clientX;ly=e.clientY;});
    canvas.addEventListener('mouseup',()=>dragging=false);

    function frame(){
      t+=0.016; rotY+=0.003;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.useProgram(prog);
      const u=n=>gl.getUniformLocation(prog,n);
      const palMap={fire:0,ice:1,alien:2};
      gl.uniform2f(u('uRes'),canvas.width,canvas.height);
      gl.uniform1f(u('uRotX'),rotX); gl.uniform1f(u('uRotY'),rotY);
      gl.uniform1f(u('uCR'),cR); gl.uniform1f(u('uCI'),cI);
      gl.uniform1f(u('uCJ'),cJ); gl.uniform1f(u('uCK'),cK);
      gl.uniform1f(u('uSlice'),sliceW);
      gl.uniform1f(u('uIter'),iters);
      gl.uniform1f(u('uT'),t);
      gl.uniform1i(u('uPal'),palMap[pal]||0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      raf=requestAnimationFrame(frame);
    }
    frame();
  }

  const bind=(id,cb,dispId,fmt)=>{
    const el=document.getElementById(id); if(!el)return;
    el.addEventListener('input',e=>{const v=parseFloat(e.target.value);cb(v);if(dispId)document.getElementById(dispId).textContent=fmt?fmt(v):v;});
  };
  bind('quatCR',v=>{cR=v;},'qcr',v=>v.toFixed(2));
  bind('quatCI',v=>{cI=v;},'qci',v=>v.toFixed(2));
  bind('quatCJ',v=>{cJ=v;},'qcj',v=>v.toFixed(2));
  bind('quatCK',v=>{cK=v;},'qck',v=>v.toFixed(2));
  bind('quatSlice',v=>{sliceW=v;},'qsW',v=>v.toFixed(2));
  bind('quatIter',v=>{iters=v;},'qiVal');
  document.getElementById('quatPal')?.addEventListener('change',e=>pal=e.target.value);

  const obs=new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!prog)init();
  },{threshold:0.1});
  obs.observe(section);
})();
