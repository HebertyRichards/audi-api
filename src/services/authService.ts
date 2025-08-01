import supabase from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

const ONE_HOUR = 60 * 60;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function register(username: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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