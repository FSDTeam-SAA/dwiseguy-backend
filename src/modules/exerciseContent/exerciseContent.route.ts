import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/multer.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { createExerciseContentSchema, updateExerciseContentSchema } from './exerciseContent.validation';
import { createExerciseContent, deleteExerciseContentById, getAllExerciseContent, getExerciseContentById, updateExerciseContentById,  } from './exerciseContent.controller';

const router = express.Router();

router.post(
      '/create-exercise-content',
      upload.fields([
            { name: 'image', maxCount: 1 },
            { name: 'audio', maxCount: 1 },
      ]),
      validateRequest(createExerciseContentSchema),
      createExerciseContent
);

router.get('/get-all-exercise-content', getAllExerciseContent);
router.get('/get-single-exercise-content/:exercisecontentId', getExerciseContentById);

router.patch(
      '/update-exercise-content/:exercisecontentId',
      
      upload.fields([
            { name: 'image', maxCount: 1 },
            { name: 'audio', maxCount: 1 },
      ]),
      validateRequest(updateExerciseContentSchema),
      updateExerciseContentById
);

router.delete('/delete-exercise-content/:exercisecontentId', deleteExerciseContentById);

export const exerciseContentRouter = router;
