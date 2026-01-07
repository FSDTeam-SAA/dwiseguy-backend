import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
      getQuizForStudent,
      submitQuiz,
      getStudentQuizResult,
      getStudentAllAttempts,
      checkStudentAttempt,
} from './quizAttempt.controller';
import { submitQuizSchema, getQuizByIdSchema } from './quizAttempt.validation';

const router = express.Router();

// Get all student's quiz attempts (Student Dashboard)
router.get('/my-attempts', authGuard, getStudentAllAttempts);

// Submit Quiz (Student)
router.post('/submit', authGuard, validateRequest(submitQuizSchema), submitQuiz);

// Check if student has attempted quiz
router.get('/check-attempt/:id', authGuard, validateRequest(getQuizByIdSchema), checkStudentAttempt);

// Get Quiz for Student (without correct answers)
router.get('/:id', authGuard, validateRequest(getQuizByIdSchema), getQuizForStudent);

// Get Student's Specific Quiz Result
router.get('/result/:id', authGuard, validateRequest(getQuizByIdSchema), getStudentQuizResult);

export default router;
