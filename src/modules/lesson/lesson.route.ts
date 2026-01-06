import express from 'express';
import { lessonController } from './lesson.controller';
import { upload } from '../../middlewares/multer.middleware';
import { USER_ROLE } from '../constant/user.constant';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// ADMIN ROUTES
router.post(
  '/create-lesson',
  authGuard,   // Step 1: Check if logged in
  isAdmin,     // Step 2: Check if admin
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'audio', maxCount: 5 }
  ]),
  lessonController.createLesson
);

// Admin only routes
router.patch('/update/:id', 
  authGuard,
  isAdmin, 
  lessonController.updateLesson);

router.delete('/delete/:id', 
  authGuard,
  isAdmin, 
  lessonController.deleteLesson);

// STUDENT ROUTES
// This will be accessible via {{baseUrl}}/api/v1/lesson/get-lesson/:id
// router.get(
//   '/get-lesson/:id', 
//   // auth('user'), <--- Only students can read
//   lessonController.getSingleLesson
// );



// -------------------------------------------- //
// ADMIN ROUTES
// router.post(
//   '/create-lesson', 
//   auth('admin'), // Secure: Only admins
//   upload.fields([
//     { name: 'images', maxCount: 5 },
//     { name: 'audio', maxCount: 5 }
//   ]),
//   lessonController.createLesson
// );

// router.patch(
//   '/update/:id', 
//   auth('admin'), // Secure: Only admins
//   lessonController.updateLesson
// );

// router.delete(
//   '/delete/:id', 
//   auth('admin'), // Secure: Only admins
//   lessonController.deleteLesson
// );

// STUDENT / BOTH ROUTES
// If you implement get-lesson, it should be:
// router.get('/:id', auth('user', 'admin'), lessonController.getSingleLesson);

// -------------------------------------------- //

const lessonRouter = router;
export default lessonRouter;

