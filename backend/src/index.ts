import Server from './server';
import logger from './utils/logger';
import config from './config';

console.log("Server config loaded:", config);
// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(error.name, error.message);
  process.exit(1);
});

// Initialize server
const server = new Server();
server.start();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('👋 SIGINT RECEIVED. Shutting down gracefully...');
  process.exit(0);
});