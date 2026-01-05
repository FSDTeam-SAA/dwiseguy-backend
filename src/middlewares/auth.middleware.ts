// import { NextFunction, Request, Response } from 'express';
// import jwt, { JwtPayload } from 'jsonwebtoken';
// import httpStatus from 'http-status';
// import AppError from '../errors/AppError';
// import { User } from '../modules/user/user.model';

// export const protect = async (req: Request, res: Response, next: NextFunction) => {
//       const token = req.headers.authorization?.split(' ')[1];
//       if (!token) throw new AppError(httpStatus.NOT_FOUND, 'Token not found');

//       try {
//             const decoded = (await jwt.verify(token, process.env.JWT_ACCESS_SECRET!)) as JwtPayload;
//             // console.log(decoded)
//             const user = await User.findById(decoded._id);
//             if (user && (await User.isOTPVerified(user._id))) {
//                   req.user = user;
//             }
//             next();
//       } catch (err) {
//             throw new AppError(401, 'Invalid token');
//       }
// };

// export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
//       if (req.user?.role !== 'admin') {
//             throw new AppError(403, 'Access denied. You are not an admin.');
//       }
//       next();
// };

// export const isDriver = (req: Request, res: Response, next: NextFunction): void => {
//       if (req.user?.role !== 'driver') {
//             throw new AppError(403, 'Access denied. You are not an driver.');
//       }
//       next();
// };









































































import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import httpStatus from 'http-status-codes';
import AppError from '../errors/AppError';
import { User } from '../modules/user/user.model';
import catchAsync from '../utils/catchAsync';

export const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication token is missing');
    }

    // 1. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    
    // 2. Find User
    const user = await User.findById(decoded._id);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User associated with this token no longer exists');
    }

    // 3. Check Role (Scalable RBAC)
    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new AppError(
        httpStatus.FORBIDDEN, 
        `Access denied. Required role: ${requiredRoles.join(' or ')}`
      );
    }

    req.user = user;
    next();
  });
};