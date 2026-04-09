var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var defaultN = 10;
  var currentN = defaultN;

  // ── Colour helpers ──────────────────────────────────────────────────
  function css(prop) {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  // ── Step pre-computation ────────────────────────────────────────────
  function computeSteps(n) {
    var steps = [];
    var dp = [];
    var completed = [];

    // Initial state: empty table
    for (var x = 0; x <= n; x++) {
      dp.push(null);
    }

    steps.push({
      dp: dp.slice(),
      current: -1,
      dep1: -1,
      dep2: -1,
      completed: completed.slice(),
      formula: '',
      codeLine: 1,
      variables: { n: n },
      description: 'Compute Fibonacci numbers from fib(0) to fib(' + n + ') using dynamic programming (bottom-up tabulation).'
    });

    // Base case: fib(0) = 0
    dp[0] = 0;
    completed.push(0);
    steps.push({
      dp: dp.slice(),
      current: 0,
      dep1: -1,
      dep2: -1,
      completed: completed.slice(),
      formula: 'fib(0) = 0',
      codeLine: 3,
      variables: { n: n },
      description: 'Base case: fib(0) = 0. Fill the first cell of our DP table.'
    });

    if (n >= 1) {
      // Base case: fib(1) = 1
      dp[1] = 1;
      completed.push(1);
      steps.push({
        dp: dp.slice(),
        current: 1,
        dep1: -1,
        dep2: -1,
        completed: completed.slice(),
        formula: 'fib(1) = 1',
        codeLine: 4,
        variables: { n: n },
        description: 'Base case: fib(1) = 1. Fill the second cell.'
      });
    }

    // Fill the rest
    for (var i = 2; i <= n; i++) {
      // Show dependencies first
      steps.push({
        dp: dp.slice(),
        current: i,
        dep1: i - 1,
        dep2: i - 2,
        completed: completed.slice(),
        formula: 'fib(' + i + ') = fib(' + (i - 1) + ') + fib(' + (i - 2) + ') = ' + dp[i - 1] + ' + ' + dp[i - 2],
        codeLine: 6,
        variables: { i: i, 'dp[i-1]': dp[i - 1], 'dp[i-2]': dp[i - 2] },
        description: 'Computing fib(' + i + '): look up fib(' + (i - 1) + ') = ' + dp[i - 1] + ' and fib(' + (i - 2) + ') = ' + dp[i - 2] + ' from the table.'
      });

      dp[i] = dp[i - 1] + dp[i - 2];
      completed.push(i);

      steps.push({
        dp: dp.slice(),
        current: i,
        dep1: -1,
        dep2: -1,
        completed: completed.slice(),
        formula: 'fib(' + i + ') = ' + dp[i],
        codeLine: 6,
        variables: { i: i, 'dp[i]': dp[i] },
        description: 'fib(' + i + ') = ' + dp[i - 1] + ' + ' + dp[i - 2] + ' = ' + dp[i] + '. Cell filled!'
      });
    }

    // Final state
    steps.push({
      dp: dp.slice(),
      current: -1,
      dep1: -1,
      dep2: -1,
      completed: completed.slice(),
      formula: 'fib(' + n + ') = ' + dp[n],
      codeLine: 7,
      variables: { n: n, result: dp[n] },
      description: 'Done! The Fibonacci sequence up to fib(' + n + ') = ' + dp[n] + ' has been computed using O(n) time and O(n) space.'
    });

    return steps;
  }

  // ── Canvas rendering ────────────────────────────────────────────────
  function renderStep(ctx, step, data) {
    var w = data.width;
    var h = data.height;

    if (!step) return;

    var dpArr = step.dp;
    var count = dpArr.length;
    var cellW = 60;
    var cellH = 50;
    var gap = 4;
    var totalW = count * (cellW + gap) - gap;
    var startX = Math.max(20, (w - totalW) / 2);
    var startY = h * 0.3;

    // Responsive: shrink cells if they don't fit
    if (totalW > w - 40) {
      cellW = Math.floor((w - 40 - (count - 1) * gap) / count);
      cellH = Math.min(50, Math.max(32, cellW));
      totalW = count * (cellW + gap) - gap;
      startX = 20;
    }

    var fontSize = Math.min(16, Math.max(10, cellW * 0.3));

    // Draw "fib(i)" labels above
    ctx.font = (fontSize - 2) + 'px ' + css('--font-mono');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (var k = 0; k < count; k++) {
      var cx = startX + k * (cellW + gap) + cellW / 2;
      ctx.fillStyle = css('--text-tertiary');
      ctx.fillText('f(' + k + ')', cx, startY - 6);
    }

    // Draw dependency arrows
    if (step.dep1 >= 0 && step.dep2 >= 0 && step.current >= 0) {
      var curX = startX + step.current * (cellW + gap) + cellW / 2;
      var curY = startY;

      // Arrow from dep1 to current
      var dep1X = startX + step.dep1 * (cellW + gap) + cellW / 2;
      var dep2X = startX + step.dep2 * (cellW + gap) + cellW / 2;
      var arrowTopY = startY - 20;

      ctx.strokeStyle = css('--viz-compare');
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);

      // Curved arrow from dep2
      ctx.beginPath();
      ctx.moveTo(dep2X, startY - 2);
      ctx.quadraticCurveTo((dep2X + curX) / 2, arrowTopY - 15, curX - 4, startY - 2);
      ctx.stroke();

      // Curved arrow from dep1
      ctx.beginPath();
      ctx.moveTo(dep1X, startY - 2);
      ctx.quadraticCurveTo((dep1X + curX) / 2, arrowTopY - 8, curX + 4, startY - 2);
      ctx.stroke();

      ctx.setLineDash([]);

      // Small arrowheads
      ctx.fillStyle = css('--viz-compare');
      ctx.beginPath();
      ctx.moveTo(curX - 4, startY - 2);
      ctx.lineTo(curX - 8, startY - 9);
      ctx.lineTo(curX + 1, startY - 7);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(curX + 4, startY - 2);
      ctx.lineTo(curX - 1, startY - 7);
      ctx.lineTo(curX + 8, startY - 9);
      ctx.closePath();
      ctx.fill();
    }

    // Draw cells
    for (var i = 0; i < count; i++) {
      var x = startX + i * (cellW + gap);
      var isCompleted = step.completed.indexOf(i) !== -1;
      var isCurrent = step.current === i;
      var isDep = (step.dep1 === i || step.dep2 === i);

      // Cell background
      if (isCurrent && dpArr[i] !== null) {
        // Just computed
        ctx.shadowColor = css('--viz-active');
        ctx.shadowBlur = 12;
        ctx.fillStyle = css('--viz-active');
      } else if (isCurrent && dpArr[i] === null) {
        // Being computed (empty still)
        ctx.fillStyle = css('--viz-active');
        ctx.globalAlpha = 0.6;
      } else if (isDep) {
        ctx.fillStyle = css('--viz-compare');
      } else if (isCompleted) {
        ctx.fillStyle = css('--viz-sorted');
      } else {
        ctx.fillStyle = css('--viz-cell-bg');
      }

      // Rounded rect
      var r = 6;
      ctx.beginPath();
      ctx.moveTo(x + r, startY);
      ctx.lineTo(x + cellW - r, startY);
      ctx.quadraticCurveTo(x + cellW, startY, x + cellW, startY + r);
      ctx.lineTo(x + cellW, startY + cellH - r);
      ctx.quadraticCurveTo(x + cellW, startY + cellH, x + cellW - r, startY + cellH);
      ctx.lineTo(x + r, startY + cellH);
      ctx.quadraticCurveTo(x, startY + cellH, x, startY + cellH - r);
      ctx.lineTo(x, startY + r);
      ctx.quadraticCurveTo(x, startY, x + r, startY);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // Cell border
      if (isCurrent) {
        ctx.strokeStyle = css('--viz-active');
        ctx.lineWidth = 2.5;
      } else if (isDep) {
        ctx.strokeStyle = css('--viz-compare');
        ctx.lineWidth = 2;
      } else if (isCompleted) {
        ctx.strokeStyle = css('--viz-sorted');
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = css('--border-color');
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // Cell text
      ctx.font = 'bold ' + fontSize + 'px ' + css('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isCurrent || isDep || isCompleted) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = css('--viz-cell-text');
      }

      if (dpArr[i] !== null) {
        ctx.fillText(dpArr[i], x + cellW / 2, startY + cellH / 2);
      } else {
        ctx.fillStyle = css('--text-tertiary');
        ctx.fillText('?', x + cellW / 2, startY + cellH / 2);
      }
    }

    // Formula display below
    if (step.formula) {
      var formulaY = startY + cellH + 30;
      ctx.font = 'bold ' + (fontSize + 2) + 'px ' + css('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = css('--text-primary');
      ctx.fillText(step.formula, w / 2, formulaY);
    }

    // n label in top-right
    ctx.font = 'bold ' + fontSize + 'px ' + css('--font-sans');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = css('--text-secondary');
    ctx.fillText('n = ' + currentN, w - 20, 14);
  }

  // ── Step change callback ────────────────────────────────────────────
  function onStepChange(step, data) {
    var explanationEl = document.querySelector('.viz-explanation');
    if (explanationEl && step) {
      explanationEl.textContent = step.description;
    } else if (explanationEl) {
      explanationEl.textContent = 'Set n and click Start to compute Fibonacci with DP.';
    }
  }

  // ── Run DP ─────────────────────────────────────────────────────────
  function runDP() {
    var nInput = document.getElementById('dp-n-input');
    if (nInput) {
      var val = parseInt(nInput.value, 10);
      if (!isNaN(val) && val >= 0 && val <= 20) {
        currentN = val;
      }
    }
    var steps = computeSteps(currentN);
    viz.setSteps(steps);
  }

  // ── Init ────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('dp-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('dp', {
      canvas: canvas,
      onRender: renderStep,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Wire n input
    var nInput = document.getElementById('dp-n-input');
    if (nInput) {
      nInput.value = currentN;
      nInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          runDP();
        }
      });
    }

    // Wire start button
    var startBtn = document.getElementById('dp-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        runDP();
      });
    }

    // Initial run
    runDP();
  }

  DSA.dpViz = { init: init };
})();
