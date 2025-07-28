import { Request, Response } from 'express';
import * as authService from '../services/authService';
import cookie from 'cookie';

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register(username, email, password);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
export async function login(req: Request, res: Response) {
  try {
    const { email, password, keepLogged } = req.body;

    const {
      access_token,
      refresh_token,
      access_token_expiry,
      refresh_token_expiry,
    } = await authService.login(email, password, keepLogged);

    res.setHeader('Set-Cookie', [
      cookie.serialize('sb-access-token', access_token, {
        httpOnly: true,
        maxAge: access_token_expiry,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }),
      cookie.serialize('sb-refresh-token', refresh_token, {
        httpOnly: true,
        maxAge: refresh_token_expiry,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }),
    ]);

    res.status(200).json({ message: 'Login realizado com sucesso!' });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    res.setHeader('Set-Cookie', [
      cookie.serialize('sb-access-token', '', {
        httpOnly: true,
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }),
      cookie.serialize('sb-refresh-token', '', {
        httpOnly: true,
        maxAge: 0, 
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }),
    ]);
    res.status(200).json({ message: 'Logout realizado com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const token = req.cookies['sb-access-token'];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const user = await authService.getUserByToken(token);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}
