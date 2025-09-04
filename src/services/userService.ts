import { supabase } from '../config/supabase';
import dotenv from 'dotenv';
import { UserProfileData } from '../types/user';
import { AppError } from '../helpers/ApiError';

dotenv.config();
  
export async function getLastRegistrationUser(): Promise<UserProfileData> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, role')
    .order('joined_at', { ascending: false })
    .limit(1)

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao buscar o usuário.');
  }

  if (!data || data.length === 0) {
    throw new AppError('NOT_FOUND', 'Nenhum usuário registrado foi encontrado.');
  }

  return data[0];
}

export async function upsertOnlineUser(userId: string) {
  const { data, error } = await supabase
    .from("online_users")
    .upsert([{ user_id: userId, last_seen_at: new Date().toISOString() }])
    .select('last_seen_at');
  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', "Não foi possível atualizar o status online.");
  }

  return data;
}

export async function getOnlineUsers() {
  const { data, error } = await supabase
    .from("online_users")
    .select("last_seen_at, profiles(username, role, avatar_url)")
    .gt("last_seen_at", new Date(Date.now() - 2 * 60 * 1000).toISOString());

  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', "Erro ao buscar usuários online.");
  }

  return data;
}

export async function getAllProfiles(page: number, limit: number): Promise<{ data: Partial<UserProfileData>[]; totalCount: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Ocorreu um erro ao contar os usuários.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('username, role, joined_at, last_login, avatar_url, mensagens_count')
    .range(from, to); 
  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Ocorreu um erro ao buscar a lista de usuários.');
  }
  
  if (!data || data.length === 0 && page > 1) {
    throw new AppError('NOT_FOUND', 'Não há mais usuários para mostrar.');
  }

  return { data, totalCount: count ?? 0 };
}
