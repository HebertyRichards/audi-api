import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';

const router = Router();

router.get('/', categoryController.getAllCategories);
router.get('/topics/category/:category', categoryController.getTopicsByCategory);

export default router;