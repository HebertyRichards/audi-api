import { Router } from 'express';
import * as topicController from '../controllers/topicController';
import { authenticateUser } from '../middlewares/authMiddleware';

const router = Router();

router.post('/topics', authenticateUser,topicController.createTopic);
router.post('/topics/:topicId/comments', authenticateUser, topicController.createComment);
router.get('/topics/:id', topicController.getTopic);
router.get('/topics/slug/:slug', topicController.getTopicBySlug);
router.delete('/topics/:id', authenticateUser, topicController.deleteTopic);
router.patch('/topics/:id', authenticateUser, topicController.updateTopic);
router.delete('/comments/:id', authenticateUser, topicController.deleteComment);
router.patch('/comments/:commentId', authenticateUser, topicController.updateCommentController);

export default router;
