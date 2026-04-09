var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var defaultN = 5;
  var currentN = defaultN;

  // ── Colour helpers ──────────────────────────────────────────────────
  function css(prop) {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  // ── Build the call tree structure ───────────────────────────────────
  function buildTree(n) {
    if (n <= 0) {
      return { n: n, value: 0, left: null, right: null };
    }
    if (n === 1) {
      return { n: n, value: 1, left: null, right: null };
    }
    var left = buildTree(n - 1);
    var right = buildTree(n - 2);
    return { n: n, value: left.value + right.value, left: left, right: right };
  }

  // ── Assign positions to tree nodes ──────────────────────────────────
  function layoutTree(node, depth, leftBound, rightBound) {
    if (!node) return [];
    var x = (leftBound + rightBound) / 2;
    var y = depth;
    var result = [{ n: node.n, value: node.value, x: x, y: y, left: null, right: null, isLeaf: !node.left && !node.right }];
    var mid = (leftBound + rightBound) / 2;

    if (node.left) {
      var leftNodes = layoutTree(node.left, depth + 1, leftBound, mid);
      result[0].left = leftNodes[0];
      result = result.concat(leftNodes);
    }
    if (node.right) {
      var rightNodes = layoutTree(node.right, depth + 1, mid, rightBound);
      result[0].right = rightNodes[0];
      result = result.concat(rightNodes);
    }

    return result;
  }

  // ── Generate steps by simulating DFS call order ─────────────────────
  function computeSteps(n) {
    var steps = [];
    var tree = buildTree(n);
    var treeWidth = Math.pow(2, n);
    var nodes = layoutTree(tree, 0, 0, treeWidth);

    // Each node gets a unique id based on its position in the nodes array
    // We track state: 'pending', 'calling', 'returning', 'completed'
    var nodeStates = {};
    for (var i = 0; i < nodes.length; i++) {
      nodeStates[i] = 'pending';
    }

    // Find node index by (n, x, y) -- unique combo
    function findNodeIdx(targetN, parentIdx) {
      // Find the child nodes of parentIdx in the tree
      for (var j = 0; j < nodes.length; j++) {
        if (nodes[j].n === targetN) {
          // Check if this is a child of the parent
          var parent = nodes[parentIdx];
          if (parent.left && parent.left.x === nodes[j].x && parent.left.y === nodes[j].y) {
            return j;
          }
          if (parent.right && parent.right.x === nodes[j].x && parent.right.y === nodes[j].y) {
            return j;
          }
        }
      }
      return -1;
    }

    // Initial state
    steps.push({
      nodes: nodes,
      states: copyStates(nodeStates),
      currentNode: -1,
      codeLine: 1,
      variables: { n: n },
      description: 'Start recursive Fibonacci computation for fib(' + n + '). The tree shows all recursive calls that will be made.'
    });

    // DFS traversal to generate steps
    function dfs(nodeIdx) {
      var node = nodes[nodeIdx];

      // Mark as calling
      nodeStates[nodeIdx] = 'calling';
      steps.push({
        nodes: nodes,
        states: copyStates(nodeStates),
        currentNode: nodeIdx,
        codeLine: node.isLeaf ? 2 : 3,
        variables: { n: node.n },
        description: 'Call fib(' + node.n + ')' + (node.isLeaf ? '. Base case: return ' + node.value + '.' : '. Need fib(' + (node.n - 1) + ') and fib(' + (node.n - 2) + ').')
      });

      if (node.isLeaf) {
        // Base case -- immediately complete
        nodeStates[nodeIdx] = 'completed';
        steps.push({
          nodes: nodes,
          states: copyStates(nodeStates),
          currentNode: nodeIdx,
          codeLine: 2,
          variables: { n: node.n, result: node.value },
          description: 'fib(' + node.n + ') = ' + node.value + ' (base case). Return ' + node.value + '.'
        });
        return;
      }

      // Recurse left
      if (node.left) {
        var leftIdx = -1;
        for (var j = 0; j < nodes.length; j++) {
          if (nodes[j].x === node.left.x && nodes[j].y === node.left.y) {
            leftIdx = j;
            break;
          }
        }
        if (leftIdx >= 0) dfs(leftIdx);
      }

      // Recurse right
      if (node.right) {
        var rightIdx = -1;
        for (var j2 = 0; j2 < nodes.length; j2++) {
          if (nodes[j2].x === node.right.x && nodes[j2].y === node.right.y) {
            rightIdx = j2;
            break;
          }
        }
        if (rightIdx >= 0) dfs(rightIdx);
      }

      // Return value
      nodeStates[nodeIdx] = 'returning';
      steps.push({
        nodes: nodes,
        states: copyStates(nodeStates),
        currentNode: nodeIdx,
        codeLine: 3,
        variables: { n: node.n, result: node.value },
        description: 'fib(' + node.n + ') = fib(' + (node.n - 1) + ') + fib(' + (node.n - 2) + ') = ' + nodes.filter(function(nd) { return nd.x === node.left.x && nd.y === node.left.y; })[0].value + ' + ' + nodes.filter(function(nd) { return nd.x === node.right.x && nd.y === node.right.y; })[0].value + ' = ' + node.value + '.'
      });

      nodeStates[nodeIdx] = 'completed';
      steps.push({
        nodes: nodes,
        states: copyStates(nodeStates),
        currentNode: nodeIdx,
        codeLine: 3,
        variables: { n: node.n, result: node.value },
        description: 'fib(' + node.n + ') = ' + node.value + ' computed and returned.'
      });
    }

    dfs(0);

    // Final step
    steps.push({
      nodes: nodes,
      states: copyStates(nodeStates),
      currentNode: -1,
      codeLine: 3,
      variables: { n: n, result: nodes[0].value },
      description: 'Done! fib(' + n + ') = ' + nodes[0].value + '. Total recursive calls: ' + nodes.length + '. Notice the repeated subproblems -- this is why DP is more efficient.'
    });

    return steps;
  }

  function copyStates(states) {
    var copy = {};
    for (var key in states) {
      if (states.hasOwnProperty(key)) {
        copy[key] = states[key];
      }
    }
    return copy;
  }

  // ── Canvas rendering ────────────────────────────────────────────────
  function renderStep(ctx, step, data) {
    var w = data.width;
    var h = data.height;

    if (!step) return;

    var nodes = step.nodes;
    var states = step.states;

    // Find tree dimensions
    var maxDepth = 0;
    var minX = Infinity;
    var maxX = -Infinity;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].y > maxDepth) maxDepth = nodes[i].y;
      if (nodes[i].x < minX) minX = nodes[i].x;
      if (nodes[i].x > maxX) maxX = nodes[i].x;
    }

    var xRange = maxX - minX || 1;
    var paddingX = 50;
    var paddingTop = 40;
    var paddingBottom = 30;
    var availW = w - 2 * paddingX;
    var availH = h - paddingTop - paddingBottom;
    var levelH = maxDepth > 0 ? availH / maxDepth : availH;
    var nodeRadius = Math.min(22, Math.max(14, availW / (nodes.length + 2)));

    function mapX(nx) {
      return paddingX + ((nx - minX) / xRange) * availW;
    }

    function mapY(ny) {
      return paddingTop + ny * levelH;
    }

    // Draw edges first
    for (var j = 0; j < nodes.length; j++) {
      var node = nodes[j];
      var px = mapX(node.x);
      var py = mapY(node.y);

      if (node.left) {
        var lx = mapX(node.left.x);
        var ly = mapY(node.left.y);
        var leftState = 'pending';
        for (var li = 0; li < nodes.length; li++) {
          if (nodes[li].x === node.left.x && nodes[li].y === node.left.y) {
            leftState = states[li];
            break;
          }
        }
        ctx.strokeStyle = leftState === 'completed' ? css('--viz-found') : leftState === 'pending' ? css('--viz-arrow') : css('--viz-compare');
        ctx.lineWidth = leftState === 'pending' ? 1.5 : 2;
        ctx.beginPath();
        ctx.moveTo(px, py + nodeRadius);
        ctx.lineTo(lx, ly - nodeRadius);
        ctx.stroke();
      }

      if (node.right) {
        var rx = mapX(node.right.x);
        var ry = mapY(node.right.y);
        var rightState = 'pending';
        for (var ri = 0; ri < nodes.length; ri++) {
          if (nodes[ri].x === node.right.x && nodes[ri].y === node.right.y) {
            rightState = states[ri];
            break;
          }
        }
        ctx.strokeStyle = rightState === 'completed' ? css('--viz-found') : rightState === 'pending' ? css('--viz-arrow') : css('--viz-compare');
        ctx.lineWidth = rightState === 'pending' ? 1.5 : 2;
        ctx.beginPath();
        ctx.moveTo(px, py + nodeRadius);
        ctx.lineTo(rx, ry - nodeRadius);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (var n = 0; n < nodes.length; n++) {
      var nd = nodes[n];
      var nx = mapX(nd.x);
      var ny = mapY(nd.y);
      var state = states[n];
      var isCurrent = step.currentNode === n;

      // Node fill color based on state
      var fillColor;
      var textColor = '#ffffff';
      var borderColor = null;

      if (state === 'completed') {
        fillColor = css('--viz-found');
      } else if (state === 'returning') {
        fillColor = css('--viz-compare');
      } else if (state === 'calling') {
        fillColor = css('--viz-active');
      } else {
        fillColor = css('--viz-cell-bg');
        textColor = css('--viz-cell-text');
      }

      if (isCurrent) {
        ctx.shadowColor = fillColor;
        ctx.shadowBlur = 14;
      }

      // Draw circle
      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      if (isCurrent) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (state !== 'pending') {
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = css('--border-color');
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Label
      var labelFontSize = Math.min(12, Math.max(9, nodeRadius * 0.6));
      ctx.font = 'bold ' + labelFontSize + 'px ' + css('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;

      if (state === 'completed' || state === 'returning') {
        // Show value
        ctx.fillText('f(' + nd.n + ')=' + nd.value, nx, ny);
      } else {
        ctx.fillText('f(' + nd.n + ')', nx, ny);
      }
    }
  }

  // ── Step change callback ────────────────────────────────────────────
  function onStepChange(step, data) {
    var explanationEl = document.querySelector('.viz-explanation');
    if (explanationEl && step) {
      explanationEl.textContent = step.description;
    } else if (explanationEl) {
      explanationEl.textContent = 'Set n and click Start to visualize the recursive call tree.';
    }
  }

  // ── Run ─────────────────────────────────────────────────────────────
  function runRecursion() {
    var nInput = document.getElementById('rec-n-input');
    if (nInput) {
      var val = parseInt(nInput.value, 10);
      if (!isNaN(val) && val >= 0 && val <= 8) {
        currentN = val;
      }
    }
    var steps = computeSteps(currentN);
    viz.setSteps(steps);
  }

  // ── Init ────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('recursion-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('recursion', {
      canvas: canvas,
      onRender: renderStep,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Wire n input
    var nInput = document.getElementById('rec-n-input');
    if (nInput) {
      nInput.value = currentN;
      nInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          runRecursion();
        }
      });
    }

    // Wire start button
    var startBtn = document.getElementById('rec-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        runRecursion();
      });
    }

    // Initial run
    runRecursion();
  }

  DSA.recursionViz = { init: init };
})();
