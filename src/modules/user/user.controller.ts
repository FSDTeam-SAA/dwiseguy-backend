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
            },
      });
});


export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw new AppError(StatusCodes.BAD_REQUEST, 'Email is required');

  const user = await userService.findUserByEmail(email);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  // STORE EMAIL IN SESSION
  (req.session as any).resetEmail = email;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  // CRITICAL: Save to DB
  await userService.saveOtpToDb(email, otp, expires);

//   const emailTemplate = forgetPasswordOtpTemplate(
//     user.name, 
//     otp, 
//     'Reset Your Piano Academy Password'
//   );
  // Send Email Logic... (mailer function)
  await mailer({
  subject: 'Password Reset OTP',
  template: forgetPasswordOtpTemplate(user.name, otp, title), // Provide the required arguments
  email: email,
});
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP sent to email',
  });
});

export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const email = (req.session as any).resetEmail; // Get from session

  if (!email) throw new AppError(StatusCodes.BAD_REQUEST, 'Session expired. Enter email again.');
  if (!otp) throw new AppError(StatusCodes.BAD_REQUEST, 'OTP is required');

  const user = await userService.findUserByEmail(email);

  if (!user || user.password_reset_Otp !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }

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
  if (newPassword !== confirmPassword) throw new AppError(400, 'Passwords do not match');

  await userService.updatePassword(email, newPassword);

  req.session.destroy(() => {}); // Clear session on success

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset successful',
  });
});