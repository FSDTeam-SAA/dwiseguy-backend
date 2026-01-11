import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { Excerise } from './exercise.model';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';
import { ExerciseContent } from '../exerciseContent/exerciseContent.model';

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
      const { exerciseId: id } = req.params;
      const exercise = await Excerise.findById(id).populate('ExerciseContent');
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
      const { exerciseId:id } = req.params;
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
      const { exerciseId } = req.params;
      const exercise = await Excerise.findById({ _id: exerciseId }).populate('ExerciseContent');
      if (!exercise) throw new AppError(400, 'Exercise not found');

      if (exercise.ExerciseContent && exercise.ExerciseContent.length > 0) {
            for (const content of exercise.ExerciseContent as any) {
                  // Delete image from Cloudinary
                  if (content.image?.public_id) {
                        await deleteFromCloudinary(content.image.public_id, 'image');
                  }

                  // Delete audio from Cloudinary
                  if (content.audio?.public_id) {
                        await deleteFromCloudinary(content.audio.public_id, 'audio');
                  }

                  // Delete the ExerciseContent document
                  await ExerciseContent.findByIdAndDelete(content._id);
            }
      }

      // Delete the main Exercise
      await Excerise.findByIdAndDelete(exerciseId);
      // if delete then delete image from cloudinary and all exceriseContent
      if (exercise.images?.public_id) {
            await deleteFromCloudinary(exercise.images?.public_id as string, 'image');
      }
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Exercise deleted successfully',
            data: {
                  name: exercise.title,
                  id: exercise._id,
            },
      });
});
