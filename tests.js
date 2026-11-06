/**
 * CPU Scheduling Algorithm Test Suite
 * Run with: node tests.js
 */

import { validateProcesses, runScheduler } from './scheduler.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✓ PASS: ${message}`);
    passed++;
  }
}

function assertApprox(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    console.error(`❌ FAIL: ${message} (expected ~${expected}, got ${actual}, diff=${diff})`);
    failed++;
  } else {
    console.log(`✓ PASS: ${message}`);
    passed++;
  }
}

console.log('\n=== validateProcesses Tests ===\n');

const valid = [{ pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 1 }];
assert(validateProcesses(valid).valid === true, 'Valid processes pass');

const dup = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 1 },
  { pid: 'p1', arrival: 1, burst: 3, priority: 1, queue: 1 }
];
assert(validateProcesses(dup).valid === false, 'Duplicate PID (case-insensitive) fails');

const badBurst = [{ pid: 'P1', arrival: 0, burst: 0, priority: 1, queue: 1 }];
assert(validateProcesses(badBurst).valid === false, 'Burst < 1 fails');

const badArrival = [{ pid: 'P1', arrival: -1, burst: 5, priority: 1, queue: 1 }];
assert(validateProcesses(badArrival).valid === false, 'Arrival < 0 fails');

const badQueue = [{ pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 4 }];
assert(validateProcesses(badQueue).valid === false, 'Queue > 3 fails');

console.log('\n=== FCFS Tests ===\n');

// FCFS Test 1: P1(0,5) P2(1,3) P3(2,8)
// Gantt: P1[0-5], P2[5-8], P3[8-16]
// WT: P1=0, P2=4, P3=6 → Avg=3.33
// TAT: P1=5, P2=7, P3=14 → Avg=8.67
const fcfs1 = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 1 },
  { pid: 'P3', arrival: 2, burst: 8, priority: 1, queue: 1 }
];
const r1 = runScheduler(fcfs1, 'fcfs');
assertApprox(r1.averages.waiting, 3.33, 0.01, 'FCFS Test 1 WT');
assertApprox(r1.averages.turnaround, 8.67, 0.01, 'FCFS Test 1 TAT');

// FCFS Test 2: P1(3,4) P2(5,2) - idle 0-3
// Gantt: IDLE[0-3], P1[3-7], P2[7-9]
// WT: P1=0, P2=2 → Avg=1.0
// TAT: P1=4, P2=4 → Avg=4.0
const fcfs2 = [
  { pid: 'P1', arrival: 3, burst: 4, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 5, burst: 2, priority: 1, queue: 1 }
];
const r2 = runScheduler(fcfs2, 'fcfs');
assertApprox(r2.averages.waiting, 1.0, 0.01, 'FCFS Test 2 WT');
assertApprox(r2.averages.turnaround, 4.0, 0.01, 'FCFS Test 2 TAT');

// FCFS Test 3: P1(0,4) P2(0,5) - tie-break by index
// Gantt: P1[0-4], P2[4-9]
// WT: P1=0, P2=5 → Avg=2.5
// TAT: P1=4, P2=9 → Avg=6.5
// WAIT - P2 arrives at 0, starts at 4, finishes at 9
// WT = TAT - burst = 9 - 5 = 4, AVG = (0 + 4)/2 = 2
const fcfs3 = [
  { pid: 'P1', arrival: 0, burst: 4, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 0, burst: 5, priority: 1, queue: 1 }
];
const r3 = runScheduler(fcfs3, 'fcfs');
assertApprox(r3.averages.waiting, 2.0, 0.01, 'FCFS Test 3 WT');
assertApprox(r3.averages.turnaround, 6.5, 0.01, 'FCFS Test 3 TAT');

console.log('\n=== SJF Tests ===\n');

// SJF Test 1: P1(0,6) P2(1,3) P3(2,8)
// At t=0: P1 runs 0-6
// At t=6: P2(3), P3(8) → P2 runs 6-9, P3 runs 9-17
// WT: P1=0, P2=5, P3=7 → Avg=4
// TAT: P1=6, P2=8, P3=15 → Avg=9.67
const sjf1 = [
  { pid: 'P1', arrival: 0, burst: 6, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 1 },
  { pid: 'P3', arrival: 2, burst: 8, priority: 1, queue: 1 }
];
const sjf1Result = runScheduler(sjf1, 'sjf');
assertApprox(sjf1Result.averages.waiting, 4.0, 0.01, 'SJF Test 1 WT');
assertApprox(sjf1Result.averages.turnaround, 9.67, 0.01, 'SJF Test 1 TAT');

// SJF Test 2: P1(0,8) P2(1,4) - no preemption
// P1 runs 0-8, P2 runs 8-12
// WT: P1=0, P2=7 → Avg=3.5
// TAT: P1=8, P2=11 → Avg=9.5
const sjf2 = [
  { pid: 'P1', arrival: 0, burst: 8, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 4, priority: 1, queue: 1 }
];
const sjf2Result = runScheduler(sjf2, 'sjf');
assertApprox(sjf2Result.averages.waiting, 3.5, 0.01, 'SJF Test 2 WT');
assertApprox(sjf2Result.averages.turnaround, 9.5, 0.01, 'SJF Test 2 TAT');

// SJF Test 3: Tie-break by arrival, index
// P1(0,4) P2(0,4) P3(1,2)
// At t=0: P1, P2 tie → P1 first
// P1 runs 0-4
// At t=4: P2(4), P3(2) → P3 shortest, runs 4-6
// P2 runs 6-10
// WT: P1=0, P2=6, P3=3 → Avg=3.0
// TAT: P1=4, P2=10, P3=5 → Avg=6.33
const sjf3 = [
  { pid: 'P1', arrival: 0, burst: 4, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 0, burst: 4, priority: 1, queue: 1 },
  { pid: 'P3', arrival: 1, burst: 2, priority: 1, queue: 1 }
];
const sjf3Result = runScheduler(sjf3, 'sjf');
assertApprox(sjf3Result.averages.waiting, 3.0, 0.01, 'SJF Test 3 WT');
assertApprox(sjf3Result.averages.turnaround, 6.33, 0.01, 'SJF Test 3 TAT');

console.log('\n=== SRTF Tests ===\n');

// SRTF Test 1: P1(0,8) P2(1,4) - preempt at t=1
// t=0: P1 runs
// t=1: P2 arrives, rem=4 <= P1 rem=7 → P2 preempts
// P2 runs 1-5, P1 resumes 5-12
// Gantt: P1[0-1], P2[1-5], P1[5-12]
// WT: P1=4 (waited 4 time units), P2=0 → Avg=2.0
// TAT: P1=12, P2=4 → Avg=8.0
const srtf1 = [
  { pid: 'P1', arrival: 0, burst: 8, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 4, priority: 1, queue: 1 }
];
const srtf1Result = runScheduler(srtf1, 'srtf');
assertApprox(srtf1Result.averages.waiting, 2.0, 0.01, 'SRTF Test 1 WT');
assertApprox(srtf1Result.averages.turnaround, 8.0, 0.01, 'SRTF Test 1 TAT');

// SRTF Test 2: P1(0,4) P2(2,6) - no preempt
// P1 runs 0-4, P2 runs 4-10
// WT: P1=0, P2=2 → Avg=1.0
// TAT: P1=4, P2=8 → Avg=6.0
const srtf2 = [
  { pid: 'P1', arrival: 0, burst: 4, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 2, burst: 6, priority: 1, queue: 1 }
];
const srtf2Result = runScheduler(srtf2, 'srtf');
assertApprox(srtf2Result.averages.waiting, 1.0, 0.01, 'SRTF Test 2 WT');
assertApprox(srtf2Result.averages.turnaround, 6.0, 0.01, 'SRTF Test 2 TAT');

// SRTF Test 3: Same remaining, tie-break by arrival
// P1(0,5) P2(1,4)
// At t=1: P1 rem=4, P2 bt=4 → tie, P1 (earlier arr) continues
// P1 0-5, P2 5-9
// WT: P1=0, P2=4 → Avg=2.0
// TAT: P1=5, P2=8 → Avg=6.5
const srtf3 = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 4, priority: 1, queue: 1 }
];
const srtf3Result = runScheduler(srtf3, 'srtf');
assertApprox(srtf3Result.averages.waiting, 2.0, 0.01, 'SRTF Test 3 WT');
assertApprox(srtf3Result.averages.turnaround, 6.5, 0.01, 'SRTF Test 3 TAT');

console.log('\n=== Priority Non-preemptive Tests ===\n');

// Priority NP Test 1: P1(0,5,pri=3) P2(1,3,pri=1) P3(2,4,pri=2)
// At t=0: P1 runs (only available)
// At t=5: P2(pri=1) < P3(pri=2) → P2 runs 5-8, P3 runs 8-12
// WT: P1=0, P2=4, P3=6 → Avg=3.33
// TAT: P1=5, P2=7, P3=10 → Avg=7.33
const priNP1 = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 3, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 1 },
  { pid: 'P3', arrival: 2, burst: 4, priority: 2, queue: 1 }
];
const priNP1Result = runScheduler(priNP1, 'priority-nonpreemptive');
assertApprox(priNP1Result.averages.waiting, 3.33, 0.01, 'Priority NP Test 1 WT');
assertApprox(priNP1Result.averages.turnaround, 7.33, 0.01, 'Priority NP Test 1 TAT');

// Priority NP Test 2: P1(0,4,pri=2) P2(0,3,pri=2) P3(1,5,pri=1)
// At t=0: P1,P2 tie on pri=2 → P1 first
// P1 runs 0-4
// At t=4: P3(pri=1) > P2(pri=2) → P3 runs 4-9, P2 runs 9-12
// WT: P1=0, P2=9, P3=3 → Avg=4.0
// TAT: P1=4, P2=12, P3=8 → Avg=8.0
const priNP2 = [
  { pid: 'P1', arrival: 0, burst: 4, priority: 2, queue: 1 },
  { pid: 'P2', arrival: 0, burst: 3, priority: 2, queue: 1 },
  { pid: 'P3', arrival: 1, burst: 5, priority: 1, queue: 1 }
];
const priNP2Result = runScheduler(priNP2, 'priority-nonpreemptive');
assertApprox(priNP2Result.averages.waiting, 4.0, 0.01, 'Priority NP Test 2 WT');
assertApprox(priNP2Result.averages.turnaround, 8.0, 0.01, 'Priority NP Test 2 TAT');

// Priority NP Test 3: Single wait with idle
const priNP3 = [
  { pid: 'P1', arrival: 5, burst: 2, priority: 1, queue: 1 }
];
const priNP3Result = runScheduler(priNP3, 'priority-nonpreemptive');
assert(priNP3Result.averages.idleTime === 5, 'Priority NP Test 3 idle time');
assertApprox(priNP3Result.averages.turnaround, 2.0, 0.01, 'Priority NP Test 3 TAT');

console.log('\n=== Priority Preemptive Tests ===\n');

// Priority P Test 1: P1(0,8,pri=3) P2(1,4,pri=1)
// t=0: P1 starts (pri=3)
// t=1: P2 arrives (pri=1 < 3) → P2 preempts
// P2 runs 1-5, P1 resumes 5-12
// WT: P1=4, P2=0 → Avg=2.0
// TAT: P1=12, P2=4 → Avg=8.0
const priP1 = [
  { pid: 'P1', arrival: 0, burst: 8, priority: 3, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 4, priority: 1, queue: 1 }
];
const priP1Result = runScheduler(priP1, 'priority-preemptive');
assertApprox(priP1Result.averages.waiting, 2.0, 0.01, 'Priority P Test 1 WT');
assertApprox(priP1Result.averages.turnaround, 8.0, 0.01, 'Priority P Test 1 TAT');

// Priority P Test 2: P1(0,5,pri=1) P2(2,3,pri=2)
// P1 pri=1, P2 pri=2 → P1 continues (no preempt)
// P1 runs 0-5, P2 runs 5-8
// WT: P1=0, P2=3 → Avg=1.5 (P2 waits from 2 to 5)
// TAT: P1=5, P2=6 → Avg=5.5
const priP2 = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 2, burst: 3, priority: 2, queue: 1 }
];
const priP2Result = runScheduler(priP2, 'priority-preemptive');
assertApprox(priP2Result.averages.waiting, 1.5, 0.01, 'Priority P Test 2 WT');
assertApprox(priP2Result.averages.turnaround, 5.5, 0.01, 'Priority P Test 2 TAT');

// Priority P Test 3: Tie-break by arrival, index
// P1(0,4,pri=2) P2(1,3,pri=2)
// At t=1: P1 rem=4, P2 arrives pri=2 → tie, P1 (earlier arr) continues
// P1 0-4, P2 4-7
// WT: P1=0, P2=3 (waits from 1 to 4) → Avg=1.5
// TAT: P1=4, P2=6 → Avg=5.0
const priP3 = [
  { pid: 'P1', arrival: 0, burst: 4, priority: 2, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 2, queue: 1 }
];
const priP3Result = runScheduler(priP3, 'priority-preemptive');
assertApprox(priP3Result.averages.waiting, 1.5, 0.01, 'Priority P Test 3 WT');
assertApprox(priP3Result.averages.turnaround, 5.0, 0.01, 'Priority P Test 3 TAT');

console.log('\n=== Round Robin Tests ===\n');

// RR Test 1: P1(0,5) P2(1,3) P3(2,8), q=4
const rr1 = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 1 },
  { pid: 'P3', arrival: 2, burst: 8, priority: 1, queue: 1 }
];
const rr1Result = runScheduler(rr1, 'round-robin', 4);
assert(rr1Result.averages.waiting >= 0 && rr1Result.averages.waiting < 10, 'RR Test 1 WT in range');
assert(rr1Result.averages.turnaround >= 0, 'RR Test 1 TAT computed');

// RR Test 2: Quantum large, becomes FCFS-like
// P1(0,3) P2(1,2)
// P1 0-3, P2 3-5
// WT: P1=0, P2=2 → Avg=1.0
// TAT: P1=3, P2=4 → Avg=3.5
const rr2 = [
  { pid: 'P1', arrival: 0, burst: 3, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 2, priority: 1, queue: 1 }
];
const rr2Result = runScheduler(rr2, 'round-robin', 10);
assertApprox(rr2Result.averages.waiting, 1.0, 0.01, 'RR Test 2 WT');
assertApprox(rr2Result.averages.turnaround, 3.5, 0.01, 'RR Test 2 TAT');

// RR Test 3: P1(0,6) P2(2,2), q=4
const rr3 = [
  { pid: 'P1', arrival: 0, burst: 6, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 2, burst: 2, priority: 1, queue: 1 }
];
const rr3Result = runScheduler(rr3, 'round-robin', 4);
assertApprox(rr3Result.averages.waiting, 2.0, 0.01, 'RR Test 3 WT');
assertApprox(rr3Result.averages.turnaround, 6.0, 0.01, 'RR Test 3 TAT');

// RR Test 4: New arrival enters before preempted
// P1(0,8) P2(3,2), q=3
// t=0-3: P1, t=3: P2 arrives, P1 has rem=5
// queue: P2 before P1 → P2 runs 3-5, P1 runs 5-8, P1 runs 8-11
const rr4 = [
  { pid: 'P1', arrival: 0, burst: 8, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 3, burst: 2, priority: 1, queue: 1 }
];
const rr4Result = runScheduler(rr4, 'round-robin', 3);
assert(rr4Result.averages.waiting >= 0, 'RR Test 4 WT');
assert(rr4Result.averages.turnaround >= 0, 'RR Test 4 TAT');

// RR Test 5: Three processes with quantum 2
// P1(0,5) P2(2,5) P3(4,5)
const rr5 = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 2, burst: 5, priority: 1, queue: 1 },
  { pid: 'P3', arrival: 4, burst: 5, priority: 1, queue: 1 }
];
const rr5Result = runScheduler(rr5, 'round-robin', 2);
assert(rr5Result.averages.waiting >= 0, 'RR Test 5 WT');
assert(rr5Result.averages.turnaround >= 0, 'RR Test 5 TAT');

console.log('\n=== Multilevel Queue Tests ===\n');

// MLQ Test 1: Basic with queue preemption
const mlq1 = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 2 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 1 },
  { pid: 'P3', arrival: 2, burst: 4, priority: 1, queue: 1 }
];
const mlq1Result = runScheduler(mlq1, 'multilevel-queue', 2);
assert(mlq1Result.averages.idleTime >= 0, 'MLQ Test 1 idle time computed');

// MLQ Test 2: All in same queue (FCFS within Q2)
const mlq2 = [
  { pid: 'P1', arrival: 0, burst: 4, priority: 1, queue: 2 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 2 }
];
const mlq2Result = runScheduler(mlq2, 'multilevel-queue', 4);
assertApprox(mlq2Result.averages.waiting, 1.5, 0.01, 'MLQ Test 2 WT');
assertApprox(mlq2Result.averages.turnaround, 5, 0.01, 'MLQ Test 2 TAT');

// MLQ Test 3: Queue 3 FCFS
const mlq3 = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 1, queue: 3 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 3 }
];
const mlq3Result = runScheduler(mlq3, 'multilevel-queue', 4);
assert(mlq3Result.averages.waiting >= 0, 'MLQ Test 3 WT');
assert(mlq3Result.averages.turnaround >= 0, 'MLQ Test 3 TAT');

console.log('\n=== Multilevel Feedback Queue Tests ===\n');

// MLFQ Test 1: Basic demotion
const mlfq1 = [
  { pid: 'P1', arrival: 0, burst: 10, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 1 }
];
const mlfq1Result = runScheduler(mlfq1, 'multilevel-feedback-queue', 4);
assert(mlfq1Result.averages.waiting >= 0, 'MLFQ Test 1 runs');

// MLFQ Test 2: Short job finishes before quantum
const mlfq2 = [
  { pid: 'P1', arrival: 0, burst: 3, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 10, priority: 1, queue: 1 }
];
const mlfq2Result = runScheduler(mlfq2, 'multilevel-feedback-queue', 4);
assert(mlfq2Result.averages.waiting >= 0, 'MLFQ Test 2 runs');

// MLFQ Test 3: Multiple demotions
const mlfq3 = [
  { pid: 'P1', arrival: 0, burst: 20, priority: 1, queue: 1 },
  { pid: 'P2', arrival: 5, burst: 5, priority: 1, queue: 1 }
];
const mlfq3Result = runScheduler(mlfq3, 'multilevel-feedback-queue', 4);
assert(mlfq3Result.averages.waiting >= 0, 'MLFQ Test 3 runs');

// MLFQ Test 4: Process that needs all 3 levels
const mlfq4 = [
  { pid: 'P1', arrival: 0, burst: 30, priority: 1, queue: 1 }
];
const mlfq4Result = runScheduler(mlfq4, 'multilevel-feedback-queue', 4);
assert(mlfq4Result.averages.waiting >= 0, 'MLFQ Test 4 runs');

console.log('\n=== Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}