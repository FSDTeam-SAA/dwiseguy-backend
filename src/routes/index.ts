import { Router } from 'express';
import userRoutes from '../modules/user/user.routes';
import courseRoutes from '../modules/course/course.routes';
import lessonRouter from '../modules/lesson/lesson.route';
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
            path: '/admin/lesson',
            route: lessonRouter,
      }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
