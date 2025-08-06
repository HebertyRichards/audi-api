import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.put('/change-password',authController.changePassword)
router.post('/forgot-password', authController.sendRecoveryEmail)
router.get('/session', authController.getSession);

export default router;
