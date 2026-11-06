import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CPU Scheduling Simulator API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
