var DSA = window.DSA || {};

(function() {
  'use strict';

  // --- Singleton state ---
  var cmLoaded = false;
  var cmLoading = false;
  var cmCallbacks = [];

  var pyodideLoading = false;
  var pyodideCallbacks = [];

  // --- CDN URLs ---
  var CM_CSS      = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/codemirror.min.css';
  var CM_DRACULA  = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/theme/dracula.min.css';
  var CM_JS       = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/codemirror.min.js';
  var CM_PYTHON   = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/mode/python/python.min.js';
  var CM_CLOSE    = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.18/addon/edit/closebrackets.min.js';
  var PY_JS       = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
  var PY_INDEX    = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

  // --- Loader helpers ---
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
    s.onerror = function() { if (callback) callback(new Error('Failed to load: ' + url)); };
    document.head.appendChild(s);
  }

  function loadCodeMirror(callback) {
    if (cmLoaded) { callback(); return; }
    cmCallbacks.push(callback);
    if (cmLoading) return;
    cmLoading = true;

    loadCSS(CM_CSS);
    loadCSS(CM_DRACULA);

    loadScript(CM_JS, function(err) {
      if (err) { flushCmCallbacks(err); return; }
      loadScript(CM_PYTHON, function(err2) {
        if (err2) { flushCmCallbacks(err2); return; }
        loadScript(CM_CLOSE, function(err3) {
          cmLoaded = !err3;
          flushCmCallbacks(err3 || null);
        });
      });
    });
  }

  function flushCmCallbacks(err) {
    var cbs = cmCallbacks.slice();
    cmCallbacks = [];
    for (var i = 0; i < cbs.length; i++) { cbs[i](err); }
  }

  function loadPyodide(callback) {
    if (window.__dsaPyodide) { callback(null, window.__dsaPyodide); return; }
    pyodideCallbacks.push(callback);
    if (pyodideLoading) return;
    pyodideLoading = true;

    loadScript(PY_JS, function(err) {
      if (err) { flushPyCallbacks(err, null); return; }
      window.loadPyodide({ indexURL: PY_INDEX }).then(function(py) {
        window.__dsaPyodide = py;
        flushPyCallbacks(null, py);
      }).catch(function(e) {
        flushPyCallbacks(e, null);
      });
    });
  }

  function flushPyCallbacks(err, py) {
    var cbs = pyodideCallbacks.slice();
    pyodideCallbacks = [];
    for (var i = 0; i < cbs.length; i++) { cbs[i](err, py); }
  }

  // --- Get Python source from a code block ---
  function getPythonSource(block) {
    var panel = block.querySelector('.code-block__panel[data-lang="python"]');
    if (panel) {
      var raw = panel.getAttribute('data-raw');
      if (raw) return raw;
      var pre = panel.querySelector('.code-block__pre');
      if (pre) return pre.textContent;
    }
    // Fallback: first pre
    var pre = block.querySelector('.code-block__pre');
    return pre ? pre.textContent : '';
  }

  // --- Build the runner panel DOM ---
  function buildPanel(sourceCode) {
    var panel = document.createElement('div');
    panel.className = 'code-runner-panel';

    panel.innerHTML =
      '<div class="code-runner-panel__header">' +
        '<span class="code-runner-panel__title">Python</span>' +
        '<div class="code-runner-panel__actions">' +
          '<span class="code-runner-panel__status">Loading editor\u2026</span>' +
          '<button class="btn btn--sm code-runner-panel__reset" title="Reset to original code">Reset</button>' +
          '<button class="btn btn--sm btn--success code-runner-panel__run" title="Run code">\u25b6 Run</button>' +
        '</div>' +
      '</div>' +
      '<div class="code-runner-panel__editor-wrap"></div>' +
      '<div class="code-runner-panel__output-wrap">' +
        '<div class="code-runner-panel__output-label">Output</div>' +
        '<pre class="code-runner-panel__output">Click \u25b6 Run to execute\u2026</pre>' +
      '</div>';

    return panel;
  }

  // --- Attach runner to one code block ---
  function attachToBlock(block) {
    var header = block.querySelector('.code-block__header');
    if (!header) return;

    var cmEditor = null;
    var originalSource = '';

    function openPanel() {
      originalSource = getPythonSource(block);

      // Hide the static syntax-highlighted code body
      var codeBody = block.querySelector('.code-block__body');
      if (codeBody) codeBody.style.display = 'none';

      var runnerPanel = buildPanel(originalSource);
      block.appendChild(runnerPanel);

      var statusEl    = runnerPanel.querySelector('.code-runner-panel__status');
      var editorWrap  = runnerPanel.querySelector('.code-runner-panel__editor-wrap');
      var outputEl    = runnerPanel.querySelector('.code-runner-panel__output');
      var runBtn      = runnerPanel.querySelector('.code-runner-panel__run');
      var resetBtn    = runnerPanel.querySelector('.code-runner-panel__reset');

      // Load CodeMirror then create editor
      loadCodeMirror(function(err) {
        if (err) {
          statusEl.textContent = 'Editor failed to load';
          return;
        }
        cmEditor = window.CodeMirror(editorWrap, {
          value: originalSource,
          mode: 'python',
          theme: 'dracula',
          lineNumbers: true,
          indentUnit: 4,
          autoCloseBrackets: true,
          lineWrapping: false,
          viewportMargin: Infinity
        });
        statusEl.textContent = 'Ready';

        // Pre-warm Pyodide in the background
        loadPyodide(function(pyErr) {
          if (pyErr) {
            statusEl.textContent = 'Pyodide failed to load';
          } else {
            statusEl.textContent = 'Ready';
          }
        });
      });

      // Run button
      runBtn.addEventListener('click', function() {
        runCode(statusEl, outputEl);
      });

      // Reset button
      resetBtn.addEventListener('click', function() {
        if (cmEditor) cmEditor.setValue(originalSource);
        outputEl.textContent = 'Click \u25b6 Run to execute\u2026';
        outputEl.classList.remove('code-runner-panel__output--error');
      });
    }

    function runCode(statusEl, outputEl) {
      if (!window.__dsaPyodide) {
        statusEl.textContent = 'Loading Pyodide\u2026';
        loadPyodide(function(err, py) {
          if (err) {
            statusEl.textContent = 'Pyodide failed to load';
            outputEl.textContent = String(err);
            outputEl.classList.add('code-runner-panel__output--error');
            return;
          }
          execCode(py, statusEl, outputEl);
        });
      } else {
        execCode(window.__dsaPyodide, statusEl, outputEl);
      }
    }

    function execCode(py, statusEl, outputEl) {
      var code = cmEditor ? cmEditor.getValue() : originalSource;

      statusEl.textContent = 'Running\u2026';
      outputEl.classList.remove('code-runner-panel__output--error');
      outputEl.textContent = '';

      try {
        // Redirect stdout/stderr
        py.runPython(
          'import sys\n' +
          'from io import StringIO\n' +
          'sys.stdout = StringIO()\n' +
          'sys.stderr = StringIO()'
        );

        var hadError = false;
        try {
          py.runPython(code);
        } catch (runErr) {
          hadError = true;
          var stderr = '';
          try { stderr = py.runPython('sys.stderr.getvalue()'); } catch(e) {}
          outputEl.textContent = stderr || String(runErr);
          outputEl.classList.add('code-runner-panel__output--error');
        }

        if (!hadError) {
          var stdout = '';
          try { stdout = py.runPython('sys.stdout.getvalue()'); } catch(e) {}
          outputEl.textContent = stdout !== '' ? stdout : '(no output)';
        }

        statusEl.textContent = hadError ? 'Error' : 'Done';
      } catch (e) {
        statusEl.textContent = 'Error';
        outputEl.textContent = String(e);
        outputEl.classList.add('code-runner-panel__output--error');
      } finally {
        // Restore sys.stdout/stderr to defaults
        try {
          py.runPython(
            'import sys\n' +
            'sys.stdout = sys.__stdout__\n' +
            'sys.stderr = sys.__stderr__'
          );
        } catch(e) {}
      }
    }

    // Open the panel immediately — no trigger button, always live
    openPanel();
  }

  // --- Public init ---
  function init() {
    var blocks = document.querySelectorAll('.code-block');
    for (var i = 0; i < blocks.length; i++) {
      attachToBlock(blocks[i]);
    }
  }

  DSA.codeRunner = { init: init };
})();
