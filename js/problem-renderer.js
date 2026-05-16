/* problem-renderer.js — Renders per-problem pages from data/problems.json.
 *
 * Usage: a problem page has slot divs and at the bottom:
 *   <script src="../js/problem-renderer.js"></script>
 *   <script>renderProblem('two-sum');</script>
 *
 * Slot conventions (data-section attribute on a <div>):
 *   topbar              — title, badges, external links
 *   problem-statement   — summary + constraints
 *   examples            — examples grid
 *   interview-tips      — collapsible interview tips card
 *   faang-tips          — collapsible FAANG section
 *   approaches          — collapsible approaches walkthrough
 *   practice-editor     — practice-block (code editor with tests)
 *   related-problems    — related problems list
 */

let _problemsCache = null;
const PROBLEMS_CACHE_KEY = 'dsa-sidebar-problems-cache-v1';

function _readCacheSync() {
  try {
    const raw = localStorage.getItem(PROBLEMS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function _writeCacheSync(data) {
  try { localStorage.setItem(PROBLEMS_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
  // Notify other modules in this tab. `storage` event only fires cross-tab,
  // so without this the sidebar wouldn't see fresh data until next page load.
  try {
    window.dispatchEvent(new CustomEvent('dsa:problems-cache-updated'));
  } catch (e) {}
}

async function _fetchProblems() {
  const tryFetch = async (paths) => {
    for (const p of paths) {
      try {
        const r = await fetch(p);
        if (r.ok) return r.json();
      } catch (e) { /* try next */ }
    }
    throw new Error('Could not load: ' + paths.join(' or '));
  };
  return tryFetch(['../data/problems.json', 'data/problems.json']);
}

function _renderAllSections(prob, all) {
  renderTopbar(prob);
  renderProblemStatement(prob);
  renderExamples(prob);
  renderInterviewTips(prob);
  renderFaangTips(prob);
  renderApproaches(prob);
  renderPracticeEditor(prob);
  renderTestCases(prob);
  renderRelatedProblems(prob, all);
}

/**
 * Top-level entry point — renders synchronously from localStorage cache when
 * available so the page appears in one paint; refreshes from the network in
 * the background and re-renders only if the data changed.
 * @param {string} problemId  e.g. 'two-sum'
 */
function renderProblem(problemId) {
  // 1) Try synchronous render from cache (avoids the empty-page flash).
  const cached = _readCacheSync();
  let renderedFromCache = false;
  if (cached) {
    _problemsCache = cached;
    const prob = cached.find(p => p.id === problemId);
    if (prob) {
      _renderAllSections(prob, cached);
      renderedFromCache = true;
    }
  }

  // 2) Background fetch — refresh cache, re-render only if data changed
  // (or if there was no cache to begin with).
  _fetchProblems().then(all => {
    _writeCacheSync(all);
    if (!renderedFromCache) {
      _problemsCache = all;
      const prob = all.find(p => p.id === problemId);
      if (!prob) {
        console.error(`renderProblem: problem not found: ${problemId}`);
        return;
      }
      _renderAllSections(prob, all);
    } else if (cached && _problemsChanged(cached, all)) {
      _problemsCache = all;
      const prob = all.find(p => p.id === problemId);
      if (prob) _renderAllSections(prob, all);
    }
  }).catch(err => {
    if (!renderedFromCache) console.error(err);
  });
}

/**
 * Cheap deep-ish compare: short-circuit on length, then on id-fingerprint,
 * then JSON.stringify only on the few problems whose ids match. Avoids
 * round-tripping ~600KB of JSON on every problem page just to detect
 * that nothing changed.
 */
function _problemsChanged(a, b) {
  if (a === b) return false;
  if (!a || !b) return true;
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (!a[i] || !b[i] || a[i].id !== b[i].id) return true;
  }
  // Same ids in same order — compare bodies. (Rare to reach here.)
  return JSON.stringify(a) !== JSON.stringify(b);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escape <, >, & in text that will appear inside HTML attributes or content. */
function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Heuristic: is this Big-O expression "good" (worth a green badge)?
 * Good:  O(1), O(log n), O(n), O(n log n), O(n+m), O(n*m), O(k log n).
 * Bad:   O(n²), O(n^2), O(2^n), O(n!), O(n^3), O(m^n).
 */
function _isGoodComplexity(expr) {
  const e = expr.toLowerCase().replace(/\s/g, '');
  // Quadratic-or-worse polynomial: variable raised to a power ≥ 2.
  // Matches n^2, n², n^3, m^2, etc. — but NOT n*n (handled below) or n*log(...).
  if (/[a-z][\^²³]/.test(e)) return false;
  if (/[a-z]\^[2-9]/.test(e)) return false;
  // Exponential: 2^n, base^var.
  if (/[0-9]\^[a-z]/.test(e) || /[a-z]\^[a-z]/.test(e)) return false;
  // Factorial.
  if (/[a-z]!/.test(e)) return false;
  // Same variable multiplied by itself: n*n, m*m.
  if (/([a-z])\*\1\b/.test(e)) return false;
  return true;
}

/** Build pill HTML for a single frequency tag. */
function _freqPill(tag) {
  return `<span class="pill pill-${_esc(tag)}">${_esc(tag.replace(/-/g, ' '))}</span>`;
}

// ─── Section render functions ─────────────────────────────────────────────────

/**
 * Renders the top bar: breadcrumbs, title, meta pills, and external links.
 */
function renderTopbar(prob) {
  const slot = document.querySelector('[data-section="topbar"]');
  if (!slot) return;

  const diffPill = `<span class="pill pill-${_esc(prob.difficulty)}">${_esc(prob.difficulty)}</span>`;
  const categoryPill = `<span class="pill pill-pattern">${_esc(prob.neetcode_category)}</span>`;
  const patternPills = (prob.patterns || []).map(p =>
    `<span class="pill pill-pattern">${_esc(p.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '))}</span>`
  ).join('');
  const freqPills = (prob.frequency_tags || []).map(_freqPill).join('');

  // Build topic links for the "back" area — link to topics derived from the topics array.
  // The primary topic link appears in ext-links. Use first topic as primary, or fall back.
  const primaryTopic = (prob.topics && prob.topics[0]) || null;
  const topicLinkHtml = primaryTopic ? `
    <a href="../topics/${_esc(primaryTopic)}.html">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      ${_esc(prob.neetcode_category)}
    </a>` : '';

  slot.innerHTML = `
    <div class="breadcrumbs" style="font-size:12px;">
      <a href="../index.html">Home</a>
      <span class="breadcrumbs__sep">/</span>
      <a href="../problems.html">Problems</a>
      <span class="breadcrumbs__sep">/</span>
      <span>${_esc(prob.title)}</span>
    </div>
    <div class="problem-title-row">
      <h1>${_esc(prob.title)}</h1>
      <div class="problem-meta-pills">
        ${diffPill}
        ${categoryPill}
        ${patternPills}
        ${freqPills}
      </div>
      <div class="problem-ext-links">
        <a href="${_esc(prob.leetcode_url)}" target="_blank" rel="noopener">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          LeetCode
        </a>
        ${topicLinkHtml}
        <a href="../problems.html">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          All Problems
        </a>
      </div>
    </div>
    <div class="problem-progress-row" data-problem-id="${_esc(prob.id)}">
      <span class="problem-progress-label">My status:</span>
      <button class="progress-chip" data-status="unattempted" title="Mark as not yet attempted">
        <span class="progress-chip__dot dot-unattempted"></span> Unattempted
      </button>
      <button class="progress-chip" data-status="attempted" title="In progress / partially solved">
        <span class="progress-chip__dot dot-attempted"></span> Attempted
      </button>
      <button class="progress-chip" data-status="solved" title="Fully solved on my own">
        <span class="progress-chip__dot dot-solved"></span> Solved
      </button>
    </div>
  `;

  _wireProgressChips(prob.id);
}

function _wireProgressChips(problemId) {
  var row = document.querySelector('.problem-progress-row[data-problem-id="' + problemId + '"]');
  if (!row || !window.DSA || !window.DSA.problemProgress) return;

  var current = window.DSA.problemProgress.getStatus(problemId);
  function paint(status) {
    row.querySelectorAll('.progress-chip').forEach(function(c) {
      c.classList.toggle('active', c.dataset.status === status);
    });
  }
  paint(current);

  row.addEventListener('click', function(e) {
    var chip = e.target.closest('.progress-chip');
    if (!chip) return;
    var newStatus = chip.dataset.status;
    window.DSA.problemProgress.setStatus(problemId, newStatus);
    paint(newStatus);
  });
}

/**
 * Renders the problem statement card: summary paragraphs + constraints list.
 */
function renderProblemStatement(prob) {
  const slot = document.querySelector('[data-section="problem-statement"]');
  if (!slot) return;

  const paragraphs = (prob.summary || '')
    .split('\n')
    .filter(s => s.trim())
    .map(s => `<p>${_esc(s)}</p>`)
    .join('');

  const constraintItems = (prob.constraints || [])
    .map(c => `<li>${_esc(c)}</li>`)
    .join('');

  slot.innerHTML = `
    <div class="ps-section">
      <div class="ps-section__title">Problem</div>
      <div class="problem-statement">
        ${paragraphs}
        <div class="problem-constraints">
          <div class="problem-constraints__label">Constraints</div>
          <ul>${constraintItems}</ul>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the examples section: numbered cards with input / output / explanation.
 */
function renderExamples(prob) {
  const slot = document.querySelector('[data-section="examples"]');
  if (!slot) return;

  const cards = (prob.examples || []).map((ex, i) => {
    const explanationHtml = ex.explanation
      ? `<div class="example-row__explanation">${_esc(ex.explanation)}</div>`
      : '';
    return `
      <div class="example-row">
        <div class="example-row__num">Example ${i + 1}</div>
        <div class="example-row__io">
          <span><span class="io-label">Input: </span><span class="io-value">${_esc(ex.input)}</span></span>
          <span><span class="io-label">Output: </span><span class="io-value">${_esc(ex.output)}</span></span>
        </div>
        ${explanationHtml}
      </div>
    `;
  }).join('');

  slot.innerHTML = `
    <div class="ps-section">
      <div class="ps-section__title">Examples</div>
      <div class="examples-list">${cards}</div>
    </div>
  `;
}

/**
 * Renders the collapsible "Interview Tips" <details> card.
 * Contains: talk_through_it, clarifying_questions, think_out_loud, edge_cases, common_mistakes.
 */
function renderInterviewTips(prob) {
  const slot = document.querySelector('[data-section="interview-tips"]');
  if (!slot) return;

  const tips = prob.interview_tips || {};

  // Talk through it
  const talkBlock = tips.talk_through_it ? `
    <div class="tip-block">
      <div class="tip-block__head">&#128483; Talk through it</div>
      <p class="tip-block__text">${_esc(tips.talk_through_it)}</p>
    </div>` : '';

  // Clarifying questions as <dl>
  const clarifyItems = (tips.clarifying_questions || []).map(cq => `
    <dt>${_esc(cq.question)}</dt>
    <dd><em>Why:</em> ${_esc(cq.why)}</dd>
  `).join('');
  const clarifyBlock = clarifyItems ? `
    <div class="tip-block">
      <h4>&#10067; Clarifying questions <span style="font-weight:400;color:var(--text-secondary);font-size:13px;">(and why we ask each)</span></h4>
      <dl class="clarify-list">${clarifyItems}</dl>
    </div>` : '';

  // Think out loud
  const thinkBlock = tips.think_out_loud ? `
    <div class="tip-block">
      <div class="tip-block__head">&#129504; Think out loud</div>
      <p class="tip-block__text">${_esc(tips.think_out_loud)}</p>
    </div>` : '';

  // Edge cases as <dl>
  const edgeCaseItems = (tips.edge_cases || []).map(ec => `
    <dt>${_esc(ec.category)}</dt>
    <dd>${_esc(ec.details)}</dd>
  `).join('');
  const edgeCasesBlock = edgeCaseItems ? `
    <div class="tip-block">
      <h4>&#127919; How to think about edge cases</h4>
      <p style="margin: 6px 0 8px 0; font-size: 13px;">Before you say "I'm done," walk through these categories. For each, ask: <em>does my code handle this gracefully?</em></p>
      <dl class="clarify-list">${edgeCaseItems}</dl>
    </div>` : '';

  // Common mistakes as <ul>
  const mistakeItems = (tips.common_mistakes || []).map(m => `<li>${_esc(m)}</li>`).join('');
  const mistakesBlock = mistakeItems ? `
    <div class="tip-block">
      <div class="tip-block__head">&#9888; Common mistakes</div>
      <ul>${mistakeItems}</ul>
    </div>` : '';

  slot.innerHTML = `
    <div class="ps-section">
      <div class="ps-section__title">Interview Tips</div>
      <details class="interview-tips">
        <summary class="interview-tips__toggle">
          <span class="toggle-icon">&#9654;</span>
          How to ace this in an interview
          <span class="tip-badge">Expand</span>
        </summary>
        <div class="interview-tips__body">
          ${talkBlock}
          ${clarifyBlock}
          ${thinkBlock}
          ${mistakesBlock}
          ${edgeCasesBlock}
        </div>
      </details>
    </div>
  `;
}

/**
 * Renders the collapsible FAANG tips <details> card.
 * Contains: introduction + context, really_testing, rubric, playbook, dont_do.
 */
function renderFaangTips(prob) {
  const slot = document.querySelector('[data-section="faang-tips"]');
  if (!slot) return;

  const faang = prob.faang || {};

  // Introduction block
  const introBlock = (faang.introduction || faang.introduction_context) ? `
    <div class="tip-block">
      <h4>&#128203; How they introduce it</h4>
      ${faang.introduction ? `<p style="margin: 6px 0 0 0; font-size: 13px; font-style: italic; color: var(--text-secondary);">${_esc(faang.introduction)}</p>` : ''}
      ${faang.introduction_context ? `<p style="margin: 8px 0 0 0; font-size: 13px;">${_esc(faang.introduction_context)}</p>` : ''}
    </div>` : '';

  // What they're really testing
  const testingItems = (faang.really_testing || []).map(t => `<li>${_esc(t)}</li>`).join('');
  const testingBlock = testingItems ? `
    <div class="tip-block">
      <h4>&#127919; What they're really testing</h4>
      <ul>${testingItems}</ul>
    </div>` : '';

  // Grading rubric as <dl>
  const rubricItems = (faang.rubric || []).map(r => `
    <dt style="color: ${_esc(r.color || '')}">${_esc(r.tier)}</dt>
    <dd>${_esc(r.criteria)}</dd>
  `).join('');
  const rubricBlock = rubricItems ? `
    <div class="tip-block">
      <h4>&#128202; The unofficial grading rubric</h4>
      <dl class="clarify-list">${rubricItems}</dl>
    </div>` : '';

  // Playbook as <ol>
  const playSteps = (faang.playbook || []).map(step => `<li>${_esc(step)}</li>`).join('');
  const playMetaHtml = faang.playbook_meta
    ? `<p style="margin-top: 10px; font-size: 13px; color: var(--text-secondary);">${_esc(faang.playbook_meta)}</p>`
    : '';
  const playbookBlock = playSteps ? `
    <div class="tip-block">
      <h4>&#127908; How to ace it (the ${(faang.playbook || []).length}-step playbook)</h4>
      <ol style="margin: 6px 0 0 0; padding-left: 20px; font-size: 13px; line-height: 1.7;">${playSteps}</ol>
      ${playMetaHtml}
    </div>` : '';

  // Don't do list
  const dontItems = (faang.dont_do || []).map(d => `<li>${_esc(d)}</li>`).join('');
  const dontBlock = dontItems ? `
    <div class="tip-block">
      <h4>&#128683; What NOT to do</h4>
      <ul>${dontItems}</ul>
    </div>` : '';

  slot.innerHTML = `
    <details class="interview-tips faang-tips">
      <summary class="interview-tips__head">
        <span>&#127970; How FAANG interviews this</span>
        <span class="interview-tips__hint">expand for grading rubric + how to ace it</span>
      </summary>
      <div class="interview-tips__body">
        ${introBlock}
        ${testingBlock}
        ${rubricBlock}
        ${playbookBlock}
        ${dontBlock}
      </div>
    </details>
  `;
}

/**
 * Renders the Approaches section: a walkthrough-card containing collapsible
 * <details> per approach, each with code + explanation. All start closed.
 */
function renderApproaches(prob) {
  const slot = document.querySelector('[data-section="approaches"]');
  if (!slot) return;

  const approaches = prob.approaches || [];
  if (approaches.length === 0) {
    slot.innerHTML = '';
    return;
  }

  const escapeCode = code =>
    code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const blocks = approaches.map(a => {
    const timeClass = `approach-O-${_isGoodComplexity(a.time) ? 'good' : 'bad'}`;
    const spaceClass = `approach-O-${_isGoodComplexity(a.space) ? 'good' : 'bad'}`;
    return `
      <details class="approach-block">
        <summary class="approach-summary">
          <span class="approach-name">${_esc(a.name)}</span>
          <span class="approach-O-time ${timeClass}">Time: ${_esc(a.time)}</span>
          <span class="approach-O-space ${spaceClass}">Space: ${_esc(a.space)}</span>
        </summary>
        <div class="approach-body">
          <pre>${escapeCode(a.code)}</pre>
          <p class="approach-why">${_esc(a.explanation)}</p>
        </div>
      </details>
    `;
  }).join('');

  slot.innerHTML = `
    <div class="ps-section">
      <div class="ps-section__title">Approaches</div>
      <p class="approaches-note">Expand each approach to see the code and the reasoning you'd walk through in an interview.</p>
      <div class="walkthrough-card">
        <div class="walkthrough-head">Solution Walkthroughs</div>
        ${blocks}
      </div>
    </div>
  `;
}

/**
 * Renders the practice-block element that practice.js will auto-initialize.
 * The data-tests attribute holds JSON-stringified test_cases from the problem.
 */
function renderPracticeEditor(prob) {
  const slot = document.querySelector('[data-section="practice-editor"]');
  if (!slot) return;

  // Build test cases in the format the inline HTML used:
  // Each entry needs args and expected. We carry through the label if present.
  const tests = (prob.test_cases || []).map(tc => ({
    args: tc.args,
    expected: tc.expected,
    label: tc.label || ''
  }));

  const testsJson = JSON.stringify(tests)
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');

  // HTML-escape for embedding in a single-quoted attribute.
  // JS-style escapes don't work here — `\'` inside a `'...'` attribute still
  // closes it. We need entity-escapes. `&#10;` is a real newline after
  // getAttribute() decodes it, so practice.js can drop its `\\n -> \n` step.
  const starterEscaped = (prob.starter_code || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '&#10;');

  // No need to re-render title/summary inside the editor — they already appear
  // in the topbar and problem-statement card on the left.
  slot.innerHTML = `
    <div class="practice-block practice-block--bare"
      data-title="${_esc(prob.title)}"
      data-difficulty="${_esc(prob.difficulty)}"
      data-fn="${_esc(prob.function_name)}"
      data-starter='${starterEscaped}'
      data-tests='${testsJson}'>
    </div>
  `;

  // Re-initialize practice blocks now that the DOM is updated.
  // practice.js listens for DOMContentLoaded, which has already fired, so we
  // call init() manually if the library is already loaded.
  if (window.DSA && window.DSA.practice && typeof window.DSA.practice.init === 'function') {
    window.DSA.practice.init();
  }
}

/**
 * Renders the related problems list in the editor sidebar panel.
 * Looks up each id in prob.related_problem_ids from allProblems.
 */
function renderRelatedProblems(prob, allProblems) {
  const slot = document.querySelector('[data-section="related-problems"]');
  if (!slot) return;

  const relatedIds = prob.related_problem_ids || [];
  if (relatedIds.length === 0) {
    slot.innerHTML = '';
    return;
  }

  const items = relatedIds.map(id => {
    const related = allProblems.find(p => p.id === id);
    if (!related) return '';
    const diff = related.difficulty || 'easy';
    const diffLabel = diff === 'medium' ? 'Med' : diff.charAt(0).toUpperCase() + diff.slice(1);
    return `
      <div class="related-item">
        <span class="pill pill-${_esc(diff)}" style="flex-shrink:0;font-size:10px;padding:1px 6px;">${_esc(diffLabel)}</span>
        <span class="related-item__title"><a href="${_esc(id)}.html">${_esc(related.title)}</a></span>
      </div>
    `;
  }).join('');

  // Also render topic links for the topics on this problem.
  const topicLinks = (prob.topics || []).map(t => {
    const label = t.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    return `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
      <span class="related-item__title"><a href="../topics/${_esc(t)}.html">${_esc(label)}</a></span>
    `;
  }).join('&nbsp;|&nbsp;');
  const topicRow = topicLinks
    ? `<div class="related-item" style="border-bottom:none;">${topicLinks}</div>`
    : '';

  slot.innerHTML = items + topicRow;
}

/**
 * Renders the test cases list pane.
 * Parses function_signature to get parameter names, then formats each test case's
 * args using those names. E.g. "def two_sum(nums, target):" → ["nums", "target"].
 */
function renderTestCases(prob) {
  const slot = document.querySelector('[data-section="test-cases"]');
  if (!slot) return;

  const cases = prob.test_cases || [];
  if (cases.length === 0) {
    slot.innerHTML = '<p style="padding:14px 16px;font-size:13px;color:var(--text-secondary);">No test cases for this problem.</p>';
    return;
  }

  // Extract parameter names from function_signature.
  // E.g. "def two_sum(nums, target):" → ["nums", "target"]
  const paramNames = (function () {
    const sig = prob.function_signature || '';
    const m = sig.match(/\(([^)]*)\)/);
    if (!m) return [];
    return m[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
  })();

  const formatArgs = args => args.map((a, i) => {
    const name = paramNames[i] || ('arg' + i);
    return name + ' = ' + JSON.stringify(a);
  }).join(', ');

  const cards = cases.map((tc, i) => `
    <div class="test-case-card">
      <div class="test-case-card__header">
        Case ${i + 1}
        ${tc.label ? `<span class="test-case-card__label">&#8212; ${_esc(tc.label)}</span>` : ''}
      </div>
      <div class="test-case-card__row">
        <span class="test-case-card__row-label">Input:</span>
        <span class="test-case-card__row-value">${_esc(formatArgs(tc.args || []))}</span>
      </div>
      <div class="test-case-card__row">
        <span class="test-case-card__row-label">Expected:</span>
        <span class="test-case-card__row-value">${_esc(String(tc.expected))}</span>
      </div>
    </div>
  `).join('');

  slot.innerHTML = `
    <div class="test-cases">
      <h3 class="test-cases__title">Test cases for ${_esc(prob.title)}</h3>
      <p class="test-cases__count">${cases.length} case${cases.length === 1 ? '' : 's'}</p>
      ${cards}
    </div>
  `;
}
