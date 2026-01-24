
import express from 'express';
import { contactusController } from './contact.controller';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { contactValidationSchema } from './contact.validation';
import rateLimit from 'express-rate-limit';

const router = express.Router();



const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 contact requests per hour
    message: "Too many contact requests from this IP, please try again after an hour"
});

router.post('/contact-us', contactLimiter,validateRequest(contactValidationSchema), contactusController.createContactUs);

export const contactusRoutes = router;