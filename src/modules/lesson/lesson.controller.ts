
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { lessonService } from './lesson.service';
import { StatusCodes } from 'http-status-codes';
import { uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';


export const createLesson = catchAsync(async (req: Request, res: Response) => {
  // Multer puts files in req.files when using .fields()
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  // Lesson details (title, content, courseId, order, isExercise) are sent in a 'data' field as stringified JSON
  if (!req.body.data) throw new AppError(StatusCodes.BAD_REQUEST, "Lesson data is required");
  const lessonData = JSON.parse(req.body.data);

  // 1. Process Images
  const imageUploadPromises = (files?.images || []).map(file => 
    uploadToCloudinary(file.path, 'image')
  );
  const imageResults = await Promise.all(imageUploadPromises);
  const images = imageResults
    .filter(res => res !== null)
    .map(res => ({ url: res!.url, public_id: res!.public_id }));

  // 2. Process Audio
  let audio = null;
  if (files?.audio?.[0]) {
    const audioRes = await uploadToCloudinary(files.audio[0].path, 'audio');
    if (audioRes) {
      audio = { url: audioRes.url, public_id: audioRes.public_id };
    }
  }

  // 3. Construct the Payload for DB
  const finalPayload = {
    ...lessonData,
    media: {
      images,
      audio
    }
  };

  const result = await lessonService.createLessonIntoDb(finalPayload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Lesson with multimedia created successfully',
    data: result,
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
    // getSingleLesson
};