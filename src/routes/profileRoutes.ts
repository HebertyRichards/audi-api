import { Router } from 'express';
import * as profileController from '../controllers/profileController';


const router = Router();

router.get('/:id', profileController.getProfile);
router.put('/update', profileController.updateUserProfile);

export default router;