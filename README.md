# CPU Scheduling Algorithm Simulator

A vanilla HTML/CSS/JavaScript simulator for comparing 8 CPU scheduling algorithms, built for PT101 Platform Technologies final project.

## How to Run

1. Download all files to a folder
2. Double-click `index.html` to open in your browser
3. No build step or server required

To run the algorithm tests:
```bash
node tests.js
```

## Algorithms Explained

### 1. FCFS (First-Come, First-Served) - Non-preemptive
The simplest scheduling algorithm. Processes are executed in the order they arrive. If Process P1 arrives before P2, P1 must complete before P2 starts. Simple but can lead to the "convoy effect" where long processes delay many short ones.

### 2. SJF (Shortest Job First) - Non-preemptive
At each decision point, the process with the shortest burst time is selected. Minimizes average waiting time but requires knowing burst times in advance (or estimates).

### 3. SRTF (Shortest Remaining Time First) - Preemptive
The preemptive version of SJF. At every time unit, the CPU switches to the process with the shortest remaining burst time. Better response times than SJF but higher overhead from context switches.

### 4. Priority (Non-preemptive)
Processes are selected based on priority level (lower number = higher priority). If processes have equal priority, FCFS order applies. Lower priority processes can suffer "starvation" if higher priority processes keep arriving.

### 5. Priority (Preemptive)
At each time unit, the CPU is available to the highest priority waiting process. New high-priority arrivals can preempt running lower priority processes.

### 6. Round Robin (RR)
Each process gets a fixed time quantum (default: 4 time units). After the quantum expires, the process is preempted and added to the back of the queue. New arrivals enter before preempted processes for fairness. Guarantees bounded response times.

### 7. Multilevel Queue (MLQ)
Three fixed queues by priority level:
- Queue 1: Round Robin scheduling
- Queue 2 & 3: FCFS scheduling
Higher queues have absolute priority - Queue 1 processes always run before Queue 2, which always runs before Queue 3.

### 8. Multilevel Feedback Queue (MLFQ)
Three levels with dynamic process movement:
- Level 1: RR with quantum Q
- Level 2: RR with quantum 2Q
- Level 3: FCFS (infinite time)
New processes start at Level 1. When a process uses its full quantum without completing, it's demoted to the next level. Higher level arrivals preempt lower levels.

## Assumptions

1. **Tie-breaking**: When processes have identical priority/tiebreak criteria, earlier arrival time wins. If arrival times are equal, lower process index (P1 before P2) wins.

2. **Time Quantum**: Used for Round Robin and queue-based algorithms. Default: 4 time units. Processes using less than a full quantum stay in their current level (MLFQ).

3. **Queue Assignment**: The "Queue" column determines which queue a process belongs to in MLQ and MLFQ. New processes in MLFQ always start at level 1 regardless of their initial queue value.

4. **Preemption Timing**: 
   - RR: New arrivals enqueue before preempted processes
   - Priority Preemptive: New higher-priority arrivals preempt immediately
   - MLFQ: New arrivals at level 1 preempt anything running

## UI Features

- **Process Table**: Add/remove rows, set arrival/burst/priority/queue
- **Time Quantum**: Adjustable for RR and queue algorithms
- **Algorithm Selection**: Dropdown with 8 algorithms, preemptive indicator badges
- **Gantt Chart**: Visual representation with colors per process, time labels, hatched idle blocks
- **Execution Log**: Chronological view of events
- **Results Table**: Per-process metrics (Completion, Turnaround, Waiting, Response)
- **Average Metrics**: Summary statistics
- **Algorithm Comparison**: Compare 2+ algorithms on same input

## Keyboard Accessibility

- Tab navigation through all interactive elements
- Enter/Space activates buttons and checkboxes
- Escape closes any open modals (if added)

## Design Decisions

- **IBM Plex** fonts for professional academic feel
- **Light/Dark mode** with system preference detection
- **40px per time unit** in Gantt chart (responsive horizontal scroll)
- **Monospace fonts** for data tables and logs

## Oral Defense Tips

Each algorithm function in `scheduler.js` is self-contained and well-commented:
1. Read the JSDoc comment at the top of each function
2. Trace the algorithm step-by-step with a simple example
3. Point out the tie-breaking logic
4. For RR/queue algorithms, explain the time quantum handling

The code follows these patterns:
- `createProcessCopy()`: Adds tracking fields (remainingBurst, firstStartTime)
- `calculateMetrics()`: Computes CT, TAT, WT, RT from Gantt data
- Each algorithm returns standardized output for consistency