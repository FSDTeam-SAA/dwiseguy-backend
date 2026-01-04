import { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { User } from './user.model';
import { uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
      try {
            res.json({ message: 'Get all users' });
      } catch (err) {
            next(err);
      }
};


export const createUser = catchAsync(async (req: Request, res: Response) => {
      const value = req.body;

      const user = (await User.create(value)).save();
      if (!user as any) throw new AppError(400, 'User registration failed');

      sendResponse(res, { statusCode: 201, success: true, message: 'User created successfully', data: user });
});


