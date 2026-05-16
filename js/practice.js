var DSA = window.DSA || {};

(function() {
  'use strict';

  // CodeMirror + Pyodide loaders live in js/cdn-loader.js (DSA.cdnLoader.*)
  // so practice.js and code-runner.js share the same singletons.
  function loadCodeMirror(cb) { DSA.cdnLoader.loadCodeMirror(cb); }
  function loadPyodide(cb)    { DSA.cdnLoader.loadPyodide(cb); }

  // --- Failure banner: prepend a dismissible warning above the practice block
  //     so users on locked-down networks see an actionable hint. ---
  function showBanner(block, kind, message) {
    if (block.querySelector('.practice-block__banner[data-banner="' + kind + '"]')) return;
    var banner = document.createElement('div');
    banner.className = 'practice-block__banner';
    banner.setAttribute('data-banner', kind);
    banner.setAttribute('role', 'alert');
    var msg = document.createElement('span');
    msg.textContent = message;
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'practice-block__banner-close';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '×';
    close.addEventListener('click', function() { banner.remove(); });
    banner.appendChild(msg);
    banner.appendChild(close);
    block.insertBefore(banner, block.firstChild);
  }

  // --- Python repr helper for JS values ---
  function pyRepr(val) {
    if (val === null || val === undefined) return 'None';
    if (typeof val === 'boolean') return val ? 'True' : 'False';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') return JSON.stringify(val);
    if (Array.isArray(val)) {
      return '[' + val.map(pyRepr).join(', ') + ']';
    }
    if (typeof val === 'object') {
      var pairs = [];
      for (var k in val) {
        if (Object.prototype.hasOwnProperty.call(val, k)) {
          pairs.push(pyRepr(k) + ': ' + pyRepr(val[k]));
        }
      }
      return '{' + pairs.join(', ') + '}';
    }
    return JSON.stringify(val);
  }

  // --- Run one test case against Pyodide ---
  function runTest(py, userCode, fnName, args, callback) {
    var argsRepr = args.map(pyRepr).join(', ');
    var testCode =
      'import sys\n' +
      'from io import StringIO\n' +
      '_out = StringIO()\n' +
      'sys.stdout = _out\n' +
      'sys.stderr = _out\n' +
      userCode + '\n' +
      'print(repr(' + fnName + '(' + argsRepr + ')))\n' +
      'sys.stdout = sys.__stdout__\n' +
      'sys.stderr = sys.__stderr__\n';

    var output = '';
    var error = null;
    try {
      py.runPython(testCode);
      try {
        output = py.runPython('_out.getvalue()');
      } catch(e) {}
    } catch(e) {
      error = String(e);
      try { py.runPython('sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__'); } catch(ignored) {}
    }

    callback(error, output ? output.trim() : '');
  }

  // --- Build the practice panel DOM and wire it up ---
  function attachBlock(el) {
    var title      = el.getAttribute('data-title') || 'Practice Problem';
    var difficulty = (el.getAttribute('data-difficulty') || 'easy').toLowerCase();
    var fnName     = el.getAttribute('data-fn') || 'solution';
    var starter    = el.getAttribute('data-starter') || ('def ' + fnName + '():\n    pass');
    var testsRaw   = el.getAttribute('data-tests') || '[]';
    var tests      = [];
    try { tests = JSON.parse(testsRaw); } catch(e) { tests = []; }

    // Optional draft autosave (used on per-problem pages). When data-problem-id
    // is present we save/restore the editor's content under
    // dsa-draft-code:<problemId> so refreshing or revisiting preserves work.
    var draftId = el.getAttribute('data-problem-id') || '';
    var draftKey = draftId ? 'dsa-draft-code:' + draftId : '';

    // Get description from child .practice-problem or data-description
    var descEl = el.querySelector('.practice-problem');
    var descHTML = descEl ? descEl.innerHTML : (el.getAttribute('data-description') || '');
    if (descEl) descEl.style.display = 'none'; // hide original, we'll render it ourselves

    // Difficulty badge class
    var diffClass = 'practice-block__difficulty--easy';
    var diffLabel = 'Easy';
    if (difficulty === 'medium') { diffClass = 'practice-block__difficulty--medium'; diffLabel = 'Medium'; }
    else if (difficulty === 'hard') { diffClass = 'practice-block__difficulty--hard'; diffLabel = 'Hard'; }

    // Build header
    var header = document.createElement('div');
    header.className = 'practice-block__header';
    header.innerHTML =
      '<span class="practice-block__badge">Practice</span>' +
      '<span class="practice-block__title">' + escapeHtml(title) + '</span>' +
      '<span class="practice-block__difficulty ' + diffClass + '">' + diffLabel + '</span>';

    // Description
    var desc = document.createElement('div');
    desc.className = 'practice-block__description';
    desc.innerHTML = descHTML;

    // Editor wrap
    var editorWrap = document.createElement('div');
    editorWrap.className = 'practice-block__editor-wrap';

    // Actions bar
    var actions = document.createElement('div');
    actions.className = 'practice-block__actions';
    var runBtn = document.createElement('button');
    runBtn.className = 'btn btn--success btn--sm practice-block__run-btn';
    runBtn.textContent = '\u25b6 Run Tests';
    var statusSpan = document.createElement('span');
    statusSpan.className = 'practice-block__status';
    statusSpan.textContent = 'Loading editor\u2026';
    actions.appendChild(runBtn);
    actions.appendChild(statusSpan);

    // Results panel
    var results = document.createElement('div');
    results.className = 'practice-block__results';
    results.style.display = 'none';

    // Assemble
    el.innerHTML = '';
    if (descEl) el.appendChild(descEl); // keep hidden original for data preservation
    el.appendChild(header);
    el.appendChild(desc);
    el.appendChild(editorWrap);
    el.appendChild(actions);
    el.appendChild(results);

    // Load CodeMirror and create editor
    var cmEditor = null;
    loadCodeMirror(function(err) {
      if (err) {
        statusSpan.textContent = 'Editor failed to load';
        showBanner(el, 'editor',
          'Code editor failed to load. This usually means your network is blocking the local script — try refreshing, or paste your solution into the Text Editor tab on the right.');
        return;
      }
      // Unescape newlines from data-starter (stored as literal \n in HTML attribute)
      var starterCode = starter.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      // Restore saved draft if present; otherwise show starter.
      var initialCode = starterCode;
      if (draftKey) {
        try {
          var saved = localStorage.getItem(draftKey);
          if (saved !== null) initialCode = saved;
        } catch (e) {}
      }
      cmEditor = window.CodeMirror(editorWrap, {
        value: initialCode,
        mode: 'python',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 4,
        autoCloseBrackets: true,
        lineWrapping: false,
        viewportMargin: Infinity
      });
      statusSpan.textContent = 'Ready';

      // Debounced autosave on edit.
      if (draftKey) {
        var saveTimer = null;
        cmEditor.on('change', function() {
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = setTimeout(function() {
            try { localStorage.setItem(draftKey, cmEditor.getValue()); } catch (e) {}
          }, 200);
        });
      }
    });

    // Run Tests button handler
    runBtn.addEventListener('click', function() {
      var userCode = cmEditor ? cmEditor.getValue() : starter;
      results.style.display = 'none';
      results.innerHTML = '';
      statusSpan.textContent = 'Loading Pyodide\u2026';
      runBtn.disabled = true;

      loadPyodide(function(pyErr, py) {
        if (pyErr) {
          statusSpan.textContent = 'Pyodide failed to load';
          showBanner(el, 'pyodide',
            'Python runtime failed to load (about 10MB from cdn.jsdelivr.net). Check your network — corporate firewalls sometimes block this CDN. Your code is preserved; click Run again once you reconnect.');
          runBtn.disabled = false;
          return;
        }
        statusSpan.textContent = 'Running\u2026';
        runAllTests(py, userCode, fnName, tests, function(testResults) {
          var passed = 0;
          for (var i = 0; i < testResults.length; i++) {
            if (testResults[i].pass) passed++;
          }
          renderResults(results, testResults, passed, tests.length);
          results.style.display = '';
          var summaryClass = passed === tests.length ? 'pass' :
                             passed > 0 ? 'partial' : 'fail';
          statusSpan.textContent = passed + ' / ' + tests.length + ' tests passed';
          statusSpan.className = 'practice-block__status practice-block__summary--' + summaryClass;
          runBtn.disabled = false;
        });
      });
    });
  }

  function runAllTests(py, userCode, fnName, tests, done) {
    var results = [];
    var idx = 0;
    function next() {
      if (idx >= tests.length) { done(results); return; }
      var t = tests[idx++];
      runTest(py, userCode, fnName, t.args, function(err, output) {
        var pass = !err && output === t.expected;
        results.push({
          pass: pass,
          label: t.label || ('Test ' + idx),
          expected: t.expected,
          actual: err ? ('ERROR: ' + err) : output
        });
        next();
      });
    }
    next();
  }

  function renderResults(container, testResults, passed, total) {
    container.innerHTML = '';
    for (var i = 0; i < testResults.length; i++) {
      var r = testResults[i];
      var row = document.createElement('div');
      row.className = 'practice-result ' + (r.pass ? 'practice-result--pass' : 'practice-result--fail');

      var icon = document.createElement('i');
      icon.className = 'practice-result__icon';
      icon.textContent = r.pass ? '\u2713' : '\u2717';

      var labelSpan = document.createElement('span');
      labelSpan.className = 'practice-result__label';
      labelSpan.textContent = r.label;

      var detail = document.createElement('span');
      detail.className = 'practice-result__detail';
      if (r.pass) {
        detail.textContent = '\u2192 ' + r.actual;
      } else {
        detail.textContent = 'expected: ' + r.expected + '  got: ' + r.actual;
      }

      row.appendChild(icon);
      row.appendChild(labelSpan);
      row.appendChild(detail);
      container.appendChild(row);
    }

    var summary = document.createElement('div');
    summary.className = 'practice-block__summary';
    var summaryClass = passed === total ? 'pass' : passed > 0 ? 'partial' : 'fail';
    summary.classList.add('practice-block__summary--' + summaryClass);
    summary.textContent = passed + ' / ' + total + ' tests passed';
    container.appendChild(summary);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Public API ---
  DSA.practice = {
    init: function() {
      var blocks = document.querySelectorAll('.practice-block');
      for (var i = 0; i < blocks.length; i++) {
        attachBlock(blocks[i]);
      }
    }
  };
})();
