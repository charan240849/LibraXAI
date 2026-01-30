import app from './app';
import { config } from './config';
import { initializeDatabase } from './db';
import { initializeScheduler } from './schedulers/daily.jobs';

async function startServer() {
  // Initialize database (async for sql.js)
  console.log('Initializing database...');
  await initializeDatabase();

  // Initialize scheduler
  console.log('Initializing scheduler...');
  initializeScheduler();

  // Start server
  const server = app.listen(config.port, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║       Library Management System (LMS-Simple)       ║
╠════════════════════════════════════════════════════╣
║  Server running on port ${config.port}                      ║
║  Health check: http://localhost:${config.port}/health       ║
║  Environment: ${config.nodeEnv.padEnd(34)}║
╚════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
