import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { userService } from './user.service';
import { mailer } from '../../utils/sendEmail';
import { forgetPasswordOtpTemplate } from '../../utils/email.templates';
import AppError from '../../errors/AppError';
import { User } from './user.model';


export const createUser = catchAsync(async (req: Request, res: Response) => {
      const value = req.body;

      const user = (await User.create(value)).save();
      if (!user as any) throw new AppError(400, 'User registration failed');

      sendResponse(res, { statusCode: 201, success: true, message: 'User created successfully', data: user });
});

// @desc    login user


// 2. Verify OTP - Retrieves Email from Session
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw new AppError(StatusCodes.BAD_REQUEST, 'Email is required');

  const user = await userService.findUserByEmail(email);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  // Store email in session to avoid re-typing
  (req.session as any).resetEmail = email;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await userService.saveOtpToDb(email, otp, expires);

  await mailer({
    email: user.email,
    subject: 'Reset Password OTP',
    template: forgetPasswordOtpTemplate(user.name, otp)
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP sent to email',
  });
});

export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const email = (req.session as any).resetEmail;

  if (!email) throw new AppError(StatusCodes.BAD_REQUEST, 'Session expired. Please enter email again.');
  if (!otp) throw new AppError(StatusCodes.BAD_REQUEST, 'OTP is required');

  const user = await userService.findUserByEmail(email);

  if (!user || user.password_reset_Otp !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }

  const isExpired = user.password_reset_Otp_expires && new Date() > user.password_reset_Otp_expires;
  if (isExpired) throw new AppError(StatusCodes.BAD_REQUEST, 'OTP has expired');

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP verified successfully',
  });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { newPassword, confirmPassword } = req.body;
  const email = (req.session as any).resetEmail;

  if (!email) throw new AppError(StatusCodes.BAD_REQUEST, 'Session expired');
  if (!newPassword || !confirmPassword) throw new AppError(StatusCodes.BAD_REQUEST, 'Passwords are required');
  if (newPassword !== confirmPassword) throw new AppError(StatusCodes.BAD_REQUEST, 'Passwords do not match');

  await userService.updatePassword(email, newPassword);

  // Clean up session
  req.session.destroy((err) => {
    if (err) console.error("Session destroy error:", err);
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset successful',
  });
});