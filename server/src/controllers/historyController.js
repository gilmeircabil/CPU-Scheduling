import Simulation from '../models/Simulation.js';

// GET /api/simulations/history
export const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const simulations = await Simulation.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name algorithm algorithmsCompared inputProcesses metrics createdAt');

    const total = await Simulation.countDocuments();

    res.status(200).json({
      success: true,
      data: simulations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/simulations/history
export const saveSimulation = async (req, res, next) => {
  try {
    const { name, algorithm, algorithmsCompared, inputProcesses, configuration, results, metrics } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Simulation name is required'
      });
    }

    if (!inputProcesses || !Array.isArray(inputProcesses)) {
      return res.status(400).json({
        success: false,
        error: 'Input processes are required'
      });
    }

    const simulation = await Simulation.create({
      name,
      algorithm,
      algorithmsCompared,
      inputProcesses,
      configuration,
      results,
      metrics
    });

    res.status(201).json({
      success: true,
      data: simulation
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/simulations/history/:id
export const getSimulationById = async (req, res, next) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: simulation
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/simulations/history/:id
export const deleteSimulation = async (req, res, next) => {
  try {
    const simulation = await Simulation.findByIdAndDelete(req.params.id);
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Simulation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default { getHistory, saveSimulation, getSimulationById, deleteSimulation };
