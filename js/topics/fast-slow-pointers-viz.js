/* fast-slow-pointers-viz.js — Animates Floyd's cycle detection
 * on a linked list. */

const FastSlowViz = (() => {
  const NODE_R = 22;
  const SPACING = 60;

  // Linked list: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> back to 2
  // Indices 0..5 are nodes; cycle target is the node at index 2.
  const NODES = 6;
  const CYCLE_TARGET = 2;

  function nodePos(i, cx, cy) {
    // First N nodes lay out horizontally; the cycle wraps the last node back to index 2 visually using a curved arrow drawn separately.
    return { x: 40 + i * SPACING, y: cy };
  }

  function nextIdx(i) {
    if (i === NODES - 1) return CYCLE_TARGET;
    return i + 1;
  }

  function buildSteps() {
    const steps = [];
    let slow = 0, fast = 0;
    steps.push({ slow, fast, label: 'Both pointers start at head.' });
    let iter = 0;
    while (true) {
      slow = nextIdx(slow);
      fast = nextIdx(nextIdx(fast));
      iter++;
      steps.push({
        slow, fast,
        label: `Iter ${iter}: slow=${slow}, fast=${fast}` + (slow === fast ? ' — MEET! Cycle detected.' : '')
      });
      if (slow === fast) break;
      if (iter > 30) break;  // safety
    }
    return steps;
  }

  function render(ctx, step, c) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const cy = ctx.canvas.height / 2;

    // Draw arrows between nodes
    ctx.strokeStyle = c.cellBorder;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < NODES; i++) {
      const p = nodePos(i, 0, cy);
      const nxt = nextIdx(i);
      const np = nodePos(nxt, 0, cy);
      if (i === NODES - 1) {
        // Curved cycle-back arrow
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + NODE_R);
        ctx.bezierCurveTo(p.x, p.y + 80, np.x, np.y + 80, np.x, np.y + NODE_R);
        ctx.stroke();
      } else {
        // Straight arrow
        ctx.beginPath();
        ctx.moveTo(p.x + NODE_R, p.y);
        ctx.lineTo(np.x - NODE_R, np.y);
        ctx.stroke();
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(np.x - NODE_R, np.y);
        ctx.lineTo(np.x - NODE_R - 6, np.y - 4);
        ctx.lineTo(np.x - NODE_R - 6, np.y + 4);
        ctx.fill();
      }
    }

    // Draw nodes
    for (let i = 0; i < NODES; i++) {
      const p = nodePos(i, 0, cy);
      const isSlow = step.slow === i;
      const isFast = step.fast === i;
      const isBoth = isSlow && isFast;

      ctx.beginPath();
      ctx.arc(p.x, p.y, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle = isBoth ? '#16a34a' : (isFast ? '#3b82f6' : (isSlow ? '#dc2626' : c.cell));
      ctx.fill();
      ctx.strokeStyle = c.cellBorder;
      ctx.stroke();

      ctx.fillStyle = (isSlow || isFast) ? 'white' : c.text;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i, p.x, p.y + 5);
    }

    // Legend
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#dc2626';
    ctx.fillText('● slow (1 step)', 20, 20);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('● fast (2 steps)', 130, 20);
    ctx.fillStyle = '#16a34a';
    ctx.fillText('● both (cycle found)', 250, 20);

    // Step label
    ctx.fillStyle = c.text;
    ctx.font = '13px sans-serif';
    ctx.fillText(step.label, 20, ctx.canvas.height - 20);
  }

  function colors() {
    const cs = getComputedStyle(document.body);
    return {
      cell: cs.getPropertyValue('--surface') || '#f8fafc',
      cellBorder: cs.getPropertyValue('--border') || '#cbd5e1',
      text: cs.getPropertyValue('--text-primary') || '#0f172a'
    };
  }

  function attach(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let steps = buildSteps();
    let idx = 0;
    const draw = () => render(ctx, steps[idx], colors());
    draw();
    const wireBtn = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', fn);
    };
    wireBtn('prev-step', () => { idx = Math.max(0, idx - 1); draw(); });
    wireBtn('next-step', () => { idx = Math.min(steps.length - 1, idx + 1); draw(); });
    wireBtn('reset',     () => { idx = 0; draw(); });
  }

  return { attach };
})();
