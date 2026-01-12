import { Document, Model } from 'mongoose';

export interface IUser extends Document {
      _id: string;
      name: string;
      email: string;
      password?: string;
      username: string;
      age: number | null;
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
      instruments: [
            {
                  instrumentId: string;
                  instrumentName: string;
                  modules: [
                        {
                              moduleId: string;
                              moduleTitle: string;
                              lessons: [
                                    {
                                          lessonId: string;
                                          lessonTitle: string;
                                          isCompleted: boolean;
                                          QuizPerformance: [
                                                {
                                                      quizId: string;
                                                      quizTitle: string;
                                                      quizResult: number;
                                                },
                                          ];
                                    },
                              ];
                        },
                  ];
            },
      ];
      password_reset_Otp: number | null;
      password_reset_otp_expires: Date | null;
      password_reset_token: string;
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
