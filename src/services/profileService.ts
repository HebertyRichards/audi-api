import { supabase }from '../config/supabase';
import dotenv from 'dotenv';
import { UserProfileData, UserProfileWithoutId } from '../types/user';

dotenv.config();
  
export async function getProfileById(id: string): Promise<
Pick<
  UserProfileData,
  'username' | 'gender' | 'birthdate' | 'location' | 'website' | 'joined_at' | 'last_login' | 'total_posts' | 'role' | 'facebook' | 'instagram' | 'discord' | 'steam'
>> {
  const { data, error } = await supabase
  .from('profiles')
  .select('username, gender, birthdate, location, website, joined_at, last_login, total_posts, role, facebook, instagram, discord, steam')
  .eq('id', id)
  .single();
  
if (error) {
  if (error.code === 'PGRST116') { 
    throw new Error('NOT_FOUND:O perfil com este ID não foi encontrado.');
  }
  throw new Error('Ocorreu um erro ao buscar os dados do perfil.');
}

return data;
}

export async function getAllProfiles(): Promise<Partial<UserProfileData>[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, role, joined_at, last_login'); 
  if (error) {
    throw new Error('Ocorreu um erro ao buscar a lista de usuários.');
  }

  if (!data || data.length === 0) {
    throw new Error('NOT_FOUND:Nenhum usuário foi encontrado.');
  }

  return data;
}

export async function updateProfile(
  profile: Partial<UserProfileData> & { id: string }
) {
  const { id, ...profileData } = profile;
  const allowedFields = ['username', 'website', 'gender', 'birthdate', 'location', 'facebook', 'instagram', 'discord', 'steam'] as const;

  const fieldsToUpdate: Partial<Record<typeof allowedFields[number], string | null>> = {};
  for (const key of allowedFields) {
    if (key in profileData) {
      fieldsToUpdate[key] = profileData[key];
    }
  }

  if (fieldsToUpdate.birthdate === "") {
    fieldsToUpdate.birthdate = null;
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    throw new Error('BAD_REQUEST:Nenhum campo válido para atualização foi fornecido.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(fieldsToUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('CONFLICT:Este nome de usuário já está em uso. Por favor, escolha outro.');
    }
    throw new Error('Erro ao salvar perfil do usuário.');
  }

  if (!data) {
    throw new Error('NOT_FOUND:O perfil que você tentou atualizar não foi encontrado.');
  }

  return { message: 'Perfil atualizado com sucesso!' };
}

export async function DeleteProfile(id: string): Promise<{ message: string }> {

  const { data, error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    throw new Error('Ocorreu um erro ao tentar deletar o perfil.');
  }

  if (!data || data.length === 0) {
    throw new Error('NOT_FOUND:O perfil que você tentou deletar não foi encontrado.');
  }

  return { message: 'Perfil deletado com sucesso!' };
}

export async function getUserProfileByUsername(username: string): Promise<UserProfileWithoutId> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, gender, birthdate, location, website, joined_at, last_login, total_posts, role, facebook, instagram, discord, steam')
    .eq('username', username)
    .single();


  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('NOT_FOUND:Usuário com este nome não foi encontrado.');
    }
    throw new Error('Ocorreu um erro ao buscar o perfil.');
  }

  if (!data) {
    throw new Error('NOT_FOUND:Usuário com este nome não foi encontrado.');
  }
  
  return data;
}