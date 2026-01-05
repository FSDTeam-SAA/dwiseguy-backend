import { Router } from 'express';
import userRoutes from '../modules/user/user.routes';
import courseRoutes from '../modules/course/course.routes';
<<<<<<< HEAD
import quizRoutes from '../modules/quiz/quiz.route';
import quizAttemptRoutes from '../modules/quiz/quizAttempt.route';
=======
>>>>>>> daf9a9a2ba4fdcf4ae17e70aaa7596e96422c6bf
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
<<<<<<< HEAD
            path: '/quiz',
            route: quizRoutes,
      },
      {
            path: '/quiz/student',
            route: quizAttemptRoutes,
      },
=======
            path: '/admin/lesson',
            route: lessonRouter,
      },
      {
    path: '/admin/sublesson',
    route: subLessonRouter,
  },
  {
    path: '/user/progress',
    route: progressRouter,
  },
>>>>>>> daf9a9a2ba4fdcf4ae17e70aaa7596e96422c6bf
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
