import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { errorResponse } from '../utils/response';

/**
 * Validates req.body against a Zod schema.
 * Returns 422 with field errors on failure.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(422).json(errorResponse('Validation failed.', 422, errors));
        return;
      }
      next(err);
    }
  };
};
