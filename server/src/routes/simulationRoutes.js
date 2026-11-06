import express from 'express';
import { runSimulationEndpoint, compareSimulations } from '../controllers/simulationController.js';

const router = express.Router();

router.post('/run', runSimulationEndpoint);
router.post('/compare', compareSimulations);

export default router;
