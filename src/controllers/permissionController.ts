import { Response, NextFunction } from 'express';
import * as permissionService from '../services/permissionService';
import { handleControllerError } from '../middlewares/Errors';
import { AuthenticatedRequest } from '../types/auth';

export async function checkTopicCreationPermission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const author_id = req.user.id;
    const { category } = req.body;

    if (!category) {
        return res.status(400).json({ error: "A categoria é obrigatória." });
    }
    const hasPermission = await permissionService.checkTopicCreationPermission(author_id, category);

    res.status(200).json({ allowed: hasPermission });
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function checkCommentCreationPermission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
          return res.status(401).json({ error: "Usuário não autenticado." });
      }
      const author_id = req.user.id;
      const { topicId } = req.params;
      const topicIdNum = parseInt(topicId, 10);

      if (isNaN(topicIdNum)) {
          return res.status(400).json({ error: "O ID do tópico é inválido." });
      }

      const hasPermission = await permissionService.checkCommentCreationPermission(author_id, topicIdNum);
  
      res.status(200).json({ allowed: hasPermission });
    } catch (error: unknown) {
      handleControllerError(error, res, next);
    }
  }