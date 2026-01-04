import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser, UserModel } from './user.interface';
import config from '../../config/config';
import { Secret, SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

const userSchema: Schema = new Schema<IUser>(
      {
            name: { type: String, required: true },
            email: { type: String, required: true,lowercase: true, unique: true },
            password: { type: String, select: 0, required: true },
            username: { type: String, required: true, unique: true },
            phone: { type: String },
            role: {
                  type: String,
                  default: 'user',
                  enum: ['user', 'admin'],
            },
            avatar: {
                  public_id: { type: String, default: '' },
                  url: { type: String, default: '' },
                  duration: { type: Number, default: null },
                  file_type: { type: String, default: '' },
            },
            verificationInfo: {
                  verified: { type: Boolean, default: false },
                  verificationOtp: { type: Number, default: null },
            },
            password_reset_Otp: { type: String, default: '' },
            password_reset_Otp_expires: { type: Date, default: null },
            refreshToken: { type: String, default: '' },
      },
      { timestamps: true }
);

// Pre save middleware / hook : will work on create() save()
userSchema.pre('save', async function (next) {
      const user = this as any;
      // Hash password
      if (user.isModified('password')) {
            const saltRounds = Number(config.bcrypt_salt_rounds) || 10;
            let pass = user.password;
            user.password = await bcrypt.hash(pass, saltRounds);
      }

      next();
});

userSchema.statics.isUserExistsByEmail = async function (email: string) {
      return await User.findOne({ email }).select('+password +secureFolderPin');
};

userSchema.statics.isOTPVerified = async function (id: string) {
      const user = await User.findById(id).select('+verificationInfo');
      return user?.verificationInfo.verified;
};

userSchema.statics.isPasswordMatched = async function (plainTextPassword: string, hashPassword: string) {
      return await bcrypt.compare(plainTextPassword, hashPassword);
};


export const User = mongoose.model<IUser, UserModel>('User', userSchema);
