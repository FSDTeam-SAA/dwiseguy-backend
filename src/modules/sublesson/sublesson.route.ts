import express from 'express';

import { upload } from '../../middlewares/multer.middleware';
import { subLessonController } from './sublesson.controller';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// Admin Management Routes

router.patch(
  '/update/:id', 
  authGuard, 
  isAdmin, 
  upload.fields([{ name: 'images', maxCount: 5 }, { name: 'audio', maxCount: 1 }]), // Add this if updating files
  subLessonController.updateSubLesson
);

router.delete(
  '/delete/:id', 
  authGuard, 
  isAdmin, 
  subLessonController.deleteSubLesson
);

router.post(
  '/create-sublesson', authGuard, isAdmin,
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'audio', maxCount: 2 }
  ]),
  subLessonController.createSubLesson
);

// router.get('/:id',  subLessonController.getSingleSubLesson);

export const subLessonRouter = router;