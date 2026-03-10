/* ═══════════════════════════════════════════════
   ART 04 — Chaotic Attractor Particle Cloud
   Three.js instanced particle system + glow
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('attractorCloud'); if(!sec) return;
  const container=document.getElementById('attractorContainer'); if(!container) return;
  let scene,camera,renderer,points,raf=null,t=0;
  let attractorType='lorenz',partCount=50000,glowSize=2.0,colorMode='velocity';

  // Attractor ODE definitions
  const attractors={
    lorenz:{dt:0.005,init:()=>[0.1+Math.random()*.2,0,0],
      step([x,y,z]){const s=10,r=28,b=8/3;return[x+s*(y-x)*0.005,y+(x*(r-z)-y)*0.005,z+(x*y-b*z)*0.005];}},
    rossler:{dt:0.01,init:()=>[Math.random()-.5,Math.random()-.5,Math.random()*.1],
      step([x,y,z]){const a=0.2,b=0.2,c=5.7;return[x+(-y-z)*0.01,y+(x+a*y)*0.01,z+(b+z*(x-c))*0.01];}},
    aizawa:{dt:0.02,init:()=>[0.1,0,0],
      step([x,y,z]){const a=0.95,b=0.7,c=0.6,d=3.5,e=0.25,f=0.1;
        const dx=(z-b)*x-d*y,dy=d*x+(z-b)*y,dz=c+a*z-z*z*z/3-(x*x+y*y)*(1+e*z)+f*z*x*x*x;
        return[x+dx*0.02,y+dy*0.02,z+dz*0.02];}},
    dadras:{dt:0.01,init:()=>[0.1,0.1,0.1],
      step([x,y,z]){const a=3,b=2.7,c=1.7,d=2,e=9;
        return[x+(y-a*x+b*y*z)*0.01,y+(c*y-x*z+z)*0.01,z+(d*x*y-e*z)*0.01];}},
    halvorsen:{dt:0.01,init:()=>[-.1,0,0],
      step([x,y,z]){const a=1.89;
        return[x+(-a*x-4*y-4*z-y*y)*0.01,y+(-a*y-4*z-4*x-z*z)*0.01,z+(-a*z-4*x-4*y-x*x)*0.01];}}
  };

  let pStates=[], pVelocities=[];

  function initParticles(){
    const attr=attractors[attractorType];
    pStates=[]; pVelocities=[];
    for(let i=0;i<partCount;i++){
      pStates.push(attr.init());
      pVelocities.push([0,0,0]);
    }
  }

  function warmup(){
    const attr=attractors[attractorType];
    for(let i=0;i<pStates.length;i++){
      for(let w=0;w<300;w++) pStates[i]=attr.step(pStates[i]);
    }
  }

  function buildPointSystem(){
    if(points){scene.remove(points);points.geometry?.dispose();points.material?.dispose();}
    const geo=new THREE.BufferGeometry();
    const pos=new Float32Array(partCount*3);
    const col=new Float32Array(partCount*3);
    for(let i=0;i<partCount;i++){
      const [x,y,z]=pStates[i];
      pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
      col[i*3]=0.5; col[i*3+1]=0.7; col[i*3+2]=1.0;
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:glowSize*0.025,vertexColors:true,transparent:true,opacity:0.7,sizeAttenuation:true,blending:THREE.AdditiveBlending,depthWrite:false});
    points=new THREE.Points(geo,mat);
    scene.add(points);
  }

  function updateParticles(){
    const attr=attractors[attractorType];
    const posArr=points.geometry.attributes.position.array;
    const colArr=points.geometry.attributes.color.array;
    for(let i=0;i<partCount;i++){
      const prev=[...pStates[i]];
      pStates[i]=attr.step(pStates[i]);
      const [x,y,z]=pStates[i];
      posArr[i*3]=x*0.08; posArr[i*3+1]=y*0.08; posArr[i*3+2]=z*0.08;
      // Color by mode
      let r=0.5,g=0.7,b=1.0;
      if(colorMode==='velocity'){
        const vx=x-prev[0],vy=y-prev[1],vz=z-prev[2];
        const spd=Math.sqrt(vx*vx+vy*vy+vz*vz)*50;
        const c=new THREE.Color().setHSL(0.6-spd*0.5,0.9,0.5+spd*0.3);
        r=c.r;g=c.g;b=c.b;
      } else if(colorMode==='time'){
        const c=new THREE.Color().setHSL((i/partCount+t*0.03)%1,0.9,0.6);
        r=c.r;g=c.g;b=c.b;
      } else { // depth
        const d=(z+1)*0.3;
        const c=new THREE.Color().setHSL(0.5+d*0.3,0.8,0.4+d*0.4);
        r=c.r;g=c.g;b=c.b;
      }
      colArr[i*3]=r;colArr[i*3+1]=g;colArr[i*3+2]=b;
    }
    points.geometry.attributes.position.needsUpdate=true;
    points.geometry.attributes.color.needsUpdate=true;
  }

  function init(){
    scene=new THREE.Scene(); scene.background=new THREE.Color(0x020205);
    scene.fog=new THREE.FogExp2(0x020205,0.05);
    const W=container.clientWidth||800,H=container.clientHeight||540;
    camera=new THREE.PerspectiveCamera(50,W/H,0.01,100);
    camera.position.set(0,0,6);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x334466,1));

    initParticles(); warmup(); buildPointSystem();

    let drag=false,ox=0,oy=0,theta=0,phi=0.5;
    renderer.domElement.addEventListener('mousedown',e=>{drag=true;ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mousemove',e=>{if(!drag)return;theta+=(e.clientX-ox)*.01;phi+=(e.clientY-oy)*.01;phi=Math.max(0.05,Math.min(Math.PI-0.05,phi));ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mouseup',()=>drag=false);
    renderer.domElement.addEventListener('wheel',e=>{camera.position.multiplyScalar(1+e.deltaY*0.001);e.preventDefault();},{passive:false});

    function loop(){
      raf=requestAnimationFrame(loop); t+=0.016; theta+=0.003;
      if(points) updateParticles();
      const r=camera.position.length();
      camera.position.set(r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(0,0,0);
      renderer.render(scene,camera);
    }
    loop();
  }

  document.getElementById('attractorType')?.addEventListener('change',e=>{attractorType=e.target.value;if(scene){initParticles();warmup();buildPointSystem();}});
  document.getElementById('attrPart')?.addEventListener('input',e=>{partCount=parseInt(e.target.value);document.getElementById('attrPartVal').textContent=e.target.value;if(scene){initParticles();warmup();buildPointSystem();}});
  document.getElementById('attrGlow')?.addEventListener('input',e=>{glowSize=parseFloat(e.target.value);document.getElementById('attrGlowVal').textContent=e.target.value;if(points)points.material.size=glowSize*0.025;});
  document.getElementById('attrColor')?.addEventListener('change',e=>colorMode=e.target.value);
  document.getElementById('attrReset')?.addEventListener('click',()=>{if(scene){initParticles();buildPointSystem();}});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!scene)init();},{threshold:0.1}).observe(sec);
})();
