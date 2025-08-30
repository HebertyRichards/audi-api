
import { Request, Response, NextFunction } from 'express';
import * as forumService from '../services/forumService';
import { handleControllerError } from '../helpers/ErrorUtils';
export async function getForumStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await forumService.getForumStats();
      return res.status(200).json(stats);
    } catch (error: unknown) {
      handleControllerError(error, res, next);
    }
  }
  
  export async function getRecentPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await forumService.getRecentPosts();
      return res.status(200).json(posts);
    } catch (error: unknown) {
      handleControllerError(error, res, next);
    }
  }
  