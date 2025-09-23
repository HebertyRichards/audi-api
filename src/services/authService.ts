import { supabase, supabaseAdmin, createAuthenticatedClient } from '../config/supabase';
import { AuthApiError } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { RegisterOptions, RecoveryOptions } from '../types/auth';
import { AppError } from '../helpers/ApiError';

dotenv.config();

const ONE_HOUR = 60 * 60;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function register(username: string,
  email: string,
  password: string,
  options?: RegisterOptions
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      emailRedirectTo: options?.emailRedirectTo ?? `${process.env.FRONTEND_URL}/confirmation`,
     },
  });

  if (!data.user) {
    throw new AppError('INTERNAL_SERVER_ERROR', "O registro falhou ao tentar criar o usuário.");
  }
  if (error) {
    if (error.message.includes("User already registered")) {
      throw new AppError('CONFLICT', "Este e-mail já está em uso.");
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível registrar o usuário.');
  }
  
  const { error: profileError } = await supabase
  .from('profiles')
  .insert({ id: data.user.id, username });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    throw new AppError('INTERNAL_SERVER_ERROR', `Falha ao criar o perfil do usuário.`);
  }
  return { message: 'Usuário registrado com sucesso!' };
}

export async function login(email: string, password: string, keepLogged: boolean) {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email,
     password,
     });

  if (error) {
    if (error instanceof AuthApiError && error.message === 'Invalid login credentials') {
      throw new AppError('UNAUTHORIZED', 'Email ou senha inválidos.');
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Ocorreu um erro durante o login.');
  }

  if (!data.session) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível criar uma sessão.');
  }
  const userId = data.user?.id;
  if (userId) {
    await supabase
    .from("profiles")
    .update({ last_login: new Date().toISOString() })
    .eq("id", userId);
  }

  return {
    access_token: data.session.access_token,
    refresh_token: keepLogged ? data.session.refresh_token : undefined,
    access_token_expiry: ONE_HOUR,
    refresh_token_expiry: keepLogged ? THIRTY_DAYS : ONE_HOUR,
  };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível encerrar a sessão no servidor.');
  }
  return { message: 'Logout realizado com sucesso!' };
}

export async function getUserByToken(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AppError('UNAUTHORIZED', 'Token de acesso inválido ou expirado.');
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new AppError('NOT_FOUND', 'Não foi possível carregar os dados do perfil associado.');
  }
  return { ...user, username: profile.username };
}

export async function refreshAccessToken(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession({ 
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw new AppError('UNAUTHORIZED', 'Sua sessão expirou. Por favor, faça o login novamente.');
  }

  return {
    newAccessToken: data.session.access_token,
    accessTokenExpiry: ONE_HOUR,
  };
}

export async function updatePasswordWithToken(accessToken: string, newPassword: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    throw new AppError('UNAUTHORIZED', 'Token inválido ou expirado.');
  }

  const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
     { password: newPassword }
    );

  if (adminError) {
    if (adminError.message.includes('Password should be at least 6 characters')) {
       throw new AppError('BAD_REQUEST', 'A senha deve ter no mínimo 6 caracteres.');
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível atualizar a senha.');
  }
  return { message: 'Senha atualizada com sucesso!' };
}

export async function updateAuthenticatedUserPassword(accessToken: string, newPassword: string) {
  const supabaseAuthenticated = createAuthenticatedClient(accessToken);
  const { error } = await supabaseAuthenticated.auth.updateUser({
    password: newPassword,
  });

  if (error) {
     if (error.message.includes('Password should be at least 6 characters')) {
       throw new AppError('BAD_REQUEST', 'A nova senha deve ter no mínimo 6 caracteres.');
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível atualizar a senha.');
  }

  return { message: 'Senha atualizada com sucesso!' };
}

export async function sendRecoveryEmail(email: string, options?: RecoveryOptions) {
  const redirectTo = options?.redirectTo ?? `${process.env.FRONTEND_URL}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { 
    redirectTo,
   });

  if (error) {
    if (error instanceof AuthApiError && error.status === 429) {
      throw new AppError('TOO_MANY_REQUESTS', 'Você realizou muitas tentativas. Por favor, aguarde antes de tentar novamente.');
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível processar sua solicitação.');
  }
  return { message: 'Se uma conta com este e-mail existir, um link para redefinição de senha foi enviado.' };
}

export async function deleteUserAccount(userId: string, email: string, password: string) {
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    throw new AppError('UNAUTHORIZED', 'Senha incorreta. A exclusão da conta foi cancelada.');
  }
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível deletar a conta do usuário.');
  }
  return { message: 'Conta de usuário deletada com sucesso.' };
}
