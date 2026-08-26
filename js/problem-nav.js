/* problem-nav.js — Injects a breadcrumb + progress strip + prev/next nav bar
 * above every problem page. Loaded dynamically by problem-renderer.js.
 *
 * Pattern: IIFE; exposes DSA.problemNav for debugging only.
 * Data source: localStorage cache first, then ../data/patterns.json.
 * Trigger: listens for dsa:problem-rendered; also checks dataset.problemId
 *          at load time in case the event already fired.
 */

var DSA = window.DSA || {};

(function () {
  'use strict';

  var PATTERNS_CACHE_KEY = 'dsa-patterns-cache-v1';
  var PROBLEMS_CACHE_KEY = 'dsa-sidebar-problems-cache-v1';

  // ── Utilities ──────────────────────────────────────────────────────────────

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readCache(key) {
    try {
      var r = localStorage.getItem(key);
      return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
  }

  function writeCache(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  function fetchJson(primaryUrl, fallbackUrl) {
    return fetch(primaryUrl).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).catch(function () {
      return fetch(fallbackUrl).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    });
  }

  // ── Data helpers ───────────────────────────────────────────────────────────

  /** Returns { pattern, index } for the given problemId, or null. */
  function findProblemPattern(patterns, problemId) {
    for (var i = 0; i < patterns.length; i++) {
      var idx = patterns[i].problems.indexOf(problemId);
      if (idx !== -1) return { pattern: patterns[i], index: idx };
    }
    return null;
  }

  function isSolved(id) {
    return !!(DSA.problemProgress && DSA.problemProgress.getStatus(id) === 'solved');
  }

  // ── Nav HTML builder ───────────────────────────────────────────────────────

  function buildNav(problemId, patterns, problemsArr) {
    var found = findProblemPattern(patterns, problemId);
    if (!found) return null;

    var pat   = found.pattern;
    var idx   = found.index;
    var total = pat.problems.length;

    // Build id → meta lookup from the problems array (for title + difficulty)
    var probMap = {};
    if (problemsArr) {
      problemsArr.forEach(function (p) { probMap[p.id] = p; });
    }

    var currentMeta  = probMap[problemId];
    var currentTitle = currentMeta ? currentMeta.title : problemId;
    var currentDiff  = currentMeta ? (currentMeta.difficulty || '').toLowerCase() : '';

    var prevId = idx > 0           ? pat.problems[idx - 1] : null;
    var nextId = idx < total - 1   ? pat.problems[idx + 1] : null;

    // Difficulty pill
    var diffHtml = currentDiff
      ? '<span class="diff-pill diff-pill--' + esc(currentDiff) + '" style="margin-left:6px">' +
        esc(currentDiff.charAt(0).toUpperCase() + currentDiff.slice(1)) + '</span>'
      : '';

    // Progress strip — one anchor segment per problem in the pattern
    var segmentsHtml = pat.problems.map(function (id, i) {
      var segTitle = (probMap[id] ? probMap[id].title : id);
      var cls = 'problem-nav__seg';
      if (i === idx)          cls += ' problem-nav__seg--current';
      else if (isSolved(id))  cls += ' problem-nav__seg--solved';
      return '<a href="' + esc(id) + '.html" class="' + cls + '" title="' + esc(segTitle) + '"></a>';
    }).join('');

    // Prev / Next buttons
    var prevHtml = prevId
      ? '<a href="' + esc(prevId) + '.html" class="problem-nav__btn problem-nav__btn--prev">← Prev</a>'
      : '<span class="problem-nav__btn problem-nav__btn--prev problem-nav__btn--disabled">← Prev</span>';
    var nextHtml = nextId
      ? '<a href="' + esc(nextId) + '.html" class="problem-nav__btn problem-nav__btn--next">Next →</a>'
      : '<span class="problem-nav__btn problem-nav__btn--next problem-nav__btn--disabled">Next →</span>';

    return '<div class="problem-nav">' +
        '<div class="problem-nav__breadcrumb">' +
          '<a href="../index.html">← Roadmap</a>' +
          '<span class="problem-nav__sep">›</span>' +
          '<a href="../index.html#pattern-' + esc(pat.id) + '">' + esc(pat.title) + '</a>' +
          '<span class="problem-nav__sep">›</span>' +
          '<span class="problem-nav__current">' + esc(currentTitle) + '</span>' +
          diffHtml +
        '</div>' +
        '<div class="problem-nav__strip-row">' +
          '<div class="problem-nav__strip">' + segmentsHtml + '</div>' +
          '<span class="problem-nav__label">' + (idx + 1) + ' of ' + total + '</span>' +
        '</div>' +
        '<div class="problem-nav__actions">' + prevHtml + nextHtml + '</div>' +
      '</div>';
  }

  // ── DOM injection ──────────────────────────────────────────────────────────

  function injectNav(problemId, patterns, problemsArr) {
    // Guard against double injection (e.g. cache hit + network response)
    if (document.querySelector('.problem-nav')) return;

    var html = buildNav(problemId, patterns, problemsArr);
    if (!html) return;

    // Inject before the first child of the problem content container
    var target = document.querySelector('.main__content--problem') ||
                 document.querySelector('.main__content');
    if (!target) return;

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    target.insertBefore(wrapper.firstChild, target.firstChild);
  }

  // ── Initialisation ─────────────────────────────────────────────────────────

  function init(problemId) {
    if (!problemId) return;

    // Fast path: serve from localStorage cache immediately so the nav appears
    // in the same paint as the rest of the page.
    var cachedPatterns = readCache(PATTERNS_CACHE_KEY);
    var cachedProblems = readCache(PROBLEMS_CACHE_KEY);

    if (cachedPatterns) {
      injectNav(problemId, cachedPatterns, cachedProblems);
    }

    // Background fetch — update caches and re-inject if not already injected.
    // We're inside problems/, so primary path is ../data/; fallback is data/.
    Promise.all([
      fetchJson('../data/patterns.json', 'data/patterns.json'),
      fetchJson('../data/problems.json', 'data/problems.json')
    ]).then(function (results) {
      writeCache(PATTERNS_CACHE_KEY, results[0]);
      writeCache(PROBLEMS_CACHE_KEY, results[1]);
      // injectNav guards against double injection internally
      injectNav(problemId, results[0], results[1]);
    }).catch(function () {
      // Nav bar is progressive enhancement — fail silently
    });
  }

  // ── Self-initialisation ────────────────────────────────────────────────────

  // Case 1: this script loaded BEFORE dsa:problem-rendered fired
  window.addEventListener('dsa:problem-rendered', function (e) {
    if (e.detail && e.detail.id) init(e.detail.id);
  });

  // Case 2: this script loaded AFTER dsa:problem-rendered already fired
  // (problem-renderer.js sets dataset.problemId before _renderAllSections)
  var earlyId = document.body && document.body.dataset.problemId;
  if (earlyId) init(earlyId);

  // Expose for debugging only — not called externally
  DSA.problemNav = { init: init };

  window.DSA = DSA;
})();
