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
      '/create-instrument',
      authGuard,
      isAdmin,
      upload.single('image'),
      validateRequest(createInstrumentSchema),
      createInstrument
);

router.get('/get-single-instrument/:id', getSingleInstrument);
router.get('/get-all-instruments', getAllInstruments);
router.patch(
      '/update-instrument/:id',
      authGuard,
      isAdmin,
      upload.single('image'),
      validateRequest(updateInstrumentSchema),
      updateInstrument
);
router.delete('/delete-instrument/:id', authGuard, isAdmin, deleteInstrument);
export default router;
