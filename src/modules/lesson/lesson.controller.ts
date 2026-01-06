
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { lessonService } from './lesson.service';
import { StatusCodes } from 'http-status-codes';
import { uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';


export const createLesson = catchAsync(async (req: Request, res: Response) => {
  // 1. Check for files from Multer
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  // 2. Parse the stringified 'data' field
  if (!req.body.data) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Lesson data is required in the 'data' field");
  }

  let lessonData;
  try {
    lessonData = JSON.parse(req.body.data);
  } catch (error) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid JSON format in data field");
  }

  // 3. Process Images for Lesson (e.g., Intro diagrams)
  const imageUploadPromises = (files?.images || []).map(file => 
    uploadToCloudinary(file.path, 'image')
  );
  const imageResults = await Promise.all(imageUploadPromises);
  const images = imageResults
    .filter(res => res !== null)
    .map(res => ({ url: res!.url, public_id: res!.public_id }));

  // 4. Process Audio for Lesson (e.g., Intro instructions)
  let audio = null;
  if (files?.audio?.[0]) {
    const audioRes = await uploadToCloudinary(files.audio[0].path, 'audio');
    if (audioRes) {
      audio = { url: audioRes.url, public_id: audioRes.public_id };
    }
  }

  // 5. Construct final payload
  // Ensure courseId and sectionId are present in lessonData
  const finalPayload = {
    ...lessonData,
    media: {
      images,
      audio
    }
  };

  // 6. Call Service (which handles Course ID pushing via Transaction)
  const result = await lessonService.createLessonIntoDb(finalPayload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Lesson with multimedia created and linked to course successfully',
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
  await lessonService.deleteLessonFromDB(id);

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