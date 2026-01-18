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

router.get('/my-attempts', authGuard, getStudentAllAttempts);

router.post('/submit', authGuard, validateRequest(submitQuizSchema), submitQuiz);

router.get('/check-attempt/:id', authGuard, checkStudentAttempt);

router.get('/:id', authGuard, getQuizForStudent);

router.get('/result/:id', authGuard, getStudentQuizResult);

router.get('/detailed-result/:id', authGuard, getDetailedQuizResults);

export default router;
