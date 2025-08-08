import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { authenticateUser } from "../middlewares/authMiddleware"


const router = Router();

router.get('/:id', profileController.getProfile);
router.put('/update', authenticateUser, profileController.updateUserProfile);
router.delete('/:id', profileController.deleteUserProfile);
router.get('/user/:username', profileController.getUserProfile);

export default router;