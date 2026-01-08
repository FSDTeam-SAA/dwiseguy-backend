import { NextFunction, Request, RequestHandler, Response } from 'express';
import fs from 'fs';

const catchAsync = (fn: RequestHandler) => {
      return async (req: Request, res: Response, next: NextFunction) => {
            try {
                  await fn(req, res, next);
            } catch (error) {
                  //! Don't modify the code below
                  // AUTO DELETE UPLOADED FILES ON ERROR
                  const files: Express.Multer.File[] = [];

                  // upload.single()
                  if (req.file) files.push(req.file);

                  // upload.array() or upload.fields()
                  if (req.files) {
                        if (Array.isArray(req.files)) {
                              files.push(...req.files);
                        } else {
                              Object.values(req.files).forEach((arr) => {
                                    files.push(...arr);
                              });
                        }
                  }

                  // delete from local storage
                  files.forEach((file) => {
                        fs.unlink(file.path, (err) => {
                              if (err) console.error('File cleanup failed:', err);
                        });
                  });
                  next(error);
            }
      };
};

export default catchAsync;
