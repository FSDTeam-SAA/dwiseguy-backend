import express from 'express';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';
import {
      createExercise,
      getExerciseById,
      getAllExercises,
      updateExerciseById,
      deleteExerciseById,
} from './exercise.controller';
import { upload } from '../../middlewares/multer.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { createExerciseSchema } from './exercise.validation';

const router = express.Router();

router.post(
      '/create-exercise',
      authGuard,
      isAdmin,
      upload.single('image'),
      validateRequest(createExerciseSchema),
      createExercise
);
router.get('/get-all-exercises', getAllExercises);
router.get('/get-single-exercise/:exerciseId', getExerciseById);
router.patch(
      '/update-exercise/:exerciseId',
      authGuard,
      isAdmin,
      upload.single('image'),
      validateRequest(createExerciseSchema),
      updateExerciseById
);

router.delete('/delete-exercise/:exerciseId', authGuard, isAdmin, deleteExerciseById);

export const exerciseRouter = router;
