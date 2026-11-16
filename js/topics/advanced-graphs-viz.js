var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  // Fixed 5-node weighted graph for Dijkstra demo
  // Nodes: 0-4, Source: 0
  // Edges: 0→1(4), 0→2(1), 2→1(2), 1→3(5), 2→4(8), 4→3(2)
  var EDGES = [
    { from: 0, to: 1, w: 4 },
    { from: 0, to: 2, w: 1 },
    { from: 2, to: 1, w: 2 },
    { from: 1, to: 3, w: 5 },
    { from: 2, to: 4, w: 8 },
    { from: 4, to: 3, w: 2 }
  ];
  var NUM_NODES = 5;

  // Node positions (fractions of canvas)
  var NODE_POS = [
    { fx: 0.12, fy: 0.5  },  // 0 — left
    { fx: 0.38, fy: 0.22 },  // 1 — top-center
    { fx: 0.38, fy: 0.75 },  // 2 — bottom-center
    { fx: 0.62, fy: 0.22 },  // 3 — top-right
    { fx: 0.62, fy: 0.75 }   // 4 — bottom-right
  ];

  var INF = Infinity;

  // ── Step generation: Dijkstra from node 0 ─────────────────────────────
  function generateSteps() {
    var steps = [];
    var dist = new Array(NUM_NODES).fill(INF);
    var visited = new Array(NUM_NODES).fill(false);
    dist[0] = 0;

    function adj(node) {
      var neighbors = [];
      for (var e = 0; e < EDGES.length; e++) {
        if (EDGES[e].from === node) neighbors.push({ node: EDGES[e].to, w: EDGES[e].w });
      }
      return neighbors;
    }

    function snap(currentNode, updatedNode, activeEdge, desc, codeLine) {
      steps.push({
        dist: dist.slice(),
        visited: visited.slice(),
        currentNode: currentNode !== undefined ? currentNode : -1,
        updatedNode: updatedNode !== undefined ? updatedNode : -1,
        activeEdge: activeEdge || null,
        codeLine: codeLine || 1,
        description: desc
      });
    }

    snap(-1, -1, null, 'Dijkstra\'s algorithm: find shortest path from node 0 to all other nodes. All distances start at ∞ except dist[0] = 0.', 3);

    for (var iter = 0; iter < NUM_NODES; iter++) {
      // Pick unvisited node with minimum distance
      var u = -1;
      for (var i = 0; i < NUM_NODES; i++) {
        if (!visited[i] && dist[i] < INF) {
          if (u === -1 || dist[i] < dist[u]) u = i;
        }
      }
      if (u === -1) break;

      visited[u] = true;
      snap(u, -1, null, 'Visit node ' + u + ' (dist = ' + dist[u] + '). It has the smallest unvisited distance. Mark it visited.', 6);

      var neighbors = adj(u);
      for (var j = 0; j < neighbors.length; j++) {
        var v = neighbors[j].node;
        var w = neighbors[j].w;
        if (!visited[v]) {
          var newDist = dist[u] + w;
          snap(u, -1, { from: u, to: v }, 'Check edge ' + u + '→' + v + ' (weight ' + w + '). dist[' + u + '] + ' + w + ' = ' + newDist + ' vs current dist[' + v + '] = ' + (dist[v] === INF ? '∞' : dist[v]) + '.', 8);
          if (newDist < dist[v]) {
            var old = dist[v];
            dist[v] = newDist;
            snap(u, v, { from: u, to: v }, 'Update dist[' + v + '] from ' + (old === INF ? '∞' : old) + ' to ' + newDist + ' (shorter path found via node ' + u + ').', 9);
          } else {
            snap(u, -1, null, 'No update for node ' + v + ': current dist (' + dist[v] + ') ≤ new path (' + newDist + ').', 8);
          }
        }
      }
    }

    snap(-1, -1, null, 'Done! Shortest distances from node 0: [' + dist.map(function(d) { return d === INF ? '∞' : d; }).join(', ') + '].', 11);
    return steps;
  }

  // ── Render ─────────────────────────────────────────────────────────────
  function onRender(ctx, step, meta) {
    var w = meta.width;
    var h = meta.height;
    ctx.clearRect(0, 0, w, h);

    if (!step) {
      ctx.fillStyle = cssVar('--text-tertiary');
      ctx.font = '14px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press Run to visualize Dijkstra\'s algorithm.', w / 2, h / 2);
      return;
    }

    var graphW = w * 0.62;
    var tableX = graphW + 8;
    var tableW = w - tableX - 8;
    var nodeR = 22;

    function nx(fi) { return NODE_POS[fi].fx * graphW; }
    function ny(fi) { return NODE_POS[fi].fy * h; }

    // ── Draw edges ──────────────────────────────────────────────────────
    for (var e = 0; e < EDGES.length; e++) {
      var edge = EDGES[e];
      var sx = nx(edge.from), sy = ny(edge.from);
      var ex = nx(edge.to), ey = ny(edge.to);

      var isActive = step.activeEdge && step.activeEdge.from === edge.from && step.activeEdge.to === edge.to;
      var fromVisited = step.visited[edge.from];
      var toVisited = step.visited[edge.to];

      ctx.strokeStyle = isActive ? cssVar('--viz-active') : (fromVisited && toVisited ? cssVar('--viz-found') : cssVar('--border-color'));
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Weight label
      var mx = (sx + ex) / 2;
      var my = (sy + ey) / 2;
      ctx.fillStyle = cssVar('--bg-primary') || '#fff';
      ctx.beginPath();
      ctx.arc(mx, my, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isActive ? cssVar('--viz-active') : cssVar('--text-secondary');
      ctx.font = 'bold 12px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(edge.w), mx, my);
    }

    // ── Draw nodes ──────────────────────────────────────────────────────
    for (var ni = 0; ni < NUM_NODES; ni++) {
      var px = nx(ni), py = ny(ni);
      var isCurrent = (ni === step.currentNode);
      var isUpdated = (ni === step.updatedNode);
      var isVisited = step.visited[ni];

      var fill = isUpdated ? cssVar('--viz-swap') : (isCurrent ? cssVar('--viz-active') : (isVisited ? cssVar('--viz-found') : cssVar('--viz-cell-bg')));
      var textColor = (isCurrent || isVisited || isUpdated) ? '#fff' : cssVar('--viz-cell-text');

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(px, py, nodeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isCurrent ? cssVar('--viz-active') : cssVar('--border-color');
      ctx.lineWidth = isCurrent ? 3 : 1.5;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ni), px, py);
    }

    // ── Distance table ──────────────────────────────────────────────────
    var rowH = 30;
    var tableY = (h - (NUM_NODES + 1) * rowH) / 2;

    // Header
    ctx.fillStyle = cssVar('--viz-default');
    ctx.beginPath();
    ctx.roundRect(tableX, tableY, tableW, rowH, [4, 4, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px ' + cssVar('--font-sans');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Node    dist', tableX + tableW / 2, tableY + rowH / 2);

    for (var ri = 0; ri < NUM_NODES; ri++) {
      var ry = tableY + (ri + 1) * rowH;
      var isRowCurrent = (ri === step.currentNode);
      var isRowUpdated = (ri === step.updatedNode);
      var isRowVisited = step.visited[ri];

      var rowFill = isRowUpdated ? cssVar('--viz-swap') : (isRowCurrent ? cssVar('--viz-active') : (isRowVisited ? cssVar('--viz-found') : (ri % 2 === 0 ? cssVar('--bg-secondary') : cssVar('--bg-primary'))));
      ctx.fillStyle = rowFill;
      ctx.beginPath();
      ctx.rect(tableX, ry, tableW, rowH);
      ctx.fill();

      var rTextColor = (isRowCurrent || isRowUpdated || isRowVisited) ? '#fff' : cssVar('--viz-cell-text');
      ctx.fillStyle = rTextColor;
      ctx.font = (isRowCurrent || isRowUpdated ? 'bold ' : '') + '13px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var distStr = step.dist[ri] === INF ? '∞' : String(step.dist[ri]);
      ctx.fillText(String(ri) + '          ' + distStr, tableX + tableW / 2, ry + rowH / 2);
    }

    // Table border
    ctx.strokeStyle = cssVar('--border-color');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tableX, tableY, tableW, (NUM_NODES + 1) * rowH, 4);
    ctx.stroke();
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('advanced-graphs-canvas');
    if (!canvas) return;

    var explanationEl = document.querySelector('.viz-explanation');
    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('advanced-graphs', {
      canvas: canvas,
      tweenDuration: 0,
      onRender: onRender,
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step) explanationEl.textContent = step.description;
        else if (explanationEl) explanationEl.textContent = 'Press Run to visualize Dijkstra\'s algorithm.';
      }
    });

    var steps = generateSteps();
    viz.setSteps([steps[0]]);

    var runBtn = document.getElementById('advanced-graphs-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', function() {
        viz.setSteps(generateSteps());
      });
    }
    var resetBtn = document.getElementById('advanced-graphs-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var s = generateSteps();
        viz.setSteps([s[0]]);
      });
    }
  }

  DSA.advancedGraphsViz = { init: init };
})();
