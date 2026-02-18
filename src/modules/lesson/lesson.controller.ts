import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { Request, Response } from 'express';
import sendResponse from '../../utils/sendResponse';
import { lessonService } from './lesson.service';
import { progressService } from '../progress/progress.service';

const createLesson = catchAsync(async (req: Request, res: Response) => {
      const files = req.files as any;
      if (!req.body.data) throw new AppError(StatusCodes.BAD_REQUEST, 'Data is required');

      const lessonData = JSON.parse(req.body.data);

      // 1. Process Images
      let images: { url: string; public_id: string }[] = [];
      if (files?.images) {
            const imagePromises = files.images.map((f: any) => uploadToCloudinary(f.path, 'image'));
            const results = await Promise.all(imagePromises);
            images = results.filter((r) => r !== null).map((r) => ({ url: r!.url, public_id: r!.public_id }));
      }

      // 2. Process Audio
      let audio = null;
      if (files?.audio?.[0]) {
            const audioRes = await uploadToCloudinary(files.audio[0].path, 'audio');
            if (audioRes) audio = { url: audioRes.url, public_id: audioRes.public_id };
      }

      // 3. Construct payload and Call Service (ModuleId is the parent)
      const result = await lessonService.createLessonIntoDb({
            ...lessonData,
            media: { images, audio },
      });

      sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'Lesson created and linked to Module successfully',
            data: result,
      });
});

const updateLesson = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params;
      const files = req.files as any;

      let updateData = req.body.data ? JSON.parse(req.body.data) : { ...req.body };

      // Process Optional Images
      if (files?.images && files.images.length > 0) {
            const imageUploadPromises = files.images.map((file: any) => uploadToCloudinary(file.path, 'image'));
            const imageResults = await Promise.all(imageUploadPromises);
            const newImages = imageResults
                  .filter((res): res is { url: string; public_id: string } => res !== null)
                  .map((res) => ({ url: res.url, public_id: res.public_id }));

            updateData.media = { ...updateData.media, images: newImages };
      }

      // Process Optional Audio
      if (files?.audio?.[0]) {
            const audioRes = await uploadToCloudinary(files.audio[0].path, 'audio');
            if (audioRes) {
                  updateData.media = {
                        ...updateData.media,
                        audio: { url: audioRes.url, public_id: audioRes.public_id },
                  };
            }
      }

      const result = await lessonService.updateLessonInDB(id, updateData);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Lesson updated successfully and synced with Module',
            data: result,
      });
});

const deleteLesson = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params;
      await lessonService.deleteLessonFromDB(id);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Lesson deleted and removed from Module array',
            data: null,
      });
});

// User cONTROL

const getLessonByModule = catchAsync(async (req: Request, res: Response) => {
      const { moduleId } = req.params;

      const lessons = await lessonService.getLessonByModuleIdFromDb(moduleId);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Lessons fetched successfully',
            data: lessons,
      });
});

const completeLesson = catchAsync(async (req: Request, res: Response) => {
      const { lessonId } = req.params;
      const userId = req.user?._id;

      // This calls the progress service we built earlier
      const result = await progressService.updateStudentProgress(userId.toString(), lessonId);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Lesson marked as completed!',
            data: result,
      });
});

const getSingleLesson = catchAsync(async (req: Request, res: Response) => {
      const { lessonId } = req.params;
      const result = await lessonService.getSingleLessonFromDb(lessonId);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Lesson fetched successfully',
            data: result,
      });
});


export const lessonController = {
      createLesson,
      deleteLesson,
      updateLesson,
      getLessonByModule,
      getSingleLesson,
      completeLesson,
};
