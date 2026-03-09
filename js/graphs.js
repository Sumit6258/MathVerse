/* ═══════════════════════════════════════════
   graphs.js — Plotly Equation Explorer
   ═══════════════════════════════════════════ */

(function() {
  const COLORS = ['#00c8ff','#bf5af2','#ffd700','#00ff9d','#ff3b30','#ff9500','#64d2ff'];
  let equations = [
    { expr: 'Math.sin(x)', color: COLORS[0] },
    { expr: 'Math.cos(x) * Math.exp(-x/10)', color: COLORS[1] }
  ];
  let paramA = 1, paramB = 0;

  function evalExpr(expr, x) {
    try {
      const fn = new Function('x','a','b','Math','PI',`return ${expr}`);
      const v = fn(x, paramA, paramB, Math, Math.PI);
      return isFinite(v) ? v : null;
    } catch { return null; }
  }

  function buildTrace(eq) {
    const xs = [], ys = [];
    for(let x=-10; x<=10; x+=0.03) {
      const y = evalExpr(eq.expr, x);
      xs.push(x);
      ys.push(y);
    }
    return {
      x: xs, y: ys, type: 'scatter', mode: 'lines',
      line: { color: eq.color, width: 2.5 },
      name: eq.expr,
      hovertemplate: 'x: %{x:.3f}<br>y: %{y:.3f}<extra></extra>'
    };
  }

  function updatePlot() {
    const traces = equations.map(buildTrace);
    const layout = {
      paper_bgcolor: 'rgba(7,8,15,0)',
      plot_bgcolor: 'rgba(7,8,15,0)',
      margin: { l:50, r:20, t:20, b:50 },
      xaxis: {
        color: '#8892b0', gridcolor: 'rgba(0,200,255,0.07)',
        zerolinecolor: 'rgba(0,200,255,0.25)',
        tickfont: { family:'JetBrains Mono', size:11, color:'#8892b0' },
        range: [-10, 10]
      },
      yaxis: {
        color: '#8892b0', gridcolor: 'rgba(0,200,255,0.07)',
        zerolinecolor: 'rgba(0,200,255,0.25)',
        tickfont: { family:'JetBrains Mono', size:11, color:'#8892b0' },
        range: [-3, 3]
      },
      legend: {
        font: { family:'JetBrains Mono', size:11, color:'#8892b0' },
        bgcolor: 'rgba(16,18,31,0.8)',
        bordercolor: 'rgba(0,200,255,0.15)',
        borderwidth: 1
      },
      showlegend: true
    };
    const config = { responsive:true, displayModeBar:false };
    Plotly.react('graphPlot', traces, layout, config);
  }

  function renderEquationRows() {
    const container = document.getElementById('equationInputs');
    container.innerHTML = '';
    equations.forEach((eq, i) => {
      const row = document.createElement('div');
      row.className = 'eq-row';
      row.innerHTML = `
        <span class="eq-color" style="background:${eq.color}"></span>
        <input type="text" class="eq-input" value="${eq.expr}" data-idx="${i}" />
        <button class="eq-remove" data-idx="${i}">×</button>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('.eq-input').forEach(inp => {
      inp.addEventListener('input', e => {
        equations[parseInt(e.target.dataset.idx)].expr = e.target.value;
        updatePlot();
      });
    });

    container.querySelectorAll('.eq-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx);
        if(equations.length > 1) {
          equations.splice(idx, 1);
          renderEquationRows();
          updatePlot();
        }
      });
    });
  }

  document.getElementById('addEquation').addEventListener('click', () => {
    equations.push({ expr: 'Math.sin(x)', color: COLORS[equations.length % COLORS.length] });
    renderEquationRows();
    updatePlot();
  });

  document.querySelectorAll('.preset').forEach(btn => {
    btn.addEventListener('click', () => {
      equations[0].expr = btn.dataset.eq;
      renderEquationRows();
      updatePlot();
    });
  });

  document.getElementById('paramA').addEventListener('input', e => {
    paramA = parseFloat(e.target.value);
    document.getElementById('paramAVal').textContent = paramA.toFixed(1);
    updatePlot();
  });

  document.getElementById('paramB').addEventListener('input', e => {
    paramB = parseFloat(e.target.value);
    document.getElementById('paramBVal').textContent = paramB.toFixed(1);
    updatePlot();
  });

  // Init when section becomes visible
  const graphSection = document.getElementById('graph-explorer');
  const obs = new IntersectionObserver((entries) => {
    if(entries[0].isIntersecting) {
      renderEquationRows();
      updatePlot();
      obs.disconnect();
    }
  }, { threshold: 0.2 });
  obs.observe(graphSection);
})();
