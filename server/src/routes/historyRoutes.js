import express from 'express';
import { getHistory, saveSimulation, getSimulationById, deleteSimulation } from '../controllers/historyController.js';

const router = express.Router();

router.route('/')
  .get(getHistory)
  .post(saveSimulation);

router.route('/:id')
  .get(getSimulationById)
  .delete(deleteSimulation);

export default router;
