import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/categoryService';
import { handleControllerError } from '../middlewares/Errors';
export async function getAllCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function getTopicsByCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.params;
    const topics = await categoryService.getTopicsByCategory(category);
    res.status(200).json(topics);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}
