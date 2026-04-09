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

  // Node positions laid out as a tree (relative to graph area, as fractions)
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
  var NS = 'http://www.w3.org/2000/svg';

  var svgWrap = null;
  var svgEl = null;
  var nodeEls = [];       // SVG <g> elements, indexed by node id
  var edgeEls = {};       // SVG <line> elements, keyed by 'min-max'
  var queuePanel = null;  // <g> for queue cells
  var svgW = 0;
  var svgH = 0;

  // ── SVG element factory ───────────────────────────────────────────────
  function svgMake(tag) {
    return document.createElementNS(NS, tag);
  }

  // ── Compute node positions from SVG dimensions ────────────────────────
  function getNodePositions(w, h) {
    var positions = [];
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

  // ── Compute edges (undirected, no duplicates) ─────────────────────────
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
          edges.push({ from: u, to: v, key: key });
        }
      }
    }
    return edges;
  }

  // ── Build SVG once ────────────────────────────────────────────────────
  function buildSVG(wrap) {
    wrap.innerHTML = '';

    var rect = wrap.getBoundingClientRect();
    var w = (rect.width > 20 ? rect.width : wrap.offsetWidth) || 640;
    var h = (rect.height > 20 ? rect.height : wrap.offsetHeight) || 350;
    if (h < 200) h = 350;

    svgW = w;
    svgH = h;

    var svg = svgMake('svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    wrap.appendChild(svg);
    svgEl = svg;

    var positions = getNodePositions(w, h);
    var edges = getEdges(defaultAdj);

    // ── Section labels ────────────────────────────────────────────────
    var graphLabel = svgMake('text');
    graphLabel.setAttribute('x', w * 0.28);
    graphLabel.setAttribute('y', '16');
    graphLabel.setAttribute('text-anchor', 'middle');
    graphLabel.setAttribute('font-size', '12');
    graphLabel.setAttribute('font-weight', '600');
    graphLabel.setAttribute('fill', 'var(--text-tertiary)');
    graphLabel.setAttribute('font-family', 'var(--font-sans, sans-serif)');
    graphLabel.textContent = 'Graph';
    svg.appendChild(graphLabel);

    var queueLabel = svgMake('text');
    queueLabel.setAttribute('x', w * 0.80);
    queueLabel.setAttribute('y', '16');
    queueLabel.setAttribute('text-anchor', 'middle');
    queueLabel.setAttribute('font-size', '12');
    queueLabel.setAttribute('font-weight', '600');
    queueLabel.setAttribute('fill', 'var(--text-tertiary)');
    queueLabel.setAttribute('font-family', 'var(--font-sans, sans-serif)');
    queueLabel.textContent = 'Queue (FIFO)';
    svg.appendChild(queueLabel);

    // ── Divider line ──────────────────────────────────────────────────
    var divider = svgMake('line');
    divider.setAttribute('x1', w * 0.62);
    divider.setAttribute('y1', 24);
    divider.setAttribute('x2', w * 0.62);
    divider.setAttribute('y2', h - 10);
    divider.setAttribute('stroke', 'var(--border-color)');
    divider.setAttribute('stroke-width', '1');
    divider.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(divider);

    // ── Edges ─────────────────────────────────────────────────────────
    var edgeGroup = svgMake('g');
    edgeGroup.setAttribute('class', 'svg-edges');
    for (var ei = 0; ei < edges.length; ei++) {
      var e = edges[ei];
      var fp = positions[e.from];
      var tp = positions[e.to];
      var line = svgMake('line');
      line.setAttribute('x1', fp.x);
      line.setAttribute('y1', fp.y);
      line.setAttribute('x2', tp.x);
      line.setAttribute('y2', tp.y);
      line.setAttribute('class', 'svg-edge svg-edge--default');
      edgeGroup.appendChild(line);
      edgeEls[e.key] = line;
    }
    svg.appendChild(edgeGroup);

    // ── Nodes ─────────────────────────────────────────────────────────
    nodeEls = [];
    for (var ni = 0; ni < NUM_NODES; ni++) {
      var pos = positions[ni];
      var g = svgMake('g');
      g.setAttribute('class', 'svg-node svg-node--default');
      g.setAttribute('transform', 'translate(' + pos.x + ',' + pos.y + ')');

      var circle = svgMake('circle');
      circle.setAttribute('r', NODE_RADIUS);
      g.appendChild(circle);

      var label = svgMake('text');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'central');
      label.textContent = String(ni);
      g.appendChild(label);

      svg.appendChild(g);
      nodeEls[ni] = g;
    }

    // ── Legend ────────────────────────────────────────────────────────
    var legendItems = [
      { label: 'Unvisited', cls: 'default' },
      { label: 'In Queue',  cls: 'queued' },
      { label: 'Visited',   cls: 'visited' }
    ];
    var legendY = h - 22;
    var legendX = w * 0.64;
    for (var li = 0; li < legendItems.length; li++) {
      var item = legendItems[li];
      var lx = legendX + li * 92;

      var lgNode = svgMake('g');
      lgNode.setAttribute('class', 'svg-node svg-node--' + item.cls);
      lgNode.setAttribute('transform', 'translate(' + (lx + 7) + ',' + legendY + ')');
      var lgC = svgMake('circle');
      lgC.setAttribute('r', '7');
      lgNode.appendChild(lgC);
      svg.appendChild(lgNode);

      var lgT = svgMake('text');
      lgT.setAttribute('x', lx + 18);
      lgT.setAttribute('y', legendY);
      lgT.setAttribute('dominant-baseline', 'central');
      lgT.setAttribute('font-size', '11');
      lgT.setAttribute('fill', 'var(--text-secondary)');
      lgT.setAttribute('font-family', 'var(--font-sans, sans-serif)');
      lgT.textContent = item.label;
      svg.appendChild(lgT);
    }

    // ── Queue panel group ─────────────────────────────────────────────
    queuePanel = svgMake('g');
    queuePanel.setAttribute('class', 'bfs-queue-panel');
    svg.appendChild(queuePanel);
  }

  // ── Update queue panel ────────────────────────────────────────────────
  function renderQueuePanel(queueData) {
    queuePanel.innerHTML = '';

    var CELL_W = 36;
    var CELL_H = 36;
    var CELL_GAP = 6;
    var panelX = svgW * 0.64;
    var panelY = svgH * 0.32;

    if (queueData.length === 0) {
      var emptyT = svgMake('text');
      emptyT.setAttribute('x', panelX + (svgW - panelX) / 2);
      emptyT.setAttribute('y', panelY + CELL_H / 2);
      emptyT.setAttribute('text-anchor', 'middle');
      emptyT.setAttribute('dominant-baseline', 'central');
      emptyT.setAttribute('font-size', '12');
      emptyT.setAttribute('fill', 'var(--text-tertiary)');
      emptyT.setAttribute('font-family', 'var(--font-sans, sans-serif)');
      emptyT.textContent = '(empty)';
      queuePanel.appendChild(emptyT);
      return;
    }

    // "front" label above first cell
    var frontLbl = svgMake('text');
    frontLbl.setAttribute('x', panelX + CELL_W / 2);
    frontLbl.setAttribute('y', panelY - 6);
    frontLbl.setAttribute('text-anchor', 'middle');
    frontLbl.setAttribute('font-size', '10');
    frontLbl.setAttribute('fill', 'var(--text-tertiary)');
    frontLbl.setAttribute('font-family', 'var(--font-mono, monospace)');
    frontLbl.textContent = 'front';
    queuePanel.appendChild(frontLbl);

    var maxCells = Math.min(queueData.length, Math.floor((svgW - panelX - 12) / (CELL_W + CELL_GAP)));

    for (var q = 0; q < maxCells; q++) {
      var cx = panelX + q * (CELL_W + CELL_GAP);

      var rect = svgMake('rect');
      rect.setAttribute('x', cx);
      rect.setAttribute('y', panelY);
      rect.setAttribute('width', CELL_W);
      rect.setAttribute('height', CELL_H);
      rect.setAttribute('rx', '5');
      rect.setAttribute('fill', 'var(--viz-compare, #f59e0b)');
      rect.setAttribute('stroke', 'var(--border-color)');
      rect.setAttribute('stroke-width', '1.5');
      queuePanel.appendChild(rect);

      var ct = svgMake('text');
      ct.setAttribute('x', cx + CELL_W / 2);
      ct.setAttribute('y', panelY + CELL_H / 2);
      ct.setAttribute('text-anchor', 'middle');
      ct.setAttribute('dominant-baseline', 'central');
      ct.setAttribute('font-size', '13');
      ct.setAttribute('font-weight', '700');
      ct.setAttribute('fill', '#fff');
      ct.setAttribute('font-family', 'var(--font-sans, sans-serif)');
      ct.setAttribute('pointer-events', 'none');
      ct.textContent = String(queueData[q]);
      queuePanel.appendChild(ct);
    }
  }

  // ── renderStep: only updates classes on existing SVG elements ─────────
  function renderStep(step) {
    if (!svgEl) return;

    // Determine node states
    var nodeData = step ? step.nodes : null;
    var currentNode = step ? step.currentNode : -1;
    var queueData = step ? step.queue : [];

    for (var ni = 0; ni < NUM_NODES; ni++) {
      var state = nodeData ? nodeData[ni].state : 'unvisited';
      var isCurrent = (ni === currentNode);
      var cls = 'svg-node ';

      if (isCurrent) {
        cls += 'svg-node--active';
      } else if (state === 'queued') {
        cls += 'svg-node--queued';
      } else if (state === 'visited') {
        cls += 'svg-node--visited';
      } else {
        cls += 'svg-node--default';
      }
      nodeEls[ni].setAttribute('class', cls);
    }

    // Update edge classes: traversed edges connect visited nodes
    var edges = getEdges(defaultAdj);
    for (var ei = 0; ei < edges.length; ei++) {
      var e = edges[ei];
      var lineEl = edgeEls[e.key];
      if (!lineEl) continue;
      var fromState = nodeData ? nodeData[e.from].state : 'unvisited';
      var toState   = nodeData ? nodeData[e.to].state   : 'unvisited';
      if ((fromState === 'visited' || e.from === currentNode) &&
          (toState   === 'visited' || e.to   === currentNode)) {
        lineEl.setAttribute('class', 'svg-edge svg-edge--traversed');
      } else {
        lineEl.setAttribute('class', 'svg-edge svg-edge--default');
      }
    }

    // Update queue panel
    renderQueuePanel(queueData);
  }

  // ── Step pre-computation (BFS) ────────────────────────────────────────
  function computeSteps(adj, startNode) {
    var steps = [];
    var visited = {};
    var queue = [];
    var nodeStates = {};

    for (var i = 0; i < NUM_NODES; i++) {
      nodeStates[i] = 'unvisited';
    }

    var edges = getEdges(adj);

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

    steps.push(snapshot(-1, 'BFS starts at node ' + startNode + '. All nodes are unvisited. The queue is empty.', 4, { start: startNode }));

    queue.push(startNode);
    nodeStates[startNode] = 'queued';
    visited[startNode] = true;
    steps.push(snapshot(startNode, 'Enqueue node ' + startNode + ' (the starting node). Mark it as discovered. Queue: [' + queue.join(', ') + '].', 5, { node: startNode }));

    while (queue.length > 0) {
      var current = queue.shift();
      nodeStates[current] = 'visited';
      steps.push(snapshot(current, 'Dequeue node ' + current + ' from the front of the queue. Process it (mark as visited). Queue: [' + queue.join(', ') + '].', 7, { node: current }));

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

    steps.push(snapshot(-1, 'BFS complete! All reachable nodes have been visited. The queue is empty.', 6, {}));

    return steps;
  }

  // ── Init ──────────────────────────────────────────────────────────────
  function init() {
    svgWrap = document.getElementById('bfs-svg-wrap');
    if (!svgWrap) return;

    // Set a minimum height
    if (!svgWrap.style.height) svgWrap.style.height = '350px';

    // Defer buildSVG until after layout so offsetWidth is correct
    requestAnimationFrame(function() { buildSVG(svgWrap); });

    var explanationEl = document.querySelector('.viz-explanation');

    // Hidden canvas for vizCore control binding
    var fakeCanvas = document.createElement('canvas');
    fakeCanvas.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
    var container = svgWrap.closest('.viz-container');
    if (container) container.appendChild(fakeCanvas);

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('bfs', {
      canvas: fakeCanvas,
      tweenDuration: 0,
      onRender: function(_ctx, step) {
        renderStep(step);
      },
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step) {
          explanationEl.textContent = step.description;
        } else if (explanationEl) {
          explanationEl.textContent = 'Click Start to begin BFS traversal from node 0.';
        }
      }
    });

    // Rebuild SVG on resize, preserving step state
    window.addEventListener('resize', function() {
      buildSVG(svgWrap);
      if (viz) viz.render();
    });

    // Set initial step
    var initialSteps = computeSteps(defaultAdj, 0);
    viz.setSteps([initialSteps[0]]);

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
        var steps = computeSteps(defaultAdj, 0);
        viz.setSteps([steps[0]]);
      });
    }
  }

  DSA.bfsViz = { init: init };
})();
