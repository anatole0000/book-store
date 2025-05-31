import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message);

  res.status(err.statusCode || 500).json({
    msg: err.message || 'Server error',
    ...(err.details && { errors: err.details }),
  });
};
