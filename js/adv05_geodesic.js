/* ═══════════════════════════════════════════
   ADV 05 — Geodesic Flow on Surfaces
   Numerical integration of geodesic equation
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('geodesic'); if(!section)return;
  const container=document.getElementById('geodesicContainer'); if(!container)return;
  let scene,camera,renderer,raf=null;
  let surfType='sphere',geoCount=16,trailLen=200,speed=1.0;
  let geodesics=[],surfMesh,t=0;

  // Surface definitions: position(u,v)→[x,y,z]
  const surfaces={
    sphere:{
      pos:(u,v)=>{const ph=u*Math.PI*2,th=v*Math.PI;return[1.8*Math.sin(th)*Math.cos(ph),1.8*Math.cos(th),1.8*Math.sin(th)*Math.sin(ph)];},
      // Geodesic ODE: use numerical shooting on sphere
      initGeo:(i,n)=>{
        const ang=(i/n)*Math.PI*2;
        const lat=0.3+0.5*Math.sin(i/n*Math.PI*3);
        return {u:ang,v:lat,du:Math.cos(ang+0.5)*0.04,dv:Math.sin(ang)*0.04};
      },
      step:(g,dt)=>{
        // Sphere geodesic: d²θ/dt²+sin(θ)cos(θ)(dφ/dt)²=0, dφ conserved
        const {u,v,du,dv}=g;
        const ddv=-Math.sin(v)*Math.cos(v)*du*du;
        g.u+=du*dt; g.v+=dv*dt; g.dv+=ddv*dt;
        // Normalize to surface
        g.u=(g.u%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
        g.v=Math.max(0.01,Math.min(Math.PI-0.01,g.v));
        const p=surfaces.sphere.pos(g.u/(Math.PI*2),g.v/Math.PI);
        return new THREE.Vector3(...p);
      }
    },
    torus:{
      pos:(u,v)=>{const ph=u*Math.PI*2,th=v*Math.PI*2;const R=1.5,r=0.6;return[(R+r*Math.cos(th))*Math.cos(ph),(R+r*Math.cos(th))*Math.sin(ph),r*Math.sin(th)];},
      initGeo:(i,n)=>({u:(i/n)*Math.PI*2,v:(i/n)*Math.PI*1.3,du:0.03+0.01*Math.sin(i),dv:0.02+0.01*Math.cos(i)}),
      step:(g,dt)=>{
        const R=1.5,r=0.6;
        const {u,v,du,dv}=g;
        const ddu=-(2*r*Math.sin(v)/(R+r*Math.cos(v)))*du*dv;
        const ddv=(r*Math.sin(v)/(R+r*Math.cos(v)))*du*du;
        g.u+=du*dt; g.v+=dv*dt; g.du+=ddu*dt; g.dv+=ddv*dt;
        g.u=(g.u%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
        g.v=(g.v%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
        const p=surfaces.torus.pos(g.u/(Math.PI*2),g.v/(Math.PI*2));
        return new THREE.Vector3(...p);
      }
    },
    saddle:{
      pos:(u,v)=>{const x=(u-0.5)*4,z=(v-0.5)*4;return[x,x*x-z*z,z];},
      initGeo:(i,n)=>({u:0.3+Math.cos(i/n*Math.PI*2)*0.2,v:0.3+Math.sin(i/n*Math.PI*2)*0.2,du:Math.cos(i/n*Math.PI*2)*0.02,dv:Math.sin(i/n*Math.PI*2)*0.02}),
      step:(g,dt)=>{
        // Geodesic on z=x²-y²: use numerical gradient descent on constraint
        const {u,v,du,dv}=g;
        const x=(u-0.5)*4,z=(v-0.5)*4;
        const fx=2*x,fz=-2*z;
        const n2=1+fx*fx+fz*fz;
        const ddu=-(fx*fx*du*du+2*fx*fz*du*dv+fz*fz*dv*dv)*fx/n2;
        const ddv=-(fx*fx*du*du+2*fx*fz*du*dv+fz*fz*dv*dv)*fz/n2;
        g.u+=du*dt; g.v+=dv*dt; g.du+=ddu*dt*4; g.dv+=ddv*dt*4;
        g.u=Math.max(0.05,Math.min(0.95,g.u));
        g.v=Math.max(0.05,Math.min(0.95,g.v));
        const p=surfaces.saddle.pos(g.u,g.v);
        return new THREE.Vector3(...p);
      }
    }
  };

  function buildSurface(){
    if(surfMesh){scene.remove(surfMesh);surfMesh.geometry?.dispose();}
    const surf=surfaces[surfType];
    const N=60;
    const geo=new THREE.BufferGeometry();
    const verts=[],uvs=[],indices=[];
    for(let i=0;i<=N;i++) for(let j=0;j<=N;j++){
      const p=surf.pos(i/N,j/N);
      verts.push(...p); uvs.push(i/N,j/N);
    }
    for(let i=0;i<N;i++) for(let j=0;j<N;j++){
      const a=i*(N+1)+j,b=a+1,c=a+(N+1),d=c+1;
      indices.push(a,b,c,b,d,c);
    }
    geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(verts),3));
    geo.setIndex(indices); geo.computeVertexNormals();
    surfMesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({
      color:0x112233,metalness:0.4,roughness:0.6,side:THREE.DoubleSide,
      transparent:true,opacity:0.6,wireframe:false
    }));
    scene.add(surfMesh);
    const wm=new THREE.Mesh(geo.clone(),new THREE.MeshBasicMaterial({color:0x003355,wireframe:true,opacity:0.2,transparent:true}));
    scene.add(wm);
  }

  function buildGeodesics(){
    geodesics.forEach(g=>{g.lines.forEach(l=>{scene.remove(l);l.geometry?.dispose();});});
    geodesics=[];
    const surf=surfaces[surfType];
    const colors=['#00c8ff','#bf5af2','#ffd700','#00ff9d','#ff6b6b','#ff9f43','#54a0ff','#5f27cd'];
    for(let i=0;i<geoCount;i++){
      const state=surf.initGeo(i,geoCount);
      const color=new THREE.Color(colors[i%colors.length]);
      const pts=[];
      const lines=[];
      geodesics.push({state,pts,lines,color,i,active:true});
    }
  }

  function updateGeodesics(){
    const surf=surfaces[surfType];
    const dt=0.5*speed;
    geodesics.forEach(g=>{
      if(!g.active)return;
      for(let s=0;s<3;s++){
        const pt=surf.step(g.state,dt*0.01);
        if(!pt||!isFinite(pt.x)){g.active=false;return;}
        g.pts.push(pt.clone());
        if(g.pts.length>trailLen) g.pts.shift();
      }
      // Rebuild line each frame
      g.lines.forEach(l=>{scene.remove(l);l.geometry?.dispose();});
      g.lines=[];
      if(g.pts.length>1){
        const geo=new THREE.BufferGeometry().setFromPoints(g.pts);
        const mat=new THREE.LineBasicMaterial({color:g.color,linewidth:2});
        const line=new THREE.Line(geo,mat);
        scene.add(line); g.lines=[line];
        // Dot at head
        const dotGeo=new THREE.SphereGeometry(0.035,8,8);
        const dotMat=new THREE.MeshBasicMaterial({color:g.color});
        const dot=new THREE.Mesh(dotGeo,dotMat);
        dot.position.copy(g.pts[g.pts.length-1]);
        scene.add(dot); g.lines.push(dot);
      }
    });
  }

  function init(){
    scene=new THREE.Scene(); scene.background=new THREE.Color(0x030307);
    const W=container.clientWidth||700,H=container.clientHeight||500;
    camera=new THREE.PerspectiveCamera(50,W/H,0.1,100);
    camera.position.set(0,2.5,5);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x334466,2));
    const dl=new THREE.DirectionalLight(0x88aaff,2); dl.position.set(3,5,2); scene.add(dl);
    buildSurface(); buildGeodesics();
    let drag=false,ox=0,oy=0,theta=0.3,phi=0.4;
    renderer.domElement.addEventListener('mousedown',e=>{drag=true;ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mousemove',e=>{if(!drag)return;theta+=(e.clientX-ox)*.01;phi+=(e.clientY-oy)*.01;phi=Math.max(0.05,Math.min(Math.PI-0.05,phi));ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mouseup',()=>drag=false);
    function loop(){
      raf=requestAnimationFrame(loop); theta+=0.003;
      updateGeodesics();
      const r=5;
      camera.position.set(r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
    }
    loop();
  }

  document.getElementById('geodesicSurf')?.addEventListener('change',e=>{surfType=e.target.value;if(scene){buildSurface();buildGeodesics();}});
  document.getElementById('geoCount')?.addEventListener('input',e=>{geoCount=parseInt(e.target.value);document.getElementById('geoCountVal').textContent=e.target.value;if(scene)buildGeodesics();});
  document.getElementById('geoLen')?.addEventListener('input',e=>{trailLen=parseInt(e.target.value);document.getElementById('geoLenVal').textContent=e.target.value;});
  document.getElementById('geoSpeed')?.addEventListener('input',e=>{speed=parseFloat(e.target.value);document.getElementById('geoSpeedVal').textContent=e.target.value;});
  document.getElementById('geoReset')?.addEventListener('click',()=>{if(scene)buildGeodesics();});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!scene)init();},{threshold:0.1}).observe(section);
})();
