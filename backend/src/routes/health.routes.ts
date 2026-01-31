import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import config from '../config';

const router = Router();

// Health check endpoint
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const healthCheck = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Service is healthy',
      environment: process.env.NODE_ENV,
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      },
      services: {
        scraper: 'operational',
        ai: config.openaiApiKey ? 'operational (OpenAI)' : 'not configured',
      },
    };

    res.status(200).json(healthCheck);
  })
);

// Detailed health check
router.get(
  '/detailed',
  asyncHandler(async (req: Request, res: Response) => {
    const detailedHealth = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      config: {
        aiProvider: 'OpenAI',
        model: config.openaiModel,
        apiKeyConfigured: !!config.openaiApiKey,
      },
    };

    res.status(200).json(detailedHealth);
  })
);

export default router;