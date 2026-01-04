import express from 'express';
import { upload } from '../../middlewares/multer.middleware';

import { createCourse } from './course.controller';
import { createCourseSchema } from './course.validation';
import { validateRequest } from '../../middlewares/validateRequest/validateRequest.middleware';

const router = express.Router();

router.post('/create-course', validateRequest(createCourseSchema), createCourse);

export default router;
