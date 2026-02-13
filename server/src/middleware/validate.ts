import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware to validate request body against a Zod schema
 */
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: err.errors,
        });
      }
      next(err);
    }
  };
}

/**
 * Express middleware to validate query parameters against a Zod schema
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: err.errors,
        });
      }
      next(err);
    }
  };
}

/**
 * Express middleware to validate route parameters against a Zod schema
 */
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: err.errors,
        });
      }
      next(err);
    }
  };
}
