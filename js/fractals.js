/* ═══════════════════════════════════════════
   fractals.js — WebGL Fractal Renderer
   ═══════════════════════════════════════════ */

(function() {
  const canvas = document.getElementById('fractalCanvas');
  canvas.width = 800; canvas.height = 600;

  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  let useWebGL = !!gl;
  let ctx2d = useWebGL ? null : canvas.getContext('2d');

  // State
  let state = {
    fractalType: 'mandelbrot',
    centerX: -0.5, centerY: 0,
    zoom: 1,
    maxIter: 256,
    palette: 'nebula',
    juliaC: { r: -0.7, i: 0.27 },
    isDragging: false,
    lastMouse: { x:0, y:0 }
  };

  // ── WebGL Shaders ────────────────────────
  const VS = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0, 1); }
  `;

  const FS = `
    precision highp float;
    uniform vec2 u_res;
    uniform vec2 u_center;
    uniform float u_zoom;
    uniform int u_maxIter;
    uniform int u_type; // 0=mandelbrot, 1=julia, 2=burning
    uniform vec2 u_juliaC;
    uniform int u_palette;

    vec3 palette(float t, int p) {
      t = fract(t);
      if(p == 0) { // nebula
        return 0.5+0.5*cos(6.28318*(t*vec3(1.0,0.8,0.6)+vec3(0.0,0.1,0.3)));
      } else if(p == 1) { // fire
        return vec3(t*2.0, t*t*1.5, t*t*t*0.5);
      } else if(p == 2) { // ocean
        return vec3(0.0, t*0.5+0.2, t*0.8+0.1);
      } else if(p == 3) { // gold
        return vec3(t*1.2, t*0.9, t*0.2);
      } else { // neon
        float s = sin(t*6.28318);
        return vec3(abs(s)*0.5+0.5, t, 1.0-t);
      }
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - u_res*0.5) / min(u_res.x,u_res.y);
      vec2 c = uv / u_zoom + u_center;

      vec2 z;
      if(u_type == 1) { z = c; c = u_juliaC; }
      else z = vec2(0.0);

      float iter = 0.0;
      for(int i=0; i<2048; i++) {
        if(i >= u_maxIter) break;
        if(u_type == 2) z = vec2(abs(z.x), abs(z.y)); // burning ship
        float x2 = z.x*z.x, y2 = z.y*z.y;
        if(x2+y2 > 4.0) { iter = float(i); break; }
        z = vec2(x2-y2+c.x, 2.0*z.x*z.y+c.y);
        iter = float(i);
      }

      if(iter >= float(u_maxIter)-1.0) {
        gl_FragColor = vec4(0.0,0.0,0.0,1.0);
      } else {
        float smooth_iter = iter + 1.0 - log2(log2(dot(z,z)));
        float t = smooth_iter / float(u_maxIter);
        vec3 col = palette(t * 3.0, u_palette);
        gl_FragColor = vec4(col, 1.0);
      }
    }
  `;

  let program, uniforms;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function initGL() {
    if(!useWebGL) return;
    const vs = compileShader(VS, gl.VERTEX_SHADER);
    const fs = compileShader(FS, gl.FRAGMENT_SHADER);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    uniforms = {
      res: gl.getUniformLocation(program,'u_res'),
      center: gl.getUniformLocation(program,'u_center'),
      zoom: gl.getUniformLocation(program,'u_zoom'),
      maxIter: gl.getUniformLocation(program,'u_maxIter'),
      type: gl.getUniformLocation(program,'u_type'),
      juliaC: gl.getUniformLocation(program,'u_juliaC'),
      palette: gl.getUniformLocation(program,'u_palette'),
    };
  }

  function render() {
    if(useWebGL) {
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(uniforms.res, canvas.width, canvas.height);
      gl.uniform2f(uniforms.center, state.centerX, state.centerY);
      gl.uniform1f(uniforms.zoom, state.zoom);
      gl.uniform1i(uniforms.maxIter, state.maxIter);
      gl.uniform1i(uniforms.type,
        state.fractalType==='mandelbrot'?0 : state.fractalType==='julia'?1 : 2);
      gl.uniform2f(uniforms.juliaC, state.juliaC.r, state.juliaC.i);
      gl.uniform1i(uniforms.palette,
        {nebula:0,fire:1,ocean:2,gold:3,neon:4}[state.palette] || 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else {
      renderCPU();
    }
    updateCoords();
  }

  // CPU fallback (low-res)
  function renderCPU() {
    const W=canvas.width, H=canvas.height;
    const img = ctx2d.createImageData(W,H);
    const d = img.data;
    for(let py=0;py<H;py++) {
      for(let px=0;px<W;px++) {
        const cx = (px-W/2)/(Math.min(W,H)*state.zoom*0.5) + state.centerX;
        const cy = (py-H/2)/(Math.min(W,H)*state.zoom*0.5) + state.centerY;
        let zr=0,zi=0, cr=cx,ci=cy;
        if(state.fractalType==='julia') { zr=cx;zi=cy; cr=state.juliaC.r; ci=state.juliaC.i; }
        let iter=0;
        for(;iter<state.maxIter;iter++) {
          if(state.fractalType==='burning') { zr=Math.abs(zr);zi=Math.abs(zi); }
          const zr2=zr*zr, zi2=zi*zi;
          if(zr2+zi2>4) break;
          [zr,zi]=[zr2-zi2+cr, 2*zr*zi+ci];
        }
        const idx=(py*W+px)*4;
        if(iter>=state.maxIter) { d[idx]=d[idx+1]=d[idx+2]=0; }
        else {
          const t=iter/state.maxIter;
          const [r,g,b]=paletteColor(t,state.palette);
          d[idx]=r;d[idx+1]=g;d[idx+2]=b;
        }
        d[idx+3]=255;
      }
    }
    ctx2d.putImageData(img,0,0);
  }

  function paletteColor(t,p) {
    t=(t*3)%1;
    if(p==='nebula') {
      return [
        Math.floor(127+127*Math.cos(6.28*t)),
        Math.floor(127+127*Math.cos(6.28*(t+0.1))),
        Math.floor(127+127*Math.cos(6.28*(t+0.3)))
      ];
    }
    if(p==='fire') return [Math.floor(t*512),Math.floor(t*t*383),Math.floor(t*t*t*127)];
    if(p==='ocean') return [0,Math.floor(t*127+51),Math.floor(t*204+25)];
    if(p==='gold') return [Math.floor(t*306),Math.floor(t*229),Math.floor(t*51)];
    return [Math.floor(t*255),Math.floor((1-t)*255),Math.floor(Math.abs(Math.sin(t*Math.PI))*255)];
  }

  function updateCoords() {
    document.getElementById('fractalCoords').textContent =
      `Center: (${state.centerX.toFixed(4)}, ${state.centerY.toFixed(4)}) | Zoom: ${state.zoom.toFixed(1)}×`;
  }

  // ── Mouse interactions ────────────────────
  canvas.addEventListener('mousedown', e => {
    state.isDragging = true;
    state.lastMouse = { x:e.clientX, y:e.clientY };
  });

  canvas.addEventListener('mousemove', e => {
    if(!state.isDragging) return;
    const dx = (e.clientX - state.lastMouse.x) / (Math.min(canvas.width,canvas.height) * state.zoom * 0.5);
    const dy = (e.clientY - state.lastMouse.y) / (Math.min(canvas.width,canvas.height) * state.zoom * 0.5);
    state.centerX -= dx;
    state.centerY += dy;
    state.lastMouse = { x:e.clientX, y:e.clientY };
    render();
  });

  canvas.addEventListener('mouseup', () => state.isDragging = false);
  canvas.addEventListener('mouseleave', () => state.isDragging = false);

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.3 : 1/1.3;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX-rect.left)/rect.width*canvas.width;
    const my = (e.clientY-rect.top)/rect.height*canvas.height;
    const wx = (mx-canvas.width/2)/(Math.min(canvas.width,canvas.height)*state.zoom*0.5)+state.centerX;
    const wy = (my-canvas.height/2)/(Math.min(canvas.width,canvas.height)*state.zoom*0.5)+state.centerY;
    state.zoom *= factor;
    state.centerX = wx - (wx-state.centerX)/factor;
    state.centerY = wy - (wy-state.centerY)/factor;
    render();
  }, {passive:false});

  // Touch support
  let lastTouch = null;
  canvas.addEventListener('touchstart', e => {
    lastTouch = { x:e.touches[0].clientX, y:e.touches[0].clientY };
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const dx = (e.touches[0].clientX - lastTouch.x)/(Math.min(canvas.width,canvas.height)*state.zoom*0.5);
    const dy = (e.touches[0].clientY - lastTouch.y)/(Math.min(canvas.width,canvas.height)*state.zoom*0.5);
    state.centerX -= dx; state.centerY += dy;
    lastTouch = { x:e.touches[0].clientX, y:e.touches[0].clientY };
    render();
  }, {passive:false});

  // ── Controls ──────────────────────────────
  document.querySelectorAll('.ftab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.fractalType = btn.dataset.fractal;
      // Reset for mandelbrot
      if(state.fractalType==='mandelbrot') { state.centerX=-0.5; state.centerY=0; state.zoom=1; }
      if(state.fractalType==='julia') { state.centerX=0; state.centerY=0; state.zoom=1.3; }
      if(state.fractalType==='burning') { state.centerX=-1.75; state.centerY=-0.03; state.zoom=1; }
      document.getElementById('juliaControls').style.display =
        state.fractalType==='julia' ? 'block' : 'none';
      render();
    });
  });

  document.getElementById('iterSlider').addEventListener('input', e => {
    state.maxIter = parseInt(e.target.value);
    document.getElementById('iterVal').textContent = state.maxIter;
    render();
  });

  document.getElementById('paletteSelect').addEventListener('change', e => {
    state.palette = e.target.value; render();
  });

  document.getElementById('juliaReal').addEventListener('input', e => {
    state.juliaC.r = parseFloat(e.target.value);
    document.getElementById('juliaRealVal').textContent = state.juliaC.r.toFixed(2);
    render();
  });

  document.getElementById('juliaImag').addEventListener('input', e => {
    state.juliaC.i = parseFloat(e.target.value);
    document.getElementById('juliaImagVal').textContent = state.juliaC.i.toFixed(2);
    render();
  });

  document.getElementById('resetFractal').addEventListener('click', () => {
    state.centerX = state.fractalType==='mandelbrot'?-0.5:0;
    state.centerY = 0; state.zoom = 1;
    render();
  });

  document.getElementById('saveFractal').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `fractal_${state.fractalType}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });

  // Init
  initGL();
  render();
})();
