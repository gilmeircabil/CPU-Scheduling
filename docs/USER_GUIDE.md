# User Guide - CPU Scheduling Algorithm Simulator

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Starting the Application](#starting)
4. [Using the Application](#using)
5. [Troubleshooting](#troubleshooting)

## 1. Installation

### Prerequisites
- Node.js installed
- MongoDB installed and running (or MongoDB Atlas)

### Steps

1. Open terminal in project directory
2. Install all dependencies:
```bash
npm run install:all
```

## 2. Configuration

1. Copy environment file:
```bash
cp .env.example server/.env
```

2. Edit `server/.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/cpu_scheduling_simulator
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## 3. Starting the Application

Run both frontend and backend concurrently:
```bash
npm run dev
```

Access the application at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 4. Using the Application

### Dashboard
Overview of the system with quick actions.

### Process Manager
1. Click "Add Process" to add new process
2. Enter Process ID, Arrival Time, Burst Time, Priority (optional), Queue Level (optional)
3. Click "Load Sample Data" to load the example dataset
4. Edit or delete processes as needed

### Simulator
1. Go to Simulator page
2. Select an algorithm from dropdown
3. Configure quantum if needed (Round Robin, MLQ)
4. Click "Run Simulation"
5. View Gantt chart, metrics table, and averages

### Algorithm Comparison
1. Select at least 2 algorithms
2. Set quantum if using RR/MLQ
3. Click "Compare Algorithms"
4. View comparison table and charts

### Simulation History
View previously saved simulations (if MongoDB is connected).

### Algorithms Guide
Learn about each algorithm's behavior, advantages, and disadvantages.

## 5. Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in server/.env

**Port Already in Use:**
- Change PORT in server/.env
- Kill process using the port

**Dependencies Issues:**
- Delete node_modules and reinstall: `npm run install:all`

**CORS Errors:**
- Ensure CLIENT_URL matches frontend URL
