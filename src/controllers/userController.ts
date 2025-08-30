import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { AuthenticatedRequest } from '../types/auth';
import { handleControllerError } from '../helpers/ErrorUtils';

export async function GetLastRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getLastRegistrationUser();
    res.status(200).json(user);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function ping(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    await userService.upsertOnlineUser(req.user.id);
    res.status(200).send();
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function listOnlineUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userService.getOnlineUsers();
    res.status(200).json(users);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await userService.getAllProfiles(page, limit);
    res.status(200).json(result);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}
