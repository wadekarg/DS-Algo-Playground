var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var defaultArray = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91];
  var defaultTarget = 23;
  var currentArray = defaultArray.slice();
  var currentTarget = defaultTarget;

  // ── Colour helpers ──────────────────────────────────────────────────
  function css(prop) {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  // ── Step pre-computation ────────────────────────────────────────────
  function computeSteps(arr, target) {
    var steps = [];
    var eliminated = [];
    var low = 0;
    var high = arr.length - 1;

    // Initial state
    var mid = Math.floor((low + high) / 2);
    steps.push({
      array: arr.slice(),
      low: low,
      mid: mid,
      high: high,
      eliminated: eliminated.slice(),
      found: -1,
      codeLine: 2,
      variables: { low: low, high: high },
      description: 'Start binary search for target ' + target + '. The sorted array has ' + arr.length + ' elements. low = ' + low + ', high = ' + high + ', mid = ' + mid + '.'
    });

    while (low <= high) {
      mid = Math.floor((low + high) / 2);

      if (arr[mid] === target) {
        // Found
        steps.push({
          array: arr.slice(),
          low: low,
          mid: mid,
          high: high,
          eliminated: eliminated.slice(),
          found: mid,
          codeLine: 4,
          variables: { low: low, mid: mid, high: high },
          description: 'arr[' + mid + '] = ' + arr[mid] + ' equals target ' + target + '. Element found at index ' + mid + '!'
        });
        return steps;
      } else if (arr[mid] < target) {
        // Eliminate left half
        steps.push({
          array: arr.slice(),
          low: low,
          mid: mid,
          high: high,
          eliminated: eliminated.slice(),
          found: -1,
          codeLine: 6,
          variables: { low: low, mid: mid, high: high },
          description: 'Compare arr[' + mid + '] = ' + arr[mid] + ' with target ' + target + '. Since ' + arr[mid] + ' < ' + target + ', eliminate the left half (indices ' + low + ' to ' + mid + ').'
        });
        for (var i = low; i <= mid; i++) {
          if (eliminated.indexOf(i) === -1) eliminated.push(i);
        }
        low = mid + 1;
      } else {
        // Eliminate right half
        steps.push({
          array: arr.slice(),
          low: low,
          mid: mid,
          high: high,
          eliminated: eliminated.slice(),
          found: -1,
          codeLine: 8,
          variables: { low: low, mid: mid, high: high },
          description: 'Compare arr[' + mid + '] = ' + arr[mid] + ' with target ' + target + '. Since ' + arr[mid] + ' > ' + target + ', eliminate the right half (indices ' + mid + ' to ' + high + ').'
        });
        for (var j = mid; j <= high; j++) {
          if (eliminated.indexOf(j) === -1) eliminated.push(j);
        }
        high = mid - 1;
      }

      // Show updated pointers after elimination
      if (low <= high) {
        var newMid = Math.floor((low + high) / 2);
        steps.push({
          array: arr.slice(),
          low: low,
          mid: newMid,
          high: high,
          eliminated: eliminated.slice(),
          found: -1,
          codeLine: 3,
          variables: { low: low, mid: newMid, high: high },
          description: 'Narrow search space: low = ' + low + ', high = ' + high + ', mid = ' + newMid + '. Remaining elements: ' + (high - low + 1) + '.'
        });
      }
    }

    // Not found
    steps.push({
      array: arr.slice(),
      low: low,
      mid: -1,
      high: high,
      eliminated: eliminated.slice(),
      found: -1,
      codeLine: 9,
      variables: { low: low, high: high },
      description: 'low (' + low + ') > high (' + high + '). Target ' + target + ' is not in the array.'
    });

    return steps;
  }

  // ── Canvas rendering ────────────────────────────────────────────────
  function renderStep(ctx, step, data) {
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

    // Draw cells
    for (var i = 0; i < arr.length; i++) {
      var x = startX + i * (cellW + gap);
      var isEliminated = step && step.eliminated.indexOf(i) !== -1;
      var isFound = step && step.found === i;

      // Cell background
      if (isFound) {
        // Green glow
        ctx.shadowColor = css('--viz-found');
        ctx.shadowBlur = 18;
        ctx.fillStyle = css('--viz-found');
        ctx.globalAlpha = 0.25;
        ctx.fillRect(x - 4, startY - 4, cellW + 8, cellH + 8);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.fillStyle = css('--viz-found');
      } else if (isEliminated) {
        ctx.fillStyle = css('--viz-eliminated');
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
      if (isFound) {
        ctx.strokeStyle = css('--viz-found');
        ctx.lineWidth = 2.5;
      } else {
        ctx.strokeStyle = css('--border-color');
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // Cell text
      ctx.font = 'bold ' + fontSize + 'px ' + css('--font-mono');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isFound) {
        ctx.fillStyle = css('--bg-primary');
      } else if (isEliminated) {
        ctx.fillStyle = css('--text-tertiary');
      } else {
        ctx.fillStyle = css('--viz-cell-text');
      }
      ctx.fillText(arr[i], x + cellW / 2, startY + cellH / 2);
    }

    // Draw pointer arrows below cells
    if (!step) return;

    var arrowY = startY + cellH + 20;
    var arrowLen = 18;

    function drawArrow(idx, color, label) {
      if (idx < 0 || idx >= arr.length) return;
      var ax = startX + idx * (cellW + gap) + cellW / 2;

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;

      // Arrow line pointing up
      ctx.beginPath();
      ctx.moveTo(ax, arrowY + arrowLen);
      ctx.lineTo(ax, arrowY);
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(ax, arrowY);
      ctx.lineTo(ax - 5, arrowY + 8);
      ctx.lineTo(ax + 5, arrowY + 8);
      ctx.closePath();
      ctx.fill();

      // Label below arrow
      ctx.font = 'bold ' + (fontSize - 1) + 'px ' + css('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, ax, arrowY + arrowLen + 4);
    }

    // Draw in order: low, high, mid (mid on top so it is most visible)
    if (step.found === -1) {
      drawArrow(step.low, css('--viz-pointer-low'), 'low');
      drawArrow(step.high, css('--viz-pointer-high'), 'high');
      if (step.mid >= 0) {
        drawArrow(step.mid, css('--viz-pointer-mid'), 'mid');
      }
    } else {
      // Only show found pointer
      drawArrow(step.found, css('--viz-found'), 'FOUND');
    }

    // Target label in top-right
    ctx.font = 'bold ' + fontSize + 'px ' + css('--font-sans');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = css('--text-secondary');
    ctx.fillText('Target: ' + currentTarget, w - 20, 14);
  }

  // ── Step change callback ────────────────────────────────────────────
  function onStepChange(step, data) {
    var explanationEl = document.querySelector('.viz-explanation');
    if (explanationEl && step) {
      explanationEl.textContent = step.description;
    } else if (explanationEl) {
      explanationEl.textContent = 'Set a target and click Search to begin.';
    }
  }

  // ── Generate random sorted array ───────────────────────────────────
  function randomSortedArray() {
    var len = 8 + Math.floor(Math.random() * 6); // 8-13 elements
    var arr = [];
    var val = Math.floor(Math.random() * 5) + 1;
    for (var i = 0; i < len; i++) {
      arr.push(val);
      val += Math.floor(Math.random() * 12) + 1;
    }
    return arr;
  }

  // ── Load a custom array (sorts it, then re-runs search) ────────────
  function loadArray(arr) {
    currentArray = arr.slice().sort(function(a, b) { return a - b; });
    runSearch();
  }

  // ── Run a search ───────────────────────────────────────────────────
  function runSearch() {
    var inputEl = document.getElementById('bs-target-input');
    if (inputEl) {
      var val = parseInt(inputEl.value, 10);
      if (!isNaN(val)) {
        currentTarget = val;
      }
    }
    var steps = computeSteps(currentArray, currentTarget);
    viz.setSteps(steps);
  }

  // ── Init ────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('binary-search-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('binary-search', {
      canvas: canvas,
      onRender: renderStep,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Wire target input
    var targetInput = document.getElementById('bs-target-input');
    if (targetInput) {
      targetInput.value = currentTarget;
      targetInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          runSearch();
        }
      });
    }

    // Wire search button
    var searchBtn = document.getElementById('bs-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        runSearch();
      });
    }

    // Wire randomize button
    var randomBtn = document.getElementById('bs-randomize-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', function() {
        currentArray = randomSortedArray();
        // Pick a random target: 70% chance it exists in array
        if (Math.random() < 0.7) {
          currentTarget = currentArray[Math.floor(Math.random() * currentArray.length)];
        } else {
          currentTarget = currentArray[Math.floor(Math.random() * currentArray.length)] + 1;
        }
        if (targetInput) {
          targetInput.value = currentTarget;
        }
        runSearch();
      });
    }

    // Custom array input
    var customInput = document.getElementById('bin-custom-input');
    var customBtn = document.getElementById('bin-custom-btn');
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

    // Initial search
    runSearch();
  }

  DSA.binarySearchViz = { init: init };
})();
