import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { authenticateUser } from "../middlewares/authMiddleware"
import multer from 'multer';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/user/all', profileController.getAllUsers)
router.get('/:id', profileController.getProfile);
router.put('/update', authenticateUser, profileController.updateUserProfile);
router.delete('/:id',authenticateUser, profileController.deleteUserProfile);
router.get('/user/:username', profileController.getUserProfile);
router.patch(
    '/user/avatar',
    authenticateUser,
    upload.single('avatar'), 
    profileController.updateAvatarProfile
  );

export default router;