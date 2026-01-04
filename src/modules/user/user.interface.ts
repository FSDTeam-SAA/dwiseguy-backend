import { Document, Model } from 'mongoose';

export interface IUser extends Document {
      _id: string;
      name: string;
      email: string;
      password?: string;
      username: string;
      role: 'admin' | 'user';
      verificationInfo: {
            verified: boolean;
            verificationOtp: number;
      };
      phone: string;
      avatar?: {
            public_id: string;
            url: string;
            duration?: number;
            file_type?: string;
      };
      password_reset_Otp: string;
      password_reset_Otp_expires: Date;
      refreshToken: string;
}
export type TLoginUser = {
      email: string;
      password: string;
};
export interface UserModel extends Model<IUser> {
      isUserExistsByEmail(email: string): Promise<IUser>;
      isOTPVerified(id: string): Promise<boolean>;
      isPasswordMatched(plainTextPassword: string, hashPassword: string): Promise<boolean>;
      isJWTIssuedBeforePasswordChanged(passwordChangeTimeStamp: Date, JwtIssuedTimeStamp: number): boolean;
      generateAccessToken(user: IUser): string;
      generateRefreshToken(user: IUser): string;
}
