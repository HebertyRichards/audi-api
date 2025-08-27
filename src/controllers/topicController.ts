import { Request, Response, NextFunction } from 'express';
import * as topicService from '../services/topicService';
import { AuthenticatedRequest } from '../types/auth';
import { handleControllerError } from '../helpers/ErrorUtils';
import { z } from 'zod';

const createTopicSchema = z.object({
  title: z.string().min(5, "O título deve ter no mínimo 5 caracteres."),
  content: z.string().min(10, "O conteúdo deve ter no mínimo 10 caracteres."),
  category: z.string().nonempty("A categoria é obrigatória."),
});

export async function createTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const validationResult = createTopicSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ errors: validationResult.error.flatten() });
  }
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
        return res.status(400).json({ error: "Título, conteúdo e categoria são obrigatórios." });
    }

    const topic = await topicService.createTopic(title, content, req.user!.id, category);
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

export async function getTopicBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const topic = await topicService.getTopicBySlugWithComments(slug);
    res.status(200).json(topic);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function deleteTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const topicId = parseInt(req.params.id, 10);
    await topicService.deleteTopic(topicId, req.user.id);
    res.status(204).send();
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) {
        return res.status(400).json({ error: "ID de comentário inválido." });
    }
    await topicService.deleteComment(commentId, req.user.id);
    res.status(204).send();
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function updateTopic(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const topicId = parseInt(req.params.id, 10);
    const { title, content } = req.body;
    const topic = await topicService.updateTopic(topicId, req.user.id, { title, content });
    res.status(200).json(topic);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function updateCommentController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    const { content } = req.body;
    const commentId = parseInt(req.params.commentId, 10);

    if (isNaN(commentId) || !content) {
      return res.status(400).json({ error: "ID de comentário inválido ou conteúdo inválido." });
    }

    const updatedComment = await topicService.updateComment(commentId, req.user.id, content);
    res.status(200).json(updatedComment);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function getTopicsByCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.params;
    const topics = await topicService.getTopicsByCategory(category);
    res.status(200).json(topics);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}
