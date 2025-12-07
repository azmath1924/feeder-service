import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../common/interfaces';
import { AppError } from './error.middleware';

export type ValidationSchema = {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
};

export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];
    const { body } = req;

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // Required field check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: `${field} is required`,
          value
        });
        continue;
      }

      // Skip further validation if field is not required and empty
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rules.type) {
        switch (rules.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push({
                field,
                message: `${field} must be a string`,
                value
              });
            }
            break;
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push({
                field,
                message: `${field} must be a number`,
                value
              });
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push({
                field,
                message: `${field} must be a boolean`,
                value
              });
            }
            break;
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof value !== 'string' || !emailRegex.test(value)) {
              errors.push({
                field,
                message: `${field} must be a valid email`,
                value
              });
            }
            break;
        }
      }

      // String length validation
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.minLength} characters long`,
            value
          });
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({
            field,
            message: `${field} must not exceed ${rules.maxLength} characters`,
            value
          });
        }
      }

      // Number range validation
      if (typeof value === 'number') {
        if (rules.min && value < rules.min) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.min}`,
            value
          });
        }
        if (rules.max && value > rules.max) {
          errors.push({
            field,
            message: `${field} must not exceed ${rules.max}`,
            value
          });
        }
      }

      // Pattern validation
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} format is invalid`,
          value
        });
      }
    }

    if (errors.length > 0) {
      const error = new AppError('Validation failed', 400);
      (error as any).validationErrors = errors;
      throw error;
    }

    next();
  };
};