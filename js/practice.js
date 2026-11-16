var DSA = window.DSA || {};

(function() {
  'use strict';

  // CodeMirror lives in js/cdn-loader.js (DSA.cdnLoader.*); Python runs
  // off-thread via DSA.cdnLoader.runPython (see js/pyodide-worker.js). C runs
  // through js/c-harness.js (wraps the solution in a test main()) and
  // DSA.cdnLoader.runC (GCC on godbolt.org).
  function loadCodeMirror(cb) { DSA.cdnLoader.loadCodeMirror(cb); }

  var RUN_TIMEOUT_MS = 6000; // kill runaway/infinite-loop solutions after this long
  var C_TIMEOUT_MS = 30000;  // C: network + compile + run (each test has its own 2s limit)

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

  // --- Build the practice panel DOM and wire it up ---
  function attachBlock(el) {
    var title      = el.getAttribute('data-title') || 'Practice Problem';
    var difficulty = (el.getAttribute('data-difficulty') || 'easy').toLowerCase();
    var fnName     = el.getAttribute('data-fn') || 'solution';
    var normalize  = el.getAttribute('data-normalize') || ''; // any-order answers
    var starter    = el.getAttribute('data-starter') || ('def ' + fnName + '():\n    pass');
    var testsRaw   = el.getAttribute('data-tests') || '[]';
    var tests      = [];
    try { tests = JSON.parse(testsRaw); } catch(e) { tests = []; }

    // Optional draft autosave (used on per-problem pages). When data-problem-id
    // is present we save/restore the editor's content under
    // dsa-draft-code:<problemId> so refreshing or revisiting preserves work.
    var draftId = el.getAttribute('data-problem-id') || '';
    var draftKey = draftId ? 'dsa-draft-code:' + draftId : '';

    // Optional C version: data-c holds the C spec (see js/c-harness.js) with
    // its starter code. Without it the block is Python-only, as before.
    var cSpec = null;
    try { cSpec = JSON.parse(el.getAttribute('data-c') || 'null'); } catch (e) { cSpec = null; }
    var starters = {
      // data-starter may hold literal \\n / \\t (older inline HTML)
      python: starter.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
      c: cSpec ? (cSpec.starter || '') : null
    };
    var lang = (cSpec && DSA.cdnLoader.lang.get() === 'c') ? 'c' : 'python';
    function draftKeyFor(l) {
      if (!draftId) return '';
      return l === 'c' ? 'dsa-draft-code-c:' + draftId : draftKey;
    }

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
    var langSwitch = null;
    if (cSpec) {
      langSwitch = DSA.cdnLoader.lang.makeSwitch(['python', 'c'], lang, function(l) {
        DSA.cdnLoader.lang.set(l);
      });
      langSwitch.classList.add('practice-block__lang');
      actions.appendChild(langSwitch);
    }
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
        (cSpec ? ' The same tests run against your C solution: the C runner prints results in this format too.' : '') +
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

    // Load CodeMirror and create editor. (The callback can run synchronously
    // when CodeMirror is already on the page, so declare its state first.)
    var cmEditor = null;
    var memDrafts = {};    // blocks without a problem id keep edits in memory only
    var switching = false; // true while switchLang swaps the editor contents
    loadCodeMirror(function(err) {
      if (err) {
        statusSpan.textContent = 'Editor failed to load';
        showBanner(el, 'editor',
          'Code editor failed to load. This usually means your network is blocking the local script — try refreshing, or paste your solution into the Text Editor tab on the right.');
        return;
      }
      cmEditor = DSA.cdnLoader.makeEditor(editorWrap, initialCodeFor(lang), lang);
      statusSpan.textContent = 'Ready';
      if (lang === 'python') DSA.cdnLoader.warmup(); // pre-load Pyodide in the worker

      // Debounced autosave on edit (per language).
      var saveTimer = null;
      cmEditor.on('change', function() {
        var key = draftKeyFor(lang);
        if (!key || switching) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function() {
          try { localStorage.setItem(key, cmEditor.getValue()); } catch (e) {}
        }, 200);
      });
    });

    // Saved draft if present; otherwise the starter code.
    function initialCodeFor(l) {
      var code = memDrafts[l] !== undefined ? memDrafts[l] : starters[l];
      var key = draftKeyFor(l);
      if (key) {
        try {
          var saved = localStorage.getItem(key);
          if (saved !== null) code = saved;
        } catch (e) {}
      }
      // Recover any tab-indented drafts so Python doesn't choke on mixed
      // tabs/spaces; the editor itself now inserts spaces on Tab.
      return l === 'python' ? DSA.cdnLoader.normalizeIndent(code || '') : (code || '');
    }

    function switchLang(l) {
      if (!cSpec || l === lang || starters[l] === null) return;
      if (cmEditor) {
        var key = draftKeyFor(lang);
        if (key) { try { localStorage.setItem(key, cmEditor.getValue()); } catch (e) {} }
        else memDrafts[lang] = cmEditor.getValue();
      }
      lang = l;
      if (langSwitch) langSwitch.setActive(l);
      if (cmEditor) {
        switching = true;
        DSA.cdnLoader.setEditorLang(cmEditor, l);
        cmEditor.setValue(initialCodeFor(l));
        switching = false;
      }
      results.innerHTML = '';
      results.style.display = 'none';
      statusSpan.className = 'practice-block__status';
      statusSpan.textContent = 'Ready';
      if (l === 'python') DSA.cdnLoader.warmup();
    }
    if (cSpec) DSA.cdnLoader.lang.onChange(switchLang);


    function runCTests(code, allTests, finish, resetBtn, fail) {
      runCTestsFor(el, cSpec, results, statusSpan, code, allTests, finish, resetBtn, fail);
    }

    // Run Tests button handler
    var DEFAULT_RUN_LABEL = '▶ Run Tests';
    runBtn.addEventListener('click', function() {
      var userCode = cmEditor ? DSA.cdnLoader.normalizeIndent(cmEditor.getValue()) : starter;
      // Clear any pass/fail color carried over from a previous run so the
      // 'Running...' text is visibly NEW. Also flip the button label and
      // show an active placeholder in the results pane.
      statusSpan.className = 'practice-block__status practice-block__status--running';
      statusSpan.textContent = lang === 'c' ? 'Compiling & running…' : 'Running…';
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
      function resetBtn() {
        runBtn.disabled = false;
        runBtn.textContent = DEFAULT_RUN_LABEL;
      }
      function fail(msg) {
        statusSpan.textContent = msg;
        statusSpan.className = 'practice-block__status practice-block__summary--fail';
      }

      if (lang === 'c') {
        runCTests(cmEditor ? cmEditor.getValue() : starters.c, allTests, finish, resetBtn, fail);
        return;
      }

      DSA.cdnLoader.runPython(
        { mode: 'tests', code: userCode, fnName: fnName, tests: allTests, normalize: normalize },
        RUN_TIMEOUT_MS,
        function(data) {
          finish(function() {
            resetBtn();

            if (data.timeout) {
              fail('Timed out');
              results.innerHTML = '<div class="practice-block__timeout">⏱ Stopped after ' +
                (RUN_TIMEOUT_MS / 1000) + 's — your code may have an infinite loop. ' +
                'Check for a loop or recursion that never ends.</div>';
              results.style.display = '';
              return;
            }
            if (data.error) {
              fail('Runtime unavailable');
              showBanner(el, 'pyodide',
                'Python runtime failed to load (about 10MB from cdn.jsdelivr.net). Check your network — corporate firewalls sometimes block this CDN. Your code is preserved; click Run again once you reconnect.');
              results.innerHTML = '';
              results.style.display = 'none';
              return;
            }

            var payload = data.payload || {};
            if (payload.codeError) {
              fail('Error');
              renderCodeError(results, DSA.cdnLoader.formatPyError(payload.codeError));
              return;
            }

            var raw = payload.results || [];
            var testResults = [];
            var passed = 0;
            for (var i = 0; i < allTests.length; i++) {
              var t = allTests[i];
              var r = raw[i] || {};
              var pass = !!r.ok && r.result === t.expected;
              if (pass) passed++;
              testResults.push({
                pass: pass,
                label: t.label || ('Test ' + (i + 1)),
                args: t.args,
                expected: t.expected,
                actual: r.ok ? r.result : ('ERROR: ' + DSA.cdnLoader.formatPyError(r.error))
              });
            }
            renderResults(results, testResults, passed, allTests.length);
            results.style.display = '';
            var summaryClass = passed === allTests.length ? 'pass' :
                               passed > 0 ? 'partial' : 'fail';
            statusSpan.textContent = passed + ' / ' + allTests.length + ' tests passed';
            statusSpan.className = 'practice-block__status practice-block__summary--' + summaryClass;
          });
        }
      );
    });
  }

  // --- C test run: harness → GCC (godbolt.org) → per-test results ---
  function runCTestsFor(el, cSpec, results, statusSpan, code, allTests, finish, resetBtn, fail) {
    DSA.cdnLoader.loadCHarness(function(err) {
      if (err) {
        finish(function() {
          resetBtn(); fail('Error');
          renderCodeError(results, 'Could not load the C test harness (js/c-harness.js). Try refreshing the page.');
        });
        return;
      }
      var program;
      try {
        program = DSA.cHarness.buildProgram(cSpec, code, allTests);
      } catch (e) {
        finish(function() {
          resetBtn(); fail('Test error');
          renderCodeError(results, String(e.message || e).replace(/^c-harness: /, '') +
            '\n\nA custom test may not match this problem\'s parameters.', 'A test case could not be converted to C');
        });
        return;
      }
      DSA.cdnLoader.runC(program.source, { timeoutMs: C_TIMEOUT_MS }, function(d) {
        finish(function() {
          resetBtn();
          if (d.timeout || d.error) {
            fail(d.timeout ? 'Timed out' : 'Compiler unavailable');
            showBanner(el, 'godbolt',
              'C code is compiled and run by Compiler Explorer (godbolt.org), and it could not be reached' +
              (d.error ? ' (' + d.error + ')' : '') + '. Check your network. Your code is preserved, so click Run again once you reconnect.');
            results.innerHTML = '';
            results.style.display = 'none';
            return;
          }
          if (d.compileError) {
            fail('Compile error');
            renderCodeError(results, DSA.cHarness.formatCompileErrors(d.compileError), 'Your code did not compile');
            return;
          }
          var raw = DSA.cHarness.parseOutput(d.stdout, allTests.length);
          var testResults = [];
          var passed = 0;
          for (var i = 0; i < allTests.length; i++) {
            var t = allTests[i];
            var r = raw[i] || {};
            var pass = !!r.ok && r.result === t.expected;
            if (pass) passed++;
            var actual = r.ok ? r.result : ('ERROR: ' + r.error);
            if (r.stdout) actual += '\n\nstdout:\n' + r.stdout;
            testResults.push({
              pass: pass,
              label: t.label || ('Test ' + (i + 1)),
              args: t.args,
              expected: t.expected,
              actual: actual
            });
          }
          renderResults(results, testResults, passed, allTests.length);
          results.style.display = '';
          var summaryClass = passed === allTests.length ? 'pass' : passed > 0 ? 'partial' : 'fail';
          statusSpan.textContent = passed + ' / ' + allTests.length + ' tests passed';
          statusSpan.className = 'practice-block__status practice-block__summary--' + summaryClass;
        });
      });
    });
  }

  // Render a whole-program error (syntax error, or code that fails to define
  // the expected function) as a single clean block instead of per-test rows.
  function renderCodeError(container, msg, heading) {
    container.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'practice-block__results-details practice-block__results-details--fail';
    box.open = true;
    var summary = document.createElement('div');
    summary.className = 'practice-block__summary practice-block__summary--fail';
    summary.innerHTML =
      '<span class="practice-block__summary-icon">✗</span>' +
      '<span class="practice-block__summary-text">' + escapeHtml(heading || 'Your code has an error') + '</span>';
    var pre = document.createElement('pre');
    pre.className = 'practice-block__code-error';
    pre.textContent = msg;
    box.appendChild(summary);
    box.appendChild(pre);
    container.appendChild(box);
    container.style.display = '';
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
