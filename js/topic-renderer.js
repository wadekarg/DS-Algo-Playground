/* topic-renderer.js — Renders interview-prep sections into slot
 * <div>s inside topic pages. Reads data/problems.json and
 * data/patterns.json once, caches them, then exposes renderTopic(id).
 *
 * Usage in topic HTML:
 *   <link rel="stylesheet" href="../css/topic-template.css">
 *   <div data-section="cheat-sheet"></div>
 *   <div data-section="patterns-that-use-this"></div>
 *   <div data-section="curated-problems"></div>
 *   <div data-section="solution-walkthroughs"></div>
 *   <div data-section="reasoned-next-steps"></div>
 *   <script src="../js/topic-renderer.js"></script>
 *   <script>renderTopic('arrays', cheatSheetData, asksData, nextStepsData);</script>
 */

let _problemsCache = null;
let _patternsCache = null;

async function _loadData() {
  if (_problemsCache && _patternsCache) return;
  // Resolve URLs relative to the repo root regardless of which subfolder
  // the calling HTML page is in. We assume the page is in /topics/<id>.html
  // so '../data/...' works; if invoked from repo root (e.g. scratch.html),
  // 'data/...' is correct. Try both.
  const tryFetch = async (paths) => {
    for (const p of paths) {
      try {
        const r = await fetch(p);
        if (r.ok) return r.json();
      } catch (e) { /* try next */ }
    }
    throw new Error('Could not load: ' + paths.join(' or '));
  };
  _problemsCache = await tryFetch(['../data/problems.json', 'data/problems.json']);
  _patternsCache = await tryFetch(['../data/patterns.json', 'data/patterns.json']);
}

/**
 * Top-level: populates all dynamic sections on a topic page.
 * @param {string} topicId  - e.g. 'arrays', 'two-pointers'
 * @param {object} cheatSheetData - per-topic cheat sheet content (4 boxes)
 * @param {object} asksData - per-topic "Ask before coding" content
 * @param {object[]} nextStepsData - per-topic next-step cards
 */
async function renderTopic(topicId, cheatSheetData, asksData, nextStepsData) {
  await _loadData();
  renderCheatSheet(topicId, cheatSheetData);
  renderPatternsThatUseThis(topicId);
  renderAskBeforeCoding(topicId, asksData);
  renderCuratedProblems(topicId);
  renderReasonedNextSteps(topicId, nextStepsData);
}

// Section render functions are added in subsequent tasks.
/**
 * Render the 4-box Interview Cheat Sheet.
 * @param {string} topicId - used for the title (capitalized)
 * @param {object} data - shape:
 *   {
 *     ops: [{ name: "arr[i]", complexity: "O(1)", good: true }, ...],
 *     use: ["Need random access", "Size is bounded", ...],
 *     avoid: ["Frequent middle inserts → linked list", ...],
 *     pitfalls: ["Off-by-one on end index", ...]
 *   }
 */
function renderCheatSheet(topicId, data) {
  const slot = document.querySelector('[data-section="cheat-sheet"]');
  if (!slot || !data) return;
  const title = topicId
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const opsRows = (data.ops || []).map(o => `
    <div class="cs-row">
      <span class="cs-op-name">${o.name}</span>
      <span class="cs-O ${o.good ? 'cs-O-good' : 'cs-O-bad'}">${o.complexity}</span>
    </div>`).join('');
  const list = arr => (arr || []).map(item => `<div class="cs-row" style="display:block">${item}</div>`).join('');
  slot.innerHTML = `
    <div class="cheat-sheet-card">
      <div class="cheat-sheet-head">⚡ Interview Cheat Sheet — ${title}</div>
      <div class="cheat-sheet-grid">
        <div class="cs-box cs-box-ops">
          <div class="cs-label">⏱ Ops at a glance</div>
          ${opsRows}
        </div>
        <div class="cs-box cs-box-use">
          <div class="cs-label">✓ Use when</div>
          ${list(data.use)}
        </div>
        <div class="cs-box cs-box-avoid">
          <div class="cs-label">✗ Reach for instead</div>
          ${list(data.avoid)}
        </div>
        <div class="cs-box cs-box-pitfall">
          <div class="cs-label">⚠ Pitfalls</div>
          ${list(data.pitfalls)}
        </div>
      </div>
    </div>
  `;
}
/**
 * Render cross-link cards to patterns that operate on this topic.
 * Reads from _patternsCache; finds patterns where appears_in includes topicId.
 * Special case: on a pattern page, also shows "Data structures this works on" —
 * the inverse direction. We detect a pattern page by checking if topicId itself
 * is a pattern id in patterns.json.
 */
function renderPatternsThatUseThis(topicId) {
  const slot = document.querySelector('[data-section="patterns-that-use-this"]');
  if (!slot) return;

  const isPatternPage = _patternsCache.some(p => p.id === topicId);
  let cards;
  let heading;
  if (isPatternPage) {
    // On a pattern page, link to the data structures this pattern operates on
    const me = _patternsCache.find(p => p.id === topicId);
    cards = (me?.appears_in || []).map(dsId => {
      const niceTitle = dsId.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
      return { title: niceTitle, url: `${dsId}.html`, oneLiner: `Uses ${niceTitle} as the underlying structure.` };
    });
    heading = 'Where this pattern is used';
  } else {
    // On a data-structure page, link to patterns. Skip cards that point back
    // to the current page (e.g. hash-map.topic_url is hash-table.html, which
    // shouldn't appear on hash-table.html itself).
    const currentBasename = (typeof window !== 'undefined' && window.location ? window.location.pathname.split('/').pop() : '') || `${topicId}.html`;
    cards = _patternsCache
      .filter(p => (p.appears_in || []).includes(topicId))
      .map(p => ({ title: p.title, url: p.topic_url.replace(/^topics\//, ''), oneLiner: p.one_liner }))
      .filter(c => {
        // Strip URL fragments (e.g. arrays.html#kadane → arrays.html) for comparison
        const cardPage = c.url.split('#')[0];
        return cardPage !== currentBasename;
      });
    heading = 'Patterns that use this';
  }
  if (cards.length === 0) {
    slot.innerHTML = '';
    return;
  }
  const cardsHtml = cards.map(c => `
    <a class="pattern-card" href="${c.url}">
      <div class="pattern-title">${c.title}</div>
      <div class="pattern-one-liner">${c.oneLiner}</div>
    </a>
  `).join('');
  slot.innerHTML = `
    <h2>${heading}</h2>
    <div class="patterns-grid">${cardsHtml}</div>
  `;
}
/**
 * Render the boxed "Ask before coding" callout.
 * @param {string} topicId - currently unused but kept for symmetry
 * @param {string[]} data - array of question strings
 */
function renderAskBeforeCoding(topicId, data) {
  const slot = document.querySelector('[data-section="ask-before-coding"]');
  if (!slot || !data || data.length === 0) return;
  const items = data.map(q => `<li>${q}</li>`).join('');
  slot.innerHTML = `
    <div class="ask-callout">
      <h4>🎯 Before you code, ask:</h4>
      <ul>${items}</ul>
    </div>
  `;
}
/**
 * Render curated problems list, grouped by pattern.
 * Each row: title (link to LeetCode) + difficulty pill + pattern pill + frequency pills.
 */
function renderCuratedProblems(topicId) {
  const slot = document.querySelector('[data-section="curated-problems"]');
  if (!slot) return;

  const mine = _problemsCache.filter(p => (p.topics || []).includes(topicId));
  if (mine.length === 0) {
    slot.innerHTML = '<h2>Problems</h2><p>No problems curated for this topic yet.</p>';
    return;
  }

  // Group by primary pattern (first entry in patterns[])
  const groups = {};
  for (const prob of mine) {
    const key = (prob.patterns && prob.patterns[0]) || 'general';
    if (!groups[key]) groups[key] = [];
    groups[key].push(prob);
  }

  // Within each group, sort by difficulty: easy → medium → hard
  const diffOrder = { easy: 0, medium: 1, hard: 2 };
  Object.values(groups).forEach(g =>
    g.sort((a, b) => (diffOrder[a.difficulty] ?? 9) - (diffOrder[b.difficulty] ?? 9))
  );

  // Pattern id → human title (look up in patterns.json)
  const patternTitle = id => {
    const p = _patternsCache.find(p => p.id === id);
    return p ? p.title : id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  };

  const renderRow = prob => {
    const freqPills = (prob.frequency_tags || []).map(t =>
      `<span class="pill pill-${t}">${t.replace(/-/g, ' ')}</span>`
    ).join('');
    const patternPills = (prob.patterns || []).map(p =>
      `<span class="pill pill-pattern">${patternTitle(p)}</span>`
    ).join('');
    const titleLink = prob.has_walkthrough
      ? `<a href="../problems/${prob.id}.html">${prob.title}</a>`
      : `<a href="${prob.leetcode_url}" target="_blank" rel="noopener">${prob.title}</a>`;
    const walkthroughBadge = prob.has_walkthrough
      ? '<span class="walkthrough-badge" title="Full solution walkthrough available">&#128214;</span>'
      : '';
    const status = (window.DSA && DSA.problemProgress)
      ? DSA.problemProgress.getStatus(prob.id) : 'unattempted';
    const statusTitle = status === 'solved' ? 'Solved' :
                        status === 'attempted' ? 'Attempted' : 'Not yet attempted';
    return `
      <div class="problem-row">
        <span class="problem-status-dot ${status}" title="${statusTitle}"></span>
        <span class="problem-title">${titleLink}</span>
        <span class="pill pill-${prob.difficulty}">${prob.difficulty}</span>
        ${patternPills}
        ${freqPills}
        ${walkthroughBadge}
      </div>
    `;
  };

  const groupsHtml = Object.entries(groups).map(([key, probs]) => `
    <div class="problem-group">
      <div class="problem-group-title">${patternTitle(key)}</div>
      ${probs.map(renderRow).join('')}
    </div>
  `).join('');

  slot.innerHTML = `
    <h2>Problems</h2>
    <div class="problems-section">${groupsHtml}</div>
  `;
}
/**
 * NOTE: Not called by renderTopic as of sub-project-1 closeout — walkthroughs
 * will live on dedicated per-problem pages built in sub-project 2. Function is
 * kept here for potential reuse by the new per-problem page renderer.
 *
 * Render inline collapsible solution walkthroughs for problems that have
 * has_walkthrough: true and are tagged with this topic.
 */
function renderSolutionWalkthroughs(topicId) {
  const slot = document.querySelector('[data-section="solution-walkthroughs"]');
  if (!slot) return;

  const flagships = _problemsCache.filter(
    p => p.has_walkthrough && (p.topics || []).includes(topicId)
  );
  if (flagships.length === 0) {
    slot.innerHTML = '';
    return;
  }

  // Heuristic for "is this complexity good?" — count n's in the expression
  // O(1), O(log n), O(n) are good; O(n^2), O(n²), O(n!), O(2^n) are bad
  const isGood = expr => {
    const e = expr.toLowerCase().replace(/\s/g, '');
    if (/n[\^²2]/.test(e) || /2\^n/.test(e) || /n!/.test(e) || /n\*n/.test(e)) return false;
    return true;
  };

  const escapeCode = code =>
    code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const cards = flagships.map(prob => {
    const approaches = (prob.approaches || []).map((a, i) => `
      <details class="approach-block" ${i === prob.approaches.length - 1 ? 'open' : ''}>
        <summary class="approach-summary">
          <span class="approach-name">${a.name}</span>
          <span class="approach-O-time approach-O-${isGood(a.time) ? 'good' : 'bad'}">${a.time}</span>
          <span class="approach-O-space approach-O-${isGood(a.space) ? 'good' : 'bad'}">${a.space}</span>
        </summary>
        <div class="approach-body">
          <pre><code>${escapeCode(a.code)}</code></pre>
          <div class="approach-why"><em>Why it works:</em> ${a.explanation}</div>
        </div>
      </details>
    `).join('');
    return `
      <div class="walkthrough-card">
        <div class="walkthrough-head">
          <span class="walkthrough-title">${prob.title}</span>
          <a href="${prob.leetcode_url}" target="_blank" rel="noopener" style="font-size: 13px;">↗ on LeetCode</a>
        </div>
        ${approaches}
      </div>
    `;
  }).join('');

  slot.innerHTML = `
    <h2>Solution Walkthroughs</h2>
    <p style="font-size: 14px; color: var(--text-secondary);">
      Brute force → optimal, with code and complexity for each approach. Click an approach to expand.
    </p>
    ${cards}
  `;
}
/**
 * Render the "Reasoned next steps" footer cards.
 * @param {object[]} data - shape: [{ label, title, url, why }, ...]
 *   label is e.g. "Prereq", "Next, learn", "Pattern to tackle"
 */
function renderReasonedNextSteps(topicId, data) {
  const slot = document.querySelector('[data-section="reasoned-next-steps"]');
  if (!slot || !data || data.length === 0) return;
  const cards = data.map(c => `
    <a class="next-step-card" href="${c.url}">
      <div class="next-step-label">${c.label}</div>
      <div class="next-step-title">${c.title}</div>
      <div class="next-step-why">${c.why}</div>
    </a>
  `).join('');
  slot.innerHTML = `
    <h2>What's next</h2>
    <div class="next-steps-grid">${cards}</div>
  `;
}
