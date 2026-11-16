var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  // ── Step generation: Merge Intervals ──────────────────────────────────
  function generateSteps(intervals) {
    var steps = [];

    // Sort by start time
    var sorted = intervals.slice().sort(function(a, b) { return a[0] - b[0]; });

    steps.push({
      intervals: sorted.slice(),
      merged: [],
      compareA: -1,
      compareB: -1,
      phase: 'init',
      codeLine: 2,
      description: 'Merge Intervals: Sort intervals by start time, then merge overlapping pairs. Input: ' + JSON.stringify(sorted) + '.'
    });

    var merged = [sorted[0].slice()];

    steps.push({
      intervals: sorted.slice(),
      merged: merged.slice().map(function(x) { return x.slice(); }),
      compareA: -1,
      compareB: -1,
      phase: 'start',
      codeLine: 3,
      description: 'Start with the first interval [' + sorted[0] + '] in the result.'
    });

    for (var i = 1; i < sorted.length; i++) {
      var last = merged[merged.length - 1];
      var curr = sorted[i];

      steps.push({
        intervals: sorted.slice(),
        merged: merged.slice().map(function(x) { return x.slice(); }),
        compareA: merged.length - 1,
        compareB: i,
        phase: 'compare',
        codeLine: 6,
        description: 'Compare last merged [' + last + '] with current [' + curr + ']. Do they overlap? ' + (curr[0] <= last[1] ? 'Yes (' + curr[0] + ' ≤ ' + last[1] + ').' : 'No (' + curr[0] + ' > ' + last[1] + ').')
      });

      if (curr[0] <= last[1]) {
        var oldEnd = last[1];
        last[1] = Math.max(last[1], curr[1]);
        steps.push({
          intervals: sorted.slice(),
          merged: merged.slice().map(function(x) { return x.slice(); }),
          compareA: merged.length - 1,
          compareB: i,
          phase: 'merge',
          codeLine: 7,
          description: 'Overlap! Extend last merged interval end from ' + oldEnd + ' to ' + last[1] + '. Result now: ' + JSON.stringify(merged) + '.'
        });
      } else {
        merged.push(curr.slice());
        steps.push({
          intervals: sorted.slice(),
          merged: merged.slice().map(function(x) { return x.slice(); }),
          compareA: merged.length - 2,
          compareB: -1,
          phase: 'add',
          codeLine: 9,
          description: 'No overlap. Add [' + curr + '] to result. Merged so far: ' + JSON.stringify(merged) + '.'
        });
      }
    }

    steps.push({
      intervals: sorted.slice(),
      merged: merged.slice().map(function(x) { return x.slice(); }),
      compareA: -1,
      compareB: -1,
      phase: 'done',
      codeLine: 10,
      description: 'Done! Merged result: ' + JSON.stringify(merged) + ' (' + merged.length + ' interval' + (merged.length > 1 ? 's' : '') + ').'
    });

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
      ctx.fillText('Press Run to visualize Merge Intervals.', w / 2, h / 2);
      return;
    }

    var intervals = step.intervals;
    var merged = step.merged;
    var pad = 60;
    var timelineW = w - pad * 2;

    // Find range
    var maxVal = 0;
    for (var i = 0; i < intervals.length; i++) {
      if (intervals[i][1] > maxVal) maxVal = intervals[i][1];
    }
    if (maxVal < 1) maxVal = 20;
    var scale = timelineW / (maxVal + 1);

    function timeX(t) { return pad + t * scale; }

    // ── Draw timeline axis ──────────────────────────────────────────────
    var axisY = h - 55;
    ctx.strokeStyle = cssVar('--border-color');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, axisY);
    ctx.lineTo(pad + timelineW, axisY);
    ctx.stroke();
    for (var t = 0; t <= maxVal; t++) {
      var tx = timeX(t);
      ctx.strokeStyle = cssVar('--border-color');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, axisY - 4);
      ctx.lineTo(tx, axisY + 4);
      ctx.stroke();
      if (t % 2 === 0 || maxVal <= 10) {
        ctx.fillStyle = cssVar('--text-tertiary');
        ctx.font = '10px ' + cssVar('--font-mono');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(t), tx, axisY + 6);
      }
    }

    var barH = 22;
    var barGap = 6;

    // ── Draw original intervals ──────────────────────────────────────────
    ctx.fillStyle = cssVar('--text-tertiary');
    ctx.font = '11px ' + cssVar('--font-mono');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('INPUT', pad, 20);

    for (var i = 0; i < intervals.length; i++) {
      var iv = intervals[i];
      var bx = timeX(iv[0]);
      var bw = timeX(iv[1]) - bx;
      var by = 30 + i * (barH + barGap);
      var isCompB = (i === step.compareB);
      var fill = isCompB ? (step.phase === 'merge' ? cssVar('--viz-swap') : cssVar('--viz-compare')) : cssVar('--viz-cell-bg');
      var border = isCompB ? cssVar('--viz-active') : cssVar('--border-color');

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(bx, by, Math.max(bw, 14), barH, 4);
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = isCompB ? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = cssVar('--viz-cell-text');
      ctx.font = 'bold 12px ' + cssVar('--font-sans');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('[' + iv[0] + ',' + iv[1] + ']', bx + Math.max(bw, 14) / 2, by + barH / 2);
    }

    // ── Draw merged result ──────────────────────────────────────────────
    if (merged.length > 0) {
      var mergeStartY = axisY - 20 - barH;
      ctx.fillStyle = cssVar('--text-tertiary');
      ctx.font = '11px ' + cssVar('--font-mono');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('MERGED', pad, mergeStartY - 6);

      for (var j = 0; j < merged.length; j++) {
        var mv = merged[j];
        var mx = timeX(mv[0]);
        var mw = timeX(mv[1]) - mx;
        var my = mergeStartY;
        var isLastMerged = (j === merged.length - 1 && step.compareA === j);
        var mergedFill = isLastMerged ? cssVar('--viz-active') : cssVar('--viz-found');

        ctx.fillStyle = mergedFill;
        ctx.beginPath();
        ctx.roundRect(mx, my, Math.max(mw, 14), barH, 4);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px ' + cssVar('--font-sans');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('[' + mv[0] + ',' + mv[1] + ']', mx + Math.max(mw, 14) / 2, my + barH / 2);
      }
    }

    // Legend
    var legY = h - 18;
    var legItems = [
      { color: cssVar('--viz-compare'), label: 'comparing' },
      { color: cssVar('--viz-swap'), label: 'merging' },
      { color: cssVar('--viz-found'), label: 'merged result' }
    ];
    var legSpacing = 130;
    var legStartX = w / 2 - legSpacing;
    for (var li = 0; li < legItems.length; li++) {
      var lx = legStartX + li * legSpacing;
      ctx.fillStyle = legItems[li].color;
      ctx.beginPath();
      ctx.roundRect(lx, legY, 12, 12, 2);
      ctx.fill();
      ctx.fillStyle = cssVar('--text-secondary');
      ctx.font = '11px ' + cssVar('--font-sans');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(legItems[li].label, lx + 16, legY + 6);
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    var canvas = document.getElementById('intervals-canvas');
    if (!canvas) return;

    var explanationEl = document.querySelector('.viz-explanation');
    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('intervals', {
      canvas: canvas,
      tweenDuration: 0,
      onRender: onRender,
      onStepChange: function(step) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        if (explanationEl && step) explanationEl.textContent = step.description;
        else if (explanationEl) explanationEl.textContent = 'Press Run to visualize Merge Intervals.';
      }
    });

    var defaultIntervals = [[1, 3], [2, 6], [8, 10], [15, 18]];
    viz.setSteps([generateSteps(defaultIntervals)[0]]);

    var runBtn = document.getElementById('intervals-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', function() {
        viz.setSteps(generateSteps(defaultIntervals));
      });
    }
    var resetBtn = document.getElementById('intervals-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var s = generateSteps(defaultIntervals);
        viz.setSteps([s[0]]);
      });
    }
  }

  DSA.intervalsViz = { init: init };
})();
