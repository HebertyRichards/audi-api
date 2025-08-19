import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as cookie from 'cookie';
import { supabase } from '../config/supabase';
import { getErrorMessage } from '../helpers/Message';

const createCookie = (name: string, value: string, maxAge: number): string => {
  return cookie.serialize(name, value, {
    httpOnly: true,
    maxAge: maxAge,
    path: '/',
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production',
    partitioned: true,
  });
};

const clearAuthCookies = (res: Response) => {
  res.setHeader('Set-Cookie', [
    createCookie('sb-access-token', '', 0),
    createCookie('sb-refresh-token', '', 0),
  ]);
};

export async function register(req: Request, res: Response) {
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
    const message = getErrorMessage(error);
    if (message.includes("User already registered")) {
       return res.status(409).json({ error: "Este e-mail já está em uso." });
    }
    return res.status(500).json({ error: + message });
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
    const message = getErrorMessage(error);
    return res.status(401).json({ error: message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    await authService.logout();
    clearAuthCookies(res);
    return res.status(200).json({ message: 'Logout realizado com sucesso!' });
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    clearAuthCookies(res);
    return res.status(503).json({error: message});
  }
}

export async function getSession(req: Request, res: Response) {
  const accessToken = req.cookies['sb-access-token'];
  const refreshToken = req.cookies['sb-refresh-token'];
  let user = null;

  if (accessToken) {
    try {
      user = await authService.getUserByToken(accessToken);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      if (message.startsWith('SERVER_ERROR')) {
        const userMessage = message.split(':')[1] || 'Ocorreu um erro interno.';
        return res.status(500).json({ error: userMessage });
      }
      user = null;
    }
  }

  if (!user && refreshToken) {
    try {
      const { newAccessToken, accessTokenExpiry } = await authService.refreshAccessToken(refreshToken);
      const refreshedUser = await authService.getUserByToken(newAccessToken);
      res.setHeader('Set-Cookie', createCookie('sb-access-token', newAccessToken, accessTokenExpiry));
      user = refreshedUser;
    } catch (refreshError: unknown) {
      clearAuthCookies(res);
      const originalRefreshMessage = getErrorMessage(refreshError);
      
      if (originalRefreshMessage.startsWith('INVALID_REFRESH_TOKEN')) {
        const userMessage = originalRefreshMessage.split(':')[1] || 'Sua sessão expirou. Faça login novamente.';
        return res.status(401).json({ error: userMessage });
      } else {
        return res.status(500).json({ error: 'Não foi possível renovar a sessão no momento. Tente novamente mais tarde.' });
      }
    }
  }

  if (user) {
    return res.status(200).json(user);
  } else {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Nenhuma sessão ativa encontrada.' });
  }
}

export async function changePassword(req: Request, res: Response) {
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
    const message = getErrorMessage(error);

    if (message.startsWith('INVALID_TOKEN')) {
      const userMessage = message.split(':')[1] || 'Token inválido ou expirado.';
      return res.status(401).json({ error: userMessage });
    }

    if (message.startsWith('WEAK_PASSWORD')) {
      const userMessage = message.split(':')[1] || 'A senha não atende aos requisitos.';
      return res.status(400).json({ error: userMessage });
    } else {
      return res.status(500).json({ error: message });
    }
  }
}

export async function sendRecoveryEmail(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." });
  }

  try {
    const result = await authService.sendRecoveryEmail(email);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.includes('Muitas tentativas')) {
      return res.status(429).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}
