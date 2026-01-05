import express from 'express';
import { lessonController } from './lesson.controller';
import { upload } from '../../middlewares/multer.middleware';

const router = express.Router();

// ADMIN ROUTES
router.post(
  '/create-lesson', 
  // auth('admin'), <--- You'll add this later to ensure only admins can post
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'audio', maxCount: 5 }
  ]),
  lessonController.createLesson
);

// STUDENT ROUTES
// This will be accessible via {{baseUrl}}/api/v1/lesson/get-lesson/:id
// router.get(
//   '/get-lesson/:id', 
//   // auth('user'), <--- Only students can read
//   lessonController.getSingleLesson
// );



const lessonRouter = router;
export default lessonRouter;

