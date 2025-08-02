import supabase from '../config/supabase';
import dotenv from 'dotenv';
import { UserProfileData, UserProfileWithoutId } from '../types/user';

dotenv.config();
  
export async function getProfileById(id: string): Promise<
Pick<
  UserProfileData,
  'username' | 'gender' | 'birthdate' | 'location' | 'website' | 'joined_at' | 'last_login' | 'total_posts' | 'role'
>> {
const { data, error } = await supabase
  .from('profiles')
  .select('username, gender, birthdate, location, website, joined_at, last_login, total_posts, role')
  .eq('id', id)
  .single();
if (error) {
  console.error('Erro ao buscar perfil:', error.message);
  throw new Error('Erro ao buscar perfil do usuário.');
}
return data;
}

export async function updateProfile(
  profile: Partial<UserProfileData> & { id: string }
) {
  const { id } = profile;

  const allowedFields = ['username', 'website', 'gender', 'birthdate', 'location'] as const;

  const fieldsToUpdate: Partial<Record<typeof allowedFields[number], string | null>> = Object.fromEntries(
    Object.entries(profile).filter(([key, value]) =>
      allowedFields.includes(key as typeof allowedFields[number])
    )
  );
  if (fieldsToUpdate.birthdate === "") {
    fieldsToUpdate.birthdate = null;
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    throw new Error('Nenhum campo válido para atualizar.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(fieldsToUpdate)
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar perfil:', error.message);
    throw new Error('Erro ao salvar perfil do usuário.');
  }

  return { message: 'Perfil atualizado com sucesso!', data };
}

export async function DeleteProfile(id: string): Promise<{ message: string }> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Erro ao deletar perfil:', error.message);
    throw new Error('Erro ao deletar perfil do usuário.');
  }

  return { message: 'Perfil deletado com sucesso!' };
}

export async function getUserProfileByUsername(username: string): Promise<UserProfileWithoutId> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, gender, birthdate, location, website, joined_at, last_login, total_posts, role')
    .eq('username', username)
    .single();

  if (error || !data) {
    throw new Error('Usuário não encontrado.');
  }

  return data;
}