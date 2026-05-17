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
    var addTestBtn = document.createElement('button');
    addTestBtn.className = 'btn btn--ghost btn--sm practice-block__add-test-btn';
    addTestBtn.type = 'button';
    addTestBtn.textContent = '+ Add Test';
    addTestBtn.title = 'Add a custom test case (saved locally per problem)';
    var statusSpan = document.createElement('span');
    statusSpan.className = 'practice-block__status';
    statusSpan.textContent = 'Loading editor\u2026';
    actions.appendChild(runBtn);
    actions.appendChild(addTestBtn);
    actions.appendChild(statusSpan);

    // Pull example values from the FIRST built-in test (if any) so the form's
    // placeholders show what valid input/output for THIS problem actually
    // looks like. Users were confused trying to guess what to type.
    var exampleArgs = '[1, 2, 3]';
    var exampleExpected = '6';
    if (tests.length > 0) {
      try { exampleArgs = JSON.stringify(tests[0].args); } catch (e) {}
      exampleExpected = tests[0].expected || exampleExpected;
    }

    // Custom test form (hidden by default; toggled by Add Test)
    var customForm = document.createElement('div');
    customForm.className = 'practice-block__custom-form';
    customForm.style.display = 'none';
    customForm.innerHTML =
      '<div class="practice-custom__intro">' +
        'Format follows the built-in tests for this problem:<br>' +
        '<code>args</code> = a JSON array of values you\'d pass to <code>' + escapeHtml(fnName) + '</code>; ' +
        '<code>expected</code> = the Python <code>repr()</code> of what the function should return ' +
        '(strings shown with quotes, lists as <code>[1, 2, 3]</code> with spaces after commas).' +
      '</div>' +
      '<div class="practice-custom__row">' +
        '<label>args: <input class="practice-custom__args" type="text" placeholder="' + escapeHtml(exampleArgs) + '" spellcheck="false"></label>' +
      '</div>' +
      '<div class="practice-custom__row">' +
        '<label>expected: <input class="practice-custom__expected" type="text" placeholder="' + escapeHtml(exampleExpected) + '" spellcheck="false"></label>' +
      '</div>' +
      '<div class="practice-custom__row">' +
        '<button type="button" class="btn btn--sm btn--primary practice-custom__save">Save test</button> ' +
        '<button type="button" class="btn btn--sm btn--ghost practice-custom__cancel">Cancel</button> ' +
        '<button type="button" class="btn btn--sm btn--ghost practice-custom__fill" title="Pre-fill with the first built-in test as a starting point">Fill example</button>' +
        '<span class="practice-custom__error"></span>' +
      '</div>';

    // Saved custom tests list (rendered above Results when present)
    var customList = document.createElement('div');
    customList.className = 'practice-block__custom-list';

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
    el.appendChild(customForm);
    el.appendChild(customList);
    el.appendChild(results);

    // --- Custom tests (saved to localStorage per problem) ---
    var customKey = draftId ? 'dsa-custom-tests:' + draftId : '';
    function loadCustomTests() {
      if (!customKey) return [];
      try { return JSON.parse(localStorage.getItem(customKey)) || []; }
      catch (e) { return []; }
    }
    function saveCustomTests(arr) {
      if (!customKey) return;
      try { localStorage.setItem(customKey, JSON.stringify(arr)); } catch (e) {}
    }
    function renderCustomList() {
      var custom = loadCustomTests();
      customList.innerHTML = '';
      if (custom.length === 0) return;
      var header = document.createElement('div');
      header.className = 'practice-block__custom-header';
      header.textContent = 'Custom tests (' + custom.length + ')';
      customList.appendChild(header);
      custom.forEach(function(t, i) {
        var row = document.createElement('div');
        row.className = 'practice-custom-item';
        row.innerHTML =
          '<span class="practice-custom-item__args" title="args">' + escapeHtml(JSON.stringify(t.args)) + '</span> ' +
          '<span class="practice-custom-item__arrow">→</span> ' +
          '<span class="practice-custom-item__expected" title="expected">' + escapeHtml(t.expected) + '</span>';
        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'practice-custom-item__del';
        del.setAttribute('aria-label', 'Delete test');
        del.title = 'Delete';
        del.textContent = '×';
        del.addEventListener('click', function() {
          var arr = loadCustomTests();
          arr.splice(i, 1);
          saveCustomTests(arr);
          renderCustomList();
        });
        row.appendChild(del);
        customList.appendChild(row);
      });
    }
    renderCustomList();

    addTestBtn.addEventListener('click', function() {
      customForm.style.display = customForm.style.display === 'none' ? 'block' : 'none';
      if (customForm.style.display === 'block') {
        customForm.querySelector('.practice-custom__args').focus();
      }
    });
    customForm.querySelector('.practice-custom__cancel').addEventListener('click', function() {
      customForm.style.display = 'none';
      customForm.querySelector('.practice-custom__error').textContent = '';
    });
    var fillBtn = customForm.querySelector('.practice-custom__fill');
    if (fillBtn) {
      fillBtn.addEventListener('click', function() {
        customForm.querySelector('.practice-custom__args').value = exampleArgs;
        customForm.querySelector('.practice-custom__expected').value = exampleExpected;
        customForm.querySelector('.practice-custom__error').textContent = '';
      });
    }
    customForm.querySelector('.practice-custom__save').addEventListener('click', function() {
      var argsRaw = customForm.querySelector('.practice-custom__args').value.trim();
      var expected = customForm.querySelector('.practice-custom__expected').value.trim();
      var errEl = customForm.querySelector('.practice-custom__error');
      errEl.textContent = '';
      if (!argsRaw || !expected) {
        errEl.textContent = 'Both fields are required.';
        return;
      }
      var args;
      try { args = JSON.parse(argsRaw); }
      catch (e) { errEl.textContent = 'args must be valid JSON, e.g. [1, 2, 3].'; return; }
      if (!Array.isArray(args)) {
        errEl.textContent = 'args must be a JSON array (the values passed to your function).';
        return;
      }
      var arr = loadCustomTests();
      arr.push({ args: args, expected: expected, label: 'Custom ' + (arr.length + 1) });
      saveCustomTests(arr);
      customForm.querySelector('.practice-custom__args').value = '';
      customForm.querySelector('.practice-custom__expected').value = '';
      customForm.style.display = 'none';
      renderCustomList();
    });

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
    var DEFAULT_RUN_LABEL = '▶ Run Tests';
    runBtn.addEventListener('click', function() {
      var userCode = cmEditor ? cmEditor.getValue() : starter;
      // Clear any pass/fail color carried over from a previous run so the
      // 'Running...' text is visibly NEW. Also flip the button label and
      // show an active placeholder in the results pane.
      statusSpan.className = 'practice-block__status practice-block__status--running';
      statusSpan.textContent = 'Loading Pyodide…';
      runBtn.disabled = true;
      runBtn.textContent = '⏳ Running…';
      results.innerHTML = '<div class="practice-block__running">Running tests…</div>';
      results.style.display = '';

      // Combine built-in tests with saved custom tests
      var allTests = tests.concat(loadCustomTests());
      // Ensure 'Running...' is visible for at least 400ms even on quick runs
      // — otherwise it flashes too fast to notice on re-runs.
      var runStart = Date.now();
      function finish(callback) {
        var elapsed = Date.now() - runStart;
        var delay = Math.max(0, 400 - elapsed);
        setTimeout(callback, delay);
      }

      loadPyodide(function(pyErr, py) {
        if (pyErr) {
          statusSpan.textContent = 'Pyodide failed to load';
          statusSpan.className = 'practice-block__status practice-block__summary--fail';
          showBanner(el, 'pyodide',
            'Python runtime failed to load (about 10MB from cdn.jsdelivr.net). Check your network — corporate firewalls sometimes block this CDN. Your code is preserved; click Run again once you reconnect.');
          runBtn.disabled = false;
          runBtn.textContent = DEFAULT_RUN_LABEL;
          results.innerHTML = '';
          results.style.display = 'none';
          return;
        }
        statusSpan.textContent = 'Running…';
        runAllTests(py, userCode, fnName, allTests, function(testResults) {
          finish(function() {
            var passed = 0;
            for (var i = 0; i < testResults.length; i++) {
              if (testResults[i].pass) passed++;
            }
            renderResults(results, testResults, passed, allTests.length, allTests);
            results.style.display = '';
            var summaryClass = passed === allTests.length ? 'pass' :
                               passed > 0 ? 'partial' : 'fail';
            statusSpan.textContent = passed + ' / ' + allTests.length + ' tests passed';
            statusSpan.className = 'practice-block__status practice-block__summary--' + summaryClass;
            runBtn.disabled = false;
            runBtn.textContent = DEFAULT_RUN_LABEL;
          });
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
          args: t.args,
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
    var summaryClass = passed === total ? 'pass' : passed > 0 ? 'partial' : 'fail';

    // Outer collapsible container: summary always visible; the per-test list
    // is collapsed when all pass and auto-expanded otherwise.
    var details = document.createElement('details');
    details.className = 'practice-block__results-details practice-block__results-details--' + summaryClass;
    if (summaryClass !== 'pass') details.open = true;

    var summaryEl = document.createElement('summary');
    summaryEl.className = 'practice-block__summary practice-block__summary--' + summaryClass;
    summaryEl.innerHTML =
      '<span class="practice-block__summary-icon">' + (summaryClass === 'pass' ? '✓' : summaryClass === 'fail' ? '✗' : '!') + '</span>' +
      '<span class="practice-block__summary-text">' + passed + ' / ' + total + ' tests passed</span>' +
      '<span class="practice-block__summary-hint">click to ' + (summaryClass === 'pass' ? 'expand' : 'collapse') + '</span>';
    details.appendChild(summaryEl);

    var list = document.createElement('div');
    list.className = 'practice-block__results-list';
    for (var i = 0; i < testResults.length; i++) {
      var r = testResults[i];
      // Each individual test is now its own <details> so the user can expand
      // a row and see Input / Expected / Got laid out clearly. Failed tests
      // are auto-expanded so the problem jumps out.
      var rowDetails = document.createElement('details');
      rowDetails.className = 'practice-result-row ' + (r.pass ? 'practice-result-row--pass' : 'practice-result-row--fail');
      if (!r.pass) rowDetails.open = true;

      var rowSummary = document.createElement('summary');
      rowSummary.className = 'practice-result-row__summary';
      rowSummary.innerHTML =
        '<span class="practice-result-row__icon">' + (r.pass ? '✓' : '✗') + '</span>' +
        '<span class="practice-result-row__label">' + escapeHtml(r.label) + '</span>' +
        '<span class="practice-result-row__chevron">▸</span>';
      rowDetails.appendChild(rowSummary);

      var body = document.createElement('div');
      body.className = 'practice-result-row__body';
      var argsRepr;
      try { argsRepr = JSON.stringify(r.args); }
      catch (e) { argsRepr = String(r.args); }
      body.innerHTML =
        '<div class="practice-result-row__field"><span class="practice-result-row__field-label">Input:</span> <code>' + escapeHtml(argsRepr) + '</code></div>' +
        '<div class="practice-result-row__field"><span class="practice-result-row__field-label">Expected:</span> <code>' + escapeHtml(r.expected) + '</code></div>' +
        '<div class="practice-result-row__field"><span class="practice-result-row__field-label">Got:</span> <code class="' + (r.pass ? 'practice-got--ok' : 'practice-got--bad') + '">' + escapeHtml(r.actual) + '</code></div>';
      rowDetails.appendChild(body);
      list.appendChild(rowDetails);
    }
    details.appendChild(list);
    container.appendChild(details);
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
