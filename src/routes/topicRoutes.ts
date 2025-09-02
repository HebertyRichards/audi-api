import { Router } from 'express';
import * as topicController from '../controllers/topicController';
import { authenticateUser } from '../middlewares/authMiddleware';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.get('/topics/:id', topicController.getTopic);
router.get('/topics/slug/:slug', topicController.getTopicBySlug);
router.post('/topics', authenticateUser, upload.array('files', 5), topicController.createTopic);
router.post('/topics/:topicId/comments', authenticateUser, upload.array('files', 5), topicController.createComment);
router.delete('/topics/:id', authenticateUser, topicController.deleteTopic);
router.patch('/topics/:id', authenticateUser, topicController.updateTopic);
router.delete('/comments/:id', authenticateUser, topicController.deleteComment);
router.patch('/comments/:commentId', authenticateUser, topicController.updateCommentController);

export default router;
