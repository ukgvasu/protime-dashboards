// Load environment variables FIRST (before any imports that use them)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { dbManager } from './models/database.js';
import defectsRouter from './api/defects.js';
import reportsRouter from './api/reports.js';
import syncRouter from './api/sync.js';
import chatRouter from './api/chat.js';
import alertsRouter from './api/alerts.js';
import ktloRouter from './api/ktlo.js';
import customerImpactRouter from './api/customer-impact.js';
import insightsRouter from './api/insights.js';
import { startAutoSync } from './jobs/auto-sync.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Initialize database (async now)
await dbManager.initialize();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Database reload endpoint (for development)
app.post('/api/db/reload', async (req, res) => {
  try {
    await dbManager.reload();
    res.json({
      success: true,
      message: 'Database reloaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API routes
app.use('/api/defects', defectsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/chat', chatRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/ktlo', ktloRouter);
app.use('/api/customer-impact', customerImpactRouter);
app.use('/api/insights', insightsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ProTime Dashboard API                               ║
║                                                           ║
║   Server running on: http://localhost:${PORT}               ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                           ║
║   Available endpoints:                                    ║
║   - GET  /health                                          ║
║   - GET  /api/defects/:product                            ║
║   - GET  /api/reports/leadership                          ║
║   - GET  /api/reports/security                            ║
║   - GET  /api/ktlo/uta                                    ║
║   - GET  /api/customer-impact/:product                    ║
║   - POST /api/sync                                        ║
║   - POST /api/chat                                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Start auto-sync job
  startAutoSync();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  dbManager.close();
  process.exit(0);
});
