import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as cookie from 'cookie';
import { supabase } from '../config/supabase';

const createCookie = (name: string, value: string, maxAge: number): string => {
  return cookie.serialize(name, value, {
    httpOnly: true,
    maxAge: maxAge,
    path: '/',
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production',
  });
};

const clearAuthCookies = (res: Response) => {
  res.setHeader('Set-Cookie', [
    createCookie('sb-access-token', '', 0),
    createCookie('sb-refresh-token', '', 0),
  ]);
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

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
    return res.status(500).json({ error: "Erro ao registrar usuário. Tente novamente mais tarde: " + message });
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
    return res.status(401).json({ error: "Erro ao efetuar o login. Tente novamente mais tarde: " + message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    clearAuthCookies(res);
     return res.status(200).json({ message: 'Logout realizado com sucesso!' });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
     return res.status(500).json({ error: "Erro ao fazer o logout. Tente novamente mais tarde: " + message });
  }
}

export async function getSession(req: Request, res: Response) {
  const accessToken = req.cookies['sb-access-token'];
  const refreshToken = req.cookies['sb-refresh-token'];
  let user = null;
  if (accessToken) {
    try {
      user = await authService.getUserByToken(accessToken);
    } catch (error) {
      user = null;
    }
  }
  if (!user && refreshToken) {
    try {
      const { access_token: newAccessToken, access_token_expiry } = await authService.refreshAccessToken(refreshToken);
      res.setHeader('Set-Cookie', createCookie('sb-access-token', newAccessToken, access_token_expiry));
      user = await authService.getUserByToken(newAccessToken);
    } catch (error: unknown) {
      clearAuthCookies(res);
      const message = getErrorMessage(error);
      return res.status(401).json({ error: "Erro de autenticação." + message });
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
    return res.status(500).json({ error: "erro ao tentar mudar de senha. Tente novamente mais tarde: " + message });
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
    return res.status(500).json({ error: "Erro ao tentar enviar o email. Tente novamente mais tarde: " + message });
  }
}
