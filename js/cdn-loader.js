/* Shared loader for CodeMirror (self-hosted in /vendor/codemirror/) and
   Pyodide (still on cdn.jsdelivr.net because of its size). Used by
   practice.js and code-runner.js — both call DSA.cdnLoader.loadCodeMirror
   and DSA.cdnLoader.loadPyodide. */
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
  var PY_JS     = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
  var PY_INDEX  = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

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

  // --- Pyodide singleton ---
  var pyLoading = false;
  var pyCallbacks = [];

  function flushPy(err, py) {
    var cbs = pyCallbacks.slice(); pyCallbacks = [];
    for (var i = 0; i < cbs.length; i++) cbs[i](err, py);
  }

  function loadPyodide(callback) {
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

  DSA.cdnLoader = {
    loadCodeMirror: loadCodeMirror,
    loadPyodide: loadPyodide
  };
})();
