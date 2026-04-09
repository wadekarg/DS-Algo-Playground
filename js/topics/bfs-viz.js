var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;

  // Default adjacency list: a tree-like graph from node 0
  //       0
  //      / \
  //     1   2
  //    / \ / \
  //   3  4 5  6
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

  // Node positions laid out as a tree (relative to canvas size, computed in render)
  // Stored as fractions of canvas width/height so we can scale
  var nodeLayoutFractions = [
    { fx: 0.30, fy: 0.15 },  // 0 (root)
    { fx: 0.15, fy: 0.45 },  // 1
    { fx: 0.45, fy: 0.45 },  // 2
    { fx: 0.06, fy: 0.78 },  // 3
    { fx: 0.24, fy: 0.78 },  // 4
    { fx: 0.36, fy: 0.78 },  // 5
    { fx: 0.54, fy: 0.78 }   // 6
  ];

  var NODE_RADIUS = 22;

  // ── Colour helpers ────────────────────────────────────────
  function css(prop) {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  // ── Compute node positions from canvas dimensions ─────────
  function getNodePositions(w, h) {
    var positions = [];
    // Use left 60% of canvas for graph, right 40% for queue
    var graphW = w * 0.58;
    var graphH = h;
    for (var i = 0; i < nodeLayoutFractions.length; i++) {
      positions.push({
        x: nodeLayoutFractions[i].fx * graphW + 20,
        y: nodeLayoutFractions[i].fy * graphH + 10
      });
    }
    return positions;
  }

  // ── Compute edges (undirected, no duplicates) ─────────────
  function getEdges(adj) {
    var edges = [];
    var seen = {};
    for (var u = 0; u < NUM_NODES; u++) {
      if (!adj[u]) continue;
      for (var i = 0; i < adj[u].length; i++) {
        var v = adj[u][i];
        var key = Math.min(u, v) + '-' + Math.max(u, v);
        if (!seen[key]) {
          seen[key] = true;
          edges.push({ from: u, to: v });
        }
      }
    }
    return edges;
  }

  // ── Step pre-computation (BFS) ────────────────────────────
  function computeSteps(adj, startNode) {
    var steps = [];
    var visited = {};
    var queue = [];
    var nodeStates = {}; // 'unvisited', 'queued', 'visited'

    for (var i = 0; i < NUM_NODES; i++) {
      nodeStates[i] = 'unvisited';
    }

    var edges = getEdges(adj);

    // Helper to snapshot state
    function snapshot(currentNode, desc, codeLine, variables) {
      var nodes = [];
      for (var n = 0; n < NUM_NODES; n++) {
        nodes.push({ id: n, state: nodeStates[n] });
      }
      return {
        nodes: nodes,
        edges: edges,
        queue: queue.slice(),
        currentNode: currentNode,
        codeLine: codeLine || null,
        variables: variables || {},
        description: desc
      };
    }

    // Step 0: Initial state
    steps.push(snapshot(-1, 'BFS starts at node ' + startNode + '. All nodes are unvisited. The queue is empty.', 4, { start: startNode }));

    // Enqueue start node
    queue.push(startNode);
    nodeStates[startNode] = 'queued';
    visited[startNode] = true;
    steps.push(snapshot(startNode, 'Enqueue node ' + startNode + ' (the starting node). Mark it as discovered. Queue: [' + queue.join(', ') + '].', 5, { node: startNode }));

    while (queue.length > 0) {
      // Dequeue front
      var current = queue.shift();
      nodeStates[current] = 'visited';
      steps.push(snapshot(current, 'Dequeue node ' + current + ' from the front of the queue. Process it (mark as visited). Queue: [' + queue.join(', ') + '].', 7, { node: current }));

      // Visit neighbors
      var neighbors = adj[current] || [];
      for (var j = 0; j < neighbors.length; j++) {
        var neighbor = neighbors[j];
        if (!visited[neighbor]) {
          visited[neighbor] = true;
          queue.push(neighbor);
          nodeStates[neighbor] = 'queued';
          steps.push(snapshot(current, 'Neighbor ' + neighbor + ' of node ' + current + ' is unvisited. Enqueue it. Queue: [' + queue.join(', ') + '].', 10, { node: current, neighbor: neighbor }));
        }
      }
    }

    // Final
    steps.push(snapshot(-1, 'BFS complete! All reachable nodes have been visited. The queue is empty.', 6, {}));

    return steps;
  }

  // ── Get fill color for node state ─────────────────────────
  function nodeColor(state) {
    if (state === 'queued') return css('--viz-compare') || '#f59e0b';
    if (state === 'visited') return css('--viz-sorted') || '#22c55e';
    return css('--viz-cell-bg') || '#e2e8f0';
  }

  function nodeTextColor(state) {
    if (state === 'visited') return css('--bg-primary') || '#ffffff';
    return css('--viz-cell-text') || '#1e293b';
  }

  function nodeBorderColor(state, isCurrent) {
    if (isCurrent) return css('--viz-active') || '#ef4444';
    if (state === 'queued') return css('--viz-compare') || '#f59e0b';
    if (state === 'visited') return css('--viz-sorted') || '#22c55e';
    return css('--border-color') || '#e2e8f0';
  }

  // ── Canvas rendering ──────────────────────────────────────
  function renderStep(ctx, step, data) {
    var w = data.width;
    var h = data.height;
    var positions = getNodePositions(w, h);
    var edges = step ? step.edges : getEdges(defaultAdj);
    var nodeData = step ? step.nodes : null;
    var queueData = step ? step.queue : [];
    var currentNode = step ? step.currentNode : -1;

    // ── Draw title labels ───────────────────────────────────
    ctx.font = 'bold 13px ' + css('--font-sans');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = css('--text-tertiary') || '#94a3b8';
    ctx.fillText('Graph', w * 0.28, 4);
    ctx.fillText('Queue (FIFO)', w * 0.80, 4);

    // ── Draw edges ──────────────────────────────────────────
    for (var e = 0; e < edges.length; e++) {
      var fromPos = positions[edges[e].from];
      var toPos = positions[edges[e].to];

      ctx.strokeStyle = css('--viz-arrow') || '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
    }

    // ── Draw nodes ──────────────────────────────────────────
    for (var n = 0; n < NUM_NODES; n++) {
      var pos = positions[n];
      var state = nodeData ? nodeData[n].state : 'unvisited';
      var isCurrent = (n === currentNode);

      // Glow for current node
      if (isCurrent) {
        ctx.shadowColor = css('--viz-active') || '#ef4444';
        ctx.shadowBlur = 14;
      }

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor(state);
      ctx.fill();
      ctx.strokeStyle = nodeBorderColor(state, isCurrent);
      ctx.lineWidth = isCurrent ? 3 : 2;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Node label
      ctx.font = 'bold 15px ' + css('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = nodeTextColor(state);
      ctx.fillText(String(n), pos.x, pos.y);
    }

    // ── Draw queue visualization (right side, horizontal cells) ─
    var queueX = w * 0.64;
    var queueY = h * 0.38;
    var cellW = 40;
    var cellH = 40;
    var cellGap = 6;
    var maxCells = Math.min(7, Math.floor((w - queueX - 10) / (cellW + cellGap)));

    // "Front" label
    ctx.font = '11px ' + css('--font-mono');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = css('--text-tertiary') || '#94a3b8';
    if (queueData.length > 0) {
      ctx.fillText('front', queueX + cellW / 2, queueY - 4);
    }

    for (var q = 0; q < queueData.length && q < maxCells; q++) {
      var cx = queueX + q * (cellW + cellGap);
      var cy = queueY;
      var qNodeId = queueData[q];

      // Cell background
      ctx.fillStyle = css('--viz-compare') || '#f59e0b';
      ctx.beginPath();
      var r = 6;
      ctx.moveTo(cx + r, cy);
      ctx.lineTo(cx + cellW - r, cy);
      ctx.quadraticCurveTo(cx + cellW, cy, cx + cellW, cy + r);
      ctx.lineTo(cx + cellW, cy + cellH - r);
      ctx.quadraticCurveTo(cx + cellW, cy + cellH, cx + cellW - r, cy + cellH);
      ctx.lineTo(cx + r, cy + cellH);
      ctx.quadraticCurveTo(cx, cy + cellH, cx, cy + cellH - r);
      ctx.lineTo(cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = css('--border-color') || '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cell text
      ctx.font = 'bold 15px ' + css('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = css('--viz-cell-text') || '#1e293b';
      ctx.fillText(String(qNodeId), cx + cellW / 2, cy + cellH / 2);
    }

    // If queue is empty, show text
    if (queueData.length === 0) {
      ctx.font = '13px ' + css('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = css('--text-tertiary') || '#94a3b8';
      ctx.fillText('(empty)', w * 0.80, queueY + cellH / 2);
    }

    // ── Legend ───────────────────────────────────────────────
    var legendY = h - 28;
    var legendX = w * 0.64;
    var legendItems = [
      { label: 'Unvisited', color: css('--viz-cell-bg') || '#e2e8f0' },
      { label: 'In Queue', color: css('--viz-compare') || '#f59e0b' },
      { label: 'Visited', color: css('--viz-sorted') || '#22c55e' }
    ];
    ctx.font = '11px ' + css('--font-sans');
    ctx.textBaseline = 'middle';
    for (var l = 0; l < legendItems.length; l++) {
      var lx = legendX + l * 90;
      ctx.fillStyle = legendItems[l].color;
      ctx.beginPath();
      ctx.arc(lx, legendY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css('--border-color') || '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = css('--text-secondary') || '#475569';
      ctx.textAlign = 'left';
      ctx.fillText(legendItems[l].label, lx + 10, legendY);
    }
  }

  // ── Step change callback ──────────────────────────────────
  function onStepChange(step, data) {
    var explanationEl = document.querySelector('.viz-explanation');
    if (explanationEl && step) {
      explanationEl.textContent = step.description;
    } else if (explanationEl) {
      explanationEl.textContent = 'Click Start to begin BFS traversal from node 0.';
    }
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('bfs-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('bfs', {
      canvas: canvas,
      onRender: renderStep,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Wire start button
    var startBtn = document.getElementById('bfs-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        var steps = computeSteps(defaultAdj, 0);
        viz.setSteps(steps);
      });
    }

    // Wire reset button
    var resetBtn = document.getElementById('bfs-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        viz.reset();
        var initialSteps = computeSteps(defaultAdj, 0);
        viz.setSteps([initialSteps[0]]);
      });
    }

    // Set initial step
    var initialSteps = computeSteps(defaultAdj, 0);
    viz.setSteps([initialSteps[0]]);
  }

  DSA.bfsViz = { init: init };
})();
