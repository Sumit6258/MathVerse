/* ═══════════════════════════════════════════════
   ART 03 — Topological Morphing Sculpture
   Three.js parametric morphing with custom glow shader
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('topoSculpture'); if(!sec) return;
  const container=document.getElementById('topoContainer'); if(!container) return;
  let scene,camera,renderer,mesh,raf=null,t=0;
  let morphSpeed=0.5,glowIntensity=1.0,wireframe=false,targetShape='auto';
  const shapes=['sphere','torus','trefoil','figure8','klein','mobius'];
  let shapeIdx=0,nextIdx=1,morphT=0;

  const N=80;

  function getPos(shape,u,v){
    const U=u*Math.PI*2, V=v*Math.PI*2;
    if(shape==='sphere'){
      const th=v*Math.PI,ph=U;
      return[1.5*Math.sin(th)*Math.cos(ph),1.5*Math.cos(th),1.5*Math.sin(th)*Math.sin(ph)];
    }
    if(shape==='torus'){
      const R=1.2,r=0.45;
      return[(R+r*Math.cos(V))*Math.cos(U),(R+r*Math.cos(V))*Math.sin(U),r*Math.sin(V)];
    }
    if(shape==='trefoil'){
      const t2=U;
      return[Math.sin(t2)+2*Math.sin(2*t2),Math.cos(t2)-2*Math.cos(2*t2),-Math.sin(3*t2)+0.4*Math.sin(V+t2)];
    }
    if(shape==='figure8'){
      const t2=U,s=V;
      const x=(2+Math.cos(t2/2)*Math.sin(s)-Math.sin(t2/2)*Math.sin(2*s))*Math.cos(t2);
      const y=(2+Math.cos(t2/2)*Math.sin(s)-Math.sin(t2/2)*Math.sin(2*s))*Math.sin(t2);
      const z=Math.sin(t2/2)*Math.sin(s)+Math.cos(t2/2)*Math.sin(2*s);
      return[x*.5,y*.5,z*.5];
    }
    if(shape==='klein'){
      const u2=U,v2=V;
      const x=u2<Math.PI?(2.5-Math.cos(v2))/(1+Math.sin(u2)*Math.sin(u2))*Math.cos(u2):(2.5-Math.cos(v2))/(1+Math.sin(u2-Math.PI)*Math.sin(u2-Math.PI))*Math.cos(u2);
      const y=(2.5-Math.cos(v2))/(1)*Math.sin(u2)*0.5;
      const z=Math.sin(v2)*0.8;
      return[x*.6,y*.6,z*.6];
    }
    if(shape==='mobius'){
      const t2=(u-0.5)*Math.PI*2, s=v-0.5;
      const x=(1+s*0.4*Math.cos(t2/2))*Math.cos(t2);
      const y=(1+s*0.4*Math.cos(t2/2))*Math.sin(t2);
      const z=s*0.4*Math.sin(t2/2);
      return[x,y,z];
    }
    return[0,0,0];
  }

  function buildGeo(shA,shB,mt){
    const verts=[], cols=[];
    const idxs=[];
    for(let i=0;i<=N;i++){
      for(let j=0;j<=N;j++){
        const u=i/N, v=j/N;
        const pA=getPos(shA,u,v), pB=getPos(shB,u,v);
        const x=pA[0]*(1-mt)+pB[0]*mt;
        const y=pA[1]*(1-mt)+pB[1]*mt;
        const z=pA[2]*(1-mt)+pB[2]*mt;
        verts.push(x,y,z);
        const hue=(u+v+mt*0.3)%1;
        const c=new THREE.Color().setHSL(hue,0.9,0.55);
        cols.push(c.r,c.g,c.b);
      }
    }
    for(let i=0;i<N;i++) for(let j=0;j<N;j++){
      const a=i*(N+1)+j, b=a+1, c=a+(N+1), d=c+1;
      idxs.push(a,b,c,b,d,c);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(verts),3));
    geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(cols),3));
    geo.setIndex(idxs); geo.computeVertexNormals();
    return geo;
  }

  function rebuild(){
    if(mesh){scene.remove(mesh);mesh.geometry?.dispose();}
    const geo=buildGeo(shapes[shapeIdx],shapes[nextIdx],morphT);
    const mat=new THREE.MeshStandardMaterial({
      vertexColors:true,side:THREE.DoubleSide,
      metalness:0.6,roughness:0.15,
      wireframe,emissiveIntensity:glowIntensity*0.3,
      emissive:new THREE.Color(0x2233ff)
    });
    mesh=new THREE.Mesh(geo,mat); scene.add(mesh);
  }

  function init(){
    scene=new THREE.Scene(); scene.background=new THREE.Color(0x020205);
    scene.fog=new THREE.FogExp2(0x020205,0.07);
    const W=container.clientWidth||800,H=container.clientHeight||540;
    camera=new THREE.PerspectiveCamera(50,W/H,0.1,50);
    camera.position.set(0,0,5);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.3;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x223355,2));
    const dl=new THREE.DirectionalLight(0x88ccff,3); dl.position.set(3,5,2); scene.add(dl);
    const dl2=new THREE.DirectionalLight(0xff44aa,2); dl2.position.set(-3,-2,1); scene.add(dl2);
    const pt=new THREE.PointLight(0xffd700,3,10); pt.position.set(0,3,1); scene.add(pt);

    // Starfield
    const sg=new THREE.BufferGeometry();
    const sv=new Float32Array(3000); for(let i=0;i<3000;i++)sv[i]=(Math.random()-0.5)*40;
    sg.setAttribute('position',new THREE.BufferAttribute(sv,3));
    scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0x334466,size:0.04})));

    rebuild();

    let drag=false,ox=0,oy=0,theta=0,phi=0.4;
    renderer.domElement.addEventListener('mousedown',e=>{drag=true;ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mousemove',e=>{if(!drag)return;theta+=(e.clientX-ox)*.01;phi+=(e.clientY-oy)*.01;phi=Math.max(0.1,Math.min(Math.PI-0.1,phi));ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mouseup',()=>drag=false);
    renderer.domElement.addEventListener('wheel',e=>{camera.position.multiplyScalar(1+e.deltaY*0.001);e.preventDefault();},{passive:false});

    function loop(){
      raf=requestAnimationFrame(loop); t+=0.016;
      theta+=0.005;
      if(targetShape==='auto'){
        morphT+=morphSpeed*0.008;
        if(morphT>=1){morphT=0;shapeIdx=nextIdx;nextIdx=(nextIdx+1)%shapes.length;}
        rebuild();
      }
      if(mesh) mesh.rotation.y=theta;
      if(mesh) mesh.rotation.x=Math.sin(t*0.1)*0.2;
      const r=camera.position.length();
      camera.position.set(r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
    }
    loop();
  }

  document.getElementById('topoShape')?.addEventListener('change',e=>{
    targetShape=e.target.value;
    if(targetShape!=='auto'){
      shapeIdx=shapes.indexOf(targetShape); if(shapeIdx<0)shapeIdx=0;
      nextIdx=shapeIdx; morphT=0;
      if(mesh){const geo=buildGeo(shapes[shapeIdx],shapes[shapeIdx],0);mesh.geometry.dispose();mesh.geometry=geo;}
    }
  });
  document.getElementById('topoSpeed')?.addEventListener('input',e=>{morphSpeed=parseFloat(e.target.value);document.getElementById('topoSpeedVal').textContent=e.target.value;});
  document.getElementById('topoGlow')?.addEventListener('input',e=>{glowIntensity=parseFloat(e.target.value);document.getElementById('topoGlowVal').textContent=e.target.value;if(mesh)mesh.material.emissiveIntensity=glowIntensity*0.3;});
  document.getElementById('topoWire')?.addEventListener('change',e=>{wireframe=e.target.checked;if(mesh)mesh.material.wireframe=wireframe;});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!scene)init();},{threshold:0.1}).observe(sec);
})();
