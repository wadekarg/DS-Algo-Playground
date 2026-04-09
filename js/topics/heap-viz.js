var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var heap = [];
  var explanationEl = null;
  var MAX_HEAP_SIZE = 15;

  // Initial valid max-heap
  var INITIAL_HEAP = [90, 70, 80, 40, 50, 60, 30];

  // ── CSS helpers ──────────────────────────────────────────────────────
  function cssVar(name, fallback) {
    var val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return val || fallback || '';
  }

  function colorActive()   { return cssVar('--viz-active',    '#ef4444'); }
  function colorCompare()  { return cssVar('--viz-compare',   '#f59e0b'); }
  function colorSorted()   { return cssVar('--viz-sorted',    '#22c55e'); }
  function colorCellBg()   { return cssVar('--viz-cell-bg',   '#e2e8f0'); }
  function colorCellText() { return cssVar('--viz-cell-text', '#1e293b'); }
  function colorDefault()  { return cssVar('--viz-default',   '#3b82f6'); }

  function fontSans() { return cssVar('--font-sans', 'sans-serif'); }
  function fontMono() { return cssVar('--font-mono', 'monospace'); }

  // ── Heap helpers ─────────────────────────────────────────────────────
  function parentIndex(i) { return Math.floor((i - 1) / 2); }
  function leftChild(i)   { return 2 * i + 1; }
  function rightChild(i)  { return 2 * i + 2; }

  function swapArr(arr, i, j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  // ── Compute tree layout positions ────────────────────────────────────
  function computeTreePositions(heapSize, canvasW, treeAreaH) {
    if (heapSize === 0) return [];

    var positions = [];
    var nodeRadius = 20;
    var levelSpacing = 60;
    var topPad = 35;
    var depth = Math.floor(Math.log(heapSize) / Math.log(2)) + 1;
    var horizontalPad = 30;

    for (var i = 0; i < heapSize; i++) {
      var level = Math.floor(Math.log(i + 1) / Math.log(2));
      var nodesAtLevel = Math.pow(2, level);
      var indexInLevel = i - (Math.pow(2, level) - 1);
      var availW = canvasW - horizontalPad * 2;
      var slotW = availW / nodesAtLevel;
      var x = horizontalPad + slotW * indexInLevel + slotW / 2;
      var y = topPad + level * levelSpacing;

      positions.push({ x: x, y: y, radius: nodeRadius });
    }

    return positions;
  }

  // ── Draw rounded rectangle ───────────────────────────────────────────
  function drawRoundedRect(ctx, x, y, w, h, r) {
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

  // ── Generate Insert steps ────────────────────────────────────────────
  function generateInsertSteps(value) {
    var steps = [];
    var h = heap.slice();

    // Step 1: current state
    steps.push({
      heap: h.slice(),
      highlighted: [],
      swapping: [],
      completed: [],
      codeLine: 2,
      variables: { val: value },
      description: 'Current max-heap: [' + h.join(', ') + ']. We will insert ' + value + '.'
    });

    // Step 2: add to end
    h.push(value);
    var idx = h.length - 1;
    steps.push({
      heap: h.slice(),
      highlighted: [idx],
      swapping: [],
      completed: [],
      codeLine: 3,
      variables: { val: value, idx: idx },
      description: 'Insert ' + value + ' at the end of the array (index ' + idx + '). Now we bubble up to restore the heap property.'
    });

    // Bubble up
    while (idx > 0) {
      var pIdx = parentIndex(idx);
      // Step: compare with parent
      steps.push({
        heap: h.slice(),
        highlighted: [idx],
        swapping: [],
        completed: [],
        parent: pIdx,
        codeLine: 5,
        variables: { val: h[idx], parent: h[pIdx], idx: idx, pIdx: pIdx },
        description: 'Compare ' + h[idx] + ' (index ' + idx + ') with parent ' + h[pIdx] + ' (index ' + pIdx + ').'
      });

      if (h[idx] > h[pIdx]) {
        // Need to swap
        swapArr(h, idx, pIdx);
        steps.push({
          heap: h.slice(),
          highlighted: [],
          swapping: [idx, pIdx],
          completed: [],
          codeLine: 6,
          variables: { val: h[pIdx], parent: h[idx] },
          description: 'Swap ' + h[pIdx] + ' and ' + h[idx] + ' because child was larger than parent.'
        });
        idx = pIdx;
      } else {
        // Heap property satisfied
        steps.push({
          heap: h.slice(),
          highlighted: [],
          swapping: [],
          completed: [idx],
          codeLine: 7,
          variables: { val: h[idx] },
          description: h[idx] + ' <= parent ' + h[pIdx] + '. Heap property satisfied. Bubble-up complete.'
        });
        break;
      }
    }

    if (idx === 0) {
      steps.push({
        heap: h.slice(),
        highlighted: [],
        swapping: [],
        completed: [0],
        codeLine: 7,
        variables: { val: h[0] },
        description: 'Element ' + h[0] + ' bubbled up to the root. Insert complete.'
      });
    }

    // Final state
    steps.push({
      heap: h.slice(),
      highlighted: [],
      swapping: [],
      completed: [],
      codeLine: 7,
      variables: { size: h.length },
      description: 'Insert complete. Max-heap: [' + h.join(', ') + '].'
    });

    return { steps: steps, result: h };
  }

  // ── Generate Extract-Max steps ───────────────────────────────────────
  function generateExtractSteps() {
    var steps = [];
    var h = heap.slice();

    if (h.length === 0) {
      steps.push({
        heap: [],
        highlighted: [],
        swapping: [],
        completed: [],
        description: 'Heap is empty! Nothing to extract.'
      });
      return { steps: steps, result: h };
    }

    var maxVal = h[0];

    // Step 1: highlight the root (max element)
    steps.push({
      heap: h.slice(),
      highlighted: [0],
      swapping: [],
      completed: [],
      codeLine: 10,
      variables: { max: maxVal },
      description: 'Extract-Max: The root element ' + maxVal + ' is the maximum. We will remove it.'
    });

    if (h.length === 1) {
      h = [];
      steps.push({
        heap: h.slice(),
        highlighted: [],
        swapping: [],
        completed: [],
        codeLine: 14,
        variables: { max: maxVal },
        description: 'Heap had only one element. Extracted ' + maxVal + '. Heap is now empty.'
      });
      return { steps: steps, result: h };
    }

    // Step 2: swap root with last element
    var lastIdx = h.length - 1;
    swapArr(h, 0, lastIdx);
    steps.push({
      heap: h.slice(),
      highlighted: [],
      swapping: [0, lastIdx],
      completed: [],
      codeLine: 11,
      variables: { max: h[lastIdx], last: h[0] },
      description: 'Swap root ' + h[lastIdx] + ' with last element ' + h[0] + '.'
    });

    // Step 3: remove last element
    h.pop();
    steps.push({
      heap: h.slice(),
      highlighted: [0],
      swapping: [],
      completed: [],
      codeLine: 12,
      variables: { max: maxVal, root: h[0] },
      description: 'Remove ' + maxVal + ' from the end. Now sink down ' + h[0] + ' (index 0) to restore heap property.'
    });

    // Sink down
    var idx = 0;
    var n = h.length;
    while (true) {
      var left = leftChild(idx);
      var right = rightChild(idx);
      var largest = idx;

      if (left < n && h[left] > h[largest]) {
        largest = left;
      }
      if (right < n && h[right] > h[largest]) {
        largest = right;
      }

      if (largest === idx) {
        steps.push({
          heap: h.slice(),
          highlighted: [],
          swapping: [],
          completed: [idx],
          codeLine: 14,
          variables: { val: h[idx] },
          description: h[idx] + ' (index ' + idx + ') is larger than both children. Sink-down complete.'
        });
        break;
      }

      // Compare step
      var compareIndices = [idx];
      if (left < n) compareIndices.push(left);
      if (right < n) compareIndices.push(right);
      steps.push({
        heap: h.slice(),
        highlighted: compareIndices,
        swapping: [],
        completed: [],
        parent: idx,
        codeLine: 13,
        variables: { val: h[idx], largest: h[largest] },
        description: 'Compare ' + h[idx] + ' (index ' + idx + ') with children. Largest child is ' + h[largest] + ' (index ' + largest + ').'
      });

      // Swap step
      swapArr(h, idx, largest);
      steps.push({
        heap: h.slice(),
        highlighted: [],
        swapping: [idx, largest],
        completed: [],
        codeLine: 13,
        variables: { val: h[idx], largest: h[largest] },
        description: 'Swap ' + h[idx] + ' and ' + h[largest] + '.'
      });

      idx = largest;
    }

    // Final
    steps.push({
      heap: h.slice(),
      highlighted: [],
      swapping: [],
      completed: [],
      codeLine: 14,
      variables: { max: maxVal },
      description: 'Extract-Max complete. Removed ' + maxVal + '. Max-heap: [' + h.join(', ') + '].'
    });

    return { steps: steps, result: h };
  }

  // ── Generate Heapify (Build heap) steps ──────────────────────────────
  function generateHeapifySteps(arr) {
    var steps = [];
    var h = arr.slice();
    var n = h.length;

    steps.push({
      heap: h.slice(),
      highlighted: [],
      swapping: [],
      completed: [],
      codeLine: 17,
      variables: { n: n },
      description: 'Build max-heap from array: [' + h.join(', ') + ']. We start from the last non-leaf node and sift down each node.'
    });

    var lastNonLeaf = Math.floor(n / 2) - 1;

    for (var i = lastNonLeaf; i >= 0; i--) {
      // Highlight the node we are about to sift down
      steps.push({
        heap: h.slice(),
        highlighted: [i],
        swapping: [],
        completed: [],
        codeLine: 18,
        variables: { i: i, val: h[i] },
        description: 'Sift down node ' + h[i] + ' at index ' + i + '.'
      });

      // Sift-down loop
      var idx = i;
      while (true) {
        var left = leftChild(idx);
        var right = rightChild(idx);
        var largest = idx;

        if (left < n && h[left] > h[largest]) largest = left;
        if (right < n && h[right] > h[largest]) largest = right;

        if (largest === idx) {
          steps.push({
            heap: h.slice(),
            highlighted: [],
            swapping: [],
            completed: [idx],
            codeLine: 18,
            variables: { val: h[idx] },
            description: h[idx] + ' at index ' + idx + ' satisfies heap property. No swap needed.'
          });
          break;
        }

        // Compare
        steps.push({
          heap: h.slice(),
          highlighted: [idx, largest],
          swapping: [],
          completed: [],
          parent: idx,
          codeLine: 13,
          variables: { val: h[idx], largest: h[largest] },
          description: 'Compare ' + h[idx] + ' (index ' + idx + ') with largest child ' + h[largest] + ' (index ' + largest + ').'
        });

        // Swap
        swapArr(h, idx, largest);
        steps.push({
          heap: h.slice(),
          highlighted: [],
          swapping: [idx, largest],
          completed: [],
          codeLine: 13,
          variables: { val: h[idx], largest: h[largest] },
          description: 'Swap ' + h[idx] + ' and ' + h[largest] + '.'
        });

        idx = largest;
      }
    }

    steps.push({
      heap: h.slice(),
      highlighted: [],
      swapping: [],
      completed: [],
      codeLine: 14,
      variables: { n: n },
      description: 'Heapify complete! Max-heap: [' + h.join(', ') + '].'
    });

    return { steps: steps, result: h };
  }

  // ── Canvas rendering ─────────────────────────────────────────────────
  function renderStep(ctx, step, data) {
    var w = data.width;
    var h = data.height;

    if (!step) {
      ctx.fillStyle = cssVar('--text-primary', '#1e293b');
      ctx.font = '16px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.fillText('Use the controls below to perform heap operations.', w / 2, h / 2);
      return;
    }

    var heapArr = step.heap;
    var n = heapArr.length;

    if (n === 0) {
      ctx.fillStyle = cssVar('--text-primary', '#1e293b');
      ctx.font = '16px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.fillText('Heap is empty.', w / 2, h / 2);
      return;
    }

    var highlighted = step.highlighted || [];
    var swapping = step.swapping || [];
    var completed = step.completed || [];
    var parentIdx = (typeof step.parent === 'number') ? step.parent : -1;

    // ── Determine layout regions ───────────────────────────
    var treeDivider = h * 0.62;
    var arrayAreaTop = treeDivider + 10;

    // ── Draw tree ──────────────────────────────────────────
    var positions = computeTreePositions(n, w, treeDivider);

    // Draw edges first (behind nodes)
    ctx.lineWidth = 2;
    for (var e = 0; e < n; e++) {
      var lc = leftChild(e);
      var rc = rightChild(e);
      if (lc < n) {
        var edgeColor = cssVar('--border-color', '#cbd5e1');
        if (swapping.indexOf(e) !== -1 && swapping.indexOf(lc) !== -1) {
          edgeColor = colorActive();
        } else if (swapping.indexOf(e) !== -1 && swapping.indexOf(rc) !== -1) {
          // this edge is not the swapping one
        }
        ctx.strokeStyle = edgeColor;
        ctx.beginPath();
        ctx.moveTo(positions[e].x, positions[e].y);
        ctx.lineTo(positions[lc].x, positions[lc].y);
        ctx.stroke();
      }
      if (rc < n) {
        var edgeColor2 = cssVar('--border-color', '#cbd5e1');
        if (swapping.indexOf(e) !== -1 && swapping.indexOf(rc) !== -1) {
          edgeColor2 = colorActive();
        }
        ctx.strokeStyle = edgeColor2;
        ctx.beginPath();
        ctx.moveTo(positions[e].x, positions[e].y);
        ctx.lineTo(positions[rc].x, positions[rc].y);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (var ni = 0; ni < n; ni++) {
      var pos = positions[ni];
      var nodeVal = heapArr[ni];
      var fillColor = colorCellBg();
      var textColor = colorCellText();
      var borderColor = cssVar('--border-color', '#cbd5e1');
      var borderWidth = 2;

      if (swapping.indexOf(ni) !== -1) {
        fillColor = colorActive();
        textColor = '#ffffff';
        borderColor = colorActive();
        borderWidth = 3;
      } else if (highlighted.indexOf(ni) !== -1) {
        fillColor = colorActive();
        textColor = '#ffffff';
        borderColor = colorActive();
        borderWidth = 3;
      } else if (ni === parentIdx) {
        fillColor = colorCompare();
        textColor = '#ffffff';
        borderColor = colorCompare();
        borderWidth = 3;
      } else if (completed.indexOf(ni) !== -1) {
        fillColor = colorSorted();
        textColor = '#ffffff';
        borderColor = colorSorted();
        borderWidth = 3;
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();

      // Draw node value
      ctx.fillStyle = textColor;
      ctx.font = 'bold 14px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(nodeVal), pos.x, pos.y);

      // Draw index below node (small)
      ctx.fillStyle = cssVar('--text-tertiary', '#94a3b8');
      ctx.font = '10px ' + fontMono();
      ctx.textBaseline = 'top';
      ctx.fillText(String(ni), pos.x, pos.y + pos.radius + 3);
    }

    // ── Draw array view ────────────────────────────────────
    var cellW = 48;
    var cellH = 36;
    var cellGap = 4;
    var totalArrayW = n * (cellW + cellGap) - cellGap;

    // Responsive: shrink cells if they don't fit
    if (totalArrayW > w - 40) {
      cellW = Math.floor((w - 40 - (n - 1) * cellGap) / n);
      cellH = Math.min(36, Math.max(28, cellW));
      totalArrayW = n * (cellW + cellGap) - cellGap;
    }

    var arrayStartX = Math.max(20, (w - totalArrayW) / 2);
    var arrayY = arrayAreaTop + 15;

    // "Array view:" label
    ctx.fillStyle = cssVar('--text-secondary', '#475569');
    ctx.font = 'bold 12px ' + fontSans();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Array representation:', arrayStartX, arrayY - 4);

    for (var ai = 0; ai < n; ai++) {
      var ax = arrayStartX + ai * (cellW + cellGap);
      var aFill = colorCellBg();
      var aTxt = colorCellText();
      var aBorder = cssVar('--border-color', '#cbd5e1');

      if (swapping.indexOf(ai) !== -1) {
        aFill = colorActive();
        aTxt = '#ffffff';
        aBorder = colorActive();
      } else if (highlighted.indexOf(ai) !== -1) {
        aFill = colorActive();
        aTxt = '#ffffff';
        aBorder = colorActive();
      } else if (ai === parentIdx) {
        aFill = colorCompare();
        aTxt = '#ffffff';
        aBorder = colorCompare();
      } else if (completed.indexOf(ai) !== -1) {
        aFill = colorSorted();
        aTxt = '#ffffff';
        aBorder = colorSorted();
      }

      // Draw cell
      ctx.fillStyle = aFill;
      drawRoundedRect(ctx, ax, arrayY, cellW, cellH, 4);
      ctx.fill();
      ctx.strokeStyle = aBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw value
      ctx.fillStyle = aTxt;
      ctx.font = 'bold 13px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(heapArr[ai]), ax + cellW / 2, arrayY + cellH / 2);

      // Draw index below
      ctx.fillStyle = cssVar('--text-tertiary', '#94a3b8');
      ctx.font = '10px ' + fontMono();
      ctx.textBaseline = 'top';
      ctx.fillText(String(ai), ax + cellW / 2, arrayY + cellH + 3);
    }
  }

  // ── Step change callback ─────────────────────────────────────────────
  function onStepChange(step, data) {
    if (explanationEl && step && step.description) {
      explanationEl.textContent = step.description;
    } else if (explanationEl) {
      explanationEl.textContent = 'Use the controls below to perform heap operations.';
    }
  }

  // ── Random array generator ───────────────────────────────────────────
  function randomArray() {
    var len = 7 + Math.floor(Math.random() * 5); // 7-11 elements
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(5 + Math.floor(Math.random() * 96)); // 5 to 100
    }
    return arr;
  }

  // ── Init ─────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('heap-canvas');
    if (!canvas) return;

    explanationEl = document.querySelector('.viz-explanation');

    heap = INITIAL_HEAP.slice();

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('heap', {
      canvas: canvas,
      onRender: renderStep,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Show initial state
    var initialSteps = [{
      heap: heap.slice(),
      highlighted: [],
      swapping: [],
      completed: [],
      description: 'Max-heap initialized: [' + heap.join(', ') + ']. Root is the maximum element (' + heap[0] + '). Use the buttons below to perform operations.'
    }];
    viz.setSteps(initialSteps);

    // Wire insert button
    var insertBtn = document.getElementById('heap-insert-btn');
    var valueInput = document.getElementById('heap-value-input');

    if (insertBtn) {
      insertBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value to insert.';
          return;
        }
        if (heap.length >= MAX_HEAP_SIZE) {
          if (explanationEl) explanationEl.textContent = 'Heap is full (max ' + MAX_HEAP_SIZE + ' elements for display).';
          return;
        }
        var result = generateInsertSteps(val);
        viz.setSteps(result.steps);
        heap = result.result;
      });
    }

    // Wire extract button
    var extractBtn = document.getElementById('heap-extract-btn');
    if (extractBtn) {
      extractBtn.addEventListener('click', function() {
        var result = generateExtractSteps();
        viz.setSteps(result.steps);
        heap = result.result;
      });
    }

    // Wire randomize button (builds a new heap via heapify)
    var randomizeBtn = document.getElementById('heap-randomize-btn');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', function() {
        var arr = randomArray();
        var result = generateHeapifySteps(arr);
        viz.setSteps(result.steps);
        heap = result.result;
      });
    }

    // Enter key on input triggers insert
    if (valueInput) {
      valueInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && insertBtn) {
          insertBtn.click();
        }
      });
    }
  }

  DSA.heapViz = { init: init };
})();
