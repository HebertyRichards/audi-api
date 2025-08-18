import { supabase, supabaseAdmin ,createAuthenticatedClient }from '../config/supabase';
import dotenv from 'dotenv';
import { UserProfileData, UserProfileWithoutId } from '../types/user';

dotenv.config();
  
export async function getProfileById(id: string): Promise<
Pick<
  UserProfileData,
  'username' | 'gender' | 'birthdate' | 'location' | 'website' | 'joined_at' | 'last_login' | 'total_posts' | 'role' | 'facebook' | 'instagram' | 'discord' | 'steam' | 'avatar_url'
>> {
  const { data, error } = await supabase
  .from('profiles')
  .select('username, gender, birthdate, location, website, joined_at, last_login, total_posts, role, facebook, instagram, discord, steam, avatar_url')
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

export async function getAllProfiles(page: number, limit: number): Promise<{ data: Partial<UserProfileData>[]; totalCount: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error('Ocorreu um erro ao contar os usuários.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('username, role, joined_at, last_login, avatar_url')
    .range(from, to); 
  if (error) {
    throw new Error('Ocorreu um erro ao buscar a lista de usuários.');
  }

  if (!data || data.length === 0) {
    if (page === 1) {
       throw new Error('NOT_FOUND:Nenhum usuário foi encontrado.');
    }
  }

  return { data, totalCount: count ?? 0 };
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
    .select('username, gender, birthdate, location, website, joined_at, last_login, total_posts, role, facebook, instagram, discord, steam, avatar_url')
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

export async function updateAvatar(userId: string, avatarFile: Express.Multer.File, token: string) {
  if (!avatarFile) {
    throw new Error('BAD_REQUEST:Nenhum arquivo de avatar foi enviado.');
  }
  const supabaseAutenticado = createAuthenticatedClient(token);
  const { data: profileData } = await supabaseAdmin
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();

  if (profileData?.avatar_url) {
    const oldFileName = profileData.avatar_url.split('/').pop()?.split('?')[0];
    if (oldFileName) {
      await supabaseAdmin.storage.from('avatars').remove([`avatars/${oldFileName}`]);
    }
  }

  const fileExtension = avatarFile.originalname.split('.').pop();
  const fileName = `${userId}.${fileExtension}`;
  const filePath = `avatars/${fileName}`;
  const { error: uploadError } = await supabaseAutenticado.storage
    .from('avatars')
    .upload(filePath, avatarFile.buffer, {
      contentType: avatarFile.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erro no Supabase Storage: ${uploadError.message}`);
  }

  const { data: urlData } = supabaseAutenticado.storage
    .from('avatars')
    .getPublicUrl(filePath);
  const avatarUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
  const { data, error: updateError } = await supabaseAutenticado
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
    .select('avatar_url')
    .single();

  if (updateError) {
    throw new Error(`Erro ao salvar a URL do avatar no perfil: ${updateError.message}`);
  }

  return { message: 'Avatar atualizado com sucesso!', avatar_url: data.avatar_url };
}