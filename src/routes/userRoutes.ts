import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateUser } from "../middlewares/authMiddleware"

const router = Router();

router.get("/last-registration", userController.GetLastRegistration);
router.post("/ping", authenticateUser, userController.ping);
router.get("/online", userController.listOnlineUsers); 
router.get('/user/all', userController.getAllUsers)

export default router;