import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
      getQuizForStudent,
      submitQuiz,
      getStudentQuizResult,
      getDetailedQuizResults, // ✅ NEW
      getStudentAllAttempts,
      checkStudentAttempt,
} from './quizAttempt.controller';
import { submitQuizSchema, getQuizByIdSchema } from '../quiz/quiz.validation';

const router = express.Router();

/* ===============================
   Student Quiz Attempt Routes
================================ */

// Get all student's quiz attempts (Student Dashboard)
router.get('/my-attempts', authGuard, getStudentAllAttempts);

// Submit Quiz (Student)
router.post('/submit', authGuard, validateRequest(submitQuizSchema), submitQuiz);

// Check if student has attempted quiz
router.get('/check-attempt/:id', authGuard, validateRequest(getQuizByIdSchema), checkStudentAttempt);

// Get Quiz for Student (without correct answers)
router.get('/:id', authGuard, validateRequest(getQuizByIdSchema), getQuizForStudent);

// Get Student's Basic Quiz Result (no detailed answers)
router.get('/result/:id', authGuard, validateRequest(getQuizByIdSchema), getStudentQuizResult);

// ✅ NEW: Get Detailed Quiz Results (with correct/wrong answers)
router.get('/detailed-result/:id', authGuard, validateRequest(getQuizByIdSchema), getDetailedQuizResults);

export default router;
