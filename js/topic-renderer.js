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
  renderSolutionWalkthroughs(topicId);
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
function renderPatternsThatUseThis(topicId) { /* Task A6 */ }
function renderAskBeforeCoding(topicId, data) { /* Task A7 */ }
function renderCuratedProblems(topicId) { /* Task A8 */ }
function renderSolutionWalkthroughs(topicId) { /* Task A9 */ }
function renderReasonedNextSteps(topicId, data) { /* Task A10 */ }
