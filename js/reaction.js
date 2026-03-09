/* ═══════════════════════════════════════════
   reaction.js — Gray-Scott Reaction-Diffusion
   WebGL accelerated for smooth real-time simulation
   ═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('reactionCanvas');
  if(!canvas) return;
  const W=512, H=512;
  canvas.width=W; canvas.height=H;

  let gl = canvas.getContext('webgl');
  if(!gl) { fallbackCanvas(); return; }

  let feed=0.055, kill=0.062, dA=1.0, dB=0.5;
  let animFrame, running=true;
  let texA, texB, texC, texD, fbA, fbB;
  let simProg, renderProg;
  let mouseDown=false, mouseX=0, mouseY=0;

  const simVS=`attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
  const simFS=`
    precision highp float;
    uniform sampler2D u_tex;
    uniform vec2 u_res;
    uniform float u_feed,u_kill,u_dA,u_dB,u_dt;
    uniform vec2 u_mouse;
    uniform float u_addB;
    void main(){
      vec2 uv=gl_FragCoord.xy/u_res;
      vec4 c=texture2D(u_tex,uv);
      float a=c.r,b=c.g;
      vec2 p=1./u_res;
      // Laplacian
      float lA=texture2D(u_tex,uv+vec2(p.x,0)).r+texture2D(u_tex,uv-vec2(p.x,0)).r
              +texture2D(u_tex,uv+vec2(0,p.y)).r+texture2D(u_tex,uv-vec2(0,p.y)).r
              -4.*a;
      float lB=texture2D(u_tex,uv+vec2(p.x,0)).g+texture2D(u_tex,uv-vec2(p.x,0)).g
              +texture2D(u_tex,uv+vec2(0,p.y)).g+texture2D(u_tex,uv-vec2(0,p.y)).g
              -4.*b;
      float reaction=a*b*b;
      float na=clamp(a+u_dt*(u_dA*lA-reaction+u_feed*(1.-a)),0.,1.);
      float nb=clamp(b+u_dt*(u_dB*lB+reaction-(u_kill+u_feed)*b),0.,1.);
      if(u_addB>0.){
        float d=length(gl_FragCoord.xy-u_mouse*u_res);
        if(d<8.) nb=min(nb+0.4,1.);
      }
      gl_FragColor=vec4(na,nb,0,1);
    }
  `;
  const renderVS=`attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0,1);}`;
  const renderFS=`
    precision highp float;
    uniform sampler2D u_tex;
    varying vec2 v;
    void main(){
      float b=texture2D(u_tex,v).g;
      float a=texture2D(u_tex,v).r;
      // Beautiful color mapping
      vec3 c1=vec3(0.02,0.08,0.2), c2=vec3(0.,0.8,1.), c3=vec3(1.,0.9,0.);
      vec3 col=mix(c1,c2,b*2.);
      col=mix(col,c3,max(0.,b*2.-1.));
      // Add subtle contour lines
      float cont=0.5+0.5*sin(b*80.);
      col*=0.8+0.2*cont;
      gl_FragColor=vec4(col,1);
    }
  `;

  function makeShader(t,s){const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;}
  function makeProg(vs,fs){
    const p=gl.createProgram();
    gl.attachShader(p,makeShader(gl.VERTEX_SHADER,vs));
    gl.attachShader(p,makeShader(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(p);return p;
  }

  function makeTex(){
    const t=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    return t;
  }

  function makeFB(tex){
    const fb=gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
    return fb;
  }

  function init(){
    simProg=makeProg(simVS,simFS);
    renderProg=makeProg(renderVS,renderFS);

    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);

    // Enable attributes for both programs
    [simProg,renderProg].forEach(p=>{
      gl.useProgram(p);
      const a=gl.getAttribLocation(p,'a');
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    });

    texA=makeTex(); texB=makeTex(); texC=makeTex(); texD=makeTex();
    fbA=makeFB(texC); fbB=makeFB(texD);

    seed();
  }

  function seed(){
    const data=new Float32Array(W*H*4);
    for(let i=0;i<W*H;i++){
      data[i*4]=1; data[i*4+1]=0; data[i*4+2]=0; data[i*4+3]=1;
    }
    // Seed with B spots
    for(let k=0;k<15;k++){
      const cx=Math.floor(Math.random()*W), cy=Math.floor(Math.random()*H);
      for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){
        const x=(cx+dx+W)%W, y=(cy+dy+H)%H;
        if(dx*dx+dy*dy<64){data[(y*W+x)*4+1]=1;}
      }
    }
    gl.bindTexture(gl.TEXTURE_2D,texC);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,W,H,0,gl.RGBA,gl.FLOAT,data);
    gl.bindTexture(gl.TEXTURE_2D,texD);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,W,H,0,gl.RGBA,gl.FLOAT,data);
  }

  // Check float texture support
  const floatExt = gl.getExtension('OES_texture_float');
  if(!floatExt){ fallbackCanvas(); return; }

  init();

  let ping=true;
  function step(){
    gl.useProgram(simProg);
    for(let i=0;i<6;i++){
      const src=ping?texC:texD, dst=ping?fbB:fbA;
      gl.bindFramebuffer(gl.FRAMEBUFFER,dst);
      gl.viewport(0,0,W,H);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,src);
      gl.uniform1i(gl.getUniformLocation(simProg,'u_tex'),0);
      gl.uniform2f(gl.getUniformLocation(simProg,'u_res'),W,H);
      gl.uniform1f(gl.getUniformLocation(simProg,'u_feed'),feed);
      gl.uniform1f(gl.getUniformLocation(simProg,'u_kill'),kill);
      gl.uniform1f(gl.getUniformLocation(simProg,'u_dA'),dA*0.2);
      gl.uniform1f(gl.getUniformLocation(simProg,'u_dB'),dB*0.2);
      gl.uniform1f(gl.getUniformLocation(simProg,'u_dt'),1.0);
      gl.uniform2f(gl.getUniformLocation(simProg,'u_mouse'),mouseX/canvas.offsetWidth,1-mouseY/canvas.offsetHeight);
      gl.uniform1f(gl.getUniformLocation(simProg,'u_addB'),mouseDown?1:0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      ping=!ping;
    }

    // Render
    gl.useProgram(renderProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,ping?texC:texD);
    gl.uniform1i(gl.getUniformLocation(renderProg,'u_tex'),0);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);

    if(running) animFrame=requestAnimationFrame(step);
  }

  // Mouse
  canvas.addEventListener('mousedown',e=>{mouseDown=true;updateMouse(e);});
  canvas.addEventListener('mousemove',e=>{updateMouse(e);});
  canvas.addEventListener('mouseup',()=>mouseDown=false);
  canvas.addEventListener('touchstart',e=>{mouseDown=true;updateMouse(e.touches[0]);},{passive:true});
  canvas.addEventListener('touchmove',e=>{updateMouse(e.touches[0]);},{passive:true});
  canvas.addEventListener('touchend',()=>mouseDown=false);

  function updateMouse(e){
    const r=canvas.getBoundingClientRect();
    mouseX=e.clientX-r.left; mouseY=e.clientY-r.top;
  }

  // Presets
  const presets={
    coral:{feed:0.055,kill:0.062,dA:1,dB:0.5},
    spots:{feed:0.035,kill:0.065,dA:1,dB:0.5},
    stripes:{feed:0.026,kill:0.055,dA:1,dB:0.5},
    mitosis:{feed:0.028,kill:0.062,dA:1,dB:0.5},
  };

  document.getElementById('reactionPreset').addEventListener('change',e=>{
    const p=presets[e.target.value];
    if(!p) return;
    feed=p.feed; kill=p.kill; dA=p.dA; dB=p.dB;
    document.getElementById('feedRate').value=feed;
    document.getElementById('killRate').value=kill;
    document.getElementById('diffA').value=dA;
    document.getElementById('diffB').value=dB;
    document.getElementById('feedVal').textContent=feed;
    document.getElementById('killVal').textContent=kill;
    document.getElementById('diffAVal').textContent=dA;
    document.getElementById('diffBVal').textContent=dB;
    seed();
  });

  ['feedRate','killRate','diffA','diffB'].forEach(id=>{
    document.getElementById(id).addEventListener('input',e=>{
      const v=parseFloat(e.target.value);
      if(id==='feedRate'){feed=v;document.getElementById('feedVal').textContent=v.toFixed(3);}
      if(id==='killRate'){kill=v;document.getElementById('killVal').textContent=v.toFixed(3);}
      if(id==='diffA'){dA=v;document.getElementById('diffAVal').textContent=v.toFixed(2);}
      if(id==='diffB'){dB=v;document.getElementById('diffBVal').textContent=v.toFixed(2);}
    });
  });

  document.getElementById('reactionReset').addEventListener('click',()=>seed());
  document.getElementById('reactionSeed').addEventListener('click',()=>seed());

  function fallbackCanvas(){
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#040408'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgba(0,200,255,0.5)'; ctx.font='14px JetBrains Mono';
    ctx.fillText('WebGL float textures required for Reaction-Diffusion',20,canvas.height/2);
  }

  const obs=new IntersectionObserver(e=>{
    if(e[0].isIntersecting){running=true;step();obs.disconnect();}
    else{running=false;if(animFrame)cancelAnimationFrame(animFrame);}
  },{threshold:0.1});
  obs.observe(document.getElementById('reaction'));
})();
