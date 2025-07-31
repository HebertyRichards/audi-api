import supabase from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

interface UserProfileData {
  id: string;
  username: string;
  website?: string;
  gender?: string;
  birthdate?: string;
  location?: string;
  joined_at?: string;
  last_login?: string;
  total_posts?: number;
  role?: string;
}
  
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
