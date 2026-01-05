import express from 'express';
import { upload } from '../../middlewares/multer.middleware';

import { createCourse } from './course.controller';
import { createCourseSchema } from './course.validation';
import { validateRequest } from '../../middlewares/validateRequest.middleware';

const router = express.Router();

router.post('/create-course', upload.single('image'), validateRequest(createCourseSchema), createCourse);

export default router;
