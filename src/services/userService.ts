import { supabase } from '../config/supabase';
import dotenv from 'dotenv';
import { UserProfileData } from '../types/user';

dotenv.config();
  
export async function getLastRegistrationUser(): Promise<UserProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('joined_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Erro ao buscar o último registro:', error.message);
    throw new Error('Erro ao buscar o último registro.');
  }

  return data || null;
}

export async function upsertOnlineUser(userId: string) {
  const { data, error } = await supabase
    .from("online_users")
    .upsert([{ user_id: userId, last_seen_at: new Date().toISOString() }])
    .select('last_seen_at');

  if (error) {
    console.error("Erro inexperado:", error.message);
    throw new Error("Erro ao atualizar status online.");
  }

  return data;
}

export async function getOnlineUsers() {
  const { data, error } = await supabase
    .from("online_users")
    .select("user_id, last_seen_at, profiles(username, role)")
    .gt("last_seen_at", new Date(Date.now() - 2 * 60 * 1000).toISOString());

  if (error) {
    console.error("Erro ao listar usuários online:", error.message);
    throw new Error("Erro ao buscar usuários online.");
  }

  return data;
}