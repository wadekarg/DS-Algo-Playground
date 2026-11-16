var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var BITS = 8;
  var BIT_W = 38;
  var BIT_H = 38;
  var BIT_GAP = 4;

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  function toBits(num) {
    var bits = [];
    for (var i = BITS - 1; i >= 0; i--) {
      bits.push((num >>> i) & 1);
    }
    return bits;
  }

  // ── Step generation: XOR trick for Single Number ───────────────────────
  function generateSteps(nums) {
    var steps = [];
    var result = 0;

    steps.push({
      result: 0,
      element: null,
      phase: 'init',
      codeLine: 2,
      description: 'Single Number: XOR all elements. Duplicates cancel (a ^ a = 0), unique element remains. Starting with result = 0.'
    });

    for (var i = 0; i < nums.length; i++) {
      var before = result;
      result = result ^ nums[i];

      steps.push({
        result: before,
        element: nums[i],
        newResult: result,
        phase: 'xor',
        index: i,
        codeLine: 4,
        description: 'XOR result (' + before + ') ^ nums[' + i + '] (' + nums[i] + ') = ' + result + '. Binary: ' + before.toString(2).padStart(8, '0') + ' ^ ' + nums[i].toString(2).padStart(8, '0') + ' = ' + result.toString(2).padStart(8, '0') + '.'
      });

      steps.push({
        result: result,
        element: null,
        phase: 'update',
        index: i,
        codeLine: 4,
        description: 'result is now ' + result + ' (binary: ' + result.toString(2).padStart(8, '0') + ').' + (i < nums.length - 1 ? ' Processing next element...' : ' All elements processed!')
      });
    }

    steps.push({
      result: result,
      element: null,
      phase: 'done',
      codeLine: 5,
      description: 'Done! The unique number is ' + result + '. All duplicates cancelled via XOR, leaving only the element that appears once.'
    });

    return steps;
  }

  // ── Draw a row of bit cells ────────────────────────────────────────────
  function drawBitRow(ctx, label, bits, y, w, diffBits) {
    var totalW = BITS * BIT_W + (BITS - 1) * BIT_GAP;
    var startX = (w - totalW) / 2;

    ctx.fillStyle = cssVar('--text-secondary');
    ctx.font = 'bold 12px ' + cssVar('--font-mono');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, startX - 8, y + BIT_H / 2);

    for (var i = 0; i < BITS; i++) {
      var x = startX + i * (BIT_W + BIT_GAP);
      var isDiff = diffBits && diffBits[i];
      var fill = isDiff ? cssVar('--viz-active') : (bits[i] ? cssVar('--viz-default') : cssVar('--viz-cell-bg'));
      var textColor = (bits[i] || isDiff) ? '#fff' : cssVar('--text-tertiary');

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(x, y, BIT_W, BIT_H, 4);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px ' + cssVar('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(bits[i]), x + BIT_W / 2, y + BIT_H / 2);
    }

    // Decimal label on right
    var dec = parseInt(bits.join(''), 2);
    ctx.fillStyle = cssVar('--text-secondary');
    ctx.font = '13px ' + cssVar('--font-mono');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var endX = startX + BITS * BIT_W + (BITS - 1) * BIT_GAP + 8;
    ctx.fillText('= ' + dec, endX, y + BIT_H / 2);
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
      ctx.fillText('Press Run to visualize the XOR bit trick.', w / 2, h / 2);
      return;
    }

    var topPad = 20;
    var rowGap = 16;

    if (step.phase === 'init' || step.phase === 'update' || step.phase === 'done') {
      // Just show result row
      var resultBits = toBits(step.result);
      var midY = h / 2 - BIT_H / 2;

      ctx.fillStyle = cssVar('--text-secondary');
      ctx.font = '13px ' + cssVar('--font-mono');
      ctx.textAlign = 'center';
      ctx.fillText('result', w / 2, midY - 14);
      drawBitRow(ctx, '', resultBits, midY, w, null);

      if (step.phase === 'done') {
        ctx.fillStyle = cssVar('--viz-found');
        ctx.font = 'bold 20px ' + cssVar('--font-sans');
        ctx.textAlign = 'center';
        ctx.fillText('Unique number = ' + step.result, w / 2, midY + BIT_H + 28);
      }
    } else if (step.phase === 'xor') {
      // Show: result ^ element = newResult
      var rBits = toBits(step.result);
      var eBits = toBits(step.element);
      var nBits = toBits(step.newResult);

      // Compute which bits changed
      var diffBits = [];
      for (var i = 0; i < BITS; i++) {
        diffBits.push(rBits[i] !== eBits[i] ? 1 : 0);
      }

      var y1 = topPad + 16;
      ctx.fillStyle = cssVar('--text-secondary');
      ctx.font = '12px ' + cssVar('--font-mono');
      ctx.textAlign = 'center';
      ctx.fillText('result (before)', w / 2, y1 - 14);
      drawBitRow(ctx, '', rBits, y1, w, null);

      // XOR operator line
      var opY = y1 + BIT_H + rowGap;
      ctx.fillStyle = cssVar('--viz-compare') || '#f59e0b';
      ctx.font = 'bold 18px ' + cssVar('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⊕ (XOR)', w / 2, opY + 8);

      var y2 = opY + rowGap + 16;
      ctx.fillStyle = cssVar('--text-secondary');
      ctx.font = '12px ' + cssVar('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('nums[' + step.index + '] = ' + step.element, w / 2, y2 - 4);
      ctx.textBaseline = 'middle';
      drawBitRow(ctx, '', eBits, y2, w, null);

      // Divider
      var divY = y2 + BIT_H + rowGap;
      var totalBW = BITS * BIT_W + (BITS - 1) * BIT_GAP;
      var divStartX = (w - totalBW) / 2;
      ctx.strokeStyle = cssVar('--border-color');
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(divStartX - 50, divY);
      ctx.lineTo(divStartX + totalBW + 50, divY);
      ctx.stroke();
      ctx.setLineDash([]);

      var y3 = divY + rowGap;
      ctx.fillStyle = cssVar('--viz-found');
      ctx.font = '12px ' + cssVar('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('new result', w / 2, y3 - 4);
      ctx.textBaseline = 'middle';
      drawBitRow(ctx, '', nBits, y3, w, diffBits);
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('bit-manipulation-canvas');
    if (!canvas) return;

    var explanationEl = document.querySelector('.viz-explanation');
    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('bit-manipulation', {
      canvas: canvas,
      tweenDuration: 0,
      onRender: onRender,
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step) explanationEl.textContent = step.description;
        else if (explanationEl) explanationEl.textContent = 'Press Run to visualize the XOR trick.';
      }
    });

    var defaultNums = [4, 1, 2, 1, 2];
    viz.setSteps([generateSteps(defaultNums)[0]]);

    var runBtn = document.getElementById('bit-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', function() {
        viz.setSteps(generateSteps(defaultNums));
      });
    }
    var resetBtn = document.getElementById('bit-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var s = generateSteps(defaultNums);
        viz.setSteps([s[0]]);
      });
    }
  }

  DSA.bitManipulationViz = { init: init };
})();
