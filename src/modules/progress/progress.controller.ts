import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { progressService } from './progress.service';
import AppError from '../../errors/AppError';

const startCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId, userId: bodyUserId } = req.body;
  const userId = req.user?._id || bodyUserId; 

  if (!courseId || !userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Course ID and User ID are required.");
  }

  const result = await progressService.initializeProgress(userId.toString(), courseId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Course started successfully!",
    data: result,
  });
});

const getStudentCourseDetails = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?._id || req.query.userId;

  if (!userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required.");
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

  const result = await progressService.updateStudentProgress(userId.toString(), subLessonId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Progress updated successfully",
    data: result,
  });
});

const resumeCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?._id || req.query.userId;

  if (!userId) throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required.");

  const result = await progressService.getResumePoint(userId.toString(), courseId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: result,
  });
});


const getLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const result = await progressService.getLeaderboard();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Leaderboard fetched successfully",
    data: result,
  });
});

// Add to your exports



export const progressController = {
  startCourse,
  getStudentCourseDetails,
  completeSubLesson,
  resumeCourse,
  getLeaderboard
};