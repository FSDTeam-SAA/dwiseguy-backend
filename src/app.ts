import express from 'express';
import { globalErrorHandler } from './middlewares/globalErrorHandler';
import { notFound } from './middlewares/notFound';
import router from './routes';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      credentials: true,
};


app.use(cors(corsOptions));

app.use('/api/v1', router);

app.use(notFound as never);
app.use(globalErrorHandler);

export default app;
