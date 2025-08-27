import { Response, NextFunction } from 'express';
import { AppError } from './ApiError';

export function handleControllerError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof AppError) {
    switch (error.type) {
      case 'VALIDATION_ERROR':
      case 'BAD_REQUEST':
        return res.status(400).json({ error: error.message });
      case 'UNAUTHORIZED':
        return res.status(401).json({ error: error.message });
      case 'UPDATE_ERROR':
        return res.status(403).json({ error: error.message });
      case 'NOT_FOUND':
        return res.status(404).json({ error: error.message });
      case 'CONFLICT':
        return res.status(409).json({ error: error.message });
      case 'TOO_MANY_REQUESTS':
        return res.status(429).json({ error: error.message });
      case 'DATABASE_ERROR':
      case 'INTERNAL_SERVER_ERROR':
      default:
        return res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
  }

  next(error);
}