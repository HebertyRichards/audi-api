import { Router } from 'express';
import * as profileController from '../controllers/profileController';


const router = Router();

router.get('/:id', profileController.getProfile);
router.put('/update', profileController.updateUserProfile);
router.delete('/:id', profileController.deleteUserProfile);
router.get('/user/:username', profileController.getUserProfile);

export default router;