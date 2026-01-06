import express from 'express';
import {
      createUser,
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
import { createUserSchema, loginUserSchema, updatePasswordSchema } from './user.validation';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { upload } from '../../middlewares/multer.middleware';
import { authGuard, isAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

router.post('/registration', validateRequest(createUserSchema), createUser);
router.post('/login', validateRequest(loginUserSchema), loginUser);
router.get('/get-my-profile', authGuard, getMyProfile);
router.get('/get-single-user/:id', authGuard, isAdmin, getSingleUser);
router.get('/get-all-users', authGuard, isAdmin, getAllUsers);
router.patch('/update-user', authGuard, upload.single('image'), updateUser);
router.patch('/update-password', authGuard, validateRequest(updatePasswordSchema), updatePassword);
router.post('/log-out', logoutUser);
router.post('/regenerate-access-token', createAccessToken);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', upload.none(), resetPassword);


export default router;
