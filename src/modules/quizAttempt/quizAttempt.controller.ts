import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as quizAttemptService from './quizAttempt.service';
import AppError from '../../errors/AppError';

/* ===============================
   Student Quiz Attempt Controllers
================================ */

// @desc    Get Quiz for Student (without correct answers)
// @route   GET /api/quiz/student/:id
// @access  Private/Student
export const getQuizForStudent = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params; // quizId
      const studentId = req.user?._id;
      if (!studentId) throw new AppError(401, 'Unauthorized');

      const quiz = await quizAttemptService.getQuizForStudentService(id, studentId.toString());

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Quiz retrieved successfully',
            data: quiz,
      });
});

// @desc    Submit Quiz (Student)
// @route   POST /api/quiz/student/submit
// @access  Private/Student
export const submitQuiz = catchAsync(async (req: Request, res: Response) => {
      const studentId = req.user?._id;
      if (!studentId) throw new AppError(401, 'Unauthorized');

      const result = await quizAttemptService.submitQuizService(req.body, studentId.toString());

      sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Quiz submitted successfully',
            data: result,
      });
});

// @desc    Get Student's Specific Quiz Result
// @route   GET /api/quiz/student/result/:id
// @access  Private/Student
export const getStudentQuizResult = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params; // quizId
      const studentId = req.user?._id;
      if (!studentId) throw new AppError(401, 'Unauthorized');

      const result = await quizAttemptService.getStudentQuizResultService(id, studentId.toString());

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Quiz result retrieved successfully',
            data: result,
      });
});

// @desc    Get All Student's Quiz Attempts (Student Dashboard)
// @route   GET /api/quiz/student/my-attempts
// @access  Private/Student
export const getStudentAllAttempts = catchAsync(async (req: Request, res: Response) => {
      const studentId = req.user?._id;
      if (!studentId) throw new AppError(401, 'Unauthorized');

      const attempts = await quizAttemptService.getStudentAllAttemptsService(studentId.toString());

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'All quiz attempts retrieved successfully',
            data: attempts,
      });
});

// @desc    Check if Student has Attempted Quiz
// @route   GET /api/quiz/student/check-attempt/:id
// @access  Private/Student
export const checkStudentAttempt = catchAsync(async (req: Request, res: Response) => {
      const { id } = req.params; // quizId
      const studentId = req.user?._id;
      if (!studentId) throw new AppError(401, 'Unauthorized');

      const hasAttempted = await quizAttemptService.hasStudentAttemptedQuizService(id, studentId.toString());

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: hasAttempted ? 'You have already attempted this quiz' : 'You have not attempted this quiz',
            data: { hasAttempted },
      });
});
