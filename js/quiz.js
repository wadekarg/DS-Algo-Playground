var DSA = window.DSA || {};

(function() {
  'use strict';

  function initQuiz(quizEl) {
    var topicId = document.body.getAttribute('data-topic');
    var questions = Array.prototype.slice.call(quizEl.querySelectorAll('.quiz__question'));
    var submitBtn = quizEl.querySelector('.quiz__submit');
    var retryBtn  = quizEl.querySelector('.quiz__retry');
    var scoreEl   = quizEl.querySelector('.quiz__score');
    var answered  = {};
    var submitted = false;
    var current   = 0;
    var total     = questions.length;

    // ── Build carousel shell ────────────────────────────────────────
    // Wrap the question list in a viewport + add nav controls
    var viewport = document.createElement('div');
    viewport.className = 'quiz__viewport';

    var track = document.createElement('div');
    track.className = 'quiz__track';

    // Move all question elements into the track
    questions.forEach(function(q) {
      q.classList.add('quiz__slide');
      track.appendChild(q);
    });
    viewport.appendChild(track);

    // Insert viewport before .quiz__actions
    var actions = quizEl.querySelector('.quiz__actions');
    quizEl.insertBefore(viewport, actions);

    // Nav bar: ← counter →  +  Submit / Retry / Score
    var nav = document.createElement('div');
    nav.className = 'quiz__nav';

    var prevBtn = document.createElement('button');
    prevBtn.className = 'quiz__nav-btn';
    prevBtn.setAttribute('aria-label', 'Previous question');
    prevBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="15,4 7,12 15,20"/></svg>';

    var counter = document.createElement('span');
    counter.className = 'quiz__nav-counter';

    var nextBtn = document.createElement('button');
    nextBtn.className = 'quiz__nav-btn';
    nextBtn.setAttribute('aria-label', 'Next question');
    nextBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="9,4 17,12 9,20"/></svg>';

    nav.appendChild(prevBtn);
    nav.appendChild(counter);
    nav.appendChild(nextBtn);
    quizEl.insertBefore(nav, actions);

    // ── Slide to question i ──────────────────────────────────────────
    function goTo(i, dir) {
      if (i < 0 || i >= total) return;

      // Animate: slide current out, new one in
      var outQ = questions[current];
      var inQ  = questions[i];

      outQ.classList.add(dir > 0 ? 'quiz__slide--exit-left' : 'quiz__slide--exit-right');
      inQ.classList.add(dir > 0 ? 'quiz__slide--enter-right' : 'quiz__slide--enter-left');
      inQ.classList.add('quiz__slide--active');

      // After transition, clean up classes
      setTimeout(function() {
        outQ.classList.remove('quiz__slide--active', 'quiz__slide--exit-left', 'quiz__slide--exit-right');
        inQ.classList.remove('quiz__slide--enter-right', 'quiz__slide--enter-left');
      }, 320);

      current = i;
      updateNav();
    }

    function updateNav() {
      counter.textContent = (current + 1) + ' / ' + total;

      // Dot per question showing answered/unanswered state
      counter.innerHTML = '';
      for (var d = 0; d < total; d++) {
        var dot = document.createElement('span');
        dot.className = 'quiz__dot' +
          (d === current ? ' quiz__dot--current' : '') +
          (answered[d] !== undefined ? ' quiz__dot--answered' : '');
        (function(idx) {
          dot.addEventListener('click', function() {
            if (idx !== current) goTo(idx, idx > current ? 1 : -1);
          });
        })(d);
        counter.appendChild(dot);
      }

      prevBtn.disabled = (current === 0);
      nextBtn.disabled = (current === total - 1);

      // Show Submit only on last question (or if all answered)
      var allAnswered = Object.keys(answered).length === total;
      if (submitBtn) {
        submitBtn.style.display = (!submitted && (current === total - 1 || allAnswered)) ? 'inline-flex' : 'none';
      }
    }

    // Show first slide
    questions[0].classList.add('quiz__slide--active');
    updateNav();

    // ── Nav button handlers ──────────────────────────────────────────
    prevBtn.addEventListener('click', function() { goTo(current - 1, -1); });
    nextBtn.addEventListener('click', function() { goTo(current + 1,  1); });

    // ── Option selection ─────────────────────────────────────────────
    questions.forEach(function(q, qi) {
      var options = q.querySelectorAll('.quiz__option');
      options.forEach(function(opt) {
        opt.addEventListener('click', function() {
          if (submitted) return;
          options.forEach(function(o) { o.classList.remove('quiz__option--selected'); });
          opt.classList.add('quiz__option--selected');
          answered[qi] = opt.getAttribute('data-value');
          updateNav();
          // Auto-advance to next question after a short pause
          if (qi < total - 1) {
            setTimeout(function() { goTo(qi + 1, 1); }, 400);
          }
        });
      });
    });

    // ── Submit ───────────────────────────────────────────────────────
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        if (submitted) return;
        submitted = true;
        var score = 0;

        questions.forEach(function(q, qi) {
          var correct = q.getAttribute('data-answer');
          var options = q.querySelectorAll('.quiz__option');
          var explanation = q.querySelector('.quiz__explanation');

          options.forEach(function(opt) {
            if (opt.getAttribute('data-value') === correct) {
              opt.classList.add('quiz__option--correct');
            }
            if (opt.classList.contains('quiz__option--selected') && opt.getAttribute('data-value') !== correct) {
              opt.classList.add('quiz__option--incorrect');
            }
          });

          if (answered[qi] === correct) score++;
          if (explanation) explanation.classList.add('visible');
        });

        if (scoreEl) {
          var pct = Math.round(100 * score / total);
          scoreEl.textContent = score + ' / ' + total + ' (' + pct + '%)';
          scoreEl.style.display = 'inline';
        }

        submitBtn.style.display = 'none';
        if (retryBtn) retryBtn.style.display = 'inline-flex';

        if (topicId && DSA.progress) {
          DSA.progress.saveQuizScore(topicId, score, total);
        }
      });
    }

    // ── Retry ────────────────────────────────────────────────────────
    if (retryBtn) {
      retryBtn.addEventListener('click', function() {
        submitted = false;
        answered  = {};
        questions.forEach(function(q) {
          var options = q.querySelectorAll('.quiz__option');
          options.forEach(function(opt) {
            opt.classList.remove('quiz__option--selected', 'quiz__option--correct', 'quiz__option--incorrect');
          });
          var explanation = q.querySelector('.quiz__explanation');
          if (explanation) explanation.classList.remove('visible');
        });
        if (scoreEl) scoreEl.style.display = 'none';
        if (retryBtn) retryBtn.style.display = 'none';
        goTo(0, -1);
        updateNav();
        if (submitBtn) submitBtn.style.display = 'none';
      });
    }
  }

  function init() {
    var quizzes = document.querySelectorAll('.quiz');
    quizzes.forEach(initQuiz);
  }

  DSA.quiz = { init: init };
})();
