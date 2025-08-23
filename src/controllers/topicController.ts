import { Request, Response, NextFunction } from 'express';
import * as topicService from '../services/topicService';
import { AuthenticatedRequest } from '../types/auth';
import { handleControllerError } from '../helpers/ErrorUtils';

export async function createTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const { title, content, category } = req.body;
    const topic = await topicService.createTopic(title, content, req.user.id, category);
    res.status(201).json(topic);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const { content } = req.body;
    const topico_id = parseInt(req.params.topicId, 10);
    const comment = await topicService.createComment(content, req.user.id, topico_id);
    res.status(201).json(comment);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function getTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const topicId = parseInt(req.params.id, 10);
    const topic = await topicService.getTopicWithComments(topicId);
    res.status(200).json(topic);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}
