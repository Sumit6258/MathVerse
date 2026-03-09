/* ═══════════════════════════════════════════
   surfaces.js — Three.js 3D Surfaces
   ═══════════════════════════════════════════ */

(function() {
  const container = document.getElementById('threeContainer');
  if(!container || !window.THREE) return;

  let scene, camera, renderer, mesh, animFrame;
  let rotSpeed = 0.005, currentSurf = 'torus', segments = 64;
  let isDragging = false, prevMouse = {x:0,y:0};
  let spherical = {theta:0.5, phi:1.0, r:3};

  const colorSchemes = {
    electric: [0x0066ff, 0x00c8ff, 0x00ffff],
    aurora:   [0x00ff9d, 0x00c8ff, 0xbf5af2],
    volcanic: [0xff3b30, 0xff9500, 0xffd700],
    chrome:   [0x888888, 0xcccccc, 0xffffff],
  };

  const surfaceInfo = {
    torus: 'x=(R+r·cos v)cos u, y=(R+r·cos v)sin u, z=r·sin v',
    mobius: 'Single-sided non-orientable surface with one edge.',
    klein: '4D closed non-orientable surface with no boundary.',
    saddle: 'z = x² − y² — minimal surface with zero mean curvature.',
    trefoil: 'A knot that cannot be untangled in 3D space.',
  };

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04040a);
    scene.fog = new THREE.FogExp2(0x04040a, 0.05);

    const W=container.clientWidth, H=container.clientHeight||500;
    camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 100);
    updateCamera();

    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x112244, 0.8);
    scene.add(ambient);

    const point1 = new THREE.PointLight(0x0066ff, 3, 20);
    point1.position.set(5, 5, 5);
    scene.add(point1);

    const point2 = new THREE.PointLight(0xbf5af2, 2, 15);
    point2.position.set(-4, -3, 3);
    scene.add(point2);

    const dir = new THREE.DirectionalLight(0xffd700, 0.5);
    dir.position.set(0, 10, 5);
    scene.add(dir);

    // Particle background
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(3000);
    for(let i=0;i<3000;i++) pPos[i]=(Math.random()-0.5)*30;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color:0x334466, size:0.04 });
    scene.add(new THREE.Points(pGeo, pMat));

    // Mouse drag
    container.addEventListener('mousedown', e => { isDragging=true; prevMouse={x:e.clientX,y:e.clientY}; });
    window.addEventListener('mousemove', e => {
      if(!isDragging) return;
      spherical.theta -= (e.clientX-prevMouse.x)*0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI-0.1, spherical.phi-(e.clientY-prevMouse.y)*0.008));
      prevMouse={x:e.clientX,y:e.clientY};
      updateCamera();
    });
    window.addEventListener('mouseup', ()=>isDragging=false);
    container.addEventListener('wheel', e => {
      spherical.r = Math.max(1.5, Math.min(8, spherical.r+e.deltaY*0.005));
      updateCamera();
    }, {passive:true});

    window.addEventListener('resize', () => {
      const W=container.clientWidth, H=container.clientHeight||500;
      camera.aspect=W/H; camera.updateProjectionMatrix();
      renderer.setSize(W,H);
    });

    buildSurface(currentSurf);
    animate();
  }

  function updateCamera() {
    camera.position.set(
      spherical.r*Math.sin(spherical.phi)*Math.cos(spherical.theta),
      spherical.r*Math.cos(spherical.phi),
      spherical.r*Math.sin(spherical.phi)*Math.sin(spherical.theta)
    );
    camera.lookAt(0,0,0);
  }

  function getMaterial(colorScheme, wireframe) {
    const colors = colorSchemes[colorScheme] || colorSchemes.electric;
    if(wireframe) {
      return new THREE.MeshBasicMaterial({color:colors[1], wireframe:true, opacity:0.6, transparent:true});
    }
    return new THREE.MeshPhongMaterial({
      color: colors[0],
      emissive: colors[2],
      emissiveIntensity: 0.08,
      specular: colors[1],
      shininess: 80,
      side: THREE.DoubleSide,
    });
  }

  function buildSurface(name) {
    if(mesh) { scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
    const cs = document.getElementById('surfColorScheme').value;
    const wf = document.getElementById('wireframeToggle').checked;
    const mat = getMaterial(cs, wf);
    let geo;

    switch(name) {
      case 'torus':
        geo = new THREE.TorusGeometry(1, 0.38, segments, segments*2);
        break;
      case 'mobius':
        geo = buildMobius(segments);
        break;
      case 'klein':
        geo = buildKlein(segments);
        break;
      case 'saddle':
        geo = buildSaddle(segments);
        break;
      case 'trefoil':
        geo = buildTrefoil(segments);
        break;
    }

    mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    document.getElementById('surfInfo').textContent = surfaceInfo[name] || '';
  }

  function buildMobius(N) {
    const geo = new THREE.BufferGeometry();
    const positions=[], normals=[], uvs=[];
    const uN=N*2, vN=Math.floor(N/2);
    for(let j=0;j<=vN;j++) {
      for(let i=0;i<=uN;i++) {
        const u=(i/uN)*Math.PI*2;
        const v=(j/vN)*2-1;
        const x=(1+v*0.5*Math.cos(u/2))*Math.cos(u);
        const y=(1+v*0.5*Math.cos(u/2))*Math.sin(u);
        const z=v*0.5*Math.sin(u/2);
        positions.push(x,y,z);
        normals.push(0,0,1);
        uvs.push(i/uN, j/vN);
      }
    }
    const indices=[];
    for(let j=0;j<vN;j++) {
      for(let i=0;i<uN;i++) {
        const a=j*(uN+1)+i, b=a+1, c=(j+1)*(uN+1)+i, d=c+1;
        indices.push(a,b,c, b,d,c);
      }
    }
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    geo.setIndex(indices); geo.computeVertexNormals();
    return geo;
  }

  function buildKlein(N) {
    const geo = new THREE.BufferGeometry();
    const positions=[], normals=[], uvs=[];
    const uN=N, vN=N;
    for(let j=0;j<=vN;j++) {
      for(let i=0;i<=uN;i++) {
        const u=(i/uN)*Math.PI*2, v=(j/vN)*Math.PI*2;
        let x,y,z;
        if(u<Math.PI) {
          x=-2/15*Math.cos(u)*(3*Math.cos(v)-30*Math.sin(u)+90*Math.pow(Math.cos(u),4)*Math.sin(u)-60*Math.pow(Math.cos(u),6)*Math.sin(u)+5*Math.cos(u)*Math.cos(v)*Math.sin(u));
          y=-1/15*Math.sin(u)*(3*Math.cos(v)-3*Math.pow(Math.cos(u),2)*Math.cos(v)-48*Math.pow(Math.cos(u),4)*Math.cos(v)+48*Math.pow(Math.cos(u),6)*Math.cos(v)-60*Math.sin(u)+5*Math.cos(u)*Math.cos(v)*Math.sin(u)-5*Math.pow(Math.cos(u),3)*Math.cos(v)*Math.sin(u)-80*Math.pow(Math.cos(u),5)*Math.cos(v)*Math.sin(u)+80*Math.pow(Math.cos(u),7)*Math.cos(v)*Math.sin(u));
          z=2/15*(3+5*Math.cos(u)*Math.sin(u))*Math.sin(v);
        } else {
          x=-2/15*Math.cos(u)*(3*Math.cos(v)-30*Math.sin(u)+90*Math.pow(Math.cos(u),4)*Math.sin(u)-60*Math.pow(Math.cos(u),6)*Math.sin(u)+5*Math.cos(u)*Math.cos(v)*Math.sin(u));
          y=-1/15*Math.sin(u)*(3*Math.cos(v)-3*Math.pow(Math.cos(u),2)*Math.cos(v)-48*Math.pow(Math.cos(u),4)*Math.cos(v)+48*Math.pow(Math.cos(u),6)*Math.cos(v)-60*Math.sin(u)+5*Math.cos(u)*Math.cos(v)*Math.sin(u)-5*Math.pow(Math.cos(u),3)*Math.cos(v)*Math.sin(u)-80*Math.pow(Math.cos(u),5)*Math.cos(v)*Math.sin(u)+80*Math.pow(Math.cos(u),7)*Math.cos(v)*Math.sin(u));
          z=2/15*(3+5*Math.cos(u)*Math.sin(u))*Math.sin(v);
        }
        positions.push(x*0.8,y*0.8,z*0.8);
        normals.push(0,1,0);
        uvs.push(i/uN,j/vN);
      }
    }
    const indices=[];
    for(let j=0;j<vN;j++) {
      for(let i=0;i<uN;i++) {
        const a=j*(uN+1)+i, b=a+1, c=(j+1)*(uN+1)+i, d=c+1;
        indices.push(a,b,c, b,d,c);
      }
    }
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    geo.setIndex(indices); geo.computeVertexNormals();
    return geo;
  }

  function buildSaddle(N) {
    const geo = new THREE.PlaneGeometry(4, 4, N, N);
    const pos = geo.attributes.position;
    for(let i=0;i<pos.count;i++) {
      const x=pos.getX(i), z=pos.getY(i);
      pos.setZ(i, (x*x - z*z)*0.4);
    }
    geo.computeVertexNormals();
    return geo;
  }

  function buildTrefoil(N) {
    const tube = [];
    const nT=N*4;
    for(let i=0;i<nT;i++) {
      const t=(i/nT)*Math.PI*2;
      const x=Math.sin(t)+2*Math.sin(2*t);
      const y=Math.cos(t)-2*Math.cos(2*t);
      const z=-Math.sin(3*t);
      tube.push(new THREE.Vector3(x*0.5,y*0.5,z*0.5));
    }
    const geo = new THREE.BufferGeometry();
    const positions=[], indices=[];
    const R=0.12, segs=12;
    tube.forEach((center,i)=>{
      const next=tube[(i+1)%tube.length];
      const tangent=next.clone().sub(center).normalize();
      const perp=new THREE.Vector3(0,1,0).cross(tangent).normalize();
      const perp2=tangent.clone().cross(perp).normalize();
      for(let s=0;s<segs;s++) {
        const a=(s/segs)*Math.PI*2;
        positions.push(
          center.x+R*(Math.cos(a)*perp.x+Math.sin(a)*perp2.x),
          center.y+R*(Math.cos(a)*perp.y+Math.sin(a)*perp2.y),
          center.z+R*(Math.cos(a)*perp.z+Math.sin(a)*perp2.z)
        );
      }
    });
    for(let i=0;i<nT;i++) {
      for(let s=0;s<segs;s++) {
        const a=i*segs+s, b=i*segs+(s+1)%segs;
        const c=((i+1)%nT)*segs+s, d=((i+1)%nT)*segs+(s+1)%segs;
        indices.push(a,b,c, b,d,c);
      }
    }
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setIndex(indices); geo.computeVertexNormals();
    return geo;
  }

  function animate() {
    animFrame = requestAnimationFrame(animate);
    if(mesh && !isDragging) {
      mesh.rotation.y += rotSpeed;
      mesh.rotation.x += rotSpeed*0.3;
    }
    renderer.render(scene, camera);
  }

  // ── Controls ──────────────────────────────
  document.querySelectorAll('.stab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentSurf = btn.dataset.surf;
      buildSurface(currentSurf);
    });
  });

  document.getElementById('wireframeToggle').addEventListener('change', () => buildSurface(currentSurf));
  document.getElementById('surfColorScheme').addEventListener('change', () => buildSurface(currentSurf));

  document.getElementById('rotSpeed').addEventListener('input', e => {
    rotSpeed = parseFloat(e.target.value)*0.01;
    document.getElementById('rotSpeedVal').textContent = parseFloat(e.target.value).toFixed(1);
  });

  document.getElementById('segSlider').addEventListener('input', e => {
    segments = parseInt(e.target.value);
    document.getElementById('segVal').textContent = segments;
    buildSurface(currentSurf);
  });

  // Init on scroll
  const obs = new IntersectionObserver(entries => {
    if(entries[0].isIntersecting) { init(); obs.disconnect(); }
  }, { threshold: 0.2 });
  obs.observe(document.getElementById('surfaces'));
})();
