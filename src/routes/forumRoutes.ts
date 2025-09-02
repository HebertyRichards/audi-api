import { Router } from 'express';
import * as forumController from '../controllers/forumController';


const router = Router();


router.get('/posts/recent', forumController.getRecentPosts);
router.get('/stats', forumController.getForumStats);

export default router;