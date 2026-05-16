var DSA = window.DSA || {};

(function() {
  'use strict';

  var STORAGE_KEY = 'dsa-problem-progress';
  var STATUSES = ['unattempted', 'attempted', 'solved'];

  function getData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function getStatus(id) {
    return getData()[id] || 'unattempted';
  }

  function setStatus(id, status) {
    if (STATUSES.indexOf(status) === -1) return;
    var data = getData();
    if (status === 'unattempted') {
      delete data[id];
    } else {
      data[id] = status;
    }
    saveData(data);
    window.dispatchEvent(new CustomEvent('dsa:problem-progress-changed', {
      detail: { id: id, status: status }
    }));
  }

  function getAll() {
    return getData();
  }

  function counts() {
    var data = getData();
    var solved = 0, attempted = 0;
    for (var k in data) {
      if (data[k] === 'solved') solved++;
      else if (data[k] === 'attempted') attempted++;
    }
    return { solved: solved, attempted: attempted };
  }

  DSA.problemProgress = {
    STATUSES: STATUSES,
    getStatus: getStatus,
    setStatus: setStatus,
    getAll: getAll,
    counts: counts
  };
})();
