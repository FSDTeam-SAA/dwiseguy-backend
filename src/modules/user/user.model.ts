import mongoose, { Schema, Document, Model, Mongoose } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser, UserModel } from './user.interface';
import config from '../../config/config';
import { Secret, SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { ref } from 'node:process';

const passwordValidator = [
      {
            validator: function (value: string) {
                  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long',
      },
];

const userSchema: Schema = new Schema<IUser>(
      {
            name: { type: String, required: false, trim: true },
            email: { type: String, required: true, lowercase: true, unique: true },
            password: {
                  type: String,
                  select: 0,
                  required: true,
                  // validate: passwordValidator
            },
            username: { type: String, required: true, unique: true },
            age: { type: Number, default: null },
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
            instruments: [
                  {
                        instrumentId: { type: mongoose.Types.ObjectId, ref: 'Instrument' },
                        instrumentName: { type: String, default: '' },
                        modules: [
                              {
                                    moduleId: { type: mongoose.Types.ObjectId, ref: 'Module' },
                                    moduleTitle: { type: String, default: '' },
                                    lessons: [
                                          {
                                                lessonId: { type: mongoose.Types.ObjectId, ref: 'Lesson' },
                                                lessonTitle: { type: String, default: '' },
                                                isCompleted: { type: Boolean, default: false },
                                                quizPerformance: [
                                                      {
                                                            quizId: { type: mongoose.Types.ObjectId, ref: 'Quiz' },
                                                            quizTitle: { type: String, default: '' },
                                                            quizResult: { type: Number, default: 0 },
                                                      },
                                                ],
                                          },
                                    ],
                              },
                        ],
                  },
            ],
            isRememberMe: { type: Boolean, default: false },
            verificationInfo: {
                  verified: { type: Boolean, default: false },
                  verificationOtp: { type: Number, default: null },
            },
            password_reset_Otp: { type: Number, default: null },
            password_reset_token: { type: String, default: '' },
            password_reset_otp_expires: { type: Date, default: null },
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
      return await this.findOne({ email }).select('+password +secureFolderPin');
};

userSchema.statics.isOTPVerified = async function (id: string) {
      const user = await this.findById(id).select('+verificationInfo');
      return user?.verificationInfo?.verified;
};

userSchema.statics.isPasswordMatched = async function (plainTextPassword: string, hashPassword: string) {
      return await bcrypt.compare(plainTextPassword, hashPassword);
};

userSchema.statics.generateAccessToken = function (user: IUser) {
      const payload = { _id: user._id.toString(), email: user.email };
      const secret: Secret = config.tokens.access.secret as string;
      const options: SignOptions = { expiresIn: config.tokens.access.expiresIn as number };

      return jwt.sign(payload, secret, options);
};

userSchema.statics.generateRefreshToken = function (user: IUser) {
      const payload = { _id: user._id.toString() };
      const secret: Secret = config.tokens.refresh.secret as string;
      const options: SignOptions = {
            expiresIn: user.isRememberMe ? (config.tokens.refresh.expiresIn as number) : '3d',
      };

      return jwt.sign(payload, secret, options);
};

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
