import { Response } from 'express';

// 1. ADD THE TYPE HERE
export type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: T;
};

// 2. USE THE TYPE IN THE FUNCTION
const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message || null,
    meta: data.meta || null, // This sends the pagination info to the Admin Panel
    data: data.data,
  });
};

export default sendResponse;