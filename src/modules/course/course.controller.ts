import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';
import { Course } from './course.model';
import { buildMetaPagination } from '../../utils/pagination';

// @desc    Create user
export const createCourse = catchAsync(async (req: Request, res: Response) => {
      const value = req.body;

      const course = await Course.create(value);
      if (!course as any) throw new AppError(400, 'User registration failed');

      const image = req.file;

      if (image) {
            const result = await uploadToCloudinary(image.path, 'image');
            if (result) {
                  (course as any).courseImage = {
                        public_id: result.public_id,
                        url: result.url,
                  };
                  await course.save();
            }
      }
      await course.save();

      sendResponse(res, { statusCode: 201, success: true, message: 'Course created successfully', data: course });
});

//get single course details
export const getSingleCourse = catchAsync(async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const course = await Course.findById(id);
      if (!course) throw new AppError(404, 'Course not found');
      sendResponse(res, { statusCode: 200, success: true, message: 'Course fetched successfully', data: course });
});

//get all courses
export const getAllCourses = catchAsync(async (req: Request, res: Response) => {
      //  Read query params
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.max(Number(req.query.limit) || 10, 1);

      const skip = (page - 1) * limit;

      //  Fetch data
      const [courses, totalItems] = await Promise.all([Course.find().skip(skip).limit(limit), Course.countDocuments()]);

      //  Build pagination meta
      const meta = buildMetaPagination(totalItems, page, limit);

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Courses fetched successfully',
            data: {
                  meta,
                  courses,
            },
      });
});

//update course
export const updateCourse = catchAsync(async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const value = req.body;
      const image = req.file as Express.Multer.File;

      const course = await Course.findByIdAndUpdate(id, value, { new: true });
      if (image) {
            console.log((course as any).courseImage);

            if (course?.courseImage && typeof course.courseImage === 'object' && 'public_id' in course.courseImage) {
                  //delete previous image from cloudinary
                  await deleteFromCloudinary((course.courseImage as any).public_id as string, 'image');
            }
            const result = await uploadToCloudinary(image.path, 'image');
            if (result) {
                  value.courseImage = {
                        public_id: result.public_id,
                        url: result.url,
                  };
            }
      }

      if (!course) throw new AppError(404, 'Course not found');
      sendResponse(res, { statusCode: 200, success: true, message: 'Course updated successfully', data: course });
});

//delete course
export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const course = await Course.findById(id).populate('lessons');
      if (!course) throw new AppError(404, 'Course not found');
      sendResponse(res, { statusCode: 200, success: true, message: 'Course deleted successfully', data: course });
});
