import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { authenticateUser } from "../middlewares/authMiddleware"
import multer from 'multer';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/user/all', profileController.getAllUsers)
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
router.post('/:username/follow', authenticateUser, profileController.follow);
router.delete('/:username/follow', authenticateUser, profileController.unfollow);
router.get('/:username/stats', profileController.getStats);
router.get('/:username/followers', profileController.getFollowersList);
router.get('/:username/following', profileController.getFollowingList);
router.get('/:username/is-following', authenticateUser, profileController.checkIsFollowing);

export default router;