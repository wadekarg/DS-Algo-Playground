var DSA = window.DSA || {};

(function() {
  'use strict';

  // --- Asset URLs ---
  // CodeMirror is self-hosted so it works on networks that block cdnjs (common
  // on corporate Mac/Windows laptops). Pyodide stays on jsdelivr because the
  // full distribution is ~10MB and we don't want to ship that with the site.
  function vendorPath(filename) {
    // sidebar-nav.getBasePath logic, inlined to avoid coupling
    var p = window.location.pathname;
    var prefix = (p.indexOf('/topics/') !== -1 || p.indexOf('/problems/') !== -1) ? '../' : '';
    return prefix + 'vendor/codemirror/' + filename;
  }
  var CM_CSS     = vendorPath('codemirror.min.css');
  // Dracula theme is inlined in css/code-runner.css with !important, so we
  // don't need to load the theme CSS separately at all.
  var CM_JS      = vendorPath('codemirror.min.js');
  var CM_PYTHON  = vendorPath('python.min.js');
  var CM_CLOSE   = vendorPath('closebrackets.min.js');
  var PY_JS      = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
  var PY_INDEX   = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

  // --- Singleton loader state ---
  var cmLoaded = false;
  var cmLoading = false;
  var cmCallbacks = [];

  var pyLoading = false;
  var pyCallbacks = [];

  function loadCSS(url) {
    if (document.querySelector('link[href="' + url + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  function loadScript(url, callback) {
    if (document.querySelector('script[src="' + url + '"]')) {
      if (callback) callback();
      return;
    }
    var s = document.createElement('script');
    s.src = url;
    s.onload = function() { if (callback) callback(); };
    s.onerror = function() { if (callback) callback(new Error('Failed: ' + url)); };
    document.head.appendChild(s);
  }

  function loadCodeMirror(callback) {
    if (window.CodeMirror && cmLoaded) { callback(); return; }
    if (window.CodeMirror) { cmLoaded = true; callback(); return; }
    cmCallbacks.push(callback);
    if (cmLoading) return;
    cmLoading = true;
    loadCSS(CM_CSS);
    loadScript(CM_JS, function(err) {
      if (err) { flushCm(err); return; }
      loadScript(CM_PYTHON, function(err2) {
        if (err2) { flushCm(err2); return; }
        loadScript(CM_CLOSE, function(err3) {
          cmLoaded = !err3;
          flushCm(err3 || null);
        });
      });
    });
  }

  function flushCm(err) {
    var cbs = cmCallbacks.slice(); cmCallbacks = [];
    for (var i = 0; i < cbs.length; i++) cbs[i](err);
  }

  function loadPyodide(callback) {
    // Shared singleton with code-runner.js via window.__dsaPyodide
    if (window.__dsaPyodide) { callback(null, window.__dsaPyodide); return; }
    pyCallbacks.push(callback);
    if (pyLoading) return;
    pyLoading = true;
    loadScript(PY_JS, function(err) {
      if (err) { flushPy(err, null); return; }
      window.loadPyodide({ indexURL: PY_INDEX }).then(function(py) {
        window.__dsaPyodide = py;
        flushPy(null, py);
      }).catch(function(e) {
        flushPy(e, null);
      });
    });
  }

  function flushPy(err, py) {
    var cbs = pyCallbacks.slice(); pyCallbacks = [];
    for (var i = 0; i < cbs.length; i++) cbs[i](err, py);
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
        return;
      }
      // Unescape newlines from data-starter (stored as literal \n in HTML attribute)
      var starterCode = starter.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      cmEditor = window.CodeMirror(editorWrap, {
        value: starterCode,
        mode: 'python',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 4,
        autoCloseBrackets: true,
        lineWrapping: false,
        viewportMargin: Infinity
      });
      statusSpan.textContent = 'Ready';
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
