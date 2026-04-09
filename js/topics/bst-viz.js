var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var root = null;
  var explanationEl = null;
  var svgWrap = null;
  var svgEl = null;
  var NODE_R = 22;
  var LEVEL_H = 80;

  // ── BST Node constructor ──────────────────────────────────────────
  function BSTNode(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }

  // ── Deep-clone the tree ───────────────────────────────────────────
  function cloneTree(node) {
    if (!node) return null;
    var copy = new BSTNode(node.val);
    copy.left = cloneTree(node.left);
    copy.right = cloneTree(node.right);
    return copy;
  }

  // ── BST insert (mutates tree) ─────────────────────────────────────
  function bstInsert(root, val) {
    if (!root) return new BSTNode(val);
    if (val < root.val) {
      root.left = bstInsert(root.left, val);
    } else if (val > root.val) {
      root.right = bstInsert(root.right, val);
    }
    return root;
  }

  // ── Find inorder successor (minimum in right subtree) ─────────────
  function findMin(node) {
    while (node.left) node = node.left;
    return node;
  }

  // ── BST delete (mutates tree) ─────────────────────────────────────
  function bstDelete(root, val) {
    if (!root) return null;
    if (val < root.val) {
      root.left = bstDelete(root.left, val);
    } else if (val > root.val) {
      root.right = bstDelete(root.right, val);
    } else {
      if (!root.left && !root.right) {
        return null;
      } else if (!root.left) {
        return root.right;
      } else if (!root.right) {
        return root.left;
      } else {
        var successor = findMin(root.right);
        root.val = successor.val;
        root.right = bstDelete(root.right, successor.val);
      }
    }
    return root;
  }

  // ── Check if value exists in tree ─────────────────────────────────
  function bstContains(node, val) {
    if (!node) return false;
    if (val === node.val) return true;
    if (val < node.val) return bstContains(node.left, val);
    return bstContains(node.right, val);
  }

  // ── Step generation: Insert ───────────────────────────────────────
  function generateInsertSteps(val) {
    var steps = [];

    if (bstContains(root, val)) {
      steps.push({
        tree: cloneTree(root),
        highlighted: [],
        found: null,
        description: 'Value ' + val + ' already exists in the tree. Duplicates are not inserted.'
      });
      return steps;
    }

    steps.push({
      tree: cloneTree(root),
      highlighted: [],
      found: null,
      codeLine: 2,
      variables: { val: val },
      description: 'Insert ' + val + ': starting at the root.'
    });

    var node = root;
    var path = [];

    while (node) {
      path.push(node.val);
      steps.push({
        tree: cloneTree(root),
        highlighted: path.slice(),
        found: null,
        codeLine: val < node.val ? 4 : 6,
        variables: { val: val, node: node.val },
        description: 'Compare ' + val + ' with node ' + node.val + '. ' +
          (val < node.val ? val + ' < ' + node.val + ', go left.' : val + ' > ' + node.val + ', go right.')
      });

      if (val < node.val) {
        if (!node.left) break;
        node = node.left;
      } else {
        if (!node.right) break;
        node = node.right;
      }
    }

    root = bstInsert(root, val);

    steps.push({
      tree: cloneTree(root),
      highlighted: [val],
      found: val,
      codeLine: 3,
      variables: { val: val },
      description: 'Inserted ' + val + ' as a ' + (node && val < node.val ? 'left' : 'right') + ' child of ' + (node ? node.val : 'root') + '.'
    });

    steps.push({
      tree: cloneTree(root),
      highlighted: [],
      found: null,
      codeLine: 7,
      variables: { val: val },
      description: 'Insert complete. Value ' + val + ' has been added to the BST.'
    });

    return steps;
  }

  // ── Step generation: Search ───────────────────────────────────────
  function generateSearchSteps(val) {
    var steps = [];

    if (!root) {
      steps.push({
        tree: null,
        highlighted: [],
        found: null,
        description: 'Tree is empty. Cannot search for ' + val + '.'
      });
      return steps;
    }

    steps.push({
      tree: cloneTree(root),
      highlighted: [],
      found: null,
      codeLine: 11,
      variables: { val: val },
      description: 'Search for ' + val + ': starting at the root.'
    });

    var node = root;
    var path = [];

    while (node) {
      path.push(node.val);

      if (node.val === val) {
        steps.push({
          tree: cloneTree(root),
          highlighted: path.slice(),
          found: val,
          codeLine: 11,
          variables: { val: val, node: node.val },
          description: 'Found ' + val + '! Node matches the search value.'
        });
        steps.push({
          tree: cloneTree(root),
          highlighted: [],
          found: val,
          codeLine: 11,
          variables: { val: val },
          description: 'Search complete. Value ' + val + ' exists in the BST.'
        });
        return steps;
      }

      steps.push({
        tree: cloneTree(root),
        highlighted: path.slice(),
        found: null,
        codeLine: val < node.val ? 13 : 14,
        variables: { val: val, node: node.val },
        description: 'Compare ' + val + ' with node ' + node.val + '. ' +
          (val < node.val ? val + ' < ' + node.val + ', go left.' : val + ' > ' + node.val + ', go right.')
      });

      if (val < node.val) {
        node = node.left;
      } else {
        node = node.right;
      }
    }

    steps.push({
      tree: cloneTree(root),
      highlighted: path.slice(),
      found: null,
      codeLine: 11,
      variables: { val: val },
      description: 'Reached a null child. Value ' + val + ' is not in the BST.'
    });

    return steps;
  }

  // ── Step generation: Delete ───────────────────────────────────────
  function generateDeleteSteps(val) {
    var steps = [];

    if (!root) {
      steps.push({
        tree: null,
        highlighted: [],
        found: null,
        description: 'Tree is empty. Cannot delete ' + val + '.'
      });
      return steps;
    }

    if (!bstContains(root, val)) {
      steps.push({
        tree: cloneTree(root),
        highlighted: [],
        found: null,
        description: 'Value ' + val + ' does not exist in the tree. Nothing to delete.'
      });
      return steps;
    }

    steps.push({
      tree: cloneTree(root),
      highlighted: [],
      found: null,
      description: 'Delete ' + val + ': searching for the node.'
    });

    var node = root;
    var path = [];

    while (node) {
      path.push(node.val);

      if (node.val === val) {
        var caseDesc;
        if (!node.left && !node.right) {
          caseDesc = 'Node ' + val + ' is a leaf. Simply remove it.';
        } else if (!node.left || !node.right) {
          var child = node.left || node.right;
          caseDesc = 'Node ' + val + ' has one child (' + child.val + '). Replace node with its child.';
        } else {
          var successor = findMin(node.right);
          caseDesc = 'Node ' + val + ' has two children. Replace with inorder successor (' + successor.val + '), then delete the successor.';
        }

        steps.push({
          tree: cloneTree(root),
          highlighted: path.slice(),
          found: val,
          description: 'Found node ' + val + '. ' + caseDesc
        });
        break;
      }

      steps.push({
        tree: cloneTree(root),
        highlighted: path.slice(),
        found: null,
        description: 'Compare ' + val + ' with node ' + node.val + '. ' +
          (val < node.val ? val + ' < ' + node.val + ', go left.' : val + ' > ' + node.val + ', go right.')
      });

      if (val < node.val) {
        node = node.left;
      } else {
        node = node.right;
      }
    }

    root = bstDelete(root, val);

    steps.push({
      tree: cloneTree(root),
      highlighted: [],
      found: null,
      description: 'Delete complete. Node ' + val + ' has been removed from the BST.'
    });

    return steps;
  }

  // ── Step generation: Inorder traversal ────────────────────────────
  function generateInorderSteps() {
    var steps = [];

    if (!root) {
      steps.push({ tree: null, highlighted: [], found: null, description: 'Tree is empty. Nothing to traverse.' });
      return steps;
    }

    steps.push({ tree: cloneTree(root), highlighted: [], found: null, description: 'Inorder traversal: visit Left subtree, then Node, then Right subtree.' });

    var visited = [];

    function inorder(node) {
      if (!node) return;
      steps.push({ tree: cloneTree(root), highlighted: visited.concat([node.val]), found: null, description: 'Visiting node ' + node.val + '. First, go to its left subtree.' });
      inorder(node.left);
      visited.push(node.val);
      steps.push({ tree: cloneTree(root), highlighted: visited.slice(), found: node.val, description: 'Process node ' + node.val + '. Inorder so far: [' + visited.join(', ') + ']. Now go to its right subtree.' });
      inorder(node.right);
    }

    inorder(root);
    steps.push({ tree: cloneTree(root), highlighted: visited.slice(), found: null, description: 'Inorder traversal complete: [' + visited.join(', ') + '].' });
    return steps;
  }

  // ── Step generation: Preorder traversal ───────────────────────────
  function generatePreorderSteps() {
    var steps = [];

    if (!root) {
      steps.push({ tree: null, highlighted: [], found: null, description: 'Tree is empty. Nothing to traverse.' });
      return steps;
    }

    steps.push({ tree: cloneTree(root), highlighted: [], found: null, description: 'Preorder traversal: visit Node first, then Left subtree, then Right subtree.' });

    var visited = [];

    function preorder(node) {
      if (!node) return;
      visited.push(node.val);
      steps.push({ tree: cloneTree(root), highlighted: visited.slice(), found: node.val, description: 'Process node ' + node.val + '. Preorder so far: [' + visited.join(', ') + ']. Now go to its left subtree.' });
      preorder(node.left);
      if (node.right) {
        steps.push({ tree: cloneTree(root), highlighted: visited.slice(), found: null, description: 'Left subtree of ' + node.val + ' done. Now go to its right subtree.' });
      }
      preorder(node.right);
    }

    preorder(root);
    steps.push({ tree: cloneTree(root), highlighted: visited.slice(), found: null, description: 'Preorder traversal complete: [' + visited.join(', ') + '].' });
    return steps;
  }

  // ── SVG helpers ───────────────────────────────────────────────────
  function svgEl_make(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function buildSVG(wrap) {
    var svg = svgEl_make('svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrap.innerHTML = '';
    wrap.appendChild(svg);
    return svg;
  }

  // ── Compute positions via inorder traversal ───────────────────────
  // Returns array of {val, x, y, parentVal, inorderIdx, depth}
  function computeLayout(treeRoot, svgW) {
    if (!treeRoot) return [];

    var nodes = [];
    var inorderIdx = 0;
    var RADIUS = NODE_R;
    var PAD_X = RADIUS + 10;
    // First pass: collect in inorder, record depth and parentVal
    function traverse(node, depth, parentVal) {
      if (!node) return;
      traverse(node.left, depth + 1, node.val);
      nodes.push({
        val: node.val,
        depth: depth,
        parentVal: parentVal,
        inorderIdx: inorderIdx,
        x: 0,
        y: 0,
        leftChildVal: node.left ? node.left.val : null,
        rightChildVal: node.right ? node.right.val : null
      });
      inorderIdx++;
      traverse(node.right, depth + 1, node.val);
    }
    traverse(treeRoot, 0, null);

    var count = nodes.length;
    var usableW = svgW - PAD_X * 2;

    nodes.forEach(function(n) {
      n.x = PAD_X + (count > 1 ? (n.inorderIdx / (count - 1)) * usableW : svgW / 2);
      n.y = 40 + n.depth * LEVEL_H;
    });

    return nodes;
  }

  // ── Render a step to SVG ──────────────────────────────────────────
  function renderStep(step) {
    if (!svgEl || !svgWrap) return;

    var w = svgWrap.offsetWidth || 600;
    var h = svgWrap.offsetHeight || 400;
    svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svgEl.setAttribute('width', w);
    svgEl.setAttribute('height', h);

    var tree = step ? step.tree : root;

    if (!tree) {
      svgEl.innerHTML = '';
      var msg = svgEl_make('text');
      msg.setAttribute('x', w / 2);
      msg.setAttribute('y', h / 2);
      msg.setAttribute('text-anchor', 'middle');
      msg.setAttribute('dominant-baseline', 'central');
      msg.setAttribute('fill', 'var(--text-secondary)');
      msg.setAttribute('font-size', '16');
      msg.setAttribute('font-family', 'var(--font-sans, sans-serif)');
      msg.textContent = 'Empty tree';
      svgEl.appendChild(msg);
      return;
    }

    var layout = computeLayout(tree, w);

    // Build lookup by val for edge drawing
    var byVal = {};
    layout.forEach(function(n) { byVal[n.val] = n; });

    // Build highlighted/found sets from step
    var highlightedSet = {};
    var highlightedArr = (step && step.highlighted) ? step.highlighted : [];
    for (var hi = 0; hi < highlightedArr.length; hi++) {
      highlightedSet[highlightedArr[hi]] = true;
    }
    var foundVal = step ? step.found : null;

    svgEl.innerHTML = '';

    // Draw edges first (behind nodes)
    var edgeGroup = svgEl_make('g');
    edgeGroup.setAttribute('class', 'svg-edges');
    layout.forEach(function(n) {
      if (n.parentVal === null) return;
      var parent = byVal[n.parentVal];
      if (!parent) return;
      var line = svgEl_make('line');
      line.setAttribute('x1', parent.x);
      line.setAttribute('y1', parent.y);
      line.setAttribute('x2', n.x);
      line.setAttribute('y2', n.y);
      line.setAttribute('class', 'svg-edge svg-edge--default');
      edgeGroup.appendChild(line);
    });
    svgEl.appendChild(edgeGroup);

    // Draw nodes on top
    layout.forEach(function(n) {
      var g = svgEl_make('g');
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');

      // Determine state: found > highlighted > default
      var state = 'default';
      if (foundVal !== null && foundVal === n.val) {
        state = 'found';
      } else if (highlightedSet[n.val]) {
        state = 'highlighted';
      }

      g.setAttribute('class', 'svg-node svg-node--' + state);

      var circle = svgEl_make('circle');
      circle.setAttribute('r', NODE_R);
      g.appendChild(circle);

      var text = svgEl_make('text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.textContent = String(n.val);
      g.appendChild(text);

      svgEl.appendChild(g);
    });
  }

  // ── Run operation helper ──────────────────────────────────────────
  function runOperation(stepsFn) {
    var steps = stepsFn();
    if (viz) {
      viz.setSteps(steps);
    }
  }

  // ── Build initial BST ─────────────────────────────────────────────
  function buildInitialTree() {
    root = null;
    var values = [50, 30, 70, 20, 40, 60, 80];
    for (var i = 0; i < values.length; i++) {
      root = bstInsert(root, values[i]);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    svgWrap = document.getElementById('bst-svg-wrap');
    if (!svgWrap) return;

    svgEl = buildSVG(svgWrap);
    explanationEl = document.querySelector('.viz-explanation');

    buildInitialTree();

    // vizCore needs a real canvas element with getContext('2d') and canvas.closest('.viz-container')
    // We create a hidden off-screen canvas inside the viz-container for control binding only
    var fakeCanvas = document.createElement('canvas');
    fakeCanvas.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
    var container = svgWrap.closest('.viz-container');
    if (container) container.appendChild(fakeCanvas);

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('bst', {
      canvas: fakeCanvas,
      tweenDuration: 0, // disable tweening — SVG CSS transitions handle animation
      onRender: function(_ctx, step) {
        renderStep(step);
      },
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step && step.description) {
          explanationEl.textContent = step.description;
        } else if (explanationEl) {
          explanationEl.textContent = 'Use the controls below to perform BST operations.';
        }
      }
    });

    // Respond to SVG wrap resize
    window.addEventListener('resize', function() {
      if (viz) viz.render();
    });

    // Show initial state
    var initialSteps = [{
      tree: cloneTree(root),
      highlighted: [],
      found: null,
      description: 'Binary Search Tree with values [50, 30, 70, 20, 40, 60, 80]. Use the buttons below to perform operations.'
    }];
    viz.setSteps(initialSteps);

    // Wire value input
    var valueInput = document.getElementById('bst-value-input');

    // Wire Insert button
    var insertBtn = document.getElementById('bst-insert-btn');
    if (insertBtn) {
      insertBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value.';
          return;
        }
        runOperation(function() { return generateInsertSteps(val); });
      });
    }

    // Wire Search button
    var searchBtn = document.getElementById('bst-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value.';
          return;
        }
        runOperation(function() { return generateSearchSteps(val); });
      });
    }

    // Wire Delete button
    var deleteBtn = document.getElementById('bst-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value.';
          return;
        }
        runOperation(function() { return generateDeleteSteps(val); });
      });
    }

    // Wire Inorder button
    var inorderBtn = document.getElementById('bst-inorder-btn');
    if (inorderBtn) {
      inorderBtn.addEventListener('click', function() {
        runOperation(function() { return generateInorderSteps(); });
      });
    }

    // Wire Preorder button
    var preorderBtn = document.getElementById('bst-preorder-btn');
    if (preorderBtn) {
      preorderBtn.addEventListener('click', function() {
        runOperation(function() { return generatePreorderSteps(); });
      });
    }

    // Allow Enter key on value input to trigger insert
    if (valueInput) {
      valueInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          if (insertBtn) insertBtn.click();
        }
      });
    }
  }

  DSA.bstViz = { init: init };
})();
