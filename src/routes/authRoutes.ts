import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as profileController from '../controllers/profileController';
import { authenticateUser } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.put('/change-password',authController.changePassword)
router.post('/forgot-password', authController.sendRecoveryEmail)
router.get('/session', authenticateUser, authController.getSession);
router.patch('/update-profile', authenticateUser, authController.changeEmail, profileController.updateUserProfile);
router.patch('/reset-password',authenticateUser,authController.changePassword)
router.delete('/delete-account',authenticateUser,authController.deleteAccount)

export default router;
