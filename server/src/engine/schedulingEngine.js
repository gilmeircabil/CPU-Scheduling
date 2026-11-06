/**
 * CPU Scheduling Algorithm Simulator Engine
 * Implements all 7 algorithms with accurate calculations
 */

// Helper to deep clone processes to avoid mutation
function cloneProcesses(processes) {
  return processes.map(p => ({ ...p }));
}

// Helper to sort by arrival time, then by original index for tie-breaking
function sortByArrivalTime(processes) {
  return processes.map((p, idx) => ({ ...p, _originalIndex: idx }))
    .sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a._originalIndex - b._originalIndex;
    });
}

// Calculate metrics from results
function calculateMetrics(processResults, timeline) {
  const n = processResults.length;
  if (n === 0) {
    return {
      averageWaitingTime: 0,
      averageTurnaroundTime: 0,
      averageResponseTime: 0,
      cpuUtilization: 0,
      totalBurstTime: 0,
      totalExecutionTime: 0,
      totalIdleTime: 0
    };
  }

  const totalWT = processResults.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalTAT = processResults.reduce((sum, p) => sum + p.turnaroundTime, 0);
  const totalRT = processResults.reduce((sum, p) => sum + p.responseTime, 0);
  const totalBurstTime = processResults.reduce((sum, p) => sum + p.burstTime, 0);

  // Calculate total busy time (excluding IDLE)
  const totalBusyTime = timeline
    .filter(t => t.processId !== 'IDLE')
    .reduce((sum, t) => sum + t.duration, 0);

  const totalIdleTime = timeline
    .filter(t => t.processId === 'IDLE')
    .reduce((sum, t) => sum + t.duration, 0);

  // Total elapsed time from start to end
  const totalExecutionTime = timeline.length > 0 
    ? timeline[timeline.length - 1].endTime - timeline[0].startTime
    : 0;

  const cpuUtilization = totalExecutionTime > 0 
    ? (totalBusyTime / totalExecutionTime) * 100 
    : 0;

  return {
    averageWaitingTime: Number((totalWT / n).toFixed(2)),
    averageTurnaroundTime: Number((totalTAT / n).toFixed(2)),
    averageResponseTime: Number((totalRT / n).toFixed(2)),
    cpuUtilization: Number(cpuUtilization.toFixed(2)),
    totalBurstTime,
    totalExecutionTime,
    totalIdleTime
  };
}

/**
 * A. First Come, First Served (FCFS) - Non-preemptive
 */
export function fcfs(processes) {
  const procs = sortByArrivalTime(cloneProcesses(processes));
  const n = procs.length;
  
  const processResults = [];
  const timeline = [];
  
  let currentTime = 0;
  
  for (let i = 0; i < procs.length; i++) {
    const p = procs[i];
    
    // Handle idle time if CPU is free
    if (currentTime < p.arrivalTime) {
      timeline.push({
        processId: 'IDLE',
        startTime: currentTime,
        endTime: p.arrivalTime,
        duration: p.arrivalTime - currentTime,
        queueLevel: null
      });
      currentTime = p.arrivalTime;
    }
    
    // Execute process
    const startTime = currentTime;
    const completionTime = currentTime + p.burstTime;
    const responseTime = startTime - p.arrivalTime;
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    
    timeline.push({
      processId: p.processId,
      startTime,
      endTime: completionTime,
      duration: p.burstTime,
      queueLevel: p.queueLevel !== undefined ? p.queueLevel : null
    });
    
    processResults.push({
      processId: p.processId,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority !== undefined ? p.priority : null,
      queueLevel: p.queueLevel !== undefined ? p.queueLevel : null,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime
    });
    
    currentTime = completionTime;
  }
  
  const metrics = calculateMetrics(processResults, timeline);
  
  return {
    algorithm: 'FCFS',
    algorithmType: 'Non-preemptive',
    processResults,
    timeline,
    metrics,
    events: []
  };
}

/**
 * B. Shortest Job First (SJF) - Non-preemptive
 */
export function sjf(processes) {
  const procs = cloneProcesses(processes).map((p, idx) => ({ ...p, _originalIndex: idx }));
  const n = procs.length;
  
  const processResults = [];
  const timeline = [];
  const completed = [];
  
  let currentTime = 0;
  const readyQueue = [];
  
  // Use event list by arrival times
  while (completed.length < n) {
    // Add all arrived processes
    for (let i = 0; i < procs.length; i++) {
      const p = procs[i];
      if (p.arrivalTime <= currentTime && !p._inQueue && !p._completed) {
        p._inQueue = true;
        readyQueue.push(p);
      }
    }
    
    if (readyQueue.length === 0) {
      // Find next arrival
      const nextArrival = Math.min(...procs.filter(p => !p._completed).map(p => p.arrivalTime));
      if (currentTime < nextArrival) {
        timeline.push({
          processId: 'IDLE',
          startTime: currentTime,
          endTime: nextArrival,
          duration: nextArrival - currentTime,
          queueLevel: null
        });
        currentTime = nextArrival;
        continue;
      }
    }
    
    // Select process with shortest burst time, tie-break by arrival time then original index
    readyQueue.sort((a, b) => {
      if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a._originalIndex - b._originalIndex;
    });
    
    const selected = readyQueue.shift();
    selected._completed = true;
    
    // Execute
    const startTime = currentTime;
    const completionTime = currentTime + selected.burstTime;
    const responseTime = startTime - selected.arrivalTime;
    const turnaroundTime = completionTime - selected.arrivalTime;
    const waitingTime = turnaroundTime - selected.burstTime;
    
    timeline.push({
      processId: selected.processId,
      startTime,
      endTime: completionTime,
      duration: selected.burstTime,
      queueLevel: selected.queueLevel !== undefined ? selected.queueLevel : null
    });
    
    processResults.push({
      processId: selected.processId,
      arrivalTime: selected.arrivalTime,
      burstTime: selected.burstTime,
      priority: selected.priority !== undefined ? selected.priority : null,
      queueLevel: selected.queueLevel !== undefined ? selected.queueLevel : null,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime
    });
    
    currentTime = completionTime;
    completed.push(selected);
  }
  
  // Sort results by processId to match input order in presentation
  const metrics = calculateMetrics(processResults, timeline);
  
  return {
    algorithm: 'SJF',
    algorithmType: 'Non-preemptive',
    processResults,
    timeline,
    metrics,
    events: []
  };
}

/**
 * C. Shortest Remaining Time First (SRTF) - Preemptive
 */
export function srtf(processes) {
  const procs = cloneProcesses(processes).map((p, idx) => ({ 
    ...p, 
    _originalIndex: idx,
    remainingTime: p.burstTime,
    started: false,
    firstStartTime: -1
  }));
  const n = procs.length;
  
  const timeline = [];
  const processResults = [];
  
  let currentTime = 0;
  const completed = [];
  
  while (completed.length < n) {
    // Find process with shortest remaining time among arrived
    const available = procs.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0 && !completed.includes(p));
    
    if (available.length === 0) {
      // Find next arrival
      const notArrived = procs.filter(p => p.arrivalTime > currentTime && p.remainingTime > 0);
      if (notArrived.length === 0) break;
      const nextArrival = Math.min(...notArrived.map(p => p.arrivalTime));
      timeline.push({
        processId: 'IDLE',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime,
        queueLevel: null
      });
      currentTime = nextArrival;
      continue;
    }
    
    // Sort by remaining time, tie-break by arrival time then original index
    available.sort((a, b) => {
      if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a._originalIndex - b._originalIndex;
    });
    
    const selected = available[0];
    
    if (!selected.started) {
      selected.started = true;
      selected.firstStartTime = currentTime;
    }
    
    // Check if we can merge with last timeline entry if same process
    const lastEntry = timeline[timeline.length - 1];
    if (lastEntry && lastEntry.processId === selected.processId && lastEntry.endTime === currentTime) {
      // Continue execution
      lastEntry.endTime = currentTime + 1;
      lastEntry.duration += 1;
    } else {
      timeline.push({
        processId: selected.processId,
        startTime: currentTime,
        endTime: currentTime + 1,
        duration: 1,
        queueLevel: selected.queueLevel !== undefined ? selected.queueLevel : null
      });
    }
    
    selected.remainingTime -= 1;
    currentTime += 1;
    
    if (selected.remainingTime === 0) {
      completed.push(selected);
      const completionTime = currentTime;
      const responseTime = selected.firstStartTime - selected.arrivalTime;
      const turnaroundTime = completionTime - selected.arrivalTime;
      const waitingTime = turnaroundTime - selected.burstTime;
      
      processResults.push({
        processId: selected.processId,
        arrivalTime: selected.arrivalTime,
        burstTime: selected.burstTime,
        priority: selected.priority !== undefined ? selected.priority : null,
        queueLevel: selected.queueLevel !== undefined ? selected.queueLevel : null,
        completionTime,
        turnaroundTime,
        waitingTime,
        responseTime
      });
    }
  }
  
  const metrics = calculateMetrics(processResults, timeline);
  
  return {
    algorithm: 'SRTF',
    algorithmType: 'Preemptive',
    processResults,
    timeline,
    metrics,
    events: []
  };
}

/**
 * D. Priority Scheduling - Non-preemptive (Smaller number = higher priority)
 */
export function priorityScheduling(processes) {
  const procs = cloneProcesses(processes).map((p, idx) => ({ ...p, _originalIndex: idx }));
  const n = procs.length;
  
  const processResults = [];
  const timeline = [];
  
  let currentTime = 0;
  const completed = [];
  
  while (completed.length < n) {
    // Add arrived processes
    const available = procs.filter(p => p.arrivalTime <= currentTime && !p._completed);
    
    if (available.length === 0) {
      const notArrived = procs.filter(p => !p._completed);
      if (notArrived.length === 0) break;
      const nextArrival = Math.min(...notArrived.map(p => p.arrivalTime));
      timeline.push({
        processId: 'IDLE',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime,
        queueLevel: null
      });
      currentTime = nextArrival;
      continue;
    }
    
    // Sort by priority (smaller number = higher priority), tie-break by arrival time, then original index
    available.sort((a, b) => {
      const priorityA = a.priority !== undefined ? a.priority : 999;
      const priorityB = b.priority !== undefined ? b.priority : 999;
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a._originalIndex - b._originalIndex;
    });
    
    const selected = available[0];
    selected._completed = true;
    
    const startTime = currentTime;
    const completionTime = currentTime + selected.burstTime;
    const responseTime = startTime - selected.arrivalTime;
    const turnaroundTime = completionTime - selected.arrivalTime;
    const waitingTime = turnaroundTime - selected.burstTime;
    
    timeline.push({
      processId: selected.processId,
      startTime,
      endTime: completionTime,
      duration: selected.burstTime,
      queueLevel: selected.queueLevel !== undefined ? selected.queueLevel : null
    });
    
    processResults.push({
      processId: selected.processId,
      arrivalTime: selected.arrivalTime,
      burstTime: selected.burstTime,
      priority: selected.priority !== undefined ? selected.priority : null,
      queueLevel: selected.queueLevel !== undefined ? selected.queueLevel : null,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime
    });
    
    currentTime = completionTime;
    completed.push(selected);
  }
  
  const metrics = calculateMetrics(processResults, timeline);
  
  return {
    algorithm: 'Priority',
    algorithmType: 'Non-preemptive Priority Scheduling',
    processResults,
    timeline,
    metrics,
    events: []
  };
}

/**
 * E. Round Robin (RR) - Preemptive
 */
export function roundRobin(processes, quantum = 2) {
  const q = parseInt(quantum);
  if (!q || q <= 0 || isNaN(q)) {
    throw new Error('Time quantum must be a positive integer');
  }
  
  const procs = cloneProcesses(processes).map((p, idx) => ({ 
    ...p, 
    _originalIndex: idx,
    remainingTime: p.burstTime,
    started: false,
    firstStartTime: -1
  }));
  const n = procs.length;
  
  const timeline = [];
  const processResults = [];
  const readyQueue = [];
  
  let currentTime = 0;
  const completed = [];
  let lastProcessId = null;
  
  // Sort processes by arrival for initial queue
  const sortedByArrival = [...procs].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a._originalIndex - b._originalIndex;
  });
  
  let arrivalIndex = 0;
  
  while (completed.length < n) {
    // Add newly arrived processes to ready queue
    while (arrivalIndex < sortedByArrival.length && sortedByArrival[arrivalIndex].arrivalTime <= currentTime) {
      const arrivingProc = sortedByArrival[arrivalIndex];
      // Check if not already in ready queue and not completed
      const alreadyQueued = readyQueue.find(p => p.processId === arrivingProc.processId && p.remainingTime > 0);
      const isCompleted = completed.find(p => p.processId === arrivingProc.processId);
      if (!alreadyQueued && !isCompleted && arrivingProc.remainingTime > 0) {
        // Clone and add to queue
        readyQueue.push(arrivingProc);
      }
      arrivalIndex++;
    }
    
    if (readyQueue.length === 0) {
      // Find next arrival
      const notArrived = procs.filter(p => p.arrivalTime > currentTime && p.remainingTime > 0);
      if (notArrived.length === 0) break;
      const nextArrival = Math.min(...notArrived.map(p => p.arrivalTime));
      timeline.push({
        processId: 'IDLE',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime,
        queueLevel: null
      });
      currentTime = nextArrival;
      continue;
    }
    
    const selected = readyQueue.shift();
    
    if (!selected.started) {
      selected.started = true;
      selected.firstStartTime = currentTime;
    }
    
    const execTime = Math.min(selected.remainingTime, q);
    
    timeline.push({
      processId: selected.processId,
      startTime: currentTime,
      endTime: currentTime + execTime,
      duration: execTime,
      queueLevel: selected.queueLevel !== undefined ? selected.queueLevel : null
    });
    
    selected.remainingTime -= execTime;
    currentTime += execTime;
    
    // Add newly arrived processes during this time slice
    while (arrivalIndex < sortedByArrival.length && sortedByArrival[arrivalIndex].arrivalTime <= currentTime) {
      const arrivingProc = sortedByArrival[arrivalIndex];
      const alreadyQueued = readyQueue.find(p => p.processId === arrivingProc.processId && p.remainingTime > 0);
      const isCompleted = completed.find(p => p.processId === arrivingProc.processId);
      if (!alreadyQueued && !isCompleted && arrivingProc.remainingTime > 0) {
        readyQueue.push(arrivingProc);
      }
      arrivalIndex++;
    }
    
    if (selected.remainingTime === 0) {
      // Process completed
      completed.push(selected);
      const completionTime = currentTime;
      const responseTime = selected.firstStartTime - selected.arrivalTime;
      const turnaroundTime = completionTime - selected.arrivalTime;
      const waitingTime = turnaroundTime - selected.burstTime;
      
      processResults.push({
        processId: selected.processId,
        arrivalTime: selected.arrivalTime,
        burstTime: selected.burstTime,
        priority: selected.priority !== undefined ? selected.priority : null,
        queueLevel: selected.queueLevel !== undefined ? selected.queueLevel : null,
        completionTime,
        turnaroundTime,
        waitingTime,
        responseTime
      });
    } else {
      // Move to end of queue
      readyQueue.push(selected);
    }
  }
  
  const metrics = calculateMetrics(processResults, timeline);
  
  return {
    algorithm: 'RoundRobin',
    algorithmType: 'Preemptive',
    processResults,
    timeline,
    metrics,
    events: [],
    configuration: { quantum: q }
  };
}

/**
 * F. Multilevel Queue (MLQ) - Queue-based
 * Queue 0: High-priority, Round Robin (default quantum 2)
 * Queue 1: Low-priority, FCFS
 * Queue 0 has strict priority over Queue 1
 */
export function multilevelQueue(processes, quantum0 = 2) {
  const q0 = parseInt(quantum0);
  if (!q0 || q0 <= 0 || isNaN(q0)) {
    throw new Error('Queue 0 time quantum must be a positive integer');
  }
  
  const procs = cloneProcesses(processes).map((p, idx) => ({ 
    ...p, 
    _originalIndex: idx,
    remainingTime: p.burstTime,
    started: false,
    firstStartTime: -1,
    queueLevel: p.queueLevel !== undefined ? p.queueLevel : 1
  }));
  const n = procs.length;
  
  const timeline = [];
  const processResults = [];
  const queue0 = []; // High priority - RR
  const queue1 = []; // Low priority - FCFS
  
  let currentTime = 0;
  const completed = [];
  
  const sortedByArrival = [...procs].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a._originalIndex - b._originalIndex;
  });
  
  let arrivalIndex = 0;
  
  while (completed.length < n) {
    // Add newly arrived processes
    while (arrivalIndex < sortedByArrival.length && sortedByArrival[arrivalIndex].arrivalTime <= currentTime) {
      const arrivingProc = sortedByArrival[arrivalIndex];
      const alreadyQueued = [...queue0, ...queue1].find(p => p.processId === arrivingProc.processId && p.remainingTime > 0);
      const isCompleted = completed.find(p => p.processId === arrivingProc.processId);
      if (!alreadyQueued && !isCompleted && arrivingProc.remainingTime > 0) {
        if (arrivingProc.queueLevel === 0) {
          queue0.push(arrivingProc);
        } else {
          queue1.push(arrivingProc);
        }
      }
      arrivalIndex++;
    }
    
    // Queue 0 has strict priority
    if (queue0.length > 0) {
      const selected = queue0.shift();
      
      if (!selected.started) {
        selected.started = true;
        selected.firstStartTime = currentTime;
      }
      
      const execTime = Math.min(selected.remainingTime, q0);
      
      timeline.push({
        processId: selected.processId,
        startTime: currentTime,
        endTime: currentTime + execTime,
        duration: execTime,
        queueLevel: 0
      });
      
      selected.remainingTime -= execTime;
      currentTime += execTime;
      
      // Add arrived during execution
      while (arrivalIndex < sortedByArrival.length && sortedByArrival[arrivalIndex].arrivalTime <= currentTime) {
        const arrivingProc = sortedByArrival[arrivalIndex];
        const alreadyQueued = [...queue0, ...queue1].find(p => p.processId === arrivingProc.processId && p.remainingTime > 0);
        const isCompleted = completed.find(p => p.processId === arrivingProc.processId);
        if (!alreadyQueued && !isCompleted && arrivingProc.remainingTime > 0) {
          if (arrivingProc.queueLevel === 0) {
            queue0.push(arrivingProc);
          } else {
            queue1.push(arrivingProc);
          }
        }
        arrivalIndex++;
      }
      
      if (selected.remainingTime === 0) {
        completed.push(selected);
        const completionTime = currentTime;
        const responseTime = selected.firstStartTime - selected.arrivalTime;
        const turnaroundTime = completionTime - selected.arrivalTime;
        const waitingTime = turnaroundTime - selected.burstTime;
        
        processResults.push({
          processId: selected.processId,
          arrivalTime: selected.arrivalTime,
          burstTime: selected.burstTime,
          priority: selected.priority !== undefined ? selected.priority : null,
          queueLevel: 0,
          completionTime,
          turnaroundTime,
          waitingTime,
          responseTime
        });
      } else {
        // If preempted by new arrival in queue0? Queue0 uses RR, move to end of queue0
        queue0.push(selected);
      }
    } else if (queue1.length > 0) {
      // Queue 1 uses FCFS
      const selected = queue1.shift();
      
      if (!selected.started) {
        selected.started = true;
        selected.firstStartTime = currentTime;
      }
      
      // Check for preemption by queue0 before starting? But queue0 empty now
      // Execute until completion or until queue0 gets something (but we check at start of loop)
      const startTime = currentTime;
      const completionTime = currentTime + selected.remainingTime;
      const responseTime = startTime - selected.arrivalTime;
      const turnaroundTime = completionTime - selected.arrivalTime;
      const waitingTime = turnaroundTime - selected.burstTime;
      
      timeline.push({
        processId: selected.processId,
        startTime,
        endTime: completionTime,
        duration: selected.remainingTime,
        queueLevel: 1
      });
      
      selected.remainingTime = 0;
      currentTime = completionTime;
      
      // Add arrived during execution
      while (arrivalIndex < sortedByArrival.length && sortedByArrival[arrivalIndex].arrivalTime <= currentTime) {
        const arrivingProc = sortedByArrival[arrivalIndex];
        const alreadyQueued = [...queue0, ...queue1].find(p => p.processId === arrivingProc.processId && p.remainingTime > 0);
        const isCompleted = completed.find(p => p.processId === arrivingProc.processId);
        if (!alreadyQueued && !isCompleted && arrivingProc.remainingTime > 0) {
          if (arrivingProc.queueLevel === 0) {
            queue0.push(arrivingProc);
          } else {
            queue1.push(arrivingProc);
          }
        }
        arrivalIndex++;
      }
      
      completed.push(selected);
      processResults.push({
        processId: selected.processId,
        arrivalTime: selected.arrivalTime,
        burstTime: selected.burstTime,
        priority: selected.priority !== undefined ? selected.priority : null,
        queueLevel: 1,
        completionTime,
        turnaroundTime,
        waitingTime,
        responseTime
      });
    } else {
      // Idle
      const notArrived = procs.filter(p => p.arrivalTime > currentTime && p.remainingTime > 0);
      if (notArrived.length === 0) break;
      const nextArrival = Math.min(...notArrived.map(p => p.arrivalTime));
      timeline.push({
        processId: 'IDLE',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime,
        queueLevel: null
      });
      currentTime = nextArrival;
    }
  }
  
  const metrics = calculateMetrics(processResults, timeline);
  
  return {
    algorithm: 'MLQ',
    algorithmType: 'Multilevel Queue',
    processResults,
    timeline,
    metrics,
    events: [],
    configuration: { queue0Quantum: q0, queuePolicies: { queue0: 'RR', queue1: 'FCFS' } }
  };
}

/**
 * G. Multilevel Feedback Queue (MLFQ) - 3 queues
 * Queue 0: Highest priority, RR quantum 2
 * Queue 1: Medium priority, RR quantum 4
 * Queue 2: Lowest priority, FCFS
 * New processes enter Queue 0, demoted if use full quantum
 */
export function multilevelFeedbackQueue(processes, config = {}) {
  const quantum0 = config.quantum0 !== undefined ? parseInt(config.quantum0) : 2;
  const quantum1 = config.quantum1 !== undefined ? parseInt(config.quantum1) : 4;
  
  if (!quantum0 || quantum0 <= 0 || isNaN(quantum0) || !quantum1 || quantum1 <= 0 || isNaN(quantum1)) {
    throw new Error('Queue time quanta must be positive integers');
  }
  
  const procs = cloneProcesses(processes).map((p, idx) => ({ 
    ...p, 
    _originalIndex: idx,
    remainingTime: p.burstTime,
    started: false,
    firstStartTime: -1,
    currentQueue: 0, // Start in highest priority queue
    timeInQueue: 0
  }));
  const n = procs.length;
  
  const timeline = [];
  const processResults = [];
  const queue0 = [];
  const queue1 = [];
  const queue2 = [];
  
  let currentTime = 0;
  const completed = [];
  
  const sortedByArrival = [...procs].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a._originalIndex - b._originalIndex;
  });
  
  let arrivalIndex = 0;
  
  while (completed.length < n) {
    // Add newly arrived processes to Queue 0
    while (arrivalIndex < sortedByArrival.length && sortedByArrival[arrivalIndex].arrivalTime <= currentTime) {
      const arrivingProc = sortedByArrival[arrivalIndex];
      const alreadyQueued = [...queue0, ...queue1, ...queue2].find(p => p.processId === arrivingProc.processId && p.remainingTime > 0);
      const isCompleted = completed.find(p => p.processId === arrivingProc.processId);
      if (!alreadyQueued && !isCompleted && arrivingProc.remainingTime > 0) {
        arrivingProc.currentQueue = 0;
        queue0.push(arrivingProc);
      }
      arrivalIndex++;
    }
    
    // Check queues in priority order
    if (queue0.length > 0) {
      const selected = queue0.shift();
      
      if (!selected.started) {
        selected.started = true;
        selected.firstStartTime = currentTime;
      }
      
      const execTime = Math.min(selected.remainingTime, quantum0);
      
      timeline.push({
        processId: selected.processId,
        startTime: currentTime,
        endTime: currentTime + execTime,
        duration: execTime,
        queueLevel: 0
      });
      
      selected.remainingTime -= execTime;
      currentTime += execTime;
      
      // Add arrived during execution
      while (arrivalIndex < sortedByArrival.length && sortedByArrival[arrivalIndex].arrivalTime <= currentTime) {
        const arrivingProc = sortedByArrival[arrivalIndex];
        const alreadyQueued = [...queue0, ...queue1, ...queue2].find(p => p.processId === arrivingProc.processId && p.remainingTime > 0);
        const isCompleted = completed.find(p => p.processId === arrivingProc.processId);
        if (!alreadyQueued && !isCompleted && arrivingProc.remainingTime > 0) {
          arrivingProc.currentQueue = 0;
          queue0.push(arrivingProc);
        }
        arrivalIndex++;
      }
      
      if (selected.remainingTime === 0) {
        completed.push(selected);
        const completionTime = currentTime;
        const responseTime = selected.firstStartTime - selected.arrivalTime;
        const turnaroundTime = completionTime - selected.arrivalTime;
        const waitingTime = turnaroundTime - selected.burstTime;
        
        processResults.push({
          processId: selected.processId,
          arrivalTime: selected.arrivalTime,
          burstTime: selected.burstTime,
          priority: selected.priority !== undefined ? selected.priority : null,
          queueLevel: 0,
          completionTime,
          turnaroundTime,
          waitingTime,
          responseTime
        });
      } else if (execTime === quantum0) {
        // Used full quantum, demote to queue 1
        selected.currentQueue = 1;
        queue1.push(selected);
      } else {
        // Finished before quantum (shouldn't happen if remainingTime > 0 but execTime is min)
        selected.currentQueue = 0;
        queue0.push(selected);
      }
    } else if (queue1.length > 0) {
      const selected = queue1.shift();
      
      if (!selected.started) {
        selected.started = true;
        selected.firstStartTime = currentTime;
      }
      
      const execTime = Math.min(selected.remainingTime, quantum1);
      
      timeline.push({
        processId: selected.processId,
        startTime: currentTime,
        endTime: currentTime + execTime,
        duration: execTime,
        queueLevel: 1
      });
      
      selected.remainingTime -= execTime;
      currentTime += execTime;
      
      // Add arrived during execution (to queue 0 - highest priority)
      while (arrivalIndex < sortedByArrival.length && sortedByArrival[arrivalIndex].arrivalTime <= currentTime) {
        const arrivingProc = sortedByArrival[arrivalIndex];
        const alreadyQueued = [...queue0, ...queue1, ...queue2].find(p => p.processId === arrivingProc.processId && p.remainingTime > 0);
        const isCompleted = completed.find(p => p.processId === arrivingProc.processId);
        if (!alreadyQueued && !isCompleted && arrivingProc.remainingTime > 0) {
          arrivingProc.currentQueue = 0;
          queue0.push(arrivingProc);
        }
        arrivalIndex++;
      }
      
      if (selected.remainingTime === 0) {
        completed.push(selected);
        const completionTime = currentTime;
        const responseTime = selected.firstStartTime - selected.arrivalTime;
        const turnaroundTime = completionTime - selected.arrivalTime;
        const waitingTime = turnaroundTime - selected.burstTime;
        
        processResults.push({
          processId: selected.processId,
          arrivalTime: selected.arrivalTime,
          burstTime: selected.burstTime,
          priority: selected.priority !== undefined ? selected.priority : null,
          queueLevel: 1,
          completionTime,
          turnaroundTime,
          waitingTime,
          responseTime
        });
      } else if (execTime === quantum1) {
        // Demote to queue 2
        selected.currentQueue = 2;
        queue2.push(selected);
      } else {
        selected.currentQueue = 1;
        queue1.push(selected);
      }
    } else if (queue2.length > 0) {
      // Queue 2 is FCFS
      const selected = queue2.shift();
      
      if (!selected.started) {
        selected.started = true;
        selected.firstStartTime = currentTime;
      }
      
      const execTime = selected.remainingTime;
      
      timeline.push({
        processId: selected.processId,
        startTime: currentTime,
        endTime: currentTime + execTime,
        duration: execTime,
        queueLevel: 2
      });
      
      selected.remainingTime = 0;
      currentTime += execTime;
      
      // Add arrived during execution (to queue 0)
      while (arrivalIndex < sortedByArrival.length && sortedByArrival[arrivalIndex].arrivalTime <= currentTime) {
        const arrivingProc = sortedByArrival[arrivalIndex];
        const alreadyQueued = [...queue0, ...queue1, ...queue2].find(p => p.processId === arrivingProc.processId && p.remainingTime > 0);
        const isCompleted = completed.find(p => p.processId === arrivingProc.processId);
        if (!alreadyQueued && !isCompleted && arrivingProc.remainingTime > 0) {
          arrivingProc.currentQueue = 0;
          queue0.push(arrivingProc);
        }
        arrivalIndex++;
      }
      
      completed.push(selected);
      const completionTime = currentTime;
      const responseTime = selected.firstStartTime - selected.arrivalTime;
      const turnaroundTime = completionTime - selected.arrivalTime;
      const waitingTime = turnaroundTime - selected.burstTime;
      
      processResults.push({
        processId: selected.processId,
        arrivalTime: selected.arrivalTime,
        burstTime: selected.burstTime,
        priority: selected.priority !== undefined ? selected.priority : null,
        queueLevel: 2,
        completionTime,
        turnaroundTime,
        waitingTime,
        responseTime
      });
    } else {
      // Idle
      const notArrived = procs.filter(p => p.arrivalTime > currentTime && p.remainingTime > 0);
      if (notArrived.length === 0) break;
      const nextArrival = Math.min(...notArrived.map(p => p.arrivalTime));
      timeline.push({
        processId: 'IDLE',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime,
        queueLevel: null
      });
      currentTime = nextArrival;
    }
  }
  
  const metrics = calculateMetrics(processResults, timeline);
  
  return {
    algorithm: 'MLFQ',
    algorithmType: 'Multilevel Feedback Queue',
    processResults,
    timeline,
    metrics,
    events: [],
    configuration: { quantum0, quantum1, quantum2: 'FCFS', description: 'Queue 0 (RR q=2), Queue 1 (RR q=4), Queue 2 (FCFS)' }
  };
}

// Main simulation runner
export function runSimulation(processes, algorithm, config = {}) {
  const algo = algorithm.toLowerCase();
  
  switch (algo) {
    case 'fcfs':
      return fcfs(processes);
    case 'sjf':
      return sjf(processes);
    case 'srtf':
      return srtf(processes);
    case 'priority':
    case 'priorityscheduling':
    case 'nonpreemptivepriority':
      return priorityScheduling(processes);
    case 'roundrobin':
    case 'rr':
      return roundRobin(processes, config.quantum || 2);
    case 'mlq':
    case 'multilevelqueue':
      return multilevelQueue(processes, config.quantum0 || config.quantum || 2);
    case 'mlfq':
    case 'multilevelfeedbackqueue':
      return multilevelFeedbackQueue(processes, config);
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

// Compare algorithms
export function compareAlgorithms(processes, algorithms, configs = {}) {
  const results = [];
  for (const algo of algorithms) {
    try {
      const config = configs[algo] || configs[algo.toLowerCase()] || {};
      const result = runSimulation(processes, algo, config);
      results.push(result);
    } catch (error) {
      results.push({
        algorithm: algo,
        error: error.message
      });
    }
  }
  return results;
}


