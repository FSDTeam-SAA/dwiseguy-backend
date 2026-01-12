import { AnyZodObject, ZodError } from 'zod';
import { RequestHandler, NextFunction } from 'express';
import fs from 'fs';

export const validateRequest = (schema: AnyZodObject): RequestHandler => {
      return async (req, res, next: NextFunction) => {
            try {
                  // Parse JSON string if `value` field exists
                  if (req.body.value && typeof req.body.value === 'string') {
                        try {
                              req.body.value = JSON.parse(req.body.value);
                        } catch (err) {
                              const parseError = new ZodError([
                                    { path: ['value'], message: 'Invalid JSON in value field', code: 'custom' },
                              ]);
                              return next(parseError); // Pass error to global error handler
                        }
                  }

                  // Validate using Zod
                  await schema.parseAsync({
                        body: req.body,
                        params: req.params,
                        query: req.query,
                  });

                  next(); // proceed if validation passes
            } catch (err: any) {
                  // AUTO DELETE UPLOADED FILES ON ERROR
                  const files: Express.Multer.File[] = [];

                  if (req.file) files.push(req.file);

                  if (req.files) {
                        if (Array.isArray(req.files)) {
                              files.push(...req.files);
                        } else {
                              Object.values(req.files).forEach((arr) => files.push(...arr));
                        }
                  }

                  files.forEach((file) => {
                        fs.unlink(file.path, (err) => {
                              if (err) console.error('File cleanup failed:', err);
                        });
                  });

                  // Pass the error to the global error handler
                  next(err);
            }
      };
};
