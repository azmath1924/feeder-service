import { Request, Response, NextFunction } from 'express';

export abstract class BaseController {
  protected handleAsyncRoute = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  protected sendSuccess<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200) {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  protected sendError(res: Response, message: string, statusCode: number = 500, errors?: any) {
    res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  protected sendCreated<T>(res: Response, data: T, message: string = 'Created successfully') {
    this.sendSuccess(res, data, message, 201);
  }

  protected sendNoContent(res: Response, message: string = 'No content') {
    res.status(204).json({
      success: true,
      message
    });
  }
}