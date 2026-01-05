// progress.controller.ts
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { progressService } from './progress.service';
import AppError from '../../errors/AppError';

// const startCourse = catchAsync(async (req: Request, res: Response) => {
//   const { courseId } = req.body;
// //   const userId = req.user._id; // Assuming you have auth middleware

//   if (!courseId) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "Course ID is required to start.");
//   }

//   const result = await progressService.initializeProgress(userId, courseId);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Course started successfully. Good luck with your piano practice!",
//     data: result,
//   });
// });


// const getStudentCourseDetails = catchAsync(async (req: Request, res: Response) => {
//   const { courseId } = req.params;
//   const userId = req.user._id;

//   const result = await progressService.getCourseDetailsWithProgress(userId, courseId);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     data: result,
//   });
// });

const startCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId, userId: bodyUserId } = req.body;
  
  // Logic: Use authenticated user if available, otherwise fallback to body for testing
  const userId = req.user?._id || bodyUserId; 

  if (!courseId || !userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Course ID and User ID are required.");
  }

  const result = await progressService.initializeProgress(userId.toString(), courseId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Course started successfully. Good luck with your piano practice!",
    data: result,
  });
});

const getStudentCourseDetails = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { userId: queryUserId } = req.query; // For testing without auth via: ?userId=xxx
  
  const userId = req.user?._id || queryUserId;

  if (!userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required to fetch progress.");
  }

  const result = await progressService.getCourseDetailsWithProgress(userId.toString(), courseId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: result,
  });
});


const completeSubLesson = catchAsync(async (req: Request, res: Response) => {
  const { subLessonId, userId: bodyUserId } = req.body;
  const userId = req.user?._id || bodyUserId;

  if (!subLessonId || !userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Missing subLessonId or userId");
  }

  // This calls the service we built previously that calculates the next 'order'
  const result = await progressService.updateStudentProgress(userId.toString(), subLessonId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Progress updated successfully",
    data: result,
  });
});

export const progressController = {
  startCourse,
  getStudentCourseDetails,
  completeSubLesson
};