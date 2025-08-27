import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/categoryService';
import { handleControllerError } from '../helpers/ErrorUtils';

export async function getAllCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}
