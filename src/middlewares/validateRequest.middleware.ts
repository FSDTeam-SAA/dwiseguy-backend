import { AnyZodObject } from 'zod';
import { RequestHandler } from 'express';

export const validateRequest = (schema: AnyZodObject): RequestHandler => {
      return async (req, res, next) => {
            try {
                  await schema.parseAsync({
                        body: req.body,
                        params: req.params,
                        query: req.query,
                  });
                  next();
            } catch (err: any) {
                  res.status(400).json({
                        success: false,
                        errors: err.errors,
                  });
            }
      };
};
