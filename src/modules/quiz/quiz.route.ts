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
router.post('/create_quiz', authGuard, isAdmin, validateRequest(createQuizSchema), createQuiz);

// Get All Quizzes (Admin)
router.get('/get-all-quizzes', authGuard, getAllQuizzes);

// Get Quiz by ID (Admin) - with correct answers
router.get('/single-quiz/:id', authGuard, isAdmin, getQuizById);

// Update Quiz (Admin)
router.put('/update-quiz/:id', authGuard, isAdmin, validateRequest(updateQuizSchema), updateQuiz);

// Delete Quiz (Admin)
router.delete('/delete-quiz/:id', authGuard, isAdmin, deleteQuiz);

// Get Quiz Analytics (Admin)
router.get('/analytics/:id', authGuard, isAdmin, getQuizAnalytics);

export default router;
