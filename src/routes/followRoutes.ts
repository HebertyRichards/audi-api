import { Router } from 'express';
import * as followController from '../controllers/followController';
import { authenticateUser } from "../middlewares/authMiddleware"


const router = Router();

router.post('/:username/follow', authenticateUser, followController.follow);
router.delete('/:username/follow', authenticateUser, followController.unfollow);
router.get('/:username/stats', followController.getStats);
router.get('/:username/followers', followController.getFollowersList);
router.get('/:username/following', followController.getFollowingList);
router.get('/:username/is-following', authenticateUser, followController.checkIsFollowing);
router.delete('/followers/:username', authenticateUser, followController.handleRemoveFollower );

export default router;