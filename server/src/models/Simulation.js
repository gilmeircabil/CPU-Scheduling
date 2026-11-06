import mongoose from 'mongoose';

const ProcessSchema = new mongoose.Schema({
  processId: { type: String, required: true },
  arrivalTime: { type: Number, required: true, min: 0 },
  burstTime: { type: Number, required: true, min: 1 },
  priority: { type: Number },
  queueLevel: { type: Number }
}, { _id: false });

const TimelineEntrySchema = new mongoose.Schema({
  processId: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  duration: { type: Number, required: true },
  queueLevel: { type: Number }
}, { _id: false });

const ProcessResultSchema = new mongoose.Schema({
  processId: { type: String, required: true },
  arrivalTime: { type: Number, required: true },
  burstTime: { type: Number, required: true },
  priority: { type: Number },
  queueLevel: { type: Number },
  completionTime: { type: Number, required: true },
  turnaroundTime: { type: Number, required: true },
  waitingTime: { type: Number, required: true },
  responseTime: { type: Number, required: true }
}, { _id: false });

const MetricsSchema = new mongoose.Schema({
  averageWaitingTime: { type: Number },
  averageTurnaroundTime: { type: Number },
  averageResponseTime: { type: Number },
  cpuUtilization: { type: Number },
  totalBurstTime: { type: Number },
  totalExecutionTime: { type: Number },
  totalIdleTime: { type: Number }
}, { _id: false });

const SimulationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  algorithm: { type: String, required: true },
  algorithmsCompared: [{ type: String }],
  inputProcesses: [ProcessSchema],
  configuration: { type: Object },
  results: {
    processResults: [ProcessResultSchema],
    timeline: [TimelineEntrySchema],
    metrics: MetricsSchema
  },
  metrics: MetricsSchema,
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.model('Simulation', SimulationSchema);
