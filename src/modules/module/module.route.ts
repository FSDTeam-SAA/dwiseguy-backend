import express from 'express';
import { moduleController } from './module.controller';
import { upload } from '../../middlewares/multer.middleware';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// ADMIN ROUTES: Create Module
router.post(
  '/create-module',
  authGuard,
  isAdmin,
  upload.fields([
    { name: 'images', maxCount: 5 }
  ]),
  moduleController.createModule
);

// ADMIN ROUTES: Update/Delete Module
router.patch(
  '/update/:id', 
  authGuard,
  isAdmin, 
  moduleController.updateModule
);

router.delete(
  '/delete/:id', 
  authGuard,
  isAdmin, 
  moduleController.deleteModule
);

// User Control

router.get(
  '/get-modules/:instrumentId',
  authGuard,
  moduleController.getModulesByInstrument
)

router.get(
  '/get-single-module/:moduleId', 
  authGuard, 
  moduleController.getSingleModule
);


const moduleRouter = router;
export default moduleRouter;