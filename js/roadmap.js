var DSA = window.DSA || {};

(function () {
  'use strict';

  var PATTERNS_CACHE_KEY = 'dsa-patterns-cache-v1';
  var TOPICS_CACHE_KEY   = 'dsa-sidebar-topics-cache-v1';
  var PROBLEMS_CACHE_KEY = 'dsa-sidebar-problems-cache-v1';
  var COLLAPSE_KEY       = 'dsa-roadmap-collapse-v1';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function readCache(key) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function writeCache(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function getCollapseState() {
    try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || {}; } catch (e) { return {}; }
  }
  function setCollapseState(id, collapsed) {
    var state = getCollapseState();
    state[id] = collapsed;
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function buildProblemRow(problemId, probMeta, solved) {
    var title = probMeta ? probMeta.title : problemId;
    var diff  = probMeta ? (probMeta.difficulty || '').toLowerCase() : '';
    var lcId  = probMeta ? probMeta.leetcode_id : null;
    var rowClass = 'problem-row' + (solved ? ' problem-row--solved' : '');
    var checkInner = solved ? '&#x2713;' : '';
    var diffHtml = diff
      ? '<span class="diff-pill diff-pill--' + esc(diff) + '">' + esc(diff.charAt(0).toUpperCase() + diff.slice(1)) + '</span>'
      : '';
    var lcHtml = lcId ? '<span class="lc-chip">#' + esc(String(lcId)) + '</span>' : '';
    return '<a href="problems/' + esc(problemId) + '.html" class="' + rowClass + '">' +
      '<span class="problem-row__check">' + checkInner + '</span>' +
      '<span class="problem-row__title">' + esc(title) + '</span>' +
      diffHtml + lcHtml +
      '</a>';
  }

  function buildPatternSection(pattern, problemsMap) {
    var collapseState = getCollapseState();
    var collapsed = collapseState[pattern.id] === true;
    var total  = pattern.problems.length;
    var solved = 0;
    pattern.problems.forEach(function (id) {
      if (DSA.problemProgress && DSA.problemProgress.getStatus(id) === 'solved') solved++;
    });
    var complete = solved === total && total > 0;
    var countLabel = solved + '/' + total + (complete ? ' &#x2713;' : '');
    var sectionClass = 'pattern-section' + (collapsed ? ' pattern-section--collapsed' : '');
    var chevronSvg = '<svg class="pattern-section__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

    var rowsHtml = pattern.problems.map(function (id) {
      var meta    = problemsMap[id];
      var isSolved = DSA.problemProgress && DSA.problemProgress.getStatus(id) === 'solved';
      return buildProblemRow(id, meta, isSolved);
    }).join('');

    return '<div class="' + sectionClass + '" id="pattern-' + esc(pattern.id) + '" data-pattern-id="' + esc(pattern.id) + '">' +
      '<div class="pattern-section__header">' +
        '<span class="pattern-section__icon">' + esc(pattern.icon) + '</span>' +
        '<span class="pattern-section__title">' + esc(pattern.title) + '</span>' +
        '<span class="pattern-section__count' + (complete ? ' pattern-section__count--complete' : '') + '">' + countLabel + '</span>' +
        chevronSvg +
      '</div>' +
      '<div class="pattern-section__body">' + rowsHtml + '</div>' +
    '</div>';
  }

  function updateProgressBar(patterns) {
    var total = 0, solved = 0;
    patterns.forEach(function (pat) {
      total += pat.problems.length;
      pat.problems.forEach(function (id) {
        if (DSA.problemProgress && DSA.problemProgress.getStatus(id) === 'solved') solved++;
      });
    });
    var pct = total > 0 ? Math.round(100 * solved / total) : 0;
    var fill    = document.querySelector('.roadmap-progress-bar__fill');
    var countEl = document.querySelector('.roadmap-solved-count');
    var pctEl   = document.querySelector('.roadmap-solved-pct');
    if (fill)    fill.style.width = pct + '%';
    if (countEl) countEl.textContent = solved + '/' + total + ' solved';
    if (pctEl)   pctEl.textContent   = pct + '%';
  }

  function wireCollapseToggles() {
    var container = document.getElementById('roadmap-sections');
    if (!container) return;
    container.addEventListener('click', function (e) {
      var header = e.target.closest('.pattern-section__header');
      if (!header) return;
      var section = header.closest('.pattern-section');
      if (!section) return;
      var id = section.dataset.patternId;
      var isCollapsed = section.classList.toggle('pattern-section--collapsed');
      setCollapseState(id, isCollapsed);
    });
  }

  function render(patterns, topics, problemsArr) {
    // Build lookup map: problem id -> metadata
    var problemsMap = {};
    if (problemsArr) {
      problemsArr.forEach(function (p) { problemsMap[p.id] = p; });
    }

    // Render pattern sections
    var sectionsEl = document.getElementById('roadmap-sections');
    if (sectionsEl) {
      sectionsEl.innerHTML = patterns.map(function (pat) {
        return buildPatternSection(pat, problemsMap);
      }).join('');
      wireCollapseToggles();
    }

    // Update progress bar widgets
    updateProgressBar(patterns);

    // Init sidebar tabs (Task 3 interface)
    if (DSA.sidebarTabs) DSA.sidebarTabs.init(patterns, topics || []);
  }

  function init() {
    var sectionsEl = document.getElementById('roadmap-sections');
    if (!sectionsEl) return; // not on roadmap page — no-op

    // Show cached data immediately if available
    var cachedPatterns = readCache(PATTERNS_CACHE_KEY);
    var cachedTopics   = readCache(TOPICS_CACHE_KEY);
    var cachedProblems = readCache(PROBLEMS_CACHE_KEY);
    if (cachedPatterns) render(cachedPatterns, cachedTopics, cachedProblems);

    // Fetch fresh data in background; update cache and re-render when ready
    var fetches = [
      fetchJson('data/patterns.json'),
      fetchJson('data/topics.json'),
      fetchJson('data/problems.json')
    ];
    Promise.all(fetches).then(function (results) {
      var patterns = results[0];
      var topics   = results[1];
      var problems = results[2];
      writeCache(PATTERNS_CACHE_KEY, patterns);
      writeCache(TOPICS_CACHE_KEY,   topics);
      writeCache(PROBLEMS_CACHE_KEY, problems);
      render(patterns, topics, problems);
    }).catch(function (err) {
      // Only show error when there is no cached fallback
      if (!cachedPatterns) {
        var el = document.getElementById('roadmap-sections');
        if (el) el.innerHTML = '<p style="padding:2rem;color:var(--accent-danger)">Failed to load roadmap data.</p>';
      }
    });

    // Re-render when the user marks a problem solved/attempted elsewhere
    window.addEventListener('dsa:problem-progress-changed', function () {
      var patterns = readCache(PATTERNS_CACHE_KEY);
      var topics   = readCache(TOPICS_CACHE_KEY);
      var problems = readCache(PROBLEMS_CACHE_KEY);
      if (patterns) render(patterns, topics, problems);
    });
  }

  DSA.roadmap = { init: init };
})();
