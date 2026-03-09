/* ═══════════════════════════════════════════
   fourd.js — 4D Geometry with Three.js
   Tesseract, simplex, cross-polytope, Clifford torus
   ═══════════════════════════════════════════ */
(function() {
  const container = document.getElementById('fourdContainer');
  if(!container||!window.THREE) return;

  let scene, camera, renderer, lines, animFrame;
  let currentObj='tesseract', autoRotate=true;
  let xyAngle=0,xwAngle=0,ywAngle=0,zwAngle=0;
  let autoXY=0,autoXW=0,autoYW=0,autoZW=0;
  let isDrag=false, prevM={x:0,y:0}, spherical={theta:0.5,phi:1.2,r:3};

  function init(){
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x030307);
    const W=container.clientWidth||600, H=container.clientHeight||500;
    camera=new THREE.PerspectiveCamera(60,W/H,0.1,100);
    updateCamera();
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W,H);
    container.appendChild(renderer.domElement);

    // Ambient glow
    scene.add(new THREE.AmbientLight(0x112244,1));
    const pt=new THREE.PointLight(0x00c8ff,3,20);pt.position.set(3,3,3);scene.add(pt);

    // Star field
    const sg=new THREE.BufferGeometry();
    const sp=new Float32Array(3000);
    for(let i=0;i<3000;i++)sp[i]=(Math.random()-0.5)*30;
    sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
    scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0x334488,size:0.04})));

    container.addEventListener('mousedown',e=>{isDrag=true;prevM={x:e.clientX,y:e.clientY};});
    window.addEventListener('mousemove',e=>{
      if(!isDrag) return;
      spherical.theta-=(e.clientX-prevM.x)*0.008;
      spherical.phi=Math.max(0.1,Math.min(Math.PI-0.1,spherical.phi-(e.clientY-prevM.y)*0.008));
      prevM={x:e.clientX,y:e.clientY};updateCamera();
    });
    window.addEventListener('mouseup',()=>isDrag=false);
    container.addEventListener('wheel',e=>{
      spherical.r=Math.max(1.5,Math.min(8,spherical.r+e.deltaY*0.005));updateCamera();
    },{passive:true});
    window.addEventListener('resize',()=>{
      const W2=container.clientWidth||600,H2=container.clientHeight||500;
      camera.aspect=W2/H2;camera.updateProjectionMatrix();renderer.setSize(W2,H2);
    });

    buildObject(currentObj);
    animate();
  }

  function updateCamera(){
    camera.position.set(
      spherical.r*Math.sin(spherical.phi)*Math.cos(spherical.theta),
      spherical.r*Math.cos(spherical.phi),
      spherical.r*Math.sin(spherical.phi)*Math.sin(spherical.theta)
    );
    camera.lookAt(0,0,0);
  }

  // 4D rotation matrices
  function rot4(pts, xy, xw, yw, zw) {
    return pts.map(p=>{
      let [x,y,z,w]=p;
      // XY
      let c=Math.cos(xy),s=Math.sin(xy);
      [x,y]=[x*c-y*s, x*s+y*c];
      // XW
      c=Math.cos(xw);s=Math.sin(xw);
      [x,w]=[x*c-w*s, x*s+w*c];
      // YW
      c=Math.cos(yw);s=Math.sin(yw);
      [y,w]=[y*c-w*s, y*s+w*c];
      // ZW
      c=Math.cos(zw);s=Math.sin(zw);
      [z,w]=[z*c-w*s, z*s+w*c];
      return [x,y,z,w];
    });
  }

  function project4to3(p) {
    const w=p[3]+2.5; // perspective distance
    return new THREE.Vector3(p[0]/w*2, p[1]/w*2, p[2]/w*2);
  }

  // ── TESSERACT ────────────────────────────────────────
  function tesseractData(){
    const verts=[];
    for(let i=0;i<16;i++){
      verts.push([(i&1)?1:-1,(i&2)?1:-1,(i&4)?1:-1,(i&8)?1:-1]);
    }
    const edges=[];
    for(let i=0;i<16;i++)for(let j=i+1;j<16;j++){
      let diff=0; for(let k=0;k<4;k++) if(verts[i][k]!==verts[j][k]) diff++;
      if(diff===1) edges.push([i,j]);
    }
    return {verts,edges};
  }

  // ── 5-CELL (4-simplex) ────────────────────────────────
  function simplexData(){
    const verts=[
      [1,1,1,-1],[1,-1,-1,1],[-1,1,-1,1],[-1,-1,1,1],[0,0,0,-2+1]
    ].map(v=>{const n=Math.sqrt(v.reduce((a,b)=>a+b*b,0));return v.map(x=>x/n*1.5);});
    const edges=[];
    for(let i=0;i<5;i++)for(let j=i+1;j<5;j++) edges.push([i,j]);
    return {verts,edges};
  }

  // ── 16-CELL ───────────────────────────────────────────
  function crossData(){
    const verts=[];
    for(let i=0;i<4;i++) for(let s of[-1.4,1.4]){
      const v=[0,0,0,0]; v[i]=s; verts.push(v);
    }
    const edges=[];
    for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
      // All pairs that are NOT antipodal
      if(Math.abs(verts[i][0]+verts[j][0])>0.1||Math.abs(verts[i][1]+verts[j][1])>0.1||
         Math.abs(verts[i][2]+verts[j][2])>0.1||Math.abs(verts[i][3]+verts[j][3])>0.1)
        edges.push([i,j]);
    }
    return {verts,edges};
  }

  // ── CLIFFORD TORUS ────────────────────────────────────
  function cliffordTorusData(){
    const verts=[], edges=[];
    const M=32, N2=24;
    for(let i=0;i<M;i++)for(let j=0;j<N2;j++){
      const u=(i/M)*Math.PI*2, v=(j/N2)*Math.PI*2;
      verts.push([Math.cos(u),Math.sin(u),Math.cos(v),Math.sin(v)]);
    }
    for(let i=0;i<M;i++)for(let j=0;j<N2;j++){
      edges.push([i*N2+j, i*N2+(j+1)%N2]);
      edges.push([i*N2+j, ((i+1)%M)*N2+j]);
    }
    return {verts,edges};
  }

  const objBuilders={tesseract:tesseractData,simplex:simplexData,cross:crossData,torus:cliffordTorusData};

  let vertData=[], edgeData=[];

  function buildObject(name){
    if(lines){scene.remove(lines);lines.geometry.dispose();}
    const data=objBuilders[name]();
    vertData=data.verts; edgeData=data.edges;
    updateGeometry();
  }

  function updateGeometry(){
    const xy=xyAngle, xw=xwAngle, yw=ywAngle, zw=zwAngle;
    const rotated=rot4(vertData,xy,xw,yw,zw);
    const projected=rotated.map(project4to3);

    const positions=[];
    edgeData.forEach(([a,b])=>{
      const pa=projected[a], pb=projected[b];
      positions.push(pa.x,pa.y,pa.z, pb.x,pb.y,pb.z);
    });

    if(lines) scene.remove(lines);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    // Color by w-value
    const colors=[];
    edgeData.forEach(([a,b])=>{
      const wa=rotated[a][3], wb=rotated[b][3];
      const ca=hueFromW(wa), cb=hueFromW(wb);
      colors.push(...ca,...cb);
    });
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const mat=new THREE.LineBasicMaterial({vertexColors:true,linewidth:1.5});
    lines=new THREE.LineSegments(geo,mat);
    scene.add(lines);
  }

  function hueFromW(w){
    const t=(w+2)/4; // normalize 0-1
    const r=Math.max(0,Math.min(1,2*t));
    const g=Math.max(0,Math.min(1,2*(1-Math.abs(t-0.5))));
    const b=Math.max(0,Math.min(1,2*(1-t)));
    return [r,g,b];
  }

  function animate(){
    animFrame=requestAnimationFrame(animate);
    if(autoRotate){
      autoXY+=0.005; autoXW+=0.007; autoYW+=0.003; autoZW+=0.009;
      xyAngle=autoXY; xwAngle=autoXW; ywAngle=autoYW; zwAngle=autoZW;
    }
    updateGeometry();
    renderer.render(scene,camera);
  }

  // Controls
  document.getElementById('fourdObject').addEventListener('change',e=>{
    currentObj=e.target.value; buildObject(currentObj);
  });
  document.getElementById('xyRot').addEventListener('input',e=>{
    xyAngle=parseFloat(e.target.value)*Math.PI/180;
    document.getElementById('xyRotVal').textContent=e.target.value+'°';
  });
  document.getElementById('xwRot').addEventListener('input',e=>{
    xwAngle=parseFloat(e.target.value)*Math.PI/180;
    document.getElementById('xwRotVal').textContent=e.target.value+'°';
  });
  document.getElementById('ywRot').addEventListener('input',e=>{
    ywAngle=parseFloat(e.target.value)*Math.PI/180;
    document.getElementById('ywRotVal').textContent=e.target.value+'°';
  });
  document.getElementById('zwRot').addEventListener('input',e=>{
    zwAngle=parseFloat(e.target.value)*Math.PI/180;
    document.getElementById('zwRotVal').textContent=e.target.value+'°';
  });
  document.getElementById('fourdAuto').addEventListener('change',e=>{autoRotate=e.target.checked;});

  const obs=new IntersectionObserver(e=>{
    if(e[0].isIntersecting){init();obs.disconnect();}
  },{threshold:0.2});
  obs.observe(document.getElementById('fourd'));
})();
