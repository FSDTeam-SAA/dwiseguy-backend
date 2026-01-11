import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { Excerise } from './exercise.model';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';

//create new exercise
export const createExercise = catchAsync(async (req: Request, res: Response) => {
      const value = req.body;
      const image = req.file;
      //create new exercise
      const exercise = await Excerise.create(value);
      if (!exercise) throw new AppError(400, 'Exercise not created');

      if (image) {
            const result = await uploadToCloudinary(image.path, 'image');
            if (result) {
                  exercise.images = {
                        public_id: result.public_id,
                        url: result.url,
                  };
                  await exercise.save();
            }
      }
      sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Exercise created successfully',
            data: exercise,
      });
});

//get all exercises
export const getAllExercises = catchAsync(async (req: Request, res: Response) => {
      const exercises = await Excerise.find();
      if (!exercises) throw new AppError(400, 'Exercises not found');
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Exercises retrieved successfully',
            data: exercises,
      });
});

//get exercise by id
export const getExerciseById = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params;
      const exercise = await Excerise.findById(id);
      if (!exercise) throw new AppError(400, 'Exercise not found');
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Exercise retrieved successfully',
            data: exercise,
      });
});

//update exercise by id
export const updateExerciseById = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params;
      const image = req.file;
      const exercise = await Excerise.findByIdAndUpdate(id, req.body, { new: true });
      if (!exercise) throw new AppError(400, 'Exercise not found');

      //update image into cloudinary
      if (image) {
            if (exercise.images?.public_id) {
                  //delete previous image from cloudinary
                  await deleteFromCloudinary(exercise.images?.public_id as string, 'image');
            }
            const imageAsset = await uploadToCloudinary(image?.path);
            if (imageAsset) {
                  exercise.images = {
                        public_id: imageAsset.public_id,
                        url: imageAsset.url,
                  };
            }
            await exercise.save();
      }
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Exercise updated successfully',
            data: exercise,
      });
});

//delete exercise by id
export const deleteExerciseById = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params;
      const exercise = await Excerise.findByIdAndDelete(id);
      if (!exercise) throw new AppError(400, 'Exercise not found');

      // if delete then delete image from cloudinary and all exceriseContent
      if (exercise.images?.public_id) {
            await deleteFromCloudinary(exercise.images?.public_id as string, 'image');
      }
      if (exercise.ExerciseContent.length > 0) {
            await Excerise.deleteMany({ _id: { $in: exercise.ExerciseContent } });
      }
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Exercise deleted successfully',
            data: exercise,
      });
});
