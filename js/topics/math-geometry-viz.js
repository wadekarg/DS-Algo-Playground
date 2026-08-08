var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var CELL = 60;
  var GAP = 4;

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  // ── Step generation: Rotate Matrix 90° Clockwise ──────────────────────
  function generateSteps() {
    var steps = [];
    // 3x3 matrix
    var mat = [[1,2,3],[4,5,6],[7,8,9]];

    function clone(m) { return m.map(function(r) { return r.slice(); }); }

    var highlight = [];
    function noHL() { return []; }

    function snap(m, hl, phase, desc, codeLine) {
      steps.push({ matrix: clone(m), highlight: hl || [], phase: phase, description: desc, codeLine: codeLine || 1 });
    }

    snap(mat, noHL(), 'original', 'Original 3×3 matrix. Goal: rotate it 90° clockwise in-place. Method: (1) transpose, then (2) reverse each row.', 1);

    // Transpose: swap mat[i][j] with mat[j][i] for i < j
    snap(mat, noHL(), 'transpose_start', 'Step 1 — Transpose: swap mat[i][j] with mat[j][i] for all i < j. This mirrors the matrix across the main diagonal.', 3);

    var swaps = [[0,1],[0,2],[1,2]];
    for (var s = 0; s < swaps.length; s++) {
      var r = swaps[s][0], c = swaps[s][1];
      snap(mat, [[r,c],[c,r]], 'swapping', 'Swap mat[' + r + '][' + c + '] (' + mat[r][c] + ') ↔ mat[' + c + '][' + r + '] (' + mat[c][r] + ').', 4);
      var tmp = mat[r][c];
      mat[r][c] = mat[c][r];
      mat[c][r] = tmp;
      snap(mat, [[r,c],[c,r]], 'swapped', 'After swap: mat[' + r + '][' + c + ']=' + mat[r][c] + ', mat[' + c + '][' + r + ']=' + mat[c][r] + '.', 4);
    }

    snap(mat, noHL(), 'transposed', 'Transpose complete. Matrix is now: ' + JSON.stringify(mat) + '. Next: reverse each row.', 5);

    // Reverse each row
    for (var row = 0; row < 3; row++) {
      snap(mat, mat[row].map(function(_, ci) { return [row, ci]; }), 'reversing', 'Reversing row ' + row + ': [' + mat[row] + '] → [' + mat[row].slice().reverse() + '].', 6);
      mat[row].reverse();
      snap(mat, mat[row].map(function(_, ci) { return [row, ci]; }), 'reversed', 'Row ' + row + ' reversed: [' + mat[row] + '].', 6);
    }

    snap(mat, noHL(), 'done', 'Done! Matrix rotated 90° clockwise. Final result: ' + JSON.stringify(mat) + '.', 7);

    return steps;
  }

  // ── Render ─────────────────────────────────────────────────────────────
  function onRender(ctx, step, meta) {
    var w = meta.width;
    var h = meta.height;
    ctx.clearRect(0, 0, w, h);

    if (!step) {
      ctx.fillStyle = cssVar('--text-tertiary');
      ctx.font = '14px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press Run to visualize matrix rotation.', w / 2, h / 2);
      return;
    }

    var mat = step.matrix;
    var n = mat.length;
    var gridW = n * CELL + (n - 1) * GAP;
    var gridH = n * CELL + (n - 1) * GAP;
    var startX = (w - gridW) / 2;
    var startY = (h - gridH) / 2 - 20;

    // Phase label
    var phaseLabels = {
      original: 'Original',
      transpose_start: 'Transpose (step 1)',
      swapping: 'Swapping...',
      swapped: 'Swapped',
      transposed: 'Transposed',
      reversing: 'Reversing row...',
      reversed: 'Row reversed',
      done: 'Result (90° clockwise)'
    };
    ctx.fillStyle = cssVar('--text-secondary');
    ctx.font = 'bold 14px ' + cssVar('--font-sans');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(phaseLabels[step.phase] || '', w / 2, startY - 16);

    // Build highlight set for O(1) lookup
    var hlSet = {};
    for (var hi = 0; hi < step.highlight.length; hi++) {
      var cell = step.highlight[hi];
      hlSet[cell[0] + ',' + cell[1]] = true;
    }

    // Draw matrix cells
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var x = startX + c * (CELL + GAP);
        var y = startY + r * (CELL + GAP);
        var key = r + ',' + c;
        var isHL = hlSet[key];

        var fill = isHL
          ? (step.phase === 'swapping' ? cssVar('--viz-swap') : cssVar('--viz-active'))
          : cssVar('--viz-cell-bg');
        var text = isHL ? '#fff' : cssVar('--viz-cell-text');

        if (step.phase === 'done') { fill = cssVar('--viz-found'); text = '#fff'; }

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, CELL, CELL, 6);
        ctx.fill();

        if (isHL) {
          ctx.strokeStyle = cssVar('--viz-active');
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = text;
        ctx.font = 'bold 20px ' + cssVar('--font-sans');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(mat[r][c]), x + CELL / 2, y + CELL / 2);
      }
    }

    // Row/col index guides
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '10px ' + cssVar('--font-mono');
    ctx.textAlign = 'center';
    for (var ci = 0; ci < n; ci++) {
      ctx.fillText('[,'+ci+']', startX + ci * (CELL + GAP) + CELL / 2, startY - 6);
    }
    ctx.textAlign = 'right';
    for (var ri = 0; ri < n; ri++) {
      ctx.fillText('['+ri+',]', startX - 6, startY + ri * (CELL + GAP) + CELL / 2 + 4);
    }

    // Step indicator
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '11px ' + cssVar('--font-sans');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Step: ' + (meta.step + 1) + ' / ' + meta.totalSteps, w / 2, startY + gridH + 12);
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('math-geometry-canvas');
    if (!canvas) return;

    var explanationEl = document.querySelector('.viz-explanation');
    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('math-geometry', {
      canvas: canvas,
      tweenDuration: 0,
      onRender: onRender,
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step) explanationEl.textContent = step.description;
        else if (explanationEl) explanationEl.textContent = 'Press Run to visualize matrix rotation.';
      }
    });

    var steps = generateSteps();
    viz.setSteps([steps[0]]);

    var runBtn = document.getElementById('math-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', function() {
        viz.setSteps(generateSteps());
      });
    }
    var resetBtn = document.getElementById('math-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var s = generateSteps();
        viz.setSteps([s[0]]);
      });
    }
  }

  DSA.mathGeometryViz = { init: init };
})();
