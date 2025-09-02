import { Request, Response, NextFunction } from "express";
import * as statisticService from "../services/statisticService"
import { handleControllerError } from '../middlewares/Errors';

export async function getUserStatsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.params;
    const stats = await statisticService.getUserStats(username);
    res.status(200).json(stats);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function getTopicsByAuthorController(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.params;
    const topics = await statisticService.getTopicsByAuthor(username);
    res.status(200).json(topics);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}