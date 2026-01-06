
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import httpStatus from 'http-status-codes';
import AppError from '../errors/AppError';
import { User } from '../modules/user/user.model';
import config from '../config/config';

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) throw new AppError(httpStatus.NOT_FOUND, 'Token not found');

      try {
            const decoded = (await jwt.verify(token, config.tokens.access.secret!)) as JwtPayload;
            
            const user = await User.findById(decoded._id);
            if (user) {
                  req.user = {
                        _id: user._id,
                        email: user.email,
                        role: user.role,
                  };
            }
            next();
      } catch (err) {
            throw new AppError(401, 'Invalid token');
      }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
      if (req.user?.role !== 'admin') {
            throw new AppError(403, 'Access denied. You are not an admin.');
      }
      next();
};
