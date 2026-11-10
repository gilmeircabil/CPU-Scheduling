# CPU Scheduling Algorithm Simulator

A vanilla HTML/CSS/JavaScript simulator for comparing the 4 fundamental CPU scheduling algorithms, built for PT101 Platform Technologies final project.

## How to Run

1. Open `index.html` directly in any web browser (no installation or server needed).
2. To run the automated algorithm test suite:
```bash
node tests.js
```

---

## The 4 Algorithms Explained (Simple & Easy for Defense)

### 1. FCFS (First-Come, First-Served) — Non-preemptive
- **Concept**: Just like a queue at a grocery store checkout.
- **Rule**: The process that arrives first gets executed first until it finishes.
- **No interruptions**: Once a process starts running, it cannot be interrupted.
- **Limitation**: Long processes arriving early can cause the **convoy effect**, delaying shorter processes behind them.

### 2. SJF (Shortest Job First) — Non-preemptive
- **Concept**: Pick the quickest task first.
- **Rule**: Whenever the CPU is free, it checks all arrived processes and selects the one with the shortest burst time.
- **Advantage**: Provides the minimum average waiting time among non-preemptive algorithms.
- **Tie-breaker**: Earlier arrival time wins.

### 3. Round Robin (RR) — Preemptive
- **Concept**: Fair time-sharing.
- **Rule**: Every process takes turns on the CPU for a fixed time slice called the **Time Quantum** (e.g., 4 units).
- **If not finished**: When the quantum expires, the running process is placed at the back of the ready queue, and the next waiting process gets CPU time.
- **Advantage**: Fast response time; every process gets a turn without starving.

### 4. Multilevel Queue (MLQ) — Fixed Priority Queues
- **Concept**: Categorized queues where higher-priority queues run first.
- **Queues**:
  - **Queue 1 (Highest)**: Runs using **Round Robin (RR)** with the given Time Quantum.
  - **Queue 2 (Medium)**: Runs using **FCFS**.
  - **Queue 3 (Lowest)**: Runs using **FCFS**.
- **Rule**: Queue 1 processes always execute before Queue 2, and Queue 2 executes before Queue 3. Processes remain in their assigned queue.
- **Why MLQ over MLFQ?**: MLQ is much simpler and easier to explain because processes stay in fixed queues without complex dynamic demotion rules.

---

## Core Formulas Used (Simple Step-by-Step Math)

$$\text{Turnaround Time (TAT)} = \text{Completion Time (CT)} - \text{Arrival Time (AT)}$$
$$\text{Waiting Time (WT)} = \text{Turnaround Time (TAT)} - \text{Burst Time (BT)}$$
$$\text{Response Time (RT)} = \text{First Start Time} - \text{Arrival Time (AT)}$$
$$\text{Average Waiting Time} = \frac{\text{Sum of All Waiting Times}}{\text{Number of Processes}}$$
$$\text{CPU Utilisation} = \left(\frac{\text{Total Time} - \text{Idle Time}}{\text{Total Time}}\right) \times 100\%$$

---

## Key Features

- **Interactive Timeline (Gantt Chart)**: Visual representation with colored process blocks, idle hatching, and time stepper.
- **Live Results Table**: Per-process Completion, Turnaround, Waiting, and Response times.
- **Algorithm Comparison**: Side-by-side comparison of all 4 algorithms with visual performance bars.
- **Light & Dark Theme**: Built-in toggle supporting system theme preference.
