import express from 'express';

import { upload } from '../../middlewares/multer.middleware';
import { subLessonController } from './sublesson.controller';

const router = express.Router();

router.post(
  '/create-sublesson',
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'audio', maxCount: 2 }
  ]),
  subLessonController.createSubLesson
);

// router.get('/:id',  subLessonController.getSingleSubLesson);

export const subLessonRouter = router;