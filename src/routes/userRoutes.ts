import { Router } from 'express';
import * as userController from '../controllers/userController';


const router = Router();

router.get("/last-registration", userController.GetLastRegistration);

export default router;