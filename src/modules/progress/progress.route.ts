import express from 'express';
import { progressController } from './progress.controller';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// Require login for all progress tracking
router.use(authGuard);

// Student clicks "Start Learning"
router.post(
  '/start-instrument',
  progressController.startInstrument
);

// Student views the instrument curriculum (with lock/unlock logic)
router.get(
  '/instrument-details/:instrumentId',
  progressController.getStudentInstrumentDetails
);

// Get the specific lesson the user left off at
router.get(
  '/resume/:instrumentId',
  progressController.resumeInstrument
);

// Global or instrument-specific leaderboard
router.get('/leaderboard', progressController.getLeaderboard);

// Mark a specific lesson as finished
router.post('/complete-lesson', progressController.completeLesson);


// Admin Stats
router.get('/admin-stats', progressController.getAdminStats);

// For the Admin Dashboard "Students" or "Reports" tab
router.get(
  '/admin/student-reports', 
  progressController.getAllReports
);

export const progressRouter = router;