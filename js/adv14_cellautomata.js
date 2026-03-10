/* ═══════════════════════════════════════════
   ADV 14 — Cellular Automata Universe
   Life, Brian's Brain, Langton's Ant, Wireworld, Rule 110
   ═══════════════════════════════════════════ */
(function(){
  const section=document.getElementById('cellautomata'); if(!section)return;
  const canvas=document.getElementById('caCanvas'); if(!canvas)return;
  canvas.width=canvas.offsetWidth||700; canvas.height=canvas.offsetHeight||500;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;

  let rule='life',simSpeed=15,cellSz=6,drawMode='alive',paused=false;
  let grid,next,cols,rows,raf=null,lastTime=0;
  // Langton's ant
  let antX,antY,antDir;
  // Rule 110
  let row1D;
  const COLORS={
    life:{0:'#030307',1:'#00c8ff'},
    brians:{0:'#030307',1:'#00c8ff',2:'#334466'},
    wireworld:{0:'#030307',1:'#ffd700',2:'#00c8ff',3:'#ff4444'},
    langton:{0:'#030307',1:'#00c8ff'},
    rule110:{0:'#030307',1:'#bf5af2'}
  };

  function initGrid(){
    cols=Math.floor(W/cellSz); rows=Math.floor(H/cellSz);
    grid=new Uint8Array(cols*rows);
    next=new Uint8Array(cols*rows);
    antX=Math.floor(cols/2); antY=Math.floor(rows/2); antDir=0;
    row1D=new Uint8Array(cols);
    // Random seed
    for(let i=0;i<cols*rows;i++){
      if(rule==='brians') grid[i]=Math.random()<0.3?1:0;
      else if(rule==='wireworld'){
        if(Math.random()<0.04) grid[i]=1;
      } else if(rule==='langton') grid[i]=0;
      else if(rule==='rule110'){
        grid[i]=0; row1D[Math.floor(Math.random()*cols)]=1;
        row1D[cols/2]=1;
      }
      else grid[i]=Math.random()<0.25?1:0;
    }
    if(rule==='rule110') for(let i=0;i<cols*rows;i++)grid[i]=0;
    ctx.fillStyle='#030307'; ctx.fillRect(0,0,W,H);
  }

  function countNeighbors(i){
    const x=i%cols,y=Math.floor(i/cols);
    let n=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;
      const nx=(x+dx+cols)%cols,ny=(y+dy+rows)%rows;
      n+=(grid[ny*cols+nx]>0)?1:0;
    }
    return n;
  }

  function countLifeNeighbors(i){
    const x=i%cols,y=Math.floor(i/cols);
    let n=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;
      const nx=(x+dx+cols)%cols,ny=(y+dy+rows)%rows;
      if(grid[ny*cols+nx]===1)n++;
    }
    return n;
  }

  function stepLife(){
    for(let i=0;i<cols*rows;i++){
      const n=countLifeNeighbors(i);
      const alive=grid[i]===1;
      next[i]=alive?(n===2||n===3?1:0):(n===3?1:0);
    }
    grid.set(next);
  }

  function stepBrians(){
    for(let i=0;i<cols*rows;i++){
      if(grid[i]===1) next[i]=2;
      else if(grid[i]===2) next[i]=0;
      else{const n=countNeighbors(i);next[i]=n===2?1:0;}
    }
    grid.set(next);
  }

  function stepLangton(){
    const i=antY*cols+antX;
    if(grid[i]===0){grid[i]=1;antDir=(antDir+1)%4;}
    else{grid[i]=0;antDir=(antDir+3)%4;}
    const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
    antX=(antX+dirs[antDir][0]+cols)%cols;
    antY=(antY+dirs[antDir][1]+rows)%rows;
  }

  function stepWireworld(){
    for(let i=0;i<cols*rows;i++){
      const c=grid[i];
      if(c===0) next[i]=0;
      else if(c===1){next[i]=2;}
      else if(c===2){next[i]=3;}
      else{ // conductor: check for 1 or 2 heads around
        const x=i%cols,y=Math.floor(i/cols);
        let heads=0;
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
          if(!dx&&!dy)continue;
          if(grid[((y+dy+rows)%rows)*cols+(x+dx+cols)%cols]===1)heads++;
        }
        next[i]=(heads===1||heads===2)?1:3;
      }
    }
    grid.set(next);
  }

  let rule1D_current=0;
  function stepRule110(){
    // 1D rule 110 scrolling
    const newRow=new Uint8Array(cols);
    for(let x=0;x<cols;x++){
      const l=row1D[(x-1+cols)%cols],c=row1D[x],r=row1D[(x+1)%cols];
      const code=(l<<2)|(c<<1)|r;
      // Rule 110: 01101110 in binary
      newRow[x]=(110>>code)&1;
    }
    // Scroll grid up, add new row at bottom
    for(let y=0;y<rows-1;y++) for(let x=0;x<cols;x++) grid[y*cols+x]=grid[(y+1)*cols+x];
    for(let x=0;x<cols;x++) grid[(rows-1)*cols+x]=newRow[x];
    row1D=newRow;
  }

  const stepFns={life:stepLife,brians:stepBrians,langton:stepLangton,wireworld:stepWireworld,rule110:stepRule110};

  function render(){
    const img=ctx.createImageData(W,H);
    const pal=COLORS[rule]||COLORS.life;
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const state=grid[y*cols+x];
      const hex=pal[state]||'#030307';
      const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
      for(let dy=0;dy<cellSz;dy++) for(let dx=0;dx<cellSz;dx++){
        const px=(y*cellSz+dy)*W+(x*cellSz+dx);
        img.data[px*4]=r;img.data[px*4+1]=g;img.data[px*4+2]=b;img.data[px*4+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
    // Draw ant if langton
    if(rule==='langton'){
      ctx.fillStyle='#ffd700';
      ctx.fillRect(antX*cellSz,antY*cellSz,cellSz,cellSz);
    }
    ctx.font='11px JetBrains Mono'; ctx.fillStyle='rgba(255,255,255,0.3)';
    ctx.fillText(`Rule: ${rule}  ${cols}×${rows} grid  ${simSpeed}fps`,8,H-6);
  }

  // Drawing on canvas
  let mouseDrawing=false;
  function getCell(e){
    const r=canvas.getBoundingClientRect();
    const x=Math.floor((e.clientX-r.left)/cellSz);
    const y=Math.floor((e.clientY-r.top)/cellSz);
    return{x:Math.max(0,Math.min(cols-1,x)),y:Math.max(0,Math.min(rows-1,y))};
  }
  function paintCell(e){
    const {x,y}=getCell(e);
    const i=y*cols+x;
    if(drawMode==='alive') grid[i]=1;
    else if(drawMode==='dead') grid[i]=0;
    else if(drawMode==='wire') grid[i]=3;
    else if(drawMode==='head') grid[i]=1;
    render();
  }
  canvas.addEventListener('mousedown',e=>{mouseDrawing=true;paintCell(e);});
  canvas.addEventListener('mousemove',e=>{if(mouseDrawing)paintCell(e);});
  canvas.addEventListener('mouseup',()=>mouseDrawing=false);
  canvas.addEventListener('mouseleave',()=>mouseDrawing=false);

  let frameInterval=1000/simSpeed;
  function loop(ts){
    raf=requestAnimationFrame(loop);
    if(!paused&&ts-lastTime>=frameInterval){
      lastTime=ts;
      const fn=stepFns[rule];
      if(fn)fn();
      render();
    }
  }

  document.getElementById('caRule')?.addEventListener('change',e=>{rule=e.target.value;initGrid();});
  document.getElementById('caSpeed')?.addEventListener('input',e=>{simSpeed=parseInt(e.target.value);frameInterval=1000/simSpeed;document.getElementById('caSpeedVal').textContent=e.target.value;});
  document.getElementById('caCell')?.addEventListener('input',e=>{cellSz=parseInt(e.target.value);document.getElementById('caCellVal').textContent=e.target.value;initGrid();});
  document.getElementById('caDrawMode')?.addEventListener('change',e=>drawMode=e.target.value);
  document.getElementById('caPause')?.addEventListener('click',e=>{paused=!paused;e.target.textContent=paused?'▶ Resume':'⏸ Pause';});
  document.getElementById('caStep')?.addEventListener('click',()=>{const fn=stepFns[rule];if(fn){fn();render();}});
  document.getElementById('caReset')?.addEventListener('click',()=>{initGrid();render();});
  document.getElementById('caClear')?.addEventListener('click',()=>{grid.fill(0);row1D?.fill(0);render();});

  new IntersectionObserver(en=>{
    if(en[0].isIntersecting&&!raf){initGrid();render();loop(0);}
    else if(!en[0].isIntersecting&&raf){cancelAnimationFrame(raf);raf=null;}
  },{threshold:0.1}).observe(section);
})();
