import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';

// Simple API key authentication (you can enhance this later with JWT)
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // For now, we'll use a simple API key in headers
    // Later, this will be replaced with NextAuth session validation
    const apiKey = req.headers['x-api-key'] as string;
    const validApiKey = process.env.API_KEY || 'dev-api-key-12345';

    // In development, skip auth
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedError('Invalid or missing API key');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Optional auth (doesn't fail if no auth provided)
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // For now, just pass through
  // Later, attach user info if valid session exists
  next();
};