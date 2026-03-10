/* ═══════════════════════════════════════════
   ADV 09 — Spherical Harmonics 3D
   Atomic orbital visualization
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('sharmonics'); if(!section)return;
  const container=document.getElementById('shContainer'); if(!container)return;
  let scene,camera,renderer,shMesh,raf=null;
  let L=2,M=1,animSpeed=1,colorByPhase=true,superpos=false,t=0;

  // Associated Legendre polynomial P_l^m(x)
  function ALegendre(l,m,x){
    let pmm=1;
    if(m>0){
      const s=Math.sqrt((1-x)*(1+x));
      let fact=1;
      for(let i=1;i<=m;i++){pmm*=-fact*s;fact+=2;}
    }
    if(l===m)return pmm;
    let pmmp1=x*(2*m+1)*pmm;
    if(l===m+1)return pmmp1;
    let pll=0;
    for(let ll=m+2;ll<=l;ll++){
      pll=((2*ll-1)*x*pmmp1-(ll+m-1)*pmm)/(ll-m);
      pmm=pmmp1; pmmp1=pll;
    }
    return pll;
  }

  function factorial(n){let f=1;for(let i=2;i<=n;i++)f*=i;return f;}

  function Ylm(l,m,theta,phi){
    const absM=Math.abs(m);
    const norm=Math.sqrt((2*l+1)/(4*Math.PI)*factorial(l-absM)/factorial(l+absM));
    const Plm=ALegendre(l,absM,Math.cos(theta));
    if(m>0) return Math.SQRT2*norm*Plm*Math.cos(m*phi);
    if(m<0) return Math.SQRT2*norm*Plm*Math.sin(-m*phi);
    return norm*Plm;
  }

  function buildSH(){
    if(shMesh){scene.remove(shMesh);shMesh.geometry?.dispose();shMesh.material?.dispose();}
    const N=80;
    const verts=[],cols=[],norms=[],idxs=[];

    for(let i=0;i<=N;i++){
      const theta=(i/N)*Math.PI;
      for(let j=0;j<=N;j++){
        const phi=(j/N)*Math.PI*2;
        let r=Math.abs(Ylm(L,M,theta,phi));
        if(superpos) r=Math.abs(Ylm(L,M,theta,phi)+Ylm(L,-M,theta,phi))*0.7;
        r=Math.max(0.05,r)*2.5;
        const x=r*Math.sin(theta)*Math.cos(phi);
        const y=r*Math.cos(theta);
        const z=r*Math.sin(theta)*Math.sin(phi);
        verts.push(x,y,z);
        // Color by phase or by radius
        const val=Ylm(L,M,theta,phi);
        const hue=(val>0)?0.6:0.0;
        const sat=colorByPhase?0.95:0.3;
        const lit=0.4+Math.abs(val)*0.8;
        const c=new THREE.Color().setHSL(hue,sat,Math.min(0.85,lit));
        cols.push(c.r,c.g,c.b);
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
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,metalness:0.4,roughness:0.25});
    shMesh=new THREE.Mesh(geo,mat);
    scene.add(shMesh);
    // Update label
    const info=document.getElementById('shInfo');
    if(info) info.textContent=`Y${L}${M>=0?'+':''}${M}(θ,φ)  l=${L}, m=${M}  Degeneracy: ${2*L+1}`;
    // m bounds
    const mEl=document.getElementById('shM');
    if(mEl){mEl.min=-L;mEl.max=L;}
  }

  function init(){
    scene=new THREE.Scene(); scene.background=new THREE.Color(0x030307);
    const W=container.clientWidth||700,H=container.clientHeight||500;
    camera=new THREE.PerspectiveCamera(50,W/H,0.1,50);
    camera.position.set(0,0,6);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x334466,2));
    const d=new THREE.DirectionalLight(0xffffff,3); d.position.set(3,5,2); scene.add(d);
    const d2=new THREE.DirectionalLight(0xff4466,1); d2.position.set(-3,-3,-1); scene.add(d2);
    // Axes
    const ax=[[1,0,0,0xff3333],[0,1,0,0x33ff33],[0,0,1,0x3333ff]];
    ax.forEach(([x,y,z,c])=>{const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(x*3,y*3,z*3)]);scene.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:c,opacity:0.3,transparent:true})));});
    buildSH();
    let drag=false,ox=0,oy=0,theta=0,phi=0.4;
    renderer.domElement.addEventListener('mousedown',e=>{drag=true;ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mousemove',e=>{if(!drag)return;theta+=(e.clientX-ox)*.01;phi+=(e.clientY-oy)*.01;phi=Math.max(0.1,Math.min(Math.PI-0.1,phi));ox=e.clientX;oy=e.clientY;});
    renderer.domElement.addEventListener('mouseup',()=>drag=false);
    function loop(){
      raf=requestAnimationFrame(loop); t+=0.01*animSpeed; theta+=0.005*animSpeed;
      if(shMesh) shMesh.rotation.y=theta;
      renderer.render(scene,camera);
    }
    loop();
  }

  const syncM=()=>{if(M>L)M=L;if(M<-L)M=-L;const el=document.getElementById('shM');if(el){el.min=-L;el.max=L;el.value=M;}document.getElementById('shMVal').textContent=M;buildSH();};
  document.getElementById('shL')?.addEventListener('input',e=>{L=parseInt(e.target.value);document.getElementById('shLVal').textContent=e.target.value;syncM();});
  document.getElementById('shM')?.addEventListener('input',e=>{M=parseInt(e.target.value);document.getElementById('shMVal').textContent=e.target.value;if(scene)buildSH();});
  document.getElementById('shSpeed')?.addEventListener('input',e=>{animSpeed=parseFloat(e.target.value);document.getElementById('shSpeedVal').textContent=e.target.value;});
  document.getElementById('shPhase')?.addEventListener('change',e=>{colorByPhase=e.target.checked;if(scene)buildSH();});
  document.getElementById('shSuper')?.addEventListener('change',e=>{superpos=e.target.checked;if(scene)buildSH();});

  new IntersectionObserver(en=>{if(en[0].isIntersecting&&!scene)init();},{threshold:0.1}).observe(section);
})();
