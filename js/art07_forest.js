/* ═══════════════════════════════════════════════
   ART 07 — Fractal Tree Ecosystem
   L-system trees with wind physics & seasons
   ═══════════════════════════════════════════════ */
(function(){
  const sec=document.getElementById('fractalForest'); if(!sec) return;
  const canvas=document.getElementById('forestCanvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  let W,H,raf=null,t=0;
  let treeCount=5,lDepth=7,branchAngle=25,windStr=1.0,season='spring';
  let trees=[];

  const SEASONS={
    spring:{bg:'#050a0a',trunk:'#2d1b0e',leaf:['#22ff66','#44ff88','#88ffaa','#ffee44'],blossom:'#ffaabb'},
    summer:{bg:'#020408',trunk:'#1a0f08',leaf:['#00cc44','#22aa33','#006622','#88cc00'],blossom:null},
    autumn:{bg:'#050305',trunk:'#3d1a0e',leaf:['#ff6600','#ff3300','#ffaa00','#cc4400'],blossom:null},
    winter:{bg:'#020308',trunk:'#2a2a3a',leaf:['#aaccff','#88bbee','#ffffff','#ccddef'],blossom:'#aaccff'}
  };

  // L-system rules
  const rules={
    F:'FF-[-F+F+F]+[+F-F-F]',
    get(c){ return this[c]||c; }
  };

  function lExpand(axiom,depth){
    let s=axiom;
    for(let i=0;i<depth;i++){
      let ns='';
      for(const c of s) ns+=rules.get(c)||c;
      s=ns;
    }
    return s;
  }

  function buildTree(tree){
    const str=lExpand('F',tree.depth);
    tree.str=str;
    // Pre-compute segments
    tree.segs=[];
    const stack=[];
    let x=tree.x,y=tree.y,ang=-Math.PI/2;
    let len=tree.segLen, thick=tree.thick;
    for(const c of str){
      if(c==='F'){
        const nx=x+Math.cos(ang)*len, ny=y+Math.sin(ang)*len;
        tree.segs.push({x1:x,y1:y,x2:nx,y2:ny,ang,len,thick,isLeaf:false,windPhase:Math.random()*Math.PI*2});
        x=nx;y=ny; len*=0.72; thick*=0.7;
      } else if(c==='+'){ang+=tree.ang*(1+Math.random()*0.15);}
      else if(c==='-'){ang-=tree.ang*(1+Math.random()*0.15);}
      else if(c==='['){stack.push({x,y,ang,len,thick});len*=0.85;}
      else if(c===']'){
        const st=stack.pop();
        // Add leaf at endpoint
        tree.segs.push({x1:x,y1:y,x2:x,y2:y,ang,len:len*2,thick:2,isLeaf:true,windPhase:Math.random()*Math.PI*2});
        x=st.x;y=st.y;ang=st.ang;len=st.len;thick=st.thick;
      }
    }
  }

  function makeTrees(){
    trees=[];
    const pal=SEASONS[season];
    for(let i=0;i<treeCount;i++){
      const x=W*(0.1+i/(treeCount-0.5)*0.8);
      const depth=Math.min(lDepth,5+Math.floor(Math.random()*2));
      const baseH=H*(0.25+Math.random()*0.15);
      const tree={
        x,y:H-20,depth,ang:(branchAngle+Math.random()*8-4)*Math.PI/180,
        segLen:baseH/(Math.pow(1.5,depth)),thick:3+Math.random()*2,
        hue:Math.random()*40,segs:[],windOffset:Math.random()*Math.PI*2
      };
      buildTree(tree);
      trees.push(tree);
    }
  }

  function resize(){W=canvas.width=canvas.offsetWidth||800;H=canvas.height=canvas.offsetHeight||540;}

  function drawTree(tree){
    const pal=SEASONS[season];
    const wind=Math.sin(t*1.2+tree.windOffset)*windStr*0.04;
    for(const seg of tree.segs){
      if(seg.isLeaf){
        // Leaf
        const windOff=Math.sin(t*2+seg.windPhase)*windStr*0.06;
        const lx=seg.x1+Math.cos(seg.ang+windOff)*seg.len;
        const ly=seg.y1+Math.sin(seg.ang+windOff)*seg.len;
        const leafCol=pal.leaf[Math.floor(Math.random()*pal.leaf.length)];
        ctx.beginPath(); ctx.arc(lx,ly,3+Math.random()*2,0,Math.PI*2);
        ctx.fillStyle=leafCol+'cc'; ctx.fill();
        if(pal.blossom&&Math.random()<0.08){
          ctx.beginPath(); ctx.arc(lx,ly,2,0,Math.PI*2);
          ctx.fillStyle=pal.blossom+'dd'; ctx.fill();
        }
        continue;
      }
      // Branch with wind sway (more sway higher up)
      const depth=Math.min(1,seg.len/tree.segLen);
      const sway=Math.sin(t*1.5+seg.windPhase+tree.windOffset)*windStr*(1-depth)*0.05;
      ctx.beginPath();
      ctx.moveTo(seg.x1,seg.y1);
      const cx2=seg.x2+Math.cos(seg.ang+Math.PI/2)*sway*H*0.1;
      const cy2=seg.y2+Math.sin(seg.ang+Math.PI/2)*sway*H*0.1;
      ctx.quadraticCurveTo((seg.x1+cx2)/2,(seg.y1+cy2)/2,cx2,cy2);
      ctx.strokeStyle=pal.trunk+'ee';
      ctx.lineWidth=Math.max(0.5,seg.thick);
      ctx.stroke();
    }
  }

  function drawBackground(){
    const pal=SEASONS[season];
    ctx.fillStyle=pal.bg; ctx.fillRect(0,0,W,H);
    // Ground
    const grd=ctx.createLinearGradient(0,H-30,0,H);
    grd.addColorStop(0,season==='winter'?'#334':'#120a04');
    grd.addColorStop(1,season==='winter'?'#223':'#0a0604');
    ctx.fillStyle=grd; ctx.fillRect(0,H-30,W,30);
    // Stars/particles
    for(let i=0;i<50;i++){
      const sx=(Math.sin(i*3.7)*0.5+0.5)*W;
      const sy=(Math.sin(i*7.3)*0.5+0.5)*H*0.6;
      ctx.fillStyle=`rgba(150,180,255,${0.3+Math.sin(t+i)*0.2})`;
      ctx.beginPath(); ctx.arc(sx,sy,0.7,0,Math.PI*2); ctx.fill();
    }
  }

  function frame(){
    raf=requestAnimationFrame(frame); t+=0.016;
    ctx.clearRect(0,0,W,H);
    drawBackground();
    trees.forEach(drawTree);
    ctx.font='11px JetBrains Mono';
    ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.fillText(`L-system depth:${lDepth}  season:${season}  wind:${windStr.toFixed(1)}`,8,H-8);
  }

  function start(){if(raf){cancelAnimationFrame(raf);raf=null;}resize();makeTrees();frame();}

  const b=(id,cb,dId,fmt)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('input',e=>{cb(parseFloat(e.target.value));if(dId)document.getElementById(dId).textContent=fmt?fmt(parseFloat(e.target.value)):e.target.value;});};
  b('forestCount',v=>{treeCount=v;makeTrees();},'forestCountVal');
  b('forestDepth',v=>{lDepth=v;makeTrees();},'forestDepthVal');
  b('forestAngle',v=>{branchAngle=v;makeTrees();},'forestAngleVal');
  b('forestWind',v=>windStr=v,'forestWindVal',v=>v.toFixed(1));
  document.getElementById('forestSeason')?.addEventListener('change',e=>{season=e.target.value;});
  document.getElementById('forestGrow')?.addEventListener('click',start);

  new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!raf)start();
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
  },{threshold:0.1}).observe(sec);
})();
