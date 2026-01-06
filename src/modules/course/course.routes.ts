import express from 'express';
import { upload } from '../../middlewares/multer.middleware';

import { createCourse, getSingleCourse, getAllCourses, updateCourse, deleteCourse } from './course.controller';
import { createCourseSchema, updateCourseSchema } from './course.validation';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

router.post(
      '/create-course',
      authGuard,
      isAdmin,
      upload.single('image'),
      validateRequest(createCourseSchema),
      createCourse
);

router.get('/get-single-course/:id', getSingleCourse);
router.get('/get-all-courses', getAllCourses);
router.patch(
      '/update-course/:id',
      authGuard,
      isAdmin,
      upload.single('image'),
      validateRequest(updateCourseSchema),
      updateCourse
);
router.delete('/delete-course/:id', authGuard, isAdmin, deleteCourse);
export default router;
