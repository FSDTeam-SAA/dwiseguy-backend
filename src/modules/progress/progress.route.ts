import express from 'express';
import { progressController } from './progress.controller';
// import { auth } from '../../middlewares/auth.middleware';

const router = express.Router();

// Student clicks "Start Course"
router.post(
  '/start-course',
//   auth('student', 'admin'), 
  progressController.startCourse
);

// Student views the course curriculum (showing what is locked/unlocked)
router.get(
  '/course-details/:courseId',
//   auth('student', 'admin'),
  progressController.getStudentCourseDetails
);

router.get(
  '/resume/:courseId',
  progressController.resumeCourse
);

router.get('/leaderboard', progressController.getLeaderboard);

router.post('/complete-step', progressController.completeSubLesson);

export const progressRouter = router;