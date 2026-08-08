var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  // Same 7-node adjacency as bfs-viz.js (undirected)
  var defaultAdj = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 5, 6],
    3: [1],
    4: [1],
    5: [2],
    6: [2]
  };
  var NUM_NODES = 7;

  // Node layout fractions (relative to graph area)
  var nodeLayout = [
    { fx: 0.5,  fy: 0.12 }, // 0
    { fx: 0.25, fy: 0.38 }, // 1
    { fx: 0.75, fy: 0.38 }, // 2
    { fx: 0.12, fy: 0.72 }, // 3
    { fx: 0.38, fy: 0.72 }, // 4
    { fx: 0.62, fy: 0.72 }, // 5
    { fx: 0.88, fy: 0.72 }  // 6
  ];

  function getEdges(adj) {
    var edges = {}, result = [];
    for (var u = 0; u < NUM_NODES; u++) {
      var nb = adj[u] || [];
      for (var i = 0; i < nb.length; i++) {
        var v = nb[i];
        var key = Math.min(u, v) + '-' + Math.max(u, v);
        if (!edges[key]) { edges[key] = true; result.push({ from: u, to: v, key: key }); }
      }
    }
    return result;
  }

  // ── Step generation: DFS (iterative) from node 0 ──────────────────────
  function computeSteps(adj, start) {
    var steps = [];
    var visited = {};
    var callStack = []; // node ids currently on DFS stack
    var nodeStates = {};
    for (var ni = 0; ni < NUM_NODES; ni++) nodeStates[ni] = 'unvisited';
    var edges = getEdges(adj);

    function snapshot(currentNode, desc, codeLine) {
      var nodes = [];
      for (var n = 0; n < NUM_NODES; n++) nodes.push({ id: n, state: nodeStates[n] });
      return {
        nodes: nodes,
        edges: edges,
        stack: callStack.slice(),
        currentNode: currentNode,
        codeLine: codeLine || 1,
        description: desc
      };
    }

    steps.push(snapshot(-1, 'DFS starts at node ' + start + '. All nodes unvisited. Stack empty. DFS explores as deep as possible before backtracking.', 1));

    // Iterative DFS using explicit stack (we push neighbors in reverse so leftmost is visited first)
    var stack = [start];
    nodeStates[start] = 'active';
    callStack.push(start);
    steps.push(snapshot(start, 'Push node ' + start + ' onto the stack. Stack: [' + callStack + '].', 3));

    while (stack.length > 0) {
      var current = stack.pop();
      if (visited[current]) {
        callStack = callStack.filter(function(x) { return x !== current; });
        continue;
      }
      visited[current] = true;
      nodeStates[current] = 'visited';
      callStack = callStack.filter(function(x) { return x !== current; });
      steps.push(snapshot(current, 'Pop node ' + current + ' from stack. Mark as visited. Stack: [' + callStack + '].', 5));

      var neighbors = (adj[current] || []).slice().reverse();
      for (var j = 0; j < neighbors.length; j++) {
        var neighbor = neighbors[j];
        if (!visited[neighbor]) {
          nodeStates[neighbor] = 'active';
          stack.push(neighbor);
          callStack.push(neighbor);
          steps.push(snapshot(current, 'Push unvisited neighbor ' + neighbor + ' onto stack. Stack: [' + callStack + '].', 8));
        }
      }
    }

    steps.push(snapshot(-1, 'DFS complete! All reachable nodes visited. Traversal order explores each branch fully before backtracking.', 10));
    return steps;
  }

  // ── Render (canvas-based) ─────────────────────────────────────────────
  function onRender(ctx, step, meta) {
    var w = meta.width;
    var h = meta.height;
    ctx.clearRect(0, 0, w, h);

    if (!step) {
      ctx.fillStyle = cssVar('--text-tertiary');
      ctx.font = '14px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press Start to begin DFS traversal from node 0.', w / 2, h / 2);
      return;
    }

    var graphW = w * 0.62;
    var panelX = graphW + 8;
    var panelW = w - panelX - 8;
    var nodeR = 20;

    function nx(i) { return nodeLayout[i].fx * graphW; }
    function ny(i) { return nodeLayout[i].fy * h; }

    // ── Draw edges ──────────────────────────────────────────────────────
    var edges = step.edges || getEdges(defaultAdj);
    for (var e = 0; e < edges.length; e++) {
      var edge = edges[e];
      var fromState = step.nodes[edge.from].state;
      var toState = step.nodes[edge.to].state;
      var bothVisited = fromState === 'visited' && toState === 'visited';
      ctx.strokeStyle = bothVisited ? cssVar('--viz-found') : cssVar('--border-color');
      ctx.lineWidth = bothVisited ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(nx(edge.from), ny(edge.from));
      ctx.lineTo(nx(edge.to), ny(edge.to));
      ctx.stroke();
    }

    // ── Draw nodes ──────────────────────────────────────────────────────
    for (var ni = 0; ni < NUM_NODES; ni++) {
      var px = nx(ni), py = ny(ni);
      var state = step.nodes[ni].state;
      var isCurrent = (ni === step.currentNode);

      var fill = isCurrent ? cssVar('--viz-active')
        : state === 'visited' ? cssVar('--viz-found')
        : state === 'active' ? cssVar('--viz-compare') || '#f59e0b'
        : cssVar('--viz-cell-bg');
      var textColor = (isCurrent || state === 'visited') ? '#fff'
        : state === 'active' ? '#fff'
        : cssVar('--viz-cell-text');

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(px, py, nodeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isCurrent ? cssVar('--viz-active') : cssVar('--border-color');
      ctx.lineWidth = isCurrent ? 3 : 1.5;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 15px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ni), px, py);
    }

    // ── DFS Stack panel ─────────────────────────────────────────────────
    var stack = step.stack || [];
    ctx.fillStyle = cssVar('--text-secondary');
    ctx.font = 'bold 12px ' + cssVar('--font-mono');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('DFS STACK', panelX + panelW / 2, 20);
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '10px ' + cssVar('--font-mono');
    ctx.fillText('(top →)', panelX + panelW / 2, 32);

    if (stack.length === 0) {
      ctx.fillStyle = cssVar('--text-tertiary');
      ctx.font = '12px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('(empty)', panelX + panelW / 2, h / 2);
    } else {
      var cellH = 30, cellW = panelW - 12, cellGap = 4;
      var totalH = stack.length * (cellH + cellGap);
      var startY = Math.max(40, (h - totalH) / 2);
      // Draw from bottom (stack[0]) to top (stack[last]) visually bottom-up
      for (var si = 0; si < stack.length; si++) {
        var sy = startY + (stack.length - 1 - si) * (cellH + cellGap);
        var isTop = si === stack.length - 1;
        ctx.fillStyle = isTop ? cssVar('--viz-compare') || '#f59e0b' : cssVar('--viz-cell-bg');
        ctx.beginPath();
        ctx.roundRect(panelX + 6, sy, cellW, cellH, 4);
        ctx.fill();
        ctx.fillStyle = isTop ? '#fff' : cssVar('--viz-cell-text');
        ctx.font = (isTop ? 'bold ' : '') + '14px ' + cssVar('--font-sans');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(stack[si]), panelX + 6 + cellW / 2, sy + cellH / 2);
      }
    }

    // Legend
    var legY = h - 22;
    var legItems = [
      { color: cssVar('--viz-active'), label: 'current' },
      { color: cssVar('--viz-compare') || '#f59e0b', label: 'in stack' },
      { color: cssVar('--viz-found'), label: 'visited' }
    ];
    var legSpacing = 110;
    var legStartX = (graphW - legItems.length * legSpacing) / 2 + 10;
    for (var li = 0; li < legItems.length; li++) {
      var lx = legStartX + li * legSpacing;
      ctx.fillStyle = legItems[li].color;
      ctx.beginPath();
      ctx.arc(lx + 6, legY + 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cssVar('--text-secondary');
      ctx.font = '11px ' + cssVar('--font-sans');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(legItems[li].label, lx + 16, legY + 6);
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('graphs-canvas');
    if (!canvas) return;

    var explanationEl = document.querySelector('.viz-explanation');
    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('graphs', {
      canvas: canvas,
      tweenDuration: 0,
      onRender: onRender,
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step) explanationEl.textContent = step.description;
        else if (explanationEl) explanationEl.textContent = 'Press Start to begin DFS traversal from node 0.';
      }
    });

    var initialSteps = computeSteps(defaultAdj, 0);
    viz.setSteps([initialSteps[0]]);

    var startBtn = document.getElementById('graphs-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        viz.setSteps(computeSteps(defaultAdj, 0));
      });
    }
    var resetBtn = document.getElementById('graphs-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var s = computeSteps(defaultAdj, 0);
        viz.setSteps([s[0]]);
      });
    }
  }

  DSA.graphsViz = { init: init };
})();
