import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { progressService } from './progress.service';
import AppError from '../../errors/AppError';

const startInstrument = catchAsync(async (req: Request, res: Response) => {
  const { instrumentId, userId: bodyUserId } = req.body;
  const userId = req.user?._id || bodyUserId; 

  if (!instrumentId || !userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Instrument ID and User ID are required.");
  }

  const result = await progressService.initializeProgress(userId.toString(), instrumentId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Instrument practice started successfully!",
    data: result,
  });
});

const getStudentInstrumentDetails = catchAsync(async (req: Request, res: Response) => {
  const { instrumentId } = req.params;
  const userId = req.user?._id || req.query.userId;

  if (!userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required.");
  }

  const result = await progressService.getInstrumentDetailsWithProgress(userId.toString(), instrumentId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: result,
  });
});

const completeLesson = catchAsync(async (req: Request, res: Response) => {
  const { lessonId, userId: bodyUserId } = req.body;
  const userId = req.user?._id || bodyUserId;

  if (!lessonId || !userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Missing lessonId or userId");
  }

  const result = await progressService.updateStudentProgress(userId.toString(), lessonId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Progress updated successfully",
    data: result,
  });
});

const resumeInstrument = catchAsync(async (req: Request, res: Response) => {
  const { instrumentId } = req.params;
  const userId = req.user?._id || req.query.userId;

  if (!userId) throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required.");

  const result = await progressService.getResumePoint(userId.toString(), instrumentId);

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

export const progressController = {
  startInstrument,
  getStudentInstrumentDetails,
  completeLesson,
  resumeInstrument,
  getLeaderboard
};