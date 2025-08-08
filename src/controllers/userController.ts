import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { AuthenticatedRequest } from '../types/auth';
import { getErrorMessage } from '../helpers/Message';

export async function GetLastRegistration(req: Request, res: Response) {
  try {
    const user = await userService.getLastRegistrationUser();
    res.status(200).json(user);
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.startsWith('NOT_FOUND')) {
      const userMessage = message.split(':')[1] || 'Nenhum usuário encontrado.';
      return res.status(404).json({ error: userMessage });
    } else {
      return res.status(500).json({ error: message});
    }
  }
}

export async function ping(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    await userService.upsertOnlineUser(req.user.id);
    res.status(200).send();
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return res.status(503).json({ error: message });
  }
}


export async function listOnlineUsers(req: Request, res: Response) {
  try {
    const users = await userService.getOnlineUsers();
    res.status(200).json(users);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    return res.status(503).json({ error: message });
  }
}