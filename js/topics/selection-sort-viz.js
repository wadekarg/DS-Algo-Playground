var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var currentArray = [];
  var defaultSample = [64, 25, 12, 22, 11, 90, 34, 45];

  // Read CSS custom properties for colors
  function getColor(varName, fallback) {
    var style = getComputedStyle(document.documentElement);
    var val = style.getPropertyValue(varName).trim();
    return val || fallback;
  }

  /**
   * Parse a comma-separated string into an array of integers.
   */
  function parseIntArray(str) {
    if (!str || !str.trim()) return [];
    return str.split(',').map(function(s) {
      return parseInt(s.trim(), 10);
    }).filter(function(n) {
      return !isNaN(n);
    });
  }

  /**
   * Generate a random array of 8-12 values in range 5-100.
   */
  function randomArray() {
    var len = 8 + Math.floor(Math.random() * 5); // 8 to 12
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(5 + Math.floor(Math.random() * 96)); // 5 to 100
    }
    return arr;
  }

  /**
   * Pre-compute ALL steps for the entire selection sort.
   * Each step: { array: [...], scanning: index|null, currentMin: index|null,
   *              sorted: [indices], swapping: [i,j]|null, description: "..." }
   */
  function generateSteps(arr) {
    var steps = [];
    var a = arr.slice();
    var n = a.length;
    var sorted = [];

    // Initial state
    steps.push({
      array: a.slice(),
      scanning: null,
      currentMin: null,
      sorted: sorted.slice(),
      swapping: null,
      codeLine: 2,
      variables: { n: n },
      description: 'Initial array: [' + a.join(', ') + ']. Selection sort will find the minimum element in the unsorted portion and swap it into the correct position.'
    });

    for (var i = 0; i < n - 1; i++) {
      var minIdx = i;

      // Show the start of the pass: current position i is the assumed minimum
      steps.push({
        array: a.slice(),
        scanning: null,
        currentMin: i,
        sorted: sorted.slice(),
        swapping: null,
        codeLine: 3,
        variables: { i: i, min_idx: i },
        description: 'Pass ' + (i + 1) + ': Looking for the minimum in the unsorted portion (index ' + i + ' to ' + (n - 1) + '). Starting with ' + a[i] + ' (index ' + i + ') as the assumed minimum.'
      });

      // Scan remaining elements to find the actual minimum
      for (var j = i + 1; j < n; j++) {
        // Scanning comparison step
        steps.push({
          array: a.slice(),
          scanning: j,
          currentMin: minIdx,
          sorted: sorted.slice(),
          swapping: null,
          codeLine: 5,
          variables: { i: i, j: j, min_idx: minIdx },
          description: 'Pass ' + (i + 1) + ': Comparing current minimum ' + a[minIdx] + ' (index ' + minIdx + ') with ' + a[j] + ' (index ' + j + ').'
        });

        if (a[j] < a[minIdx]) {
          var oldMinIdx = minIdx;
          minIdx = j;

          // Found a new minimum
          steps.push({
            array: a.slice(),
            scanning: null,
            currentMin: minIdx,
            sorted: sorted.slice(),
            swapping: null,
            codeLine: 6,
            variables: { i: i, j: j, min_idx: minIdx },
            description: 'Pass ' + (i + 1) + ': Found new minimum! ' + a[minIdx] + ' (index ' + minIdx + ') is smaller than ' + a[oldMinIdx] + ' (index ' + oldMinIdx + '). Updating minimum.'
          });
        }
      }

      // Found minimum step
      steps.push({
        array: a.slice(),
        scanning: null,
        currentMin: minIdx,
        sorted: sorted.slice(),
        swapping: null,
        codeLine: 7,
        variables: { i: i, min_idx: minIdx },
        description: 'Pass ' + (i + 1) + ': Minimum of unsorted portion is ' + a[minIdx] + ' (index ' + minIdx + ').' + (minIdx !== i ? ' It needs to be swapped with ' + a[i] + ' (index ' + i + ').' : ' It is already in position ' + i + '. No swap needed.')
      });

      // Swap if needed
      if (minIdx !== i) {
        // Show the swap
        steps.push({
          array: a.slice(),
          scanning: null,
          currentMin: null,
          sorted: sorted.slice(),
          swapping: [i, minIdx],
          codeLine: 7,
          variables: { i: i, min_idx: minIdx },
          description: 'Pass ' + (i + 1) + ': Swapping ' + a[i] + ' (index ' + i + ') with ' + a[minIdx] + ' (index ' + minIdx + ').'
        });

        // Perform the swap
        var temp = a[i];
        a[i] = a[minIdx];
        a[minIdx] = temp;

        // Show result after swap
        steps.push({
          array: a.slice(),
          scanning: null,
          currentMin: null,
          sorted: sorted.slice(),
          swapping: [i, minIdx],
          codeLine: 7,
          variables: { i: i, min_idx: minIdx },
          description: 'Pass ' + (i + 1) + ': Swapped! Array is now [' + a.join(', ') + '].'
        });
      }

      // Mark position i as sorted
      sorted.push(i);

      // Pass complete
      steps.push({
        array: a.slice(),
        scanning: null,
        currentMin: null,
        sorted: sorted.slice(),
        swapping: null,
        codeLine: 8,
        variables: { i: i },
        description: 'Pass ' + (i + 1) + ' complete. Element ' + a[i] + ' is now in its sorted position (index ' + i + ').'
      });
    }

    // Mark the last remaining element as sorted
    sorted.push(n - 1);
    steps.push({
      array: a.slice(),
      scanning: null,
      currentMin: null,
      sorted: sorted.slice(),
      swapping: null,
      codeLine: 8,
      variables: { n: n },
      description: 'Sorting complete! Final sorted array: [' + a.join(', ') + ']. Selection sort made ' + (n - 1) + ' passes through the array.'
    });

    return steps;
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
    var textColor = getColor('--text-primary', '#1e293b');

    ctx.clearRect(0, 0, w, h);

    if (!step) {
      // No step data, draw placeholder
      ctx.fillStyle = textColor;
      ctx.font = '16px ' + getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
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
    var barAreaHeight = h - padding * 2 - 20; // extra space for labels at bottom
    var gap = Math.max(4, barAreaWidth * 0.03);
    var barWidth = (barAreaWidth - gap * (n - 1)) / n;

    for (var j = 0; j < n; j++) {
      var barHeight = (arr[j] / maxVal) * barAreaHeight;
      var x = padding + j * (barWidth + gap);
      var y = h - padding - barHeight;

      // Determine bar color
      var color = colorDefault;

      // Sorted bars are green
      if (step.sorted && step.sorted.indexOf(j) !== -1) {
        color = colorSorted;
      }

      // Current minimum is orange
      if (step.currentMin !== null && step.currentMin !== undefined && j === step.currentMin) {
        color = colorSwap;
      }

      // Scanning element is yellow
      if (step.scanning !== null && step.scanning !== undefined && j === step.scanning) {
        color = colorCompare;
      }

      // Swapping elements are orange
      if (step.swapping && step.swapping.indexOf(j) !== -1) {
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
      ctx.font = 'bold 13px ' + getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(arr[j]), x + barWidth / 2, y - 4);

      // Draw index label below bar
      ctx.fillStyle = getColor('--text-tertiary', '#94a3b8');
      ctx.font = '11px ' + getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
      ctx.textBaseline = 'top';
      ctx.fillText(String(j), x + barWidth / 2, h - padding + 4);
    }

    // Draw indicator arrows for scanning and currentMin
    if (step.scanning !== null && step.scanning !== undefined && step.currentMin !== null && step.currentMin !== undefined) {
      var minX = padding + step.currentMin * (barWidth + gap) + barWidth / 2;
      var scanX = padding + step.scanning * (barWidth + gap) + barWidth / 2;
      var arrowY = h - padding + 18;

      // Draw connecting line between min and scanning
      ctx.strokeStyle = colorCompare;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(minX, arrowY);
      ctx.lineTo(scanX, arrowY);
      ctx.stroke();

      // Small triangle at min end (orange)
      var triSize = 5;
      ctx.fillStyle = colorSwap;
      ctx.beginPath();
      ctx.moveTo(minX, arrowY - triSize);
      ctx.lineTo(minX, arrowY + triSize);
      ctx.lineTo(minX + (scanX > minX ? triSize : -triSize), arrowY);
      ctx.closePath();
      ctx.fill();

      // Small triangle at scan end (yellow)
      ctx.fillStyle = colorCompare;
      ctx.beginPath();
      ctx.moveTo(scanX, arrowY - triSize);
      ctx.lineTo(scanX, arrowY + triSize);
      ctx.lineTo(scanX + (minX > scanX ? triSize : -triSize), arrowY);
      ctx.closePath();
      ctx.fill();
    }

    // Draw swap indicator arrows
    if (step.swapping && step.swapping.length === 2) {
      var idx0 = step.swapping[0];
      var idx1 = step.swapping[1];
      var cx0 = padding + idx0 * (barWidth + gap) + barWidth / 2;
      var cx1 = padding + idx1 * (barWidth + gap) + barWidth / 2;
      var swapY = h - padding + 18;

      ctx.strokeStyle = colorSwap;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx0, swapY);
      ctx.lineTo(cx1, swapY);
      ctx.stroke();

      // Small triangles at each end
      var swapTriSize = 5;
      ctx.fillStyle = colorSwap;
      // Left triangle
      ctx.beginPath();
      ctx.moveTo(cx0, swapY - swapTriSize);
      ctx.lineTo(cx0, swapY + swapTriSize);
      ctx.lineTo(cx0 + swapTriSize, swapY);
      ctx.closePath();
      ctx.fill();
      // Right triangle
      ctx.beginPath();
      ctx.moveTo(cx1, swapY - swapTriSize);
      ctx.lineTo(cx1, swapY + swapTriSize);
      ctx.lineTo(cx1 - swapTriSize, swapY);
      ctx.closePath();
      ctx.fill();
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
   * Load an array into the visualization.
   */
  function loadArray(arr) {
    currentArray = arr.slice();
    var steps = generateSteps(currentArray);
    viz.setSteps(steps);
  }

  /**
   * Initialize the selection sort visualization.
   */
  function init() {
    var canvas = document.getElementById('selection-sort-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('selection-sort', {
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
    var randomizeBtn = document.getElementById('ss-randomize-btn');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', function() {
        var arr = randomArray();
        loadArray(arr);
      });
    }

    // Wire load button for user input
    var loadBtn = document.getElementById('ss-load-btn');
    var arrayInput = document.getElementById('ss-array-input');
    if (loadBtn && arrayInput) {
      loadBtn.addEventListener('click', function() {
        var arr = parseIntArray(arrayInput.value);
        if (arr.length >= 2) {
          loadArray(arr);
        }
      });
    }

    // Custom array input
    var customInput = document.getElementById('ss-custom-input');
    var customBtn = document.getElementById('ss-custom-btn');
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

  DSA.selectionSortViz = { init: init };
})();
