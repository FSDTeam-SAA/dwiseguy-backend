import express from 'express';
import {
      createUser,
      createBulkUsers,
      forgotPassword,
      loginUser,
      resetPassword,
      verifyOtp,
      logoutUser,
      createAccessToken,
      updateUser,
      updatePassword,
      getSingleUser,
      getMyProfile,
      getAllUsers,
} from './user.controller';
import { createUserSchema, loginUserSchema, resetPasswordSchema, updatePasswordSchema } from './user.validation';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { upload } from '../../middlewares/multer.middleware';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';
import { rateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = express.Router();

router.post('/registration', validateRequest(createUserSchema), createUser);
router.post('/registration-bulk-users', authGuard, isAdmin, createBulkUsers);
router.post('/login', rateLimiter(1, 3), validateRequest(loginUserSchema), loginUser);
router.get('/get-my-profile', authGuard, getMyProfile);
router.get('/get-single-user/:userId', authGuard, isAdmin, getSingleUser);
router.get('/get-all-users', authGuard, isAdmin, getAllUsers);
router.patch('/update-user', authGuard, upload.single('image'), updateUser);
router.patch('/update-password', authGuard, validateRequest(updatePasswordSchema), updatePassword);
router.post('/log-out', logoutUser);
router.post('/regenerate-access-token', createAccessToken);
router.post('/forgot-password', rateLimiter(1, 3), forgotPassword);
router.post('/verify-otp', rateLimiter(1, 3), verifyOtp);
router.post('/reset-password', rateLimiter(1, 3), upload.none(), validateRequest(resetPasswordSchema), resetPassword);

export default router;
