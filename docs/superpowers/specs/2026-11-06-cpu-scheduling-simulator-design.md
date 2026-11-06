# CPU Scheduling Algorithm Simulator - Design Specification

**Date**: 2026-11-06  
**Project**: PT101 Platform Technologies Final Project  
**Author**: Claude Code (design lead)  
**Status**: Approved for implementation

---

## 1. Project Overview

### Subject Matter
Interactive web-based CPU scheduling algorithm simulator for educational use in Platform Technologies (PT101) course. Students input process parameters and visualize 8 scheduling algorithms through Gantt charts, execution logs, and comparative metrics.

### Target Audience
- **Primary**: PT101 students demonstrating algorithm understanding in oral defense
- **Secondary**: Instructors evaluating student work

### Primary Job
Enable students to:
1. Input process data (PID, arrival, burst, priority, queue level)
2. Run any of 8 scheduling algorithms
3. Visualize results via Gantt chart, log, and metrics table
4. Compare multiple algorithms side-by-side
5. Explain each algorithm's behavior during oral defense (code must be readable)

### Success Criteria
- All 8 algorithms produce correct, hand-verified results
- Clean separation: `scheduler.js` (pure logic, testable in Node) + `app.js` (UI only)
- Light/dark mode, keyboard accessible, responsive down to 375px
- `tests.js` with 3 verified cases per algorithm runs in Node
- Code commented in plain language for oral defense explanation

---

## 2. Architecture

### File Structure
```
cpu-scheduling/
├── index.html      # Semantic HTML structure, accessibility
├── style.css       # All styling, tokens, light/dark, responsive
├── scheduler.js    # Pure algorithm implementations (no DOM)
├── app.js          # UI logic, DOM manipulation, event handling
├── tests.js        # Node-testable test cases (3 per algorithm)
├── README.md       # Documentation for running and understanding
```

### Module Boundaries

**scheduler.js** (Pure Functions)
- Exports: `runScheduler(processes, algorithm, quantum)`
- No DOM, no globals, no side effects
- Each algorithm is a pure function taking processes array + quantum
- Returns standardized result object (see Section 4)

**app.js** (UI Layer)
- Imports scheduler.js via `<script type="module">`
- All DOM manipulation, event listeners, rendering
- Validation, error display, state management
- Calls scheduler, renders results

**style.css** (Design System)
- CSS custom properties for theming
- Mobile-first responsive
- Reduced motion support
- Focus-visible states

---

## 3. Design System

### Color Palette (CSS Custom Properties)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-bg` | `#fafafa` | `#121212` | Page background |
| `--color-surface` | `#ffffff` | `#1e1e1e` | Cards, tables, inputs |
| `--color-border` | `#e0e0e0` | `#333333` | Dividers, input borders |
| `--color-text` | `#1a1a1a` | `#e8e8e8` | Primary text |
| `--color-text-muted` | `#666666` | `#a0a0a0` | Labels, secondary text |
| `--color-accent` | `#2563eb` | `#60a5fa` | Primary buttons, links, focus |
| `--color-accent-hover` | `#1d4ed8` | `#93c5fd` | Hover states |
| `--color-success` | `#16a34a` | `#4ade80` | Best values in comparison |
| `--color-warning` | `#ea580c` | `#fb923c` | Idle blocks, warnings |
| `--color-error` | `#dc2626` | `#f87171` | Validation errors |

**Process Colors** (8 distinct hues for Gantt):
`#2563eb`, `#16a34a`, `#ea580c`, `#9333ea`, `#ec4899`, `#0891b2`, `#65a30d`, `#dc2626`

### Typography

**Font Stacks**
- UI: `"IBM Plex Sans", system-ui, -apple-system, sans-serif`
- Data/Code: `"IBM Plex Mono", "JetBrains Mono", monospace`

**Type Scale** (rem-based, root = 16px)
| Token | Size | Usage |
|-------|------|-------|
| `--fs-xs` | 0.75rem (12px) | Small labels, timestamps |
| `--fs-sm` | 0.875rem (14px) | Table cells, log entries |
| `--fs-base` | 1rem (16px) | Body text, inputs |
| `--fs-lg` | 1.125rem (18px) | Section headings |
| `--fs-xl` | 1.5rem (24px) | Page title |
| `--fs-2xl` | 2rem (32px) | Hero Gantt label |

**Line Heights**: `--lh-tight` = 1.2 (headings), `--lh-normal` = 1.5 (body), `--lh-code` = 1.6 (monospace)

### Spacing Scale
`--space-1` = 4px, `--space-2` = 8px, `--space-3` = 12px, `--space-4` = 16px, `--space-5` = 24px, `--space-6` = 32px, `--space-8` = 48px

### Border Radius
`--radius-sm` = 4px, `--radius-md` = 8px, `--radius-lg` = 12px

### Shadows
`--shadow-sm` = `0 1px 2px rgba(0,0,0,0.05)`, `--shadow-md` = `0 4px 6px rgba(0,0,0,0.07)`, `--shadow-lg` = `0 10px 15px rgba(0,0,0,0.1)`

---

## 4. Algorithm Specification

### Input Data Structure
```javascript
// Each process:
{
  pid: "P1",           // string, unique
  arrival: 0,          // number >= 0, integer
  burst: 5,            // number >= 1, integer
  priority: 2,         // number >= 1, integer (lower = higher priority)
  queue: 1             // 1, 2, or 3 (for multilevel algorithms)
}
```

### Output Result Structure
```javascript
{
  gantt: [
    { pid: "P1", start: 0, end: 5, isIdle: false },
    { pid: "IDLE", start: 5, end: 6, isIdle: true },
    ...
  ],
  log: [
    { time: 0, event: "start", detail: "P1 started execution" },
    { time: 5, event: "finish", detail: "P1 completed" },
    { time: 5, event: "idle", detail: "CPU idle until next arrival at 6" },
    ...
  ],
  processes: [
    { pid: "P1", arrival: 0, burst: 5, priority: 2, queue: 1,
      completion: 5, turnaround: 5, waiting: 0, response: 0 },
    ...
  ],
  averages: {
    waiting: 2.33,
    turnaround: 7.67,
    response: 1.67,
    idleTime: 1
  }
}
```

### Algorithm Definitions

#### 1. FCFS (First-Come, First-Served) — Non-preemptive
- Sort processes by arrival time, then by original input order (index)
- Run each to completion
- No preemption

#### 2. SJF (Shortest Job First) — Non-preemptive
- At each CPU availability, select arrived process with shortest burst
- Run to completion
- Tie-break: earlier arrival, then lower index

#### 3. SRTF (Shortest Remaining Time First) — Preemptive
- At each time unit, select arrived process with shortest remaining burst
- Preempt if new arrival has shorter remaining time
- Tie-break: earlier arrival, then lower index

#### 4. Priority Non-preemptive
- At each CPU availability, select arrived process with highest priority (lowest number)
- Run to completion
- Tie-break: earlier arrival, then lower index

#### 5. Priority Preemptive
- At each time unit, select arrived process with highest priority
- Preempt if new arrival has higher priority
- Tie-break: earlier arrival, then lower index

#### 6. Round Robin — Preemptive
- Queue processes in arrival order
- New arrivals enqueued **before** preempted process
- Each gets `quantum` time or remaining burst, whichever is smaller
- If not finished, goes to back of queue

#### 7. Multilevel Queue — Preemptive (by queue level)
- 3 fixed queues by `queue` field:
  - Queue 1: Round Robin with given quantum
  - Queue 2: FCFS
  - Queue 3: FCFS
- Higher queue number = lower priority (Queue 1 preempts Queue 2, etc.)
- Processes stay in assigned queue
- Scheduler checks Queue 1 first, then 2, then 3

#### 8. Multilevel Feedback Queue — Preemptive
- 3 levels with quanta: Q, 2Q, FCFS (infinite)
- New processes enter at Level 1
- If process uses full quantum without finishing → demoted to next level
- Higher level (lower number) preempts lower level
- New arrivals at Level 1 preempt lower-level running process
- Tie-break within level: arrival order

### Tie-Breaking Rule (All Algorithms)
1. Earlier arrival time
2. Lower original process index (P1 before P2)

---

## 5. UI Specification

### Page Structure (Semantic HTML)
```html
<header>Title + Theme Toggle</header>
<main>
  <section id="process-input">Process Table + Controls</section>
  <section id="simulation-controls">Algorithm Select + Compare Checkboxes</section>
  <section id="gantt-chart">Gantt Visualization</section>
  <section id="results">
    <aside id="execution-log"></aside>
    <article id="results-table"></article>
  </section>
  <section id="comparison" hidden>Algorithm Comparison Table</section>
</main>
<footer>Attribution</footer>
```

### Process Input Table
- Editable rows with: PID, Arrival, Burst, Priority, Queue
- "Add Row" button (auto-generates P1, P2...)
- "Load Sample" button (preset: 4-5 processes showing variety)
- "Clear All" button
- Time Quantum input (for RR, MLQ, MLFQ) — default 4
- Inline validation with red border + error message
- Keyboard navigable (Tab, Enter to add)

### Algorithm Selection
- `<select>` with 8 options, each labeled with preemptive/non-preemptive badge
- "Run Simulation" button (primary action)
- Compare mode: checkboxes for each algorithm + "Compare Selected" button

### Gantt Chart
- Horizontal timeline, time labels at top
- Colored blocks proportional to duration (1 time unit = 40px base)
- Process ID label inside block (white text, centered)
- Hatched diagonal stripes for idle blocks (`repeating-linear-gradient`)
- Start/end time labels below each block
- Horizontal scroll on overflow (mobile)
- Legend showing process colors

### Execution Log
- Chronological list with timestamps
- Events: start, preempt, resume, finish, idle
- Format: `[start-end] PID action` or `[time] PID finished`
- Monospace font for alignment

### Results Table
- Columns: PID, Arrival, Burst, Completion, Turnaround, Waiting, Response
- Footer row with averages
- Monospace for numeric columns

### Comparison Table
- Columns: Algorithm, Avg Waiting, Avg Turnaround, Avg Response
- Highlight lowest value in each metric column with green checkmark
- Only shown when 2+ algorithms selected and compared

### Theme Toggle
- Button in header: ☀️/🌙 icon
- Persists to `localStorage`
- Respects `prefers-color-scheme` initially

---

## 6. Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| PID | Required, unique (case-insensitive) | "Process ID must be unique" |
| Arrival | Integer >= 0 | "Arrival time must be a whole number >= 0" |
| Burst | Integer >= 1 | "Burst time must be a whole number >= 1" |
| Priority | Integer >= 1 | "Priority must be a whole number >= 1" |
| Queue | 1, 2, or 3 | "Queue level must be 1, 2, or 3" |
| Quantum | Integer >= 1 | "Time quantum must be a whole number >= 1" |

- Validate on blur and before simulation
- Show first error, focus offending input
- Disable Run button if any invalid

---

## 7. Testing Specification (tests.js)

### Requirements
- Run with `node tests.js` (no dependencies)
- 3 hand-verified test cases per algorithm (24 total)
- Each test case includes:
  - Input processes array
  - Expected Gantt sequence (pid order with start/end)
  - Expected average waiting time
  - Expected average turnaround time
  - Comments with manual verification notes

### Test Output Format
```
✓ FCFS Test 1: avg WT=2.33, avg TAT=7.67
✓ FCFS Test 2: avg WT=...
...
✓ MLFQ Test 3: avg WT=...
All 24 tests passed
```

### Sample Test Case (FCFS)
```javascript
// FCFS Test 1: Basic sequential
// Processes: P1(at=0,bt=5), P2(at=1,bt=3), P3(at=2,bt=8)
// Gantt: P1[0-5], P2[5-8], P3[8-16]
// WT: P1=0, P2=4, P3=6 → Avg=3.33
// TAT: P1=5, P2=7, P3=14 → Avg=8.67
```

---

## 8. Accessibility & Quality

### Keyboard Navigation
- All interactive elements reachable via Tab
- Focus visible with `--color-accent` outline
- Enter/Space activates buttons
- Arrow keys in select dropdown

### Screen Readers
- Semantic HTML5 elements
- `aria-label` on icon-only buttons
- `role="log"` on execution log (aria-live="polite")
- Table headers with `scope="col"`

### Reduced Motion
- `@media (prefers-reduced-motion: reduce)` disables transitions
- Gantt chart renders instantly

### Responsive Breakpoints
- Mobile: ≤ 600px (stack sections, horizontal scroll Gantt)
- Tablet: 601-900px
- Desktop: > 900px (side-by-side log + results)

### Code Quality
- Functions < 50 lines
- Descriptive names: `calculateWaitingTime`, `findNextProcess`
- JSDoc comments on all exported functions
- Inline comments explaining algorithm steps for oral defense

---

## 9. Implementation Order

1. **scheduler.js** - All 8 algorithms + shared utilities
2. **tests.js** - Hand-verified test cases
3. **style.css** - Design system + component styles
4. **index.html** - Semantic structure
5. **app.js** - UI wiring, validation, rendering
6. **README.md** - Documentation

---

## 10. Open Questions (Resolved)

1. **Color accent**: Blue (`#2563eb`) — clean, academic, accessible
2. **Font**: IBM Plex via Google Fonts CDN — distinctive, readable, free
3. **Gantt scaling**: Fixed 40px per time unit, horizontal scroll
4. **Sample data**: 5 processes showing varied arrival/burst/priority/queue

---

*Spec approved for implementation. Proceed to writing-plans skill.*