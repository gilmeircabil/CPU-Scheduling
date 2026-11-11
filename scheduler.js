/**
 * CPU Scheduling Algorithm Simulator - Core Algorithms
 * Implements FCFS, SJF, Round Robin, and Multilevel Queue.
 */

export function validateProcesses(processes, options = {}) {
  const errors = [];
  const seen = new Set();

  processes.forEach((p, i) => {
    const row = i + 1;
    const pid = typeof p.pid === 'string' ? p.pid.trim() : '';

    if (!pid) {
      errors.push(`Row ${row}: Process ID is required`);
    } else if (seen.has(pid.toUpperCase())) {
      errors.push(`Row ${row}: Process ID must be unique`);
    } else {
      seen.add(pid.toUpperCase());
    }

    if (!Number.isInteger(p.arrival) || p.arrival < 0) {
      errors.push(`Row ${row}: Arrival time must be a whole number >= 0`);
    }
    if (!Number.isInteger(p.burst) || p.burst < 1) {
      errors.push(`Row ${row}: Burst time must be a whole number >= 1`);
    }
    if (!Number.isInteger(p.queue) || p.queue < 1 || p.queue > 3) {
      errors.push(`Row ${row}: Queue level must be 1, 2, or 3`);
    }
  });

  if (options.quantum !== undefined && options.quantum !== null) {
    if (!Number.isInteger(options.quantum) || options.quantum < 1) {
      errors.push(`Time quantum must be a whole number >= 1`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function copyProcesses(processes) {
  return processes.map((p, originalIndex) => ({
    pid: p.pid,
    id: p.pid,
    arrival: p.arrival,
    burst: p.burst,
    queue: p.queue || 1,
    remainingBurst: p.burst,
    originalIndex,
    firstStartTime: null,
    isCompleted: false
  }));
}

function calculateMetrics(gantt, processes) {
  if (!processes || processes.length === 0) {
    return { processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }

  let totalWaiting = 0, totalTurnaround = 0, totalResponse = 0;
  const result = processes.map(p => {
    let completion = 0, firstStartTime = null;
    for (const g of gantt) {
      if (!g.isIdle && g.pid === p.pid) {
        if (firstStartTime === null) firstStartTime = g.start;
        completion = g.end;
      }
    }
    if (firstStartTime === null) firstStartTime = p.arrival;

    const turnaround = completion - p.arrival;
    const waiting = turnaround - p.burst;
    const response = firstStartTime - p.arrival;

    totalWaiting += waiting;
    totalTurnaround += turnaround;
    totalResponse += response;

    return {
      pid: p.pid,
      arrival: p.arrival,
      burst: p.burst,
      queue: p.queue,
      completion,
      turnaround,
      waiting,
      response
    };
  });

  const totalIdle = gantt.reduce((sum, g) => sum + (g.isIdle ? g.end - g.start : 0), 0);
  const n = processes.length;

  return {
    processes: result,
    averages: {
      waiting: totalWaiting / n,
      turnaround: totalTurnaround / n,
      response: totalResponse / n,
      idleTime: totalIdle
    }
  };
}

export function fcfs(processes) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }
  const procs = copyProcesses(processes).sort((a, b) => a.arrival - b.arrival || a.originalIndex - b.originalIndex);
  const gantt = [], log = [];
  let currentTime = 0;

  for (const p of procs) {
    if (currentTime < p.arrival) {
      gantt.push({ pid: 'IDLE', start: currentTime, end: p.arrival, isIdle: true });
      log.push({ time: currentTime, event: 'idle', detail: `CPU idle until ${p.pid} arrives at ${p.arrival}` });
      currentTime = p.arrival;
    }
    gantt.push({ pid: p.pid, start: currentTime, end: currentTime + p.burst, isIdle: false });
    log.push({ time: currentTime, event: 'start', detail: `${p.pid} started` });
    currentTime += p.burst;
    log.push({ time: currentTime, event: 'finish', detail: `${p.pid} completed` });
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

export function sjf(processes) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }
  const procs = copyProcesses(processes);
  const gantt = [], log = [];
  let currentTime = 0, completed = 0;

  while (completed < procs.length) {
    const arrived = procs.filter(p => !p.isCompleted && p.arrival <= currentTime);
    if (arrived.length === 0) {
      const remaining = procs.filter(p => !p.isCompleted);
      if (remaining.length === 0) break;
      const nextArrival = Math.min(...remaining.map(p => p.arrival));
      gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
      log.push({ time: currentTime, event: 'idle', detail: `CPU idle until arrival at ${nextArrival}` });
      currentTime = nextArrival;
      continue;
    }

    arrived.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || a.originalIndex - b.originalIndex);
    const p = arrived[0];
    gantt.push({ pid: p.pid, start: currentTime, end: currentTime + p.burst, isIdle: false });
    log.push({ time: currentTime, event: 'start', detail: `${p.pid} started (burst: ${p.burst})` });
    currentTime += p.burst;
    p.isCompleted = true;
    completed++;
    log.push({ time: currentTime, event: 'finish', detail: `${p.pid} completed` });
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

export function roundRobin(processes, quantum = 4) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }
  const procs = copyProcesses(processes);
  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.originalIndex - b.originalIndex);
  const gantt = [], log = [], queue = [];
  let currentTime = 0, completed = 0, nextIdx = 0;

  const enqueueArrived = () => {
    while (nextIdx < sorted.length && sorted[nextIdx].arrival <= currentTime) {
      queue.push(sorted[nextIdx++]);
    }
  };

  while (completed < procs.length) {
    enqueueArrived();
    if (queue.length === 0) {
      if (nextIdx >= sorted.length) break;
      const nextArrival = sorted[nextIdx].arrival;
      gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
      currentTime = nextArrival;
      continue;
    }

    const p = queue.shift();
    const runTime = Math.min(p.remainingBurst, quantum);
    gantt.push({ pid: p.id, start: currentTime, end: currentTime + runTime, isIdle: false });
    log.push({ time: currentTime, event: 'start', detail: `${p.id} started` });
    p.remainingBurst -= runTime;
    currentTime += runTime;

    if (p.remainingBurst === 0) {
      p.isCompleted = true;
      completed++;
      log.push({ time: currentTime, event: 'finish', detail: `${p.id} completed` });
    } else {
      enqueueArrived();
      queue.push(p);
    }
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

const DEFAULT_QUEUE_CONFIG = { 1: 'round-robin', 2: 'fcfs', 3: 'fcfs' };

export function multilevelQueue(processes, quantum = 4, queueConfig = null) {
  if (!processes || processes.length === 0) {
    return { gantt: [], log: [], processes: [], averages: { waiting: 0, turnaround: 0, response: 0, idleTime: 0 } };
  }
  const procs = copyProcesses(processes);
  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.originalIndex - b.originalIndex);
  const gantt = [], log = [];
  const queues = { 1: [], 2: [], 3: [] };
  const policies = {
    1: queueConfig?.[1] || DEFAULT_QUEUE_CONFIG[1],
    2: queueConfig?.[2] || DEFAULT_QUEUE_CONFIG[2],
    3: queueConfig?.[3] || DEFAULT_QUEUE_CONFIG[3]
  };

  let currentTime = 0, completed = 0, nextIdx = 0;

  const enqueueArrived = () => {
    while (nextIdx < sorted.length && sorted[nextIdx].arrival <= currentTime) {
      const p = sorted[nextIdx++];
      queues[p.queue].push(p);
    }
  };

  while (completed < procs.length) {
    enqueueArrived();
    const activeQ = [1, 2, 3].find(q => queues[q].length > 0);

    if (!activeQ) {
      if (nextIdx >= sorted.length) break;
      const nextArrival = sorted[nextIdx].arrival;
      if (nextArrival > currentTime) {
        gantt.push({ pid: 'IDLE', start: currentTime, end: nextArrival, isIdle: true });
        currentTime = nextArrival;
      }
      continue;
    }

    const policy = policies[activeQ];
    const qList = queues[activeQ];
    let p;

    if (policy === 'sjf') {
      let bestIdx = 0;
      for (let i = 1; i < qList.length; i++) {
        const a = qList[i], b = qList[bestIdx];
        if (a.burst < b.burst || (a.burst === b.burst && (a.arrival < b.arrival || (a.arrival === b.arrival && a.originalIndex < b.originalIndex)))) {
          bestIdx = i;
        }
      }
      p = qList.splice(bestIdx, 1)[0];
    } else {
      p = qList.shift();
    }

    if (policy === 'round-robin' || policy === 'rr') {
      const runTime = Math.min(p.remainingBurst, quantum);
      gantt.push({ pid: p.id, start: currentTime, end: currentTime + runTime, isIdle: false });
      p.remainingBurst -= runTime;
      currentTime += runTime;

      if (p.remainingBurst === 0) {
        p.isCompleted = true;
        completed++;
        log.push({ time: currentTime, event: 'finish', detail: `${p.id} completed` });
      } else {
        queues[activeQ].push(p);
      }
    } else {
      gantt.push({ pid: p.id, start: currentTime, end: currentTime + p.burst, isIdle: false });
      currentTime += p.burst;
      p.isCompleted = true;
      completed++;
      log.push({ time: currentTime, event: 'finish', detail: `${p.id} completed` });
    }
  }

  const metrics = calculateMetrics(gantt, procs);
  return { gantt, log, processes: metrics.processes, averages: metrics.averages };
}

export function runScheduler(processes, algorithm, quantum = 4, queueConfig = null) {
  if (algorithm === 'fcfs') return fcfs(processes);
  if (algorithm === 'sjf') return sjf(processes);
  if (algorithm === 'round-robin') return roundRobin(processes, quantum);
  if (algorithm === 'multilevel-queue') return multilevelQueue(processes, quantum, queueConfig);
  throw new Error(`Unknown algorithm: ${algorithm}`);
}
