import { Router } from 'express';
import userRoutes from '../modules/user/user.routes';
import courseRoutes from '../modules/instrument/instrument.routes';
import quizRoutes from '../modules/quiz/quiz.route';
import quizAttemptRoutes from '../modules/quiz/quizAttempt.route';

import { progressRouter } from '../modules/progress/progress.route';
import moduleRouter from '../modules/module/module.route';
import { lessonRouter } from '../modules/lesson/lesson.route';
const router = Router();

const moduleRoutes = [
      {
            path: '/auth',
            route: userRoutes,
      },
      {
            path: '/course',
            route: courseRoutes,
      },
      {
            path: '/quiz',
            route: quizRoutes,
      },
      {
            path: '/quiz/student',
            route: quizAttemptRoutes,
      },
      {
            path: '/module',
            route: moduleRouter
      },
      {
            path: '/lesson',
            route: lessonRouter,
      },
      {
            path: '/user/progress',
            route: progressRouter,
      },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
