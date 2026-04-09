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
    return getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'sans-serif';
  }

  /**
   * Pre-compute ALL steps for the entire insertion sort.
   * Each step: {
   *   array: [...],
   *   key: { value, fromIndex } or null,
   *   shifting: index or null,
   *   sorted: [indices],
   *   insertAt: index or null,
   *   description: "..."
   * }
   */
  function generateSteps(arr) {
    var steps = [];
    var a = arr.slice();
    var n = a.length;

    // Initial state: index 0 is trivially sorted
    steps.push({
      array: a.slice(),
      key: null,
      shifting: null,
      sorted: [0],
      insertAt: null,
      codeLine: 1,
      variables: { n: n },
      description: 'Initial array: [' + a.join(', ') + ']. The first element (' + a[0] + ') is considered sorted. Insertion sort will pick each remaining element and insert it into the correct position within the sorted portion.'
    });

    for (var i = 1; i < n; i++) {
      var keyValue = a[i];
      var sortedSoFar = [];
      for (var s = 0; s < i; s++) {
        sortedSoFar.push(s);
      }

      // Step: extract key
      steps.push({
        array: a.slice(),
        key: { value: keyValue, fromIndex: i },
        shifting: null,
        sorted: sortedSoFar.slice(),
        insertAt: null,
        codeLine: 2,
        variables: { i: i, key: keyValue },
        description: 'Pass ' + i + ': Extract key = ' + keyValue + ' from index ' + i + '. We will find the correct position in the sorted portion [0..' + (i - 1) + '] to insert it.'
      });

      // Compare and shift elements
      var j = i - 1;
      var shifted = false;
      while (j >= 0 && a[j] > keyValue) {
        // Step: show the element that is shifting right
        a[j + 1] = a[j];
        steps.push({
          array: a.slice(),
          key: { value: keyValue, fromIndex: i },
          shifting: j,
          sorted: sortedSoFar.slice(),
          insertAt: null,
          codeLine: 5,
          variables: { i: i, j: j, key: keyValue },
          description: 'Shift ' + a[j] + ' (index ' + j + ') one position right to index ' + (j + 1) + '. It is greater than key ' + keyValue + '.'
        });
        shifted = true;
        j--;
      }

      if (!shifted) {
        // No shifting needed -- key is already in correct position
        steps.push({
          array: a.slice(),
          key: { value: keyValue, fromIndex: i },
          shifting: null,
          sorted: sortedSoFar.slice(),
          insertAt: i,
          codeLine: 4,
          variables: { i: i, j: j, key: keyValue },
          description: 'No shift needed. Key ' + keyValue + ' is already greater than or equal to element at index ' + (i - 1) + '. It stays at index ' + i + '.'
        });
      }

      // Step: insert key at position j+1
      var insertPos = j + 1;
      a[insertPos] = keyValue;

      var newSorted = [];
      for (var k = 0; k <= i; k++) {
        newSorted.push(k);
      }

      steps.push({
        array: a.slice(),
        key: { value: keyValue, fromIndex: i },
        shifting: null,
        sorted: newSorted.slice(),
        insertAt: insertPos,
        codeLine: 6,
        variables: { i: i, j: insertPos, key: keyValue },
        description: 'Insert key ' + keyValue + ' at index ' + insertPos + '. Sorted portion is now [' + a.slice(0, i + 1).join(', ') + '].'
      });

      // Step: pass done
      steps.push({
        array: a.slice(),
        key: null,
        shifting: null,
        sorted: newSorted.slice(),
        insertAt: null,
        codeLine: 7,
        variables: { i: i },
        description: 'Pass ' + i + ' complete. Elements at indices [0..' + i + '] are sorted: [' + a.slice(0, i + 1).join(', ') + '].'
      });
    }

    // Final sorted state
    var allSorted = [];
    for (var m = 0; m < n; m++) {
      allSorted.push(m);
    }
    steps.push({
      array: a.slice(),
      key: null,
      shifting: null,
      sorted: allSorted,
      insertAt: null,
      codeLine: 7,
      variables: { n: n },
      description: 'Sorting complete! Final sorted array: [' + a.join(', ') + '].'
    });

    return steps;
  }

  /**
   * Render the bar chart on canvas.
   * Key element is shown floating above its destination slot.
   */
  function renderBars(ctx, step, data) {
    var w = data.width;
    var h = data.height;
    var colorDefault = getColor('--viz-default', '#3b82f6');
    var colorCompare = getColor('--viz-compare', '#f59e0b');
    var colorSorted = getColor('--viz-sorted', '#22c55e');
    var colorKey = getColor('--accent-secondary', '#8b5cf6');
    var textColor = getColor('--text-primary', '#1e293b');

    ctx.clearRect(0, 0, w, h);

    if (!step) {
      // No step data, draw placeholder
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
    var topReserve = 50; // space above bars for floating key
    var barAreaWidth = w - padding * 2;
    var barAreaHeight = h - padding * 2 - 20 - topReserve;
    var gap = Math.max(4, barAreaWidth * 0.03);
    var barWidth = (barAreaWidth - gap * (n - 1)) / n;
    var barBottom = h - padding;

    for (var j = 0; j < n; j++) {
      var barHeight = (arr[j] / maxVal) * barAreaHeight;
      var x = padding + j * (barWidth + gap);
      var y = barBottom - barHeight;

      // Determine bar color
      var color = colorDefault;

      // Sorted portion in green
      if (step.sorted && step.sorted.indexOf(j) !== -1) {
        color = colorSorted;
      }

      // Element currently shifting right gets yellow
      if (step.shifting !== null && step.shifting !== undefined && j === step.shifting + 1) {
        color = colorCompare;
      }

      // Insert-at position highlighted with purple
      if (step.insertAt !== null && step.insertAt !== undefined && j === step.insertAt && step.key) {
        color = colorKey;
      }

      // If this bar is the key's original position and key is extracted (floating above),
      // show it as key color when it is the extracted element
      var isKeyFloating = step.key && step.shifting === null && step.insertAt === null;
      if (isKeyFloating && j === step.key.fromIndex) {
        color = colorKey;
      }

      // Draw bar with rounded top
      var radius = Math.min(barWidth / 4, 6);
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.lineTo(x, barBottom);
      ctx.lineTo(x + barWidth, barBottom);
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
      ctx.fillText(String(j), x + barWidth / 2, barBottom + 4);
    }

    // Draw the floating key element above the bars when key is extracted
    if (step.key) {
      var keyVal = step.key.value;
      var keyBarHeight = (keyVal / maxVal) * barAreaHeight;

      // Determine horizontal position for the floating key
      var floatIndex;
      if (step.insertAt !== null && step.insertAt !== undefined) {
        floatIndex = step.insertAt;
      } else if (step.shifting !== null && step.shifting !== undefined) {
        floatIndex = step.shifting;
      } else {
        floatIndex = step.key.fromIndex;
      }

      var floatX = padding + floatIndex * (barWidth + gap);
      var floatY = padding + topReserve - keyBarHeight - 8;
      if (floatY < 8) floatY = 8;
      var floatBarTop = padding + topReserve - keyBarHeight - 8;
      if (floatBarTop < 8) floatBarTop = 8;

      // Draw floating key bar
      var floatRadius = Math.min(barWidth / 4, 6);
      ctx.beginPath();
      ctx.moveTo(floatX, floatBarTop + floatRadius);
      ctx.lineTo(floatX, floatBarTop + keyBarHeight);
      ctx.lineTo(floatX + barWidth, floatBarTop + keyBarHeight);
      ctx.lineTo(floatX + barWidth, floatBarTop + floatRadius);
      ctx.quadraticCurveTo(floatX + barWidth, floatBarTop, floatX + barWidth - floatRadius, floatBarTop);
      ctx.lineTo(floatX + floatRadius, floatBarTop);
      ctx.quadraticCurveTo(floatX, floatBarTop, floatX, floatBarTop + floatRadius);
      ctx.closePath();

      ctx.fillStyle = colorKey;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Key value label
      ctx.fillStyle = textColor;
      ctx.font = 'bold 13px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(keyVal), floatX + barWidth / 2, floatBarTop - 2);

      // "key" label
      ctx.fillStyle = colorKey;
      ctx.font = 'bold 11px ' + fontSans();
      ctx.textBaseline = 'bottom';
      ctx.fillText('key', floatX + barWidth / 2, floatBarTop - 14);

      // Draw a dashed line from the floating key down to the bar area
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = colorKey;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(floatX + barWidth / 2, floatBarTop + keyBarHeight + 2);
      ctx.lineTo(floatX + barWidth / 2, padding + topReserve);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw shift arrow indicator when shifting
    if (step.shifting !== null && step.shifting !== undefined) {
      var shiftFrom = step.shifting;
      var shiftTo = shiftFrom + 1;
      var cx0 = padding + shiftFrom * (barWidth + gap) + barWidth / 2;
      var cx1 = padding + shiftTo * (barWidth + gap) + barWidth / 2;
      var arrowY = barBottom + 18;

      ctx.strokeStyle = colorCompare;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx0, arrowY);
      ctx.lineTo(cx1, arrowY);
      ctx.stroke();

      // Triangle at the right end
      var triSize = 5;
      ctx.fillStyle = colorCompare;
      ctx.beginPath();
      ctx.moveTo(cx1, arrowY - triSize);
      ctx.lineTo(cx1, arrowY + triSize);
      ctx.lineTo(cx1 + triSize, arrowY);
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
   * Parse a comma-separated string into an integer array.
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
   * Load an array into the visualization.
   */
  function loadArray(arr) {
    if (arr.length < 2) return;
    currentArray = arr.slice();
    var steps = generateSteps(currentArray);
    viz.setSteps(steps);
  }

  /**
   * Initialize the insertion sort visualization.
   */
  function init() {
    var canvas = document.getElementById('insertion-sort-canvas');
    if (!canvas) return;

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('insertion-sort', {
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
    var randomizeBtn = document.getElementById('is-randomize-btn');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', function() {
        var arr = randomArray();
        var input = document.getElementById('is-array-input');
        if (input) input.value = arr.join(', ');
        loadArray(arr);
      });
    }

    // Wire load button
    var loadBtn = document.getElementById('is-load-btn');
    if (loadBtn) {
      loadBtn.addEventListener('click', function() {
        var input = document.getElementById('is-array-input');
        if (!input) return;
        var arr = parseIntArray(input.value);
        if (arr.length >= 2) {
          loadArray(arr);
        }
      });
    }

    // Allow Enter key in input to trigger load
    var arrayInput = document.getElementById('is-array-input');
    if (arrayInput) {
      arrayInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var arr = parseIntArray(arrayInput.value);
          if (arr.length >= 2) {
            loadArray(arr);
          }
        }
      });
    }

    // Custom array input
    var customInput = document.getElementById('is-custom-input');
    var customBtn = document.getElementById('is-custom-btn');
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

  DSA.insertionSortViz = { init: init };
})();
