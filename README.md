<h1 align="center">
  <br>
  <img src="assets/favicon.svg" alt="DS-Algo Playground" width="80">
  <br>
  DS-Algo Playground
  <br>
</h1>

<p align="center">
  <strong>Interactive visualizations for data structures and algorithms</strong><br>
  Step through algorithms at your own pace. See how the code executes. Build real intuition.
</p>

<p align="center">
  <a href="https://wadekarg.github.io/DS-Algo-Playground/">
    <img src="https://img.shields.io/badge/Live_Demo-Visit_Site-blue?style=for-the-badge" alt="Live Demo">
  </a>
</p>

<p align="center">
  <a href="#-topics">Topics</a> &bull;
  <a href="#-features">Features</a> &bull;
  <a href="#-getting-started">Get Started</a> &bull;
  <a href="#-project-structure">Structure</a> &bull;
  <a href="#-tech-stack">Tech Stack</a>
</p>

---

## What is this?

DS-Algo Playground is a **zero-dependency**, pure HTML/CSS/JavaScript web app that helps you **understand** data structures and algorithms through interactive, step-by-step canvas visualizations.

No frameworks. No build tools. No installs. Just open and learn.

Every topic includes:
- A clear explanation of how the algorithm works
- An **interactive canvas visualization** — play, pause, step through, adjust speed
- Code implementations in **Python, Java, and C++**
- **Complexity analysis** with time & space breakdowns
- A **quiz** to test your understanding

---

## 📚 Topics

### Data Structures

| Topic | Description |
|:------|:------------|
| [**Arrays**](https://wadekarg.github.io/DS-Algo-Playground/topics/arrays.html) | Access, insert, delete, and search operations with shifting animation |
| [**Linked Lists**](https://wadekarg.github.io/DS-Algo-Playground/topics/linked-lists.html) | Singly linked list traversal and pointer manipulation |
| [**Stack**](https://wadekarg.github.io/DS-Algo-Playground/topics/stack.html) | Push, pop, and peek with vertical column visualization |
| [**Queue**](https://wadekarg.github.io/DS-Algo-Playground/topics/queue.html) | Enqueue, dequeue with front/rear pointer tracking |
| [**Hash Table**](https://wadekarg.github.io/DS-Algo-Playground/topics/hash-table.html) | Hash function visualization, collision resolution with chaining |
| [**Binary Search Tree**](https://wadekarg.github.io/DS-Algo-Playground/topics/bst.html) | Insert, search, delete, and inorder/preorder/postorder traversals |
| [**Heap**](https://wadekarg.github.io/DS-Algo-Playground/topics/heap.html) | Max-heap with synchronized tree + array dual view |

### Sorting Algorithms

| Topic | Description |
|:------|:------------|
| [**Bubble Sort**](https://wadekarg.github.io/DS-Algo-Playground/topics/bubble-sort.html) | Adjacent-swap sorting with early-termination optimization |
| [**Selection Sort**](https://wadekarg.github.io/DS-Algo-Playground/topics/selection-sort.html) | Scan for minimum, swap into sorted position |
| [**Insertion Sort**](https://wadekarg.github.io/DS-Algo-Playground/topics/insertion-sort.html) | Key-lift, shift-right, and drop-in-place insertion |
| [**Merge Sort**](https://wadekarg.github.io/DS-Algo-Playground/topics/merge-sort.html) | Recursive divide phase and merge phase visualization |
| [**Quick Sort**](https://wadekarg.github.io/DS-Algo-Playground/topics/quick-sort.html) | Pivot partitioning with left/right pointer scanning |

### Searching

| Topic | Description |
|:------|:------------|
| [**Binary Search**](https://wadekarg.github.io/DS-Algo-Playground/topics/binary-search.html) | Divide-and-conquer search with low/mid/high pointers |
| [**BFS**](https://wadekarg.github.io/DS-Algo-Playground/topics/bfs.html) | Breadth-first graph traversal with queue visualization |
| [**DFS**](https://wadekarg.github.io/DS-Algo-Playground/topics/dfs.html) | Depth-first graph traversal with stack and backtracking |

### Algorithm Techniques

| Topic | Description |
|:------|:------------|
| [**Two Pointers**](https://wadekarg.github.io/DS-Algo-Playground/topics/two-pointers.html) | Converging pointers for pair-sum in sorted arrays |
| [**Sliding Window**](https://wadekarg.github.io/DS-Algo-Playground/topics/sliding-window.html) | Fixed-size window for maximum subarray sum |
| [**Dynamic Programming**](https://wadekarg.github.io/DS-Algo-Playground/topics/dynamic-programming.html) | Tabulation-based Fibonacci with DP table filling |
| [**Recursion**](https://wadekarg.github.io/DS-Algo-Playground/topics/recursion.html) | Fibonacci call tree with recursive DFS traversal |

---

## ✨ Features

### Step-Through Visualizations
Every algorithm is rendered on an **HTML5 Canvas** with full playback controls — play, pause, step forward/back, reset, and adjustable speed. Each step includes a plain-English explanation of what's happening and why.

### Algorithm Comparison
Pick any **two sorting algorithms** and run them **side-by-side** on the same input array. Compare their approaches, step counts, and behavior visually.

### Algorithm Race
Watch **5 sorting algorithms race** on the same array simultaneously. Progress bars and a winner announcement show you which algorithm finishes first.

### Complexity Visualizer
Interactive plot of **O(1), O(log n), O(n), O(n log n), O(n^2), and O(2^n)** growth curves. Adjust n with a slider and toggle individual curves on/off.

### Code in 3 Languages
Every topic shows implementations in **Python, Java, and C++** with syntax highlighting, tabbed navigation, and a one-click copy button.

### Dark / Light Theme
Toggle between dark and light modes with `t`. Your preference is saved across sessions. Auto-detects OS preference on first visit.

### Keyboard Shortcuts
Press `?` on any page to see all shortcuts:

| Key | Action |
|:---:|:-------|
| `t` | Toggle theme |
| `/` | Focus search |
| `Space` | Play / Pause visualization |
| `←` `→` | Step backward / forward |
| `?` | Show shortcuts modal |
| `Esc` | Close modal / search |

### Progress Tracking
Completed topics are tracked with visual badges on the sidebar. Progress persists across sessions via localStorage.

### Responsive Design
Works on desktop, tablet, and mobile. Canvas visualizations resize to fit the viewport.

---

## 🚀 Getting Started

Visit the **[live site](https://wadekarg.github.io/DS-Algo-Playground/)** — no setup, no install, just open and learn.

If you'd like to contribute or run locally, see [Contributing](#-contributing).

---

## 📁 Project Structure

```
DS-Algo-Playground/
├── index.html                  # Home page with topic grid
├── compare.html                # Side-by-side algorithm comparison
├── race.html                   # Algorithm race (5 sorting algos)
├── complexity.html             # Big-O growth rate visualizer
├── about.html                  # About page
│
├── topics/                     # 19 topic pages
│   ├── arrays.html
│   ├── linked-lists.html
│   ├── stack.html
│   ├── queue.html
│   ├── hash-table.html
│   ├── bst.html
│   ├── heap.html
│   ├── bubble-sort.html
│   ├── selection-sort.html
│   ├── insertion-sort.html
│   ├── merge-sort.html
│   ├── quick-sort.html
│   ├── binary-search.html
│   ├── bfs.html
│   ├── dfs.html
│   ├── two-pointers.html
│   ├── sliding-window.html
│   ├── dynamic-programming.html
│   └── recursion.html
│
├── js/
│   ├── visualization-core.js   # Playback engine (play/pause/step/speed)
│   ├── viz-utils.js            # Shared drawing primitives
│   ├── sidebar-nav.js          # Dynamic sidebar from topics.json
│   ├── code-trace.js           # Code line highlighting + variable watch
│   ├── challenge.js            # Challenge mode infrastructure
│   ├── main.js                 # App entry point and init router
│   ├── progress.js             # Progress tracking with badges
│   ├── search.js               # Fuzzy topic search
│   ├── theme.js                # Dark/light theme toggle
│   ├── keyboard.js             # Global keyboard shortcuts
│   ├── quiz.js                 # Quiz scoring engine
│   ├── code-block.js           # Syntax highlighting + copy
│   ├── sidebar.js              # Sidebar open/close behavior
│   └── topics/                 # 19 visualization modules
│       ├── arrays-viz.js
│       ├── linked-lists-viz.js
│       ├── bubble-sort-viz.js
│       └── ... (one per topic)
│
├── css/
│   ├── main.css                # CSS imports
│   ├── variables.css           # Theme color tokens
│   ├── visualization.css       # Canvas + controls + challenge styles
│   ├── code-trace.css          # Code highlighting styles
│   ├── code.css                # Code block styles
│   ├── components.css          # Buttons, cards, badges
│   ├── layout.css              # Grid and sidebar layout
│   ├── topic.css               # Topic page layout
│   └── reset.css               # CSS reset
│
├── data/
│   ├── topics.json             # Topic registry (drives sidebar + progress)
│   └── complexity-data.json    # Big-O reference data
│
└── .github/workflows/
    └── deploy.yml              # GitHub Pages deployment
```

---

## 🛠 Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Rendering** | HTML5 Canvas 2D API |
| **Language** | Vanilla JavaScript (ES5, IIFE modules) |
| **Styling** | CSS Custom Properties for dark/light theming |
| **Storage** | localStorage for progress + theme persistence |
| **Hosting** | GitHub Pages via GitHub Actions |
| **Dependencies** | **None** — zero external libraries |

---

## 🤝 Contributing

This project is built **purely for educational purposes** — to help students, self-learners, and developers understand data structures and algorithms through interactive visualizations.

Contributions are welcome and encouraged! Whether it's:
- Adding a new topic or algorithm
- Improving an existing visualization
- Fixing bugs or typos
- Enhancing mobile responsiveness
- Translating content

Feel free to open an issue or submit a pull request.

---

## 📄 License

MIT

---

<p align="center">
  Built with the help of AI (Claude) — prompted, guided, and curated by a human.
</p>
