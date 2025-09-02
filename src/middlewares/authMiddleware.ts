import { Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { AuthenticatedRequest } from "../types/auth";
import { AppError } from "../helpers/ApiError";

export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies['sb-access-token'];

    if (!token) {
      throw new AppError('UNAUTHORIZED', "Token de autenticação não fornecido.");
    }
    const user = await authService.getUserByToken(token);
    req.user = user;
    next();
    
  } catch (error: unknown) {
    next(error);
  }
}