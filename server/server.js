import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 CPU Scheduling Simulator API`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
