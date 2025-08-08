import { supabase, supabaseAdmin } from '../config/supabase';
import { AuthApiError } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { RegisterOptions, RecoveryOptions } from '../types/auth';

dotenv.config();

const ONE_HOUR = 60 * 60;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function register(
  username: string,
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
    throw new Error("O registro foi bem-sucedido, mas o usuário não foi retornado.");
  }
  if (error) {
    throw error;
  }
  
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user.id, username });

  if (profileError) {
    throw new Error(`O email já está em uso`);
  }
  return { message: 'Usuário registrado com sucesso!',}
}

export async function login(email: string, password: string, keepLogged: boolean) {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password,
  });

  if (error) {
    if (error instanceof AuthApiError && error.message === 'Invalid login credentials') {
      throw new Error('Email ou senha inválidos.');
    }
    throw error;
  }

  if (!data.session) {
    throw new Error('Não foi possível criar uma sessão.');
  }

  const userId = data.user?.id;

  if (userId) {
    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", userId);
  }

  const refreshTokenMaxAge = keepLogged ? THIRTY_DAYS : ONE_HOUR;

  return {
    access_token: data.session.access_token,
    refresh_token: keepLogged ? data.session.refresh_token : undefined,
    access_token_expiry: ONE_HOUR,
    refresh_token_expiry: refreshTokenMaxAge,
  };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error('Você foi desconectado deste dispositivo, mas não foi possível encerrar a sessão no servidor. Sua sessão pode continuar ativa em outros dispositivos.');
  }
  return { message: 'Logout realizado com sucesso!' };
}

export async function getUserByToken(token: string) {
  const { data: authData, error } = await supabase.auth.getUser(token);

  if (error || !authData.user) {
    throw new Error('INVALID_ACCESS_TOKEN:Token de acesso inválido ou expirado.');
  }
  const user = authData.user;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw new Error('SERVER_ERROR:Não foi possível carregar os dados do perfil.');
  }
  return { ...user, username: profile.username };
}

export async function refreshAccessToken(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw new Error('INVALID_REFRESH_TOKEN:Sua sessão expirou. Por favor, faça o login novamente.');
  }

  return {
    newAccessToken: data.session.access_token,
    user: data.session.user,
    accessTokenExpiry: ONE_HOUR, 
  };
}

export async function updatePasswordWithToken(accessToken: string, newPassword: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    throw new Error('INVALID_TOKEN:Token de recuperação inválido ou expirado.');
  }

  const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (adminError) {
    if (adminError.message.toLowerCase().includes('password')) {
       throw new Error(`WEAK_PASSWORD:${adminError.message}`);
    }
    throw new Error('Não foi possível atualizar a senha. Por favor, tente novamente.');
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
      throw new Error('Você realizou muitas tentativas. Por favor, aguarde um momento antes de tentar novamente.');
    }
    throw new Error('Não foi possível processar sua solicitação no momento.');
  }

  return { message: 'Se uma conta com este e-mail existir, um link para redefinição de senha foi enviado.' };
}