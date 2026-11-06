# CPU Scheduling Algorithm Simulator

A complete, functional CPU Scheduling Algorithm Simulator built with the MERN stack for PT101 - Platform Technology at Ramon Magsaysay Memorial College.

## Project Overview

This educational web application simulates 7 CPU scheduling algorithms with accurate calculations, interactive Gantt charts, and comprehensive analysis tools.

## Features

- **7 Scheduling Algorithms**: FCFS, SJF, SRTF, Priority Scheduling, Round Robin, Multilevel Queue (MLQ), Multilevel Feedback Queue (MLFQ)
- **Interactive Process Manager**: Add, edit, delete, and manage processes
- **Visual Gantt Charts**: Interactive timeline visualization
- **Detailed Metrics**: CT, TAT, WT, RT calculations with averages and CPU utilization
- **Algorithm Comparison**: Compare multiple algorithms with same input
- **Simulation History**: Save and retrieve simulations from MongoDB
- **Educational Guide**: Learn about each algorithm
- **Responsive Design**: Works on desktop, tablet, and mobile

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Testing**: Vitest

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. Clone the repository
```bash
cd "New folder"
```

2. Install dependencies
```bash
npm run install:all
```

3. Configure environment variables
```bash
cp .env.example server/.env
```

Edit `server/.env` with your MongoDB URI:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/cpu_scheduling_simulator
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

4. Start the application
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Running Tests

```bash
cd server
npm test
```

## Algorithms Implemented

| Algorithm | Type | Description |
|-----------|------|-------------|
| FCFS | Non-preemptive | First Come First Served |
| SJF | Non-preemptive | Shortest Job First |
| SRTF | Preemptive | Shortest Remaining Time First |
| Priority | Non-preemptive | Priority Scheduling (lower number = higher priority) |
| Round Robin | Preemptive | Time quantum based scheduling |
| MLQ | Queue-based | Multilevel Queue (Queue 0: RR, Queue 1: FCFS) |
| MLFQ | Feedback Queue | Multilevel Feedback Queue (3 levels with demotion) |

## Sample Data

The application includes sample data as specified in the requirements:
- P1: AT=0, BT=5, Priority=2, Queue=1
- P2: AT=1, BT=3, Priority=1, Queue=0
- P3: AT=2, BT=4, Priority=3, Queue=1
- P4: AT=4, BT=2, Priority=2, Queue=0

## Project Structure

```
cpu-scheduling-simulator/
├── client/          # React frontend
├── server/          # Express backend
├── docs/            # Documentation
└── README.md
```

## License

MIT

## Institution

Ramon Magsaysay Memorial College - PT101 Platform Technology
