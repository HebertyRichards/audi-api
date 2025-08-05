import { Request, Response } from 'express';
import * as userService from '../services/userService';

export async function GetLastRegistration (req: Request, res: Response) {
    try {
        const user = await userService.getLastRegistrationUser();
        if (!user) {
          res.status(404).json({ message: "Nenhum usuário encontrado." });
        }
        return res.status(200).json(user);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    };