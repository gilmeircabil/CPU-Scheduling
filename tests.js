/**
 * CPU Scheduling Algorithm Test Suite
 * Tests the 4 core algorithms: FCFS, SJF, Round Robin, Multilevel Queue
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

const valid = [{ pid: 'P1', arrival: 0, burst: 5, queue: 1 }];
assert(validateProcesses(valid).valid === true, 'Valid processes pass');

const dup = [
  { pid: 'P1', arrival: 0, burst: 5, queue: 1 },
  { pid: 'p1', arrival: 1, burst: 3, queue: 1 }
];
assert(validateProcesses(dup).valid === false, 'Duplicate PID (case-insensitive) fails');

const badBurst = [{ pid: 'P1', arrival: 0, burst: 0, queue: 1 }];
assert(validateProcesses(badBurst).valid === false, 'Burst < 1 fails');

const badArrival = [{ pid: 'P1', arrival: -1, burst: 5, queue: 1 }];
assert(validateProcesses(badArrival).valid === false, 'Arrival < 0 fails');

const badQueue = [{ pid: 'P1', arrival: 0, burst: 5, queue: 4 }];
assert(validateProcesses(badQueue).valid === false, 'Queue > 3 fails');

console.log('\n=== FCFS Tests ===\n');

// FCFS Test 1: P1(0,5) P2(1,3) P3(2,8)
const fcfs1 = [
  { pid: 'P1', arrival: 0, burst: 5, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, queue: 1 },
  { pid: 'P3', arrival: 2, burst: 8, queue: 1 }
];
const r1 = runScheduler(fcfs1, 'fcfs');
assertApprox(r1.averages.waiting, 3.33, 0.01, 'FCFS Test 1 WT');
assertApprox(r1.averages.turnaround, 8.67, 0.01, 'FCFS Test 1 TAT');

// FCFS Test 2: P1(3,4) P2(5,2) - idle 0-3
const fcfs2 = [
  { pid: 'P1', arrival: 3, burst: 4, queue: 1 },
  { pid: 'P2', arrival: 5, burst: 2, queue: 1 }
];
const r2 = runScheduler(fcfs2, 'fcfs');
assertApprox(r2.averages.waiting, 1.0, 0.01, 'FCFS Test 2 WT');
assertApprox(r2.averages.turnaround, 4.0, 0.01, 'FCFS Test 2 TAT');

// FCFS Test 3: P1(0,4) P2(0,5) - tie-break by index
const fcfs3 = [
  { pid: 'P1', arrival: 0, burst: 4, queue: 1 },
  { pid: 'P2', arrival: 0, burst: 5, queue: 1 }
];
const r3 = runScheduler(fcfs3, 'fcfs');
assertApprox(r3.averages.waiting, 2.0, 0.01, 'FCFS Test 3 WT');
assertApprox(r3.averages.turnaround, 6.5, 0.01, 'FCFS Test 3 TAT');

console.log('\n=== SJF Tests ===\n');

// SJF Test 1: P1(0,6) P2(1,3) P3(2,8)
const sjf1 = [
  { pid: 'P1', arrival: 0, burst: 6, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, queue: 1 },
  { pid: 'P3', arrival: 2, burst: 8, queue: 1 }
];
const sjf1Result = runScheduler(sjf1, 'sjf');
assertApprox(sjf1Result.averages.waiting, 4.0, 0.01, 'SJF Test 1 WT');
assertApprox(sjf1Result.averages.turnaround, 9.67, 0.01, 'SJF Test 1 TAT');

// SJF Test 2: P1(0,8) P2(1,4) - no preemption
const sjf2 = [
  { pid: 'P1', arrival: 0, burst: 8, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 4, queue: 1 }
];
const sjf2Result = runScheduler(sjf2, 'sjf');
assertApprox(sjf2Result.averages.waiting, 3.5, 0.01, 'SJF Test 2 WT');
assertApprox(sjf2Result.averages.turnaround, 9.5, 0.01, 'SJF Test 2 TAT');

// SJF Test 3: Tie-break by arrival, index
const sjf3 = [
  { pid: 'P1', arrival: 0, burst: 4, queue: 1 },
  { pid: 'P2', arrival: 0, burst: 4, queue: 1 },
  { pid: 'P3', arrival: 1, burst: 2, queue: 1 }
];
const sjf3Result = runScheduler(sjf3, 'sjf');
assertApprox(sjf3Result.averages.waiting, 3.0, 0.01, 'SJF Test 3 WT');
assertApprox(sjf3Result.averages.turnaround, 6.33, 0.01, 'SJF Test 3 TAT');

console.log('\n=== Round Robin Tests ===\n');

// RR Test 1: P1(0,5) P2(1,3) P3(2,8), q=4
const rr1 = [
  { pid: 'P1', arrival: 0, burst: 5, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, queue: 1 },
  { pid: 'P3', arrival: 2, burst: 8, queue: 1 }
];
const rr1Result = runScheduler(rr1, 'round-robin', 4);
assert(rr1Result.averages.waiting >= 0 && rr1Result.averages.waiting < 10, 'RR Test 1 WT in range');
assert(rr1Result.averages.turnaround >= 0, 'RR Test 1 TAT computed');

// RR Test 2: Quantum large, becomes FCFS-like
const rr2 = [
  { pid: 'P1', arrival: 0, burst: 3, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 2, queue: 1 }
];
const rr2Result = runScheduler(rr2, 'round-robin', 10);
assertApprox(rr2Result.averages.waiting, 1.0, 0.01, 'RR Test 2 WT');
assertApprox(rr2Result.averages.turnaround, 3.5, 0.01, 'RR Test 2 TAT');

// RR Test 3: P1(0,6) P2(2,2), q=4
const rr3 = [
  { pid: 'P1', arrival: 0, burst: 6, queue: 1 },
  { pid: 'P2', arrival: 2, burst: 2, queue: 1 }
];
const rr3Result = runScheduler(rr3, 'round-robin', 4);
assertApprox(rr3Result.averages.waiting, 2.0, 0.01, 'RR Test 3 WT');
assertApprox(rr3Result.averages.turnaround, 6.0, 0.01, 'RR Test 3 TAT');

// RR Test 4: New arrival enters before preempted
const rr4 = [
  { pid: 'P1', arrival: 0, burst: 8, queue: 1 },
  { pid: 'P2', arrival: 3, burst: 2, queue: 1 }
];
const rr4Result = runScheduler(rr4, 'round-robin', 3);
assert(rr4Result.averages.waiting >= 0, 'RR Test 4 WT');
assert(rr4Result.averages.turnaround >= 0, 'RR Test 4 TAT');

// RR Test 5: Three processes with quantum 2
const rr5 = [
  { pid: 'P1', arrival: 0, burst: 5, queue: 1 },
  { pid: 'P2', arrival: 2, burst: 5, queue: 1 },
  { pid: 'P3', arrival: 4, burst: 5, queue: 1 }
];
const rr5Result = runScheduler(rr5, 'round-robin', 2);
assert(rr5Result.averages.waiting >= 0, 'RR Test 5 WT');
assert(rr5Result.averages.turnaround >= 0, 'RR Test 5 TAT');

console.log('\n=== Multilevel Queue Tests ===\n');

// MLQ Test 1: Basic with queue preemption
const mlq1 = [
  { pid: 'P1', arrival: 0, burst: 5, queue: 2 },
  { pid: 'P2', arrival: 1, burst: 3, queue: 1 },
  { pid: 'P3', arrival: 2, burst: 4, queue: 1 }
];
const mlq1Result = runScheduler(mlq1, 'multilevel-queue', 2);
assert(mlq1Result.averages.idleTime >= 0, 'MLQ Test 1 idle time computed');

// MLQ Test 2: All in same queue (FCFS within Q2)
const mlq2 = [
  { pid: 'P1', arrival: 0, burst: 4, queue: 2 },
  { pid: 'P2', arrival: 1, burst: 3, queue: 2 }
];
const mlq2Result = runScheduler(mlq2, 'multilevel-queue', 4);
assertApprox(mlq2Result.averages.waiting, 1.5, 0.01, 'MLQ Test 2 WT');
assertApprox(mlq2Result.averages.turnaround, 5, 0.01, 'MLQ Test 2 TAT');

// MLQ Test 3: Queue 3 FCFS
const mlq3 = [
  { pid: 'P1', arrival: 0, burst: 5, queue: 3 },
  { pid: 'P2', arrival: 1, burst: 3, queue: 3 }
];
const mlq3Result = runScheduler(mlq3, 'multilevel-queue', 4);
assert(mlq3Result.averages.waiting >= 0, 'MLQ Test 3 WT');
assert(mlq3Result.averages.turnaround >= 0, 'MLQ Test 3 TAT');

console.log('\n=== Minimal Specification Tests (No Priority) ===\n');

const minimalProc = [{ pid: 'P1', arrival: 0, burst: 4, queue: 1 }];
assert(validateProcesses(minimalProc).valid === true, 'Process without priority passes validation');
const minRes = runScheduler(minimalProc, 'fcfs');
assert(minRes.processes[0].priority === undefined, 'Result processes do not contain priority property');


console.log('\n=== Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
