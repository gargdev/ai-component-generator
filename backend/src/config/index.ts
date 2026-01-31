// import dotenv from 'dotenv';
// import path from 'path';

// // Load environment variables
// dotenv.config();

// interface Config {
//   port: number;
//   nodeEnv: string;
//   frontendUrl: string;
//   anthropicApiKey: string;
//   rateLimit: {
//     windowMs: number;
//     maxRequests: number;
//   };
//   scraper: {
//     timeout: number;
//     maxPageSize: number;
//   };
//   storage: {
//     path: string;
//   };
// }

// const config: Config = {
//   port: parseInt(process.env.PORT || '4000', 10),
//   nodeEnv: process.env.NODE_ENV || 'development',
//   frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
//   anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
//   rateLimit: {
//     windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
//     maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
//   },
//   scraper: {
//     timeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000', 10),
//     maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '10485760', 10),
//   },
//   storage: {
//     path: process.env.STORAGE_PATH || path.join(__dirname, '../../storage'),
//   },
// };

// // Validate required configuration
// if (!config.anthropicApiKey && config.nodeEnv === 'production') {
//   throw new Error('ANTHROPIC_API_KEY is required in production');
// }

// export default config;

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  openaiApiKey: string;
  openaiModel: string;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  scraper: {
    timeout: number;
    maxPageSize: number;
  };
  storage: {
    path: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  scraper: {
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '10485760', 10),
  },
  storage: {
    path: process.env.STORAGE_PATH || path.join(__dirname, '../../storage'),
  },
};

// Validate required configuration
if (!config.openaiApiKey && config.nodeEnv === 'production') {
  throw new Error('OPENAI_API_KEY is required in production');
}

export default config;