import { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';

// @desc    Create user
export const createCourse = catchAsync(async (req: Request, res: Response) => {
      const value = req.body;

      console.log(value);

      sendResponse(res, { statusCode: 201, success: true, message: 'User created successfully', data: value });
});
