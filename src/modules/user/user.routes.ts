import express from 'express';
import { createUser, forgotPassword, loginUser, resetPassword, verifyOtp } from './user.controller';
import { createUserSchema, loginUserSchema } from './user.validation';
import { validateRequest } from '../../middlewares/validateRequest/validateRequest.middleware';


const router = express.Router();


router.post('/registration', validateRequest(createUserSchema), createUser);
router.post('/login', validateRequest(loginUserSchema), loginUser);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// test


export default router;