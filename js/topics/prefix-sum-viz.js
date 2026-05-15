/* prefix-sum-viz.js — Visualizes prefix sum construction and range-query lookup.
 * Pattern follows arrays-viz.js / visualization-core.js conventions. */

const PrefixSumViz = (() => {
  // Theme-aware colors
  const colors = () => {
    const cs = getComputedStyle(document.body);
    return {
      cell:       cs.getPropertyValue('--surface') || '#f8fafc',
      cellBorder: cs.getPropertyValue('--border') || '#cbd5e1',
      text:       cs.getPropertyValue('--text-primary') || '#0f172a',
      accent:     cs.getPropertyValue('--accent-primary') || '#6366f1',
      highlight:  '#fef3c7',
      result:     '#dcfce7'
    };
  };

  // Build steps for: given nums = [3, 1, 4, 1, 5, 9, 2, 6], compute prefix
  // sums, then answer range query nums[2..5].
  function buildSteps(nums, queryL, queryR) {
    const steps = [];
    const prefix = [0];
    steps.push({
      label: 'Start with prefix[0] = 0 (sum of empty prefix)',
      nums, prefix: [...prefix], cursor: -1, query: null
    });
    for (let i = 0; i < nums.length; i++) {
      prefix.push(prefix[i] + nums[i]);
      steps.push({
        label: `prefix[${i+1}] = prefix[${i}] + nums[${i}] = ${prefix[i]} + ${nums[i]} = ${prefix[i+1]}`,
        nums, prefix: [...prefix], cursor: i, query: null
      });
    }
    steps.push({
      label: 'Prefix array complete. Now query the sum of nums[' + queryL + '..' + queryR + ']...',
      nums, prefix: [...prefix], cursor: -1, query: { l: queryL, r: queryR, stage: 'announce' }
    });
    const ans = prefix[queryR + 1] - prefix[queryL];
    steps.push({
      label: `Range sum = prefix[${queryR+1}] - prefix[${queryL}] = ${prefix[queryR+1]} - ${prefix[queryL]} = ${ans}`,
      nums, prefix: [...prefix], cursor: -1, query: { l: queryL, r: queryR, stage: 'answer', ans }
    });
    return steps;
  }

  function render(ctx, step, c) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const cellW = 40;
    const cellH = 36;
    const padX = 20;
    const yA = 30;
    const yB = 90;

    // Label A: nums[]
    ctx.fillStyle = c.text;
    ctx.font = '12px sans-serif';
    ctx.fillText('nums', padX - 12, yA + cellH / 2 + 4);

    // Render nums row
    for (let i = 0; i < step.nums.length; i++) {
      const x = padX + i * cellW;
      const isHL = step.cursor === i || (step.query && i >= step.query.l && i <= step.query.r);
      ctx.fillStyle = isHL ? c.highlight : c.cell;
      ctx.strokeStyle = isHL ? c.accent : c.cellBorder;
      ctx.lineWidth = isHL ? 2 : 1;
      ctx.fillRect(x, yA, cellW - 2, cellH);
      ctx.strokeRect(x, yA, cellW - 2, cellH);
      ctx.fillStyle = c.text;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(step.nums[i], x + cellW / 2, yA + cellH / 2 + 5);
      ctx.fillStyle = c.text;
      ctx.font = '10px sans-serif';
      ctx.fillText(`[${i}]`, x + cellW / 2, yA - 4);
    }

    // Label B: prefix[]
    ctx.textAlign = 'left';
    ctx.fillStyle = c.text;
    ctx.font = '12px sans-serif';
    ctx.fillText('prefix', padX - 16, yB + cellH / 2 + 4);

    // Render prefix row
    for (let i = 0; i < step.prefix.length; i++) {
      const x = padX + i * cellW;
      const isCursor = step.cursor === i - 1;
      const isQ = step.query && (i === step.query.l || i === step.query.r + 1);
      ctx.fillStyle = isCursor ? c.highlight : (isQ ? c.result : c.cell);
      ctx.strokeStyle = isCursor || isQ ? c.accent : c.cellBorder;
      ctx.lineWidth = isCursor || isQ ? 2 : 1;
      ctx.fillRect(x, yB, cellW - 2, cellH);
      ctx.strokeRect(x, yB, cellW - 2, cellH);
      ctx.fillStyle = c.text;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(step.prefix[i], x + cellW / 2, yB + cellH / 2 + 5);
      ctx.fillStyle = c.text;
      ctx.font = '10px sans-serif';
      ctx.fillText(`[${i}]`, x + cellW / 2, yB - 4);
    }

    // Step label
    ctx.fillStyle = c.text;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(step.label, padX, yB + cellH + 30);
  }

  function attach(canvasId, defaultNums, defaultL, defaultR) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let steps = buildSteps(defaultNums, defaultL, defaultR);
    let idx = 0;
    const c = colors();

    const draw = () => render(ctx, steps[idx], colors());
    draw();

    // Wire up basic controls (find by id, gracefully ignore if absent)
    const wireBtn = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', fn);
    };
    wireBtn('prev-step', () => { idx = Math.max(0, idx - 1); draw(); });
    wireBtn('next-step', () => { idx = Math.min(steps.length - 1, idx + 1); draw(); });
    wireBtn('reset',     () => { idx = 0; draw(); });
  }

  return { attach, buildSteps };
})();
