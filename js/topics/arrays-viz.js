var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var arr = [];
  var CELL_W = 60;
  var CELL_H = 50;
  var GAP = 4;
  var TOP_PAD = 40;
  var INDEX_PAD = 22;

  /* ── CSS colour helpers ─────────────────────────────────── */

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function colorDefault()  { return cssVar('--viz-default'); }
  function colorActive()   { return cssVar('--viz-active'); }
  function colorFound()    { return cssVar('--viz-found'); }
  function colorCellBg()   { return cssVar('--viz-cell-bg'); }
  function colorCellText() { return cssVar('--viz-cell-text'); }

  /* ── Drawing primitives ─────────────────────────────────── */

  function cellX(index, totalCells, canvasW) {
    var totalWidth = totalCells * CELL_W + (totalCells - 1) * GAP;
    var startX = Math.max(10, (canvasW - totalWidth) / 2);
    return startX + index * (CELL_W + GAP);
  }

  function drawCell(ctx, x, y, value, fillColor, textColor) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, CELL_W, CELL_H, 4);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px ' + cssVar('--font-sans');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + CELL_W / 2, y + CELL_H / 2);
  }

  function drawIndex(ctx, x, y, index) {
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '12px ' + cssVar('--font-mono');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(index), x + CELL_W / 2, y + CELL_H + 6);
  }

  function drawPointerArrow(ctx, x, y) {
    var tipY = y - 6;
    var baseY = tipY - 16;
    var cx = x + CELL_W / 2;
    ctx.fillStyle = colorActive();
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - 7, baseY);
    ctx.lineTo(cx + 7, baseY);
    ctx.closePath();
    ctx.fill();
  }

  /* ── Tween helpers ──────────────────────────────────────────────── */

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── Render function (called by vizCore for every step) ── */

  function render(ctx, step, meta, fromStep, tweenT) {
    var w = meta.width;
    var h = meta.height;

    // Background
    ctx.fillStyle = cssVar('--bg-secondary');
    ctx.fillRect(0, 0, w, h);

    if (!step) {
      // Initial state – draw current array
      drawArrayState(ctx, arr, w, {}, undefined, undefined, null, 1);
      drawLabel(ctx, w, 'Array with ' + arr.length + ' elements');
      return;
    }

    var cells = step.cells;         // array of values to render
    var highlights = step.highlights || {};  // index -> colour
    var pointer = step.pointer;     // index or null
    var fadingOut = step.fadingOut; // index (for delete fade)
    var dropping = step.dropping;   // {index, value}

    var isTweening = fromStep && tweenT !== undefined && tweenT < 1;
    var t = (isTweening) ? tweenT : 1;

    drawArrayState(ctx, cells, w, highlights, fadingOut, dropping, fromStep, t);

    if (typeof pointer === 'number') {
      // Lerp pointer arrow position if it moved
      var pointerIdx = pointer;
      if (isTweening && fromStep && typeof fromStep.pointer === 'number' && fromStep.pointer !== pointer) {
        var fromCX = cellX(fromStep.pointer, cells.length, w) + CELL_W / 2;
        var toCX   = cellX(pointer,           cells.length, w) + CELL_W / 2;
        var interpCX = lerp(fromCX, toCX, t);
        // Draw arrow at interpolated x
        var tipY = TOP_PAD - 6;
        var baseY = tipY - 16;
        ctx.fillStyle = colorActive();
        ctx.beginPath();
        ctx.moveTo(interpCX, tipY);
        ctx.lineTo(interpCX - 7, baseY);
        ctx.lineTo(interpCX + 7, baseY);
        ctx.closePath();
        ctx.fill();
      } else {
        var px = cellX(pointerIdx, cells.length, w);
        drawPointerArrow(ctx, px, TOP_PAD);
      }
    }

    drawLabel(ctx, w, step.label || '');
  }

  function drawArrayState(ctx, cells, canvasW, highlights, fadingOut, dropping, fromStep, tweenT) {
    var len = cells.length;
    var isTweening = fromStep && tweenT !== undefined && tweenT < 1;

    // Compute the "from" cell count to detect insertions/deletions
    var fromLen = (fromStep && fromStep.cells) ? fromStep.cells.length : len;

    for (var i = 0; i < len; i++) {
      var toX = cellX(i, len, canvasW);
      var drawX = toX;
      var alpha = 1;

      if (isTweening && fromStep && fromStep.cells) {
        // Detect insertion: cells grew by one — cells shift right of insert point
        if (len === fromLen + 1) {
          // Find insert index: first position where fromStep and step diverge
          var insertIdx = len - 1;
          for (var fi = 0; fi < fromLen; fi++) {
            if (String(cells[fi]) !== String(fromStep.cells[fi])) {
              insertIdx = fi;
              break;
            }
          }
          if (i === insertIdx) {
            // New cell: slide in from the right, fade in
            var offscreenX = cellX(len, len, canvasW) + CELL_W;
            drawX = lerp(offscreenX, toX, tweenT);
            alpha = tweenT;
          } else if (i > insertIdx) {
            // Shifted right: animate from previous slot
            var prevX = cellX(i - 1, len, canvasW);
            drawX = lerp(prevX, toX, tweenT);
          }
        }

        // Detect deletion: cells shrank by one — remaining cells slide left
        if (len === fromLen - 1) {
          // Find delete index
          var deleteIdx = fromLen - 1;
          for (var di = 0; di < len; di++) {
            if (String(cells[di]) !== String(fromStep.cells[di])) {
              deleteIdx = di;
              break;
            }
          }
          if (i >= deleteIdx) {
            // Animate from the slot one to the right
            var prevSlotX = cellX(i + 1, fromLen, canvasW);
            drawX = lerp(prevSlotX, toX, tweenT);
          }
        }
      }

      var y = TOP_PAD;
      var bg = colorCellBg();
      var txt = colorCellText();
      if (highlights && highlights[i]) {
        bg = highlights[i];
        txt = '#ffffff';
      }

      // Fading out cell: lerp alpha 1 → 0.3 during tween, then hold 0.3
      if (fadingOut === i) {
        alpha = isTweening ? lerp(1, 0.3, tweenT) : 0.3;
      }

      ctx.globalAlpha = alpha;
      drawCell(ctx, drawX, y, cells[i], bg, txt);
      drawIndex(ctx, drawX, y, i);
      ctx.globalAlpha = 1.0;
    }

    // Dropping cell: slide down from above and fade in
    if (dropping) {
      var dx = cellX(dropping.index, len, canvasW);
      var dropAlpha = isTweening ? tweenT : 1;
      var fromDY = TOP_PAD - 40;
      var toDY   = TOP_PAD - 12;
      var dy = isTweening ? lerp(fromDY, toDY, tweenT) : toDY;
      ctx.globalAlpha = dropAlpha;
      drawCell(ctx, dx, dy, dropping.value, colorFound(), '#ffffff');
      ctx.globalAlpha = 1.0;
    }
  }

  function drawLabel(ctx, canvasW, text) {
    ctx.fillStyle = cssVar('--text-secondary');
    ctx.font = '14px ' + cssVar('--font-sans');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, canvasW / 2, TOP_PAD + CELL_H + INDEX_PAD + 34);
  }

  /* ── Step builders ──────────────────────────────────────── */

  function buildInsertSteps(value, index) {
    var steps = [];
    var snapshot = arr.slice();
    var idx = Math.max(0, Math.min(index, snapshot.length));

    // Step 1: highlight target index
    var h1 = {};
    h1[idx] = colorActive();
    steps.push({
      cells: snapshot.slice(),
      highlights: h1,
      codeLine: 5,
      variables: { i: idx },
      label: 'Highlight target index ' + idx + ' for insertion'
    });

    // Steps 2..n: shift cells right one by one (from end toward idx)
    for (var i = snapshot.length - 1; i >= idx; i--) {
      var shifted = snapshot.slice();
      // Insert a placeholder at idx to grow the array for visualisation
      shifted.splice(idx, 0, '');
      // Copy values: position i+1 gets old value at i
      for (var j = shifted.length - 1; j > idx; j--) {
        shifted[j] = snapshot[j - 1] !== undefined ? snapshot[j - 1] : '';
      }
      shifted[idx] = '';

      // More accurate: rebuild with shifting progress
      var partial = snapshot.slice();
      partial.splice(idx, 0, '');
      // Shift from the back up to position i
      for (var k = partial.length - 1; k > i; k--) {
        partial[k] = snapshot[k - 1];
      }
      // The position being shifted
      var hs = {};
      if (i + 1 < partial.length) {
        hs[i + 1] = cssVar('--viz-swap');
      }
      partial[i] = (i === idx) ? '' : snapshot[i];

      steps.push({
        cells: partial,
        highlights: hs,
        codeLine: 5,
        variables: { i: idx, shift: i },
        label: 'Shift element at index ' + i + ' one position right'
      });
    }

    // Final step: drop value into slot
    var final = snapshot.slice();
    final.splice(idx, 0, value);
    var hf = {};
    hf[idx] = colorFound();
    steps.push({
      cells: final,
      highlights: hf,
      dropping: { index: idx, value: value },
      codeLine: 5,
      variables: { i: idx, val: value },
      label: 'Insert value ' + value + ' at index ' + idx
    });

    // Settled
    steps.push({
      cells: final,
      highlights: hf,
      codeLine: 5,
      variables: { i: idx, val: value },
      label: 'Insertion complete. Array now has ' + final.length + ' elements'
    });

    return { steps: steps, result: final };
  }

  function buildDeleteSteps(index) {
    var steps = [];
    var snapshot = arr.slice();

    if (index < 0 || index >= snapshot.length) {
      steps.push({
        cells: snapshot.slice(),
        highlights: {},
        label: 'Index ' + index + ' is out of bounds (valid: 0..' + (snapshot.length - 1) + ')'
      });
      return { steps: steps, result: snapshot };
    }

    // Step 1: highlight target
    var h1 = {};
    h1[index] = colorActive();
    steps.push({
      cells: snapshot.slice(),
      highlights: h1,
      codeLine: 7,
      variables: { i: index },
      label: 'Highlight element ' + snapshot[index] + ' at index ' + index + ' for deletion'
    });

    // Step 2: fade out
    steps.push({
      cells: snapshot.slice(),
      highlights: h1,
      fadingOut: index,
      codeLine: 7,
      variables: { i: index },
      label: 'Remove element ' + snapshot[index] + ' from position ' + index
    });

    // Steps 3..n: shift cells left one by one
    for (var i = index; i < snapshot.length - 1; i++) {
      var shifted = snapshot.slice();
      // Remove the target and show in-progress
      shifted.splice(index, 1);
      // But we are partway: insert blank at end to keep length while shifting
      var partial = snapshot.slice();
      partial[index] = snapshot[index]; // still visible but fading
      for (var j = index; j <= i; j++) {
        partial[j] = snapshot[j + 1];
      }
      var hs = {};
      hs[i] = cssVar('--viz-swap');
      steps.push({
        cells: partial,
        highlights: hs,
        codeLine: 7,
        variables: { i: i },
        label: 'Shift element from index ' + (i + 1) + ' left to index ' + i
      });
    }

    // Final state
    var final = snapshot.slice();
    final.splice(index, 1);
    steps.push({
      cells: final,
      highlights: {},
      codeLine: 7,
      variables: { i: index },
      label: 'Deletion complete. Array now has ' + final.length + ' elements'
    });

    return { steps: steps, result: final };
  }

  function buildSearchSteps(value) {
    var steps = [];
    var snapshot = arr.slice();
    var foundIndex = -1;

    for (var i = 0; i < snapshot.length; i++) {
      var hs = {};
      hs[i] = colorActive();
      // Colour previously checked cells
      for (var j = 0; j < i; j++) {
        hs[j] = cssVar('--viz-eliminated');
      }

      if (snapshot[i] === value) {
        hs[i] = colorFound();
        foundIndex = i;
        steps.push({
          cells: snapshot.slice(),
          highlights: hs,
          pointer: i,
          codeLine: 10,
          variables: { i: i, target: value },
          label: 'Found ' + value + ' at index ' + i + '!'
        });
        break;
      }

      steps.push({
        cells: snapshot.slice(),
        highlights: hs,
        pointer: i,
        codeLine: 9,
        variables: { i: i, target: value },
        label: 'Check index ' + i + ': value is ' + snapshot[i] + ' (not ' + value + ')'
      });
    }

    if (foundIndex === -1) {
      var hAll = {};
      for (var k = 0; k < snapshot.length; k++) {
        hAll[k] = cssVar('--viz-eliminated');
      }
      steps.push({
        cells: snapshot.slice(),
        highlights: hAll,
        codeLine: 11,
        variables: { target: value },
        label: 'Value ' + value + ' not found in the array'
      });
    }

    return { steps: steps, result: snapshot };
  }

  /* ── Explanation panel ──────────────────────────────────── */

  function updateExplanation(step, meta) {
    var el = document.querySelector('.viz-explanation');
    if (!el) return;
    if (!step) {
      el.textContent = 'Choose an operation and click a button to begin.';
      return;
    }
    el.textContent = step.label || ('Step ' + (meta.step + 1) + ' of ' + meta.totalSteps);
  }

  /* ── Load array ─────────────────────────────────────────── */

  function loadArray(newArr) {
    arr = newArr.slice();
    viz.setSteps([]);
  }

  /* ── Initialisation ─────────────────────────────────────── */

  function init() {
    var canvas = document.getElementById('arrays-canvas');
    if (!canvas) return;

    arr = [5, 12, 8, 3, 19, 7];

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('arrays', {
      canvas: canvas,
      onRender: render,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        updateExplanation(step, data);
      }
    });

    // Wire operation buttons
    var insertBtn = document.getElementById('arr-insert-btn');
    var deleteBtn = document.getElementById('arr-delete-btn');
    var searchBtn = document.getElementById('arr-search-btn');
    var valueInput = document.getElementById('arr-value-input');
    var indexInput = document.getElementById('arr-index-input');

    if (insertBtn) {
      insertBtn.addEventListener('click', function() {
        var val = parseInt(valueInput.value, 10);
        var idx = parseInt(indexInput.value, 10);
        if (isNaN(val)) { alert('Please enter a numeric value.'); return; }
        if (isNaN(idx)) idx = arr.length; // default: append
        var result = buildInsertSteps(val, idx);
        viz.setSteps(result.steps);
        arr = result.result;
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        var idx = parseInt(indexInput.value, 10);
        if (isNaN(idx)) { alert('Please enter an index to delete.'); return; }
        var result = buildDeleteSteps(idx);
        viz.setSteps(result.steps);
        arr = result.result;
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        var val = parseInt(valueInput.value, 10);
        if (isNaN(val)) { alert('Please enter a value to search for.'); return; }
        var result = buildSearchSteps(val);
        viz.setSteps(result.steps);
        // search does not mutate the array
      });
    }

    // Custom array input
    var customInput = document.getElementById('arr-custom-input');
    var customBtn = document.getElementById('arr-custom-btn');
    if (customBtn && customInput) {
      customBtn.addEventListener('click', function() {
        var raw = customInput.value.trim();
        if (!raw) return;
        var nums = raw.split(',').map(function(s) {
          return parseInt(s.trim(), 10);
        }).filter(function(n) { return !isNaN(n); });
        if (nums.length >= 2) loadArray(nums);
      });
    }
  }

  DSA.arraysViz = { init: init };
})();
