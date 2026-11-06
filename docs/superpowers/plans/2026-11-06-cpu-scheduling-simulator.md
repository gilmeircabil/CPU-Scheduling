# CPU Scheduling Algorithm Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vanilla HTML/CSS/JS CPU scheduling simulator with 8 algorithms, Gantt chart, comparison table, and Node-testable pure logic module.

**Architecture:** Four-file separation — `scheduler.js` (pure algorithms, testable in Node), `app.js` (UI only), `style.css` (design system), `index.html` (semantic structure). Algorithms return standardized result objects. No build step, opens by double-clicking index.html.

**Tech Stack:** Plain HTML5, CSS3 (custom properties, Grid/Flex), ES Modules (vanilla JS), Node.js for testing only.

**Spec:** `docs/superpowers/specs/2026-11-06-cpu-scheduling-simulator-design.md`

## Global Constraints

- No frameworks, no build step — plain HTML/CSS/JS only
- `scheduler.js` must have zero DOM dependencies, runnable in Node
- All 8 algorithms implemented with specified tie-breaking (arrival → index)
- Light/dark mode via CSS custom properties, persisted to localStorage
- Keyboard accessible, responsive to 375px, reduced motion respected
- `tests.js` runs with `node tests.js` — 3 hand-verified cases per algorithm (24 total)
- Code commented in plain language for oral defense explanation
- IBM Plex Sans/Mono via Google Fonts CDN

## Review Focus

| Input/Condition | Expected Behavior | Test Location |
|----------------|-------------------|---------------|
| Empty process list | Run button disabled, clear error message | Task 4 (UI validation) |
| Duplicate PIDs (case-insensitive) | Inline error on PID field, run disabled | Task 4 (UI validation) |
| Quantum = 0 or negative | Error on quantum input, run disabled | Task 4 (UI validation) |
| Single process with arrival > 0 | Idle time shown in Gantt before process starts | Task 3 (algorithms), Task 5 (Gantt render) |
| Preemptive algorithm with simultaneous arrivals | Tie-break by lower index (P1 before P2) | Task 3 (algorithms), Task 7 (tests) |
| Comparison with 1 algorithm selected | Compare button disabled, helpful message | Task 4 (UI comparison) |
| Dark mode toggle | Persists to localStorage, respects system preference initially | Task 5 (theme) |

---

### Task 1: Create scheduler.js — Pure Algorithm Module

**Files:**
- Create: `scheduler.js`
- Test: `tests.js` (uses scheduler.js)

**Interfaces:**
- Produces: `runScheduler(processes, algorithm, quantum)` → ResultObject
- Produces: Individual algorithm functions: `fcfs(processes)`, `sjf(processes)`, `srtf(processes)`, `priorityNonPreemptive(processes)`, `priorityPreemptive(processes)`, `roundRobin(processes, quantum)`, `multilevelQueue(processes, quantum)`, `multilevelFeedbackQueue(processes, quantum)`
- Produces: `validateProcesses(processes)` → `{ valid: boolean, errors: string[] }`
- Produces: `calculateMetrics(gantt, processes)` → `{ averages, processMetrics }`

- [ ] **Step 1: Write failing tests for validateProcesses**

```javascript
// tests.js - validateProcesses tests
import { validateProcesses } from './scheduler.js';

const valid = [{ pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 1 }];
console.assert(validateProcesses(valid).valid === true, 'Valid processes pass');

const dup = [{ pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 1 }, { pid: 'p1', arrival: 1, burst: 3, priority: 2, queue: 1 }];
console.assert(validateProcesses(dup).valid === false, 'Duplicate PID (case-insensitive) fails');

const badBurst = [{ pid: 'P1', arrival: 0, burst: 0, priority: 1, queue: 1 }];
console.assert(validateProcesses(badBurst).valid === false, 'Burst < 1 fails');

const badArrival = [{ pid: 'P1', arrival: -1, burst: 5, priority: 1, queue: 1 }];
console.assert(validateProcesses(badArrival).valid === false, 'Arrival < 0 fails');

const badQueue = [{ pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 4 }];
console.assert(validateProcesses(badQueue).valid === false, 'Queue > 3 fails');
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests.js`
Expected: ReferenceError (scheduler.js not created)

- [ ] **Step 3: Implement scheduler.js with validateProcesses and shared utilities**

Create `scheduler.js` with:
- `validateProcesses(processes)` — checks unique PID (case-insensitive), arrival >= 0, burst >= 1, priority >= 1, queue in [1,2,3], all integers
- `sortByArrivalThenIndex(processes)` — stable sort helper
- `createProcessCopy(processes)` — deep clone with remainingBurst, originalIndex, firstStartTime = null
- `calculateMetrics(gantt, processes)` — computes completion, turnaround, waiting, response per process + averages
- Export all functions as ES module

- [ ] **Step 4: Run tests to verify validateProcesses passes**

Run: `node tests.js`
Expected: All validateProcesses assertions pass

- [ ] **Step 5: Commit**

```bash
git add scheduler.js tests.js
git commit -m "feat: add scheduler.js with validateProcesses and utilities"
```

---

### Task 2: Implement FCFS, SJF, SRTF Algorithms

**Files:**
- Modify: `scheduler.js`
- Test: `tests.js`

**Interfaces:**
- Consumes: `validateProcesses`, `sortByArrivalThenIndex`, `createProcessCopy`, `calculateMetrics` from Task 1
- Produces: `fcfs(processes)`, `sjf(processes)`, `srtf(processes)` — each returns ResultObject

- [ ] **Step 1: Write failing tests for FCFS (3 cases)**

```javascript
// tests.js - FCFS tests
import { fcfs } from './scheduler.js';

// Test 1: Basic sequential
// P1(at=0,bt=5), P2(at=1,bt=3), P3(at=2,bt=8)
// Gantt: P1[0-5], P2[5-8], P3[8-16]
// WT: P1=0, P2=4, P3=6 → Avg=3.33
// TAT: P1=5, P2=7, P3=14 → Avg=8.67
const t1 = [{pid:'P1',arrival:0,burst:5,priority:1,queue:1},{pid:'P2',arrival:1,burst:3,priority:1,queue:1},{pid:'P3',arrival:2,burst:8,priority:1,queue:1}];
const r1 = fcfs(t1);
console.assert(Math.abs(r1.averages.waiting - 3.33) < 0.01, `FCFS T1 WT: ${r1.averages.waiting}`);
console.assert(Math.abs(r1.averages.turnaround - 8.67) < 0.01, `FCFS T1 TAT: ${r1.averages.turnaround}`);

// Test 2: Gap at start (idle time)
// P1(at=3,bt=4), P2(at=5,bt=2)
// Gantt: IDLE[0-3], P1[3-7], P2[7-9]
// WT: P1=0, P2=2 → Avg=1.0
// TAT: P1=4, P2=4 → Avg=4.0
const t2 = [{pid:'P1',arrival:3,burst:4,priority:1,queue:1},{pid:'P2',arrival:5,burst:2,priority:1,queue:1}];
const r2 = fcfs(t2);
console.assert(Math.abs(r2.averages.waiting - 1.0) < 0.01, `FCFS T2 WT: ${r2.averages.waiting}`);
console.assert(Math.abs(r2.averages.turnaround - 4.0) < 0.01, `FCFS T2 TAT: ${r2.averages.turnaround}`);

// Test 3: Same arrival, tie-break by index
// P1(at=0,bt=3), P2(at=0,bt=5)
// Gantt: P1[0-3], P2[3-8]
// WT: P1=0, P2=3 → Avg=1.5
// TAT: P1=3, P2=8 → Avg=5.5
const t3 = [{pid:'P1',arrival:0,burst:3,priority:1,queue:1},{pid:'P2',arrival:0,burst:5,priority:1,queue:1}];
const r3 = fcfs(t3);
console.assert(Math.abs(r3.averages.waiting - 1.5) < 0.01, `FCFS T3 WT: ${r3.averages.waiting}`);
console.assert(Math.abs(r3.averages.turnaround - 5.5) < 0.01, `FCFS T3 TAT: ${r3.averages.turnaround}`);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests.js`
Expected: FCFS tests fail (function not defined)

- [ ] **Step 3: Implement fcfs(processes) in scheduler.js**

Algorithm: Sort by arrival then index. Iterate: if current time < next arrival, add idle to current time. Run process to completion. Record gantt, log, metrics.

- [ ] **Step 4: Run tests to verify FCFS passes**

Run: `node tests.js`
Expected: All 3 FCFS tests pass

- [ ] **Step 5: Write failing tests for SJF (3 cases)**

```javascript
// tests.js - SJF tests
import { sjf } from './scheduler.js';

// Test 1: SJF picks shortest first
// P1(at=0,bt=6), P2(at=1,bt=3), P3(at=2,bt=8)
// At t=0: only P1 → runs 0-6
// At t=6: P2(bt=3), P3(bt=8) → P2 runs 6-9, P3 runs 9-17
// WT: P1=0, P2=5, P3=7 → Avg=4.0
// TAT: P1=6, P2=8, P3=15 → Avg=9.67
const t1 = [{pid:'P1',arrival:0,burst:6,priority:1,queue:1},{pid:'P2',arrival:1,burst:3,priority:1,queue:1},{pid:'P3',arrival:2,burst:8,priority:1,queue:1}];
const r1 = sjf(t1);
console.assert(Math.abs(r1.averages.waiting - 4.0) < 0.01, `SJF T1 WT: ${r1.averages.waiting}`);
console.assert(Math.abs(r1.averages.turnaround - 9.67) < 0.01, `SJF T1 TAT: ${r1.averages.turnaround}`);

// Test 2: New arrival shorter than remaining
// P1(at=0,bt=8), P2(at=1,bt=4)
// P1 runs 0-1, at t=1 P2 arrives (bt=4 < P1 remaining 7) → P2 runs 1-5, P1 resumes 5-12
// WT: P1=4, P2=0 → Avg=2.0
// TAT: P1=12, P2=4 → Avg=8.0
// Wait - SJF is NON-preemptive! So P1 runs to completion 0-8, P2 runs 8-12
// WT: P1=0, P2=7 → Avg=3.5
// TAT: P1=8, P2=11 → Avg=9.5
const t2 = [{pid:'P1',arrival:0,burst:8,priority:1,queue:1},{pid:'P2',arrival:1,burst:4,priority:1,queue:1}];
const r2 = sjf(t2);
console.assert(Math.abs(r2.averages.waiting - 3.5) < 0.01, `SJF T2 WT: ${r2.averages.waiting}`);
console.assert(Math.abs(r2.averages.turnaround - 9.5) < 0.01, `SJF T2 TAT: ${r2.averages.turnaround}`);

// Test 3: Tie-break by arrival then index
// P1(at=0,bt=4), P2(at=0,bt=4), P3(at=1,bt=2)
// At t=0: P1 and P2 both bt=4 → P1 first (lower index)
// P1 runs 0-4, at t=4: P2(bt=4), P3(arrived at 1, bt=2) → P3 shortest → P3 runs 4-6, P2 runs 6-10
// WT: P1=0, P2=6, P3=3 → Avg=3.0
// TAT: P1=4, P2=10, P3=5 → Avg=6.33
const t3 = [{pid:'P1',arrival:0,burst:4,priority:1,queue:1},{pid:'P2',arrival:0,burst:4,priority:1,queue:1},{pid:'P3',arrival:1,burst:2,priority:1,queue:1}];
const r3 = sjf(t3);
console.assert(Math.abs(r3.averages.waiting - 3.0) < 0.01, `SJF T3 WT: ${r3.averages.waiting}`);
console.assert(Math.abs(r3.averages.turnaround - 6.33) < 0.01, `SJF T3 TAT: ${r3.averages.turnaround}`);
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `node tests.js`
Expected: SJF tests fail

- [ ] **Step 7: Implement sjf(processes) in scheduler.js**

Algorithm: Non-preemptive. At each completion, find all arrived processes, pick shortest burst (tie: arrival, index). Run to completion. Handle idle gaps.

- [ ] **Step 8: Run tests to verify SJF passes**

Run: `node tests.js`
Expected: All 3 SJF tests pass

- [ ] **Step 9: Write failing tests for SRTF (3 cases)**

```javascript
// tests.js - SRTF tests
import { srtf } from './scheduler.js';

// Test 1: Preemption when shorter arrives
// P1(at=0,bt=8), P2(at=1,bt=4)
// t=0: P1 starts
// t=1: P2 arrives (rem=4 < P1 rem=7) → P2 preempts, runs 1-5
// t=5: P1 resumes (rem=7), runs 5-12
// Gantt: P1[0-1], P2[1-5], P1[5-12]
// WT: P1=4, P2=0 → Avg=2.0
// TAT: P1=12, P2=4 → Avg=8.0
// RT: P1=0, P2=0 → Avg=0
const t1 = [{pid:'P1',arrival:0,burst:8,priority:1,queue:1},{pid:'P2',arrival:1,burst:4,priority:1,queue:1}];
const r1 = srtf(t1);
console.assert(Math.abs(r1.averages.waiting - 2.0) < 0.01, `SRTF T1 WT: ${r1.averages.waiting}`);
console.assert(Math.abs(r1.averages.turnaround - 8.0) < 0.01, `SRTF T1 TAT: ${r1.averages.turnaround}`);

// Test 2: No preemption needed
// P1(at=0,bt=4), P2(at=2,bt=6)
// t=0: P1 runs 0-4 (completes before P2 arrives at 2? No, P2 arrives at 2, P1 has rem=2)
// Actually at t=2: P1 rem=2, P2 bt=6 → P1 continues (2 < 6)
// P1 finishes at 4, P2 runs 4-10
// WT: P1=0, P2=2 → Avg=1.0
// TAT: P1=4, P2=8 → Avg=6.0
const t2 = [{pid:'P1',arrival:0,burst:4,priority:1,queue:1},{pid:'P2',arrival:2,burst:6,priority:1,queue:1}];
const r2 = srtf(t2);
console.assert(Math.abs(r2.averages.waiting - 1.0) < 0.01, `SRTF T2 WT: ${r2.averages.waiting}`);
console.assert(Math.abs(r2.averages.turnaround - 6.0) < 0.01, `SRTF T2 TAT: ${r2.averages.turnaround}`);

// Test 3: Equal remaining time tie-break
// P1(at=0,bt=5), P2(at=1,bt=4)
// t=0: P1 starts
// t=1: P2 arrives, rem=4 vs P1 rem=4 → tie! Earlier arrival wins (P1)
// P1 continues 1-5, P2 runs 5-9
// WT: P1=0, P2=4 → Avg=2.0
// TAT: P1=5, P2=8 → Avg=6.5
const t3 = [{pid:'P1',arrival:0,burst:5,priority:1,queue:1},{pid:'P2',arrival:1,burst:4,priority:1,queue:1}];
const r3 = srtf(t3);
console.assert(Math.abs(r3.averages.waiting - 2.0) < 0.01, `SRTF T3 WT: ${r3.averages.waiting}`);
console.assert(Math.abs(r3.averages.turnaround - 6.5) < 0.01, `SRTF T3 TAT: ${r3.averages.turnaround}`);
```

- [ ] **Step 10: Run tests to verify they fail**

Run: `node tests.js`
Expected: SRTF tests fail

- [ ] **Step 11: Implement srtf(processes) in scheduler.js**

Algorithm: Preemptive. Simulate time unit by time unit. At each time, find arrived process with shortest remaining burst. If different from current, preempt (log preemption). Handle new arrivals at same time — tie-break: arrival, index.

- [ ] **Step 12: Run tests to verify SRTF passes**

Run: `node tests.js`
Expected: All 3 SRTF tests pass

- [ ] **Step 13: Commit**

```bash
git add scheduler.js tests.js
git commit -m "feat: implement FCFS, SJF, SRTF algorithms with tests"
```

---

### Task 3: Implement Priority Non-preemptive and Preemptive

**Files:**
- Modify: `scheduler.js`
- Test: `tests.js`

**Interfaces:**
- Consumes: Shared utilities from Task 1
- Produces: `priorityNonPreemptive(processes)`, `priorityPreemptive(processes)`

- [ ] **Step 1: Write failing tests for Priority Non-preemptive (3 cases)**

```javascript
// tests.js - Priority Non-preemptive tests
import { priorityNonPreemptive } from './scheduler.js';

// Test 1: Higher priority (lower number) runs first
// P1(at=0,bt=5,pri=3), P2(at=1,bt=3,pri=1), P3(at=2,bt=4,pri=2)
// At t=0: only P1 → runs 0-5
// At t=5: P2(pri=1), P3(pri=2) → P2 runs 5-8, P3 runs 8-12
// WT: P1=0, P2=4, P3=6 → Avg=3.33
// TAT: P1=5, P2=7, P3=10 → Avg=7.33
const t1 = [{pid:'P1',arrival:0,burst:5,priority:3,queue:1},{pid:'P2',arrival:1,burst:3,priority:1,queue:1},{pid:'P3',arrival:2,burst:4,priority:2,queue:1}];
const r1 = priorityNonPreemptive(t1);
console.assert(Math.abs(r1.averages.waiting - 3.33) < 0.01, `PriNP T1 WT: ${r1.averages.waiting}`);
console.assert(Math.abs(r1.averages.turnaround - 7.33) < 0.01, `PriNP T1 TAT: ${r1.averages.turnaround}`);

// Test 2: Same priority, tie-break by arrival then index
// P1(at=0,bt=4,pri=2), P2(at=0,bt=3,pri=2), P3(at=1,bt=5,pri=1)
// At t=0: P1 and P2 both pri=2 → P1 first (lower index)
// P1 runs 0-4, at t=4: P2(pri=2), P3(pri=1 arrived at 1) → P3 higher priority → P3 runs 4-9, P2 runs 9-12
// WT: P1=0, P2=9, P3=3 → Avg=4.0
// TAT: P1=4, P2=12, P3=8 → Avg=8.0
const t2 = [{pid:'P1',arrival:0,burst:4,priority:2,queue:1},{pid:'P2',arrival:0,burst:3,priority:2,queue:1},{pid:'P3',arrival:1,burst:5,priority:1,queue:1}];
const r2 = priorityNonPreemptive(t2);
console.assert(Math.abs(r2.averages.waiting - 4.0) < 0.01, `PriNP T2 WT: ${r2.averages.waiting}`);
console.assert(Math.abs(r2.averages.turnaround - 8.0) < 0.01, `PriNP T2 TAT: ${r2.averages.turnaround}`);

// Test 3: Priority with gap
// P1(at=5,bt=2,pri=1)
// Gantt: IDLE[0-5], P1[5-7]
// WT: P1=0, TAT: P1=2, RT: P1=0
const t3 = [{pid:'P1',arrival:5,burst:2,priority:1,queue:1}];
const r3 = priorityNonPreemptive(t3);
console.assert(r3.averages.idleTime === 5, `PriNP T3 idle: ${r3.averages.idleTime}`);
console.assert(Math.abs(r3.averages.turnaround - 2.0) < 0.01, `PriNP T3 TAT: ${r3.averages.turnaround}`);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests.js`
Expected: Priority Non-preemptive tests fail

- [ ] **Step 3: Implement priorityNonPreemptive(processes) in scheduler.js**

Algorithm: Like FCFS but at each decision point, pick highest priority (lowest number) from arrived. Tie-break: arrival, index. Non-preemptive — run to completion.

- [ ] **Step 4: Run tests to verify Priority Non-preemptive passes**

Run: `node tests.js`
Expected: All 3 Priority Non-preemptive tests pass

- [ ] **Step 5: Write failing tests for Priority Preemptive (3 cases)**

```javascript
// tests.js - Priority Preemptive tests
import { priorityPreemptive } from './scheduler.js';

// Test 1: Preemption by higher priority
// P1(at=0,bt=8,pri=3), P2(at=1,bt=4,pri=1)
// t=0: P1 starts (pri=3)
// t=1: P2 arrives (pri=1 < 3) → P2 preempts, runs 1-5
// t=5: P1 resumes (pri=3), runs 5-12
// WT: P1=4, P2=0 → Avg=2.0
// TAT: P1=12, P2=4 → Avg=8.0
const t1 = [{pid:'P1',arrival:0,burst:8,priority:3,queue:1},{pid:'P2',arrival:1,burst:4,priority:1,queue:1}];
const r1 = priorityPreemptive(t1);
console.assert(Math.abs(r1.averages.waiting - 2.0) < 0.01, `PriP T1 WT: ${r1.averages.waiting}`);
console.assert(Math.abs(r1.averages.turnaround - 8.0) < 0.01, `PriP T1 TAT: ${r1.averages.turnaround}`);

// Test 2: No preemption - lower priority arrives
// P1(at=0,bt=5,pri=1), P2(at=2,bt=3,pri=2)
// P1 runs 0-5 (pri=1), P2 arrives at 2 but pri=2 > 1 → no preempt
// P2 runs 5-8
// WT: P1=0, P2=3 → Avg=1.5
// TAT: P1=5, P2=6 → Avg=5.5
const t2 = [{pid:'P1',arrival:0,burst:5,priority:1,queue:1},{pid:'P2',arrival:2,burst:3,priority:2,queue:1}];
const r2 = priorityPreemptive(t2);
console.assert(Math.abs(r2.averages.waiting - 1.5) < 0.01, `PriP T2 WT: ${r2.averages.waiting}`);
console.assert(Math.abs(r2.averages.turnaround - 5.5) < 0.01, `PriP T2 TAT: ${r2.averages.turnaround}`);

// Test 3: Same priority, no preemption (arrival tie-break)
// P1(at=0,bt=4,pri=2), P2(at=1,bt=3,pri=2)
// At t=1: both pri=2, P1 arrived earlier → P1 continues
// P1 finishes 4, P2 runs 4-7
// WT: P1=0, P2=3 → Avg=1.5
// TAT: P1=4, P2=6 → Avg=5.0
const t3 = [{pid:'P1',arrival:0,burst:4,priority:2,queue:1},{pid:'P2',arrival:1,burst:3,priority:2,queue:1}];
const r3 = priorityPreemptive(t3);
console.assert(Math.abs(r3.averages.waiting - 1.5) < 0.01, `PriP T3 WT: ${r3.averages.waiting}`);
console.assert(Math.abs(r3.averages.turnaround - 5.0) < 0.01, `PriP T3 TAT: ${r3.averages.turnaround}`);
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `node tests.js`
Expected: Priority Preemptive tests fail

- [ ] **Step 7: Implement priorityPreemptive(processes) in scheduler.js**

Algorithm: Like SRTF but compare priority (lower = higher). At each time unit, check for higher priority arrival. Preempt if found. Tie-break: priority, arrival, index.

- [ ] **Step 8: Run tests to verify Priority Preemptive passes**

Run: `node tests.js`
Expected: All 3 Priority Preemptive tests pass

- [ ] **Step 9: Commit**

```bash
git add scheduler.js tests.js
git commit -m "feat: implement Priority Non-preemptive and Preemptive algorithms"
```

---

### Task 4: Implement Round Robin Algorithm

**Files:**
- Modify: `scheduler.js`
- Test: `tests.js`

**Interfaces:**
- Consumes: Shared utilities from Task 1
- Produces: `roundRobin(processes, quantum)`

- [ ] **Step 1: Write failing tests for Round Robin (3 cases)**

```javascript
// tests.js - Round Robin tests
import { roundRobin } from './scheduler.js';

// Test 1: Basic RR with quantum=4
// P1(at=0,bt=5), P2(at=1,bt=3), P3(at=2,bt=8), quantum=4
// Queue: P1,P2,P3 (new arrivals before preempted)
// t=0: P1 runs min(4,5)=4 → rem=1, queue: P2,P3,P1
// t=4: P2 runs min(4,3)=3 → finishes, queue: P3,P1
// t=7: P3 runs min(4,8)=4 → rem=4, queue: P1,P3
// t=11: P1 runs min(4,1)=1 → finishes, queue: P3
// t=12: P3 runs min(4,4)=4 → finishes
// Gantt: P1[0-4], P2[4-7], P3[7-11], P1[11-12], P3[12-16]
// WT: P1=6, P2=3, P3=4 → Avg=4.33
// TAT: P1=11, P2=6, P3=14 → Avg=10.33
// RT: P1=0, P2=3, P3=5 → Avg=2.67
const t1 = [{pid:'P1',arrival:0,burst:5,priority:1,queue:1},{pid:'P2',arrival:1,burst:3,priority:1,queue:1},{pid:'P3',arrival:2,burst:8,priority:1,queue:1}];
const r1 = roundRobin(t1, 4);
console.assert(Math.abs(r1.averages.waiting - 4.33) < 0.01, `RR T1 WT: ${r1.averages.waiting}`);
console.assert(Math.abs(r1.averages.turnaround - 10.33) < 0.01, `RR T1 TAT: ${r1.averages.turnaround}`);

// Test 2: Quantum larger than all bursts (becomes FCFS)
// P1(at=0,bt=3), P2(at=1,bt=2), quantum=10
// P1 runs 0-3, P2 runs 3-5
// WT: P1=0, P2=2 → Avg=1.0
// TAT: P1=3, P2=4 → Avg=3.5
const t2 = [{pid:'P1',arrival:0,burst:3,priority:1,queue:1},{pid:'P2',arrival:1,burst:2,priority:1,queue:1}];
const r2 = roundRobin(t2, 10);
console.assert(Math.abs(r2.averages.waiting - 1.0) < 0.01, `RR T2 WT: ${r2.averages.waiting}`);
console.assert(Math.abs(r2.averages.turnaround - 3.5) < 0.01, `RR T2 TAT: ${r2.averages.turnaround}`);

// Test 3: New arrival enters before preempted process
// P1(at=0,bt=6), P2(at=2,bt=2), quantum=4
// t=0: P1 runs min(4,6)=4 → rem=2, queue: P1 (but P2 arrives at 2)
// At t=4: P2 arrived at 2, so queue: P2, P1
// t=4: P2 runs min(4,2)=2 → finishes, queue: P1
// t=6: P1 runs min(4,2)=2 → finishes
// Gantt: P1[0-4], P2[4-6], P1[6-8]
// WT: P1=2, P2=2 → Avg=2.0
// TAT: P1=8, P2=4 → Avg=6.0
const t3 = [{pid:'P1',arrival:0,burst:6,priority:1,queue:1},{pid:'P2',arrival:2,burst:2,priority:1,queue:1}];
const r3 = roundRobin(t3, 4);
console.assert(Math.abs(r3.averages.waiting - 2.0) < 0.01, `RR T3 WT: ${r3.averages.waiting}`);
console.assert(Math.abs(r3.averages.turnaround - 6.0) < 0.01, `RR T3 TAT: ${r3.averages.turnaround}`);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests.js`
Expected: Round Robin tests fail

- [ ] **Step 3: Implement roundRobin(processes, quantum) in scheduler.js**

Algorithm: Queue-based. Sort initial by arrival. While queue not empty or arrivals pending: dequeue, run min(quantum, remaining). Add new arrivals (since last time) to queue BEFORE preempted process. If not finished, enqueue at back. Handle idle gaps.

- [ ] **Step 4: Run tests to verify Round Robin passes**

Run: `node tests.js`
Expected: All 3 Round Robin tests pass

- [ ] **Step 5: Commit**

```bash
git add scheduler.js tests.js
git commit -m "feat: implement Round Robin algorithm"
```

---

### Task 5: Implement Multilevel Queue Algorithm

**Files:**
- Modify: `scheduler.js`
- Test: `tests.js`

**Interfaces:**
- Consumes: Shared utilities, `roundRobin` logic (for Queue 1), `fcfs` logic (for Queues 2,3)
- Produces: `multilevelQueue(processes, quantum)`

- [ ] **Step 1: Write failing tests for Multilevel Queue (3 cases)**

```javascript
// tests.js - Multilevel Queue tests
import { multilevelQueue } from './scheduler.js';

// Test 1: Queue 1 (RR) preempts Queue 2 (FCFS)
// P1(at=0,bt=5,queue=2), P2(at=1,bt=3,queue=1), P3(at=2,bt=4,queue=1), quantum=2
// Queue 1: P2,P3 (RR q=2), Queue 2: P1 (FCFS)
// t=0: Only P1 (q2) → runs? No, higher queue checked first. Queue 1 empty → Queue 2 runs P1
// t=1: P2 arrives (q1) → PREEMPTS P1, P2 runs 1-3 (quantum 2)
// t=3: P2 rem=1, P3 arrived at 2 → Queue 1: P3(runs 3-5), P2(runs 5-6)
// t=6: Queue 1 empty → P1 resumes (rem=4) runs 6-10
// Gantt: P1[0-1], P2[1-3], P3[3-5], P2[5-6], P1[6-10]
// WT: P1=5, P2=0, P3=1 → Avg=2.0
// TAT: P1=10, P2=5, P3=3 → Avg=6.0
const t1 = [{pid:'P1',arrival:0,burst:5,priority:1,queue:2},{pid:'P2',arrival:1,burst:3,priority:1,queue:1},{pid:'P3',arrival:2,burst:4,priority:1,queue:1}];
const r1 = multilevelQueue(t1, 2);
console.assert(Math.abs(r1.averages.waiting - 2.0) < 0.01, `MLQ T1 WT: ${r1.averages.waiting}`);
console.assert(Math.abs(r1.averages.turnaround - 6.0) < 0.01, `MLQ T1 TAT: ${r1.averages.turnaround}`);

// Test 2: Queue 3 never runs if 1&2 have processes
// P1(at=0,bt=10,queue=1), P2(at=0,bt=5,queue=2), P3(at=0,bt=3,queue=3), quantum=4
// Queue 1: P1 RR(4) → runs 0-4, 4-8, 8-10
// Queue 2: P2 FCFS → runs after Queue 1 empty (t=10-15)
// Queue 3: P3 FCFS → runs after Queue 2 empty (t=15-18)
const t2 = [{pid:'P1',arrival:0,burst:10,priority:1,queue:1},{pid:'P2',arrival:0,burst:5,priority:1,queue:2},{pid:'P3',arrival:0,burst:3,priority:1,queue:3}];
const r2 = multilevelQueue(t2, 4);
console.assert(r2.processes.find(p=>p.pid==='P1').completion === 10, `MLQ T2 P1 CT: ${r2.processes.find(p=>p.pid==='P1').completion}`);
console.assert(r2.processes.find(p=>p.pid==='P2').completion === 15, `MLQ T2 P2 CT: ${r2.processes.find(p=>p.pid==='P2').completion}`);
console.assert(r2.processes.find(p=>p.pid==='P3').completion === 18, `MLQ T2 P3 CT: ${r2.processes.find(p=>p.pid==='P3').completion}`);

// Test 3: Same queue, FCFS within Queue 2/3
// P1(at=0,bt=4,queue=2), P2(at=1,bt=3,queue=2), P3(at=0,bt=2,queue=1), quantum=3
// Queue 1: P3 runs 0-2 (finishes)
// Queue 2: P1 then P2 FCFS → P1 runs 2-6, P2 runs 6-9
const t3 = [{pid:'P1',arrival:0,burst:4,priority:1,queue:2},{pid:'P2',arrival:1,burst:3,priority:1,queue:2},{pid:'P3',arrival:0,burst:2,priority:1,queue:1}];
const r3 = multilevelQueue(t3, 3);
console.assert(r3.processes.find(p=>p.pid==='P1').completion === 6, `MLQ T3 P1 CT: ${r3.processes.find(p=>p.pid==='P1').completion}`);
console.assert(r3.processes.find(p=>p.pid==='P2').completion === 9, `MLQ T3 P2 CT: ${r3.processes.find(p=>p.pid==='P2').completion}`);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests.js`
Expected: Multilevel Queue tests fail

- [ ] **Step 3: Implement multilevelQueue(processes, quantum) in scheduler.js**

Algorithm: Three queues by `queue` field. Queue 1: RR with quantum. Queues 2,3: FCFS. At each scheduling decision: check Queue 1 first (run RR), if empty check Queue 2 (FCFS), if empty check Queue 3. Higher queue preempts lower. Processes stay in assigned queue.

- [ ] **Step 4: Run tests to verify Multilevel Queue passes**

Run: `node tests.js`
Expected: All 3 Multilevel Queue tests pass

- [ ] **Step 5: Commit**

```bash
git add scheduler.js tests.js
git commit -m "feat: implement Multilevel Queue algorithm"
```

---

### Task 6: Implement Multilevel Feedback Queue Algorithm

**Files:**
- Modify: `scheduler.js`
- Test: `tests.js`

**Interfaces:**
- Consumes: Shared utilities
- Produces: `multilevelFeedbackQueue(processes, quantum)`

- [ ] **Step 1: Write failing tests for Multilevel Feedback Queue (3 cases)**

```javascript
// tests.js - Multilevel Feedback Queue tests
import { multilevelFeedbackQueue } from './scheduler.js';

// Test 1: Demotion after full quantum
// P1(at=0,bt=10), P2(at=1,bt=3), quantum=4
// Level 1: Q=4, Level 2: Q=8, Level 3: FCFS
// t=0: P1 at L1 runs 0-4 (uses full quantum) → demoted to L2
// t=4: P2 arrived at 1 (L1) → P2 runs 4-7 (finishes, bt=3 < Q=4)
// t=7: P1 at L2 (Q=8) runs 7-15 (finishes, rem=6 < 8)
// Gantt: P1[0-4], P2[4-7], P1[7-15]
// WT: P1=4, P2=3 → Avg=3.5
// TAT: P1=15, P2=6 → Avg=10.5
const t1 = [{pid:'P1',arrival:0,burst:10,priority:1,queue:1},{pid:'P2',arrival:1,burst:3,priority:1,queue:1}];
const r1 = multilevelFeedbackQueue(t1, 4);
console.assert(Math.abs(r1.averages.waiting - 3.5) < 0.01, `MLFQ T1 WT: ${r1.averages.waiting}`);
console.assert(Math.abs(r1.averages.turnaround - 10.5) < 0.01, `MLFQ T1 TAT: ${r1.averages.turnaround}`);

// Test 2: New arrival at Level 1 preempts lower level
// P1(at=0,bt=10), P2(at=5,bt=2), quantum=4
// t=0: P1 L1 runs 0-4 (full quantum) → demote to L2
// t=4: P1 L2 runs 4-8 (Q=8, rem=6)
// t=5: P2 arrives at L1 → PREEMPTS P1 at L2
// t=5: P2 L1 runs 5-7 (finishes)
// t=7: P1 L2 resumes 7-13 (rem=6)
// Gantt: P1[0-4], P1[4-5], P2[5-7], P1[7-13]
// WT: P1=3, P2=0 → Avg=1.5
// TAT: P1=13, P2=2 → Avg=7.5
const t2 = [{pid:'P1',arrival:0,burst:10,priority:1,queue:1},{pid:'P2',arrival:5,burst:2,priority:1,queue:1}];
const r2 = multilevelFeedbackQueue(t2, 4);
console.assert(Math.abs(r2.averages.waiting - 1.5) < 0.01, `MLFQ T2 WT: ${r2.averages.waiting}`);
console.assert(Math.abs(r2.averages.turnaround - 7.5) < 0.01, `MLFQ T2 TAT: ${r2.averages.turnaround}`);

// Test 3: Process finishes before quantum - no demotion
// P1(at=0,bt=3), P2(at=0,bt=10), quantum=4
// t=0: P1 L1 runs 0-3 (finishes, bt=3 < Q=4) → NO demotion
// t=3: P2 L1 runs 3-7 (full quantum) → demote to L2
// t=7: P2 L2 runs 7-13 (rem=6 < Q=8) → finishes
// Gantt: P1[0-3], P2[3-7], P2[7-13]
// WT: P1=0, P2=3 → Avg=1.5
// TAT: P1=3, P2=13 → Avg=8.0
const t3 = [{pid:'P1',arrival:0,burst:3,priority:1,queue:1},{pid:'P2',arrival:0,burst:10,priority:1,queue:1}];
const r3 = multilevelFeedbackQueue(t3, 4);
console.assert(Math.abs(r3.averages.waiting - 1.5) < 0.01, `MLFQ T3 WT: ${r3.averages.waiting}`);
console.assert(Math.abs(r3.averages.turnaround - 8.0) < 0.01, `MLFQ T3 TAT: ${r3.averages.turnaround}`);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests.js`
Expected: MLFQ tests fail

- [ ] **Step 3: Implement multilevelFeedbackQueue(processes, quantum) in scheduler.js**

Algorithm: 3 levels. Level 1: RR(Q), Level 2: RR(2Q), Level 3: FCFS. New processes enter Level 1. If process uses full quantum without finishing → demote to next level. Higher level (lower number) preempts lower. At each decision: check Level 1, then 2, then 3. Within level: RR for 1&2, FCFS for 3.

- [ ] **Step 4: Run tests to verify MLFQ passes**

Run: `node tests.js`
Expected: All 3 MLFQ tests pass

- [ ] **Step 5: Commit**

```bash
git add scheduler.js tests.js
git commit -m "feat: implement Multilevel Feedback Queue algorithm"
```

---

### Task 7: Implement runScheduler Dispatcher and Integration Tests

**Files:**
- Modify: `scheduler.js`
- Test: `tests.js`

**Interfaces:**
- Consumes: All 8 algorithm functions
- Produces: `runScheduler(processes, algorithm, quantum)` — dispatches to correct algorithm

- [ ] **Step 1: Write failing tests for runScheduler dispatch**

```javascript
// tests.js - runScheduler tests
import { runScheduler } from './scheduler.js';

const processes = [{pid:'P1',arrival:0,burst:5,priority:1,queue:1},{pid:'P2',arrival:1,burst:3,priority:1,queue:1}];

const algos = ['fcfs','sjf','srtf','priority-nonpreemptive','priority-preemptive','round-robin','multilevel-queue','multilevel-feedback-queue'];
algos.forEach(algo => {
  const result = runScheduler(processes, algo, 4);
  console.assert(result.gantt.length > 0, `${algo}: produces gantt`);
  console.assert(typeof result.averages.waiting === 'number', `${algo}: has avg waiting`);
  console.assert(typeof result.averages.turnaround === 'number', `${algo}: has avg turnaround`);
  console.assert(typeof result.averages.response === 'number', `${algo}: has avg response`);
});

console.log('All runScheduler dispatch tests passed');
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests.js`
Expected: runScheduler not defined

- [ ] **Step 3: Implement runScheduler in scheduler.js**

Dispatcher function mapping algorithm name string to function. Validates algorithm name, passes quantum to algorithms that need it (RR, MLQ, MLFQ).

- [ ] **Step 4: Run all tests to verify everything passes**

Run: `node tests.js`
Expected: All 24 algorithm tests + dispatch tests pass

- [ ] **Step 5: Commit**

```bash
git add scheduler.js tests.js
git commit -m "feat: add runScheduler dispatcher, all 24 tests pass"
```

---

### Task 8: Create style.css — Design System

**Files:**
- Create: `style.css`

**Interfaces:**
- Produces: Complete design system with CSS custom properties, component styles, responsive rules, dark mode, reduced motion

- [ ] **Step 1: Write CSS custom properties (tokens)**

Define all colors, typography, spacing, radius, shadows from spec Section 3.

- [ ] **Step 2: Write base/reset styles**

Box-sizing, root font-size, font-face imports (IBM Plex Sans/Mono from Google Fonts), body styles, focus-visible, selection.

- [ ] **Step 3: Write layout styles**

Header, main, section, footer. Grid/Flex for results area (log + table side-by-side on desktop).

- [ ] **Step 4: Write component styles**

Process table, algorithm select, buttons, Gantt chart (blocks, labels, hatching), execution log, results table, comparison table, theme toggle.

- [ ] **Step 5: Write responsive breakpoints**

≤600px: stack sections, Gantt horizontal scroll, log/table stacked
601-900px: adjusted spacing
>900px: side-by-side log and results

- [ ] **Step 6: Write dark mode & reduced motion**

`@media (prefers-color-scheme: dark)` + `[data-theme="dark"]` override. `@media (prefers-reduced-motion: reduce)` disables transitions.

- [ ] **Step 7: Commit**

```bash
git add style.css
git commit -m "feat: add style.css with design system"
```

---

### Task 9: Create index.html — Semantic Structure

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `style.css`, `scheduler.js` (as module), `app.js` (as module)
- Produces: Accessible HTML structure with all sections from spec Section 5

- [ ] **Step 1: Write HTML skeleton**

Doctype, html[lang="en"], head with meta, title, Google Fonts preconnect, style.css link, theme script (inline to prevent flash).

- [ ] **Step 2: Write header**

Title "CPU Scheduling Simulator", theme toggle button with aria-label.

- [ ] **Step 3: Write process input section**

Table with thead (PID, Arrival, Burst, Priority, Queue, Actions), tbody (dynamic rows), controls below (Add Row, Load Sample, Clear All, Quantum input).

- [ ] **Step 4: Write simulation controls section**

Algorithm select with preemptive badges, Run Simulation button, Compare checkboxes + Compare Selected button.

- [ ] **Step 5: Write results sections**

Gantt chart container (with legend), Execution log (role="log" aria-live="polite"), Results table, Comparison table (hidden initially).

- [ ] **Step 6: Write footer**

Attribution, keyboard shortcuts hint.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add index.html semantic structure"
```

---

### Task 10: Create app.js — UI Logic

**Files:**
- Create: `app.js`

**Interfaces:**
- Consumes: `runScheduler` from `scheduler.js` (ES module import)
- Produces: All UI interactions, validation, rendering, state management

- [ ] **Step 1: Set up module imports and state**

Import `runScheduler`, `validateProcesses` from `./scheduler.js`. State: processes array, current results, comparison results, theme.

- [ ] **Step 2: Implement theme toggle**

Read localStorage/system preference, apply `data-theme` to document, toggle button, persist.

- [ ] **Step 3: Implement process table**

Add row (auto PID), remove row, load sample data (5 varied processes), clear all, inline validation on blur/input.

- [ ] **Step 4: Implement validation**

Check all rules from spec Section 6. Show error messages, focus first invalid, disable Run/Compare buttons when invalid.

- [ ] **Step 5: Implement algorithm selection**

Populate select with 8 options + badges. Store algorithm metadata (preemptive flag).

- [ ] **Step 6: Implement Run Simulation**

Validate, call `runScheduler`, store result, render all outputs.

- [ ] **Step 7: Implement Gantt chart rendering**

Create time-scale blocks, proportional widths (40px/unit), colored by process, hatched idle, time labels, legend.

- [ ] **Step 8: Implement execution log rendering**

Chronological entries with timestamps, monospace, preemption/finish/idle events.

- [ ] **Step 9: Implement results table rendering**

Per-process metrics + footer averages. Monospace for numbers.

- [ ] **Step 10: Implement comparison mode**

Checkboxes per algorithm, Compare Selected button, runs all checked, renders comparison table with green highlight on best (lowest) per column.

- [ ] **Step 11: Implement keyboard accessibility**

Tab navigation, Enter on buttons, Escape to close, focus management.

- [ ] **Step 12: Commit**

```bash
git add app.js
git commit -m "feat: add app.js with full UI logic"
```

---

### Task 11: Create README.md Documentation

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: Documentation for running, algorithm explanations, assumptions

- [ ] **Step 1: Write README**

Sections: How to Run (double-click index.html, `node tests.js`), Algorithm Explanations (2-3 sentences each per spec), Assumptions (tie-breaks, quantum behavior, queue behavior), File Structure, Oral Defense Tips (code walkthrough pointers).

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README.md"
```

---

### Task 12: Final Integration Test and Polish

**Files:**
- All project files

**Interfaces:**
- Consumes: Complete implementation

- [ ] **Step 1: Open index.html in browser**

Verify: loads without errors, theme toggle works, sample data loads, all 8 algorithms run, Gantt renders, log shows, results table correct, comparison works.

- [ ] **Step 2: Run tests.js**

Run: `node tests.js`
Expected: All 24 tests pass

- [ ] **Step 3: Test edge cases**

Empty input, duplicate PID, quantum=0, single process with arrival>0, comparison with 1 algorithm.

- [ ] **Step 4: Test responsiveness**

Resize browser to 375px, verify stacking, horizontal scroll on Gantt.

- [ ] **Step 5: Test accessibility**

Tab through all elements, verify focus styles, screen reader labels.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: complete CPU scheduling simulator"
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-11-06-cpu-scheduling-simulator.md`. Please review the plan. Does it capture what you want?**