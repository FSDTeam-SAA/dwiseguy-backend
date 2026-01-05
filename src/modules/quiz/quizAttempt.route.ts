import express from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
      getQuizForStudent,
      submitQuiz,
      getStudentQuizResult,
      getStudentAllAttempts,
      checkStudentAttempt,
} from './quizAttempt.controller';
import { submitQuizSchema, getQuizByIdSchema } from './quiz.validation';

const router = express.Router();

/* ===============================
   Student Quiz Attempt Routes
================================ */

// Get all student's quiz attempts (Student Dashboard)
router.get('/my-attempts', protect, getStudentAllAttempts);

// Submit Quiz (Student)
router.post('/submit', protect, validateRequest(submitQuizSchema), submitQuiz);

// Check if student has attempted quiz
router.get('/check-attempt/:id', protect, validateRequest(getQuizByIdSchema), checkStudentAttempt);

// Get Quiz for Student (without correct answers)
router.get('/:id', protect, validateRequest(getQuizByIdSchema), getQuizForStudent);

// Get Student's Specific Quiz Result
router.get('/result/:id', protect, validateRequest(getQuizByIdSchema), getStudentQuizResult);

export default router;
