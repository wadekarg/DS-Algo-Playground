var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var CELL_W = 60;
  var CELL_H = 50;
  var GAP = 6;

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  // ── Step generation: Jump Game I ──────────────────────────────────────
  function generateSteps(nums) {
    var n = nums.length;
    var steps = [];
    var maxReach = 0;
    var canJump = false;

    steps.push({
      nums: nums.slice(),
      currentIdx: -1,
      maxReach: 0,
      phase: 'init',
      codeLine: 2,
      description: 'Jump Game: Can you reach the last index? Track maxReach — the farthest index reachable. Input: [' + nums.join(', ') + '].'
    });

    for (var i = 0; i < n; i++) {
      if (i > maxReach) {
        steps.push({
          nums: nums.slice(),
          currentIdx: i,
          maxReach: maxReach,
          phase: 'stuck',
          codeLine: 5,
          description: 'Index ' + i + ' is beyond maxReach (' + maxReach + '). Cannot reach this position — return false.'
        });
        canJump = false;
        break;
      }

      var prevReach = maxReach;
      maxReach = Math.max(maxReach, i + nums[i]);

      steps.push({
        nums: nums.slice(),
        currentIdx: i,
        maxReach: maxReach,
        prevReach: prevReach,
        phase: 'step',
        codeLine: 6,
        description: 'At index ' + i + ' (jump power = ' + nums[i] + '). maxReach = max(' + prevReach + ', ' + i + ' + ' + nums[i] + ') = ' + maxReach + '.' + (maxReach >= n - 1 ? ' Can reach the end!' : '')
      });

      if (maxReach >= n - 1) {
        canJump = true;
        break;
      }
    }

    steps.push({
      nums: nums.slice(),
      currentIdx: -1,
      maxReach: maxReach,
      phase: canJump ? 'done_true' : 'done_false',
      codeLine: 7,
      description: canJump
        ? 'Return true — the last index is reachable (maxReach = ' + maxReach + ' ≥ ' + (n - 1) + ').'
        : 'Return false — the last index is not reachable.'
    });

    return steps;
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
      ctx.fillText('Press Run to visualize the Jump Game algorithm.', w / 2, h / 2);
      return;
    }

    var nums = step.nums;
    var n = nums.length;
    var totalW = n * CELL_W + (n - 1) * GAP;
    var startX = (w - totalW) / 2;
    var cellY = 60;

    // Draw title
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '11px ' + cssVar('--font-mono');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('JUMP POWERS', w / 2, cellY - 14);

    // Draw cells
    for (var i = 0; i < n; i++) {
      var x = startX + i * (CELL_W + GAP);
      var isCurrent = (i === step.currentIdx);
      var inReach = step.maxReach >= 0 && i <= step.maxReach && i !== step.currentIdx;
      var isPast = step.currentIdx >= 0 && i < step.currentIdx;

      var fill = cssVar('--viz-cell-bg');
      var text = cssVar('--viz-cell-text');

      if (step.phase === 'stuck' && i === step.currentIdx) { fill = cssVar('--viz-active'); text = '#fff'; }
      else if (isCurrent) { fill = cssVar('--viz-active'); text = '#fff'; }
      else if (i === n - 1) { fill = cssVar('--viz-found'); text = '#fff'; }
      else if (isPast) { fill = '#' + (cssVar('--viz-sorted') || '22c55e'); text = '#fff'; }
      else if (inReach) {
        // Light tint for reachable
        fill = cssVar('--viz-compare') || '#fef3c7';
        text = cssVar('--viz-cell-text');
      }

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(x, cellY, CELL_W, CELL_H, 5);
      ctx.fill();

      ctx.fillStyle = text;
      ctx.font = 'bold 18px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(nums[i]), x + CELL_W / 2, cellY + CELL_H / 2);

      // Index label
      ctx.fillStyle = cssVar('--text-tertiary');
      ctx.font = '11px ' + cssVar('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(String(i), x + CELL_W / 2, cellY + CELL_H + 4);
    }

    // Draw jump arc from current position
    if (step.currentIdx >= 0 && step.phase === 'step') {
      var curX = startX + step.currentIdx * (CELL_W + GAP) + CELL_W / 2;
      var reach = Math.min(step.maxReach, n - 1);
      var reachX = startX + reach * (CELL_W + GAP) + CELL_W / 2;
      var arcY = cellY - 20;

      ctx.strokeStyle = cssVar('--viz-active');
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(curX, cellY);
      var cpx = (curX + reachX) / 2;
      ctx.quadraticCurveTo(cpx, arcY, reachX, cellY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow head
      ctx.fillStyle = cssVar('--viz-active');
      ctx.beginPath();
      ctx.moveTo(reachX, cellY);
      ctx.lineTo(reachX - 6, cellY - 10);
      ctx.lineTo(reachX + 6, cellY - 10);
      ctx.closePath();
      ctx.fill();
    }

    // MaxReach info box
    var infoY = cellY + CELL_H + 42;
    var col1 = w / 4;
    var col2 = w * 3 / 4;

    ctx.fillStyle = cssVar('--text-secondary');
    ctx.font = '13px ' + cssVar('--font-sans');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('maxReach = ' + step.maxReach, col1, infoY);

    var resultText = '';
    var resultColor = cssVar('--text-secondary');
    if (step.phase === 'done_true') { resultText = 'Can reach end: ✓ true'; resultColor = cssVar('--viz-found'); }
    else if (step.phase === 'done_false' || step.phase === 'stuck') { resultText = 'Cannot reach: ✗ false'; resultColor = cssVar('--viz-active'); }
    else if (step.maxReach >= n - 1) { resultText = 'End in reach!'; resultColor = cssVar('--viz-found'); }
    if (resultText) {
      ctx.fillStyle = resultColor;
      ctx.font = 'bold 14px ' + cssVar('--font-sans');
      ctx.fillText(resultText, col2, infoY);
    }

    // Legend
    var legY = h - 26;
    var legItems = [
      { color: cssVar('--viz-active'), label: 'current' },
      { color: cssVar('--viz-compare') || '#fef3c7', label: 'reachable', dark: false },
      { color: cssVar('--viz-found'), label: 'goal / visited' }
    ];
    var legSpacing = 140;
    var legStartX = w / 2 - legSpacing;
    for (var li = 0; li < legItems.length; li++) {
      var lx = legStartX + li * legSpacing;
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
    var canvas = document.getElementById('greedy-canvas');
    if (!canvas) return;

    var explanationEl = document.querySelector('.viz-explanation');
    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('greedy', {
      canvas: canvas,
      tweenDuration: 0,
      onRender: onRender,
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step) explanationEl.textContent = step.description;
        else if (explanationEl) explanationEl.textContent = 'Press Run to visualize the Jump Game algorithm.';
      }
    });

    var defaultNums = [2, 3, 1, 1, 4];
    viz.setSteps([generateSteps(defaultNums)[0]]);

    var runBtn = document.getElementById('greedy-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', function() {
        viz.setSteps(generateSteps(defaultNums));
      });
    }
    var resetBtn = document.getElementById('greedy-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var s = generateSteps(defaultNums);
        viz.setSteps([s[0]]);
      });
    }
  }

  DSA.greedyViz = { init: init };
})();
