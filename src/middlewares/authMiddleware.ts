import { Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { AuthenticatedRequest } from "../types/onlineUser";

export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token = req.cookies['sb-access-token'];
      if (!token) {
        res.status(401).json({ error: "Não autenticado" });
      }
  
      const user = await authService.getUserByToken(token);
      if (!user) {
         res.status(401).json({ error: "Token inválido" });
      }
  
      req.user = user;
      next();
    } catch (error: any) {
      console.error({error: error.message});
      res.status(401).json({ error: "Token inválido ou expirado" });
    }
  }