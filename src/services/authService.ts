import { supabase, supabaseAdmin } from '../config/supabase';
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

  if (data.user) {
    await supabase.from('profiles').insert({ id: data.user.id, username });
  }
  if (error) {
    console.error('Erro ao registrar usuário:', error);
    throw new Error(error.message);
  }
  return { message: 'Usuário registrado com sucesso!',}
}

export async function login(email: string, password: string, keepLogged: boolean) {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password,
  });

  if (error || !data.session) {
    throw new Error(error?.message || 'Erro no login');
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
    throw new Error(error.message);
  }
  return { message: 'Logout realizado com sucesso!' };
}

export async function getUserByToken(token: string) {
  const { data: authData, error } = await supabase.auth.getUser(token);
  if (error) {
    throw new Error('Token inválido ou expirado');
  }
  const user = authData.user;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)  
    .single();         

  if (profileError) {
    console.error('Erro ao buscar perfil do usuário:', profileError.message);
    return user; 
  }
  return { ...user, username: profile.username };
}

export async function refreshAccessToken(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw new Error('Não foi possível atualizar o token de acesso.');
  }

  return {
    access_token: data.session.access_token,
    access_token_expiry: ONE_HOUR,
  };
}

export async function updatePasswordWithToken(accessToken: string, newPassword: string) {
  // 1. PRIMEIRO, usamos o cliente PADRÃO para validar o token de acesso
  // e obter os dados do usuário. Isso confirma que o token é válido.
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    console.error('Falha ao validar o token de recuperação:', userError);
    throw new Error('Token de recuperação inválido ou expirado.');
  }

  // 2. AGORA, usamos o cliente de ADMINISTRAÇÃO para atualizar a senha do usuário
  // usando o ID que obtivemos no passo anterior.
  const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (adminError) {
    console.error('Erro do Admin Client ao atualizar a senha:', adminError);
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
    console.error('Erro ao enviar e-mail de recuperação:', error);
    throw new Error(error.message);
  }

  return { message: 'Link de recuperação enviado com sucesso!' };
}