import { runSimulation, compareAlgorithms } from '../engine/schedulingEngine.js';
import Simulation from '../models/Simulation.js';

const VALID_ALGORITHMS = ['FCFS', 'SJF', 'SRTF', 'Priority', 'RoundRobin', 'RR', 'MLQ', 'MLFQ'];

// POST /api/simulations/run
export const runSimulationEndpoint = async (req, res, next) => {
  try {
    const { processes, algorithm, configuration = {} } = req.body;

    // Validation
    if (!processes || !Array.isArray(processes) || processes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Process list must contain at least one process'
      });
    }

    if (!algorithm) {
      return res.status(400).json({
        success: false,
        error: 'Algorithm is required'
      });
    }

    // Validate processes
    for (let i = 0; i < processes.length; i++) {
      const p = processes[i];
      if (!p.processId || p.processId.trim() === '') {
        return res.status(400).json({
          success: false,
          error: `Process at index ${i}: Process ID is required`
        });
      }
      if (p.arrivalTime === undefined || p.arrivalTime < 0 || !Number.isInteger(Number(p.arrivalTime))) {
        return res.status(400).json({
          success: false,
          error: `Process ${p.processId}: Arrival time must be a non-negative integer`
        });
      }
      if (p.burstTime === undefined || p.burstTime <= 0 || !Number.isInteger(Number(p.burstTime))) {
        return res.status(400).json({
          success: false,
          error: `Process ${p.processId}: Burst time must be a positive integer`
        });
      }
    }

    // Check for duplicate process IDs
    const ids = processes.map(p => p.processId);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Duplicate process IDs found: ${duplicates.join(', ')}`
      });
    }

    // Validate quantum for Round Robin
    if (algorithm.toLowerCase() === 'roundrobin' || algorithm.toLowerCase() === 'rr') {
      const quantum = configuration.quantum || 2;
      if (!quantum || quantum <= 0 || !Number.isInteger(Number(quantum))) {
        return res.status(400).json({
          success: false,
          error: 'Time quantum must be a positive integer for Round Robin'
        });
      }
    }

    // Run simulation
    const result = runSimulation(processes, algorithm, configuration);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/simulations/compare
export const compareSimulations = async (req, res, next) => {
  try {
    const { processes, algorithms, configurations = {} } = req.body;

    if (!processes || !Array.isArray(processes) || processes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Process list must contain at least one process'
      });
    }

    if (!algorithms || !Array.isArray(algorithms) || algorithms.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Select at least two algorithms for comparison'
      });
    }

    // Validate processes
    for (let i = 0; i < processes.length; i++) {
      const p = processes[i];
      if (!p.processId || p.processId.trim() === '') {
        return res.status(400).json({
          success: false,
          error: `Process at index ${i}: Process ID is required`
        });
      }
      if (p.arrivalTime === undefined || p.arrivalTime < 0 || !Number.isInteger(Number(p.arrivalTime))) {
        return res.status(400).json({
          success: false,
          error: `Process ${p.processId}: Arrival time must be a non-negative integer`
        });
      }
      if (p.burstTime === undefined || p.burstTime <= 0 || !Number.isInteger(Number(p.burstTime))) {
        return res.status(400).json({
          success: false,
          error: `Process ${p.processId}: Burst time must be a positive integer`
        });
      }
    }

    const results = compareAlgorithms(processes, algorithms, configurations);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

export default { runSimulationEndpoint, compareSimulations };
