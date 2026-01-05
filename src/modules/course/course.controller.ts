import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';
import { Course } from './course.model';

// @desc    Create user
export const createCourse = catchAsync(async (req: Request, res: Response) => {
      const value = req.body;

      const course = await Course.create(value);
      if (!course as any) throw new AppError(400, 'User registration failed');

      const image = req.file?.path;
      console.log(image);

      if (image) {
            const result = await uploadToCloudinary(image);
            if (result) {
                  (course as any).courseImage = {
                        public_id: result.public_id,
                        url: result.url,
                  };
                  await course.save();
            }
      }

      course.lessons.push(new mongoose.Types.ObjectId('695af7c0474b7564af714c39'));
      await course.save();

      sendResponse(res, { statusCode: 201, success: true, message: 'User created successfully', data: course });
});
