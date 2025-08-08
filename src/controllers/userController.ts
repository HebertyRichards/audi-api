import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { AuthenticatedRequest } from '../types/auth';

export async function GetLastRegistration (req: Request, res: Response) {
  try {
    const user = await userService.getLastRegistrationUser();
    if (!user) {
      res.status(404).json({ message: "Nenhum usuário encontrado." });
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function ping(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    await userService.upsertOnlineUser(req.user.id);
    res.sendStatus(200);
  } catch (error: any) {
    console.error("Erro no ping:", error.message);
    res.status(500).json({ error: error.message });
  }
}

export async function listOnlineUsers(req: Request, res: Response) {
  try {
    const users = await userService.getOnlineUsers();
    res.json(users);
  } catch (error: any) {
    console.error("Erro para listar os usuários:", error.message);
    res.status(500).json({ error: error.message });
  }
}