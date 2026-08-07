var DSA = window.DSA || {};

(function () {
  'use strict';

  var TAB_KEY = 'dsa-sidebar-tab-v1';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getBasePath() {
    var p = window.location.pathname;
    return (p.indexOf('/topics/') !== -1 || p.indexOf('/problems/') !== -1) ? '../' : '';
  }

  function getSolvedCount(patternProblems) {
    if (!DSA.problemProgress) return 0;
    var count = 0;
    patternProblems.forEach(function (id) {
      if (DSA.problemProgress.getStatus(id) === 'solved') count++;
    });
    return count;
  }

  function buildRoadmapTab(patterns) {
    var base = getBasePath();
    var html = '';
    patterns.forEach(function (pat) {
      var total = pat.problems.length;
      var solved = getSolvedCount(pat.problems);
      var complete = solved === total;
      html += '<a href="' + base + 'index.html#pattern-' + esc(pat.id) + '"' +
        ' class="sidebar-pattern-item" data-pattern="' + esc(pat.id) + '">' +
        '<span class="sidebar-pattern-item__name">' + esc(pat.title) + '</span>' +
        '<span class="sidebar-pattern-item__count' + (complete ? ' sidebar-pattern-item__count--complete' : '') + '">' +
        solved + '/' + total + (complete ? ' ✓' : '') +
        '</span></a>';
    });
    return html;
  }

  function buildTopicsTab(topics) {
    var base = getBasePath();
    var catOrder = ['Data Structures', 'Sorting', 'Searching', 'Techniques'];
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
        html += '<a href="' + base + esc(t.url) + '" class="sidebar__link">' + esc(t.title) + '</a>';
      });
    });
    return html;
  }

  function buildToolsTab() {
    var base = getBasePath();
    var items = [
      { href: 'complexity.html', label: 'Complexity Chart' },
      { href: 'compare.html',    label: 'Compare Algorithms' },
      { href: 'race.html',       label: 'Algorithm Race' },
      { href: 'prereqs.html',    label: 'Prerequisites' },
      { href: 'about.html',      label: 'About' }
    ];
    return items.map(function (item) {
      return '<a href="' + base + item.href + '" class="sidebar__link">' + esc(item.label) + '</a>';
    }).join('');
  }

  function showTab(tabId) {
    ['roadmap', 'topics', 'tools'].forEach(function (t) {
      var btn = document.querySelector('[data-sidebar-tab="' + t + '"]');
      var panel = document.querySelector('[data-sidebar-content="' + t + '"]');
      if (btn) btn.classList.toggle('sidebar-tab--active', t === tabId);
      if (panel) panel.classList.toggle('sidebar-tab-content--hidden', t !== tabId);
    });
    try { localStorage.setItem(TAB_KEY, tabId); } catch (e) {}
  }

  function wirePatternClicks() {
    var nav = document.querySelector('[data-sidebar-content="roadmap"]');
    if (!nav) return;
    nav.addEventListener('click', function (e) {
      var item = e.target.closest('.sidebar-pattern-item');
      if (!item) return;
      e.preventDefault();
      var patId = item.dataset.pattern;
      var section = document.getElementById('pattern-' + patId);
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nav.querySelectorAll('.sidebar-pattern-item').forEach(function (el) {
        el.classList.toggle('sidebar-pattern-item--active', el === item);
      });
    });
  }

  function refreshCounts(patterns) {
    if (!patterns) return;
    patterns.forEach(function (pat) {
      var item = document.querySelector('[data-pattern="' + pat.id + '"]');
      if (!item) return;
      var countEl = item.querySelector('.sidebar-pattern-item__count');
      if (!countEl) return;
      var total = pat.problems.length;
      var solved = getSolvedCount(pat.problems);
      var complete = solved === total;
      countEl.textContent = solved + '/' + total + (complete ? ' ✓' : '');
      countEl.classList.toggle('sidebar-pattern-item__count--complete', complete);
    });
  }

  function init(patterns, topics) {
    // Render tab content
    var roadmapPanel = document.querySelector('[data-sidebar-content="roadmap"]');
    var topicsPanel  = document.querySelector('[data-sidebar-content="topics"]');
    var toolsPanel   = document.querySelector('[data-sidebar-content="tools"]');
    if (roadmapPanel) roadmapPanel.innerHTML = buildRoadmapTab(patterns);
    if (topicsPanel)  topicsPanel.innerHTML  = buildTopicsTab(topics);
    if (toolsPanel)   toolsPanel.innerHTML   = buildToolsTab();

    // Wire tab buttons
    document.querySelectorAll('[data-sidebar-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { showTab(btn.dataset.sidebarTab); });
    });

    wirePatternClicks();

    // Restore last active tab
    var saved = 'roadmap';
    try { saved = localStorage.getItem(TAB_KEY) || 'roadmap'; } catch (e) {}
    showTab(saved);

    // Refresh counts when problem status changes
    window.addEventListener('dsa:problem-progress-changed', function () {
      refreshCounts(patterns);
    });
  }

  DSA.sidebarTabs = { init: init, refreshCounts: refreshCounts };
})();
