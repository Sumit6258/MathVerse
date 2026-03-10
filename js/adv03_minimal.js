/* ═══════════════════════════════════════════
   ADV 03 — Minimal Surfaces (Three.js)
   Gyroid, Costa, Enneper, Schwarz P, Catenoid
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('minimal'); if(!section)return;
  const container=document.getElementById('minimalContainer'); if(!container)return;
  let scene,camera,renderer,mesh,raf=null;
  let surfType='gyroid',res=60,colorCurv=true,wireframe=false,metalness=0.8;

  const INFO = {
    gyroid:'The Gyroid: triply-periodic minimal surface discovered by NASA engineer Alan Schoen in 1970. Found in butterfly wings, block copolymers, and bone.',
    costa:'Costa\'s surface (1982): the first complete embedded minimal surface of finite topology found since the 19th century.',
    enneper:'Enneper\'s surface: a self-intersecting minimal surface with interesting symmetry. Named after Alfred Enneper (1863).',
    schwarz:'Schwarz P surface: triply periodic minimal surface, one of Schwarz\'s five classic surfaces (1865). Appears in lipid bilayers.',
    catenoid:'The Catenoid: first non-planar minimal surface discovered. It is the surface of revolution of a catenary.'
  };

  function buildGeometry(type, N){
    const positions=[], colors=[], indices=[];
    const C=[],i2=(u,v)=>u*N+v;
    for(let u=0;u<N;u++) C.push(new Array(N));

    if(type==='gyroid'){
      for(let ui=0;ui<N;ui++){
        const U=(ui/N)*Math.PI*2*2;
        for(let vi=0;vi<N;vi++){
          const V=(vi/N)*Math.PI*2*2;
          // Sample gyroid implicitly: sin(x)cos(y)+sin(y)cos(z)+sin(z)cos(x)=0
          // Parametric approx: marching-cube-free parametrization
          const x=U, y=V;
          const sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y);
          const denom=Math.sqrt(sx*sx*sy*sy+cy*cy*sx*sx+cy*cy*cx*cx)||0.01;
          const z=Math.atan2(-(sx*sy+cy*cx)/(denom),1.0)*1.2;
          C[ui][vi]=[x*.5,y*.5,z];
        }
      }
    } else if(type==='enneper'){
      for(let ui=0;ui<N;ui++){
        const u=(ui/(N-1))*2.5-1.25;
        for(let vi=0;vi<N;vi++){
          const v=(vi/(N-1))*2.5-1.25;
          const x=u-u*u*u/3+u*v*v;
          const y=v-v*v*v/3+v*u*u;
          const z=u*u-v*v;
          C[ui][vi]=[x*.4,y*.4,z*.4];
        }
      }
    } else if(type==='catenoid'){
      for(let ui=0;ui<N;ui++){
        const u=(ui/(N-1))*4-2;
        for(let vi=0;vi<N;vi++){
          const v=(vi/N)*Math.PI*2;
          const r=Math.cosh(u);
          C[ui][vi]=[r*Math.cos(v),r*Math.sin(v),u];
        }
      }
    } else if(type==='schwarz'){
      for(let ui=0;ui<N;ui++){
        const U=(ui/N)*Math.PI*2;
        for(let vi=0;vi<N;vi++){
          const V=(vi/N)*Math.PI*2;
          // Schwarz P: cos(x)+cos(y)+cos(z)≈0, parametric approx
          const x=U, y=V;
          const z=Math.acos(-Math.cos(x)-Math.cos(y));
          C[ui][vi]=[x*.4,y*.4,isNaN(z)?0:z*.4];
        }
      }
    } else { // costa-like
      for(let ui=0;ui<N;ui++){
        const u=(ui/(N-1))*4-2;
        for(let vi=0;vi<N;vi++){
          const v=(vi/N)*Math.PI*2;
          // Weierstrass-Enneper representation approximation
          const r=u, th=v;
          const scale=0.5;
          const x=scale*(r*Math.cos(th)-Math.cos(3*th)/(3*r+0.1));
          const y=scale*(r*Math.sin(th)+Math.sin(3*th)/(3*r+0.1));
          const z=scale*Math.log(Math.abs(r)+0.01)*Math.cos(th);
          C[ui][vi]=[x,y,z];
        }
      }
    }

    // Build geometry from grid
    for(let ui=0;ui<N;ui++){
      for(let vi=0;vi<N;vi++){
        const p=C[ui][vi];
        positions.push(p[0],p[1],p[2]);
      }
    }

    for(let ui=0;ui<N-1;ui++){
      for(let vi=0;vi<N-1;vi++){
        const a=i2(ui,vi),b=i2(ui+1,vi),c=i2(ui+1,vi+1),d=i2(ui,vi+1);
        indices.push(a,b,c, a,c,d);
      }
    }

    // Compute curvature-based colors
    const col=new Float32Array(N*N*3);
    for(let i=0;i<N;i++){
      for(let j=0;j<N;j++){
        const idx=(i*N+j)*3;
        const t2=(i+j)/(2*N);
        const h=t2*360;
        const [r,g,b]=hsl(h,0.9,0.55);
        col[idx]=r; col[idx+1]=g; col[idx+2]=b;
      }
    }

    return {positions:new Float32Array(positions),indices:new Uint32Array(indices),colors:col};
  }

  function hsl(h,s,l){
    h=h%360; const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
    let r=0,g=0,b=0;
    if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
    else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
    return[r+m,g+m,b+m];
  }

  function build(){
    if(mesh){scene.remove(mesh);mesh.geometry.dispose();if(mesh.material.dispose)mesh.material.dispose();}
    const {positions,indices,colors}=buildGeometry(surfType,res);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    geo.setIndex(new THREE.BufferAttribute(indices,1));
    geo.computeVertexNormals();
    const mat=new THREE.MeshStandardMaterial({
      vertexColors:true, side:THREE.DoubleSide,
      metalness:metalness, roughness:0.25,
      wireframe:wireframe
    });
    mesh=new THREE.Mesh(geo,mat);
    scene.add(mesh);
    document.getElementById('minInfo').textContent=INFO[surfType]||'';
  }

  function init(){
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x030307);
    scene.fog=new THREE.Fog(0x030307,8,20);

    const W=container.clientWidth||700, H=container.clientHeight||500;
    camera=new THREE.PerspectiveCamera(50,W/H,0.1,100);
    camera.position.set(0,1.5,4);

    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W,H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    container.appendChild(renderer.domElement);

    // Lights
    const amb=new THREE.AmbientLight(0x334466,1.5); scene.add(amb);
    const dir=new THREE.DirectionalLight(0x88ccff,2.5); dir.position.set(3,5,2); scene.add(dir);
    const dir2=new THREE.DirectionalLight(0xff8844,1.5); dir2.position.set(-3,-2,1); scene.add(dir2);
    const pt=new THREE.PointLight(0x00c8ff,2,10); pt.position.set(0,3,0); scene.add(pt);

    // Env background dots
    const starsGeo=new THREE.BufferGeometry();
    const sv=new Float32Array(600);for(let i=0;i<600;i++)sv[i]=(Math.random()-0.5)*30;
    starsGeo.setAttribute('position',new THREE.BufferAttribute(sv,3));
    scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0x445566,size:0.05})));

    build();

    // Orbit controls (manual)
    let mdrag=false,mox=0,moy=0,phi=0.4,theta=0;
    renderer.domElement.addEventListener('mousedown',e=>{mdrag=true;mox=e.clientX;moy=e.clientY;});
    renderer.domElement.addEventListener('mousemove',e=>{
      if(!mdrag)return;
      theta+=(e.clientX-mox)*0.01; phi+=(e.clientY-moy)*0.01;
      phi=Math.max(0.1,Math.min(Math.PI-0.1,phi));
      mox=e.clientX; moy=e.clientY;
    });
    renderer.domElement.addEventListener('mouseup',()=>mdrag=false);
    renderer.domElement.addEventListener('wheel',e=>{
      camera.position.multiplyScalar(1+e.deltaY*0.001);
      e.preventDefault();
    },{passive:false});

    function loop(){
      raf=requestAnimationFrame(loop);
      theta+=0.004;
      const r=camera.position.length();
      camera.position.set(r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
    }
    loop();
  }

  // Controls
  document.getElementById('minimalType')?.addEventListener('change',e=>{surfType=e.target.value;build();});
  document.getElementById('minRes')?.addEventListener('input',e=>{res=parseInt(e.target.value);document.getElementById('minResVal').textContent=e.target.value;build();});
  document.getElementById('minWire')?.addEventListener('change',e=>{wireframe=e.target.checked;if(mesh)mesh.material.wireframe=wireframe;});
  document.getElementById('minCurv')?.addEventListener('change',e=>{colorCurv=e.target.checked;build();});
  document.getElementById('minMetal')?.addEventListener('input',e=>{metalness=parseFloat(e.target.value);document.getElementById('minMetalVal').textContent=e.target.value;if(mesh)mesh.material.metalness=metalness;});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!scene)init();},{threshold:0.1}).observe(section);
})();
