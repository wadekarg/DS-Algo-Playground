var DSA = window.DSA || {};

(function() {
  'use strict';

  var viz = null;
  var buckets = [];      // array of arrays: buckets[i] = [val1, val2, ...]
  var numBuckets = 8;
  var explanationEl = null;

  // Layout constants
  var INDEX_LABEL_W = 36;
  var LEFT_MARGIN = 20;
  var ARROW_LEN = 10;

  // ---------- CSS helpers ----------
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

  // ---------- Rounded rectangle path ----------
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

  // ---------- Hash function ----------
  function hashKey(key) {
    return ((key % numBuckets) + numBuckets) % numBuckets;
  }

  // ---------- Deep clone buckets ----------
  function cloneBuckets(b) {
    var copy = [];
    for (var i = 0; i < b.length; i++) {
      copy.push(b[i].slice());
    }
    return copy;
  }

  // ---------- Create empty bucket array ----------
  function createEmptyBuckets() {
    var b = [];
    for (var i = 0; i < numBuckets; i++) {
      b.push([]);
    }
    return b;
  }

  // ---------- Build a step object ----------
  function makeStep(desc, opts) {
    opts = opts || {};
    return {
      buckets: cloneBuckets(buckets),
      hashCalc: opts.hashCalc || '',
      activeBucket: opts.activeBucket !== undefined ? opts.activeBucket : -1,
      activeItem: opts.activeItem || null,   // { bucket: N, index: N }
      foundItem: opts.foundItem || null,      // { bucket: N, index: N }
      codeLine: opts.codeLine || null,
      variables: opts.variables || {},
      description: desc
    };
  }

  // ---------- Generate Insert Steps ----------
  function generateInsertSteps(value) {
    var steps = [];
    var h = hashKey(value);

    // Step 1: Show current state
    steps.push(makeStep(
      'Current hash table. We will insert value ' + value + '.',
      { codeLine: 7, variables: { key: value } }
    ));

    // Step 2: Show hash calculation
    steps.push(makeStep(
      'Computing hash: ' + value + ' % ' + numBuckets + ' = ' + h + '. The value belongs in bucket ' + h + '.',
      { hashCalc: value + ' % ' + numBuckets + ' = ' + h, activeBucket: h, codeLine: 4, variables: { key: value, idx: h } }
    ));

    // Step 3: Check if bucket already has items (collision info)
    if (buckets[h].length > 0) {
      steps.push(makeStep(
        'Bucket ' + h + ' already contains [' + buckets[h].join(', ') + ']. Collision! We will chain the new value at the end.',
        { hashCalc: value + ' % ' + numBuckets + ' = ' + h, activeBucket: h, codeLine: 8, variables: { idx: h } }
      ));
    } else {
      steps.push(makeStep(
        'Bucket ' + h + ' is empty. We will place ' + value + ' as the first element.',
        { hashCalc: value + ' % ' + numBuckets + ' = ' + h, activeBucket: h, codeLine: 8, variables: { idx: h } }
      ));
    }

    // Step 4: Perform the insertion
    buckets[h].push(value);
    var newIndex = buckets[h].length - 1;
    steps.push(makeStep(
      'Inserted ' + value + ' into bucket ' + h + ' at chain position ' + newIndex + '.',
      {
        hashCalc: value + ' % ' + numBuckets + ' = ' + h,
        activeBucket: h,
        foundItem: { bucket: h, index: newIndex },
        codeLine: 8,
        variables: { idx: h, key: value }
      }
    ));

    // Step 5: Final clean state
    steps.push(makeStep(
      'Insert complete. Value ' + value + ' is now stored in bucket ' + h + '.',
      { codeLine: 8, variables: { idx: h } }
    ));

    return steps;
  }

  // ---------- Generate Search Steps ----------
  function generateSearchSteps(value) {
    var steps = [];
    var h = hashKey(value);

    // Step 1: Show current state
    steps.push(makeStep(
      'Searching for value ' + value + ' in the hash table.',
      { codeLine: 12, variables: { key: value } }
    ));

    // Step 2: Compute hash
    steps.push(makeStep(
      'Computing hash: ' + value + ' % ' + numBuckets + ' = ' + h + '. We look in bucket ' + h + '.',
      { hashCalc: value + ' % ' + numBuckets + ' = ' + h, activeBucket: h, codeLine: 13, variables: { key: value, idx: h } }
    ));

    var chain = buckets[h];

    if (chain.length === 0) {
      // Empty bucket - not found
      steps.push(makeStep(
        'Bucket ' + h + ' is empty. Value ' + value + ' is not in the table.',
        { hashCalc: value + ' % ' + numBuckets + ' = ' + h, activeBucket: h }
      ));
    } else {
      // Scan through chain
      var found = false;
      for (var i = 0; i < chain.length; i++) {
        if (chain[i] === value) {
          // Found it
          steps.push(makeStep(
            'Checking chain position ' + i + ': value = ' + chain[i] + ' --- MATCH!',
            {
              hashCalc: value + ' % ' + numBuckets + ' = ' + h,
              activeBucket: h,
              foundItem: { bucket: h, index: i }
            }
          ));
          steps.push(makeStep(
            'Value ' + value + ' found in bucket ' + h + ' at chain position ' + i + '!',
            {
              activeBucket: h,
              foundItem: { bucket: h, index: i }
            }
          ));
          found = true;
          break;
        } else {
          steps.push(makeStep(
            'Checking chain position ' + i + ': value = ' + chain[i] + ' --- not a match. Continue scanning.',
            {
              hashCalc: value + ' % ' + numBuckets + ' = ' + h,
              activeBucket: h,
              activeItem: { bucket: h, index: i }
            }
          ));
        }
      }

      if (!found) {
        steps.push(makeStep(
          'Reached the end of the chain in bucket ' + h + '. Value ' + value + ' is not in the table.',
          { activeBucket: h }
        ));
      }
    }

    // Final step
    steps.push(makeStep('Search complete.'));
    return steps;
  }

  // ---------- Generate Delete Steps ----------
  function generateDeleteSteps(value) {
    var steps = [];
    var h = hashKey(value);

    // Step 1: Show current state
    steps.push(makeStep(
      'Deleting value ' + value + ' from the hash table.'
    ));

    // Step 2: Compute hash
    steps.push(makeStep(
      'Computing hash: ' + value + ' % ' + numBuckets + ' = ' + h + '. We look in bucket ' + h + '.',
      { hashCalc: value + ' % ' + numBuckets + ' = ' + h, activeBucket: h }
    ));

    var chain = buckets[h];

    if (chain.length === 0) {
      steps.push(makeStep(
        'Bucket ' + h + ' is empty. Value ' + value + ' is not in the table. Nothing to delete.',
        { activeBucket: h }
      ));
    } else {
      var foundIdx = -1;
      for (var i = 0; i < chain.length; i++) {
        if (chain[i] === value) {
          foundIdx = i;
          steps.push(makeStep(
            'Scanning chain position ' + i + ': value = ' + chain[i] + ' --- MATCH! Will remove this element.',
            {
              hashCalc: value + ' % ' + numBuckets + ' = ' + h,
              activeBucket: h,
              activeItem: { bucket: h, index: i }
            }
          ));
          break;
        } else {
          steps.push(makeStep(
            'Scanning chain position ' + i + ': value = ' + chain[i] + ' --- not a match.',
            {
              hashCalc: value + ' % ' + numBuckets + ' = ' + h,
              activeBucket: h,
              activeItem: { bucket: h, index: i }
            }
          ));
        }
      }

      if (foundIdx === -1) {
        steps.push(makeStep(
          'Reached the end of the chain. Value ' + value + ' is not in the table. Nothing to delete.',
          { activeBucket: h }
        ));
      } else {
        // Perform the deletion
        buckets[h].splice(foundIdx, 1);

        if (buckets[h].length > 0) {
          steps.push(makeStep(
            'Removed ' + value + ' from bucket ' + h + '. Remaining chain: [' + buckets[h].join(', ') + '].',
            { activeBucket: h }
          ));
        } else {
          steps.push(makeStep(
            'Removed ' + value + ' from bucket ' + h + '. Bucket is now empty.',
            { activeBucket: h }
          ));
        }
      }
    }

    // Final step
    steps.push(makeStep('Delete operation complete.'));
    return steps;
  }

  // ---------- Render the hash table on canvas ----------
  function onRender(ctx, step, data) {
    var w = data.width;
    var h = data.height;

    var colorDefault = getColor('--viz-default', '#3b82f6');
    var colorActive  = getColor('--viz-active',  '#ef4444');
    var colorFound   = getColor('--viz-found',   '#22c55e');
    var colorCellBg  = getColor('--viz-cell-bg', '#e2e8f0');
    var colorCellText = getColor('--viz-cell-text', '#1e293b');
    var colorArrow   = getColor('--viz-arrow',   '#64748b');
    var colorAccent  = getColor('--accent-primary', '#3b82f6');
    var textPrimary  = getColor('--text-primary', '#1e293b');
    var textTertiary = getColor('--text-tertiary', '#94a3b8');

    ctx.clearRect(0, 0, w, h);

    if (!step || !step.buckets) {
      ctx.fillStyle = textPrimary;
      ctx.font = '15px ' + fontSans();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Use the controls below to perform hash table operations.', w / 2, h / 2);
      return;
    }

    var bkts = step.buckets;
    var hashCalc    = step.hashCalc    || '';
    var activeBucket = step.activeBucket !== undefined ? step.activeBucket : -1;
    var activeItem  = step.activeItem  || null;
    var foundItem   = step.foundItem   || null;

    // ── Compute all layout values from canvas size ──────────────────
    var TOP_MARGIN  = hashCalc ? 38 : 24;
    var LABEL_ROW_H = 18;                          // column-header row
    var availH      = h - TOP_MARGIN - LABEL_ROW_H - 8;
    var ROW_H       = Math.floor(availH / bkts.length);  // total per bucket row
    ROW_H           = Math.max(ROW_H, 28);
    var BUCKET_H    = Math.round(ROW_H * 0.80);
    var BUCKET_W    = Math.min(64, Math.round(w * 0.12));
    var CHAIN_H     = Math.round(BUCKET_H * 0.82);
    var CHAIN_W     = Math.min(56, Math.round(w * 0.10));
    var CHAIN_GAP   = Math.max(6, Math.round(w * 0.015));
    var bucketStartX = LEFT_MARGIN + INDEX_LABEL_W;
    var labelY      = TOP_MARGIN;
    var firstRowY   = TOP_MARGIN + LABEL_ROW_H;

    // ── Hash-calc banner ────────────────────────────────────────────
    if (hashCalc) {
      ctx.fillStyle = colorAccent;
      ctx.font = 'bold 13px ' + fontMono();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('hash(' + hashCalc.split(' % ')[0] + ') = ' + hashCalc, LEFT_MARGIN, 6);
    }

    // ── Column headers ───────────────────────────────────────────────
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 11px ' + fontSans();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Bucket', bucketStartX, labelY);
    ctx.fillText('Chained Values', bucketStartX + BUCKET_W + CHAIN_GAP + ARROW_LEN + 4, labelY);

    // ── Bucket rows ──────────────────────────────────────────────────
    for (var b = 0; b < bkts.length; b++) {
      var rowY   = firstRowY + b * ROW_H;
      var midY   = rowY + BUCKET_H / 2;
      var isActive = (b === activeBucket);

      // Index label
      ctx.fillStyle = isActive ? colorActive : textTertiary;
      ctx.font = 'bold 12px ' + fontMono();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b), bucketStartX - 6, midY);

      // Bucket cell
      ctx.fillStyle = colorCellBg;
      ctx.strokeStyle = isActive ? colorActive : colorDefault;
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      roundRect(ctx, bucketStartX, rowY, BUCKET_W, BUCKET_H, 4);
      ctx.fill();
      ctx.stroke();

      var chain = bkts[b];

      if (chain.length === 0) {
        ctx.fillStyle = textTertiary;
        ctx.font = '10px ' + fontMono();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('∅', bucketStartX + BUCKET_W / 2, midY);
      } else {
        // Count label inside bucket
        ctx.fillStyle = colorCellText;
        ctx.font = '11px ' + fontSans();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(chain.length), bucketStartX + BUCKET_W / 2, midY);

        // Arrow bucket → first chain cell
        var chainStartX = bucketStartX + BUCKET_W + CHAIN_GAP + ARROW_LEN + 4;
        var arrowFromX  = bucketStartX + BUCKET_W;
        var arrowToX    = chainStartX;

        ctx.strokeStyle = colorArrow;
        ctx.fillStyle   = colorArrow;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(arrowFromX + 2, midY);
        ctx.lineTo(arrowToX - 2, midY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arrowToX - 2, midY);
        ctx.lineTo(arrowToX - 8, midY - 4);
        ctx.lineTo(arrowToX - 8, midY + 4);
        ctx.closePath();
        ctx.fill();

        // Chain cells
        for (var c = 0; c < chain.length; c++) {
          var cellX = chainStartX + c * (CHAIN_W + CHAIN_GAP + ARROW_LEN);
          var cellY = rowY + (BUCKET_H - CHAIN_H) / 2;

          // Stop drawing if cell would go off canvas
          if (cellX + CHAIN_W > w - 4) break;

          var cellFill   = colorCellBg;
          var cellBorder = colorDefault;
          var cellTxt    = colorCellText;

          if (foundItem && foundItem.bucket === b && foundItem.index === c) {
            cellFill = colorFound; cellBorder = colorFound; cellTxt = '#fff';
          } else if (activeItem && activeItem.bucket === b && activeItem.index === c) {
            cellFill = colorActive; cellBorder = colorActive; cellTxt = '#fff';
          } else if (isActive) {
            cellBorder = colorActive;
          }

          ctx.fillStyle = cellFill;
          ctx.strokeStyle = cellBorder;
          ctx.lineWidth = 2;
          roundRect(ctx, cellX, cellY, CHAIN_W, CHAIN_H, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = cellTxt;
          ctx.font = 'bold 13px ' + fontSans();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(chain[c]), cellX + CHAIN_W / 2, cellY + CHAIN_H / 2);

          // Arrow or null terminator
          if (c < chain.length - 1) {
            var nfx = cellX + CHAIN_W;
            var ntx = cellX + CHAIN_W + CHAIN_GAP + ARROW_LEN;
            var cay = cellY + CHAIN_H / 2;
            ctx.strokeStyle = colorArrow;
            ctx.fillStyle   = colorArrow;
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            ctx.moveTo(nfx + 2, cay);
            ctx.lineTo(ntx - 2, cay);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ntx - 2, cay);
            ctx.lineTo(ntx - 7, cay - 3);
            ctx.lineTo(ntx - 7, cay + 3);
            ctx.closePath();
            ctx.fill();
          } else if (cellX + CHAIN_W + 28 < w) {
            ctx.fillStyle = textTertiary;
            ctx.font = '10px ' + fontMono();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('null', cellX + CHAIN_W + 6, cellY + CHAIN_H / 2);
          }
        }
      }
    }
  }

  // ---------- Update explanation ----------
  function onStepChange(step, data) {
    if (explanationEl && step && step.description) {
      explanationEl.textContent = step.description;
    } else if (explanationEl && !step) {
      explanationEl.textContent = 'Use the controls below to perform hash table operations.';
    }
  }

  // ---------- Run an operation ----------
  function runOperation(stepsFn) {
    var steps = stepsFn();
    if (viz) {
      viz.setSteps(steps);
    }
  }

  // ---------- Build initial hash table ----------
  function buildInitialTable() {
    buckets = createEmptyBuckets();
    var values = [15, 42, 8, 23, 7, 31, 50, 19];
    for (var i = 0; i < values.length; i++) {
      var h = hashKey(values[i]);
      buckets[h].push(values[i]);
    }
  }

  // ---------- Summarize current table state ----------
  function summarizeTable() {
    var parts = [];
    for (var i = 0; i < buckets.length; i++) {
      if (buckets[i].length > 0) {
        parts.push(i + ':[' + buckets[i].join(', ') + ']');
      }
    }
    return parts.length > 0 ? parts.join(', ') : 'all buckets empty';
  }

  // ---------- Init ----------
  function init() {
    var canvas = document.getElementById('hash-table-canvas');
    if (!canvas) return;

    explanationEl = document.querySelector('.viz-explanation');

    buildInitialTable();

    var traceEl = (DSA.codeTrace && document.querySelector('.code-trace')) ? DSA.codeTrace.init(document.querySelector('.code-trace')) : null;

    viz = DSA.vizCore.create('hash-table', {
      canvas: canvas,
      onRender: onRender,
      onStepChange: function(step, data) {
        if (traceEl && step) DSA.codeTrace.applyStep(traceEl, step);
        onStepChange(step, data);
      }
    });

    // Set initial display step
    var initialSteps = [makeStep(
      'Hash table with ' + numBuckets + ' buckets. Initial values inserted: [15, 42, 8, 23, 7, 31, 50, 19]. Hash function: key % ' + numBuckets + '. Collisions are resolved by chaining.'
    )];
    viz.setSteps(initialSteps);

    // Wire buttons
    var insertBtn = document.getElementById('ht-insert-btn');
    var searchBtn = document.getElementById('ht-search-btn');
    var deleteBtn = document.getElementById('ht-delete-btn');
    var valueInput = document.getElementById('ht-value-input');

    if (insertBtn) {
      insertBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value to insert.';
          return;
        }
        runOperation(function() { return generateInsertSteps(val); });
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value to search for.';
          return;
        }
        runOperation(function() { return generateSearchSteps(val); });
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        var val = parseInt(valueInput ? valueInput.value : '', 10);
        if (isNaN(val)) {
          if (explanationEl) explanationEl.textContent = 'Please enter a valid integer value to delete.';
          return;
        }
        runOperation(function() { return generateDeleteSteps(val); });
      });
    }
  }

  DSA.hashTableViz = { init: init };
})();
