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

  /**
   * Pre-compute ALL compare/swap steps for the entire bubble sort.
   * Each step: { array: [...], comparing: [i,j], swapped: bool, sorted: [...indices], description: "..." }
   */
  function generateSteps(arr) {
    var steps = [];
    var a = arr.slice();
    var n = a.length;
    var sorted = [];

    // Initial state
    steps.push({
      array: a.slice(),
      comparing: [],
      swapped: false,
      sorted: sorted.slice(),
      codeLine: 2,
      variables: { n: n },
      description: 'Initial array: [' + a.join(', ') + ']. Bubble sort will compare adjacent elements and swap them if they are in the wrong order.'
    });

    for (var i = 0; i < n - 1; i++) {
      var swappedThisPass = false;

      for (var j = 0; j < n - 1 - i; j++) {
        // Compare step
        steps.push({
          array: a.slice(),
          comparing: [j, j + 1],
          swapped: false,
          sorted: sorted.slice(),
          codeLine: 6,
          variables: { i: i, j: j },
          description: 'Pass ' + (i + 1) + ': Comparing ' + a[j] + ' (index ' + j + ') and ' + a[j + 1] + ' (index ' + (j + 1) + ').'
        });

        if (a[j] > a[j + 1]) {
          // Swap
          var temp = a[j];
          a[j] = a[j + 1];
          a[j + 1] = temp;
          swappedThisPass = true;

          steps.push({
            array: a.slice(),
            comparing: [j, j + 1],
            swapped: true,
            sorted: sorted.slice(),
            codeLine: 7,
            variables: { i: i, j: j },
            description: 'Swapped! ' + a[j] + ' and ' + a[j + 1] + ' were out of order. Array is now [' + a.join(', ') + '].'
          });
        } else {
          steps.push({
            array: a.slice(),
            comparing: [j, j + 1],
            swapped: false,
            sorted: sorted.slice(),
            codeLine: 6,
            variables: { i: i, j: j },
            description: 'No swap needed. ' + a[j] + ' <= ' + a[j + 1] + ', they are already in order.'
          });
        }
      }

      // After each pass, the largest unsorted element bubbles to its correct position
      sorted.push(n - 1 - i);

      steps.push({
        array: a.slice(),
        comparing: [],
        swapped: false,
        sorted: sorted.slice(),
        codeLine: 9,
        variables: { i: i, swapped: swappedThisPass },
        description: 'Pass ' + (i + 1) + ' complete. Element ' + a[n - 1 - i] + ' is now in its sorted position (index ' + (n - 1 - i) + ').'
      });

      // Early exit if no swaps occurred
      if (!swappedThisPass) {
        // Mark all remaining as sorted
        for (var k = 0; k < n; k++) {
          if (sorted.indexOf(k) === -1) {
            sorted.push(k);
          }
        }
        steps.push({
          array: a.slice(),
          comparing: [],
          swapped: false,
          sorted: sorted.slice(),
          codeLine: 10,
          variables: { i: i, swapped: false },
          description: 'No swaps in pass ' + (i + 1) + ' -- the array is already sorted! Early exit optimization triggered.'
        });
        break;
      }
    }

    // If we went through all passes without early exit, mark everything sorted
    if (sorted.length < n) {
      for (var m = 0; m < n; m++) {
        if (sorted.indexOf(m) === -1) {
          sorted.push(m);
        }
      }
      steps.push({
        array: a.slice(),
        comparing: [],
        swapped: false,
        sorted: sorted.slice(),
        codeLine: 11,
        variables: { n: n },
        description: 'Sorting complete! Final sorted array: [' + a.join(', ') + '].'
      });
    }

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
      if (step.sorted && step.sorted.indexOf(j) !== -1) {
        color = colorSorted;
      }
      if (step.comparing && step.comparing.indexOf(j) !== -1) {
        color = step.swapped ? colorSwap : colorCompare;
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

    // Draw comparing indicator arrows
    if (step.comparing && step.comparing.length === 2) {
      var idx0 = step.comparing[0];
      var idx1 = step.comparing[1];
      var cx0 = padding + idx0 * (barWidth + gap) + barWidth / 2;
      var cx1 = padding + idx1 * (barWidth + gap) + barWidth / 2;
      var arrowY = h - padding + 18;

      ctx.strokeStyle = step.swapped ? colorSwap : colorCompare;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx0, arrowY);
      ctx.lineTo(cx1, arrowY);
      ctx.stroke();

      // Small triangles at each end
      var triSize = 5;
      ctx.fillStyle = step.swapped ? colorSwap : colorCompare;
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
   * Load an array into the visualization.
   */
  function loadArray(arr) {
    currentArray = arr.slice();
    var steps = generateSteps(currentArray);
    viz.setSteps(steps);
  }

  /**
   * Initialize the bubble sort visualization.
   */
  function init() {
    var canvas = document.getElementById('bubble-sort-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('bubble-sort', {
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
    var randomizeBtn = document.getElementById('bs-randomize-btn');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', function() {
        var arr = randomArray();
        loadArray(arr);
      });
    }

    // Custom array input
    var customInput = document.getElementById('bs-custom-input');
    var customBtn = document.getElementById('bs-custom-btn');
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

  DSA.bubbleSortViz = { init: init };
})();
