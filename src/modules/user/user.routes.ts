import express from 'express';
import { createUser, getUsers, loginUser } from './user.controller';
import { upload } from '../../middlewares/multer.middleware';
import { createUserSchema, loginUserSchema } from './user.validation';
import { validateRequest } from '../../middlewares/validateRequest/validateRequest.middleware';

const router = express.Router();

router.post('/registration', validateRequest(createUserSchema), createUser);
router.post('/login', validateRequest(loginUserSchema), loginUser);

router.get('/', getUsers);

export default router;
