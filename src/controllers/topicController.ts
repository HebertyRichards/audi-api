import { Request, Response, NextFunction } from 'express';
import * as topicService from '../services/topicService';
import { AuthenticatedRequest } from '../types/auth';
import { handleControllerError } from '../middlewares/Errors';
import { z } from 'zod';
import * as uploadService from '../services/uploadService';

const createTopicSchema = z.object({
  title: z.string().min(5, "O título deve ter no mínimo 5 caracteres."),
  content: z.string().min(10, "O conteúdo deve ter no mínimo 10 caracteres."),
  category: z.string().nonempty("A categoria é obrigatória."),
  images: z.array(z.string().url("URL da imagem inválida.")).optional(),
});

const createCommentSchema = z.object({
    content: z.string().min(1, "O conteúdo não pode estar vazio."),
    images: z.array(z.string().url("URL da imagem inválida.")).optional(),
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
    const { title, category } = validationResult.data;
    let finalContent = validationResult.data.content;
    const finalImageUrls: string[] = [];

    if (req.files && Array.isArray(req.files)) {
        const files = req.files as Express.Multer.File[];
        for (const file of files) {
            const uploadedUrl = await uploadService.uploadFile(file);
            finalImageUrls.push(uploadedUrl);
        }
    }

    finalImageUrls.forEach(url => {
        finalContent = finalContent.replace(/<img src="blob:[^"]+">/, `<img src="${url}">`);
    });
    
    const topic = await topicService.createTopic(title, finalContent, req.user!.id, category, finalImageUrls);
    res.status(201).json(topic);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const validationResult = createCommentSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ errors: validationResult.error.flatten() });
    }
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    let finalContent = validationResult.data.content;
    const finalImageUrls: string[] = [];
    const topicId = parseInt(req.params.topicId, 10);

    if (isNaN(topicId)) {
        return res.status(400).json({ error: "ID de tópico inválido." });
    }

    if (req.files && Array.isArray(req.files)) {
        const files = req.files as Express.Multer.File[];
        for (const file of files) {
            const uploadedUrl = await uploadService.uploadFile(file);
            finalImageUrls.push(uploadedUrl);
        }
    }
    
    finalImageUrls.forEach(url => {
        finalContent = finalContent.replace(/<img src="blob:[^"]+">/, `<img src="${url}">`);
    });

    const comment = await topicService.createComment(finalContent, req.user.id, topicId, finalImageUrls);
    res.status(201).json(comment);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function getTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const topicId = parseInt(req.params.id, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    if (isNaN(topicId)) {
      return res.status(400).json({ error: 'ID de tópico inválido.' });
    }
    const topic = await topicService.getTopicWithComments(topicId, page, limit);
    res.status(200).json(topic);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function getTopicBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    if (!slug) {
      return res.status(400).json({ error: "Slug é obrigatório." });
    }
    const topic = await topicService.getTopicBySlugWithComments(slug, page, limit);
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
    if (isNaN(topicId)) return res.status(400).json({ error: 'ID de tópico inválido.' });
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
    if (isNaN(topicId)) return res.status(400).json({ error: 'ID de tópico inválido.' });
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
