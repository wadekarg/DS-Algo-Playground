var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var stack = [];
  var explanationEl = null;
  var defaultStack = [10, 25, 8, 42];

  // Cell dimensions
  var CELL_W = 80;
  var CELL_H = 40;
  var CELL_GAP = 4;
  var MAX_DISPLAY = 12;

  // ---------- Read CSS variables ----------
  function getColor(varName, fallback) {
    var val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return val || fallback;
  }

  function fontSans() {
    return getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'sans-serif';
  }

  function fontMono() {
    return getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace';
  }

  // ---------- Draw a rounded rectangle ----------
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ---------- Generate steps for Push ----------
  function generatePushSteps(value) {
    var steps = [];
    var s = stack.slice();

    // Step 1: Show current state
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: {},
      codeLine: 5,
      variables: { val: value },
      description: 'Current stack' + (s.length > 0 ? ': [' + s.join(', ') + ']. Top is ' + s[s.length - 1] + '.' : ' is empty.') + ' We will push ' + value + ' onto the stack.'
    });

    // Step 2: New element appears, highlighted as active
    s.push(value);
    var hl2 = {};
    hl2[s.length - 1] = 'active';
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: hl2,
      codeLine: 6,
      variables: { val: value, size: s.length },
      description: 'Pushing ' + value + ' onto the top of the stack.'
    });

    // Step 3: Element is now settled as found (success)
    var hl3 = {};
    hl3[s.length - 1] = 'found';
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: hl3,
      codeLine: 6,
      variables: { val: value, size: s.length },
      description: 'Push complete! ' + value + ' is now the top element. Stack size: ' + s.length + '.'
    });

    // Step 4: Final clean state
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: {},
      codeLine: 6,
      variables: { size: s.length },
      description: 'Stack is now [' + s.join(', ') + ']. Top element: ' + s[s.length - 1] + '.'
    });

    // Commit the change to the actual stack
    stack = s;

    return steps;
  }

  // ---------- Generate steps for Pop ----------
  function generatePopSteps() {
    var steps = [];
    var s = stack.slice();

    if (s.length === 0) {
      steps.push({
        cells: [],
        topIndex: -1,
        highlights: {},
        description: 'Stack Underflow! Cannot pop from an empty stack.'
      });
      return steps;
    }

    var poppedValue = s[s.length - 1];

    // Step 1: Show current state
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: {},
      codeLine: 9,
      variables: { top: poppedValue },
      description: 'Current stack: [' + s.join(', ') + ']. We will pop the top element (' + poppedValue + ').'
    });

    // Step 2: Highlight the top element as active (about to be removed)
    var hl2 = {};
    hl2[s.length - 1] = 'active';
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: hl2,
      codeLine: 10,
      variables: { top: poppedValue },
      description: 'Removing top element: ' + poppedValue + '.'
    });

    // Step 3: Highlight as swap (being removed)
    var hl3 = {};
    hl3[s.length - 1] = 'swap';
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: hl3,
      codeLine: 10,
      variables: { top: poppedValue },
      description: 'Popping ' + poppedValue + ' from the stack...'
    });

    // Step 4: Element removed
    s.pop();
    if (s.length > 0) {
      var hl4 = {};
      hl4[s.length - 1] = 'found';
      steps.push({
        cells: s.slice(),
        topIndex: s.length - 1,
        highlights: hl4,
        description: 'Pop complete! Removed ' + poppedValue + '. New top element: ' + s[s.length - 1] + '. Stack size: ' + s.length + '.'
      });
    } else {
      steps.push({
        cells: [],
        topIndex: -1,
        highlights: {},
        description: 'Pop complete! Removed ' + poppedValue + '. The stack is now empty.'
      });
    }

    // Step 5: Final clean state
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: {},
      description: s.length > 0 ? 'Stack is now [' + s.join(', ') + ']. Top element: ' + s[s.length - 1] + '.' : 'Stack is empty.'
    });

    // Commit the change
    stack = s;

    return steps;
  }

  // ---------- Generate steps for Peek ----------
  function generatePeekSteps() {
    var steps = [];
    var s = stack.slice();

    if (s.length === 0) {
      steps.push({
        cells: [],
        topIndex: -1,
        highlights: {},
        description: 'Stack is empty! Nothing to peek at.'
      });
      return steps;
    }

    var topValue = s[s.length - 1];

    // Step 1: Show current state
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: {},
      codeLine: 13,
      variables: { top: topValue },
      description: 'Current stack: [' + s.join(', ') + ']. We will peek at the top element.'
    });

    // Step 2: Highlight top element
    var hl2 = {};
    hl2[s.length - 1] = 'found';
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: hl2,
      codeLine: 14,
      variables: { top: topValue },
      description: 'Peek: The top element is ' + topValue + '. Peek does not modify the stack.'
    });

    // Step 3: Final state
    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: {},
      codeLine: 14,
      variables: { top: topValue },
      description: 'Peek complete. Stack remains [' + s.join(', ') + '] with ' + s.length + ' elements.'
    });

    return steps;
  }

  // ---------- Generate steps for isEmpty ----------
  function generateIsEmptySteps() {
    var steps = [];
    var s = stack.slice();
    var empty = s.length === 0;

    steps.push({
      cells: s.slice(),
      topIndex: s.length - 1,
      highlights: {},
      description: 'Checking if the stack is empty...'
    });

    if (empty) {
      steps.push({
        cells: [],
        topIndex: -1,
        highlights: {},
        description: 'isEmpty() returns true. The stack has no elements.'
      });
    } else {
      // Highlight all elements briefly
      var hl = {};
      for (var i = 0; i < s.length; i++) {
        hl[i] = 'default';
      }
      steps.push({
        cells: s.slice(),
        topIndex: s.length - 1,
        highlights: hl,
        description: 'isEmpty() returns false. The stack has ' + s.length + ' element' + (s.length > 1 ? 's' : '') + '.'
      });
    }

    return steps;
  }

  // ---------- Render the stack on canvas ----------
  function onRender(ctx, step, data) {
    var w = data.width;
    var h = data.height;

    var colorDefault = getColor('--viz-default', '#3b82f6');
    var colorActive = getColor('--viz-active', '#ef4444');
    var colorFound = getColor('--viz-found', '#22c55e');
    var colorCellBg = getColor('--viz-cell-bg', '#e2e8f0');
    var colorCellText = getColor('--viz-cell-text', '#1e293b');
    var colorSwap = getColor('--viz-swap', '#f97316');
    var textPrimary = getColor('--text-primary', '#1e293b');
    var textTertiary = getColor('--text-tertiary', '#94a3b8');

    ctx.clearRect(0, 0, w, h);

    if (!step || !step.cells) {
      ctx.fillStyle = textPrimary;
      ctx.font = '16px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.fillText('Use the controls below to perform stack operations.', w / 2, h / 2);
      return;
    }

    var cells = step.cells;
    var topIndex = step.topIndex;
    var highlights = step.highlights || {};
    var n = cells.length;

    if (n === 0) {
      // Draw empty stack frame
      var emptyX = w / 2 - CELL_W / 2;
      var emptyY = h / 2 - 30;
      ctx.strokeStyle = textTertiary;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      roundRect(ctx, emptyX, emptyY, CELL_W, CELL_H, 4);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = textTertiary;
      ctx.font = '14px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Empty', emptyX + CELL_W / 2, emptyY + CELL_H / 2);
      return;
    }

    // Calculate stack layout: bottom-aligned vertical column
    var totalStackH = n * CELL_H + (n - 1) * CELL_GAP;
    var padding = 50;
    var bottomY = h - padding;
    var startY = bottomY - totalStackH;

    // Make sure the stack fits, if not shrink vertically
    if (startY < padding) {
      startY = padding;
    }

    var stackX = w / 2 - CELL_W / 2;

    // Draw the stack "container" walls
    var wallPad = 8;
    var wallLeft = stackX - wallPad;
    var wallRight = stackX + CELL_W + wallPad;
    var wallTop = startY - wallPad;
    var wallBottom = bottomY + wallPad;

    ctx.strokeStyle = textTertiary;
    ctx.lineWidth = 2;

    // Left wall
    ctx.beginPath();
    ctx.moveTo(wallLeft, wallTop);
    ctx.lineTo(wallLeft, wallBottom);
    ctx.stroke();

    // Right wall
    ctx.beginPath();
    ctx.moveTo(wallRight, wallTop);
    ctx.lineTo(wallRight, wallBottom);
    ctx.stroke();

    // Bottom wall
    ctx.beginPath();
    ctx.moveTo(wallLeft, wallBottom);
    ctx.lineTo(wallRight, wallBottom);
    ctx.stroke();

    // Draw cells from bottom to top (index 0 is bottom)
    for (var i = 0; i < n; i++) {
      // Cell position: index 0 at bottom, index n-1 at top
      var cellY = bottomY - (i + 1) * CELL_H - i * CELL_GAP;
      var cellX = stackX;

      // Determine cell color
      var fillColor = colorCellBg;
      var borderColor = colorDefault;
      var txtColor = colorCellText;

      if (highlights[i] === 'active') {
        fillColor = colorActive;
        borderColor = colorActive;
        txtColor = '#ffffff';
      } else if (highlights[i] === 'found') {
        fillColor = colorFound;
        borderColor = colorFound;
        txtColor = '#ffffff';
      } else if (highlights[i] === 'swap') {
        fillColor = colorSwap;
        borderColor = colorSwap;
        txtColor = '#ffffff';
      }

      // Draw cell
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      roundRect(ctx, cellX, cellY, CELL_W, CELL_H, 4);
      ctx.fill();
      ctx.stroke();

      // Draw value
      ctx.fillStyle = txtColor;
      ctx.font = 'bold 16px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(cells[i]), cellX + CELL_W / 2, cellY + CELL_H / 2);

      // Draw index label to the left
      ctx.fillStyle = textTertiary;
      ctx.font = '11px ' + fontMono();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i), wallLeft - 8, cellY + CELL_H / 2);
    }

    // Draw "top" pointer arrow pointing to the top element
    if (topIndex >= 0 && topIndex < n) {
      var topCellY = bottomY - (topIndex + 1) * CELL_H - topIndex * CELL_GAP;
      var arrowX = wallRight + 15;
      var arrowEndX = arrowX + 35;
      var arrowY = topCellY + CELL_H / 2;

      ctx.strokeStyle = colorActive;
      ctx.fillStyle = colorActive;
      ctx.lineWidth = 2.5;

      // Draw arrow line pointing to the cell
      ctx.beginPath();
      ctx.moveTo(arrowEndX, arrowY);
      ctx.lineTo(arrowX, arrowY);
      ctx.stroke();

      // Arrowhead pointing left (toward the cell)
      var headSize = 7;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + headSize, arrowY - headSize);
      ctx.lineTo(arrowX + headSize, arrowY + headSize);
      ctx.closePath();
      ctx.fill();

      // "top" label
      ctx.font = 'bold 13px ' + fontSans();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('top', arrowEndX + 5, arrowY);
    }

    // Draw "bottom" label at the bottom
    ctx.fillStyle = textTertiary;
    ctx.font = '11px ' + fontSans();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('bottom', stackX + CELL_W / 2, wallBottom + 6);
  }

  // ---------- Update explanation ----------
  function onStepChange(step, data) {
    if (explanationEl && step && step.description) {
      explanationEl.textContent = step.description;
    } else if (explanationEl && !step) {
      explanationEl.textContent = 'Use the controls below to perform stack operations.';
    }
  }

  // ---------- Run an operation ----------
  function runOperation(stepsFn) {
    var steps = stepsFn();
    if (viz) {
      viz.setSteps(steps);
    }
  }

  // ---------- Init ----------
  function init() {
    var canvas = document.getElementById('stack-canvas');
    if (!canvas) return;

    explanationEl = document.querySelector('.viz-explanation');

    // Initialize with default stack
    stack = defaultStack.slice();

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('stack', {
      canvas: canvas,
      onRender: onRender,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Set initial display step
    var initialSteps = [{
      cells: stack.slice(),
      topIndex: stack.length - 1,
      highlights: {},
      description: 'Stack initialized with [' + stack.join(', ') + ']. Top element: ' + stack[stack.length - 1] + '. Use the buttons below to perform operations.'
    }];
    viz.setSteps(initialSteps);

    // Wire buttons
    var pushBtn = document.getElementById('stack-push-btn');
    var popBtn = document.getElementById('stack-pop-btn');
    var peekBtn = document.getElementById('stack-peek-btn');
    var isEmptyBtn = document.getElementById('stack-isempty-btn');
    var valueInput = document.getElementById('stack-value-input');

    if (pushBtn) {
      pushBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value to push.';
          return;
        }
        if (stack.length >= MAX_DISPLAY) {
          if (explanationEl) explanationEl.textContent = 'Stack is full (max ' + MAX_DISPLAY + ' elements for display purposes).';
          return;
        }
        runOperation(function() { return generatePushSteps(val); });
      });
    }

    if (popBtn) {
      popBtn.addEventListener('click', function() {
        runOperation(function() { return generatePopSteps(); });
      });
    }

    if (peekBtn) {
      peekBtn.addEventListener('click', function() {
        runOperation(function() { return generatePeekSteps(); });
      });
    }

    if (isEmptyBtn) {
      isEmptyBtn.addEventListener('click', function() {
        runOperation(function() { return generateIsEmptySteps(); });
      });
    }
  }

  DSA.stackViz = { init: init };
})();
