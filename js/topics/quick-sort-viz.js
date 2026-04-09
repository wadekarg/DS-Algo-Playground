var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var currentArray = [];
  var defaultSample = [64, 34, 25, 12, 22, 11, 90, 45];

  // Read CSS custom properties for colors
  function getColor(varName, fallback) {
    var style = getComputedStyle(document.documentElement);
    var val = style.getPropertyValue(varName).trim();
    return val || fallback;
  }

  function fontSans() {
    return getColor('--font-sans', 'sans-serif');
  }

  /**
   * Pre-compute ALL partition and swap steps for the entire quick sort.
   * Each step: { array: [...], pivot: index, left: index, right: index,
   *   partitioned: [indices], sorted: [indices], activeLeft: num, activeRight: num, description: "..." }
   */
  function generateSteps(arr) {
    var steps = [];
    var a = arr.slice();
    var n = a.length;
    var sorted = [];

    // Initial state
    steps.push({
      array: a.slice(),
      pivot: -1,
      left: -1,
      right: -1,
      partitioned: [],
      sorted: [],
      activeLeft: 0,
      activeRight: n - 1,
      codeLine: 1,
      variables: { lo: 0, hi: n - 1 },
      description: 'Initial array: [' + a.join(', ') + ']. Quick sort will choose a pivot, partition the array around it, then recursively sort each partition.'
    });

    quickSortRecursive(a, 0, n - 1, steps, sorted);

    // Final sorted state
    var allIndices = [];
    for (var i = 0; i < n; i++) {
      allIndices.push(i);
    }
    steps.push({
      array: a.slice(),
      pivot: -1,
      left: -1,
      right: -1,
      partitioned: [],
      sorted: allIndices,
      activeLeft: -1,
      activeRight: -1,
      codeLine: 4,
      variables: { n: n },
      description: 'Sorting complete! Final sorted array: [' + a.join(', ') + '].'
    });

    return steps;
  }

  function quickSortRecursive(a, low, high, steps, sorted) {
    if (low > high) return;

    if (low === high) {
      // Single element is already sorted
      if (sorted.indexOf(low) === -1) {
        sorted.push(low);
      }
      steps.push({
        array: a.slice(),
        pivot: -1,
        left: -1,
        right: -1,
        partitioned: [],
        sorted: sorted.slice(),
        activeLeft: low,
        activeRight: high,
        codeLine: 2,
        variables: { lo: low, hi: high },
        description: 'Subarray [' + low + '..' + high + '] has only one element (' + a[low] + '). It is already sorted.'
      });
      return;
    }

    // Choose pivot as last element (Lomuto partition scheme)
    var pivotIdx = high;
    var pivotVal = a[pivotIdx];

    steps.push({
      array: a.slice(),
      pivot: pivotIdx,
      left: low,
      right: high - 1,
      partitioned: [],
      sorted: sorted.slice(),
      activeLeft: low,
      activeRight: high,
      codeLine: 8,
      variables: { pivot: pivotVal, lo: low, hi: high },
      description: 'Partitioning [' + low + '..' + high + ']. Pivot = ' + pivotVal + ' (index ' + pivotIdx + '). Elements smaller go left, larger go right.'
    });

    // Lomuto partition
    var i = low;
    var partitioned = [];

    for (var j = low; j < high; j++) {
      // Show scanning step
      steps.push({
        array: a.slice(),
        pivot: pivotIdx,
        left: i,
        right: j,
        partitioned: partitioned.slice(),
        sorted: sorted.slice(),
        activeLeft: low,
        activeRight: high,
        codeLine: 10,
        variables: { i: i, j: j, pivot: pivotVal },
        description: 'Scanning index ' + j + ': value ' + a[j] + '. Comparing with pivot ' + pivotVal + '. Partition boundary (i) at index ' + i + '.'
      });

      if (a[j] <= pivotVal) {
        if (i !== j) {
          // Swap a[i] and a[j]
          var temp = a[i];
          a[i] = a[j];
          a[j] = temp;

          steps.push({
            array: a.slice(),
            pivot: pivotIdx,
            left: i,
            right: j,
            partitioned: partitioned.slice(),
            sorted: sorted.slice(),
            activeLeft: low,
            activeRight: high,
            codeLine: 12,
            variables: { i: i, j: j, pivot: pivotVal },
            description: 'Swapped ' + a[i] + ' (index ' + i + ') and ' + a[j] + ' (index ' + j + '). Moving partition boundary right.'
          });
        } else {
          steps.push({
            array: a.slice(),
            pivot: pivotIdx,
            left: i,
            right: j,
            partitioned: partitioned.slice(),
            sorted: sorted.slice(),
            activeLeft: low,
            activeRight: high,
            codeLine: 11,
            variables: { i: i, j: j, pivot: pivotVal },
            description: a[i] + ' <= pivot ' + pivotVal + '. Element stays in place. Moving partition boundary right.'
          });
        }
        partitioned.push(i);
        i++;
      } else {
        steps.push({
          array: a.slice(),
          pivot: pivotIdx,
          left: i,
          right: j,
          partitioned: partitioned.slice(),
          sorted: sorted.slice(),
          activeLeft: low,
          activeRight: high,
          codeLine: 10,
          variables: { i: i, j: j, pivot: pivotVal },
          description: a[j] + ' > pivot ' + pivotVal + '. Element stays on the right side. Partition boundary unchanged at index ' + i + '.'
        });
      }
    }

    // Swap pivot into its correct position
    if (i !== pivotIdx) {
      var tmp = a[i];
      a[i] = a[pivotIdx];
      a[pivotIdx] = tmp;
    }

    // The pivot is now in its final sorted position
    if (sorted.indexOf(i) === -1) {
      sorted.push(i);
    }

    steps.push({
      array: a.slice(),
      pivot: i,
      left: -1,
      right: -1,
      partitioned: partitioned.slice(),
      sorted: sorted.slice(),
      activeLeft: low,
      activeRight: high,
      codeLine: 13,
      variables: { i: i, pivot: a[i] },
      description: 'Pivot ' + a[i] + ' placed at index ' + i + ' (its final sorted position). Left partition: [' + low + '..' + (i - 1) + '], Right partition: [' + (i + 1) + '..' + high + '].'
    });

    // Recurse left
    quickSortRecursive(a, low, i - 1, steps, sorted);

    // Recurse right
    quickSortRecursive(a, i + 1, high, steps, sorted);
  }

  // ── Tween helpers ───────────────────────────────────────────────────

  function lerp(a, b, t) { return a + (b - a) * t; }

  function hexToRgb(hex) {
    var m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    m = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) return [+m[1], +m[2], +m[3]];
    return [100, 100, 100];
  }

  function lerpColor(a, b, t) {
    var ca = hexToRgb(a), cb = hexToRgb(b);
    var r  = Math.round(lerp(ca[0], cb[0], t));
    var g  = Math.round(lerp(ca[1], cb[1], t));
    var bl = Math.round(lerp(ca[2], cb[2], t));
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function findSwappedPair(fromArr, toArr) {
    if (!fromArr || !toArr || fromArr.length !== toArr.length) return null;
    var diff = [];
    for (var i = 0; i < fromArr.length; i++) {
      if (fromArr[i] !== toArr[i]) diff.push(i);
      if (diff.length > 2) return null;
    }
    return diff.length === 2 ? diff : null;
  }

  function qsBarColor(step, j, colorDefault, colorCompare, colorSwap, colorSorted, colorPivot, dimColor) {
    var color = colorDefault;
    if (step.sorted && step.sorted.indexOf(j) !== -1) {
      color = colorSorted;
    }
    if (step.activeLeft >= 0 && step.activeRight >= 0) {
      if ((j < step.activeLeft || j > step.activeRight) && step.sorted.indexOf(j) === -1) {
        color = dimColor;
      }
    }
    if (j === step.pivot) {
      color = colorPivot;
    }
    if (step.partitioned && step.partitioned.indexOf(j) !== -1 && j !== step.pivot) {
      if (step.sorted.indexOf(j) === -1) {
        color = colorCompare;
      }
    }
    if (j === step.left && step.left >= 0 && step.sorted.indexOf(j) === -1 && j !== step.pivot) {
      color = colorCompare;
    }
    if (j === step.right && step.right >= 0 && step.sorted.indexOf(j) === -1 && j !== step.pivot) {
      color = colorSwap;
    }
    return color;
  }

  /**
   * Render the bar chart on canvas.
   */
  function renderBars(ctx, step, data, fromStep, tweenT) {
    var w = data.width;
    var h = data.height;
    var colorDefault = getColor('--viz-default', '#3b82f6');
    var colorCompare = getColor('--viz-compare', '#f59e0b');
    var colorSwap = getColor('--viz-swap', '#f97316');
    var colorSorted = getColor('--viz-sorted', '#22c55e');
    var colorPivot = getColor('--accent-secondary', '#8b5cf6');
    var textColor = getColor('--text-primary', '#1e293b');
    var dimColor = getColor('--viz-eliminated', '#cbd5e1');

    ctx.clearRect(0, 0, w, h);

    if (!step) {
      ctx.fillStyle = textColor;
      ctx.font = '16px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.fillText('Click "Randomize" or "Play" to begin', w / 2, h / 2);
      return;
    }

    var arr = step.array;
    var n = arr.length;
    var maxVal = 0;
    for (var i = 0; i < n; i++) {
      if (arr[i] > maxVal) maxVal = arr[i];
    }
    if (maxVal === 0) maxVal = 1;

    var padding = 40;
    var barAreaWidth = w - padding * 2;
    var barAreaHeight = h - padding * 2 - 30;
    var gap = Math.max(4, barAreaWidth * 0.03);
    var barWidth = (barAreaWidth - gap * (n - 1)) / n;

    var isTweening = fromStep && tweenT !== undefined && tweenT < 1;
    // Detect partition swap: two bars changed position
    var swappedPair = isTweening ? findSwappedPair(fromStep.array, step.array) : null;

    for (var j = 0; j < n; j++) {
      var barHeight = (arr[j] / maxVal) * barAreaHeight;
      var toX = padding + j * (barWidth + gap);
      var drawX = toX;
      var arcOffsetY = 0;

      // Arc swapped bars across each other
      if (swappedPair && (j === swappedPair[0] || j === swappedPair[1])) {
        var fromIndex = (j === swappedPair[0]) ? swappedPair[1] : swappedPair[0];
        var fromX = padding + fromIndex * (barWidth + gap);
        drawX = lerp(fromX, toX, tweenT);
        arcOffsetY = -30 * Math.sin(Math.PI * tweenT);
      }

      var y = h - padding - barHeight + arcOffsetY;

      // Determine bar color with lerp
      var color = qsBarColor(step, j, colorDefault, colorCompare, colorSwap, colorSorted, colorPivot, dimColor);
      if (isTweening && fromStep) {
        var fromColor = qsBarColor(fromStep, j, colorDefault, colorCompare, colorSwap, colorSorted, colorPivot, dimColor);
        color = lerpColor(fromColor, color, tweenT);
      }

      // Draw bar with rounded top
      var radius = Math.min(barWidth / 4, 6);
      ctx.beginPath();
      ctx.moveTo(drawX, y + radius);
      ctx.lineTo(drawX, h - padding);
      ctx.lineTo(drawX + barWidth, h - padding);
      ctx.lineTo(drawX + barWidth, y + radius);
      ctx.quadraticCurveTo(drawX + barWidth, y, drawX + barWidth - radius, y);
      ctx.lineTo(drawX + radius, y);
      ctx.quadraticCurveTo(drawX, y, drawX, y + radius);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      // Draw value label above bar
      ctx.fillStyle = textColor;
      ctx.font = 'bold 13px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(arr[j]), drawX + barWidth / 2, y - 4);

      // Draw index label below bar at canonical position
      ctx.fillStyle = getColor('--text-tertiary', '#94a3b8');
      ctx.font = '11px ' + fontSans();
      ctx.textBaseline = 'top';
      ctx.fillText(String(j), toX + barWidth / 2, h - padding + 4);
    }

    // Draw pointer labels below indices (lerp their x positions)
    var labelY = h - padding + 18;
    var fontSize = 11;

    function lerpedX(stepIdx, fromIdx) {
      if (!isTweening || fromIdx < 0 || fromIdx === stepIdx) {
        return stepIdx >= 0 ? padding + stepIdx * (barWidth + gap) + barWidth / 2 : -1;
      }
      var fx = padding + fromIdx * (barWidth + gap) + barWidth / 2;
      var tx = padding + stepIdx * (barWidth + gap) + barWidth / 2;
      return lerp(fx, tx, tweenT);
    }

    var fromLeft  = fromStep ? fromStep.left  : step.left;
    var fromRight = fromStep ? fromStep.right : step.right;
    var fromPivot = fromStep ? fromStep.pivot : step.pivot;

    if (step.left >= 0 && step.left < n) {
      var lx = lerpedX(step.left, fromLeft);
      ctx.fillStyle = colorCompare;
      ctx.font = 'bold ' + fontSize + 'px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('i', lx, labelY);
    }

    if (step.right >= 0 && step.right < n) {
      var rx = lerpedX(step.right, fromRight);
      ctx.fillStyle = colorSwap;
      ctx.font = 'bold ' + fontSize + 'px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('j', rx, labelY);
    }

    if (step.pivot >= 0 && step.pivot < n) {
      var px = lerpedX(step.pivot, fromPivot);
      ctx.fillStyle = colorPivot;
      ctx.font = 'bold ' + fontSize + 'px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      var pivotLabelY = labelY;
      if (step.pivot === step.left || step.pivot === step.right) {
        pivotLabelY = labelY + 12;
      }
      ctx.fillText('pivot', px, pivotLabelY);
    }
  }

  /**
   * Update the explanation panel.
   */
  function onStepChange(step, data) {
    var container = document.querySelector('.viz-container');
    if (!container) return;
    var explanation = container.querySelector('.viz-explanation');
    if (explanation && step) {
      explanation.textContent = step.description;
    } else if (explanation) {
      explanation.textContent = 'Press Play or Step to start the visualization.';
    }
  }

  /**
   * Generate a random array of 7-10 values in range 5-100.
   */
  function randomArray() {
    var len = 7 + Math.floor(Math.random() * 4);
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(5 + Math.floor(Math.random() * 96));
    }
    return arr;
  }

  /**
   * Load an array into the visualization.
   */
  function loadArray(arr) {
    currentArray = arr.slice();
    var steps = generateSteps(currentArray);
    viz.setSteps(steps);
  }

  /**
   * Initialize the quick sort visualization.
   */
  function init() {
    var canvas = document.getElementById('quick-sort-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('quick-sort', {
      canvas: canvas,
      onRender: renderBars,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Load default sample
    loadArray(defaultSample);

    // Wire randomize button
    var randomizeBtn = document.getElementById('qs-randomize-btn');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', function() {
        var arr = randomArray();
        var inputEl = document.getElementById('qs-array-input');
        if (inputEl) {
          inputEl.value = arr.join(', ');
        }
        loadArray(arr);
      });
    }

    // Wire load button
    var loadBtn = document.getElementById('qs-load-btn');
    if (loadBtn) {
      loadBtn.addEventListener('click', function() {
        var inputEl = document.getElementById('qs-array-input');
        if (inputEl && inputEl.value.trim()) {
          var parsed = DSA.vizUtils.parseIntArray(inputEl.value);
          if (parsed.length > 0) {
            loadArray(parsed);
          }
        }
      });
    }

    // Wire enter key on input
    var arrayInput = document.getElementById('qs-array-input');
    if (arrayInput) {
      arrayInput.value = defaultSample.join(', ');
      arrayInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          var parsed = DSA.vizUtils.parseIntArray(arrayInput.value);
          if (parsed.length > 0) {
            loadArray(parsed);
          }
        }
      });
    }

    // Custom array input
    var customInput = document.getElementById('qs-custom-input');
    var customBtn = document.getElementById('qs-custom-btn');
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

  DSA.quickSortViz = { init: init };
})();
