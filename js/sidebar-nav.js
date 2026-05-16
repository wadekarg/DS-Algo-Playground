var DSA = window.DSA || {};

(function() {
  'use strict';

  // Category display order
  var categoryOrder = ['Data Structures', 'Sorting', 'Searching', 'Techniques'];

  // Category icons for sidebar section titles
  var categoryIcons = {
    'Data Structures': '',
    'Sorting': '',
    'Searching': '',
    'Techniques': ''
  };

  function getBasePath() {
    // Determine if we are inside topics/ or at root level
    var path = window.location.pathname;
    if (path.indexOf('/topics/') !== -1) {
      return '../';
    }
    return '';
  }

  function getTopicPath(url) {
    var base = getBasePath();
    return base + url;
  }

  function getCurrentTopicId() {
    return document.body.getAttribute('data-topic') || '';
  }

  function getCurrentPage() {
    var path = window.location.pathname;
    var filename = path.split('/').pop();
    return filename || 'index.html';
  }

  function getCurrentProblemId() {
    var path = window.location.pathname;
    var m = path.match(/\/problems\/([^/]+)\.html$/);
    return m ? m[1] : '';
  }

  // NeetCode 150 standard category ordering — matches problems.html
  var PROBLEM_CATEGORY_ORDER = [
    'Arrays & Hashing',
    'Two Pointers',
    'Sliding Window',
    'Stack',
    'Binary Search',
    'Linked List',
    'Trees',
    'Tries',
    'Heap / Priority Queue',
    'Backtracking',
    'Graphs',
    'Advanced Graphs',
    '1D DP',
    '2D DP',
    'Dynamic Programming',
    'Greedy',
    'Intervals',
    'Math & Geometry',
    'Bit Manipulation'
  ];

  var DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };

  // Persisted collapse state
  var STATE_KEY = 'dsa-sidebar-collapse-v2';
  function loadCollapseState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveCollapseState(state) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function chevron() {
    return '<svg class="sidebar__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  }

  function buildProblemsSection(problems, base, currentProblemId) {
    if (!problems || !problems.length) return '';

    // Group by neetcode_category
    var groups = {};
    for (var i = 0; i < problems.length; i++) {
      var p = problems[i];
      var cat = p.neetcode_category || (p.topics && p.topics[0]) || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    for (var c in groups) {
      groups[c].sort(function(a, b) {
        return (DIFF_ORDER[a.difficulty] || 9) - (DIFF_ORDER[b.difficulty] || 9);
      });
    }
    var knownCats = PROBLEM_CATEGORY_ORDER.filter(function(c) { return groups[c]; });
    var unknownCats = Object.keys(groups).filter(function(c) {
      return PROBLEM_CATEGORY_ORDER.indexOf(c) === -1;
    }).sort();
    var orderedCats = knownCats.concat(unknownCats);

    var state = loadCollapseState();
    // Default: top-level expanded if we're on a problems-related page; else collapsed
    var onProblemsPage = !!currentProblemId || getCurrentPage() === 'problems.html';
    var problemsOpen = state.problems !== undefined ? state.problems : onProblemsPage;

    // If the current page is a per-problem page, force-expand its category
    var currentCategory = null;
    if (currentProblemId) {
      for (var i2 = 0; i2 < problems.length; i2++) {
        if (problems[i2].id === currentProblemId) {
          currentCategory = problems[i2].neetcode_category || (problems[i2].topics && problems[i2].topics[0]) || 'Other';
          break;
        }
      }
    }

    var html = '<button type="button" class="sidebar__section-toggle' +
      (problemsOpen ? ' sidebar__section-toggle--open' : '') +
      '" data-collapse-key="problems">' +
      '<span>Problems</span>' + chevron() +
      '</button>';

    html += '<div class="sidebar__collapse-body' + (problemsOpen ? '' : ' sidebar__collapse-body--hidden') + '" data-collapse-body="problems">';

    html += '<a href="' + base + 'problems.html" class="sidebar__link sidebar__link--problems-index' +
      (getCurrentPage() === 'problems.html' ? ' sidebar__link--active' : '') +
      '">All Problems</a>';

    for (var k = 0; k < orderedCats.length; k++) {
      var cat = orderedCats[k];
      var catKey = 'cat:' + cat;
      var catOpen = state[catKey] !== undefined ? state[catKey] : (cat === currentCategory);

      html += '<button type="button" class="sidebar__subcat-toggle' +
        (catOpen ? ' sidebar__subcat-toggle--open' : '') +
        '" data-collapse-key="' + catKey.replace(/"/g, '&quot;') + '">' +
        '<span>' + cat + '</span>' +
        '<span class="sidebar__subcat-count">' + groups[cat].length + '</span>' +
        chevron() +
        '</button>';
      html += '<div class="sidebar__collapse-body sidebar__collapse-body--nested' +
        (catOpen ? '' : ' sidebar__collapse-body--hidden') +
        '" data-collapse-body="' + catKey.replace(/"/g, '&quot;') + '">';
      for (var j = 0; j < groups[cat].length; j++) {
        var prob = groups[cat][j];
        var status = (DSA.problemProgress && DSA.problemProgress.getStatus(prob.id)) || 'unattempted';
        var isActive = prob.id === currentProblemId;
        html += '<a href="' + base + 'problems/' + prob.id + '.html"' +
          ' class="sidebar__link sidebar__link--problem' +
          (isActive ? ' sidebar__link--active' : '') +
          '" title="' + prob.title.replace(/"/g, '&quot;') + '">' +
          '<span class="problem-status-dot ' + status + '"></span>' +
          '<span class="sidebar__link__title">' + prob.title + '</span>' +
          '</a>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function wireCollapse() {
    var nav = document.getElementById('sidebar-nav');
    if (!nav || nav.dataset.collapseWired === '1') return;
    nav.dataset.collapseWired = '1';
    nav.addEventListener('click', function(e) {
      var toggle = e.target.closest('.sidebar__section-toggle, .sidebar__subcat-toggle');
      if (!toggle) return;
      var key = toggle.dataset.collapseKey;
      var body = nav.querySelector('[data-collapse-body="' + key.replace(/"/g, '\\"') + '"]');
      if (!body) return;
      var openClass = toggle.classList.contains('sidebar__section-toggle')
        ? 'sidebar__section-toggle--open'
        : 'sidebar__subcat-toggle--open';
      var isOpen = toggle.classList.toggle(openClass);
      body.classList.toggle('sidebar__collapse-body--hidden', !isOpen);
      var state = loadCollapseState();
      state[key] = isOpen;
      saveCollapseState(state);
    });
  }

  function buildSidebar(topics, problems) {
    var nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    var base = getBasePath();
    var currentTopicId = getCurrentTopicId();
    var currentPage = getCurrentPage();
    var html = '';

    // Overview section
    html += '<div class="sidebar__section-title">Overview</div>';
    html += '<a href="' + base + 'index.html" class="sidebar__link' +
      (currentPage === 'index.html' && !currentTopicId ? ' sidebar__link--active' : '') +
      '">Home</a>';
    html += '<a href="' + base + 'complexity.html" class="sidebar__link' +
      (currentPage === 'complexity.html' ? ' sidebar__link--active' : '') +
      '">Complexity</a>';
    html += '<a href="' + base + 'compare.html" class="sidebar__link' +
      (currentPage === 'compare.html' ? ' sidebar__link--active' : '') +
      '">Compare</a>';
    html += '<a href="' + base + 'race.html" class="sidebar__link' +
      (currentPage === 'race.html' ? ' sidebar__link--active' : '') +
      '">Race</a>';
    html += '<a href="' + base + 'about.html" class="sidebar__link' +
      (currentPage === 'about.html' ? ' sidebar__link--active' : '') +
      '">About</a>';

    // Group topics by category
    var groups = {};
    for (var i = 0; i < topics.length; i++) {
      var t = topics[i];
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    }

    // Render by category order
    for (var c = 0; c < categoryOrder.length; c++) {
      var cat = categoryOrder[c];
      var items = groups[cat];
      if (!items || items.length === 0) continue;

      html += '<div class="sidebar__section-title">' + cat + '</div>';
      for (var j = 0; j < items.length; j++) {
        var topic = items[j];
        var isActive = topic.id === currentTopicId;
        html += '<a href="' + getTopicPath(topic.url) + '" class="sidebar__link' +
          (isActive ? ' sidebar__link--active' : '') +
          '" data-topic="' + topic.id + '">' + topic.title + '</a>';
      }
    }

    // Problems section (loaded async, may be empty if problems.json hasn't arrived yet)
    html += buildProblemsSection(problems, base, getCurrentProblemId());

    nav.innerHTML = html;
    wireCollapse();
  }

  function fetchJson(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
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

  function init() {
    var nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    var base = getBasePath();
    var topicsLoaded = null;
    var problemsLoaded = null;

    function renderIfReady() {
      // Render once topics has loaded; problems can fill in later (or never).
      if (topicsLoaded === null) return;
      buildSidebar(topicsLoaded || [], problemsLoaded || []);
      if (DSA.progress && DSA.progress.updateBadges) {
        DSA.progress.updateBadges();
      }
    }

    fetchJson(base + 'data/topics.json', function(err, data) {
      topicsLoaded = err ? [] : data;
      renderIfReady();
    });

    fetchJson(base + 'data/problems.json', function(err, data) {
      problemsLoaded = err ? [] : data;
      renderIfReady();
    });

    // Refresh sidebar problem dots when status changes (same tab) or across tabs.
    window.addEventListener('dsa:problem-progress-changed', renderIfReady);
    window.addEventListener('storage', renderIfReady);
  }

  DSA.sidebarNav = { init: init };
})();
