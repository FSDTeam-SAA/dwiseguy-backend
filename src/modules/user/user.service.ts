import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { User } from './user.model';
import jwt from 'jsonwebtoken';
import config from '../../config/config';

// Find user using case-insensitive regex
const findUserByEmail = async (email: string) => {
      return await User.findOne({
            email: { $regex: `^${email}$`, $options: 'i' },
      }).select('+password +password_reset_Otp +password_reset_Otp_expires');
};

const saveOtpToDb = async (email: string, otp: string, expires: Date) => {
      return await User.findOneAndUpdate(
            { email: { $regex: `^${email}$`, $options: 'i' } },
            {
                  password_reset_Otp: otp,
                  password_reset_otp_expires: expires,
            },
            { new: true }
      );
};

const updatePassword = async (email: string, newPassword: string) => {
      const user = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
      if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
      if (!user.password_reset_token)
            throw new AppError(StatusCodes.BAD_REQUEST, 'You are not requested to reset your password');

      user.password = newPassword;
      user.password_reset_token = '';
      await user.save();
};

const findUserByRefreshToken = async (refreshToken: string) => {
      // check refress token is expired
      const decoded = jwt.verify(refreshToken, config.tokens.refresh.secret as string) as jwt.JwtPayload;

      if (decoded.exp && decoded.exp < Date.now() / 1000) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Token is expired or invalid, please login again');
      }

      return await User.findOne({ refreshToken });
};

//generate password reset token
const generatePasswordResetToken = async (user: any) => {
      const token = jwt.sign({ _id: user._id, email: user.email }, config.tokens.password.secret as string, {
            expiresIn: config.tokens.password.expiresIn as any,
      });
      if (!token) throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to generate password reset token');
      return token;
};

const decodeResetToken = (token: string) => {
      if (!token) throw new AppError(StatusCodes.UNAUTHORIZED, 'Reset token not found');

      const decoded = jwt.verify(token, config.tokens.password.secret as string) as jwt.JwtPayload;

      if (decoded.exp && decoded.exp < Date.now() / 1000) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Token is expired or invalid, please login again');
      }

      return decoded;
};

export const userService = {
      findUserByEmail,
      saveOtpToDb,
      updatePassword,
      findUserByRefreshToken,
      generatePasswordResetToken,
      decodeResetToken,
};
