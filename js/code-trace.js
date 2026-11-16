var DSA = window.DSA || {};

(function() {
  'use strict';

  /**
   * Code Trace - Highlights code lines in sync with visualization steps.
   * Each viz step can carry optional `codeLine` (number) and `variables` (object).
   *
   * Usage:
   *   var trace = DSA.codeTrace.init('.my-code-trace');
   *   // On each viz step:
   *   DSA.codeTrace.highlightLine(trace, 3);
   *   DSA.codeTrace.showVariables(trace, { i: 0, j: 1, temp: 5 });
   */

  // A trace panel holds one <pre class="code-trace__code"> per language
  // (data-lang="python" | "c"). Step codeLine numbers refer to the Python
  // listing; the C listing carries data-line-map="1:1,3:4-5,..." translating
  // each Python line to the C line(s) that do the same work.
  function listings(container) {
    return container ? container.querySelectorAll('.code-trace__code') : [];
  }

  function wrapListing(codeEl) {
    // Already wrapped?
    if (codeEl.querySelector('.code-line')) return;

    var text = codeEl.textContent;
    var lines = text.split('\n');
    // Remove trailing empty line
    if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }

    codeEl.innerHTML = '';
    for (var i = 0; i < lines.length; i++) {
      var span = document.createElement('span');
      span.className = 'code-line';
      span.setAttribute('data-line', String(i + 1));
      span.textContent = lines[i];
      codeEl.appendChild(span);
    }
  }

  function wrapCodeLines(container) {
    var els = listings(container);
    for (var i = 0; i < els.length; i++) wrapListing(els[i]);
  }

  // "1:1,3:4-5" -> { 1: [1], 3: [4, 5] }
  function parseLineMap(codeEl) {
    if (codeEl._lineMap) return codeEl._lineMap;
    var map = null;
    var raw = codeEl.getAttribute('data-line-map');
    if (raw) {
      map = {};
      raw.split(',').forEach(function(pair) {
        var m = pair.trim().match(/^(\d+):(\d+)(?:-(\d+))?$/);
        if (!m) return;
        var from = +m[2], to = m[3] ? +m[3] : from, list = [];
        for (var k = from; k <= to; k++) list.push(k);
        map[+m[1]] = list;
      });
    }
    codeEl._lineMap = map;
    return map;
  }

  // Which line numbers of this listing correspond to Python line n?
  function linesFor(codeEl, n) {
    var map = parseLineMap(codeEl);
    if (map) return map[n] || [];
    // Unmapped non-Python listing: don't guess
    var lang = codeEl.getAttribute('data-lang');
    return (!lang || lang === 'python') ? [n] : [];
  }

  function highlightLine(container, lineNumber) {
    if (!container) return;
    var els = listings(container);
    for (var e = 0; e < els.length; e++) {
      var codeEl = els[e];
      var want = linesFor(codeEl, lineNumber);
      var lines = codeEl.querySelectorAll('.code-line');
      var first = null;
      for (var i = 0; i < lines.length; i++) {
        var on = want.indexOf(parseInt(lines[i].getAttribute('data-line'), 10)) !== -1;
        lines[i].classList.toggle('code-line--active', on);
        if (on && !first) first = lines[i];
      }
      // Scroll the active line into view inside its (scrollable) listing
      if (first && !codeEl.hidden) {
        var top = first.offsetTop - codeEl.offsetTop - codeEl.clientHeight / 2 + first.offsetHeight / 2;
        codeEl.scrollTop = Math.max(0, top);
      }
    }
  }

  function clearHighlight(container) {
    if (!container) return;
    var lines = container.querySelectorAll('.code-line--active');
    for (var i = 0; i < lines.length; i++) {
      lines[i].classList.remove('code-line--active');
    }
  }

  var previousVars = {};

  function showVariables(container, vars) {
    if (!container) return;
    var panel = container.querySelector('.code-trace__vars');
    if (!panel) {
      // Create panel
      panel = document.createElement('div');
      panel.className = 'code-trace__vars';
      container.appendChild(panel);
    }

    if (!vars || Object.keys(vars).length === 0) {
      panel.innerHTML = '<span class="code-trace__vars-title">Variables</span><span style="color:var(--text-tertiary);font-size:12px;">No active variables</span>';
      previousVars = {};
      return;
    }

    var html = '<span class="code-trace__vars-title">Variables</span>';
    var keys = Object.keys(vars);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = vars[k];
      var displayVal = (v === null || v === undefined) ? 'null' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
      var changed = previousVars[k] !== undefined && String(previousVars[k]) !== String(v);
      html += '<span class="code-trace__var' + (changed ? ' code-trace__var--changed' : '') + '">';
      html += '<span class="code-trace__var-name">' + k + '</span>';
      html += '<span class="code-trace__var-eq">=</span>';
      html += '<span class="code-trace__var-value">' + escapeHtml(displayVal) + '</span>';
      html += '</span>';
    }
    panel.innerHTML = html;

    // Store for change detection
    previousVars = {};
    for (var j = 0; j < keys.length; j++) {
      previousVars[keys[j]] = vars[keys[j]];
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Apply step data to code trace.
   * step should have optional .codeLine and .variables
   */
  function applyStep(container, step) {
    if (!container || !step) {
      clearHighlight(container);
      return;
    }
    if (step.codeLine) {
      highlightLine(container, step.codeLine);
    } else {
      clearHighlight(container);
    }
    if (step.variables) {
      showVariables(container, step.variables);
    }
  }

  function initContainer(selector) {
    var container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container) return null;
    wrapCodeLines(container);
    return container;
  }

  DSA.codeTrace = {
    init: initContainer,
    highlightLine: highlightLine,
    clearHighlight: clearHighlight,
    showVariables: showVariables,
    applyStep: applyStep
  };
})();
