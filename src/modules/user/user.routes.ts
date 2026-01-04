import express from 'express';
import { forgotPassword, verifyOtp, resetPassword, createUser} from './user.controller';

import { createUserSchema, loginUserSchema } from './user.validation';
import { validateRequest } from '../../middlewares/validateRequest.middleware';

const router = express.Router();


router.post('/registration', validateRequest(createUserSchema), createUser);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);


// router.get('/', getUsers);

export default router;