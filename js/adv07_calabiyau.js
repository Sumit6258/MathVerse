/* ═══════════════════════════════════════════
   ADV 07 — Calabi-Yau Manifold Projection
   Parametric 2D slice of CY complex manifold
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('calabiyau'); if(!section)return;
  const container=document.getElementById('cyContainer'); if(!container)return;
  let scene,camera,renderer,raf=null;
  let n=3,morphSpeed=0.5,colorFlow=1,resN=50;
  let cyGroup,t=0;

  // Calabi-Yau parametric equations
  // z1^n + z2^n = 1, z1,z2 in C
  // parametrize: z1=e^(2πik1/n)·cos^(2/n)(2πα), z2=e^(2πik2/n)·sin^(2/n)(2πα)
  // project (Re(z1),Im(z1),Re(z2),Im(z2)) → R³ via linear projection
  function cyPoint(alpha, beta, k1, k2, N, morphT){
    const a=alpha*Math.PI*0.5;
    const b=beta*Math.PI*2;
    const phase1=(2*Math.PI*k1/N)+morphT*0.3;
    const phase2=(2*Math.PI*k2/N)+morphT*0.2;
    // Complex z1 = e^(i*phase1) * cos^(2/n)(a)
    const r1=Math.pow(Math.max(0,Math.cos(a)),2/N);
    const r2=Math.pow(Math.max(0,Math.sin(a)),2/N);
    const z1r=r1*Math.cos(phase1+b*0.5);
    const z1i=r1*Math.sin(phase1+b*0.5);
    const z2r=r2*Math.cos(phase2+b*0.3);
    const z2i=r2*Math.sin(phase2+b*0.3);
    // 3D projection: mix 4 coordinates
    const x=(z1r+z2r)*0.7;
    const y=(z1i+z2i)*0.7;
    const z=(z1r*z2i-z1i*z2r)*1.4;
    return new THREE.Vector3(x,y,z);
  }

  function buildCY(){
    if(cyGroup){scene.remove(cyGroup);cyGroup.traverse(c=>{c.geometry?.dispose();c.material?.dispose();});}
    cyGroup=new THREE.Group();
    const NRes=resN;
    const k1max=Math.min(n,4),k2max=Math.min(n,4);

    for(let k1=0;k1<k1max;k1++){
      for(let k2=0;k2<k2max;k2++){
        const verts=[], cols=[], idxs=[];
        const hue=(k1*k2max+k2)/(k1max*k2max);
        for(let i=0;i<=NRes;i++){
          for(let j=0;j<=NRes;j++){
            const alpha=i/NRes, beta=j/NRes;
            const p=cyPoint(alpha,beta,k1,k2,n,t*morphSpeed);
            verts.push(p.x,p.y,p.z);
            const h=(hue+alpha*0.3+t*colorFlow*0.01)%1;
            const c=new THREE.Color().setHSL(h,0.9,0.55);
            cols.push(c.r,c.g,c.b);
          }
        }
        for(let i=0;i<NRes;i++) for(let j=0;j<NRes;j++){
          const a=i*(NRes+1)+j,b=a+1,c=a+(NRes+1),d=c+1;
          idxs.push(a,b,c,b,d,c);
        }
        const geo=new THREE.BufferGeometry();
        geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(verts),3));
        geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(cols),3));
        geo.setIndex(idxs); geo.computeVertexNormals();
        const mat=new THREE.MeshStandardMaterial({
          vertexColors:true, side:THREE.DoubleSide,
          metalness:0.6, roughness:0.2,
          transparent:true, opacity:0.7
        });
        cyGroup.add(new THREE.Mesh(geo,mat));
      }
    }
    scene.add(cyGroup);
  }

  function init(){
    scene=new THREE.Scene(); scene.background=new THREE.Color(0x020205);
    scene.fog=new THREE.FogExp2(0x020205,0.08);
    const W=container.clientWidth||700,H=container.clientHeight||500;
    camera=new THREE.PerspectiveCamera(50,W/H,0.1,50);
    camera.position.set(0,0,5);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.2;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x223355,3));
    const d=new THREE.DirectionalLight(0x6688ff,2); d.position.set(2,4,3); scene.add(d);
    const d2=new THREE.DirectionalLight(0xff44aa,1.5); d2.position.set(-3,-2,1); scene.add(d2);
    const pt=new THREE.PointLight(0x00ffaa,2,8); pt.position.set(1,1,2); scene.add(pt);

    // Particle background
    const pg=new THREE.BufferGeometry();
    const pv=new Float32Array(2400); for(let i=0;i<2400;i++)pv[i]=(Math.random()-0.5)*20;
    pg.setAttribute('position',new THREE.BufferAttribute(pv,3));
    scene.add(new THREE.Points(pg,new THREE.PointsMaterial({color:0x334466,size:0.03})));

    buildCY();

    let drag=false,ox=0,oy=0,theta=0,phi=0.4;
    renderer.domElement.addEventListener('mousedown',e=>{drag=true;ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mousemove',e=>{if(!drag)return;theta+=(e.clientX-ox)*0.01;phi+=(e.clientY-oy)*0.01;phi=Math.max(0.1,Math.min(Math.PI-0.1,phi));ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mouseup',()=>drag=false);
    renderer.domElement.addEventListener('wheel',e=>{camera.position.multiplyScalar(1+e.deltaY*0.001);e.preventDefault();},{passive:false});

    let rebuildTimer=0;
    function loop(){
      raf=requestAnimationFrame(loop); t+=0.016; theta+=0.004;
      rebuildTimer++;
      // Rebuild every 90 frames for morphing effect
      if(rebuildTimer%90===0) buildCY();
      if(cyGroup) cyGroup.rotation.y=theta;
      if(cyGroup) cyGroup.rotation.x=Math.sin(t*0.1)*0.3;
      renderer.render(scene,camera);
    }
    loop();
  }

  document.getElementById('cyN')?.addEventListener('input',e=>{n=parseInt(e.target.value);document.getElementById('cyNVal').textContent=e.target.value;if(cyGroup)buildCY();});
  document.getElementById('cyMorph')?.addEventListener('input',e=>{morphSpeed=parseFloat(e.target.value);document.getElementById('cyMorphVal').textContent=e.target.value;});
  document.getElementById('cyColor')?.addEventListener('input',e=>{colorFlow=parseFloat(e.target.value);document.getElementById('cyColorVal').textContent=e.target.value;});
  document.getElementById('cyRes')?.addEventListener('input',e=>{resN=parseInt(e.target.value);document.getElementById('cyResVal').textContent=e.target.value;if(cyGroup)buildCY();});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!scene)init();},{threshold:0.1}).observe(section);
})();
