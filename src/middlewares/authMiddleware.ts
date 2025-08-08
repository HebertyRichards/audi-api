import { Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { AuthenticatedRequest } from "../types/auth";
import { getErrorMessage } from "../helpers/Message";

export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies['sb-access-token'];

    if (!token) {
      return res.status(401).json({ error: "Token de autenticação não fornecido." });
    }
    const user = await authService.getUserByToken(token);
    req.user = user;
    next();
    
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.startsWith('SERVER_ERROR')) {
      const userMessage = message.split(':')[1] || 'Erro interno ao verificar a sessão.';
      return res.status(500).json({ error: userMessage });
    }
    else {
      const userMessage = message.split(':')[1] || 'Sessão inválida ou expirada.';
      return res.status(401).json({ error: userMessage });
    }
  }
}