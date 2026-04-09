var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var defaultArray = [1, 3, 5, 7, 9, 11, 15, 18];
  var defaultTarget = 16;
  var currentArray = defaultArray.slice();
  var currentTarget = defaultTarget;

  // ── Colour helpers ──────────────────────────────────────────────────
  function css(prop) {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  // ── Step pre-computation ────────────────────────────────────────────
  function computeSteps(arr, target) {
    var steps = [];
    var left = 0;
    var right = arr.length - 1;

    // Initial state
    steps.push({
      array: arr.slice(),
      left: left,
      right: right,
      found: -1,
      foundPair: null,
      eliminated: [],
      codeLine: 2,
      variables: { left: left, right: right },
      description: 'Initialize two pointers: left = 0 (value ' + arr[left] + '), right = ' + right + ' (value ' + arr[right] + '). Target sum = ' + target + '.'
    });

    var eliminated = [];

    while (left < right) {
      var sum = arr[left] + arr[right];

      if (sum === target) {
        // Found pair
        steps.push({
          array: arr.slice(),
          left: left,
          right: right,
          found: 1,
          foundPair: [left, right],
          eliminated: eliminated.slice(),
          codeLine: 5,
          variables: { left: left, right: right, s: sum },
          description: 'arr[' + left + '] + arr[' + right + '] = ' + arr[left] + ' + ' + arr[right] + ' = ' + sum + ' equals target ' + target + '. Pair found!'
        });
        return steps;
      } else if (sum < target) {
        // Sum too small, move left pointer right
        steps.push({
          array: arr.slice(),
          left: left,
          right: right,
          found: 0,
          foundPair: null,
          eliminated: eliminated.slice(),
          codeLine: 7,
          variables: { left: left, right: right, s: sum },
          description: 'arr[' + left + '] + arr[' + right + '] = ' + arr[left] + ' + ' + arr[right] + ' = ' + sum + ' < ' + target + '. Sum too small, move left pointer right.'
        });
        if (eliminated.indexOf(left) === -1) eliminated.push(left);
        left++;
        steps.push({
          array: arr.slice(),
          left: left,
          right: right,
          found: 0,
          foundPair: null,
          eliminated: eliminated.slice(),
          codeLine: 7,
          variables: { left: left, right: right },
          description: 'Left pointer moved to index ' + left + ' (value ' + arr[left] + '). Now checking arr[' + left + '] + arr[' + right + '].'
        });
      } else {
        // Sum too large, move right pointer left
        steps.push({
          array: arr.slice(),
          left: left,
          right: right,
          found: 0,
          foundPair: null,
          eliminated: eliminated.slice(),
          codeLine: 9,
          variables: { left: left, right: right, s: sum },
          description: 'arr[' + left + '] + arr[' + right + '] = ' + arr[left] + ' + ' + arr[right] + ' = ' + sum + ' > ' + target + '. Sum too large, move right pointer left.'
        });
        if (eliminated.indexOf(right) === -1) eliminated.push(right);
        right--;
        steps.push({
          array: arr.slice(),
          left: left,
          right: right,
          found: 0,
          foundPair: null,
          eliminated: eliminated.slice(),
          codeLine: 9,
          variables: { left: left, right: right },
          description: 'Right pointer moved to index ' + right + ' (value ' + arr[right] + '). Now checking arr[' + left + '] + arr[' + right + '].'
        });
      }
    }

    // No pair found
    steps.push({
      array: arr.slice(),
      left: left,
      right: right,
      found: -1,
      foundPair: null,
      eliminated: eliminated.slice(),
      codeLine: 10,
      variables: { left: left, right: right },
      description: 'Pointers have crossed (left >= right). No pair sums to ' + target + '.'
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
    var startY = h * 0.2;

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
      var isFoundLeft = step && step.foundPair && step.foundPair[0] === i;
      var isFoundRight = step && step.foundPair && step.foundPair[1] === i;
      var isFound = isFoundLeft || isFoundRight;
      var isLeft = step && step.left === i && !isFound;
      var isRight = step && step.right === i && !isFound;

      // Cell background
      if (isFound) {
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
      } else if (isLeft) {
        ctx.fillStyle = css('--viz-default');
      } else if (isRight) {
        ctx.fillStyle = css('--viz-active');
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
      } else if (isLeft) {
        ctx.strokeStyle = css('--viz-default');
        ctx.lineWidth = 2.5;
      } else if (isRight) {
        ctx.strokeStyle = css('--viz-active');
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
      if (isFound || isLeft || isRight) {
        ctx.fillStyle = '#ffffff';
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

    if (step.foundPair) {
      drawArrow(step.foundPair[0], css('--viz-found'), 'FOUND');
      drawArrow(step.foundPair[1], css('--viz-found'), 'FOUND');
    } else {
      drawArrow(step.left, css('--viz-default'), 'left');
      drawArrow(step.right, css('--viz-active'), 'right');
    }

    // Sum display in top-right
    ctx.font = 'bold ' + fontSize + 'px ' + css('--font-sans');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = css('--text-secondary');
    ctx.fillText('Target: ' + currentTarget, w - 20, 14);

    // Show current sum below target
    if (step.left >= 0 && step.right >= 0 && step.left < arr.length && step.right < arr.length && step.left <= step.right) {
      var curSum = arr[step.left] + arr[step.right];
      ctx.font = (fontSize - 1) + 'px ' + css('--font-sans');
      ctx.fillText('Sum: ' + arr[step.left] + ' + ' + arr[step.right] + ' = ' + curSum, w - 20, 14 + fontSize + 6);
    }
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
    var len = 7 + Math.floor(Math.random() * 5); // 7-11 elements
    var arr = [];
    var val = Math.floor(Math.random() * 5) + 1;
    for (var i = 0; i < len; i++) {
      arr.push(val);
      val += Math.floor(Math.random() * 8) + 1;
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
    var inputEl = document.getElementById('tp-target-input');
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
    var canvas = document.getElementById('two-pointers-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('two-pointers', {
      canvas: canvas,
      onRender: renderStep,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Wire target input
    var targetInput = document.getElementById('tp-target-input');
    if (targetInput) {
      targetInput.value = currentTarget;
      targetInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          runSearch();
        }
      });
    }

    // Wire search button
    var searchBtn = document.getElementById('tp-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        runSearch();
      });
    }

    // Wire randomize button
    var randomBtn = document.getElementById('tp-randomize-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', function() {
        currentArray = randomSortedArray();
        // 70% chance the target is achievable
        if (Math.random() < 0.7) {
          var a = Math.floor(Math.random() * currentArray.length);
          var b = Math.floor(Math.random() * currentArray.length);
          if (a !== b) {
            currentTarget = currentArray[a] + currentArray[b];
          } else {
            currentTarget = currentArray[0] + currentArray[currentArray.length - 1];
          }
        } else {
          currentTarget = currentArray[currentArray.length - 1] + Math.floor(Math.random() * 10) + 5;
        }
        if (targetInput) {
          targetInput.value = currentTarget;
        }
        runSearch();
      });
    }

    // Custom array input
    var customInput = document.getElementById('tp-custom-input');
    var customBtn = document.getElementById('tp-custom-btn');
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

  DSA.twoPointersViz = { init: init };
})();
