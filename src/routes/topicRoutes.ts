import { Router } from 'express';
import * as topicController from '../controllers/topicController';
import { authenticateUser } from '../middlewares/authMiddleware';

const router = Router();

router.post('/topics', authenticateUser, topicController.createTopic);
router.post('/topics/:topicId/comments', authenticateUser, topicController.createComment);
router.get('/topics/:id', topicController.getTopic);

export default router;
