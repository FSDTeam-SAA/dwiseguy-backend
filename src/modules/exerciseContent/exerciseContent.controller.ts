import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';
import { ExerciseContent } from './exerciseContent.model';
import { Excerise } from '../exercise/exercise.model';
import { Lesson } from '../lesson/lesson.model';

//create exercise content
export const createExerciseContent = catchAsync(async (req: Request, res: Response) => {
      const { value } = req.body;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const image = files?.image?.[0];
      const audio = files?.audio?.[0];

      //create new exercise
      const exerciseContent = await ExerciseContent.create({
            ...value,
            ketNotes: value.keyNotes,
      });
      if (!exerciseContent) throw new AppError(400, 'Exercise not created');

      //push excersise it to excersise
      const exercise = await Excerise.findByIdAndUpdate(
            { _id: exerciseContent.exerciseId },
            { $push: { ExerciseContent: exerciseContent._id } }
      );

      //push excercise content id to lesson
      const lesson = await Lesson.findByIdAndUpdate(
            { _id: exerciseContent.lessonId },
            { $push: { exerciseContentIds: exerciseContent._id } }
      )

      //upload image to cloudinary
      if (image) {
            const result = await uploadToCloudinary(image.path, 'image');
            if (result) {
                  exerciseContent.image = {
                        public_id: result.public_id,
                        url: result.url,
                  };
            }
      }
      //upload audio to cloudinary
      if (audio) {
            const result = await uploadToCloudinary(audio.path, 'audio');
            if (result) {
                  exerciseContent.audio = {
                        public_id: result.public_id,
                        url: result.url,
                  };
            }
      }
      await exerciseContent.save();
      sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Exercise created successfully',
            data: exerciseContent,
      });
});

//get all exercise content by id and filterd by exercise
export const getAllExerciseContent = catchAsync(async (req: Request, res: Response) => {
      let { exerciseId } = req.query;

      //filter by exerciseId
      let filter = exerciseId ? { exerciseId: exerciseId } : {};

      const exerciseContent = await ExerciseContent.find(filter);

      if (!exerciseContent || exerciseContent.length === 0) throw new AppError(400, 'Exercise Content not found');

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'All Exercise Content',
            data: exerciseContent,
      });
});

//get exercise content by id
export const getExerciseContentById = catchAsync(async (req: Request, res: Response) => {
      const { exercisecontentId } = req.params;
      const exerciseContent = await ExerciseContent.findById(exercisecontentId);
      if (!exerciseContent) throw new AppError(400, 'Exercise Content not found');
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Exercise Content retrieved successfully',
            data: exerciseContent,
      });
});

//update exercise content by id
export const updateExerciseContentById = catchAsync(async (req: Request, res: Response) => {
      const { exercisecontentId } = req.params;
      const { value } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const image = files?.image?.[0];
      const audio = files?.audio?.[0];

      //  Fetch existing document first
      const existingContent = await ExerciseContent.findById(exercisecontentId);
      if (!existingContent) throw new AppError(400, 'Exercise Content not found');

      //  Handle image
      if (image) {
            ///  Delete previous image
            if (existingContent.image?.public_id) {
                  await deleteFromCloudinary(existingContent.image.public_id, 'image');
            }
            //  Upload new image
            const result = await uploadToCloudinary(image.path, 'image');
            if (result) value.image = { public_id: result.public_id, url: result.url };
      }

      //  Handle audio
      if (audio) {
            ///  Delete previous audio
            if (existingContent.audio?.public_id) {
                  await deleteFromCloudinary(existingContent.audio.public_id, 'audio');
            }
            //  Upload new audio
            const result = await uploadToCloudinary(audio.path, 'audio');
            if (result) value.audio = { public_id: result.public_id, url: result.url };
      }

      //  Update document with all new values
      const exerciseContent = await ExerciseContent.findByIdAndUpdate(exercisecontentId, value, { new: true });

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Exercise Content updated successfully',
            data: exerciseContent,
      });
});

//delete exercise content by id
export const deleteExerciseContentById = catchAsync(async (req: Request, res: Response) => {
      const { exercisecontentId } = req.params;
      const exerciseContent = await ExerciseContent.findByIdAndDelete(exercisecontentId);
      if (!exerciseContent) throw new AppError(400, 'Exercise Content not found');

      //remove id from exercise
      const excercise = await Excerise.findByIdAndUpdate(
            { _id: exerciseContent.exerciseId },
            { $pull: { ExerciseContent: exerciseContent._id } }
      );

      //remove id from lesson
      const lesson = await Lesson.findByIdAndUpdate(
            { _id: exerciseContent.lessonId },
            { $pull: { exerciseContentIds: exerciseContent._id } }
      );

      // if delete then delete image from cloudinary
      if (exerciseContent.image?.public_id) {
            await deleteFromCloudinary(exerciseContent.image?.public_id as string, 'image');
      }
      if (exerciseContent.audio?.public_id) {
            await deleteFromCloudinary(exerciseContent.audio?.public_id as string, 'audio');
      }
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: `Exercise content ${exerciseContent.title} deleted successfully`,
            data: {
                  name: exerciseContent.title,
            },
      });
});
