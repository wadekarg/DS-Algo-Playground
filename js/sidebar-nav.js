var DSA = window.DSA || {};

(function () {
  'use strict';

  var TAB_KEY = 'dsa-sidebar-tab-v1';
  var TOPICS_CACHE_KEY   = 'dsa-sidebar-topics-cache-v1';
  var PATTERNS_CACHE_KEY = 'dsa-sidebar-patterns-cache-v1';

  // ── helpers ──────────────────────────────────────────────────────────────

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getBasePath() {
    var p = window.location.pathname;
    return (p.indexOf('/topics/') !== -1 || p.indexOf('/problems/') !== -1) ? '../' : '';
  }

  function getCurrentTopicId() {
    return document.body.getAttribute('data-topic') || '';
  }

  function isProblemsPage() {
    return window.location.pathname.indexOf('/problems/') !== -1;
  }

  function fetchJson(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        try { cb(null, JSON.parse(xhr.responseText)); }
        catch (e) { cb(e); }
      } else {
        cb(new Error('HTTP ' + xhr.status));
      }
    };
    xhr.send();
  }

  function readCache(key) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
  }

  function writeCache(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  // ── tab content builders ──────────────────────────────────────────────────

  function getSolvedCount(patternProblems) {
    if (!DSA.problemProgress) return 0;
    var count = 0;
    patternProblems.forEach(function (id) {
      if (DSA.problemProgress.getStatus(id) === 'solved') count++;
    });
    return count;
  }

  function buildRoadmapPanel(patterns) {
    var base = getBasePath();
    var html = '';
    patterns.forEach(function (pat) {
      var total = pat.problems.length;
      var solved = getSolvedCount(pat.problems);
      var complete = solved === total;
      html += '<a href="' + base + 'index.html#pattern-' + esc(pat.id) + '"' +
        ' class="sidebar-pattern-item" data-pattern="' + esc(pat.id) + '">' +
        '<span class="sidebar-pattern-item__name">' + esc(pat.title) + '</span>' +
        '<span class="sidebar-pattern-item__count' +
        (complete ? ' sidebar-pattern-item__count--complete' : '') + '">' +
        solved + '/' + total + (complete ? ' ✓' : '') +
        '</span></a>';
    });
    return html;
  }

  function buildTopicsPanel(topics) {
    var base = getBasePath();
    var catOrder = ['Data Structures', 'Sorting', 'Searching', 'Techniques'];
    var currentTopicId = getCurrentTopicId();
    var groups = {};
    topics.forEach(function (t) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    var html = '';
    catOrder.forEach(function (cat) {
      if (!groups[cat]) return;
      html += '<div class="sidebar__section-title">' + esc(cat) + '</div>';
      groups[cat].forEach(function (t) {
        var isActive = t.id === currentTopicId;
        html += '<a href="' + base + esc(t.url) + '"' +
          ' class="sidebar__link' + (isActive ? ' sidebar__link--active' : '') + '"' +
          ' data-topic="' + esc(t.id) + '">' +
          esc(t.title) + '</a>';
      });
    });
    return html;
  }

  function buildToolsPanel() {
    var base = getBasePath();
    var items = [
      { href: 'problems.html',   label: 'All Problems' },
      { href: 'complexity.html', label: 'Complexity Chart' },
      { href: 'compare.html',    label: 'Compare Algorithms' },
      { href: 'race.html',       label: 'Algorithm Race' },
      { href: 'about.html',      label: 'About' }
    ];
    var html = '';
    items.forEach(function (item) {
      html += '<a href="' + base + item.href + '" class="sidebar__link">' + esc(item.label) + '</a>';
    });
    return html;
  }

  // ── scaffold: inject tabs strip + panels into <nav id="sidebar-nav"> ──────

  function buildScaffold(nav) {
    nav.innerHTML =
      '<div class="sidebar-tabs">' +
        '<button class="sidebar-tab" data-sidebar-tab="roadmap">Roadmap</button>' +
        '<button class="sidebar-tab" data-sidebar-tab="topics">Topics</button>' +
        '<button class="sidebar-tab" data-sidebar-tab="tools">Tools</button>' +
      '</div>' +
      '<div class="snav-panel" data-sidebar-content="roadmap"></div>' +
      '<div class="snav-panel snav-panel--hidden" data-sidebar-content="topics"></div>' +
      '<div class="snav-panel snav-panel--hidden" data-sidebar-content="tools"></div>';
  }

  // ── tab switching ─────────────────────────────────────────────────────────

  function showTab(tabId) {
    ['roadmap', 'topics', 'tools'].forEach(function (t) {
      var btn   = document.querySelector('[data-sidebar-tab="' + t + '"]');
      var panel = document.querySelector('[data-sidebar-content="' + t + '"]');
      if (btn)   btn.classList.toggle('sidebar-tab--active', t === tabId);
      if (panel) panel.classList.toggle('snav-panel--hidden', t !== tabId);
    });
    try { localStorage.setItem(TAB_KEY, tabId); } catch (e) {}
  }

  function defaultTab() {
    // Respect saved preference first
    var saved;
    try { saved = localStorage.getItem(TAB_KEY); } catch (e) {}
    if (saved) return saved;
    // On topic pages default to topics tab
    if (getCurrentTopicId()) return 'topics';
    // On problem pages default to roadmap
    if (isProblemsPage()) return 'roadmap';
    return 'roadmap';
  }

  function wireTabButtons() {
    document.querySelectorAll('[data-sidebar-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showTab(btn.dataset.sidebarTab);
      });
    });
  }

  // ── count refresh (when problem status changes) ───────────────────────────

  function refreshCounts(patterns) {
    if (!patterns) return;
    patterns.forEach(function (pat) {
      var item = document.querySelector('[data-pattern="' + pat.id + '"]');
      if (!item) return;
      var countEl = item.querySelector('.sidebar-pattern-item__count');
      if (!countEl) return;
      var total  = pat.problems.length;
      var solved = getSolvedCount(pat.problems);
      var complete = solved === total;
      countEl.textContent = solved + '/' + total + (complete ? ' ✓' : '');
      countEl.classList.toggle('sidebar-pattern-item__count--complete', complete);
    });
  }

  // ── main render ───────────────────────────────────────────────────────────

  function render(patterns, topics) {
    var nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    // Ensure scaffold exists (idempotent: only build once)
    if (!nav.querySelector('.sidebar-tabs')) {
      buildScaffold(nav);
      wireTabButtons();
    }

    var roadmapPanel = nav.querySelector('[data-sidebar-content="roadmap"]');
    var topicsPanel  = nav.querySelector('[data-sidebar-content="topics"]');
    var toolsPanel   = nav.querySelector('[data-sidebar-content="tools"]');

    if (roadmapPanel && patterns) roadmapPanel.innerHTML = buildRoadmapPanel(patterns);
    if (topicsPanel  && topics)   topicsPanel.innerHTML  = buildTopicsPanel(topics);
    if (toolsPanel)               toolsPanel.innerHTML   = buildToolsPanel();

    showTab(defaultTab());

    if (DSA.progress && DSA.progress.updateBadges) {
      DSA.progress.updateBadges();
    }
  }

  // ── init ──────────────────────────────────────────────────────────────────

  function init() {
    var nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    var base = getBasePath();
    var patternsLoaded = readCache(PATTERNS_CACHE_KEY);
    var topicsLoaded   = readCache(TOPICS_CACHE_KEY);

    // Render immediately from cache if available (no flash of empty sidebar)
    if (patternsLoaded !== null || topicsLoaded !== null) {
      render(patternsLoaded || [], topicsLoaded || []);
    }

    // Background fetch — only re-render when data actually changed
    fetchJson(base + 'data/patterns.json', function (err, data) {
      if (err) {
        if (patternsLoaded === null) { patternsLoaded = []; render(patternsLoaded, topicsLoaded || []); }
        return;
      }
      var changed = JSON.stringify(patternsLoaded) !== JSON.stringify(data);
      if (changed) {
        patternsLoaded = data;
        writeCache(PATTERNS_CACHE_KEY, data);
        render(patternsLoaded, topicsLoaded || []);
      }
    });

    fetchJson(base + 'data/topics.json', function (err, data) {
      if (err) {
        if (topicsLoaded === null) { topicsLoaded = []; render(patternsLoaded || [], topicsLoaded); }
        return;
      }
      var changed = JSON.stringify(topicsLoaded) !== JSON.stringify(data);
      if (changed) {
        topicsLoaded = data;
        writeCache(TOPICS_CACHE_KEY, data);
        render(patternsLoaded || [], topicsLoaded);
      }
    });

    // Refresh solved counts when problem status changes (same tab or cross-tab)
    window.addEventListener('dsa:problem-progress-changed', function () {
      refreshCounts(patternsLoaded || []);
    });
    window.addEventListener('storage', function () {
      refreshCounts(patternsLoaded || []);
    });
  }

  DSA.sidebarNav = { init: init };
})();
