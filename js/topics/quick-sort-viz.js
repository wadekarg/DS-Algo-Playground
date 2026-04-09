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

  /**
   * Render the bar chart on canvas.
   */
  function renderBars(ctx, step, data) {
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

    for (var j = 0; j < n; j++) {
      var barHeight = (arr[j] / maxVal) * barAreaHeight;
      var x = padding + j * (barWidth + gap);
      var y = h - padding - barHeight;

      // Determine bar color
      var color = colorDefault;

      // Check if sorted
      if (step.sorted && step.sorted.indexOf(j) !== -1) {
        color = colorSorted;
      }

      // Dim elements outside the active partition
      if (step.activeLeft >= 0 && step.activeRight >= 0) {
        if ((j < step.activeLeft || j > step.activeRight) && step.sorted.indexOf(j) === -1) {
          color = dimColor;
        }
      }

      // Pivot gets purple
      if (j === step.pivot) {
        color = colorPivot;
      }

      // Partitioned elements (already placed on left side)
      if (step.partitioned && step.partitioned.indexOf(j) !== -1 && j !== step.pivot) {
        if (step.sorted.indexOf(j) === -1) {
          color = colorCompare;
        }
      }

      // Left pointer (partition boundary)
      if (j === step.left && step.left >= 0 && step.sorted.indexOf(j) === -1 && j !== step.pivot) {
        color = colorCompare;
      }

      // Right pointer (scanning)
      if (j === step.right && step.right >= 0 && step.sorted.indexOf(j) === -1 && j !== step.pivot) {
        color = colorSwap;
      }

      // Draw bar with rounded top
      var radius = Math.min(barWidth / 4, 6);
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.lineTo(x, h - padding);
      ctx.lineTo(x + barWidth, h - padding);
      ctx.lineTo(x + barWidth, y + radius);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth - radius, y);
      ctx.lineTo(x + radius, y);
      ctx.quadraticCurveTo(x, y, x, y + radius);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      // Draw value label above bar
      ctx.fillStyle = textColor;
      ctx.font = 'bold 13px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(arr[j]), x + barWidth / 2, y - 4);

      // Draw index label below bar
      ctx.fillStyle = getColor('--text-tertiary', '#94a3b8');
      ctx.font = '11px ' + fontSans();
      ctx.textBaseline = 'top';
      ctx.fillText(String(j), x + barWidth / 2, h - padding + 4);
    }

    // Draw pointer labels below indices
    var labelY = h - padding + 18;
    var fontSize = 11;

    if (step.left >= 0 && step.left < n) {
      var lx = padding + step.left * (barWidth + gap) + barWidth / 2;
      ctx.fillStyle = colorCompare;
      ctx.font = 'bold ' + fontSize + 'px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('i', lx, labelY);
    }

    if (step.right >= 0 && step.right < n) {
      var rx = padding + step.right * (barWidth + gap) + barWidth / 2;
      ctx.fillStyle = colorSwap;
      ctx.font = 'bold ' + fontSize + 'px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('j', rx, labelY);
    }

    if (step.pivot >= 0 && step.pivot < n) {
      var px = padding + step.pivot * (barWidth + gap) + barWidth / 2;
      ctx.fillStyle = colorPivot;
      ctx.font = 'bold ' + fontSize + 'px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      // Offset slightly if colliding with i or j
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
