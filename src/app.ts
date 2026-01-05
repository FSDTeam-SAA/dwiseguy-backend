import express from 'express';
import { globalErrorHandler } from './middlewares/globalErrorHandler';
import { notFound } from './middlewares/notFound';
import router from './routes';
import cors from 'cors';
import session from 'express-session';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      credentials: true,
};

// Add this before your routes
app.use(
      session({
            secret: 'piano_academy_secret_key',
            resave: false,
            saveUninitialized: false,
            cookie: {
                  secure: false, // set to true if using https
                  httpOnly: true,
                  maxAge: 600000, // 10 minutes
            },
      })
);

app.use(cors(corsOptions));

app.use('/api/v1', router);

app.use(notFound as never);
app.use(globalErrorHandler);

export default app;
