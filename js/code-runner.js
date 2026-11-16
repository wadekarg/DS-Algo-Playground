var DSA = window.DSA || {};

(function() {
  'use strict';

  // CodeMirror lives in js/cdn-loader.js (DSA.cdnLoader.*). Python runs
  // off-thread via DSA.cdnLoader.runPython (see js/pyodide-worker.js); C is
  // compiled and run with GCC via DSA.cdnLoader.runC (godbolt.org).
  function loadCodeMirror(cb) { DSA.cdnLoader.loadCodeMirror(cb); }

  var RUN_TIMEOUT_MS = 6000;    // stop runaway/infinite-loop Python after this long
  var C_TIMEOUT_MS = 30000;     // C: network round-trip + compile + run

  // --- Source for one language from a code block (null if absent) ---
  function getSource(block, lang) {
    var panel = block.querySelector('.code-block__panel[data-lang="' + lang + '"]');
    if (!panel) return null;
    var raw = panel.getAttribute('data-raw');
    if (raw) return raw;
    var pre = panel.querySelector('.code-block__pre');
    return pre ? pre.textContent : '';
  }

  // --- Build the runner panel DOM ---
  function buildPanel() {
    var panel = document.createElement('div');
    panel.className = 'code-runner-panel';

    panel.innerHTML =
      '<div class="code-runner-panel__header">' +
        '<span class="code-runner-panel__title">Python</span>' +
        '<div class="code-runner-panel__actions">' +
          '<span class="code-runner-panel__status">Loading editor…</span>' +
          '<button class="btn btn--sm code-runner-panel__reset" title="Reset to original code">Reset</button>' +
          '<button class="btn btn--sm btn--success code-runner-panel__run" title="Run code">▶ Run</button>' +
        '</div>' +
      '</div>' +
      '<div class="code-runner-panel__editor-wrap"></div>' +
      '<div class="code-runner-panel__output-wrap">' +
        '<div class="code-runner-panel__output-label">Output</div>' +
        '<pre class="code-runner-panel__output">Click ▶ Run to execute…</pre>' +
      '</div>';

    return panel;
  }

  // --- Attach runner to one code block ---
  function attachToBlock(block) {
    var header = block.querySelector('.code-block__header');
    if (!header) return;

    // Which languages does this block carry? (Python always; C when authored.)
    var originals = {};
    ['python', 'c'].forEach(function(l) {
      var src = getSource(block, l);
      if (src !== null) originals[l] = src;
    });
    if (!originals.python) {
      var pre = block.querySelector('.code-block__pre');
      originals.python = pre ? pre.textContent : '';
    }
    var langs = Object.keys(originals);
    var pref = DSA.cdnLoader.lang.get();
    var current = originals[pref] !== undefined ? pref : 'python';
    var edited = {}; // per-language edits survive switching back and forth

    var cmEditor = null;

    // Hide the static syntax-highlighted code body
    var codeBody = block.querySelector('.code-block__body');
    if (codeBody) codeBody.style.display = 'none';

    var runnerPanel = buildPanel();
    block.appendChild(runnerPanel);

    var titleEl     = runnerPanel.querySelector('.code-runner-panel__title');
    var statusEl    = runnerPanel.querySelector('.code-runner-panel__status');
    var editorWrap  = runnerPanel.querySelector('.code-runner-panel__editor-wrap');
    var outputEl    = runnerPanel.querySelector('.code-runner-panel__output');
    var runBtn      = runnerPanel.querySelector('.code-runner-panel__run');
    var resetBtn    = runnerPanel.querySelector('.code-runner-panel__reset');

    // Static header label ("Python") → language switch when C is available
    var headerLabel = header.querySelector('span');
    var langSwitch = null;
    if (langs.length > 1) {
      langSwitch = DSA.cdnLoader.lang.makeSwitch(langs, current, function(l) {
        DSA.cdnLoader.lang.set(l); // every block on the page follows
      });
      if (headerLabel) header.replaceChild(langSwitch, headerLabel);
      else header.insertBefore(langSwitch, header.firstChild);
    }

    function labelFor(l) { return l === 'c' ? 'C · GCC 13' : 'Python'; }
    titleEl.textContent = labelFor(current);

    function resetOutput() {
      outputEl.textContent = 'Click ▶ Run to execute…';
      outputEl.classList.remove('code-runner-panel__output--error');
    }

    function switchTo(l) {
      if (originals[l] === undefined || l === current) return;
      if (cmEditor) edited[current] = cmEditor.getValue();
      current = l;
      titleEl.textContent = labelFor(l);
      if (langSwitch) langSwitch.setActive(l);
      if (cmEditor) {
        DSA.cdnLoader.setEditorLang(cmEditor, l);
        cmEditor.setValue(edited[l] !== undefined ? edited[l] : initialFor(l));
      }
      resetOutput();
      if (l === 'python') DSA.cdnLoader.warmup();
    }
    DSA.cdnLoader.lang.onChange(switchTo);

    function initialFor(l) {
      return l === 'python' ? DSA.cdnLoader.normalizeIndent(originals.python) : originals[l];
    }

    // Load CodeMirror then create editor
    loadCodeMirror(function(err) {
      if (err) {
        statusEl.textContent = 'Editor failed to load';
        return;
      }
      cmEditor = DSA.cdnLoader.makeEditor(editorWrap, initialFor(current), current);
      statusEl.textContent = 'Ready';
      if (current === 'python') DSA.cdnLoader.warmup(); // pre-load Pyodide in the worker
    });

    // Copy button (wired in code-block.js) copies what's in the editor now
    block.dsaGetCode = function() { return cmEditor ? cmEditor.getValue() : originals[current]; };

    runBtn.addEventListener('click', function() {
      if (current === 'c') runC(); else runPython();
    });

    resetBtn.addEventListener('click', function() {
      delete edited[current];
      if (cmEditor) cmEditor.setValue(initialFor(current));
      resetOutput();
    });

    function showError(status, msg) {
      statusEl.textContent = status;
      outputEl.textContent = msg;
      outputEl.classList.add('code-runner-panel__output--error');
    }

    function runPython() {
      var code = cmEditor ? DSA.cdnLoader.normalizeIndent(cmEditor.getValue()) : originals.python;

      statusEl.textContent = 'Running…';
      outputEl.classList.remove('code-runner-panel__output--error');
      outputEl.textContent = '';

      DSA.cdnLoader.runPython({ mode: 'free', code: code }, RUN_TIMEOUT_MS, function(data) {
        if (data.timeout) {
          showError('Timed out', '⏱ Stopped after ' + (RUN_TIMEOUT_MS / 1000) +
            's — your code may have an infinite loop.');
          return;
        }
        if (data.mode !== 'free') {
          // Transport / runtime-load failure (worker crashed or CDN blocked).
          showError('Error', 'Python runtime failed to load (about 10MB from cdn.jsdelivr.net). ' +
            'Check your network and try again.');
          return;
        }
        if (data.error) {
          showError('Error', DSA.cdnLoader.formatPyError(data.error));
          return;
        }
        var stdout = data.stdout || '';
        outputEl.textContent = stdout !== '' ? stdout : '(no output)';
        statusEl.textContent = 'Done';
      });
    }

    function runC() {
      var code = cmEditor ? cmEditor.getValue() : originals.c;
      statusEl.textContent = 'Compiling…';
      outputEl.classList.remove('code-runner-panel__output--error');
      outputEl.textContent = '';
      runBtn.disabled = true;

      DSA.cdnLoader.loadCHarness(function() { // only for its error formatter
        DSA.cdnLoader.runC(code, { timeoutMs: C_TIMEOUT_MS }, function(d) {
          runBtn.disabled = false;
          if (d.timeout) {
            showError('Timed out', '⏱ No answer from the compiler service after ' +
              (C_TIMEOUT_MS / 1000) + 's. Check your network and try again.');
            return;
          }
          if (d.error) {
            showError('Error', 'Could not reach the C compiler (godbolt.org): ' + d.error +
              '\nC code is compiled by Compiler Explorer’s public API, so it needs a network connection.');
            return;
          }
          if (d.compileError) {
            showError('Compile error', DSA.cdnLoader.formatCError(d.compileError));
            return;
          }
          var out = d.stdout || '';
          if (d.stderr) out += (out ? '\n' : '') + d.stderr;
          var exitMsg = d.timedOut ? 'Time limit exceeded — your code may have an infinite loop.' :
                        DSA.cdnLoader.describeExit(d.exitCode);
          if (exitMsg) {
            showError('Error', (out ? out + '\n\n' : '') + exitMsg);
            return;
          }
          outputEl.textContent = out !== '' ? out : '(no output)';
          statusEl.textContent = 'Done';
        });
      });
    }
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
