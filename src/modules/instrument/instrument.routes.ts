import express from 'express';
import { upload } from '../../middlewares/multer.middleware';

import {
      createInstrument,
      getSingleInstrument,
      getAllInstruments,
      updateInstrument,
      deleteInstrument,
} from './instrument.controller';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';
import { createInstrumentSchema, updateInstrumentSchema } from './instrument.validation';

const router = express.Router();

router.post(
      '/create-course',
      authGuard,
      isAdmin,
      upload.single('image'),
      validateRequest(createInstrumentSchema),
      createInstrument
);

router.get('/get-single-course/:id', getSingleInstrument);
router.get('/get-all-courses', getSingleInstrument);
router.patch(
      '/update-course/:id',
      authGuard,
      isAdmin,
      upload.single('image'),
      validateRequest(updateInstrumentSchema),
      updateInstrument
);
router.delete('/delete-course/:id', authGuard, isAdmin, deleteInstrument);
export default router;
