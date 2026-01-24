import express from 'express';
import { globalErrorHandler } from './middlewares/globalErrorHandler';
import { notFound } from './middlewares/notFound';
import router from './routes';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { serverTemplate } from './utils/serverliveTemplate';
import morgan from 'morgan';
import config from './config/config';

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
      cors({
            origin: ['http://localhost:3000', `${config.frontendUrl}`],
            methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
            credentials: true,
      })
);
app.use(cookieParser());
app.get('/', serverTemplate);

app.use('/api/v1', router);

app.use(notFound as never);
app.use(globalErrorHandler);

export default app;
