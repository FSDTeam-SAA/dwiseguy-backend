import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { completeModuleService, progressService } from './progress.service';
import AppError from '../../errors/AppError';
import { UserProgress } from './progress.model';

const startInstrument = catchAsync(async (req: Request, res: Response) => {
      const { instrumentId, userId: bodyUserId } = req.body;
      const userId = req.user?._id || bodyUserId;

      if (!instrumentId || !userId) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Instrument ID and User ID are required.');
      }

      const result = await progressService.initializeProgress(userId.toString(), instrumentId);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Instrument practice started successfully!',
            data: result,
      });
});

const getStudentInstrumentDetails = catchAsync(async (req: Request, res: Response) => {
      const { instrumentId } = req.params;
      const userId = req.user?._id || req.query.userId;

      if (!userId) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'User ID is required.');
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
            throw new AppError(StatusCodes.BAD_REQUEST, 'Missing lessonId or userId');
      }

      const result = await progressService.updateStudentProgress(userId.toString(), lessonId);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Progress updated successfully',
            data: result,
      });
});

export const completeModule = catchAsync(async (req: Request, res: Response) => {
      const userId = req.user?._id;
      const { moduleId } = req.body;

      const result = await completeModuleService(userId, moduleId);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message:
                  result.status === 'NEXT_MODULE_UNLOCKED'
                        ? 'Module completed and next module unlocked'
                        : result.status === 'INSTRUMENT_COMPLETED'
                          ? 'Instrument completed successfully'
                          : 'Quiz not passed',
            data: result,
      });
});

const resumeInstrument = catchAsync(async (req: Request, res: Response) => {
      const { instrumentId } = req.params;
      const userId = req.user?._id || req.query.userId;

      if (!userId) throw new AppError(StatusCodes.BAD_REQUEST, 'User ID is required.');

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
            message: 'Leaderboard fetched successfully',
            data: result,
      });
});

const getAdminStats = catchAsync(async (req: Request, res: Response) => {
      const result = await progressService.getAdminProgressStats();

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Admin statistics retrieved successfully',
            data: result[0] || {
                  // Return first object or empty defaults
                  totalEnrolledStudents: 0,
                  totalLessonsCompleted: 0,
                  totalModulesPassed: 0,
                  completedCourses: 0,
            },
      });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
      // Pass req.query to handle ?page=1&limit=10
      const result = await progressService.getAllStudentsProgressReportFromDb(req.query);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Student progress reports retrieved successfully',
            meta: result.meta,
            data: result.data,
      });
});

export const progressController = {
      startInstrument,
      getStudentInstrumentDetails,
      completeLesson,
      resumeInstrument,
      getLeaderboard,
      getAdminStats,
      getAllReports,
      completeModule,
};
