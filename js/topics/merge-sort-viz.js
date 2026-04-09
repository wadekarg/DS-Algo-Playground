var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var currentArray = [];
  var defaultSample = [38, 27, 43, 3, 9, 82, 10];

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
   * Pre-compute ALL split and merge steps for the entire merge sort.
   * Each step: { array: [...], ranges: [{left, right, color}], comparing: [i,j] or null, merged: [indices], description: "..." }
   */
  function generateSteps(arr) {
    var steps = [];
    var a = arr.slice();
    var n = a.length;

    // Initial state
    steps.push({
      array: a.slice(),
      ranges: [{ left: 0, right: n - 1, color: 'default' }],
      comparing: null,
      merged: [],
      codeLine: 2,
      variables: { n: n },
      description: 'Initial array: [' + a.join(', ') + ']. Merge sort will recursively divide the array in half, then merge sorted halves back together.'
    });

    // Run merge sort and record each split/merge step
    mergeSortRecursive(a, 0, n - 1, steps);

    // Final sorted state
    var allIndices = [];
    for (var i = 0; i < n; i++) {
      allIndices.push(i);
    }
    steps.push({
      array: a.slice(),
      ranges: [{ left: 0, right: n - 1, color: 'sorted' }],
      comparing: null,
      merged: allIndices,
      codeLine: 7,
      variables: { n: n },
      description: 'Sorting complete! Final sorted array: [' + a.join(', ') + '].'
    });

    return steps;
  }

  function mergeSortRecursive(a, left, right, steps) {
    if (left >= right) return;

    var mid = Math.floor((left + right) / 2);

    // Show the split
    steps.push({
      array: a.slice(),
      ranges: [
        { left: left, right: mid, color: 'compare' },
        { left: mid + 1, right: right, color: 'swap' }
      ],
      comparing: null,
      merged: [],
      codeLine: 4,
      variables: { mid: mid, left: left, right: right },
      description: 'Split: Dividing subarray [' + left + '..' + right + '] into [' + left + '..' + mid + '] and [' + (mid + 1) + '..' + right + ']. Values: [' + a.slice(left, mid + 1).join(', ') + '] and [' + a.slice(mid + 1, right + 1).join(', ') + '].'
    });

    // Recurse on left half
    mergeSortRecursive(a, left, mid, steps);

    // Recurse on right half
    mergeSortRecursive(a, mid + 1, right, steps);

    // Merge step
    merge(a, left, mid, right, steps);
  }

  function merge(a, left, mid, right, steps) {
    var leftArr = a.slice(left, mid + 1);
    var rightArr = a.slice(mid + 1, right + 1);
    var i = 0;
    var j = 0;
    var k = left;
    var mergedSoFar = [];

    // Show start of merge
    steps.push({
      array: a.slice(),
      ranges: [
        { left: left, right: mid, color: 'compare' },
        { left: mid + 1, right: right, color: 'swap' }
      ],
      comparing: null,
      merged: [],
      codeLine: 9,
      variables: { i: i, j: j },
      description: 'Merge: Merging [' + leftArr.join(', ') + '] and [' + rightArr.join(', ') + '] into positions [' + left + '..' + right + '].'
    });

    while (i < leftArr.length && j < rightArr.length) {
      // Show comparison
      var leftIdx = left + i;
      var rightIdx = mid + 1 + j;

      steps.push({
        array: a.slice(),
        ranges: [
          { left: left, right: mid, color: 'compare' },
          { left: mid + 1, right: right, color: 'swap' }
        ],
        comparing: [leftIdx, rightIdx],
        merged: mergedSoFar.slice(),
        codeLine: 10,
        variables: { i: i, j: j },
        description: 'Comparing ' + leftArr[i] + ' (left, index ' + leftIdx + ') with ' + rightArr[j] + ' (right, index ' + rightIdx + ').'
      });

      if (leftArr[i] <= rightArr[j]) {
        a[k] = leftArr[i];
        mergedSoFar.push(k);
        steps.push({
          array: a.slice(),
          ranges: [
            { left: left, right: mid, color: 'compare' },
            { left: mid + 1, right: right, color: 'swap' }
          ],
          comparing: null,
          merged: mergedSoFar.slice(),
          codeLine: 11,
          variables: { i: i, j: j },
          description: 'Picked ' + leftArr[i] + ' from left subarray. Placed at index ' + k + '.'
        });
        i++;
      } else {
        a[k] = rightArr[j];
        mergedSoFar.push(k);
        steps.push({
          array: a.slice(),
          ranges: [
            { left: left, right: mid, color: 'compare' },
            { left: mid + 1, right: right, color: 'swap' }
          ],
          comparing: null,
          merged: mergedSoFar.slice(),
          codeLine: 13,
          variables: { i: i, j: j },
          description: 'Picked ' + rightArr[j] + ' from right subarray. Placed at index ' + k + '.'
        });
        j++;
      }
      k++;
    }

    // Copy remaining from left
    while (i < leftArr.length) {
      a[k] = leftArr[i];
      mergedSoFar.push(k);
      steps.push({
        array: a.slice(),
        ranges: [
          { left: left, right: right, color: 'compare' }
        ],
        comparing: null,
        merged: mergedSoFar.slice(),
        codeLine: 14,
        variables: { i: i, j: j },
        description: 'Copying remaining element ' + leftArr[i] + ' from left subarray to index ' + k + '.'
      });
      i++;
      k++;
    }

    // Copy remaining from right
    while (j < rightArr.length) {
      a[k] = rightArr[j];
      mergedSoFar.push(k);
      steps.push({
        array: a.slice(),
        ranges: [
          { left: left, right: right, color: 'swap' }
        ],
        comparing: null,
        merged: mergedSoFar.slice(),
        codeLine: 14,
        variables: { i: i, j: j },
        description: 'Copying remaining element ' + rightArr[j] + ' from right subarray to index ' + k + '.'
      });
      j++;
      k++;
    }

    // Show merged subarray result
    var mergedRange = [];
    for (var m = left; m <= right; m++) {
      mergedRange.push(m);
    }
    steps.push({
      array: a.slice(),
      ranges: [
        { left: left, right: right, color: 'sorted' }
      ],
      comparing: null,
      merged: mergedRange,
      codeLine: 7,
      variables: { left: left, right: right },
      description: 'Merge complete for [' + left + '..' + right + ']: [' + a.slice(left, right + 1).join(', ') + '] is now sorted.'
    });
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
    var barAreaHeight = h - padding * 2 - 20;
    var gap = Math.max(4, barAreaWidth * 0.03);
    var barWidth = (barAreaWidth - gap * (n - 1)) / n;

    for (var j = 0; j < n; j++) {
      var barHeight = (arr[j] / maxVal) * barAreaHeight;
      var x = padding + j * (barWidth + gap);
      var y = h - padding - barHeight;

      // Determine bar color
      var color = colorDefault;

      // Check if in a merged (sorted) range
      if (step.merged && step.merged.indexOf(j) !== -1) {
        color = colorSorted;
      }

      // Check if in a colored range
      if (step.ranges) {
        for (var r = 0; r < step.ranges.length; r++) {
          var range = step.ranges[r];
          if (j >= range.left && j <= range.right) {
            if (range.color === 'compare' && color !== colorSorted) {
              color = colorCompare;
            } else if (range.color === 'swap' && color !== colorSorted) {
              color = colorSwap;
            } else if (range.color === 'sorted') {
              color = colorSorted;
            }
          }
        }
      }

      // Override for comparison pointers
      if (step.comparing && step.comparing.indexOf(j) !== -1) {
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

    // Draw comparing indicator arrows
    if (step.comparing && step.comparing.length === 2) {
      var idx0 = step.comparing[0];
      var idx1 = step.comparing[1];
      var cx0 = padding + idx0 * (barWidth + gap) + barWidth / 2;
      var cx1 = padding + idx1 * (barWidth + gap) + barWidth / 2;
      var arrowY = h - padding + 18;

      ctx.strokeStyle = colorSwap;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx0, arrowY);
      ctx.lineTo(cx1, arrowY);
      ctx.stroke();

      // Small triangles at each end
      var triSize = 5;
      ctx.fillStyle = colorSwap;
      // Left triangle
      ctx.beginPath();
      ctx.moveTo(cx0, arrowY - triSize);
      ctx.lineTo(cx0, arrowY + triSize);
      ctx.lineTo(cx0 + triSize, arrowY);
      ctx.closePath();
      ctx.fill();
      // Right triangle
      ctx.beginPath();
      ctx.moveTo(cx1, arrowY - triSize);
      ctx.lineTo(cx1, arrowY + triSize);
      ctx.lineTo(cx1 - triSize, arrowY);
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
   * Initialize the merge sort visualization.
   */
  function init() {
    var canvas = document.getElementById('merge-sort-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('merge-sort', {
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
    var randomizeBtn = document.getElementById('ms-randomize-btn');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', function() {
        var arr = randomArray();
        var inputEl = document.getElementById('ms-array-input');
        if (inputEl) {
          inputEl.value = arr.join(', ');
        }
        loadArray(arr);
      });
    }

    // Wire load button
    var loadBtn = document.getElementById('ms-load-btn');
    if (loadBtn) {
      loadBtn.addEventListener('click', function() {
        var inputEl = document.getElementById('ms-array-input');
        if (inputEl && inputEl.value.trim()) {
          var parsed = DSA.vizUtils.parseIntArray(inputEl.value);
          if (parsed.length > 0) {
            loadArray(parsed);
          }
        }
      });
    }

    // Wire enter key on input
    var arrayInput = document.getElementById('ms-array-input');
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
    var customInput = document.getElementById('ms-custom-input');
    var customBtn = document.getElementById('ms-custom-btn');
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

  DSA.mergeSortViz = { init: init };
})();
