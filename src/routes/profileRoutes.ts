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
router.delete(
    '/user/avatar',
    authenticateUser,
    profileController.deleteAvatarProfile 
);
router.post('/:id/follow', authenticateUser, profileController.follow);
router.delete('/:id/follow', authenticateUser, profileController.unfollow);
router.get('/:id/stats', profileController.getStats);
router.get('/:id/followers', profileController.getFollowersList);
router.get('/:id/following', profileController.getFollowingList);

export default router;