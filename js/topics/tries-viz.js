var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var NODE_R = 18;

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  // ── Trie data structure ────────────────────────────────────────────────
  function TrieNode(ch) {
    this.ch = ch;
    this.children = {};
    this.isEnd = false;
    this.id = TrieNode.nextId++;
  }
  TrieNode.nextId = 0;

  function trieInsert(root, word) {
    var node = root;
    for (var i = 0; i < word.length; i++) {
      var c = word[i];
      if (!node.children[c]) {
        node.children[c] = new TrieNode(c);
      }
      node = node.children[c];
    }
    node.isEnd = true;
  }

  // Clone trie to snapshot state
  function cloneTrie(node) {
    var copy = { ch: node.ch, isEnd: node.isEnd, id: node.id, children: {} };
    for (var c in node.children) {
      copy.children[c] = cloneTrie(node.children[c]);
    }
    return copy;
  }

  // Compute layout positions for all trie nodes (DFS, left-to-right)
  function computeLayout(node, depth, positions, order, counter) {
    counter = counter || { x: 0 };
    var children = Object.keys(node.children).sort();
    for (var i = 0; i < children.length; i++) {
      computeLayout(node.children[children[i]], depth + 1, positions, order, counter);
    }
    if (children.length === 0) {
      positions[node.id] = { col: counter.x, depth: depth };
      counter.x++;
    } else {
      // Center parent over children
      var childCols = children.map(function(c) { return positions[node.children[c].id].col; });
      positions[node.id] = { col: (childCols[0] + childCols[childCols.length - 1]) / 2, depth: depth };
    }
    order.push(node.id);
  }

  // Flatten trie into list of {id, ch, isEnd, parentId, children}
  function flattenTrie(node, parentId, result) {
    result.push({ id: node.id, ch: node.ch, isEnd: node.isEnd, parentId: parentId });
    for (var c in node.children) {
      flattenTrie(node.children[c], node.id, result);
    }
    return result;
  }

  // ── Step generation: insert words one character at a time ─────────────
  function generateSteps(words) {
    TrieNode.nextId = 0;
    var steps = [];
    var root = new TrieNode('');

    function snap(activeIds, wordDone, desc, codeLine) {
      var snap_root = cloneTrie(root);
      var positions = {}, order = [];
      computeLayout(snap_root, 0, positions, order, { x: 0 });
      var nodes = flattenTrie(snap_root, null, []);
      steps.push({
        nodes: nodes,
        positions: positions,
        rootId: snap_root.id,
        activeIds: activeIds || [],
        wordDone: wordDone || '',
        description: desc,
        codeLine: codeLine || 1
      });
    }

    snap([], '', 'Trie (prefix tree): each node stores a character. Paths from root spell out words. We will insert: ' + words.map(function(w) { return '"' + w + '"'; }).join(', ') + '.', 1);

    for (var wi = 0; wi < words.length; wi++) {
      var word = words[wi];
      var node = root;
      var newIds = [];
      var pathIds = [];

      for (var ci = 0; ci < word.length; ci++) {
        var c = word[ci];
        var isNew = !node.children[c];
        if (isNew) {
          node.children[c] = new TrieNode(c);
          newIds.push(node.children[c].id);
        }
        node = node.children[c];
        pathIds.push(node.id);
        snap(pathIds.slice(), '', (isNew ? 'New node "' + c + '" created' : 'Node "' + c + '" already exists') + ' for word "' + word + '" at index ' + ci + '.', isNew ? 5 : 6);
      }
      node.isEnd = true;
      snap(pathIds, word, 'Word "' + word + '" fully inserted. Mark last node as end of word.', 7);
    }

    snap([], '', 'All words inserted! The trie supports O(k) search and prefix lookups where k = word length.', 7);
    return steps;
  }

  // ── Render ─────────────────────────────────────────────────────────────
  function onRender(ctx, step, meta) {
    var w = meta.width;
    var h = meta.height;
    ctx.clearRect(0, 0, w, h);

    if (!step || !step.nodes) {
      ctx.fillStyle = cssVar('--text-tertiary');
      ctx.font = '14px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press Run to build the trie step by step.', w / 2, h / 2);
      return;
    }

    var positions = step.positions;
    var nodes = step.nodes;
    var activeSet = {};
    for (var ai = 0; ai < step.activeIds.length; ai++) activeSet[step.activeIds[ai]] = true;

    // Find column range and depth range
    var maxCol = 0, maxDepth = 0;
    for (var id in positions) {
      if (positions[id].col > maxCol) maxCol = positions[id].col;
      if (positions[id].depth > maxDepth) maxDepth = positions[id].depth;
    }

    var padX = 40, padY = 50;
    var cols = maxCol + 1;
    var depths = maxDepth + 1;
    var colW = Math.max(40, (w - padX * 2) / Math.max(cols, 1));
    var rowH = Math.max(50, (h - padY * 2) / Math.max(depths, 1));

    function nodeX(id) { return padX + positions[id].col * colW; }
    function nodeY(id) { return padY + positions[id].depth * rowH; }

    // Build node map for edge drawing
    var nodeMap = {};
    for (var ni = 0; ni < nodes.length; ni++) nodeMap[nodes[ni].id] = nodes[ni];

    // Draw edges first (behind nodes)
    for (var ni = 0; ni < nodes.length; ni++) {
      var node = nodes[ni];
      if (node.parentId === null || !positions[node.id] || !positions[node.parentId]) continue;
      var px = nodeX(node.parentId), py = nodeY(node.parentId);
      var cx = nodeX(node.id), cy = nodeY(node.id);
      var isActive = activeSet[node.id];

      ctx.strokeStyle = isActive ? cssVar('--viz-active') : cssVar('--border-color');
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }

    // Draw nodes
    for (var ni = 0; ni < nodes.length; ni++) {
      var nd = nodes[ni];
      if (!positions[nd.id]) continue;
      var x = nodeX(nd.id), y = nodeY(nd.id);
      var isActive = activeSet[nd.id];
      var isRoot = nd.parentId === null;

      var fill = isRoot
        ? cssVar('--viz-cell-bg')
        : isActive
          ? (nd.isEnd ? cssVar('--viz-found') : cssVar('--viz-active'))
          : nd.isEnd
            ? (cssVar('--viz-sorted') || cssVar('--viz-found'))
            : cssVar('--viz-default');
      var textColor = isRoot ? cssVar('--viz-cell-text') : '#fff';

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
      ctx.fill();

      if (nd.isEnd && !isRoot) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = isRoot ? cssVar('--text-tertiary') : textColor;
      ctx.font = (isRoot ? '10px ' : 'bold 14px ') + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isRoot ? 'root' : nd.ch, x, y);

      // End-of-word marker dot
      if (nd.isEnd && !isRoot) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + NODE_R - 5, y - NODE_R + 5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Depth labels (levels)
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '10px ' + cssVar('--font-mono');
    ctx.textAlign = 'left';
    for (var d = 0; d <= maxDepth; d++) {
      ctx.textBaseline = 'middle';
      ctx.fillText('L' + d, 4, padY + d * rowH);
    }

    // Legend
    var legY = h - 20;
    var legItems = [
      { color: cssVar('--viz-active'), label: 'traversed' },
      { color: cssVar('--viz-found'), label: 'end of word' },
      { color: cssVar('--viz-default'), label: 'existing node' }
    ];
    var legSpacing = 140;
    var legStartX = (w - legItems.length * legSpacing) / 2;
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
    var canvas = document.getElementById('tries-canvas');
    if (!canvas) return;

    var explanationEl = document.querySelector('.viz-explanation');
    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('tries', {
      canvas: canvas,
      tweenDuration: 0,
      onRender: onRender,
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step) explanationEl.textContent = step.description;
        else if (explanationEl) explanationEl.textContent = 'Press Run to build the trie step by step.';
      }
    });

    var defaultWords = ['cat', 'car', 'cart', 'do', 'dot'];
    var steps = generateSteps(defaultWords);
    viz.setSteps([steps[0]]);

    var runBtn = document.getElementById('tries-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', function() {
        viz.setSteps(generateSteps(defaultWords));
      });
    }
    var resetBtn = document.getElementById('tries-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var s = generateSteps(defaultWords);
        viz.setSteps([s[0]]);
      });
    }
  }

  DSA.triesViz = { init: init };
})();
