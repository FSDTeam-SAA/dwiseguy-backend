import express from 'express';
import { createUser, getUsers } from './user.controller';
import { upload } from '../../middlewares/multer.middleware';
import { createUserSchema } from './user.validation';
import { validateRequest } from '../../middlewares/validateRequest.middleware';

const router = express.Router();

router.post('/registration', validateRequest(createUserSchema), createUser);
router.get('/', getUsers);

export default router;