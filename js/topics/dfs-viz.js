var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;

  // Same graph as BFS for direct comparison
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

  // Same node positions as BFS
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
  var nodeEls = [];     // SVG <g> elements, indexed by node id
  var edgeEls = {};     // SVG <line> elements, keyed by 'min-max'
  var edgeLens = {};    // pixel length of each edge, keyed by 'min-max'
  var stackPanel = null; // <g> for stack cells
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

  // ── Compute pixel length of a line ───────────────────────────────────
  function lineLen(p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Build SVG once ────────────────────────────────────────────────────
  function buildSVG(wrap) {
    wrap.innerHTML = '';
    nodeEls = [];
    edgeEls = {};
    edgeLens = {};

    var w = wrap.offsetWidth || 640;
    var h = wrap.offsetHeight || 350;
    if (h < 200) h = 350;

    svgW = w;
    svgH = h;

    var svg = svgMake('svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
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

    var stackLabel = svgMake('text');
    stackLabel.setAttribute('x', w * 0.80);
    stackLabel.setAttribute('y', '16');
    stackLabel.setAttribute('text-anchor', 'middle');
    stackLabel.setAttribute('font-size', '12');
    stackLabel.setAttribute('font-weight', '600');
    stackLabel.setAttribute('fill', 'var(--text-tertiary)');
    stackLabel.setAttribute('font-family', 'var(--font-sans, sans-serif)');
    stackLabel.textContent = 'Stack (LIFO)';
    svg.appendChild(stackLabel);

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

    // ── Edges with dash animation setup ──────────────────────────────
    var edgeGroup = svgMake('g');
    edgeGroup.setAttribute('class', 'svg-edges');
    for (var ei = 0; ei < edges.length; ei++) {
      var e = edges[ei];
      var fp = positions[e.from];
      var tp = positions[e.to];
      var len = lineLen(fp, tp);

      var line = svgMake('line');
      line.setAttribute('x1', fp.x);
      line.setAttribute('y1', fp.y);
      line.setAttribute('x2', tp.x);
      line.setAttribute('y2', tp.y);
      // Start fully drawn (dashoffset = 0 = visible)
      // Traversed edges will animate: dashoffset set, then transitioned to 0
      line.setAttribute('stroke-dasharray', len);
      line.setAttribute('stroke-dashoffset', '0');
      line.setAttribute('class', 'svg-edge svg-edge--default');
      edgeGroup.appendChild(line);
      edgeEls[e.key] = line;
      edgeLens[e.key] = len;
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
      { label: 'On Stack',  cls: 'stacked' },
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

    // ── Stack panel group ─────────────────────────────────────────────
    stackPanel = svgMake('g');
    stackPanel.setAttribute('class', 'dfs-stack-panel');
    svg.appendChild(stackPanel);
  }

  // ── Update stack panel ────────────────────────────────────────────────
  function renderStackPanel(stackData) {
    stackPanel.innerHTML = '';

    var CELL_W = 42;
    var CELL_H = 34;
    var CELL_GAP = 5;
    // Stack panel: right of divider, arranged vertically (top = top of stack)
    var panelX = svgW * 0.64 + (svgW * 0.38 - CELL_W) / 2;
    var panelStartY = 32;
    var maxCells = Math.min(stackData.length, Math.floor((svgH - panelStartY - 50) / (CELL_H + CELL_GAP)));

    if (stackData.length === 0) {
      var emptyT = svgMake('text');
      emptyT.setAttribute('x', svgW * 0.80);
      emptyT.setAttribute('y', panelStartY + CELL_H);
      emptyT.setAttribute('text-anchor', 'middle');
      emptyT.setAttribute('dominant-baseline', 'central');
      emptyT.setAttribute('font-size', '12');
      emptyT.setAttribute('fill', 'var(--text-tertiary)');
      emptyT.setAttribute('font-family', 'var(--font-sans, sans-serif)');
      emptyT.textContent = '(empty)';
      stackPanel.appendChild(emptyT);
      return;
    }

    // Display: top of stack first (last element in array)
    var displayStack = stackData.slice().reverse();

    for (var s = 0; s < maxCells; s++) {
      var sy = panelStartY + s * (CELL_H + CELL_GAP);

      var rect = svgMake('rect');
      rect.setAttribute('x', panelX);
      rect.setAttribute('y', sy);
      rect.setAttribute('width', CELL_W);
      rect.setAttribute('height', CELL_H);
      rect.setAttribute('rx', '5');
      rect.setAttribute('fill', 'var(--viz-compare, #f59e0b)');
      rect.setAttribute('stroke', 'var(--border-color)');
      rect.setAttribute('stroke-width', '1.5');
      stackPanel.appendChild(rect);

      var ct = svgMake('text');
      ct.setAttribute('x', panelX + CELL_W / 2);
      ct.setAttribute('y', sy + CELL_H / 2);
      ct.setAttribute('text-anchor', 'middle');
      ct.setAttribute('dominant-baseline', 'central');
      ct.setAttribute('font-size', '13');
      ct.setAttribute('font-weight', '700');
      ct.setAttribute('fill', '#fff');
      ct.setAttribute('font-family', 'var(--font-sans, sans-serif)');
      ct.setAttribute('pointer-events', 'none');
      ct.textContent = String(displayStack[s]);
      stackPanel.appendChild(ct);

      // "top" label for first cell
      if (s === 0) {
        var topLbl = svgMake('text');
        topLbl.setAttribute('x', panelX + CELL_W + 6);
        topLbl.setAttribute('y', sy + CELL_H / 2);
        topLbl.setAttribute('dominant-baseline', 'central');
        topLbl.setAttribute('font-size', '10');
        topLbl.setAttribute('fill', 'var(--text-tertiary)');
        topLbl.setAttribute('font-family', 'var(--font-mono, monospace)');
        topLbl.textContent = '\u2190 top';
        stackPanel.appendChild(topLbl);
      }
    }
  }

  // ── renderStep: updates classes on existing SVG elements ─────────────
  function renderStep(step) {
    if (!svgEl) return;

    var nodeData = step ? step.nodes : null;
    var currentNode = step ? step.currentNode : -1;
    var stackData = step ? step.stack : [];

    // Update node classes
    for (var ni = 0; ni < NUM_NODES; ni++) {
      var state = nodeData ? nodeData[ni].state : 'unvisited';
      var isCurrent = (ni === currentNode);
      var cls = 'svg-node ';

      if (isCurrent) {
        cls += 'svg-node--active';
      } else if (state === 'stacked') {
        cls += 'svg-node--stacked';
      } else if (state === 'visited') {
        cls += 'svg-node--visited';
      } else {
        cls += 'svg-node--default';
      }
      nodeEls[ni].setAttribute('class', cls);
    }

    // Update edge classes with dash-draw animation
    var edges = getEdges(defaultAdj);
    for (var ei = 0; ei < edges.length; ei++) {
      var e = edges[ei];
      var lineEl = edgeEls[e.key];
      if (!lineEl) continue;

      var fromState = nodeData ? nodeData[e.from].state : 'unvisited';
      var toState   = nodeData ? nodeData[e.to].state   : 'unvisited';
      var fromVisited = (fromState === 'visited' || e.from === currentNode);
      var toVisited   = (toState   === 'visited' || e.to   === currentNode);
      var isTraversed = fromVisited && toVisited;

      if (isTraversed) {
        // Animate the line drawing: dashoffset=0 means fully drawn
        // CSS transition on stroke-dashoffset draws it over 0.5s
        var len = edgeLens[e.key] || 100;
        lineEl.setAttribute('stroke-dasharray', len);
        lineEl.setAttribute('stroke-dashoffset', '0');
        lineEl.setAttribute('class', 'svg-edge svg-edge--traversed');
      } else {
        // For backtracked/untraversed edges: show in muted/default style
        var len2 = edgeLens[e.key] || 100;
        lineEl.setAttribute('stroke-dasharray', len2);
        lineEl.setAttribute('stroke-dashoffset', '0');
        lineEl.setAttribute('class', 'svg-edge svg-edge--default');
      }
    }

    // Update stack panel
    renderStackPanel(stackData);
  }

  // ── Step pre-computation (iterative DFS with explicit stack) ──────────
  function computeSteps(adj, startNode) {
    var steps = [];
    var visited = {};
    var stack = [];
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
        stack: stack.slice(),
        currentNode: currentNode,
        codeLine: codeLine || null,
        variables: variables || {},
        description: desc
      };
    }

    steps.push(snapshot(-1, 'DFS starts at node ' + startNode + '. All nodes are unvisited. The stack is empty.', 2, { node: startNode }));

    stack.push(startNode);
    nodeStates[startNode] = 'stacked';
    steps.push(snapshot(startNode, 'Push node ' + startNode + ' onto the stack. Stack (top first): [' + stack.slice().reverse().join(', ') + '].', 3, { node: startNode }));

    while (stack.length > 0) {
      var current = stack.pop();

      if (nodeStates[current] === 'visited') {
        steps.push(snapshot(current, 'Pop node ' + current + ' from the stack, but it is already visited. Skip it. Stack: [' + stack.slice().reverse().join(', ') + '].', 3, { node: current }));
        continue;
      }

      nodeStates[current] = 'visited';
      visited[current] = true;
      steps.push(snapshot(current, 'Pop node ' + current + ' from the stack. Visit it (mark as visited). Stack: [' + stack.slice().reverse().join(', ') + '].', 4, { node: current }));

      var neighbors = adj[current] || [];
      var toPush = [];
      for (var j = 0; j < neighbors.length; j++) {
        if (!visited[neighbors[j]] && nodeStates[neighbors[j]] !== 'visited') {
          toPush.push(neighbors[j]);
        }
      }

      for (var k = toPush.length - 1; k >= 0; k--) {
        stack.push(toPush[k]);
        nodeStates[toPush[k]] = 'stacked';
      }

      if (toPush.length > 0) {
        steps.push(snapshot(current, 'Push unvisited neighbors of node ' + current + ': [' + toPush.join(', ') + '] onto the stack. Stack (top first): [' + stack.slice().reverse().join(', ') + '].', 6, { node: current }));
      }
    }

    steps.push(snapshot(-1, 'DFS complete! All reachable nodes have been visited. The stack is empty.', 7, {}));

    return steps;
  }

  // ── Init ──────────────────────────────────────────────────────────────
  function init() {
    svgWrap = document.getElementById('dfs-svg-wrap');
    if (!svgWrap) return;

    if (!svgWrap.style.height) svgWrap.style.height = '350px';

    buildSVG(svgWrap);

    var explanationEl = document.querySelector('.viz-explanation');

    // Hidden canvas for vizCore control binding
    var fakeCanvas = document.createElement('canvas');
    fakeCanvas.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
    var container = svgWrap.closest('.viz-container');
    if (container) container.appendChild(fakeCanvas);

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('dfs', {
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
          explanationEl.textContent = 'Click Start to begin DFS traversal from node 0.';
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
    var startBtn = document.getElementById('dfs-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        var steps = computeSteps(defaultAdj, 0);
        viz.setSteps(steps);
      });
    }

    // Wire reset button
    var resetBtn = document.getElementById('dfs-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var steps = computeSteps(defaultAdj, 0);
        viz.setSteps([steps[0]]);
      });
    }
  }

  DSA.dfsViz = { init: init };
})();
