/* ═══════════════════════════════════════════
   ADV 04 — Hopf Fibration (Three.js)
   Fiber bundle S¹→S³→S²
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('hopf'); if(!section)return;
  const container=document.getElementById('hopfContainer'); if(!container)return;
  let scene,camera,renderer,raf=null;
  let fiberCount=32,latDeg=0,torusR=1.5,speed=0.5,showBase=true;
  let fibersGroup,baseGroup,t=0;

  function hopfFiber(theta, phi, torusRadius){
    // Map point on S² via stereographic to S³ fiber
    // (theta,phi) = spherical coords on S²
    const points=[];
    const N=80;
    for(let k=0;k<N;k++){
      const psi=(k/N)*Math.PI*2;
      // Hopf map: z1=cos(θ/2)e^{i(ψ+φ)/2}, z2=sin(θ/2)e^{i(ψ-φ)/2}
      const halfTheta=theta/2, halfPhi=phi/2;
      const a1=psi/2+halfPhi, a2=psi/2-halfPhi;
      const z1r=Math.cos(halfTheta)*Math.cos(a1), z1i=Math.cos(halfTheta)*Math.sin(a1);
      const z2r=Math.sin(halfTheta)*Math.cos(a2), z2i=Math.sin(halfTheta)*Math.sin(a2);
      // Stereographic projection from S³ to R³ via (z1,z2)→(w/denom)
      const denom=1-z2i;
      if(Math.abs(denom)<0.01){points.push(new THREE.Vector3(0,0,0));continue;}
      const x=z2r/denom*torusRadius;
      const y=z1r/denom*torusRadius;
      const z=z1i/denom*torusRadius;
      points.push(new THREE.Vector3(x,y,z));
    }
    points.push(points[0].clone()); // close
    return points;
  }

  function buildFibers(){
    if(fibersGroup){scene.remove(fibersGroup);fibersGroup.children.forEach(c=>{c.geometry?.dispose();c.material?.dispose();});}
    if(baseGroup){scene.remove(baseGroup);}
    fibersGroup=new THREE.Group();
    baseGroup=new THREE.Group();

    const latRad=(latDeg*Math.PI/180);
    for(let k=0;k<fiberCount;k++){
      const phi=(k/fiberCount)*Math.PI*2;
      const theta=Math.PI/2+latRad;
      const pts=hopfFiber(theta,phi,torusR);
      const curve=new THREE.CatmullRomCurve3(pts);
      const geo=new THREE.TubeGeometry(curve,80,0.018,6,true);
      const hue=k/fiberCount;
      const col=new THREE.Color().setHSL(hue,0.95,0.6);
      const mat=new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:0.3,metalness:0.5,roughness:0.2});
      fibersGroup.add(new THREE.Mesh(geo,mat));
    }
    scene.add(fibersGroup);

    // Base S² sphere
    if(showBase){
      const sGeo=new THREE.SphereGeometry(0.7,32,32);
      const sMat=new THREE.MeshStandardMaterial({color:0x112244,wireframe:true,opacity:0.3,transparent:true});
      baseGroup.add(new THREE.Mesh(sGeo,sMat));
      // Point on S² base
      const pGeo=new THREE.SphereGeometry(0.06,16,16);
      const pMat=new THREE.MeshStandardMaterial({color:0xffd700,emissive:0xffd700,emissiveIntensity:1});
      const lat=latRad; const phi0=0;
      const px=0.7*Math.sin(Math.PI/2+lat)*Math.cos(phi0);
      const py=0.7*Math.cos(Math.PI/2+lat);
      const pz=0.7*Math.sin(Math.PI/2+lat)*Math.sin(phi0);
      const pMesh=new THREE.Mesh(pGeo,pMat);
      pMesh.position.set(px,py,pz);
      baseGroup.add(pMesh);
      baseGroup.position.set(2.5,0,0);
      scene.add(baseGroup);
    }
  }

  function init(){
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x030307);
    const W=container.clientWidth||700,H=container.clientHeight||500;
    camera=new THREE.PerspectiveCamera(50,W/H,0.01,100);
    camera.position.set(0,2,5);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x334466,2));
    const d=new THREE.DirectionalLight(0xffffff,2); d.position.set(5,5,5); scene.add(d);
    const d2=new THREE.DirectionalLight(0x0044ff,1); d2.position.set(-5,-3,1); scene.add(d2);

    // Star field
    const sg=new THREE.BufferGeometry();
    const sv=new Float32Array(1200);for(let i=0;i<1200;i++)sv[i]=(Math.random()-0.5)*40;
    sg.setAttribute('position',new THREE.BufferAttribute(sv,3));
    scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0x334455,size:0.04})));

    buildFibers();

    let drag=false,ox=0,oy=0,theta=0,phi=0.4;
    renderer.domElement.addEventListener('mousedown',e=>{drag=true;ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mousemove',e=>{
      if(!drag)return;
      theta+=(e.clientX-ox)*.01; phi+=(e.clientY-oy)*.01;
      phi=Math.max(0.1,Math.min(Math.PI-0.1,phi));
      ox=e.clientX; oy=e.clientY;
    });
    renderer.domElement.addEventListener('mouseup',()=>drag=false);

    function loop(){
      raf=requestAnimationFrame(loop);
      t+=0.01*speed;
      theta+=speed*0.004;
      if(fibersGroup) fibersGroup.rotation.y=t;
      const r=5;
      camera.position.set(r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
    }
    loop();
  }

  document.getElementById('hopfCount')?.addEventListener('input',e=>{fiberCount=parseInt(e.target.value);document.getElementById('hopfCountVal').textContent=e.target.value;buildFibers();});
  document.getElementById('hopfLat')?.addEventListener('input',e=>{latDeg=parseFloat(e.target.value);document.getElementById('hopfLatVal').textContent=e.target.value;buildFibers();});
  document.getElementById('hopfR')?.addEventListener('input',e=>{torusR=parseFloat(e.target.value);document.getElementById('hopfRVal').textContent=e.target.value;buildFibers();});
  document.getElementById('hopfSpeed')?.addEventListener('input',e=>{speed=parseFloat(e.target.value);document.getElementById('hopfSpeedVal').textContent=e.target.value;});
  document.getElementById('hopfBase')?.addEventListener('change',e=>{showBase=e.target.checked;buildFibers();});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!scene)init();},{threshold:0.1}).observe(section);
})();
