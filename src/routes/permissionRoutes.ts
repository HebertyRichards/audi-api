import { Router } from 'express';
import * as permissionController from '../controllers/permissionController';
import { authenticateUser } from "../middlewares/authMiddleware"

const router = Router();

router.post("/topics/check-permission", authenticateUser, permissionController.checkTopicCreationPermission);
router.get("/comments/:topicId/check-permission", authenticateUser, permissionController.checkCommentCreationPermission );

export default router;