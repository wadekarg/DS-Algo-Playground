var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var head = null; // linked list head pointer
  var explanationEl = null;
  var animFrameId = null;

  // CSS color cache
  var colors = {};

  // Node dimensions
  var NODE_W = 100;
  var NODE_H = 45;
  var DATA_W = 60;
  var PTR_W = 40;
  var NODE_GAP = 50;
  var NODE_Y = 140;
  var HEAD_LABEL_Y = 80;

  // ---------- Linked-List Node ----------
  function LLNode(data) {
    this.data = data;
    this.next = null;
    // visual state
    this.x = 0;
    this.y = NODE_Y;
    this.targetX = 0;
    this.targetY = NODE_Y;
    this.opacity = 1;
    this.highlight = 'default'; // default | active | found
  }

  // ---------- Convert list to array for iteration ----------
  function toArray() {
    var arr = [];
    var cur = head;
    while (cur) {
      arr.push(cur);
      cur = cur.next;
    }
    return arr;
  }

  function listLength() {
    var len = 0;
    var cur = head;
    while (cur) { len++; cur = cur.next; }
    return len;
  }

  // ---------- Assign target positions for all nodes ----------
  function layoutNodes(canvasW) {
    var nodes = toArray();
    var totalW = nodes.length * NODE_W + (nodes.length - 1) * NODE_GAP;
    var startX = Math.max(20, (canvasW - totalW) / 2);
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].targetX = startX + i * (NODE_W + NODE_GAP);
      nodes[i].targetY = NODE_Y;
    }
  }

  // ---------- Snap positions (no animation) ----------
  function snapPositions() {
    var nodes = toArray();
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].x = nodes[i].targetX;
      nodes[i].y = nodes[i].targetY;
    }
  }

  // ---------- Read CSS variables ----------
  function refreshColors() {
    var s = getComputedStyle(document.documentElement);
    colors.default = s.getPropertyValue('--viz-default').trim() || '#3b82f6';
    colors.active = s.getPropertyValue('--viz-active').trim() || '#ef4444';
    colors.found = s.getPropertyValue('--viz-found').trim() || '#22c55e';
    colors.cellBg = s.getPropertyValue('--viz-cell-bg').trim() || '#e2e8f0';
    colors.cellText = s.getPropertyValue('--viz-cell-text').trim() || '#1e293b';
    colors.arrow = s.getPropertyValue('--viz-arrow').trim() || '#64748b';
  }

  // ---------- Drawing helpers ----------
  function colorForHighlight(hl) {
    if (hl === 'active') return colors.active;
    if (hl === 'found') return colors.found;
    return colors.default;
  }

  function drawNode(ctx, node) {
    if (node.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = node.opacity;

    var x = node.x;
    var y = node.y;
    var borderColor = colorForHighlight(node.highlight);

    // Outer rect
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.fillStyle = colors.cellBg;
    roundRect(ctx, x, y, NODE_W, NODE_H, 6);
    ctx.fill();
    ctx.stroke();

    // Divider
    ctx.beginPath();
    ctx.moveTo(x + DATA_W, y);
    ctx.lineTo(x + DATA_W, y + NODE_H);
    ctx.stroke();

    // Data text
    ctx.fillStyle = colors.cellText;
    ctx.font = 'bold 16px ' + (getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'sans-serif');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(node.data), x + DATA_W / 2, y + NODE_H / 2);

    // Pointer area - small dot or "null"
    if (node.next) {
      ctx.fillStyle = colors.arrow;
      ctx.beginPath();
      ctx.arc(x + DATA_W + PTR_W / 2, y + NODE_H / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = colors.cellText;
      ctx.font = '11px ' + (getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace');
      ctx.fillText('null', x + DATA_W + PTR_W / 2, y + NODE_H / 2);
    }

    ctx.restore();
  }

  function drawArrow(ctx, fromNode, toNode) {
    if (!toNode || fromNode.opacity <= 0 || toNode.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(fromNode.opacity, toNode.opacity);
    ctx.strokeStyle = colors.arrow;
    ctx.fillStyle = colors.arrow;
    ctx.lineWidth = 2;

    var sx = fromNode.x + DATA_W + PTR_W / 2;
    var sy = fromNode.y + NODE_H / 2;
    var ex = toNode.x;
    var ey = toNode.y + NODE_H / 2;

    // Bezier control points
    var cpx1 = sx + (ex - sx) * 0.4;
    var cpy1 = sy - 20;
    var cpx2 = sx + (ex - sx) * 0.6;
    var cpy2 = ey - 20;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, ex, ey);
    ctx.stroke();

    // Arrowhead
    var angle = Math.atan2(ey - cpy2, ex - cpx2);
    var headLen = 10;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - headLen * Math.cos(angle - 0.4), ey - headLen * Math.sin(angle - 0.4));
    ctx.lineTo(ex - headLen * Math.cos(angle + 0.4), ey - headLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawHeadLabel(ctx) {
    if (!head) return;
    ctx.save();
    ctx.fillStyle = colorForHighlight('active');
    ctx.font = 'bold 14px ' + (getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'sans-serif');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    var hx = head.x + DATA_W / 2;
    ctx.fillText('head', hx, HEAD_LABEL_Y - 10);

    // Arrow from label to node
    ctx.strokeStyle = colorForHighlight('active');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, HEAD_LABEL_Y - 6);
    ctx.lineTo(hx, head.y - 4);
    ctx.stroke();

    // Small arrowhead
    ctx.beginPath();
    ctx.moveTo(hx, head.y - 2);
    ctx.lineTo(hx - 5, head.y - 10);
    ctx.lineTo(hx + 5, head.y - 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ---------- Render callback for vizCore ----------
  function onRender(ctx, step, data) {
    refreshColors();
    var w = data.width;

    // Apply step state
    if (step && step.state) {
      head = step.state.head;
    }

    if (!head) {
      ctx.fillStyle = colors.cellText;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Empty list', w / 2, data.height / 2);
      return;
    }

    layoutNodes(w);

    // Animate positions toward targets
    var nodes = toArray();
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      // Apply per-node overrides from step
      if (step && step.overrides && step.overrides[i]) {
        var ov = step.overrides[i];
        if (ov.highlight !== undefined) n.highlight = ov.highlight;
        if (ov.opacity !== undefined) n.opacity = ov.opacity;
        if (ov.offsetY !== undefined) n.targetY = NODE_Y + ov.offsetY;
      } else {
        n.highlight = 'default';
        n.opacity = 1;
        n.targetY = NODE_Y;
      }
      // Snap to target for step-based rendering
      n.x = n.targetX;
      n.y = n.targetY;
    }

    // Draw arrows between consecutive nodes
    for (var j = 0; j < nodes.length; j++) {
      if (nodes[j].next) {
        drawArrow(ctx, nodes[j], nodes[j + 1]);
      }
    }

    // Draw nodes
    for (var k = 0; k < nodes.length; k++) {
      drawNode(ctx, nodes[k]);
    }

    // Draw head label
    drawHeadLabel(ctx);
  }

  function onStepChange(step, data) {
    if (explanationEl && step && step.explanation) {
      explanationEl.textContent = step.explanation;
    } else if (explanationEl && !step) {
      explanationEl.textContent = 'Use the controls below to perform linked list operations.';
    }
  }

  // ---------- Deep-clone the current list for snapshotting ----------
  function cloneList() {
    if (!head) return null;
    var nodes = toArray();
    var clones = [];
    for (var i = 0; i < nodes.length; i++) {
      var c = new LLNode(nodes[i].data);
      c.x = nodes[i].x;
      c.y = nodes[i].y;
      c.targetX = nodes[i].targetX;
      c.targetY = nodes[i].targetY;
      c.opacity = nodes[i].opacity;
      c.highlight = nodes[i].highlight;
      clones.push(c);
    }
    for (var j = 0; j < clones.length - 1; j++) {
      clones[j].next = clones[j + 1];
    }
    return clones[0];
  }

  // ---------- Build step with snapshot ----------
  function makeStep(explanation, overrides, codeLine, variables) {
    return {
      state: { head: cloneList() },
      explanation: explanation,
      overrides: overrides || {},
      codeLine: codeLine || null,
      variables: variables || {}
    };
  }

  // ---------- Operations ----------

  function generateInsertHeadSteps(value) {
    var steps = [];
    var newNode = new LLNode(value);

    // Step 1: Show current list
    steps.push(makeStep('Current list. We will insert ' + value + ' at the head.', {}, 2, { val: value }));

    // Step 2: Create new node (shown above)
    newNode.next = head;
    head = newNode;
    var overrides1 = { 0: { highlight: 'active', offsetY: -60 } };
    steps.push(makeStep('Created new node with value ' + value + '. It appears above the list.', overrides1, 2, { val: value }));

    // Step 3: Point new node's next to old head
    var overrides2 = { 0: { highlight: 'active', offsetY: -30 } };
    if (toArray().length > 1) {
      overrides2[1] = { highlight: 'active' };
    }
    steps.push(makeStep('New node\'s next pointer now points to the old head.', overrides2, 3, { val: value }));

    // Step 4: Update head pointer, node slides into position
    var overrides3 = { 0: { highlight: 'found' } };
    steps.push(makeStep('Head pointer updated. Node ' + value + ' is now the new head of the list.', overrides3, 6, { val: value }));

    // Step 5: Final clean state
    steps.push(makeStep('Insert at head complete. The list now has ' + listLength() + ' nodes.', {}, 6, {}));

    return steps;
  }

  function generateInsertAtIndexSteps(value, index) {
    var len = listLength();
    if (index < 0 || index > len) {
      return [makeStep('Error: Index ' + index + ' is out of bounds (valid: 0 to ' + len + ').')];
    }

    if (index === 0) {
      return generateInsertHeadSteps(value);
    }

    var steps = [];

    // Step 1: Initial state
    steps.push(makeStep('Current list. We will insert ' + value + ' at index ' + index + '.'));

    // Step 2-N: Traverse to index-1
    var cur = head;
    for (var i = 0; i < index - 1; i++) {
      var overrides = {};
      for (var j = 0; j <= i; j++) {
        overrides[j] = { highlight: 'active' };
      }
      steps.push(makeStep('Traversing... Visiting node at index ' + i + ' (value: ' + cur.data + ').', overrides));
      cur = cur.next;
    }

    // Highlight the node before insertion point
    var ovBefore = {};
    ovBefore[index - 1] = { highlight: 'found' };
    steps.push(makeStep('Found insertion point. Node at index ' + (index - 1) + ' (value: ' + cur.data + ') will link to the new node.', ovBefore));

    // Perform the insertion
    var newNode = new LLNode(value);
    newNode.next = cur.next;
    cur.next = newNode;

    // Show new node highlighted
    var ovInserted = {};
    ovInserted[index] = { highlight: 'active', offsetY: -40 };
    steps.push(makeStep('New node with value ' + value + ' created and linked into the list.', ovInserted));

    // Final state
    var ovFinal = {};
    ovFinal[index] = { highlight: 'found' };
    steps.push(makeStep('Insert complete. Value ' + value + ' is now at index ' + index + '. List has ' + listLength() + ' nodes.', ovFinal));

    steps.push(makeStep('Operation complete.'));

    return steps;
  }

  function generateDeleteSteps(index) {
    var len = listLength();
    if (len === 0) {
      return [makeStep('Error: Cannot delete from an empty list.')];
    }
    if (index < 0 || index >= len) {
      return [makeStep('Error: Index ' + index + ' is out of bounds (valid: 0 to ' + (len - 1) + ').')];
    }

    var steps = [];

    // Step 1: Initial state
    var deletedValue;
    steps.push(makeStep('Current list. We will delete the node at index ' + index + '.'));

    if (index === 0) {
      deletedValue = head.data;
      // Highlight head
      var ovH = { 0: { highlight: 'active' } };
      steps.push(makeStep('Target node is the head (value: ' + deletedValue + '). Will relink head to the next node.', ovH));

      // Fade out
      var ovFade = { 0: { highlight: 'active', opacity: 0.4 } };
      steps.push(makeStep('Removing node ' + deletedValue + ' from the list.', ovFade));

      // Perform deletion
      head = head.next;

      // Final
      if (head) {
        steps.push(makeStep('Head now points to ' + head.data + '. Deletion complete.', { 0: { highlight: 'found' } }));
      } else {
        steps.push(makeStep('The list is now empty.'));
      }
    } else {
      // Traverse to node before target
      var cur = head;
      for (var i = 0; i < index - 1; i++) {
        var overrides = {};
        for (var j = 0; j <= i; j++) {
          overrides[j] = { highlight: 'active' };
        }
        steps.push(makeStep('Traversing to find the node before index ' + index + '. At index ' + i + '.', overrides));
        cur = cur.next;
      }

      // Highlight node before target and the target
      deletedValue = cur.next.data;
      var ovTarget = {};
      ovTarget[index - 1] = { highlight: 'found' };
      ovTarget[index] = { highlight: 'active' };
      steps.push(makeStep('Found predecessor at index ' + (index - 1) + ' (value: ' + cur.data + '). Target node: ' + deletedValue + '.', ovTarget));

      // Fade out target
      var ovFade2 = {};
      ovFade2[index - 1] = { highlight: 'found' };
      ovFade2[index] = { highlight: 'active', opacity: 0.3 };
      steps.push(makeStep('Relinking predecessor\'s next pointer to skip over node ' + deletedValue + '.', ovFade2));

      // Perform deletion
      cur.next = cur.next.next;

      // Final
      steps.push(makeStep('Node ' + deletedValue + ' deleted. List now has ' + listLength() + ' nodes.'));
    }

    steps.push(makeStep('Delete operation complete.'));
    return steps;
  }

  function generateSearchSteps(value) {
    var len = listLength();
    if (len === 0) {
      return [makeStep('Cannot search: the list is empty.')];
    }

    var steps = [];
    steps.push(makeStep('Searching for value ' + value + ' in the list. Starting from head.', {}, 7, { curr: 'head' }));

    var cur = head;
    var idx = 0;
    var found = false;

    while (cur) {
      var overrides = {};
      // Highlight all previously visited as default, current as active
      for (var j = 0; j < idx; j++) {
        overrides[j] = { highlight: 'default' };
      }
      overrides[idx] = { highlight: 'active' };
      steps.push(makeStep('Checking node at index ' + idx + ': value = ' + cur.data + (cur.data === value ? ' --- MATCH!' : ' --- not a match.'), overrides, 9, { curr: cur.data }));

      if (cur.data === value) {
        // Found
        var ovFound = {};
        ovFound[idx] = { highlight: 'found' };
        steps.push(makeStep('Value ' + value + ' found at index ' + idx + '!', ovFound, 9, { curr: cur.data }));
        found = true;
        break;
      }

      cur = cur.next;
      idx++;
    }

    if (!found) {
      steps.push(makeStep('Value ' + value + ' was not found in the list. Reached the end (null).', {}, 10, { curr: 'null' }));
    }

    steps.push(makeStep('Search complete.', {}, 10, {}));
    return steps;
  }

  // ---------- Build initial list ----------
  function buildInitialList() {
    var values = [10, 25, 8, 42, 17];
    head = null;
    // Build in reverse so order is 10 -> 25 -> 8 -> 42 -> 17
    for (var i = values.length - 1; i >= 0; i--) {
      var n = new LLNode(values[i]);
      n.next = head;
      head = n;
    }
  }

  // ---------- Reset all highlights ----------
  function resetHighlights() {
    var cur = head;
    while (cur) {
      cur.highlight = 'default';
      cur.opacity = 1;
      cur = cur.next;
    }
  }

  // ---------- Run an operation and feed steps to vizCore ----------
  function runOperation(stepsFn) {
    // Save current state, run the operation which mutates the list and generates steps
    resetHighlights();
    var steps = stepsFn();
    if (viz) {
      viz.setSteps(steps);
    }
  }

  // ---------- Init ----------
  function init() {
    var canvas = document.getElementById('linked-list-canvas');
    if (!canvas) return;

    explanationEl = document.querySelector('.viz-explanation');

    buildInitialList();

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('linked-lists', {
      canvas: canvas,
      onRender: onRender,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Set initial steps showing the default list
    var initialSteps = [makeStep('Singly linked list: 10 \u2192 25 \u2192 8 \u2192 42 \u2192 17. Use the operation buttons below to manipulate the list.')];
    viz.setSteps(initialSteps);

    // Wire buttons
    var insertHeadBtn = document.getElementById('ll-insert-head-btn');
    var insertIdxBtn = document.getElementById('ll-insert-idx-btn');
    var deleteBtn = document.getElementById('ll-delete-btn');
    var searchBtn = document.getElementById('ll-search-btn');
    var valueInput = document.getElementById('ll-value-input');
    var indexInput = document.getElementById('ll-index-input');

    if (insertHeadBtn) {
      insertHeadBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value.';
          return;
        }
        runOperation(function() { return generateInsertHeadSteps(val); });
      });
    }

    if (insertIdxBtn) {
      insertIdxBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        var idx = parseInt(indexInput ? indexInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value.';
          return;
        }
        if (isNaN(idx)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid index.';
          return;
        }
        runOperation(function() { return generateInsertAtIndexSteps(val, idx); });
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        var idx = parseInt(indexInput ? indexInput.value : '', 10);
        if (isNaN(idx)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid index to delete.';
          return;
        }
        runOperation(function() { return generateDeleteSteps(idx); });
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value to search for.';
          return;
        }
        runOperation(function() { return generateSearchSteps(val); });
      });
    }
  }

  DSA.linkedListsViz = { init: init };
})();
