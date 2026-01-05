import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { userService } from './user.service';
import { mailer } from '../../utils/sendEmail';
import { forgetPasswordOtpTemplate } from '../../utils/email.templates';
import AppError from '../../errors/AppError';
import { User } from './user.model';
import { TLoginUser } from './user.interface';
import { title } from 'node:process';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';

// @desc    Create user
export const createUser = catchAsync(async (req: Request, res: Response) => {
      const value = req.body;

      const user = (await User.create(value)).save();
      if (!user as any) throw new AppError(400, 'User registration failed');

      sendResponse(res, { statusCode: 201, success: true, message: 'User created successfully', data: user });
});

// @desc    login user
export const loginUser = catchAsync(async (req: Request, res: Response) => {
      const value: TLoginUser = req.body;

      const user = await User.findOne({ email: value.email }).select('+password');
      if (!user) throw new AppError(400, 'User not found email or password is incorrect');

      //check password match
      const isPasswordMatch = await User.isPasswordMatched(value.password, (user as any).password);
      if (!isPasswordMatch) throw new AppError(400, 'User not found email or password is incorrect');

      //generate tokens
      const accessToken = User.generateAccessToken(user);
      const refreshToken = User.generateRefreshToken(user);

      //update refresh token in database
      user.refreshToken = refreshToken;
      await user.save();

      //save refresh token to cookie
      res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
      });

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'User logged in successfully',
            data: {
                  id: user._id,
                  email: user.email,
                  accessToken: accessToken,
                  refreshToken: refreshToken,
            },
      });
});

//@desc het my profile
export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
      const id = req.user?._id;
      const user = await User.findById(id).select(
            '-password -password_reset_Otp -password_reset_otp_expires -password_reset_token -refreshToken'
      );
      if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'User details fetched successfully',
            data: user,
      });
});

//get single user details
export const getSingleUser = catchAsync(async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const user = await User.findById(id).select(
            '-password -refreshToken -password_reset_Otp -password_reset_Otp_expires -password_reset_token'
      );
      if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'User details fetched successfully',
            data: user,
      });
});

//@desc get all users
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
      const users = await User.find().select(
            '-password -password_reset_Otp -password_reset_otp_expires -password_reset_token -refreshToken'
      );
      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Users fetched successfully',
            data: users,
      });
});

//@desc   update userdetails
export const updateUser = catchAsync(async (req: Request, res: Response) => {
      const id = req.user?._id;

      const value: {
            name: string;
            age: number;
      } = req.body;
      const image = req.file;

      const user = await User.findByIdAndUpdate(id, value, { new: true });
      if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

      if (image) {
            if (user.avatar?.public_id) {
                  //delete previous image from cloudinary
                  await deleteFromCloudinary(user.avatar?.public_id as string, 'image');
            }
            //update image into cloudinary
            const imageAsset = await uploadToCloudinary(image?.path);
            if (imageAsset) {
                  user.avatar = {
                        public_id: imageAsset.public_id,
                        url: imageAsset.url,
                  };
            }
            await user.save();
      }

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'User updated successfully',
            data: user,
      });
});

//update password
export const updatePassword = catchAsync(async (req: Request, res: Response) => {
      const id = req.user?._id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword)
            throw new AppError(StatusCodes.BAD_REQUEST, 'Old password and new password are required');

      if (oldPassword === newPassword)
            throw new AppError(StatusCodes.BAD_REQUEST, 'Old password and new password cannot be same');

      const user = await User.findById(id).select('+password');
      if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

      //compare old password
      const isPasswordMatch = await User.isPasswordMatched(oldPassword, user.password as string);
      if (!isPasswordMatch) throw new AppError(StatusCodes.BAD_REQUEST, 'Old password is incorrect');

      //update password
      user.password = newPassword;
      await user.save();
      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Password updated successfully',
            data: {
                  id: user._id,
                  email: user.email,
                  role: user.role,
            },
      });
});

//@desc    forgot password
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
      const { email } = req.body;
      if (!email) throw new AppError(StatusCodes.BAD_REQUEST, 'Email is required');

      const user = await userService.findUserByEmail(email);
      if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      // CRITICAL: Save to DB
      await userService.saveOtpToDb(email, otp, expires);
      await mailer({
            subject: 'Password Reset OTP',
            template: forgetPasswordOtpTemplate(user.name, otp, title), // Provide the required arguments
            email: email,
      });

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'OTP sent to email',
            data: {
                  resetEmail: email,
            },
      });
});

//@desc    verify otp
export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
      const { otp, resetEmail: email } = req.body;

      if (!email) throw new AppError(StatusCodes.BAD_REQUEST, 'Session expired. Enter email again.');
      if (!otp) throw new AppError(StatusCodes.BAD_REQUEST, 'OTP is required');

      const user = await userService.findUserByEmail(email);

      if (!user || user.password_reset_Otp !== otp) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
      }

      if (user.password_reset_otp_expires && user.password_reset_otp_expires < new Date()) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'OTP expired');
      }

      const passwordResetToken = await userService.generatePasswordResetToken(user);

      //update password reset token in database
      user.password_reset_token = passwordResetToken;

      //clear field in database
      user.password_reset_Otp = null;
      user.password_reset_otp_expires = null;

      await user.save();

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'OTP verified successfully',
            data: {
                  resetToken: passwordResetToken,
            },
      });
});

//@desc    reset password
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
      const { newPassword, confirmPassword, resetToken } = req.body;

      const token = userService.decodeResetToken(resetToken);
      if (newPassword !== confirmPassword) throw new AppError(400, 'Passwords do not match');

      await userService.updatePassword(token.email, newPassword);

      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Password reset successful',
      });
});

//@desc    logout user
export const logoutUser = catchAsync(async (req: Request, res: Response) => {
      res.clearCookie('refreshToken', {
            secure: true,
            sameSite: 'none',
      });
      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'User logged out successfully',
      });
});

//@desc    create access token from refresh token
export const createAccessToken = catchAsync(async (req: Request, res: Response) => {
      const refreshToken = (req.cookies?.refreshToken as string) || req.headers?.authorization?.split(' ')[1];
      if (!refreshToken) throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not logged in');

      // check refress token is expired
      // const decoded = (await jwt.verify(refreshToken, config.tokens.refresh.secret)) as JwtPayload;

      const user = await userService.findUserByRefreshToken(refreshToken);
      if (!user) throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');

      const accessToken = User.generateAccessToken(user);
      sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Access token created successfully',
            data: {
                  accessToken: accessToken,
            },
      });
});
