/**
 * CPU Scheduling Algorithm Simulator - Core Module
 * Pure algorithm implementations with zero DOM dependencies.
 * Contains the 4 core scheduling algorithms:
 *   1. FCFS (First-Come, First-Served)
 *   2. SJF (Shortest Job First - Non-preemptive)
 *   3. Round Robin (RR)
 *   4. Multilevel Queue (MLQ)
 */

// ============== HELPER FUNCTIONS ==============

/**
 * Validates the process list and options.
 * Checks that required fields exist, numbers are valid integers, and IDs are unique.
 */
export function validateProcesses(processes, options = {}) {
  const errors = [];
  const seenPids = [];

  for (let i = 0; i < processes.length; i++) {
    const p = processes[i];
    const rowNum = i + 1;
    let pidUpper = '';
    if (p.pid !== undefined && p.pid !== null) {
      pidUpper = String(p.pid).toUpperCase();
    }

    // Check process ID
    if (!p.pid || typeof p.pid !== 'string' || p.pid.trim() === '') {
      errors.push(`Row ${rowNum}: Process ID is required`);
    } else {
      let isDuplicate = false;
      for (let k = 0; k < seenPids.length; k++) {
        if (seenPids[k] === pidUpper) {
          isDuplicate = true;
          break;
        }
      }
      if (isDuplicate) {
        errors.push(`Row ${rowNum}: Process ID must be unique`);
      } else {
        seenPids.push(pidUpper);
      }
    }

    // Check arrival time (must be integer >= 0)
    if (p.arrival === undefined || p.arrival === null) {
      errors.push(`Row ${rowNum}: Arrival time is required`);
    } else if (!Number.isInteger(p.arrival) || p.arrival < 0) {
      errors.push(`Row ${rowNum}: Arrival time must be a whole number >= 0`);
    }

    // Check burst time (must be integer >= 1)
    if (p.burst === undefined || p.burst === null) {
      errors.push(`Row ${rowNum}: Burst time is required`);
    } else if (!Number.isInteger(p.burst) || p.burst < 1) {
      errors.push(`Row ${rowNum}: Burst time must be a whole number >= 1`);
    }

    // Check priority (optional; if provided must be whole number >= 1)
    if (p.priority !== undefined && p.priority !== null) {
      if (!Number.isInteger(p.priority) || p.priority < 1) {
        errors.push(`Row ${rowNum}: Priority must be a whole number >= 1`);
      }
    }

    // Check queue level (must be 1, 2, or 3)
    if (p.queue === undefined || p.queue === null) {
      errors.push(`Row ${rowNum}: Queue level is required`);
    } else if (!Number.isInteger(p.queue) || p.queue < 1 || p.queue > 3) {
      errors.push(`Row ${rowNum}: Queue level must be 1, 2, or 3`);
    }
  }

  // Check quantum (must be integer >= 1 if provided)
  if (options.quantum !== undefined && options.quantum !== null) {
    if (!Number.isInteger(options.quantum) || options.quantum < 1) {
      errors.push(`Time quantum must be a whole number >= 1`);
    }
  }

  return { valid: errors.length === 0, errors: errors };
}

/**
 * Creates a clean working copy of processes with tracking fields.
 */
function createProcessCopy(processes) {
  const copy = [];
  for (let i = 0; i < processes.length; i++) {
    const p = processes[i];
    copy.push({
      pid: p.pid,
      id: p.pid,
      arrival: p.arrival,
      burst: p.burst,
      priority: p.priority || 1,
      queue: p.queue || 1,
      remainingBurst: p.burst,
      originalIndex: i,
      firstStartTime: null,
      completion: null,
      isCompleted: false
    });
  }
  return copy;
}

/**
 * Calculates CT, TAT, WT, RT and averages from the Gantt chart and process list.
 *
 * Formulas:
 *   Completion Time (CT) = time when process finishes its last CPU burst
 *   Turnaround Time (TAT) = Completion Time - Arrival Time
 *   Waiting Time (WT)    = Turnaround Time - Burst Time
 *   Response Time (RT)   = First Start Time - Arrival Time
 *   Average = Total Sum / Number of Processes
 */
function calculateMetrics(gantt, processes) {
  if (!processes || processes.length === 0) {
    return {
      processes: [],
      averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 }
    };
  }

  const n = processes.length;
  const result = [];

  let totalWaiting = 0;
  let totalTurnaround = 0;
  let totalResponse = 0;

  for (let i = 0; i < n; i++) {
    const p = processes[i];

    // 1. Completion Time (CT): end time of the process's last run
    let completion = 0;
    for (let j = 0; j < gantt.length; j++) {
      if (!gantt[j].isIdle && gantt[j].pid === p.pid) {
        completion = gantt[j].end;
      }
    }

    // 2. First Start Time: start time of the process's first run
    let firstStartTime = null;
    for (let j = 0; j < gantt.length; j++) {
      if (!gantt[j].isIdle && gantt[j].pid === p.pid) {
        firstStartTime = gantt[j].start;
        break; // Stop at first appearance
      }
    }
    if (firstStartTime === null) {
      firstStartTime = p.arrival;
    }

    // 3. Turnaround Time = Completion Time - Arrival Time
    // Example: 5 - 1 = 4
    const turnaround = completion - p.arrival;

    // 4. Waiting Time = Turnaround Time - Burst Time
    // Example: 4 - 3 = 1
    const waiting = turnaround - p.burst;

    // 5. Response Time = First Start Time - Arrival Time
    // Example: 2 - 1 = 1
    const response = firstStartTime - p.arrival;

    // Add to running totals
    totalWaiting = totalWaiting + waiting;
    totalTurnaround = totalTurnaround + turnaround;
    totalResponse = totalResponse + response;

    result.push({
      pid: p.pid,
      arrival: p.arrival,
      burst: p.burst,
      priority: p.priority,
      queue: p.queue,
      completion: completion,
      turnaround: turnaround,
      waiting: waiting,
      response: response
    });
  }

  // Total Idle Time = sum of all idle durations (end - start)
  let totalIdle = 0;
  for (let i = 0; i < gantt.length; i++) {
    if (gantt[i].isIdle) {
      const idleDuration = gantt[i].end - gantt[i].start;
      totalIdle = totalIdle + idleDuration;
    }
  }

  // Averages = Total / Number of processes
  const avgWaiting = n > 0 ? totalWaiting / n : 0;
  const avgTurnaround = n > 0 ? totalTurnaround / n : 0;
  const avgResponse = n > 0 ? totalResponse / n : 0;

  return {
    processes: result,
    averages: {
      waiting: avgWaiting,
      turnaround: avgTurnaround,
      response: avgResponse,
      idleTime: totalIdle
    }
  };
}

// ============== 1. FCFS (FIRST-COME, FIRST-SERVED) ==============

export function fcfs(processes) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;

  // Sort by arrival time. Tie-break: original input order
  const sorted = [];
  for (let i = 0; i < procs.length; i++) {
    sorted.push(procs[i]);
  }
  sorted.sort(function (a, b) {
    if (a.arrival !== b.arrival) {
      return a.arrival - b.arrival;
    }
    return a.originalIndex - b.originalIndex;
  });

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];

    // If CPU is idle before process arrives
    if (currentTime < p.arrival) {
      gantt.push({ pid: 'IDLE', start: currentTime, end: p.arrival, isIdle: true });
      log.push({ time: currentTime, event: 'idle', detail: `CPU idle until ${p.pid} arrives at ${p.arrival}` });
      currentTime = p.arrival;
    }

    const startTime = currentTime;
    const endTime = currentTime + p.burst;

    gantt.push({ pid: p.pid, start: startTime, end: endTime, isIdle: false });
    log.push({ time: startTime, event: 'start', detail: `${p.pid} started` });
    p.firstStartTime = startTime;
    currentTime = endTime;
    log.push({ time: endTime, event: 'finish', detail: `${p.pid} completed` });
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt: gantt, log: log, processes: metrics.processes, averages: metrics.averages };
}

// ============== 2. SJF (SHORTEST JOB FIRST - NON-PREEMPTIVE) ==============

export function sjf(processes) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  let completedCount = 0;

  while (completedCount < procs.length) {
    // Collect all arrived, uncompleted processes
    const arrived = [];
    for (let i = 0; i < procs.length; i++) {
      if (!procs[i].isCompleted && procs[i].arrival <= currentTime) {
        arrived.push(procs[i]);
      }
    }

    // If none have arrived, jump CPU to next earliest arrival
    if (arrived.length === 0) {
      let nextArrival = null;
      for (let i = 0; i < procs.length; i++) {
        if (!procs[i].isCompleted) {
          if (nextArrival === null || procs[i].arrival < nextArrival) {
            nextArrival = procs[i].arrival;
          }
        }
      }
      if (nextArrival === null) break;

      gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
      log.push({ time: currentTime, event: 'idle', detail: `CPU idle until arrival at ${nextArrival}` });
      currentTime = nextArrival;
      continue;
    }

    // Sort by shortest burst time. Tie-break: earlier arrival, then input index
    arrived.sort(function (a, b) {
      if (a.burst !== b.burst) {
        return a.burst - b.burst;
      }
      if (a.arrival !== b.arrival) {
        return a.arrival - b.arrival;
      }
      return a.originalIndex - b.originalIndex;
    });

    const current = arrived[0];
    const startTime = currentTime;
    const endTime = currentTime + current.burst;

    gantt.push({ pid: current.pid, start: startTime, end: endTime, isIdle: false });
    log.push({ time: startTime, event: 'start', detail: `${current.pid} started (burst: ${current.burst})` });
    current.firstStartTime = startTime;
    currentTime = endTime;
    current.isCompleted = true;
    completedCount = completedCount + 1;
    log.push({ time: endTime, event: 'finish', detail: `${current.pid} completed` });
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt: gantt, log: log, processes: metrics.processes, averages: metrics.averages };
}

// ============== 3. ROUND ROBIN (RR) ==============

export function roundRobin(processes, quantum = 4) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  let completedCount = 0;

  const queue = [];

  // Sort initially by arrival time
  const sorted = [];
  for (let i = 0; i < procs.length; i++) {
    sorted.push(procs[i]);
  }
  sorted.sort(function (a, b) {
    if (a.arrival !== b.arrival) {
      return a.arrival - b.arrival;
    }
    return a.originalIndex - b.originalIndex;
  });

  let nextIdx = 0;

  // Add newly arrived processes to the back of the queue
  function addArrived(time) {
    while (nextIdx < sorted.length && sorted[nextIdx].arrival <= time) {
      queue.push(sorted[nextIdx]);
      nextIdx = nextIdx + 1;
    }
  }

  while (completedCount < procs.length) {
    addArrived(currentTime);

    // If queue is empty, wait for next arrival
    if (queue.length === 0) {
      if (nextIdx >= sorted.length) break;
      const nextArrival = sorted[nextIdx].arrival;
      gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
      currentTime = nextArrival;
      continue;
    }

    const currentProc = queue.shift();

    if (currentProc.isCompleted) continue;

    if (currentProc.firstStartTime === null) {
      currentProc.firstStartTime = currentTime;
    }

    // Run for quantum or remaining burst, whichever is smaller
    let runTime = quantum;
    if (currentProc.remainingBurst < quantum) {
      runTime = currentProc.remainingBurst;
    }
    const endTime = currentTime + runTime;

    gantt.push({ pid: currentProc.id, start: currentTime, end: endTime, isIdle: false });
    log.push({ time: currentTime, event: 'start', detail: `${currentProc.id} started` });

    currentProc.remainingBurst = currentProc.remainingBurst - runTime;
    currentTime = endTime;

    if (currentProc.remainingBurst === 0) {
      currentProc.isCompleted = true;
      completedCount = completedCount + 1;
      log.push({ time: currentTime, event: 'finish', detail: `${currentProc.id} completed` });
    } else {
      // New arrivals enter before the preempted process is put back
      addArrived(currentTime);
      queue.push(currentProc);
    }
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt: gantt, log: log, processes: metrics.processes, averages: metrics.averages };
}

// ============== 4. MULTILEVEL QUEUE (MLQ) ==============

export function multilevelQueue(processes, quantum = 4) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  const procs = createProcessCopy(processes);
  const gantt = [];
  const log = [];
  let currentTime = 0;
  let completedCount = 0;

  const queues = { 1: [], 2: [], 3: [] };

  const sorted = [];
  for (let i = 0; i < procs.length; i++) {
    sorted.push(procs[i]);
  }
  sorted.sort(function (a, b) {
    if (a.arrival !== b.arrival) {
      return a.arrival - b.arrival;
    }
    return a.originalIndex - b.originalIndex;
  });

  let nextIdx = 0;
  function addArrived(time) {
    while (nextIdx < sorted.length && sorted[nextIdx].arrival <= time) {
      const qNum = sorted[nextIdx].queue;
      queues[qNum].push(sorted[nextIdx]);
      nextIdx = nextIdx + 1;
    }
  }

  while (completedCount < procs.length) {
    addArrived(currentTime);

    // Pick highest priority non-empty queue: Queue 1 > Queue 2 > Queue 3
    let highestQ = null;
    if (queues[1].length > 0) {
      highestQ = 1;
    } else if (queues[2].length > 0) {
      highestQ = 2;
    } else if (queues[3].length > 0) {
      highestQ = 3;
    }

    if (highestQ === null) {
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
      // Queue 1 runs Round Robin
      if (currentProc.firstStartTime === null) {
        currentProc.firstStartTime = currentTime;
      }
      let runTime = quantum;
      if (currentProc.remainingBurst < quantum) {
        runTime = currentProc.remainingBurst;
      }
      const endTime = currentTime + runTime;

      gantt.push({ pid: currentProc.id, start: currentTime, end: endTime, isIdle: false });
      currentProc.remainingBurst = currentProc.remainingBurst - runTime;
      currentTime = endTime;

      if (currentProc.remainingBurst === 0) {
        currentProc.isCompleted = true;
        completedCount = completedCount + 1;
        log.push({ time: currentTime, event: 'finish', detail: `${currentProc.id} completed` });
      } else {
        queues[1].push(currentProc);
      }
    } else {
      // Queues 2 & 3 run FCFS to completion
      if (currentProc.firstStartTime === null) {
        currentProc.firstStartTime = currentTime;
      }
      const endTime = currentTime + currentProc.burst;
      gantt.push({ pid: currentProc.id, start: currentTime, end: endTime, isIdle: false });
      currentTime = endTime;
      currentProc.isCompleted = true;
      completedCount = completedCount + 1;
    }
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt: gantt, log: log, processes: metrics.processes, averages: metrics.averages };
}

// ============== DISPATCHER ==============

export function runScheduler(processes, algorithm, quantum = 4) {
  if (algorithm === 'fcfs') {
    return fcfs(processes);
  }
  if (algorithm === 'sjf') {
    return sjf(processes);
  }
  if (algorithm === 'round-robin') {
    return roundRobin(processes, quantum);
  }
  if (algorithm === 'multilevel-queue') {
    return multilevelQueue(processes, quantum);
  }

  throw new Error(`Unknown algorithm: ${algorithm}`);
}
