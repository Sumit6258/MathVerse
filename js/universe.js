/* ═══════════════════════════════════════════
   universe.js — Mathematical Universe Mode
   Flythrough Three.js space with WASD + mouse
   ═══════════════════════════════════════════ */
(function() {
  let scene, camera, renderer, animFrame;
  let keys={}, mouseDX=0, mouseDY=0, mouseLock=false;
  let initialized=false;

  const container=document.getElementById('universeContainer');
  const modal=document.getElementById('universeModal');
  const openBtns=document.querySelectorAll('#universeBtn,#heroUniverse');
  const closeBtn=document.getElementById('universeClose');

  function openUniverse(){
    modal.classList.add('active');
    if(!initialized){initUniverse();initialized=true;}
    else{renderer.domElement.style.display='block';}
    startLoop();
    modal.requestPointerLock?.();
  }

  function closeUniverse(){
    modal.classList.remove('active');
    stopLoop();
    document.exitPointerLock?.();
  }

  openBtns.forEach(b=>b?.addEventListener('click',openUniverse));
  closeBtn?.addEventListener('click',closeUniverse);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeUniverse();});

  // Pointer lock for mouse look
  document.addEventListener('pointerlockchange',()=>{mouseLock=!!document.pointerLockElement;});
  document.addEventListener('mousemove',e=>{
    if(mouseLock){mouseDX+=e.movementX*0.002;mouseDY+=e.movementY*0.002;}
  });
  document.addEventListener('keydown',e=>{keys[e.code]=true;});
  document.addEventListener('keyup',e=>{keys[e.code]=false;});

  function initUniverse(){
    if(!window.THREE) return;
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x010108);
    scene.fog=new THREE.FogExp2(0x010108,0.008);

    const W=container.clientWidth||window.innerWidth,H=container.clientHeight||window.innerHeight-50;
    camera=new THREE.PerspectiveCamera(75,W/H,0.01,1000);
    camera.position.set(0,5,20);

    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(W,H);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x0a1a2a,1));
    const sun=new THREE.PointLight(0x0066ff,5,50);sun.position.set(0,20,0);scene.add(sun);

    // Star field
    {
      const geo=new THREE.BufferGeometry();
      const pos=new Float32Array(6000);
      for(let i=0;i<6000;i++) pos[i]=(Math.random()-0.5)*500;
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
      scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0x446688,size:0.15})));
    }

    // Floating mathematical objects
    populateUniverse();

    window.addEventListener('resize',()=>{
      const W2=container.clientWidth||window.innerWidth,H2=container.clientHeight||window.innerHeight-50;
      camera.aspect=W2/H2;camera.updateProjectionMatrix();renderer.setSize(W2,H2);
    });
  }

  function populateUniverse(){
    const colors=[0x00c8ff,0xbf5af2,0xffd700,0x00ff9d,0xff3b30];

    function mat(c){
      return new THREE.MeshPhongMaterial({color:c,emissive:c,emissiveIntensity:0.1,
        wireframe:Math.random()>0.5,transparent:true,opacity:0.7,side:THREE.DoubleSide});
    }

    // Tori
    for(let i=0;i<30;i++){
      const geo=new THREE.TorusGeometry(0.5+Math.random()*1.5,0.1+Math.random()*0.4,16,60);
      const m=new THREE.Mesh(geo,mat(colors[i%5]));
      m.position.set((Math.random()-0.5)*150,(Math.random()-0.5)*80,(Math.random()-0.5)*150);
      m.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0);
      m.userData={rotX:Math.random()*0.005,rotY:Math.random()*0.01,type:'torus'};
      scene.add(m);
    }

    // Icosahedra
    for(let i=0;i<20;i++){
      const geo=new THREE.IcosahedronGeometry(0.5+Math.random()*1.5,1);
      const m=new THREE.Mesh(geo,mat(colors[(i+2)%5]));
      m.position.set((Math.random()-0.5)*150,(Math.random()-0.5)*80,(Math.random()-0.5)*150);
      m.userData={rotX:Math.random()*0.008,rotY:Math.random()*0.012};
      scene.add(m);
    }

    // Parametric surfaces
    for(let s=0;s<15;s++){
      const geo=buildKnotGeo(s);
      const m=new THREE.Mesh(geo,mat(colors[s%5]));
      m.position.set((Math.random()-0.5)*180,(Math.random()-0.5)*90,(Math.random()-0.5)*180);
      m.userData={rotY:Math.random()*0.006,rotX:Math.random()*0.004};
      scene.add(m);
    }

    // Floating text planes (colored squares as equation proxies)
    for(let i=0;i<50;i++){
      const geo=new THREE.PlaneGeometry(2,0.6);
      const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({
        color:colors[i%5],transparent:true,opacity:0.15,side:THREE.DoubleSide}));
      m.position.set((Math.random()-0.5)*200,(Math.random()-0.5)*100,(Math.random()-0.5)*200);
      m.userData={rotY:0.002};
      scene.add(m);
    }

    // Connection lines between nearby objects
    const positions=scene.children.filter(c=>c.type==='Mesh').map(c=>c.position);
    const linePts=[];
    for(let i=0;i<positions.length;i++){
      for(let j=i+1;j<positions.length;j++){
        const d=positions[i].distanceTo(positions[j]);
        if(d<15){
          linePts.push(positions[i].x,positions[i].y,positions[i].z,
                       positions[j].x,positions[j].y,positions[j].z);
        }
      }
    }
    if(linePts.length>0){
      const lgeo=new THREE.BufferGeometry();
      lgeo.setAttribute('position',new THREE.Float32BufferAttribute(linePts,3));
      scene.add(new THREE.LineSegments(lgeo,new THREE.LineBasicMaterial({color:0x112244,opacity:0.3,transparent:true})));
    }
  }

  function buildKnotGeo(seed){
    const curve=new Array(100).fill(0).map((_,i)=>{
      const t=(i/100)*Math.PI*2;
      const p=seed%3+2, q2=seed%4+2;
      return new THREE.Vector3(
        (2+Math.cos(q2*t))*Math.cos(p*t),
        (2+Math.cos(q2*t))*Math.sin(p*t),
        Math.sin(q2*t)
      );
    });
    const geo=new THREE.BufferGeometry();
    const pts=[];
    curve.forEach(p=>pts.push(p.x,p.y,p.z));
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    return geo;
  }

  // Camera movement
  const euler=new THREE.Euler(0,0,0,'YXZ');
  const velocity=new THREE.Vector3();
  const direction=new THREE.Vector3();

  function updateCamera(dt){
    if(!camera) return;
    // Mouse look
    euler.y-=mouseDX*0.8;
    euler.x=Math.max(-Math.PI/2,Math.min(Math.PI/2,euler.x-mouseDY*0.8));
    camera.rotation.copy(euler);
    mouseDX=0;mouseDY=0;

    // WASD movement
    const speed=keys['ShiftLeft']||keys['ShiftRight']?30:10;
    direction.set(0,0,0);
    if(keys['KeyW']||keys['ArrowUp']) direction.z-=1;
    if(keys['KeyS']||keys['ArrowDown']) direction.z+=1;
    if(keys['KeyA']||keys['ArrowLeft']) direction.x-=1;
    if(keys['KeyD']||keys['ArrowRight']) direction.x+=1;
    if(keys['Space']) direction.y+=1;
    if(keys['ControlLeft']) direction.y-=1;
    direction.normalize();
    velocity.copy(direction).multiplyScalar(speed*dt);
    camera.translateX(velocity.x);camera.translateY(velocity.y);camera.translateZ(velocity.z);
  }

  const clock=new THREE.Clock();
  function loop(){
    animFrame=requestAnimationFrame(loop);
    const dt=clock.getDelta();
    updateCamera(dt);
    // Rotate all objects
    scene.children.forEach(c=>{
      if(c.userData?.rotX) c.rotation.x+=c.userData.rotX;
      if(c.userData?.rotY) c.rotation.y+=c.userData.rotY;
    });
    renderer.render(scene,camera);
  }

  function startLoop(){if(!animFrame&&initialized)loop();}
  function stopLoop(){if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}}
})();
