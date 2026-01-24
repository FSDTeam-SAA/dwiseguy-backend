import express from 'express';
import { globalErrorHandler } from './middlewares/globalErrorHandler';
import { notFound } from './middlewares/notFound';
import router from './routes';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { serverTemplate } from './utils/serverliveTemplate';
import morgan from 'morgan';

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.get('/', serverTemplate);

app.use('/api/v1', router);

app.use(notFound as never);
app.use(globalErrorHandler);

export default app;
