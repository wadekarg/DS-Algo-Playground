/* Shared front-end for the code editor and Python runtime, used by
   practice.js and code-runner.js:
     - loadCodeMirror / makeEditor — CodeMirror, self-hosted in /vendor/codemirror/
     - runPython / warmup          — Python via a Web Worker (js/pyodide-worker.js),
                                      so a runaway program can be terminated
     - normalizeIndent / formatPyError — editor + traceback helpers
   Pyodide itself still loads from cdn.jsdelivr.net (inside the worker) due to size. */
var DSA = window.DSA || {};

(function() {
  'use strict';

  if (DSA.cdnLoader) return; // singleton

  // --- Resolve vendored paths from any depth (root, /topics/, /problems/) ---
  function vendorPath(filename) {
    var p = window.location.pathname;
    var prefix = (p.indexOf('/topics/') !== -1 || p.indexOf('/problems/') !== -1) ? '../' : '';
    return prefix + 'vendor/codemirror/' + filename;
  }

  var CM_CSS    = vendorPath('codemirror.min.css');
  var CM_JS     = vendorPath('codemirror.min.js');
  var CM_PYTHON = vendorPath('python.min.js');
  var CM_CLOSE  = vendorPath('closebrackets.min.js');

  // --- Loader primitives ---
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

  // --- CodeMirror singleton ---
  var cmLoaded = false;
  var cmLoading = false;
  var cmCallbacks = [];

  function flushCm(err) {
    var cbs = cmCallbacks.slice(); cmCallbacks = [];
    for (var i = 0; i < cbs.length; i++) cbs[i](err);
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

  // --- Editor factory (shared soft-tab config) --------------------------
  // Python is whitespace-sensitive and Pyodide rejects mixed tabs/spaces with
  // TabError. CodeMirror inserts a literal \t on Tab by default, so we force
  // soft tabs (spaces) everywhere the editor is created.
  var INDENT = 4;

  function softTabKeys() {
    return {
      Tab: function(cm) {
        if (cm.somethingSelected()) { cm.indentSelection('add'); return; }
        var unit = cm.getOption('indentUnit') || INDENT;
        cm.replaceSelection(new Array(unit + 1).join(' '), 'end', '+input');
      },
      'Shift-Tab': function(cm) { cm.indentSelection('subtract'); },
      Backspace: function(cm) {
        if (cm.somethingSelected()) return window.CodeMirror.Pass;
        var cur = cm.getCursor();
        var before = cm.getLine(cur.line).slice(0, cur.ch);
        if (before.length && /^ +$/.test(before)) {
          var unit = cm.getOption('indentUnit') || INDENT;
          var del = before.length % unit || unit;
          cm.replaceRange('', { line: cur.line, ch: cur.ch - del }, cur, '+delete');
          return;
        }
        return window.CodeMirror.Pass;
      }
    };
  }

  function makeEditor(parent, value) {
    return window.CodeMirror(parent, {
      value: value || '',
      mode: 'python',
      theme: 'dracula',
      lineNumbers: true,
      indentUnit: INDENT,
      indentWithTabs: false,
      autoCloseBrackets: true,
      lineWrapping: false,
      viewportMargin: Infinity,
      extraKeys: softTabKeys()
    });
  }

  // Convert leading tabs to spaces (per line) so drafts saved before the
  // soft-tab fix, or pasted tab-indented code, run without TabError. Only
  // touches leading whitespace — tabs inside string literals are left alone.
  function normalizeIndent(code) {
    if (!code) return code;
    return String(code).split('\n').map(function(line) {
      var m = line.match(/^[ \t]+/);
      if (!m) return line;
      return m[0].replace(/\t/g, '    ') + line.slice(m[0].length);
    }).join('\n');
  }

  // Strip Pyodide/harness-internal frames from a traceback so the user sees
  // only their own code's frames + the final error, like a real interpreter.
  function formatPyError(raw) {
    if (!raw) return raw;
    var lines = String(raw).replace(/^PythonError:\s*/, '').split('\n');
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      var fm = ln.match(/^\s*File "([^"]*)"/);
      if (fm) {
        var isUser = fm[1] === '<your code>';
        var hasSrc = i + 1 < lines.length && /^\s/.test(lines[i + 1]) && !/^\s*File "/.test(lines[i + 1]);
        if (isUser) {
          out.push(ln);
          if (hasSrc) out.push(lines[++i]);
        } else if (hasSrc) {
          i++; // drop internal frame's source line too
        }
        continue;
      }
      out.push(ln);
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  // --- Pyodide Web Worker (off-main-thread execution + kill switch) ------
  // Static hosting (GitHub Pages) can't send COOP/COEP headers, so Pyodide's
  // SharedArrayBuffer interrupt isn't available. Running in a Worker lets us
  // terminate() a runaway/infinite-loop program and respawn a fresh runtime.
  function scriptPath(filename) {
    var p = window.location.pathname;
    var prefix = (p.indexOf('/topics/') !== -1 || p.indexOf('/problems/') !== -1) ? '../' : '';
    return prefix + 'js/' + filename;
  }

  var worker = null;
  var reqId = 0;
  var pending = {}; // id -> { cb, timer }
  var warmed = false; // whether a warmup message has pre-loaded the current worker

  function spawnWorker() {
    worker = new Worker(scriptPath('pyodide-worker.js'));
    worker.onmessage = function(e) {
      var d = e.data || {};
      var entry = pending[d.id];
      if (!entry) return;
      clearTimeout(entry.timer);
      delete pending[d.id];
      entry.cb(d);
    };
    worker.onerror = function(err) {
      var msg = (err && err.message) || 'Worker failed to start';
      killWorker(); // dead worker — force a fresh spawn on the next run
      rejectAll({ error: msg });
    };
  }

  function killWorker() {
    if (worker) { try { worker.terminate(); } catch (e) {} }
    worker = null;
    warmed = false; // respawned worker starts cold; allow a fresh warmup
  }

  function rejectAll(data) {
    var snapshot = pending;
    pending = {};
    for (var id in snapshot) {
      if (snapshot.hasOwnProperty(id)) {
        clearTimeout(snapshot[id].timer);
        snapshot[id].cb(Object.assign({ id: +id }, data));
      }
    }
  }

  // Run a payload in the worker with a timeout. On timeout, terminate the
  // wedged worker and respawn. cb gets the worker's data object, or
  // { timeout: true }, or { error: ... }.
  //
  // NOTE: there is a single shared worker, so runs are serialized. The Python
  // interpreter is single-threaded — an infinite loop in one run blocks any
  // other run queued behind it, so on timeout we terminate the whole worker
  // and every in-flight request resolves as timed out. In practice each page
  // has one active editor and users run one at a time, so this is fine; if
  // simultaneous multi-editor execution ever matters, give each a own worker.
  function runPython(payload, timeoutMs, cb) {
    if (!worker) spawnWorker();
    var id = ++reqId;
    payload.id = id;
    var timer = setTimeout(function() {
      if (!pending[id]) return;
      // Hand this request its timeout, then kill the wedged worker and time
      // out every stranded sibling too (they're stuck behind the same loop).
      delete pending[id];
      killWorker();
      rejectAll({ timeout: true });
      cb({ id: id, timeout: true });
    }, timeoutMs);
    pending[id] = { cb: cb, timer: timer };
    worker.postMessage(payload);
  }

  // Pre-load Pyodide in the worker so the first Run isn't a cold start. Safe to
  // call from every editor's init — the actual load happens once in the worker,
  // and this guard avoids redundant warmup messages on multi-block pages.
  function warmup() {
    if (warmed) return;
    warmed = true;
    runPython({ mode: 'warmup' }, 60000, function() {});
  }

  DSA.cdnLoader = {
    loadCodeMirror: loadCodeMirror,
    makeEditor: makeEditor,
    softTabKeys: softTabKeys,
    normalizeIndent: normalizeIndent,
    formatPyError: formatPyError,
    runPython: runPython,
    warmup: warmup,
    INDENT: INDENT
  };
})();
