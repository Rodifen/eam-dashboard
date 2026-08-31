import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './models/database.js';
import healthRoutes from './routes/health.js';
import dashboardRoutes from './routes/dashboard.js';
import eamRoutes from './routes/eam.js';
import dataSourceRoutes from './routes/dataSource.js';
import manualEntryRoutes from './routes/manualEntry.js';
import aiRoutes from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/eam', eamRoutes);
app.use('/api/datasource', dataSourceRoutes);
app.use('/api/manual-entry', manualEntryRoutes);
app.use('/api/ai', aiRoutes);

app.use(errorHandler);

// Initialize DB then start server
async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`EAM Dashboard Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
