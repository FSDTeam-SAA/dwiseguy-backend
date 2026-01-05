import { Router } from 'express';
import userRoutes from '../modules/user/user.routes';
import courseRoutes from '../modules/course/course.routes';
import quizRoutes from '../modules/quiz/quiz.route';
import quizAttemptRoutes from '../modules/quiz/quizAttempt.route';
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
