

import express from 'express';
import { upload } from '../../middlewares/multer.middleware';
import { lessonController } from './lesson.controller'; // Renamed
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// Admin Management Routes
router.post(
  '/admin/create-lesson', 
  authGuard, 
  isAdmin,
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'audio', maxCount: 2 }
  ]),
  lessonController.createLesson
);

router.patch(
  '/admin/update/:id', 
  authGuard, 
  isAdmin, 
  upload.fields([
    { name: 'images', maxCount: 5 }, 
    { name: 'audio', maxCount: 1 }
  ]),
  lessonController.updateLesson
);

router.delete(
  '/admin/delete/:id', 
  authGuard, 
  isAdmin, 
  lessonController.deleteLesson
);

export const lessonRouter = router;