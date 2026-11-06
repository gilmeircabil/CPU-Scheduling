import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Routes
import healthRoutes from './routes/healthRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import processRoutes from './routes/processRoutes.js';
import historyRoutes from './routes/historyRoutes.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Database connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('⚠️  No MONGODB_URI provided. Database features will be limited.');
    }
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.log('💡 Make sure MongoDB is running or check your MONGODB_URI');
  }
};

connectDB();

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/simulations/history', historyRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
