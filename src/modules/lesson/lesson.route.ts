

import express from 'express';
import { upload } from '../../middlewares/multer.middleware';
import { lessonController } from './lesson.controller'; // Renamed
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// Admin Management Routes
router.post(
  '/create-lesson', 
  authGuard, 
  isAdmin,
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'audio', maxCount: 2 }
  ]),
  lessonController.createLesson
);

router.patch(
  '/update/:id', 
  authGuard, 
  isAdmin, 
  upload.fields([
    { name: 'images', maxCount: 5 }, 
    { name: 'audio', maxCount: 1 }
  ]),
  lessonController.updateLesson
);

router.delete(
  '/delete/:id', 
  authGuard, 
  isAdmin, 
  lessonController.deleteLesson
);

// User Management Routes

router.get('/get-lessons-by-module/:moduleId', authGuard,lessonController.getLessonByModule);
// router.get('/get-single-lesson/:lessonId', authGuard,lessonController.getSingleLesson);
router.patch(
  '/complete-lesson/:lessonId',
  authGuard,
  lessonController.completeLesson
);


export const lessonRouter = router;