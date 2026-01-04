import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { User } from './user.model';

// Find user using case-insensitive regex
const findUserByEmail = async (email: string) => {
  return await User.findOne({ 
    email: { $regex: `^${email}$`, $options: 'i' } 
  }).select('+password +password_reset_Otp +password_reset_Otp_expires');
};

const saveOtpToDb = async (email: string, otp: string, expires: Date) => {
  return await User.findOneAndUpdate(
    { email: { $regex: `^${email}$`, $options: 'i' } },
    { 
      password_reset_Otp: otp, 
      password_reset_Otp_expires: expires 
    },
    { new: true }
  );
};

const updatePassword = async (email: string, newPassword: string) => {
  const user = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  user.password = newPassword;
  user.password_reset_Otp = ''; 
  user.password_reset_Otp_expires = new Date();
  await user.save();
};

export const userService = {
  findUserByEmail,
  saveOtpToDb,
  updatePassword
};