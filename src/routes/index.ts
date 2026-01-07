import { Router } from 'express';
import userRoutes from '../modules/user/user.routes';
import courseRoutes from '../modules/course/course.routes';
import quizRoutes from '../modules/quiz/quiz.route';
import quizAttemptRoutes from '../modules/quizAttempt/quizAttempt.route';
import lessonRouter from '../modules/lesson/lesson.route';
import { subLessonRouter } from '../modules/sublesson/sublesson.route';
import { progressRouter } from '../modules/progress/progress.route';
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
      { path: '/admin/lesson', route: lessonRouter },
      {
            path: '/admin/sublesson',
            route: subLessonRouter,
      },
      {
            path: '/user/progress',
            route: progressRouter,
      },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
