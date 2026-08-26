var DSA = window.DSA || {};

(function() {
  'use strict';

  // CodeMirror lives in js/cdn-loader.js (DSA.cdnLoader.*); Python now runs
  // off-thread via DSA.cdnLoader.runPython (see js/pyodide-worker.js).
  function loadCodeMirror(cb) { DSA.cdnLoader.loadCodeMirror(cb); }

  var RUN_TIMEOUT_MS = 6000; // stop runaway/infinite-loop code after this long

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
        cmEditor = DSA.cdnLoader.makeEditor(editorWrap, DSA.cdnLoader.normalizeIndent(originalSource));
        statusEl.textContent = 'Ready';
        DSA.cdnLoader.warmup(); // pre-load Pyodide in the worker
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
      var code = cmEditor ? DSA.cdnLoader.normalizeIndent(cmEditor.getValue()) : originalSource;

      statusEl.textContent = 'Running\u2026';
      outputEl.classList.remove('code-runner-panel__output--error');
      outputEl.textContent = '';

      DSA.cdnLoader.runPython({ mode: 'free', code: code }, RUN_TIMEOUT_MS, function(data) {
        if (data.timeout) {
          statusEl.textContent = 'Timed out';
          outputEl.textContent = '\u23f1 Stopped after ' + (RUN_TIMEOUT_MS / 1000) +
            's \u2014 your code may have an infinite loop.';
          outputEl.classList.add('code-runner-panel__output--error');
          return;
        }
        if (data.mode !== 'free') {
          // Transport / runtime-load failure (worker crashed or CDN blocked).
          statusEl.textContent = 'Error';
          outputEl.textContent = 'Python runtime failed to load (about 10MB from cdn.jsdelivr.net). ' +
            'Check your network and try again.';
          outputEl.classList.add('code-runner-panel__output--error');
          return;
        }
        if (data.error) {
          statusEl.textContent = 'Error';
          outputEl.textContent = DSA.cdnLoader.formatPyError(data.error);
          outputEl.classList.add('code-runner-panel__output--error');
          return;
        }
        var stdout = data.stdout || '';
        outputEl.textContent = stdout !== '' ? stdout : '(no output)';
        statusEl.textContent = 'Done';
      });
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
