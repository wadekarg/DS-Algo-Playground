/* backtracking-viz.js — Visualizes the recursion tree for subsets([1,2,3]). */

const BacktrackingViz = (() => {
  function buildSteps() {
    // Manually-constructed tree for subsets([1,2,3]). Each node:
    // { id, parent, depth, x, y, current: [...], action: 'include'|'exclude'|'leaf' }
    const T = [
      { id: 'root',  parent: null, depth: 0, current: [],         action: 'start' },
      { id: 'i1',    parent: 'root', depth: 1, current: [1],       action: 'include 1' },
      { id: 'i1i2',  parent: 'i1',   depth: 2, current: [1, 2],    action: 'include 2' },
      { id: 'i1i2i3', parent: 'i1i2', depth: 3, current: [1,2,3], action: 'leaf [1,2,3]' },
      { id: 'i1i2e3', parent: 'i1i2', depth: 3, current: [1, 2],   action: 'leaf [1,2]' },
      { id: 'i1e2',  parent: 'i1',   depth: 2, current: [1],       action: 'exclude 2' },
      { id: 'i1e2i3', parent: 'i1e2', depth: 3, current: [1, 3],   action: 'leaf [1,3]' },
      { id: 'i1e2e3', parent: 'i1e2', depth: 3, current: [1],      action: 'leaf [1]' },
      { id: 'e1',    parent: 'root', depth: 1, current: [],        action: 'exclude 1' },
      { id: 'e1i2',  parent: 'e1',   depth: 2, current: [2],       action: 'include 2' },
      { id: 'e1i2i3', parent: 'e1i2', depth: 3, current: [2, 3],   action: 'leaf [2,3]' },
      { id: 'e1i2e3', parent: 'e1i2', depth: 3, current: [2],      action: 'leaf [2]' },
      { id: 'e1e2',  parent: 'e1',   depth: 2, current: [],        action: 'exclude 2' },
      { id: 'e1e2i3', parent: 'e1e2', depth: 3, current: [3],      action: 'leaf [3]' },
      { id: 'e1e2e3', parent: 'e1e2', depth: 3, current: [],       action: 'leaf [] (empty subset)' }
    ];
    // Lay out: pre-order. Width of subtree determines spacing.
    function layout() {
      const w = 60; const h = 90;
      const byDepth = [[], [], [], []];
      T.forEach(n => byDepth[n.depth].push(n));
      byDepth.forEach((nodes, depth) => {
        const total = nodes.length;
        nodes.forEach((n, i) => {
          n.x = (i + 1) * (700 / (total + 1));
          n.y = 30 + depth * h;
        });
      });
    }
    layout();
    return T.map((_, i) => ({ stepIdx: i, tree: T }));
  }

  function render(ctx, step) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const visible = step.tree.slice(0, step.stepIdx + 1);
    const byId = {};
    visible.forEach(n => byId[n.id] = n);

    // Edges first (so nodes overlay)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    visible.forEach(n => {
      if (!n.parent) return;
      const p = byId[n.parent];
      if (!p) return;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 20);
      ctx.lineTo(n.x, n.y - 20);
      ctx.stroke();
    });

    // Nodes
    visible.forEach((n, idx) => {
      const isCurrent = idx === step.stepIdx;
      const isLeaf = n.action && n.action.startsWith('leaf');
      ctx.beginPath();
      ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#fbbf24' : (isLeaf ? '#86efac' : '#e0e7ff');
      ctx.fill();
      ctx.strokeStyle = isCurrent ? '#d97706' : '#94a3b8';
      ctx.lineWidth = isCurrent ? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[' + n.current.join(',') + ']', n.x, n.y + 4);
    });

    // Step label
    const cur = step.tree[step.stepIdx];
    ctx.fillStyle = '#1e293b';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Action: ' + cur.action, 20, ctx.canvas.height - 20);
  }

  function attach(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const steps = buildSteps();
    let idx = 0;
    const draw = () => render(ctx, steps[idx]);
    draw();
    const wireBtn = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', fn);
    };
    wireBtn('prev-step', () => { idx = Math.max(0, idx - 1); draw(); });
    wireBtn('next-step', () => { idx = Math.min(steps.length - 1, idx + 1); draw(); });
    wireBtn('reset',     () => { idx = 0; draw(); });
  }

  return { attach };
})();
