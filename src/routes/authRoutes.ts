import { Router } from 'express';
import * as authController from '../controllers/authController';
import cookieParser from 'cookie-parser';

const router = Router();
router.use(cookieParser())

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/session', authController.getSession);

export default router;
