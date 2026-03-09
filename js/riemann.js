/* ═══════════════════════════════════════════════════════
   riemann.js — Riemann Zeta Function Visualization
   Uses domain coloring on the complex plane via WebGL
   ═══════════════════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('riemannCanvas');
  if(!canvas) return;
  canvas.width = 700; canvas.height = 500;

  let gl = canvas.getContext('webgl');
  let useGL = !!gl;
  let mode = 'domain';
  let tRange = 50;
  let precision = 50;
  let animating = false, animT = 0, animFrame;

  // ── WebGL domain coloring ────────────────────────────
  const VS = `attribute vec2 a; void main(){gl_Position=vec4(a,0,1);}`;
  const FS = `
    precision highp float;
    uniform vec2 u_res;
    uniform int u_mode;
    uniform float u_tRange;
    uniform float u_terms;
    uniform float u_animT;

    // Complex mul/div
    vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
    vec2 cdiv(vec2 a,vec2 b){float d=dot(b,b);return vec2(dot(a,b),a.y*b.x-a.x*b.y)/d;}
    vec2 cexp(vec2 z){return exp(z.x)*vec2(cos(z.y),sin(z.y));}
    vec2 clog(vec2 z){return vec2(log(length(z)),atan(z.y,z.x));}
    vec2 cpow(vec2 z,vec2 w){return cexp(cmul(w,clog(z)));}

    // Approximate zeta(s) via partial sum
    vec2 zeta(vec2 s, int N) {
      vec2 sum = vec2(0);
      for(int n=1; n<=200; n++) {
        if(n > N) break;
        float fn = float(n);
        vec2 term = cpow(vec2(fn,0.0), vec2(-s.x,-s.y));
        sum += term;
      }
      return sum;
    }

    // HSV to RGB
    vec3 hsv2rgb(float h,float s,float v){
      h=fract(h);
      float r=abs(h*6.-3.)-1.,g=2.-abs(h*6.-2.),b=2.-abs(h*6.-4.);
      return v*(1.-s+s*clamp(vec3(r,g,b),0.,1.));
    }

    void main(){
      vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;
      float aspect=u_res.x/u_res.y;
      uv.x*=aspect;

      // Map to complex plane
      float scaleX=3.0, scaleY=u_tRange/u_res.y*u_res.x/aspect;
      vec2 s=vec2(uv.x*scaleX/aspect+0.5, uv.y*u_tRange);

      if(u_mode==0){ // Domain coloring
        vec2 z=zeta(s, int(u_terms));
        float arg=atan(z.y,z.x);
        float mag=length(z);
        float hue=(arg+3.14159)/(2.*3.14159);
        float bright=1.0-1.0/(1.0+mag*0.1);
        float bands=0.5+0.5*sin(log(mag)*4.0);
        gl_FragColor=vec4(hsv2rgb(hue,0.9,bright*0.8+0.2)*bands,1.0);
      }
      else if(u_mode==1){ // Zeros
        vec2 z=zeta(s, int(u_terms));
        float mag=length(z);
        float onCrit=abs(s.x-0.5)<0.02?1.0:0.0;
        float nearZero=exp(-mag*mag*20.0);
        vec3 col=mix(vec3(0.02,0.03,0.08),vec3(0.0,0.8,1.0),nearZero*2.0);
        col=mix(col,vec3(1.0,0.85,0.0),onCrit*0.3);
        gl_FragColor=vec4(col,1.0);
      }
      else if(u_mode==2){ // Critical line animation
        float y=s.y;
        vec2 critPt=zeta(vec2(0.5,y),int(u_terms));
        float r=length(critPt);
        float phase=atan(critPt.y,critPt.x);
        float isCrit=abs(s.x-0.5)<(0.08/abs(uv.x)+0.01)?1.0:0.0;
        float t=fract((y-u_animT*5.0)/10.0);
        vec3 col=hsv2rgb(phase/(2.*3.14159),1.,clamp(r*0.15,0.,1.));
        col=mix(col*0.15,col,isCrit);
        gl_FragColor=vec4(col,1.0);
      }
      else { // Prime connection
        float x=uv.x*4.+1.;
        // Simple representation using prime counting
        float y=uv.y*30.;
        vec2 z=zeta(vec2(max(x,0.1),y),int(u_terms));
        float mag=1.0/(1.0+length(z));
        float hue=fract(mag*3.0+u_animT*0.1);
        gl_FragColor=vec4(hsv2rgb(hue,0.85,mag*0.9+0.1),1.0);
      }
    }
  `;

  let prog, uni, buf;
  function initGL(){
    if(!useGL) return;
    function sh(t,s){const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;}
    prog=gl.createProgram();
    gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));
    gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));
    gl.linkProgram(prog); gl.useProgram(prog);
    buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(prog,'a');
    gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    uni={res:gl.getUniformLocation(prog,'u_res'),mode:gl.getUniformLocation(prog,'u_mode'),
      tRange:gl.getUniformLocation(prog,'u_tRange'),terms:gl.getUniformLocation(prog,'u_terms'),
      animT:gl.getUniformLocation(prog,'u_animT')};
  }

  function render(t=0){
    if(!useGL) { renderCPU(t); return; }
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(uni.res,canvas.width,canvas.height);
    gl.uniform1i(uni.mode,{domain:0,zeros:1,critical:2,primes:3}[mode]||0);
    gl.uniform1f(uni.tRange,tRange);
    gl.uniform1f(uni.terms,precision);
    gl.uniform1f(uni.animT,t);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }

  // CPU fallback
  function renderCPU(t=0){
    const W=canvas.width,H=canvas.height;
    const ctx=canvas.getContext('2d');
    const img=ctx.createImageData(W,H);
    for(let py=0;py<H;py+=2){
      for(let px=0;px<W;px+=2){
        const sx=(px/W)*6-3, sy=(py/H-0.5)*tRange;
        const [r,g,b]=colorZeta(sx+0.5,sy,precision);
        for(let dy=0;dy<2;dy++) for(let dx=0;dx<2;dx++){
          const idx=((py+dy)*W+(px+dx))*4;
          img.data[idx]=r;img.data[idx+1]=g;img.data[idx+2]=b;img.data[idx+3]=255;
        }
      }
    }
    ctx.putImageData(img,0,0);
  }

  function colorZeta(sr,si,N){
    let zr=0,zi=0;
    for(let n=1;n<=N;n++){
      const f=n, logF=Math.log(f);
      const ang=-si*logF, mag=Math.exp(-sr*logF);
      zr+=mag*Math.cos(ang); zi+=mag*Math.sin(ang);
    }
    const mag=Math.sqrt(zr*zr+zi*zi);
    const arg=Math.atan2(zi,zr);
    const h=(arg+Math.PI)/(2*Math.PI);
    const v=1-1/(1+mag*0.1);
    return hsvToRgb(h,0.9,v);
  }

  function hsvToRgb(h,s,v){
    h=h%1;
    const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t2=v*(1-(1-f)*s);
    const [[r,g,b]]=[[[v,t2,p],[q,v,p],[p,v,t2],[p,q,v],[t2,p,v],[v,p,q]].slice(i%6,i%6+1)];
    return [Math.floor(r*255),Math.floor(g*255),Math.floor(b*255)];
  }

  // ── Controls ─────────────────────────────────────────
  document.getElementById('riemannMode').addEventListener('change',e=>{
    mode=e.target.value; if(!animating) render(animT);
  });
  document.getElementById('riemannT').addEventListener('input',e=>{
    tRange=parseFloat(e.target.value);
    document.getElementById('riemannTVal').textContent=tRange;
    if(!animating) render(animT);
  });
  document.getElementById('riemannPrec').addEventListener('input',e=>{
    precision=parseInt(e.target.value);
    document.getElementById('riemannPrecVal').textContent=precision;
    if(!animating) render(animT);
  });

  const animBtn=document.getElementById('riemannAnimate');
  animBtn.addEventListener('click',()=>{
    animating=!animating;
    animBtn.textContent=animating?'⏸ Pause':'▶ Animate Zeros';
    animBtn.classList.toggle('active-btn',animating);
    if(animating) loop();
    else if(animFrame) cancelAnimationFrame(animFrame);
  });

  function loop(){
    animT+=0.01; render(animT);
    if(animating) animFrame=requestAnimationFrame(loop);
  }

  initGL();
  const obs=new IntersectionObserver(e=>{
    if(e[0].isIntersecting){render(0);obs.disconnect();}
  },{threshold:0.2});
  obs.observe(document.getElementById('riemann'));
})();
