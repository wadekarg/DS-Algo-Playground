var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var CELL_W = 52;
  var CELL_H = 44;
  var GAP = 6;

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  // ── Step generation: Next Greater Element with monotonic stack ─────────
  function generateSteps(arr) {
    var n = arr.length;
    var steps = [];
    var stack = []; // indices
    var nge = new Array(n).fill(-1);

    function snap(currentIdx, popIdx, desc, codeLine) {
      steps.push({
        arr: arr.slice(),
        stack: stack.slice(),
        nge: nge.slice(),
        currentIdx: currentIdx,
        popIdx: popIdx !== undefined ? popIdx : -1,
        codeLine: codeLine || 1,
        description: desc
      });
    }

    snap(-1, -1, 'Input: [' + arr.join(', ') + ']. We will find the Next Greater Element for each position using a monotonic decreasing stack.', 1);

    for (var i = 0; i < n; i++) {
      snap(i, -1, 'Current element: arr[' + i + '] = ' + arr[i] + '. Check if it is greater than any waiting element on the stack.', 3);

      while (stack.length > 0 && arr[stack[stack.length - 1]] < arr[i]) {
        var top = stack[stack.length - 1];
        snap(i, top, 'arr[' + top + '] = ' + arr[top] + ' < arr[' + i + '] = ' + arr[i] + '. Pop index ' + top + ' — its next greater element is ' + arr[i] + '.', 5);
        stack.pop();
        nge[top] = arr[i];
        snap(i, top, 'Recorded NGE[' + top + '] = ' + arr[i] + '. Stack: [' + stack.map(function(x) { return arr[x]; }).join(', ') + '].', 6);
      }

      stack.push(i);
      snap(i, -1, 'Push index ' + i + ' (value ' + arr[i] + ') onto the stack. Stack: [' + stack.map(function(x) { return arr[x]; }).join(', ') + '].', 8);
    }

    // Remaining stack elements have no greater element
    while (stack.length > 0) {
      var rem = stack.pop();
      nge[rem] = -1;
    }
    snap(-1, -1, 'Done! Remaining indices have no greater element to the right (NGE = -1). Result: [' + nge.join(', ') + '].', 10);

    return steps;
  }

  // ── Draw a horizontal row of cells ────────────────────────────────────
  function drawRow(ctx, label, values, highlights, y, w, indexLabels) {
    var n = values.length;
    var totalW = n * CELL_W + (n - 1) * GAP;
    var startX = (w - totalW) / 2;
    var labelX = startX - 10;

    ctx.fillStyle = cssVar('--text-secondary');
    ctx.font = 'bold 12px ' + cssVar('--font-mono');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, labelX, y + CELL_H / 2);

    for (var i = 0; i < n; i++) {
      var x = startX + i * (CELL_W + GAP);
      var fill = cssVar('--viz-cell-bg');
      var text = cssVar('--viz-cell-text');

      if (highlights[i] === 'current') { fill = cssVar('--viz-active'); text = '#fff'; }
      else if (highlights[i] === 'pop') { fill = cssVar('--viz-swap'); text = '#fff'; }
      else if (highlights[i] === 'done') { fill = cssVar('--viz-found'); text = '#fff'; }
      else if (highlights[i] === 'stack') { fill = cssVar('--viz-default'); text = '#fff'; }

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(x, y, CELL_W, CELL_H, 5);
      ctx.fill();

      ctx.fillStyle = text;
      ctx.font = 'bold 16px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var display = values[i] === null ? '—' : String(values[i]);
      ctx.fillText(display, x + CELL_W / 2, y + CELL_H / 2);

      if (indexLabels) {
        ctx.fillStyle = cssVar('--text-tertiary');
        ctx.font = '11px ' + cssVar('--font-mono');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(i), x + CELL_W / 2, y + CELL_H + 4);
      }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  function onRender(ctx, step, meta) {
    var w = meta.width;
    var h = meta.height;
    ctx.clearRect(0, 0, w, h);

    if (!step) {
      ctx.fillStyle = cssVar('--text-tertiary');
      ctx.font = '14px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press Run to start the visualization.', w / 2, h / 2);
      return;
    }

    var arr = step.arr;
    var stack = step.stack;
    var nge = step.nge;
    var n = arr.length;

    // Section padding
    var secPad = 30;
    var rowStart = secPad;

    // Row 1: input array
    var h1 = {};
    for (var i = 0; i < n; i++) {
      if (i === step.currentIdx) h1[i] = 'current';
      else if (i === step.popIdx) h1[i] = 'pop';
      else if (nge[i] !== -1) h1[i] = 'done';
    }
    // Section label
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '11px ' + cssVar('--font-mono');
    ctx.textAlign = 'center';
    ctx.fillText('INPUT ARRAY', w / 2, rowStart);
    drawRow(ctx, '', arr, h1, rowStart + 14, w, true);

    // Row 2: stack (show as horizontal array, leftmost = bottom of stack)
    var stackRow = rowStart + CELL_H + 60;
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '11px ' + cssVar('--font-mono');
    ctx.textAlign = 'center';
    ctx.fillText('STACK (indices / values)', w / 2, stackRow);

    if (stack.length === 0) {
      ctx.fillStyle = cssVar('--text-tertiary');
      ctx.font = '14px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.fillText('(empty)', w / 2, stackRow + 14 + CELL_H / 2);
    } else {
      var stackH = {};
      for (var j = 0; j < stack.length; j++) {
        stackH[j] = stack[j] === step.popIdx ? 'pop' : 'stack';
      }
      var stackLabels = stack.map(function(idx) { return idx + ':' + arr[idx]; });
      drawRow(ctx, '', stackLabels, stackH, stackRow + 14, w, false);
    }

    // Row 3: NGE result
    var ngeRow = stackRow + CELL_H + 60;
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '11px ' + cssVar('--font-mono');
    ctx.textAlign = 'center';
    ctx.fillText('NEXT GREATER ELEMENT', w / 2, ngeRow);

    var ngeH = {};
    for (var k = 0; k < n; k++) {
      ngeH[k] = nge[k] !== -1 ? 'done' : '';
    }
    drawRow(ctx, '', nge, ngeH, ngeRow + 14, w, true);

    // Legend
    var legY = h - 26;
    var legItems = [
      { color: cssVar('--viz-active'), label: 'current' },
      { color: cssVar('--viz-swap'), label: 'popped' },
      { color: cssVar('--viz-found'), label: 'resolved' },
      { color: cssVar('--viz-default'), label: 'in stack' }
    ];
    var legTotalW = legItems.length * 100;
    var legStartX = (w - legTotalW) / 2;
    for (var li = 0; li < legItems.length; li++) {
      var lx = legStartX + li * 100;
      ctx.fillStyle = legItems[li].color;
      ctx.beginPath();
      ctx.roundRect(lx, legY, 14, 14, 3);
      ctx.fill();
      ctx.fillStyle = cssVar('--text-secondary');
      ctx.font = '11px ' + cssVar('--font-sans');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(legItems[li].label, lx + 18, legY + 7);
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('mono-stack-canvas');
    if (!canvas) return;

    var explanationEl = document.querySelector('.viz-explanation');
    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('mono-stack', {
      canvas: canvas,
      tweenDuration: 0,
      onRender: onRender,
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step) explanationEl.textContent = step.description;
        else if (explanationEl) explanationEl.textContent = 'Press Run to visualize the Next Greater Element algorithm.';
      }
    });

    var defaultArr = [2, 1, 2, 4, 3];
    viz.setSteps([generateSteps(defaultArr)[0]]);

    var runBtn = document.getElementById('mono-stack-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', function() {
        viz.setSteps(generateSteps(defaultArr));
      });
    }
    var resetBtn = document.getElementById('mono-stack-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var s = generateSteps(defaultArr);
        viz.setSteps([s[0]]);
      });
    }
  }

  DSA.monotonicStackViz = { init: init };
})();
