var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var defaultArray = [2, 1, 5, 1, 3, 2, 8, 4, 3];
  var defaultK = 3;
  var currentArray = defaultArray.slice();
  var currentK = defaultK;

  // ── Colour helpers ──────────────────────────────────────────────────
  function css(prop) {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  // ── Step pre-computation ────────────────────────────────────────────
  function computeSteps(arr, k) {
    var steps = [];

    if (k <= 0 || k > arr.length) {
      steps.push({
        array: arr.slice(),
        windowStart: -1,
        windowEnd: -1,
        currentSum: 0,
        maxSum: 0,
        maxStart: -1,
        maxEnd: -1,
        phase: 'error',
        description: 'Invalid window size k = ' + k + '. Must be between 1 and ' + arr.length + '.'
      });
      return steps;
    }

    // Initial state
    steps.push({
      array: arr.slice(),
      windowStart: -1,
      windowEnd: -1,
      currentSum: 0,
      maxSum: 0,
      maxStart: -1,
      maxEnd: -1,
      phase: 'init',
      codeLine: 2,
      variables: { k: k },
      description: 'Find the maximum sum subarray of size k = ' + k + ' in an array of ' + arr.length + ' elements.'
    });

    // Compute initial window sum
    var windowSum = 0;
    for (var i = 0; i < k; i++) {
      windowSum += arr[i];
    }

    var maxSum = windowSum;
    var maxStart = 0;
    var maxEnd = k - 1;

    steps.push({
      array: arr.slice(),
      windowStart: 0,
      windowEnd: k - 1,
      currentSum: windowSum,
      maxSum: maxSum,
      maxStart: maxStart,
      maxEnd: maxEnd,
      phase: 'initial-window',
      codeLine: 2,
      variables: { window_sum: windowSum, max_sum: maxSum },
      description: 'Initial window [0..' + (k - 1) + ']: sum = ' + windowSum + '. This is our first max sum.'
    });

    // Slide the window
    for (var j = k; j < arr.length; j++) {
      var removed = arr[j - k];
      var added = arr[j];
      windowSum = windowSum - removed + added;
      var wStart = j - k + 1;
      var wEnd = j;

      var desc = 'Slide window to [' + wStart + '..' + wEnd + ']: remove arr[' + (j - k) + '] = ' + removed + ', add arr[' + j + '] = ' + added + '. Sum = ' + windowSum + '.';

      if (windowSum > maxSum) {
        maxSum = windowSum;
        maxStart = wStart;
        maxEnd = wEnd;
        desc += ' New max sum = ' + maxSum + '!';
      } else {
        desc += ' Max sum remains ' + maxSum + '.';
      }

      steps.push({
        array: arr.slice(),
        windowStart: wStart,
        windowEnd: wEnd,
        currentSum: windowSum,
        maxSum: maxSum,
        maxStart: maxStart,
        maxEnd: maxEnd,
        phase: 'sliding',
        codeLine: 4,
        variables: { i: j, window_sum: windowSum, max_sum: maxSum },
        description: desc
      });
    }

    // Final result
    steps.push({
      array: arr.slice(),
      windowStart: maxStart,
      windowEnd: maxEnd,
      currentSum: maxSum,
      maxSum: maxSum,
      maxStart: maxStart,
      maxEnd: maxEnd,
      phase: 'done',
      codeLine: 5,
      variables: { max_sum: maxSum },
      description: 'Done! Maximum sum subarray of size ' + k + ' is [' + maxStart + '..' + maxEnd + '] with sum = ' + maxSum + '.'
    });

    return steps;
  }

  // ── Tween helper ────────────────────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ── Canvas rendering ────────────────────────────────────────────────
  function renderStep(ctx, step, data, fromStep, tweenT) {
    var w = data.width;
    var h = data.height;

    var cellW = 60;
    var cellH = 50;
    var gap = 4;
    var arr = step ? step.array : currentArray;
    var totalW = arr.length * (cellW + gap) - gap;
    var startX = Math.max(20, (w - totalW) / 2);
    var startY = h * 0.25;

    // Responsive: shrink cells if they don't fit
    if (totalW > w - 40) {
      cellW = Math.floor((w - 40 - (arr.length - 1) * gap) / arr.length);
      cellH = Math.min(50, Math.max(32, cellW));
      totalW = arr.length * (cellW + gap) - gap;
      startX = 20;
    }

    var isTweening = fromStep && typeof tweenT === 'number' && tweenT < 1;

    var fontSize = Math.min(16, Math.max(11, cellW * 0.3));

    // Draw index labels above
    ctx.font = (fontSize - 2) + 'px ' + css('--font-mono');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (var k = 0; k < arr.length; k++) {
      var cx = startX + k * (cellW + gap) + cellW / 2;
      ctx.fillStyle = css('--text-tertiary');
      ctx.fillText(k, cx, startY - 6);
    }

    // Determine which indices are in current window and max window
    var inWindow = {};
    var inMax = {};
    if (step) {
      if (step.windowStart >= 0 && step.windowEnd >= 0) {
        for (var wi = step.windowStart; wi <= step.windowEnd; wi++) {
          inWindow[wi] = true;
        }
      }
      if (step.phase === 'done' && step.maxStart >= 0 && step.maxEnd >= 0) {
        for (var mi = step.maxStart; mi <= step.maxEnd; mi++) {
          inMax[mi] = true;
        }
      }
    }

    // Draw window highlight rectangle behind cells (lerp x and width when tweening)
    if (step && step.windowStart >= 0 && step.windowEnd >= 0) {
      var toWxStart = startX + step.windowStart * (cellW + gap) - 4;
      var toWxEnd   = startX + step.windowEnd   * (cellW + gap) + cellW + 4;
      var wxStart, wxEnd;
      if (isTweening && fromStep && fromStep.windowStart >= 0 && fromStep.windowEnd >= 0) {
        var fromWxStart = startX + fromStep.windowStart * (cellW + gap) - 4;
        var fromWxEnd   = startX + fromStep.windowEnd   * (cellW + gap) + cellW + 4;
        wxStart = lerp(fromWxStart, toWxStart, tweenT);
        wxEnd   = lerp(fromWxEnd,   toWxEnd,   tweenT);
      } else {
        wxStart = toWxStart;
        wxEnd   = toWxEnd;
      }
      var wxWidth = wxEnd - wxStart;
      var wyStart = startY - 4;
      var wyHeight = cellH + 8;

      if (step.phase === 'done') {
        ctx.strokeStyle = css('--viz-found');
        ctx.fillStyle = css('--viz-found');
        ctx.globalAlpha = 0.12;
      } else {
        ctx.strokeStyle = css('--viz-compare');
        ctx.fillStyle = css('--viz-compare');
        ctx.globalAlpha = 0.12;
      }

      // Rounded highlight
      var hr = 8;
      ctx.beginPath();
      ctx.moveTo(wxStart + hr, wyStart);
      ctx.lineTo(wxStart + wxWidth - hr, wyStart);
      ctx.quadraticCurveTo(wxStart + wxWidth, wyStart, wxStart + wxWidth, wyStart + hr);
      ctx.lineTo(wxStart + wxWidth, wyStart + wyHeight - hr);
      ctx.quadraticCurveTo(wxStart + wxWidth, wyStart + wyHeight, wxStart + wxWidth - hr, wyStart + wyHeight);
      ctx.lineTo(wxStart + hr, wyStart + wyHeight);
      ctx.quadraticCurveTo(wxStart, wyStart + wyHeight, wxStart, wyStart + wyHeight - hr);
      ctx.lineTo(wxStart, wyStart + hr);
      ctx.quadraticCurveTo(wxStart, wyStart, wxStart + hr, wyStart);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Draw cells
    for (var i = 0; i < arr.length; i++) {
      var x = startX + i * (cellW + gap);
      var isInWindow = !!inWindow[i];
      var isInMax = !!inMax[i];

      // Cell background
      if (isInMax && step && step.phase === 'done') {
        ctx.fillStyle = css('--viz-found');
      } else if (isInWindow) {
        ctx.fillStyle = css('--viz-compare');
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

      // Cell border
      if (isInMax && step && step.phase === 'done') {
        ctx.strokeStyle = css('--viz-found');
        ctx.lineWidth = 2.5;
      } else if (isInWindow) {
        ctx.strokeStyle = css('--viz-compare');
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = css('--border-color');
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // Cell text
      ctx.font = 'bold ' + fontSize + 'px ' + css('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isInMax && step && step.phase === 'done') {
        ctx.fillStyle = '#ffffff';
      } else if (isInWindow) {
        ctx.fillStyle = '#1e293b';
      } else {
        ctx.fillStyle = css('--viz-cell-text');
      }
      ctx.fillText(arr[i], x + cellW / 2, startY + cellH / 2);
    }

    // Info display
    if (!step) return;

    // Display sum info below the array
    var infoY = startY + cellH + 35;
    ctx.font = 'bold ' + fontSize + 'px ' + css('--font-sans');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (step.phase !== 'init' && step.phase !== 'error') {
      ctx.fillStyle = css('--viz-compare');
      ctx.fillText('Window Sum: ' + step.currentSum, w / 2 - 90, infoY);

      ctx.fillStyle = css('--viz-found');
      ctx.fillText('Max Sum: ' + step.maxSum, w / 2 + 90, infoY);
    }

    // k label in top-right
    ctx.font = 'bold ' + fontSize + 'px ' + css('--font-sans');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = css('--text-secondary');
    ctx.fillText('k = ' + currentK, w - 20, 14);
  }

  // ── Step change callback ────────────────────────────────────────────
  function onStepChange(step, data) {
    var explanationEl = document.querySelector('.viz-explanation');
    if (explanationEl && step) {
      explanationEl.textContent = step.description;
    } else if (explanationEl) {
      explanationEl.textContent = 'Set window size k and click Start to begin.';
    }
  }

  // ── Generate random array ──────────────────────────────────────────
  function randomArr() {
    var len = 8 + Math.floor(Math.random() * 5); // 8-12 elements
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(Math.floor(Math.random() * 9) + 1);
    }
    return arr;
  }

  // ── Load a custom array ────────────────────────────────────────────
  function loadArray(arr) {
    currentArray = arr.slice();
    runSlidingWindow();
  }

  // ── Run sliding window ─────────────────────────────────────────────
  function runSlidingWindow() {
    var kInput = document.getElementById('sw-k-input');
    if (kInput) {
      var val = parseInt(kInput.value, 10);
      if (!isNaN(val) && val > 0) {
        currentK = val;
      }
    }
    var steps = computeSteps(currentArray, currentK);
    viz.setSteps(steps);
  }

  // ── Init ────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('sliding-window-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('sliding-window', {
      canvas: canvas,
      onRender: renderStep,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Wire k input
    var kInput = document.getElementById('sw-k-input');
    if (kInput) {
      kInput.value = currentK;
      kInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          runSlidingWindow();
        }
      });
    }

    // Wire start button
    var startBtn = document.getElementById('sw-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        runSlidingWindow();
      });
    }

    // Wire randomize button
    var randomBtn = document.getElementById('sw-randomize-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', function() {
        currentArray = randomArr();
        currentK = 2 + Math.floor(Math.random() * 3); // k between 2 and 4
        if (kInput) {
          kInput.value = currentK;
        }
        runSlidingWindow();
      });
    }

    // Custom array input
    var customInput = document.getElementById('sw-custom-input');
    var customBtn = document.getElementById('sw-custom-btn');
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

    // Initial run
    runSlidingWindow();
  }

  DSA.slidingWindowViz = { init: init };
})();
