import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../common/interfaces';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let validationErrors = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    validationErrors = (error as any).validationErrors;
  }

  console.error(`Error ${statusCode}: ${message}`, error.stack);

  const response: ApiResponse = {
    success: false,
    message,
    ...(validationErrors && { errors: validationErrors }),
    ...(process.env.NODE_ENV === 'development' && !validationErrors && { errors: error.stack })
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  };
  
  res.status(404).json(response);
};