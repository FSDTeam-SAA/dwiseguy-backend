import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware';
import { createExercise } from './exercise.controller';
import { upload } from '../../middlewares/multer.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { createExerciseSchema } from './exercise.validation';

const router = express.Router();

router.post('/create-exercise', upload.single('image'), validateRequest(createExerciseSchema), createExercise);

export const exerciseRouter = router;
