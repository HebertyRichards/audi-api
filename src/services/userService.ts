import supabase from '../config/supabase';
import dotenv from 'dotenv';
import { UserProfileData, UserProfileWithoutId } from '../types/user';

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