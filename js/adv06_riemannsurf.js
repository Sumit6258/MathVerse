/* ═══════════════════════════════════════════
   ADV 06 — Riemann Surface Visualizer
   Multi-sheet complex function surfaces
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('riemannsurf'); if(!section)return;
  const container=document.getElementById('riemannSurfContainer'); if(!container)return;
  let scene,camera,renderer,raf=null;
  let func='sqrt',sheets=3,gridN=40,sep=0.8,colorPhase=true;
  let sheetGroup,t=0;

  function evalFunc(x,y,sheet,n){
    // Complex: z = x + iy
    const r=Math.sqrt(x*x+y*y);
    const arg=Math.atan2(y,x);
    if(func==='sqrt'){
      const r2=Math.sqrt(r);
      const a=(arg+2*Math.PI*sheet)/2;
      return{re:r2*Math.cos(a),im:r2*Math.sin(a)};
    }
    if(func==='log'){
      return{re:0.5*Math.log(r||0.001),im:arg+2*Math.PI*sheet};
    }
    if(func==='cbrt'){
      const r3=Math.pow(r,1/3);
      const a=(arg+2*Math.PI*sheet)/3;
      return{re:r3*Math.cos(a),im:r3*Math.sin(a)};
    }
    if(func==='arccosh'){
      // arccosh(z) = log(z + sqrt(z²-1))
      const zr=x,zi=y;
      const z2r=zr*zr-zi*zi-1, z2i=2*zr*zi;
      const mr=Math.sqrt(z2r*z2r+z2i*z2i);
      const sqr=Math.sqrt((mr+z2r)/2)*Math.sign(z2i||1);
      const sqi=Math.sqrt((mr-z2r)/2);
      const wr=zr+sqr,wi=zi+sqi;
      const rw=Math.sqrt(wr*wr+wi*wi);
      return{re:Math.log(rw||0.001)+sheet*0.5,im:Math.atan2(wi,wr)};
    }
    return{re:0,im:0};
  }

  function hue2rgb(h){
    h=((h%1)+1)%1;
    const i=Math.floor(h*6),f=h*6-i,p=0,q=1-f,t2=f;
    const rows=[[1,t2,0],[q,1,0],[0,1,t2],[0,q,1],[t2,0,1],[1,0,q]];
    const c=rows[i%6];return c;
  }

  function build(){
    if(sheetGroup){scene.remove(sheetGroup);sheetGroup.traverse(c=>{c.geometry?.dispose();c.material?.dispose();});}
    sheetGroup=new THREE.Group();
    const N=gridN, range=2.5;

    for(let s=0;s<sheets;s++){
      const verts=[],cols=[],idxs=[];
      for(let i=0;i<=N;i++){
        const x=(i/N)*2*range-range;
        for(let j=0;j<=N;j++){
          const y=(j/N)*2*range-range;
          if(Math.sqrt(x*x+y*y)<0.05){verts.push(0,s*sep,0);cols.push(0.5,0.5,0.5);continue;}
          const w=evalFunc(x,y,s,sheets);
          const zVal=colorPhase?w.im:Math.sqrt(w.re*w.re+w.im*w.im);
          const clampedZ=Math.max(-2,Math.min(2,w.re));
          verts.push(x,clampedZ*0.5+s*sep,y);
          const hue=(Math.atan2(w.im,w.re)+Math.PI)/(Math.PI*2);
          const [r,g,b]=hue2rgb(hue+s/sheets*0.3);
          cols.push(r,g,b);
        }
      }
      for(let i=0;i<N;i++) for(let j=0;j<N;j++){
        const a=i*(N+1)+j,b=a+1,c=a+(N+1),d=c+1;
        idxs.push(a,b,c,b,d,c);
      }
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(verts),3));
      geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(cols),3));
      geo.setIndex(idxs); geo.computeVertexNormals();
      const mat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,metalness:0.3,roughness:0.4,transparent:true,opacity:0.85});
      sheetGroup.add(new THREE.Mesh(geo,mat));
      // Wire edges
      const wmat=new THREE.MeshBasicMaterial({color:new THREE.Color().setHSL(s/sheets,0.8,0.5),wireframe:true,opacity:0.1,transparent:true});
      sheetGroup.add(new THREE.Mesh(geo.clone(),wmat));
    }
    scene.add(sheetGroup);
  }

  function init(){
    scene=new THREE.Scene(); scene.background=new THREE.Color(0x030307);
    scene.fog=new THREE.FogExp2(0x030307,0.05);
    const W=container.clientWidth||700,H=container.clientHeight||500;
    camera=new THREE.PerspectiveCamera(50,W/H,0.1,100);
    camera.position.set(0,3,7);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x335566,2));
    const d=new THREE.DirectionalLight(0x88ccff,3); d.position.set(3,5,3); scene.add(d);
    const d2=new THREE.DirectionalLight(0xff4488,1); d2.position.set(-3,-2,1); scene.add(d2);
    // Branch cut indicator
    const lGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,3)]);
    scene.add(new THREE.Line(lGeo,new THREE.LineBasicMaterial({color:0xff3300,linewidth:3})));
    build();
    let drag=false,ox=0,oy=0,theta=0.5,phi=0.5;
    renderer.domElement.addEventListener('mousedown',e=>{drag=true;ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mousemove',e=>{if(!drag)return;theta+=(e.clientX-ox)*.01;phi+=(e.clientY-oy)*.01;phi=Math.max(0.1,Math.min(Math.PI-0.1,phi));ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mouseup',()=>drag=false);
    renderer.domElement.addEventListener('wheel',e=>{camera.position.multiplyScalar(1+e.deltaY*0.001);e.preventDefault();},{passive:false});
    function loop(){
      raf=requestAnimationFrame(loop); t+=0.005;
      if(sheetGroup) sheetGroup.rotation.y=t;
      const r=camera.position.length();
      camera.position.set(r*Math.sin(phi)*Math.sin(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.cos(theta));
      camera.lookAt(0,sheetGroup?sheets*sep/2:0,0);
      renderer.render(scene,camera);
    }
    loop();
  }

  document.getElementById('rsFunc')?.addEventListener('change',e=>{func=e.target.value;if(sheetGroup)build();});
  document.getElementById('rsSheets')?.addEventListener('input',e=>{sheets=parseInt(e.target.value);document.getElementById('rsSheetsVal').textContent=e.target.value;if(sheetGroup)build();});
  document.getElementById('rsGrid')?.addEventListener('input',e=>{gridN=parseInt(e.target.value);document.getElementById('rsGridVal').textContent=e.target.value;if(sheetGroup)build();});
  document.getElementById('rsSep')?.addEventListener('input',e=>{sep=parseFloat(e.target.value);document.getElementById('rsSepVal').textContent=e.target.value;if(sheetGroup)build();});
  document.getElementById('rsPhase')?.addEventListener('change',e=>{colorPhase=e.target.checked;if(sheetGroup)build();});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!scene)init();},{threshold:0.1}).observe(section);
})();
