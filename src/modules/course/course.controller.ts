import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';
import { Course } from './course.model';
import { buildMetaPagination } from '../../utils/pagination';
import { Lesson } from '../lesson/lesson.model';
import { ICourse, PopulatedCourse } from './course.interface';
import { SubLesson } from '../sublesson/sublesson.model';

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
      const courseId = req.params.id as string;

      // Populate lessons and sublessons
      const course = (await Course.findById(courseId).populate({
            path: 'lessons',
            populate: { path: 'sublessons' },
      })) as PopulatedCourse | null;

      if (!course) throw new AppError(404, 'Course not found');

      // Delete course image
      if (course.courseImage?.public_id) {
            await deleteFromCloudinary(course.courseImage.public_id, 'image');
      }

      // Loop through lessons
      for (const lesson of course.lessons ?? []) {
            // Delete lesson images
            for (const img of lesson.images ?? []) {
                  if (img.public_id) await deleteFromCloudinary(img.public_id, 'image');
            }

            // Delete sublesson media
            for (const sub of lesson.sublessons ?? []) {
                  // Images
                  for (const img of sub.media?.images ?? []) {
                        if (img.public_id) await deleteFromCloudinary(img.public_id, 'image');
                  }

                  // Audio
                  if (sub.media?.audio?.public_id) {
                        await deleteFromCloudinary(sub.media.audio.public_id, 'audio');
                  }
            }

            // Delete sublessons from DB
            const sublessonIds = lesson.sublessons?.map((s) => s._id) ?? [];
            if (sublessonIds.length) {
                  await SubLesson.deleteMany({ _id: { $in: sublessonIds } });
            }
      }

      // Delete all lessons of the course
      await Lesson.deleteMany({ courseId: course._id });

      // Delete the course itself
      await course.deleteOne();

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Course, lessons, sublessons, and all media deleted successfully',
            data: course,
      });
});
