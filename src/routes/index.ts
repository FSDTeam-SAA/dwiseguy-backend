import { Router } from 'express';
import userRoutes from '../modules/user/user.routes';
import courseRoutes from '../modules/course/course.routes';
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
