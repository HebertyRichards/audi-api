import { Router } from "express";
import * as statiscController from "../controllers/statisticController"

const router = Router();

router.get("/profile/:username/stats", statiscController.getUserStatsController);
router.get("/profile/:username/topics", statiscController.getTopicsByAuthorController);

export default router;
