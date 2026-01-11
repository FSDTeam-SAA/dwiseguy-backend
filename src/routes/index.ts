import { Router } from 'express';
import userRoutes from '../modules/user/user.routes';
import instrumentRoutes from '../modules/instrument/instrument.routes';
import quizRoutes from '../modules/quiz/quiz.route';
import quizAttemptRoutes from '../modules/quizAttempt/quizAttempt.route';
import { progressRouter } from '../modules/progress/progress.route';
import moduleRouter from '../modules/module/module.route';
import { lessonRouter } from '../modules/lesson/lesson.route';
import { exerciseRouter } from '../modules/exercise/exercise.route';
import { exerciseContentRouter } from '../modules/exerciseContent/exerciseContent.route';
const router = Router();

const moduleRoutes = [
      {
            path: '/auth',
            route: userRoutes,
      },
      {
            path: '/instrument',
            route: instrumentRoutes,
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
            route: moduleRouter,
      },
      {
            path: '/lesson',
            route: lessonRouter,
      },
      {
            path: '/progress',
            route: progressRouter,
      },
      {
            path: '/exercise',
            route: exerciseRouter,
      },
      {
            path: '/exercise-content',
            route: exerciseContentRouter,
      },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
