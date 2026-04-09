var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var queue = [];
  var explanationEl = null;

  // Cell dimensions
  var CELL_W = 64;
  var CELL_H = 50;
  var GAP = 4;
  var TOP_PAD = 50;
  var POINTER_GAP = 28;

  // Initial queue
  var INITIAL_QUEUE = [15, 42, 8, 23, 7];

  /* -- CSS colour helpers ------------------------------------------------ */

  function cssVar(name, fallback) {
    var val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return val || fallback || '';
  }

  function colorDefault()  { return cssVar('--viz-default',   '#3b82f6'); }
  function colorActive()   { return cssVar('--viz-active',    '#ef4444'); }
  function colorFound()    { return cssVar('--viz-found',     '#22c55e'); }
  function colorCellBg()   { return cssVar('--viz-cell-bg',   '#e2e8f0'); }
  function colorCellText() { return cssVar('--viz-cell-text', '#1e293b'); }

  function fontSans() { return cssVar('--font-sans', 'sans-serif'); }
  function fontMono() { return cssVar('--font-mono', 'monospace'); }

  /* -- Drawing primitives ------------------------------------------------ */

  function cellX(index, totalCells, canvasW) {
    var totalWidth = totalCells * CELL_W + (totalCells - 1) * GAP;
    var startX = Math.max(10, (canvasW - totalWidth) / 2);
    return startX + index * (CELL_W + GAP);
  }

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

  function drawCell(ctx, x, y, value, fillColor, textColor) {
    ctx.fillStyle = fillColor;
    drawRoundedRect(ctx, x, y, CELL_W, CELL_H, 6);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px ' + fontSans();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + CELL_W / 2, y + CELL_H / 2);
  }

  function drawIndex(ctx, x, y, index) {
    ctx.fillStyle = cssVar('--text-tertiary', '#94a3b8');
    ctx.font = '12px ' + fontMono();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(index), x + CELL_W / 2, y + CELL_H + 6);
  }

  function drawPointerBelow(ctx, x, y, label, color) {
    var cx = x + CELL_W / 2;
    var arrowStartY = y + CELL_H + POINTER_GAP;
    var arrowTipY = y + CELL_H + 8;
    var labelY = arrowStartY + 6;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

    // Arrow shaft pointing upward
    ctx.beginPath();
    ctx.moveTo(cx, arrowStartY);
    ctx.lineTo(cx, arrowTipY);
    ctx.stroke();

    // Arrowhead pointing up
    ctx.beginPath();
    ctx.moveTo(cx, arrowTipY);
    ctx.lineTo(cx - 5, arrowTipY + 8);
    ctx.lineTo(cx + 5, arrowTipY + 8);
    ctx.closePath();
    ctx.fill();

    // Label below arrow
    ctx.font = 'bold 12px ' + fontSans();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, cx, labelY);
  }

  /* -- Render function (called by vizCore for every step) ---------------- */

  function render(ctx, step, meta) {
    var w = meta.width;
    var h = meta.height;

    if (!step) {
      // Draw current queue state
      drawQueueState(ctx, queue, w, {}, 0, queue.length - 1, '');
      return;
    }

    var cells = step.cells;
    var highlights = step.highlights || {};
    var frontIndex = step.frontIndex;
    var rearIndex = step.rearIndex;
    var description = step.description || '';

    drawQueueState(ctx, cells, w, highlights, frontIndex, rearIndex, description);
  }

  function drawQueueState(ctx, cells, canvasW, highlights, frontIdx, rearIdx, description) {
    var len = cells.length;

    if (len === 0) {
      ctx.fillStyle = colorCellText();
      ctx.font = '16px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Queue is empty', canvasW / 2, TOP_PAD + CELL_H / 2);
      return;
    }

    // Draw cells
    for (var i = 0; i < len; i++) {
      var x = cellX(i, len, canvasW);
      var y = TOP_PAD;

      var bg = colorCellBg();
      var txt = colorCellText();

      if (highlights[i]) {
        bg = highlights[i];
        txt = '#ffffff';
      }

      if (highlights[i] === 'fading') {
        ctx.globalAlpha = 0.3;
        bg = colorActive();
        txt = '#ffffff';
      }

      drawCell(ctx, x, y, cells[i], bg, txt);
      drawIndex(ctx, x, y, i);

      if (highlights[i] === 'fading') {
        ctx.globalAlpha = 1.0;
      }
    }

    // Draw front pointer (red / --viz-active)
    if (typeof frontIdx === 'number' && frontIdx >= 0 && frontIdx < len) {
      var frontX = cellX(frontIdx, len, canvasW);
      drawPointerBelow(ctx, frontX, TOP_PAD, 'front', colorActive());
    }

    // Draw rear pointer (blue / --viz-default)
    if (typeof rearIdx === 'number' && rearIdx >= 0 && rearIdx < len) {
      var rearX = cellX(rearIdx, len, canvasW);
      // Offset label if front and rear overlap
      if (frontIdx === rearIdx) {
        var cx = rearX + CELL_W / 2;
        var baseY = TOP_PAD + CELL_H + POINTER_GAP + 6;
        ctx.fillStyle = colorDefault();
        ctx.font = 'bold 12px ' + fontSans();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('rear', cx, baseY + 16);
      } else {
        drawPointerBelow(ctx, rearX, TOP_PAD, 'rear', colorDefault());
      }
    }
  }

  function updateExplanation(step, meta) {
    if (!explanationEl) return;
    if (!step) {
      explanationEl.textContent = 'Queue: [' + queue.join(', ') + ']. Use the operation buttons below.';
      return;
    }
    explanationEl.textContent = step.description || ('Step ' + (meta.step + 1) + ' of ' + meta.totalSteps);
  }

  /* -- Step builders ----------------------------------------------------- */

  function buildEnqueueSteps(value) {
    var steps = [];
    var snapshot = queue.slice();
    var len = snapshot.length;

    // Step 1: Show current state
    steps.push({
      cells: snapshot.slice(),
      frontIndex: 0,
      rearIndex: len - 1,
      highlights: {},
      codeLine: 7,
      variables: { val: value },
      description: 'Current queue: [' + snapshot.join(', ') + ']. We will enqueue ' + value + ' at the rear.'
    });

    // Step 2: Highlight rear
    if (len > 0) {
      var h2 = {};
      h2[len - 1] = colorDefault();
      steps.push({
        cells: snapshot.slice(),
        frontIndex: 0,
        rearIndex: len - 1,
        highlights: h2,
        codeLine: 8,
        variables: { val: value },
        description: 'Current rear is at index ' + (len - 1) + ' (value: ' + snapshot[len - 1] + ').'
      });
    }

    // Step 3: New element appears at the end
    var newArr = snapshot.slice();
    newArr.push(value);
    var h3 = {};
    h3[newArr.length - 1] = colorFound();
    steps.push({
      cells: newArr,
      frontIndex: 0,
      rearIndex: newArr.length - 1,
      highlights: h3,
      codeLine: 8,
      variables: { val: value, size: newArr.length },
      description: 'Value ' + value + ' added at index ' + (newArr.length - 1) + '. Rear pointer moves to the new element.'
    });

    // Step 4: Final clean state
    steps.push({
      cells: newArr,
      frontIndex: 0,
      rearIndex: newArr.length - 1,
      highlights: {},
      codeLine: 8,
      variables: { size: newArr.length },
      description: 'Enqueue complete. Queue now has ' + newArr.length + ' elements: [' + newArr.join(', ') + '].'
    });

    return { steps: steps, result: newArr };
  }

  function buildDequeueSteps() {
    var steps = [];
    var snapshot = queue.slice();
    var len = snapshot.length;

    if (len === 0) {
      steps.push({
        cells: [],
        frontIndex: -1,
        rearIndex: -1,
        highlights: {},
        description: 'Error: Cannot dequeue from an empty queue.'
      });
      return { steps: steps, result: snapshot };
    }

    var removedValue = snapshot[0];

    // Step 1: Show current state
    steps.push({
      cells: snapshot.slice(),
      frontIndex: 0,
      rearIndex: len - 1,
      highlights: {},
      codeLine: 11,
      variables: { front: removedValue },
      description: 'Current queue: [' + snapshot.join(', ') + ']. We will dequeue from the front.'
    });

    // Step 2: Highlight front element
    var h2 = {};
    h2[0] = colorActive();
    steps.push({
      cells: snapshot.slice(),
      frontIndex: 0,
      rearIndex: len - 1,
      highlights: h2,
      codeLine: 11,
      variables: { front: removedValue },
      description: 'Front element is ' + removedValue + ' at index 0. This will be removed.'
    });

    // Step 3: Fade out the front element
    var h3 = {};
    h3[0] = 'fading';
    steps.push({
      cells: snapshot.slice(),
      frontIndex: 0,
      rearIndex: len - 1,
      highlights: h3,
      codeLine: 11,
      variables: { front: removedValue },
      description: 'Removing ' + removedValue + ' from the front of the queue.'
    });

    // Step 4: Element removed, remaining elements shown
    var newArr = snapshot.slice(1);
    if (newArr.length > 0) {
      var h4 = {};
      h4[0] = colorActive();
      steps.push({
        cells: newArr,
        frontIndex: 0,
        rearIndex: newArr.length - 1,
        highlights: h4,
        description: 'Dequeued ' + removedValue + '. New front is ' + newArr[0] + '. Queue has ' + newArr.length + ' elements.'
      });
    } else {
      steps.push({
        cells: newArr,
        frontIndex: -1,
        rearIndex: -1,
        highlights: {},
        description: 'Dequeued ' + removedValue + '. The queue is now empty.'
      });
    }

    // Step 5: Final state
    steps.push({
      cells: newArr,
      frontIndex: newArr.length > 0 ? 0 : -1,
      rearIndex: newArr.length > 0 ? newArr.length - 1 : -1,
      highlights: {},
      description: 'Dequeue complete. Returned value: ' + removedValue + '.'
    });

    return { steps: steps, result: newArr };
  }

  function buildPeekSteps() {
    var steps = [];
    var snapshot = queue.slice();
    var len = snapshot.length;

    if (len === 0) {
      steps.push({
        cells: [],
        frontIndex: -1,
        rearIndex: -1,
        highlights: {},
        description: 'Error: Cannot peek at an empty queue.'
      });
      return { steps: steps, result: snapshot };
    }

    // Step 1: Show current state
    steps.push({
      cells: snapshot.slice(),
      frontIndex: 0,
      rearIndex: len - 1,
      highlights: {},
      description: 'Current queue: [' + snapshot.join(', ') + ']. We will peek at the front element.'
    });

    // Step 2: Highlight front element
    var h2 = {};
    h2[0] = colorFound();
    steps.push({
      cells: snapshot.slice(),
      frontIndex: 0,
      rearIndex: len - 1,
      highlights: h2,
      description: 'Peek: the front element is ' + snapshot[0] + ' (index 0). The queue is not modified.'
    });

    // Step 3: Clean state
    steps.push({
      cells: snapshot.slice(),
      frontIndex: 0,
      rearIndex: len - 1,
      highlights: {},
      description: 'Peek complete. Front value is ' + snapshot[0] + '. Queue unchanged (' + len + ' elements).'
    });

    return { steps: steps, result: snapshot };
  }

  function buildIsEmptySteps() {
    var steps = [];
    var snapshot = queue.slice();
    var len = snapshot.length;
    var empty = len === 0;

    // Step 1: Show current state
    steps.push({
      cells: snapshot.slice(),
      frontIndex: len > 0 ? 0 : -1,
      rearIndex: len > 0 ? len - 1 : -1,
      highlights: {},
      description: 'Checking if the queue is empty...'
    });

    // Step 2: Result
    if (empty) {
      steps.push({
        cells: [],
        frontIndex: -1,
        rearIndex: -1,
        highlights: {},
        description: 'isEmpty() returns true. The queue has no elements.'
      });
    } else {
      var hAll = {};
      for (var i = 0; i < len; i++) {
        hAll[i] = colorDefault();
      }
      steps.push({
        cells: snapshot.slice(),
        frontIndex: 0,
        rearIndex: len - 1,
        highlights: hAll,
        description: 'isEmpty() returns false. The queue has ' + len + ' element' + (len > 1 ? 's' : '') + '.'
      });
    }

    // Step 3: Final clean
    steps.push({
      cells: snapshot.slice(),
      frontIndex: len > 0 ? 0 : -1,
      rearIndex: len > 0 ? len - 1 : -1,
      highlights: {},
      description: 'isEmpty check complete.'
    });

    return { steps: steps, result: snapshot };
  }

  /* -- Initialisation ---------------------------------------------------- */

  function init() {
    var canvas = document.getElementById('queue-canvas');
    if (!canvas) return;

    explanationEl = document.querySelector('.viz-explanation');

    queue = INITIAL_QUEUE.slice();

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('queue', {
      canvas: canvas,
      onRender: render,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        updateExplanation(step, data);
      }
    });

    // Wire buttons
    var enqueueBtn = document.getElementById('queue-enqueue-btn');
    var dequeueBtn = document.getElementById('queue-dequeue-btn');
    var peekBtn    = document.getElementById('queue-peek-btn');
    var valueInput = document.getElementById('queue-value-input');

    if (enqueueBtn) {
      enqueueBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value.';
          return;
        }
        var result = buildEnqueueSteps(val);
        viz.setSteps(result.steps);
        queue = result.result;
      });
    }

    if (dequeueBtn) {
      dequeueBtn.addEventListener('click', function() {
        var result = buildDequeueSteps();
        viz.setSteps(result.steps);
        queue = result.result;
      });
    }

    if (peekBtn) {
      peekBtn.addEventListener('click', function() {
        var result = buildPeekSteps();
        viz.setSteps(result.steps);
        // peek does not modify the queue
      });
    }
  }

  DSA.queueViz = { init: init };
})();
