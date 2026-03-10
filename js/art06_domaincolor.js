/* ═══════════════════════════════════════════════
   ART 06 — Complex Domain Coloring Art
   Animated psychedelic phase portraits (WebGL)
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('domainArt'); if(!sec) return;
  const canvas=document.getElementById('domainCanvas'); if(!canvas) return;
  let gl,prog,raf=null,t=0;
  let func='sinz',animSpeed=0.5,glow=true,zoom=1.0;
  let cx=0,cy=0,targetCx=0,targetCy=0;

  const VS=`attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
  const FS=`
precision highp float;
uniform vec2 uRes,uCenter;
uniform float uTime,uZoom,uFunc,uGlow;

vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 cdiv(vec2 a,vec2 b){float d=dot(b,b);return vec2(dot(a,b),a.y*b.x-a.x*b.y)/d;}
vec2 cexp(vec2 z){return exp(z.x)*vec2(cos(z.y),sin(z.y));}
vec2 csin(vec2 z){return vec2(sin(z.x)*cosh(z.y),cos(z.x)*sinh(z.y));}
vec2 ccos(vec2 z){return vec2(cos(z.x)*cosh(z.y),-sin(z.x)*sinh(z.y));}
vec2 ctan(vec2 z){return cdiv(csin(z),ccos(z));}
vec2 clog(vec2 z){return vec2(log(length(z)),atan(z.y,z.x));}
vec2 cpow(vec2 z,float n){float r=pow(length(z),n);float a=atan(z.y,z.x)*n;return r*vec2(cos(a),sin(a));}

vec2 evalFunc(vec2 z,float f,float t){
  if(f<0.5) return csin(z+vec2(t*.1,0)); // sin(z)
  if(f<1.5) return cexp(z+vec2(0,t*.2));  // exp(z)
  if(f<2.5){ // z^6-1 / z^4+c
    float ct=0.5*sin(t*.2);
    return cdiv(cpow(z,6.)-vec2(1,0),cpow(z,4.)+vec2(ct,0.3));
  }
  if(f<3.5) return ctan(z*vec2(1,0)+vec2(t*.05,0));
  if(f<4.5){ // Newton z^3-1
    vec2 fz=cpow(z,3.)-vec2(1,0);
    vec2 dfz=3.*cpow(z,2.);
    return cdiv(fz,dfz);
  }
  // Gamma-like poles
  vec2 acc=vec2(1,0);
  for(int k=0;k<5;k++){
    vec2 zk=z+vec2(float(k),0);
    float d=dot(zk,zk);
    if(d>0.0001)acc=cmul(acc,cdiv(zk,zk+vec2(1,0)));
  }
  return acc;
}

vec3 hsvToRgb(float h,float s,float v){
  h=mod(h,1.)*6.;float i=floor(h),f=h-i,p=v*(1.-s),q=v*(1.-f*s),tt=v*(1.-(1.-f)*s);
  if(i<1.)return vec3(v,tt,p);if(i<2.)return vec3(q,v,p);if(i<3.)return vec3(p,v,tt);
  if(i<4.)return vec3(p,q,v);if(i<5.)return vec3(tt,p,v);return vec3(v,p,q);
}

void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y)*4./uZoom+uCenter;
  vec2 w=evalFunc(uv,uFunc,uTime);
  float phase=(atan(w.y,w.x)+3.14159)/(2.*3.14159);
  float mag=log(length(w)+.001);
  float brightness=.7+.3*sin(mag*3.);
  float sat=.9;
  vec3 col=hsvToRgb(phase,sat,brightness);
  // Magnitude rings (isochromatic lines)
  float rings=pow(abs(sin(mag*3.14159)),4.);
  col=mix(col,vec3(1),rings*uGlow*.4);
  // Phase lines
  float plines=pow(abs(sin(phase*12.*3.14159)),5.);
  col=mix(col,vec3(1),plines*uGlow*.2);
  // Glow at poles (large magnitude)
  float pole=smoothstep(2.,0.,mag+2.);
  col=mix(col,vec3(1,.9,.6),pole*.7);
  col=pow(clamp(col,0.,1.),vec3(.6));
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

    canvas.addEventListener('click',e=>{
      const r=canvas.getBoundingClientRect();
      const uv=[(e.clientX-r.left)/r.width-.5,(1-(e.clientY-r.top)/r.height)-.5];
      targetCx+=uv[0]*4/zoom; targetCy+=uv[1]*4/zoom;
    });
    canvas.addEventListener('wheel',e=>{zoom=Math.max(0.2,Math.min(50,zoom*Math.pow(0.9,e.deltaY/50)));document.getElementById('domZoomVal').textContent=zoom.toFixed(1);const el=document.getElementById('domZoom');if(el)el.value=zoom;e.preventDefault();},{passive:false});

    const funcMap={sinz:0,expz:1,zetaish:2,tanz:3,'z3minus1':4,gamma:5};
    function frame(){
      t+=0.016*animSpeed; raf=requestAnimationFrame(frame);
      cx+=(targetCx-cx)*0.05; cy+=(targetCy-cy)*0.05;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.useProgram(prog);
      const u=n=>gl.getUniformLocation(prog,n);
      gl.uniform2f(u('uRes'),canvas.width,canvas.height);
      gl.uniform2f(u('uCenter'),cx,cy);
      gl.uniform1f(u('uTime'),t);
      gl.uniform1f(u('uZoom'),zoom);
      gl.uniform1f(u('uFunc'),funcMap[func]||0);
      gl.uniform1f(u('uGlow'),glow?1.0:0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }
    frame();
  }

  document.getElementById('domainFunc')?.addEventListener('change',e=>func=e.target.value);
  document.getElementById('domSpeed')?.addEventListener('input',e=>{animSpeed=parseFloat(e.target.value);document.getElementById('domSpeedVal').textContent=e.target.value;});
  document.getElementById('domGlow')?.addEventListener('change',e=>glow=e.target.checked);
  document.getElementById('domZoom')?.addEventListener('input',e=>{zoom=parseFloat(e.target.value);document.getElementById('domZoomVal').textContent=e.target.value;});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!prog)init();},{threshold:0.1}).observe(sec);
})();
