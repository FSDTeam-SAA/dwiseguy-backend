import { AnyZodObject, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
      try {
            await schema.parseAsync({
                  body: req.body,
                  params: req.params,
                  query: req.query,
            });
            next();
      } catch (error) {
            const err = error as ZodError;
            return res.status(400).json({
                  success: false,
                  message: 'Validation failed',
                  errors: err.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                  })),
            });
      }
};


//  test
