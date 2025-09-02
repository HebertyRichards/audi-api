import { supabase, supabaseAdmin ,createAuthenticatedClient }from '../config/supabase';
import dotenv from 'dotenv';
import { UserProfileData, UserProfileWithoutId } from '../types/user';
import { AppError } from '../helpers/ApiError';

dotenv.config();
  
export async function getProfileById(id: string): Promise<
Pick<
  UserProfileData,
  'username' | 'gender' | 'birthdate' | 'location' | 'website' | 'joined_at' | 'last_login' | 'total_posts' | 'role' | 'facebook' | 'instagram' | 'discord' | 'steam' | 'avatar_url' | 'followers_count' | 'following_count' | 'mensagens_count'
>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, gender, birthdate, location, website, joined_at, last_login, total_posts, role, facebook, instagram, discord, steam, avatar_url, mensagens_count')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    throw new AppError('NOT_FOUND', 'O perfil com este ID não foi encontrado.');
  }
  return data;
}

export async function updateProfile(profile: Partial<UserProfileData> & { id: string }) {
  const { id, ...profileData } = profile;
  const allowedFields = ['username', 'website', 'gender', 'birthdate', 'location', 'facebook', 'instagram', 'discord', 'steam'] as const;

  const fieldsToUpdate: Partial<Record<typeof allowedFields[number], string | number | null>> = {};
  for (const key of allowedFields) {
    if (key in profileData) {
      fieldsToUpdate[key] = profileData[key as keyof typeof profileData];
    }
  }

  if (fieldsToUpdate.birthdate === "") {
    fieldsToUpdate.birthdate = null;
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    throw new AppError('BAD_REQUEST', 'Nenhum campo válido para atualização foi fornecido.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(fieldsToUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new AppError('CONFLICT', 'Este nome de usuário já está em uso.');
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Erro ao salvar perfil do usuário.');
  }

  if (!data) {
    throw new AppError('NOT_FOUND', 'O perfil que você tentou atualizar não foi encontrado.');
  }

  return { message: 'Perfil atualizado com sucesso!' };
}

export async function getUserProfileByUsername(username: string): Promise<UserProfileWithoutId> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, gender, birthdate, location, website, joined_at, last_login, total_posts, role, facebook, instagram, discord, steam, avatar_url, followers_count, following_count')
    .eq('username', username)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Usuário com este nome não foi encontrado.');
  }

  return data;
}

export async function updateAvatar(userId: string, avatarFile: Express.Multer.File | undefined, token: string) {
  if (!avatarFile) {
    throw new AppError('BAD_REQUEST', 'Nenhum arquivo de avatar foi enviado.');
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
    throw new AppError('INTERNAL_SERVER_ERROR', 'Falha ao enviar o novo avatar.');
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
    throw new AppError('INTERNAL_SERVER_ERROR', 'Falha ao salvar a URL do avatar no perfil.');
  }
   
  return { message: 'Avatar atualizado com sucesso!', avatar_url: data.avatar_url };
}

export async function deleteAvatar(userId: string) {
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();

  if (profileError || !profileData) {
    throw new AppError('NOT_FOUND', 'Perfil do usuário não encontrado.');
  }

  if (profileData.avatar_url) {
    const oldFileName = profileData.avatar_url.split('/').pop()?.split('?')[0];
    if (oldFileName) {
      const { error: storageError } = await supabaseAdmin.storage
      .from('avatars')
      .remove([`avatars/${oldFileName}`]);
      if (storageError) {
        throw new AppError('INTERNAL_SERVER_ERROR', 'Falha ao remover o arquivo do storage.');
      }
    }
  } else {
    return { message: 'Nenhum avatar para remover.', avatar_url: null };
  }
  const { data, error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId)
    .select('avatar_url')
    .single();

  if (updateError) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Erro ao limpar a URL do avatar no perfil.');
  }

  return { message: 'Avatar removido com sucesso!', avatar_url: data.avatar_url };
}
