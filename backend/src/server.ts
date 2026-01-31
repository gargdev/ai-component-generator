import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';

// Import routes (we'll create these next)
import healthRoutes from './routes/health.routes';
import scrapeRoutes from './routes/scrape.routes';
import analyzeRoutes from './routes/analyze.routes';

class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(
      cors({
        origin: config.frontendUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use('/api/', apiLimiter);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
      next();
    });
  }

  private configureRoutes(): void {
    // Health check route
    this.app.use('/api/health', healthRoutes);

    // Main API routes
    this.app.use('/api/scrape', scrapeRoutes);
    this.app.use('/api/analyze', analyzeRoutes);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Component Generator Backend API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          scrape: '/api/scrape',
          analyze: '/api/analyze',
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  private configureErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🌐 CORS enabled for: ${config.frontendUrl}`);
      logger.info(`✅ Server is ready to accept requests`);
    });
  }
}

export default Server;