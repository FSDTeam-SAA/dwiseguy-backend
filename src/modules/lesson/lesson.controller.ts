
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { lessonService } from './lesson.service';
import { StatusCodes } from 'http-status-codes';
import { uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';


const createLesson = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as any;
  
  if (!req.body.data) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Lesson data is required");
  }

  const lessonData = JSON.parse(req.body.data);

  // FIX: Explicitly define the type to satisfy TypeScript
  let images: { url: string; public_id: string }[] = [];

  if (files?.images) {
    const imageUploadPromises = files.images.map((file: any) => 
      uploadToCloudinary(file.path, 'image')
    );
    const imageResults = await Promise.all(imageUploadPromises);
    
    images = imageResults
      .filter((res): res is { url: string; public_id: string } => res !== null)
      .map(res => ({ url: res.url, public_id: res.public_id }));
  }

  // Matching your Lesson Schema exactly (top-level images array)
  const finalPayload = {
    ...lessonData,
    images: images, 
  };

  const result = await lessonService.createLessonIntoDb(finalPayload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Lesson created and linked to course successfully',
    data: result,
  });
});

const updateLesson = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await lessonService.updateLessonInDB(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Lesson updated successfully',
    data: result,
  });
});

const deleteLesson = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await lessonService.deleteLessonFromDb(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Lesson and its content deleted successfully',
    data: null,
  });
});

// export const getSingleLesson = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const userId = req.user._id; // Extracted from auth middleware

//   const result = await lessonService.getSingleLessonFromDB(id, userId);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Lesson retrieved successfully',
//     data: result,
//   });
// });

export const lessonController = {
    createLesson,
    deleteLesson,
    updateLesson

    // getSingleLesson
};