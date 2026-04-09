var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var root = null;
  var explanationEl = null;

  // ── BST Node constructor ──────────────────────────────────────────
  function BSTNode(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }

  // ── CSS colour helper ─────────────────────────────────────────────
  function css(prop, fallback) {
    var val = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
    return val || fallback || '';
  }

  // ── Deep-clone the tree ───────────────────────────────────────────
  function cloneTree(node) {
    if (!node) return null;
    var copy = new BSTNode(node.val);
    copy.left = cloneTree(node.left);
    copy.right = cloneTree(node.right);
    return copy;
  }

  // ── Compute positions via inorder traversal ───────────────────────
  // Each node gets an (x, y) based on its inorder index and depth.
  // Returns an array of { val, x, y, left, right } for rendering.
  function computePositions(root, canvasW) {
    if (!root) return [];

    var RADIUS = 20;
    var LEVEL_H = 70;
    var TOP_PAD = 60;
    var MIN_H_SPACING = 50; // minimum horizontal gap between consecutive inorder nodes

    // First, collect inorder list to know the count
    var inorderList = [];
    function inorder(node) {
      if (!node) return;
      inorder(node.left);
      inorderList.push(node);
      inorder(node.right);
    }
    inorder(root);

    var count = inorderList.length;
    // Compute horizontal spacing: distribute evenly across canvas
    var totalNeeded = count * MIN_H_SPACING;
    var hSpacing = Math.max(MIN_H_SPACING, (canvasW - 2 * RADIUS - 40) / Math.max(count - 1, 1));

    // If spacing is too wide, cap it
    if (hSpacing > 100) hSpacing = 100;

    var totalW = (count - 1) * hSpacing;
    var startX = Math.max(RADIUS + 10, (canvasW - totalW) / 2);

    // Assign inorder index to each node
    var indexMap = {};
    for (var i = 0; i < inorderList.length; i++) {
      indexMap[inorderList[i].val + '_' + i] = i;
    }

    // Build positions by traversal with inorder counter and depth
    var positions = [];
    var inorderIdx = 0;

    function assignPositions(node, depth) {
      if (!node) return;
      assignPositions(node.left, depth + 1);

      var x = startX + inorderIdx * hSpacing;
      var y = TOP_PAD + depth * LEVEL_H;

      positions.push({
        val: node.val,
        x: x,
        y: y,
        left: node.left ? node.left.val : null,
        right: node.right ? node.right.val : null,
        leftNode: node.left,
        rightNode: node.right
      });

      inorderIdx++;
      assignPositions(node.right, depth + 1);
    }

    assignPositions(root, 0);
    return positions;
  }

  // ── Build a lookup from val to position ───────────────────────────
  // Since duplicate vals can exist in theory, we use the positions array directly.
  // For our purposes, tree is built from unique values.
  function positionLookup(positions) {
    var map = {};
    for (var i = 0; i < positions.length; i++) {
      map[positions[i].val] = positions[i];
    }
    return map;
  }

  // ── BST insert (mutates tree) ─────────────────────────────────────
  function bstInsert(root, val) {
    if (!root) return new BSTNode(val);
    if (val < root.val) {
      root.left = bstInsert(root.left, val);
    } else if (val > root.val) {
      root.right = bstInsert(root.right, val);
    }
    // Duplicate: ignore
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
      // Found the node to delete
      if (!root.left && !root.right) {
        // Leaf node
        return null;
      } else if (!root.left) {
        // One child (right)
        return root.right;
      } else if (!root.right) {
        // One child (left)
        return root.left;
      } else {
        // Two children: replace with inorder successor
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

    // Walk down the tree to find insertion point
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

    // Perform actual insertion
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

    // Walk down to find the node
    var node = root;
    var path = [];

    while (node) {
      path.push(node.val);

      if (node.val === val) {
        // Determine deletion case
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

    // Perform actual deletion
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
      steps.push({
        tree: null,
        highlighted: [],
        found: null,
        description: 'Tree is empty. Nothing to traverse.'
      });
      return steps;
    }

    steps.push({
      tree: cloneTree(root),
      highlighted: [],
      found: null,
      description: 'Inorder traversal: visit Left subtree, then Node, then Right subtree.'
    });

    var visited = [];

    function inorder(node) {
      if (!node) return;

      // Visiting this node (going into it)
      steps.push({
        tree: cloneTree(root),
        highlighted: visited.concat([node.val]),
        found: null,
        description: 'Visiting node ' + node.val + '. First, go to its left subtree.'
      });

      inorder(node.left);

      // Process this node
      visited.push(node.val);
      steps.push({
        tree: cloneTree(root),
        highlighted: visited.slice(),
        found: node.val,
        description: 'Process node ' + node.val + '. Inorder so far: [' + visited.join(', ') + ']. Now go to its right subtree.'
      });

      inorder(node.right);
    }

    inorder(root);

    steps.push({
      tree: cloneTree(root),
      highlighted: visited.slice(),
      found: null,
      description: 'Inorder traversal complete: [' + visited.join(', ') + '].'
    });

    return steps;
  }

  // ── Step generation: Preorder traversal ───────────────────────────
  function generatePreorderSteps() {
    var steps = [];

    if (!root) {
      steps.push({
        tree: null,
        highlighted: [],
        found: null,
        description: 'Tree is empty. Nothing to traverse.'
      });
      return steps;
    }

    steps.push({
      tree: cloneTree(root),
      highlighted: [],
      found: null,
      description: 'Preorder traversal: visit Node first, then Left subtree, then Right subtree.'
    });

    var visited = [];

    function preorder(node) {
      if (!node) return;

      // Process this node first
      visited.push(node.val);
      steps.push({
        tree: cloneTree(root),
        highlighted: visited.slice(),
        found: node.val,
        description: 'Process node ' + node.val + '. Preorder so far: [' + visited.join(', ') + ']. Now go to its left subtree.'
      });

      preorder(node.left);

      // After left subtree, note going right
      if (node.right) {
        steps.push({
          tree: cloneTree(root),
          highlighted: visited.slice(),
          found: null,
          description: 'Left subtree of ' + node.val + ' done. Now go to its right subtree.'
        });
      }

      preorder(node.right);
    }

    preorder(root);

    steps.push({
      tree: cloneTree(root),
      highlighted: visited.slice(),
      found: null,
      description: 'Preorder traversal complete: [' + visited.join(', ') + '].'
    });

    return steps;
  }

  // ── Canvas rendering ──────────────────────────────────────────────
  function renderStep(ctx, step, data) {
    var w = data.width;
    var h = data.height;
    var RADIUS = 20;

    if (!step || !step.tree) {
      ctx.fillStyle = css('--viz-cell-text', '#1e293b');
      ctx.font = '16px ' + css('--font-sans', 'sans-serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Empty tree', w / 2, h / 2);
      return;
    }

    var positions = computePositions(step.tree, w);
    if (positions.length === 0) return;

    var lookup = positionLookup(positions);
    var highlightedSet = {};
    var highlightedArr = step.highlighted || [];
    for (var hi = 0; hi < highlightedArr.length; hi++) {
      highlightedSet[highlightedArr[hi]] = true;
    }

    // ── Draw edges first ──────────────────────────────────────────
    for (var e = 0; e < positions.length; e++) {
      var pos = positions[e];

      if (pos.leftNode && lookup[pos.leftNode.val] !== undefined) {
        var childPos = lookup[pos.leftNode.val];
        var edgeColor = css('--viz-arrow', '#64748b');
        // Compute line from parent circle edge to child circle edge
        var dx = childPos.x - pos.x;
        var dy = childPos.y - pos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          var sx = pos.x + (dx / dist) * RADIUS;
          var sy = pos.y + (dy / dist) * RADIUS;
          var ex = childPos.x - (dx / dist) * RADIUS;
          var ey = childPos.y - (dy / dist) * RADIUS;
          ctx.strokeStyle = edgeColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }

      if (pos.rightNode && lookup[pos.rightNode.val] !== undefined) {
        var childPosR = lookup[pos.rightNode.val];
        var edgeColorR = css('--viz-arrow', '#64748b');
        var dxR = childPosR.x - pos.x;
        var dyR = childPosR.y - pos.y;
        var distR = Math.sqrt(dxR * dxR + dyR * dyR);
        if (distR > 0) {
          var sxR = pos.x + (dxR / distR) * RADIUS;
          var syR = pos.y + (dyR / distR) * RADIUS;
          var exR = childPosR.x - (dxR / distR) * RADIUS;
          var eyR = childPosR.y - (dyR / distR) * RADIUS;
          ctx.strokeStyle = edgeColorR;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sxR, syR);
          ctx.lineTo(exR, eyR);
          ctx.stroke();
        }
      }
    }

    // ── Draw nodes on top ─────────────────────────────────────────
    for (var n = 0; n < positions.length; n++) {
      var p = positions[n];
      var isHighlighted = highlightedSet[p.val] === true;
      var isFound = step.found === p.val;

      var fillColor, borderColor, textColor;

      if (isFound) {
        fillColor = css('--viz-found', '#22c55e');
        borderColor = css('--viz-found', '#22c55e');
        textColor = '#ffffff';
      } else if (isHighlighted) {
        fillColor = css('--viz-active', '#ef4444');
        borderColor = css('--viz-active', '#ef4444');
        textColor = '#ffffff';
      } else {
        fillColor = css('--viz-cell-bg', '#e2e8f0');
        borderColor = css('--viz-default', '#3b82f6');
        textColor = css('--viz-cell-text', '#1e293b');
      }

      // Glow for found nodes
      if (isFound) {
        ctx.save();
        ctx.shadowColor = css('--viz-found', '#22c55e');
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.restore();
      }

      // Circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Value text
      ctx.fillStyle = textColor;
      ctx.font = 'bold 14px ' + css('--font-sans', 'sans-serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(p.val), p.x, p.y);
    }
  }

  // ── Step change callback ──────────────────────────────────────────
  function onStepChange(step, data) {
    if (explanationEl && step && step.description) {
      explanationEl.textContent = step.description;
    } else if (explanationEl) {
      explanationEl.textContent = 'Use the controls below to perform BST operations.';
    }
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
    var canvas = document.getElementById('bst-canvas');
    if (!canvas) return;

    explanationEl = document.querySelector('.viz-explanation');

    buildInitialTree();

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('bst', {
      canvas: canvas,
      onRender: renderStep,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
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
