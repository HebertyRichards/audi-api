import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { authenticateUser } from "../middlewares/authMiddleware"
import multer from 'multer';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/:id', profileController.getProfile);
router.put('/update', authenticateUser, profileController.updateUserProfile);
router.get('/user/:username', profileController.getUserProfile);
router.patch(
    '/user/avatar',
    authenticateUser,
    upload.single('avatar'), 
    profileController.updateAvatarProfile
  );
router.delete(
    '/user/avatar',
    authenticateUser,
    profileController.deleteAvatarProfile 
);

export default router;