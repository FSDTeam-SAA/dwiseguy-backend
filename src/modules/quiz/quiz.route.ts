import express from 'express';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
      createQuiz,
      getAllQuizzes,
      getQuizById,
      updateQuiz,
      deleteQuiz,
      getQuizAnalytics,
      getLeaderboard,
} from './quiz.controller';
import { createQuizSchema, updateQuizSchema, getQuizByIdSchema } from './quiz.validation';

const router = express.Router();

/* ===============================
   Admin Quiz Routes
================================ */

// Get Leaderboard (Admin)
router.get('/leaderboard', authGuard, isAdmin, getLeaderboard);

// Create Quiz (Admin)
router.post('/', authGuard, isAdmin, createQuiz);

// Get All Quizzes (Admin)
router.get('/', authGuard, isAdmin, getAllQuizzes);

// Get Quiz by ID (Admin) - with correct answers
router.get('/:id', authGuard, isAdmin, validateRequest(getQuizByIdSchema), getQuizById);

// Update Quiz (Admin)
router.put('/:id', authGuard, isAdmin, validateRequest(updateQuizSchema), updateQuiz);

// Delete Quiz (Admin)
router.delete('/:id', authGuard, isAdmin, validateRequest(getQuizByIdSchema), deleteQuiz);

// Get Quiz Analytics (Admin)
router.get('/:id/analytics', authGuard, isAdmin, validateRequest(getQuizByIdSchema), getQuizAnalytics);

export default router;
