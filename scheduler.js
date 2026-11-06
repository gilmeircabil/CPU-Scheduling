/**
 * CPU Scheduling Algorithm Simulator - Core Module
 * Pure algorithm implementations with zero DOM dependencies.
 */

// ============== HELPER FUNCTIONS ==============

export function validateProcesses(processes, options = {}) {
  const errors = [];
  const seenPids = new Set();

  for (let i = 0; i < processes.length; i++) {
    const p = processes[i];
    const pidUpper = p.pid ? String(p.pid).toUpperCase() : '';

    if (!p.pid || typeof p.pid !== 'string' || p.pid.trim() === '') {
      errors.push(`Row ${i + 1}: Process ID is required`);
    } else if (seenPids.has(pidUpper)) {
      errors.push(`Row ${i + 1}: Process ID must be unique`);
    } else {
      seenPids.add(pidUpper);
    }

    if (p.arrival === undefined || p.arrival === null) {
      errors.push(`Row ${i + 1}: Arrival time is required`);
    } else if (!Number.isInteger(p.arrival) || p.arrival < 0) {
      errors.push(`Row ${i + 1}: Arrival time must be a whole number >= 0`);
    }

    if (p.burst === undefined || p.burst === null) {
      errors.push(`Row ${i + 1}: Burst time is required`);
    } else if (!Number.isInteger(p.burst) || p.burst < 1) {
      errors.push(`Row ${i + 1}: Burst time must be a whole number >= 1`);
    }

    if (p.priority === undefined || p.priority === null) {
      errors.push(`Row ${i + 1}: Priority is required`);
    } else if (!Number.isInteger(p.priority) || p.priority < 1) {
      errors.push(`Row ${i + 1}: Priority must be a whole number >= 1`);
    }

    if (p.queue === undefined || p.queue === null) {
      errors.push(`Row ${i + 1}: Queue level is required`);
    } else if (!Number.isInteger(p.queue) || p.queue < 1 || p.queue > 3) {
      errors.push(`Row ${i + 1}: Queue level must be 1, 2, or 3`);
    }
  }

  if (options.quantum !== undefined && options.quantum !== null) {
    if (!Number.isInteger(options.quantum) || options.quantum < 1) {
      errors.push(`Time quantum must be a whole number >= 1`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function createProcessCopy(processes) {
  return processes.map((p, i) => ({
    ...p,
    id: p.pid,
    remainingBurst: p.burst,
    originalIndex: i,
    firstStartTime: null,
    completion: null
  }));
}

function calculateMetrics(gantt, processes) {
  const processMap = new Map();

  for (const p of processes) {
    processMap.set(p.pid, {
      pid: p.pid,
      arrival: p.arrival,
      burst: p.burst,
      priority: p.priority,
      queue: p.queue,
      completion: null,
      turnaround: null,
      waiting: null,
      response: null
    });
  }

  const n = processes.length;

  // Find completion times - update for each segment (last one wins)
  for (const entry of gantt) {
    if (!entry.isIdle) {
      const proc = processMap.get(entry.pid);
      if (proc) {
        proc.completion = entry.end;
      }
    }
  }

  const firstStartTimes = new Map();
  for (const entry of gantt) {
    if (!entry.isIdle && !firstStartTimes.has(entry.pid)) {
      firstStartTimes.set(entry.pid, entry.start);
    }
  }

  let totalWaiting = 0;
  let totalTurnaround = 0;
  let totalResponse = 0;

  const result = [];
  for (const proc of processMap.values()) {
    proc.turnaround = proc.completion - proc.arrival;
    proc.waiting = proc.turnaround - proc.burst;
    proc.response = firstStartTimes.get(proc.pid) - proc.arrival;
    totalWaiting += proc.waiting;
    totalTurnaround += proc.turnaround;
    totalResponse += proc.response;
    result.push(proc);
  }

  const totalIdle = gantt.filter(e => e.isIdle).reduce((sum, e) => sum + (e.end - e.start), 0);

  return {
    processes: result,
    averages: {
      waiting: n > 0 ? totalWaiting / n : 0,
      turnaround: n > 0 ? totalTurnaround / n : 0,
      response: n > 0 ? totalResponse / n : 0,
      idleTime: totalIdle
    }
  };
}

// ============== FCFS ==============

export function fcfs(processes) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;

  const sorted = [...procs].sort((a, b) => {
    if (a.arrival !== b.arrival) return a.arrival - b.arrival;
    return a.originalIndex - b.originalIndex;
  });

  for (const p of sorted) {
    if (currentTime < p.arrival) {
      gantt.push({ pid: 'IDLE', start: currentTime, end: p.arrival, isIdle: true });
      log.push({ time: currentTime, event: 'idle', detail: `CPU idle until ${p.pid} arrives at ${p.arrival}` });
      currentTime = p.arrival;
    }

    gantt.push({ pid: p.pid, start: currentTime, end: currentTime + p.burst, isIdle: false });
    log.push({ time: currentTime, event: 'start', detail: `${p.pid} started` });
    p.firstStartTime = currentTime;
    currentTime += p.burst;
    log.push({ time: currentTime, event: 'finish', detail: `${p.pid} completed` });
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

// ============== SJF ==============

export function sjf(processes) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  const completed = new Set();

  while (completed.size < procs.length) {
    const arrived = procs.filter(p => !completed.has(p.id) && p.arrival <= currentTime);

    if (arrived.length === 0) {
      const remaining = procs.filter(p => !completed.has(p.id));
      if (remaining.length === 0) break;
      const nextArrival = Math.min(...remaining.map(p => p.arrival));

      gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
      log.push({ time: currentTime, event: 'idle', detail: `CPU idle until arrival at ${nextArrival}` });
      currentTime = nextArrival;
      continue;
    }

    arrived.sort((a, b) => {
      if (a.burst !== b.burst) return a.burst - b.burst;
      if (a.arrival !== b.arrival) return a.arrival - b.arrival;
      return a.originalIndex - b.originalIndex;
    });

    const current = arrived[0];
    gantt.push({ pid: current.pid, start: currentTime, end: currentTime + current.burst, isIdle: false });
    log.push({ time: currentTime, event: 'start', detail: `${current.pid} started (burst: ${current.burst})` });
    current.firstStartTime = currentTime;
    currentTime += current.burst;
    completed.add(current.id);
    log.push({ time: currentTime, event: 'finish', detail: `${current.pid} completed` });
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

// ============== SRTF ==============

export function srtf(processes) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  const completed = new Set();
  let runningProc = null;

  const totalBurst = processes.reduce((sum, p) => sum + p.burst, 0);
  const maxArrival = Math.max(...processes.map(p => p.arrival));
  const maxTime = maxArrival + totalBurst + 10;

  while (completed.size < procs.length && currentTime < maxTime) {
    const available = procs.filter(p => !completed.has(p.id) && p.arrival <= currentTime);

    if (available.length === 0) {
      const upcoming = procs.filter(p => !completed.has(p.id));
      if (upcoming.length === 0) break;
      const nextArrival = Math.min(...upcoming.map(p => p.arrival));

      if (nextArrival > currentTime) {
        gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
        log.push({ time: currentTime, event: 'idle', detail: `CPU idle until arrival at ${nextArrival}` });
        currentTime = nextArrival;
        continue;
      }
    }

    available.sort((a, b) => {
      if (a.remainingBurst !== b.remainingBurst) return a.remainingBurst - b.remainingBurst;
      if (a.arrival !== b.arrival) return a.arrival - b.arrival;
      return a.originalIndex - b.originalIndex;
    });

    const nextProc = available[0];

    if (runningProc && runningProc.id !== nextProc.id) {
      log.push({ time: currentTime, event: 'preempt', detail: `${runningProc.id} preempted by ${nextProc.id}` });
      runningProc = null;
    }

    if (!runningProc) {
      runningProc = nextProc;
      runningProc.firstStartTime = runningProc.firstStartTime ?? currentTime;
    }

    const lastEntry = gantt[gantt.length - 1];
    const isNewEntry = !lastEntry || lastEntry.pid !== runningProc.id || lastEntry.end !== currentTime || lastEntry.isIdle;

    if (isNewEntry) {
      gantt.push({ pid: runningProc.id, start: currentTime, end: currentTime + 1, isIdle: false });
    } else {
      lastEntry.end = currentTime + 1;
    }

    runningProc.remainingBurst--;

    if (runningProc.remainingBurst === 0) {
      completed.add(runningProc.id);
      runningProc.completion = currentTime + 1;
      log.push({ time: currentTime + 1, event: 'finish', detail: `${runningProc.id} completed` });
      runningProc = null;
    }

    currentTime++;
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

// ============== PRIORITY NON-PREEMPTIVE ==============

export function priorityNonPreemptive(processes) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  const completed = new Set();

  while (completed.size < procs.length) {
    const arrived = procs.filter(p => !completed.has(p.id) && p.arrival <= currentTime);

    if (arrived.length === 0) {
      const remaining = procs.filter(p => !completed.has(p.id));
      if (remaining.length === 0) break;
      const nextArrival = Math.min(...remaining.map(p => p.arrival));

      if (nextArrival > currentTime) {
        gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
        log.push({ time: currentTime, event: 'idle', detail: `CPU idle until ${nextArrival}` });
        currentTime = nextArrival;
        continue;
      }
    }

    arrived.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.arrival !== b.arrival) return a.arrival - b.arrival;
      return a.originalIndex - b.originalIndex;
    });

    const current = arrived[0];
    gantt.push({ pid: current.pid, start: currentTime, end: currentTime + current.burst, isIdle: false });
    log.push({ time: currentTime, event: 'start', detail: `${current.pid} started (priority: ${current.priority})` });
    current.firstStartTime = currentTime;
    currentTime += current.burst;
    completed.add(current.pid);
    log.push({ time: currentTime, event: 'finish', detail: `${current.pid} completed` });
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

// ============== PRIORITY PREEMPTIVE ==============

export function priorityPreemptive(processes) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  const completed = new Set();
  let runningProc = null;

  while (completed.size < procs.length) {
    const available = procs.filter(p => !completed.has(p.id) && p.arrival <= currentTime);

    if (available.length === 0) {
      const remaining = procs.filter(p => !completed.has(p.id));
      if (remaining.length === 0) break;
      const nextArrival = Math.min(...remaining.map(p => p.arrival));

      if (nextArrival > currentTime) {
        gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
        currentTime = nextArrival;
        continue;
      }
    }

    available.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.arrival !== b.arrival) return a.arrival - b.arrival;
      return a.originalIndex - b.originalIndex;
    });

    const nextProc = available[0];

    if (runningProc && runningProc.id !== nextProc.id) {
      log.push({ time: currentTime, event: 'preempt', detail: `${runningProc.id} preempted by ${nextProc.id}` });
      runningProc = null;
    }

    if (!runningProc) {
      runningProc = nextProc;
      runningProc.firstStartTime = runningProc.firstStartTime ?? currentTime;
    }

    const lastEntry = gantt[gantt.length - 1];
    const isNewEntry = !lastEntry || lastEntry.pid !== runningProc.id || lastEntry.end !== currentTime || lastEntry.isIdle;

    if (isNewEntry && runningProc) {
      gantt.push({ pid: runningProc.id, start: currentTime, end: currentTime + 1, isIdle: false });
    } else if (lastEntry && lastEntry.pid === runningProc.id) {
      lastEntry.end = currentTime + 1;
    }

    runningProc.remainingBurst--;

    if (runningProc.remainingBurst === 0) {
      completed.add(runningProc.id);
      log.push({ time: currentTime + 1, event: 'finish', detail: `${runningProc.id} completed` });
      runningProc = null;
    }

    currentTime++;
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

// ============== ROUND ROBIN ==============

export function roundRobin(processes, quantum = 4) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  const completed = new Set();

  const queue = [];
  const sorted = [...procs].sort((a, b) => {
    if (a.arrival !== b.arrival) return a.arrival - b.arrival;
    return a.originalIndex - b.originalIndex;
  });

  let nextIdx = 0;

  const addArrived = (time) => {
    while (nextIdx < sorted.length && sorted[nextIdx].arrival <= time) {
      queue.push(sorted[nextIdx]);
      nextIdx++;
    }
  };

  while (completed.size < procs.length) {
    addArrived(currentTime);

    if (queue.length === 0) {
      if (nextIdx >= sorted.length) break;
      const nextArrival = sorted[nextIdx].arrival;
      gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
      currentTime = nextArrival;
      continue;
    }

    const currentProc = queue.shift();

    if (completed.has(currentProc.id)) continue;

    currentProc.firstStartTime = currentProc.firstStartTime ?? currentTime;

    const runTime = Math.min(quantum, currentProc.remainingBurst);
    const endTime = currentTime + runTime;

    gantt.push({ pid: currentProc.id, start: currentTime, end: endTime, isIdle: false });
    log.push({ time: currentTime, event: 'start', detail: `${currentProc.id} started` });

    currentProc.remainingBurst -= runTime;
    currentTime = endTime;

    if (currentProc.remainingBurst === 0) {
      completed.add(currentProc.id);
      log.push({ time: currentTime, event: 'finish', detail: `${currentProc.id} completed` });
    } else {
      addArrived(currentTime);
      queue.push(currentProc);
    }
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

// ============== MULTILEVEL QUEUE ==============

export function multilevelQueue(processes, quantum = 4) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  const completed = new Set();

  const queues = { 1: [], 2: [], 3: [] };
  const sorted = [...procs].sort((a, b) => {
    if (a.arrival !== b.arrival) return a.arrival - b.arrival;
    return a.originalIndex - b.originalIndex;
  });

  let nextIdx = 0;
  const addArrived = (time) => {
    while (nextIdx < sorted.length && sorted[nextIdx].arrival <= time) {
      queues[sorted[nextIdx].queue].push(sorted[nextIdx]);
      nextIdx++;
    }
  };

  while (completed.size < procs.length) {
    addArrived(currentTime);

    const highestQ = queues[1].length ? 1 : queues[2].length ? 2 : queues[3].length ? 3 : null;

    if (!highestQ) {
      if (nextIdx >= sorted.length) break;
      const nextArrival = sorted[nextIdx].arrival;
      if (nextArrival > currentTime) {
        gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
        currentTime = nextArrival;
        continue;
      }
    }

    const currentProc = queues[highestQ].shift();

    if (highestQ === 1) {
      // Round Robin
      currentProc.firstStartTime = currentProc.firstStartTime ?? currentTime;
      const runTime = Math.min(quantum, currentProc.remainingBurst);
      gantt.push({ pid: currentProc.id, start: currentTime, end: currentTime + runTime, isIdle: false });
      currentProc.remainingBurst -= runTime;
      currentTime += runTime;
      if (currentProc.remainingBurst === 0) {
        completed.add(currentProc.id);
        log.push({ time: currentTime, event: 'finish', detail: `${currentProc.id} completed` });
      } else {
        queues[1].push(currentProc);
      }
    } else {
      // FCFS
      currentProc.firstStartTime = currentProc.firstStartTime ?? currentTime;
      gantt.push({ pid: currentProc.id, start: currentTime, end: currentTime + currentProc.burst, isIdle: false });
      currentTime += currentProc.burst;
      completed.add(currentProc.id);
    }
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

// ============== MULTILEVEL FEEDBACK QUEUE ==============

export function multilevelFeedbackQueue(processes, quantum = 4) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  const completed = new Set();

  const queues = { 1: [], 2: [], 3: [] };
  const sorted = [...procs].sort((a, b) => {
    if (a.arrival !== b.arrival) return a.arrival - b.arrival;
    return a.originalIndex - b.originalIndex;
  });

  let nextIdx = 0;
  const levelQuantums = { 1: quantum, 2: quantum * 2, 3: Infinity };

  const addArrived = (time) => {
    while (nextIdx < sorted.length && sorted[nextIdx].arrival <= time) {
      queues[1].push({ ...sorted[nextIdx], timeAtLevel: 0 });
      nextIdx++;
    }
  };

  while (completed.size < procs.length) {
    addArrived(currentTime);

    const highestQ = queues[1].length ? 1 : queues[2].length ? 2 : queues[3].length ? 3 : null;

    if (!highestQ) {
      if (nextIdx >= sorted.length) break;
      const nextArrival = sorted[nextIdx].arrival;
      if (nextArrival > currentTime) {
        gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
        currentTime = nextArrival;
        continue;
      }
    }

    const currentProc = queues[highestQ].shift();
    const qQuantum = levelQuantums[highestQ];

    currentProc.firstStartTime = currentProc.firstStartTime ?? currentTime;
    const runTime = Math.min(qQuantum, currentProc.remainingBurst);
    gantt.push({ pid: currentProc.id, start: currentTime, end: currentTime + runTime, isIdle: false });

    currentProc.remainingBurst -= runTime;
    currentProc.timeAtLevel += runTime;
    currentTime += runTime;

    if (currentProc.remainingBurst === 0) {
      completed.add(currentProc.id);
      log.push({ time: currentTime, event: 'finish', detail: `${currentProc.id} completed` });
    } else if (currentProc.timeAtLevel >= qQuantum && highestQ < 3) {
      queues[highestQ + 1].push({ ...currentProc, timeAtLevel: 0 });
    } else {
      queues[highestQ].push(currentProc);
    }
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

// ============== DISPATCHER ==============

export function runScheduler(processes, algorithm, quantum = 4) {
  const algoMap = {
    'fcfs': fcfs,
    'sjf': sjf,
    'srtf': srtf,
    'priority-nonpreemptive': priorityNonPreemptive,
    'priority-preemptive': priorityPreemptive,
    'round-robin': roundRobin,
    'multilevel-queue': multilevelQueue,
    'multilevel-feedback-queue': multilevelFeedbackQueue
  };

  const fn = algoMap[algorithm];
  if (!fn) {
    throw new Error(`Unknown algorithm: ${algorithm}`);
  }

  if (algorithm === 'round-robin' || algorithm === 'multilevel-queue' || algorithm === 'multilevel-feedback-queue') {
    return fn(processes, quantum);
  }

  return fn(processes);
}