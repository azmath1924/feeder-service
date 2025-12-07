import { Router } from 'express';

export interface IController {
  router: Router;
  initializeRoutes(): void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}