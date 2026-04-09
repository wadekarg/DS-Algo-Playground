var DSA = window.DSA || {};

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    // Core modules
    if (DSA.theme) DSA.theme.init();
    if (DSA.sidebar) DSA.sidebar.init();
    if (DSA.sidebarNav) DSA.sidebarNav.init();
    if (DSA.search) DSA.search.init();
    if (DSA.progress) DSA.progress.init();
    if (DSA.keyboard) DSA.keyboard.init();

    // Topic page modules
    if (DSA.codeBlock) DSA.codeBlock.init();
    if (DSA.quiz) DSA.quiz.init();
    if (DSA.codeRunner) DSA.codeRunner.init();
    if (DSA.practice) DSA.practice.init();

    // Topic-specific visualizations
    if (DSA.arraysViz) DSA.arraysViz.init();
    if (DSA.linkedListsViz) DSA.linkedListsViz.init();
    if (DSA.bubbleSortViz) DSA.bubbleSortViz.init();
    if (DSA.binarySearchViz) DSA.binarySearchViz.init();
    if (DSA.stackViz) DSA.stackViz.init();
    if (DSA.queueViz) DSA.queueViz.init();
    if (DSA.selectionSortViz) DSA.selectionSortViz.init();
    if (DSA.insertionSortViz) DSA.insertionSortViz.init();
    if (DSA.bstViz) DSA.bstViz.init();
    if (DSA.mergeSortViz) DSA.mergeSortViz.init();
    if (DSA.quickSortViz) DSA.quickSortViz.init();
    if (DSA.hashTableViz) DSA.hashTableViz.init();
    if (DSA.heapViz) DSA.heapViz.init();
    if (DSA.bfsViz) DSA.bfsViz.init();
    if (DSA.dfsViz) DSA.dfsViz.init();
    if (DSA.twoPointersViz) DSA.twoPointersViz.init();
    if (DSA.slidingWindowViz) DSA.slidingWindowViz.init();
    if (DSA.dpViz) DSA.dpViz.init();
    if (DSA.recursionViz) DSA.recursionViz.init();
    if (DSA.complexityViz) DSA.complexityViz.init();
    if (DSA.compareViz) DSA.compareViz.init();
    if (DSA.raceViz) DSA.raceViz.init();

    // Scroll reveal animation
    initScrollReveal();
  });

  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    var elements = document.querySelectorAll('.reveal');
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    elements.forEach(function(el) { observer.observe(el); });
  }
})();
