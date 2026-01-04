import { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';
import { TLoginUser } from './user.interface';
import { User } from './user.model';

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

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
      try {
            res.json({ message: 'Get all users' });
      } catch (err) {
            next(err);
      }
};
