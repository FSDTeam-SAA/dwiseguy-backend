import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as quizService from './quiz.service';

export const createQuiz = catchAsync(async (req: Request, res: Response) => {
      const adminId = req.user?._id;

      const quiz = await quizService.createQuizService(req.body, adminId.toString());

      sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Quiz created successfully',
            data: quiz,
      });
});

export const getAllQuizzes = catchAsync(async (req: Request, res: Response) => {
      const quizzes = await quizService.getAllQuizzesService();

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Quizzes retrieved successfully',
            data: quizzes,
      });
});

export const getQuizById = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params;

      const quiz = await quizService.getQuizByIdService(id);

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Quiz retrieved successfully',
            data: quiz,
      });
});

export const updateQuiz = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params;

      const quiz = await quizService.updateQuizService(id, req.body);

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Quiz updated successfully',
            data: quiz,
      });
});

export const deleteQuiz = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params;

      const result = await quizService.deleteQuizService(id);

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: result.message,
            data: result.data,
      });
});

export const getQuizAnalytics = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params;

      const analytics = await quizService.getQuizAnalyticsService(id);

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Quiz analytics retrieved successfully',
            data: analytics,
      });
});

export const getLeaderboard = catchAsync(async (req: Request, res: Response) => {
      const leaderboard = await quizService.getLeaderboardService();

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Leaderboard retrieved successfully',
            data: leaderboard,
      });
});
