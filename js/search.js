var DSA = window.DSA || {};

(function() {
  'use strict';

  var topics = [];
  var input, resultsEl, focusedIndex = -1;

  function loadTopics() {
    var base = getBasePath();
    fetch(base + 'data/topics.json')
      .then(function(r) { return r.json(); })
      .then(function(data) { topics = data; })
      .catch(function() { topics = []; });
  }

  function getBasePath() {
    var path = window.location.pathname;
    if (path.indexOf('/topics/') !== -1 || path.indexOf('/problems/') !== -1) return '../';
    return '';
  }

  function tokenMatch(query, text) {
    var q = query.toLowerCase();
    var t = text.toLowerCase();
    return t.indexOf(q) !== -1;
  }

  function search(query) {
    if (!query || query.length < 1) return [];
    return topics.filter(function(t) {
      return tokenMatch(query, t.title) ||
             tokenMatch(query, t.category) ||
             (t.tags && t.tags.some(function(tag) { return tokenMatch(query, tag); }));
    });
  }

  function render(results) {
    if (!resultsEl) return;
    if (results.length === 0) {
      resultsEl.classList.remove('active');
      return;
    }
    var base = getBasePath();
    resultsEl.innerHTML = results.map(function(r, i) {
      return '<a class="search-result-item' + (i === focusedIndex ? ' search-result-item--focused' : '') +
             '" href="' + base + r.url + '">' +
             '<div><div class="search-result-item__title">' + escapeHtml(r.title) + '</div>' +
             '<div class="search-result-item__category">' + escapeHtml(r.category) + '</div></div></a>';
    }).join('');
    resultsEl.classList.add('active');
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function closeResults() {
    if (resultsEl) resultsEl.classList.remove('active');
    focusedIndex = -1;
  }

  function init() {
    input = document.querySelector('.search-input');
    resultsEl = document.querySelector('.search-results');
    if (!input) return;

    loadTopics();

    input.addEventListener('input', function() {
      focusedIndex = -1;
      var results = search(input.value.trim());
      render(results);
    });

    input.addEventListener('keydown', function(e) {
      var items = resultsEl ? resultsEl.querySelectorAll('.search-result-item') : [];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
        render(search(input.value.trim()));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedIndex = Math.max(focusedIndex - 1, 0);
        render(search(input.value.trim()));
      } else if (e.key === 'Enter' && focusedIndex >= 0 && items[focusedIndex]) {
        e.preventDefault();
        items[focusedIndex].click();
      } else if (e.key === 'Escape') {
        closeResults();
        input.blur();
      }
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.search-container')) {
        closeResults();
      }
    });
  }

  DSA.search = { init: init };
})();
