var DSA = window.DSA || {};

(function() {
  'use strict';

  // CodeMirror + Pyodide loaders live in js/cdn-loader.js (DSA.cdnLoader.*)
  // so practice.js and code-runner.js share the same singletons.
  function loadCodeMirror(cb) { DSA.cdnLoader.loadCodeMirror(cb); }
  function loadPyodide(cb)    { DSA.cdnLoader.loadPyodide(cb); }

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
