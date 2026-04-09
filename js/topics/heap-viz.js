var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var heap = [];
  var explanationEl = null;
  var svgWrap = null;
  var svgEl = null;
  var MAX_HEAP_SIZE = 15;

  // Initial valid max-heap
  var INITIAL_HEAP = [90, 70, 80, 40, 50, 60, 30];

  // ── Heap helpers ─────────────────────────────────────────────────────
  function parentIndex(i) { return Math.floor((i - 1) / 2); }
  function leftChild(i)   { return 2 * i + 1; }
  function rightChild(i)  { return 2 * i + 2; }

  function swapArr(arr, i, j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  // ── Generate Insert steps ────────────────────────────────────────────
  function generateInsertSteps(value) {
    var steps = [];
    var h = heap.slice();

    steps.push({
      heap: h.slice(), highlighted: [], swapping: [], completed: [],
      codeLine: 2, variables: { val: value },
      description: 'Current max-heap: [' + h.join(', ') + ']. We will insert ' + value + '.'
    });

    h.push(value);
    var idx = h.length - 1;
    steps.push({
      heap: h.slice(), highlighted: [idx], swapping: [], completed: [],
      codeLine: 3, variables: { val: value, idx: idx },
      description: 'Insert ' + value + ' at the end of the array (index ' + idx + '). Now we bubble up to restore the heap property.'
    });

    while (idx > 0) {
      var pIdx = parentIndex(idx);
      steps.push({
        heap: h.slice(), highlighted: [idx], swapping: [], completed: [], parent: pIdx,
        codeLine: 5, variables: { val: h[idx], parent: h[pIdx], idx: idx, pIdx: pIdx },
        description: 'Compare ' + h[idx] + ' (index ' + idx + ') with parent ' + h[pIdx] + ' (index ' + pIdx + ').'
      });

      if (h[idx] > h[pIdx]) {
        swapArr(h, idx, pIdx);
        steps.push({
          heap: h.slice(), highlighted: [], swapping: [idx, pIdx], completed: [],
          codeLine: 6, variables: { val: h[pIdx], parent: h[idx] },
          description: 'Swap ' + h[pIdx] + ' and ' + h[idx] + ' because child was larger than parent.'
        });
        idx = pIdx;
      } else {
        steps.push({
          heap: h.slice(), highlighted: [], swapping: [], completed: [idx],
          codeLine: 7, variables: { val: h[idx] },
          description: h[idx] + ' <= parent ' + h[pIdx] + '. Heap property satisfied. Bubble-up complete.'
        });
        break;
      }
    }

    if (idx === 0) {
      steps.push({
        heap: h.slice(), highlighted: [], swapping: [], completed: [0],
        codeLine: 7, variables: { val: h[0] },
        description: 'Element ' + h[0] + ' bubbled up to the root. Insert complete.'
      });
    }

    steps.push({
      heap: h.slice(), highlighted: [], swapping: [], completed: [],
      codeLine: 7, variables: { size: h.length },
      description: 'Insert complete. Max-heap: [' + h.join(', ') + '].'
    });

    return { steps: steps, result: h };
  }

  // ── Generate Extract-Max steps ───────────────────────────────────────
  function generateExtractSteps() {
    var steps = [];
    var h = heap.slice();

    if (h.length === 0) {
      steps.push({ heap: [], highlighted: [], swapping: [], completed: [], description: 'Heap is empty! Nothing to extract.' });
      return { steps: steps, result: h };
    }

    var maxVal = h[0];

    steps.push({
      heap: h.slice(), highlighted: [0], swapping: [], completed: [],
      codeLine: 10, variables: { max: maxVal },
      description: 'Extract-Max: The root element ' + maxVal + ' is the maximum. We will remove it.'
    });

    if (h.length === 1) {
      h = [];
      steps.push({
        heap: h.slice(), highlighted: [], swapping: [], completed: [],
        codeLine: 14, variables: { max: maxVal },
        description: 'Heap had only one element. Extracted ' + maxVal + '. Heap is now empty.'
      });
      return { steps: steps, result: h };
    }

    var lastIdx = h.length - 1;
    swapArr(h, 0, lastIdx);
    steps.push({
      heap: h.slice(), highlighted: [], swapping: [0, lastIdx], completed: [],
      codeLine: 11, variables: { max: h[lastIdx], last: h[0] },
      description: 'Swap root ' + h[lastIdx] + ' with last element ' + h[0] + '.'
    });

    h.pop();
    steps.push({
      heap: h.slice(), highlighted: [0], swapping: [], completed: [],
      codeLine: 12, variables: { max: maxVal, root: h[0] },
      description: 'Remove ' + maxVal + ' from the end. Now sink down ' + h[0] + ' (index 0) to restore heap property.'
    });

    var idx = 0;
    var n = h.length;
    while (true) {
      var left = leftChild(idx);
      var right = rightChild(idx);
      var largest = idx;

      if (left < n && h[left] > h[largest])  largest = left;
      if (right < n && h[right] > h[largest]) largest = right;

      if (largest === idx) {
        steps.push({
          heap: h.slice(), highlighted: [], swapping: [], completed: [idx],
          codeLine: 14, variables: { val: h[idx] },
          description: h[idx] + ' (index ' + idx + ') is larger than both children. Sink-down complete.'
        });
        break;
      }

      var compareIndices = [idx];
      if (left < n)  compareIndices.push(left);
      if (right < n) compareIndices.push(right);
      steps.push({
        heap: h.slice(), highlighted: compareIndices, swapping: [], completed: [], parent: idx,
        codeLine: 13, variables: { val: h[idx], largest: h[largest] },
        description: 'Compare ' + h[idx] + ' (index ' + idx + ') with children. Largest child is ' + h[largest] + ' (index ' + largest + ').'
      });

      swapArr(h, idx, largest);
      steps.push({
        heap: h.slice(), highlighted: [], swapping: [idx, largest], completed: [],
        codeLine: 13, variables: { val: h[idx], largest: h[largest] },
        description: 'Swap ' + h[idx] + ' and ' + h[largest] + '.'
      });

      idx = largest;
    }

    steps.push({
      heap: h.slice(), highlighted: [], swapping: [], completed: [],
      codeLine: 14, variables: { max: maxVal },
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
      heap: h.slice(), highlighted: [], swapping: [], completed: [],
      codeLine: 17, variables: { n: n },
      description: 'Build max-heap from array: [' + h.join(', ') + ']. We start from the last non-leaf node and sift down each node.'
    });

    var lastNonLeaf = Math.floor(n / 2) - 1;

    for (var i = lastNonLeaf; i >= 0; i--) {
      steps.push({
        heap: h.slice(), highlighted: [i], swapping: [], completed: [],
        codeLine: 18, variables: { i: i, val: h[i] },
        description: 'Sift down node ' + h[i] + ' at index ' + i + '.'
      });

      var idx = i;
      while (true) {
        var left = leftChild(idx);
        var right = rightChild(idx);
        var largest = idx;

        if (left < n && h[left] > h[largest])   largest = left;
        if (right < n && h[right] > h[largest])  largest = right;

        if (largest === idx) {
          steps.push({
            heap: h.slice(), highlighted: [], swapping: [], completed: [idx],
            codeLine: 18, variables: { val: h[idx] },
            description: h[idx] + ' at index ' + idx + ' satisfies heap property. No swap needed.'
          });
          break;
        }

        steps.push({
          heap: h.slice(), highlighted: [idx, largest], swapping: [], completed: [], parent: idx,
          codeLine: 13, variables: { val: h[idx], largest: h[largest] },
          description: 'Compare ' + h[idx] + ' (index ' + idx + ') with largest child ' + h[largest] + ' (index ' + largest + ').'
        });

        swapArr(h, idx, largest);
        steps.push({
          heap: h.slice(), highlighted: [], swapping: [idx, largest], completed: [],
          codeLine: 13, variables: { val: h[idx], largest: h[largest] },
          description: 'Swap ' + h[idx] + ' and ' + h[largest] + '.'
        });

        idx = largest;
      }
    }

    steps.push({
      heap: h.slice(), highlighted: [], swapping: [], completed: [],
      codeLine: 14, variables: { n: n },
      description: 'Heapify complete! Max-heap: [' + h.join(', ') + '].'
    });

    return { steps: steps, result: h };
  }

  // ── Random array generator ───────────────────────────────────────────
  function randomArray() {
    var len = 7 + Math.floor(Math.random() * 5);
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(5 + Math.floor(Math.random() * 96));
    }
    return arr;
  }

  // ── SVG helpers ───────────────────────────────────────────────────────
  function svgMake(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function buildSVG(wrap) {
    var svg = svgMake('svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrap.innerHTML = '';
    wrap.appendChild(svg);
    return svg;
  }

  // ── Compute tree node positions (complete binary tree) ────────────────
  // Returns array of {x, y} indexed by heap index
  function computeTreePositions(heapSize, treeW, treeH) {
    if (heapSize === 0) return [];
    var positions = [];
    var levelSpacing = Math.min(70, (treeH - 40) / (Math.floor(Math.log(heapSize) / Math.log(2)) + 1));
    var topPad = 35;
    var horizontalPad = 20;

    for (var i = 0; i < heapSize; i++) {
      var level = Math.floor(Math.log(i + 1) / Math.log(2));
      var nodesAtLevel = Math.pow(2, level);
      var indexInLevel = i - (nodesAtLevel - 1);
      var availW = treeW - horizontalPad * 2;
      var slotW = availW / nodesAtLevel;
      var x = horizontalPad + slotW * indexInLevel + slotW / 2;
      var y = topPad + level * levelSpacing;
      positions.push({ x: x, y: y });
    }
    return positions;
  }

  // ── Render a step to SVG ──────────────────────────────────────────────
  function renderStep(step) {
    if (!svgEl || !svgWrap) return;

    var rect = svgWrap.getBoundingClientRect();
    var w = (rect.width > 20 ? rect.width : svgWrap.offsetWidth) || 600;
    var h = (rect.height > 20 ? rect.height : svgWrap.offsetHeight) || 400;
    svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgEl.innerHTML = '';

    if (!step) {
      var msg = svgMake('text');
      msg.setAttribute('x', w / 2);
      msg.setAttribute('y', h / 2);
      msg.setAttribute('text-anchor', 'middle');
      msg.setAttribute('dominant-baseline', 'central');
      msg.setAttribute('fill', 'var(--text-secondary)');
      msg.setAttribute('font-size', '16');
      msg.textContent = 'Use the controls below to perform heap operations.';
      svgEl.appendChild(msg);
      return;
    }

    var heapArr = step.heap;
    var n = heapArr.length;

    if (n === 0) {
      var emptyMsg = svgMake('text');
      emptyMsg.setAttribute('x', w / 2);
      emptyMsg.setAttribute('y', h / 2);
      emptyMsg.setAttribute('text-anchor', 'middle');
      emptyMsg.setAttribute('dominant-baseline', 'central');
      emptyMsg.setAttribute('fill', 'var(--text-secondary)');
      emptyMsg.setAttribute('font-size', '16');
      emptyMsg.textContent = 'Heap is empty.';
      svgEl.appendChild(emptyMsg);
      return;
    }

    var highlighted = step.highlighted || [];
    var swapping    = step.swapping    || [];
    var completed   = step.completed   || [];
    var parentIdx   = (typeof step.parent === 'number') ? step.parent : -1;

    // Layout: top 62% = tree, bottom 38% = array view
    var treeDivider  = h * 0.60;
    var arrayAreaTop = treeDivider + 12;
    var treeW = w;

    var positions = computeTreePositions(n, treeW, treeDivider);
    var NODE_R = 20;

    // ── Draw tree edges ──────────────────────────────────────────────
    var edgeGroup = svgMake('g');
    for (var e = 0; e < n; e++) {
      var lc = leftChild(e);
      var rc = rightChild(e);
      if (lc < n) {
        var l1 = svgMake('line');
        l1.setAttribute('x1', positions[e].x);
        l1.setAttribute('y1', positions[e].y);
        l1.setAttribute('x2', positions[lc].x);
        l1.setAttribute('y2', positions[lc].y);
        var edgeCls = 'svg-edge svg-edge--default';
        if (swapping.indexOf(e) !== -1 && swapping.indexOf(lc) !== -1) edgeCls = 'svg-edge svg-edge--active';
        l1.setAttribute('class', edgeCls);
        edgeGroup.appendChild(l1);
      }
      if (rc < n) {
        var l2 = svgMake('line');
        l2.setAttribute('x1', positions[e].x);
        l2.setAttribute('y1', positions[e].y);
        l2.setAttribute('x2', positions[rc].x);
        l2.setAttribute('y2', positions[rc].y);
        var edgeCls2 = 'svg-edge svg-edge--default';
        if (swapping.indexOf(e) !== -1 && swapping.indexOf(rc) !== -1) edgeCls2 = 'svg-edge svg-edge--active';
        l2.setAttribute('class', edgeCls2);
        edgeGroup.appendChild(l2);
      }
    }
    svgEl.appendChild(edgeGroup);

    // ── Draw tree nodes ──────────────────────────────────────────────
    for (var ni = 0; ni < n; ni++) {
      var pos = positions[ni];
      var state = 'default';
      if (swapping.indexOf(ni) !== -1)      state = 'swapping';
      else if (highlighted.indexOf(ni) !== -1) state = 'highlighted';
      else if (ni === parentIdx)              state = 'compare';
      else if (completed.indexOf(ni) !== -1) state = 'completed';

      var g = svgMake('g');
      g.setAttribute('class', 'svg-node svg-node--' + state);
      g.setAttribute('transform', 'translate(' + pos.x + ',' + pos.y + ')');

      var circle = svgMake('circle');
      circle.setAttribute('r', NODE_R);
      g.appendChild(circle);

      var valText = svgMake('text');
      valText.setAttribute('text-anchor', 'middle');
      valText.setAttribute('dominant-baseline', 'central');
      valText.textContent = String(heapArr[ni]);
      g.appendChild(valText);

      // Index label below node (small, muted)
      var idxText = svgMake('text');
      idxText.setAttribute('text-anchor', 'middle');
      idxText.setAttribute('y', NODE_R + 12);
      idxText.setAttribute('font-size', '10');
      idxText.setAttribute('fill', 'var(--text-tertiary)');
      idxText.setAttribute('font-family', 'var(--font-mono, monospace)');
      idxText.setAttribute('pointer-events', 'none');
      idxText.textContent = String(ni);
      g.appendChild(idxText);

      svgEl.appendChild(g);
    }

    // ── Draw array view ──────────────────────────────────────────────
    var CELL_W = 44;
    var CELL_H = 34;
    var CELL_GAP = 4;
    var totalW = n * (CELL_W + CELL_GAP) - CELL_GAP;

    // Shrink cells if they don't fit
    if (totalW > w - 32) {
      CELL_W = Math.max(28, Math.floor((w - 32 - (n - 1) * CELL_GAP) / n));
      CELL_H = Math.min(34, Math.max(26, CELL_W));
      totalW = n * (CELL_W + CELL_GAP) - CELL_GAP;
    }

    var arrayStartX = Math.max(16, (w - totalW) / 2);
    var arrayY = arrayAreaTop + 18;

    // "Array representation:" label
    var arrLabel = svgMake('text');
    arrLabel.setAttribute('x', arrayStartX);
    arrLabel.setAttribute('y', arrayAreaTop + 4);
    arrLabel.setAttribute('font-size', '11');
    arrLabel.setAttribute('font-weight', '600');
    arrLabel.setAttribute('fill', 'var(--text-secondary)');
    arrLabel.setAttribute('font-family', 'var(--font-sans, sans-serif)');
    arrLabel.textContent = 'Array representation:';
    svgEl.appendChild(arrLabel);

    for (var ai = 0; ai < n; ai++) {
      var ax = arrayStartX + ai * (CELL_W + CELL_GAP);

      var cellState = 'default';
      if (swapping.indexOf(ai) !== -1)        cellState = 'swapping';
      else if (highlighted.indexOf(ai) !== -1) cellState = 'highlighted';
      else if (ai === parentIdx)               cellState = 'compare';
      else if (completed.indexOf(ai) !== -1)  cellState = 'completed';

      // Map state to fill/stroke colors via inline style so we don't need more CSS classes
      var fillCol, strokeCol;
      if (cellState === 'swapping' || cellState === 'highlighted') {
        fillCol = 'var(--viz-active)'; strokeCol = 'var(--viz-active)';
      } else if (cellState === 'compare') {
        fillCol = 'var(--viz-compare)'; strokeCol = 'var(--viz-compare)';
      } else if (cellState === 'completed') {
        fillCol = 'var(--accent-success)'; strokeCol = 'var(--accent-success)';
      } else {
        fillCol = 'var(--bg-card)'; strokeCol = 'var(--border-color)';
      }

      var rect = svgMake('rect');
      rect.setAttribute('x', ax);
      rect.setAttribute('y', arrayY);
      rect.setAttribute('width', CELL_W);
      rect.setAttribute('height', CELL_H);
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', fillCol);
      rect.setAttribute('stroke', strokeCol);
      rect.setAttribute('stroke-width', '1.5');
      rect.setAttribute('style', 'transition: fill 0.35s ease, stroke 0.35s ease;');
      svgEl.appendChild(rect);

      var textFill = (cellState === 'default') ? 'var(--text-primary)' : '#fff';
      var cellVal = svgMake('text');
      cellVal.setAttribute('x', ax + CELL_W / 2);
      cellVal.setAttribute('y', arrayY + CELL_H / 2);
      cellVal.setAttribute('text-anchor', 'middle');
      cellVal.setAttribute('dominant-baseline', 'central');
      cellVal.setAttribute('font-size', '13');
      cellVal.setAttribute('font-weight', '700');
      cellVal.setAttribute('fill', textFill);
      cellVal.setAttribute('font-family', 'var(--font-sans, sans-serif)');
      cellVal.setAttribute('pointer-events', 'none');
      cellVal.textContent = String(heapArr[ai]);
      svgEl.appendChild(cellVal);

      // Index below cell
      var cellIdx = svgMake('text');
      cellIdx.setAttribute('x', ax + CELL_W / 2);
      cellIdx.setAttribute('y', arrayY + CELL_H + 10);
      cellIdx.setAttribute('text-anchor', 'middle');
      cellIdx.setAttribute('font-size', '10');
      cellIdx.setAttribute('fill', 'var(--text-tertiary)');
      cellIdx.setAttribute('font-family', 'var(--font-mono, monospace)');
      cellIdx.setAttribute('pointer-events', 'none');
      cellIdx.textContent = String(ai);
      svgEl.appendChild(cellIdx);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────
  function init() {
    svgWrap = document.getElementById('heap-svg-wrap');
    if (!svgWrap) return;

    svgEl = buildSVG(svgWrap);
    explanationEl = document.querySelector('.viz-explanation');

    heap = INITIAL_HEAP.slice();

    // Hidden canvas for vizCore control binding
    var fakeCanvas = document.createElement('canvas');
    fakeCanvas.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
    var container = svgWrap.closest('.viz-container');
    if (container) container.appendChild(fakeCanvas);

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('heap', {
      canvas: fakeCanvas,
      tweenDuration: 0,
      onRender: function(_ctx, step) {
        renderStep(step);
      },
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step && step.description) {
          explanationEl.textContent = step.description;
        } else if (explanationEl) {
          explanationEl.textContent = 'Use the controls below to perform heap operations.';
        }
      }
    });

    window.addEventListener('resize', function() {
      if (viz) viz.render();
    });

    // Show initial state
    var initialSteps = [{
      heap: heap.slice(), highlighted: [], swapping: [], completed: [],
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

    // Wire randomize button
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
