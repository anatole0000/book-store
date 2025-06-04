import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class CustomError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// Global error handler
export const errorHandler = (err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message);

  res.status(err.statusCode || 500).json({
    msg: err.message || 'Server error',
    ...(err.details && { errors: err.details }),
  });
};
