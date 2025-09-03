import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import * as cookie from 'cookie';
import { supabase } from '../config/supabase';
import { handleControllerError } from '../middlewares/Errors';
import { AuthenticatedRequest } from '../types/auth';

const createCookie = (name: string, value: string, maxAge: number): string => {
  const isProduction = process.env.NODE_ENV === 'production';

  return cookie.serialize(name, value, {
    httpOnly: true,
    maxAge: maxAge,
    path: '/',
    sameSite: isProduction ? 'none' : 'lax', 
    secure: isProduction,
    partitioned: isProduction,
  });
};

const clearAuthCookies = (res: Response) => {
  res.setHeader('Set-Cookie', [
    createCookie('sb-access-token', '', 0),
    createCookie('sb-refresh-token', '', 0),
  ]);
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, options } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres." });
    }
    const { data: existingUsername } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

    if (existingUsername) {
      return res.status(409).json({ error: "Este nome de usuário já está em uso." });
    }
    const result = await authService.register(username, email, password, options);
    return res.status(201).json(result);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, keepLogged } = req.body;
    const { access_token, refresh_token, access_token_expiry, refresh_token_expiry } = await authService.login(email, password, keepLogged);

    const cookiesToSet = [
      createCookie('sb-access-token', access_token, access_token_expiry),
    ];
    if (refresh_token) {
      cookiesToSet.push(
        createCookie('sb-refresh-token', refresh_token, refresh_token_expiry)
      );
    }
    res.setHeader('Set-Cookie', cookiesToSet);
    return res.status(200).json({ message: 'Login realizado com sucesso!' });
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout();
    clearAuthCookies(res);
    return res.status(200).json({ message: 'Logout realizado com sucesso!' });
  } catch (error: unknown) {
    clearAuthCookies(res);
    handleControllerError(error, res, next);
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.cookies['sb-access-token'];
  const refreshToken = req.cookies['sb-refresh-token'];
  
  if (accessToken) {
    try {
      const user = await authService.getUserByToken(accessToken);
      return res.status(200).json(user);
    } catch (error: unknown) {
    }
  }

  if (refreshToken) {
    try {
      const { newAccessToken, accessTokenExpiry } = await authService.refreshAccessToken(refreshToken);
      const refreshedUser = await authService.getUserByToken(newAccessToken);
      res.setHeader('Set-Cookie', createCookie('sb-access-token', newAccessToken, accessTokenExpiry));
      return res.status(200).json(refreshedUser);
    } catch (error: unknown) {
      clearAuthCookies(res);
      return handleControllerError(error, res, next);
    }
  }
  clearAuthCookies(res);
  return res.status(401).json({ error: 'Nenhuma sessão ativa encontrada.' });
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { newPassword, accessToken } = req.body;
    const token = accessToken || req.cookies['sb-access-token'];

    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }
    
    const result = await authService.updatePasswordWithToken(token, newPassword);
    return res.status(200).json(result);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function sendRecoveryEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório." });
    }
    const result = await authService.sendRecoveryEmail(email);
    return res.status(200).json(result);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies['sb-access-token'];
    const { username, newEmail } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }
    if (!username || !newEmail) {
      return res.status(400).json({ error: 'Nome de usuário e e-mail são obrigatórios.' });
    }
    
    const result = await authService.updateUserProfileAndAuth(token, username, newEmail);
    return res.status(200).json(result);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    const { password } = req.body;

    if (!user || !user.id || !user.email) {
      return res.status(401).json({ error: 'Informações de usuário inválidas ou incompletas na sessão.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória para confirmar a exclusão.' });
    }
    const result = await authService.deleteUserAccount(user.id, user.email, password);
    res.status(200).json(result);
  } catch (error: unknown) {
    handleControllerError(error, res, next);
  }
}
