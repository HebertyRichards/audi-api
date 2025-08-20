import { supabase, supabaseAdmin ,createAuthenticatedClient }from '../config/supabase';
import dotenv from 'dotenv';
import { UserProfileData, UserProfileWithoutId } from '../types/user';
import { AppError } from '../helpers/ApiError';

dotenv.config();
  
export async function getProfileById(id: string): Promise<
Pick<
  UserProfileData,
  'username' | 'gender' | 'birthdate' | 'location' | 'website' | 'joined_at' | 'last_login' | 'total_posts' | 'role' | 'facebook' | 'instagram' | 'discord' | 'steam' | 'avatar_url' | 'followers_count' | 'following_count'
>> {
  const { data, error } = await supabase
  .from('profiles')
  .select('id, username, gender, birthdate, location, website, joined_at, last_login, total_posts, role, facebook, instagram, discord, steam, avatar_url')
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
    .select('id, username, gender, birthdate, location, website, joined_at, last_login, total_posts, role, facebook, instagram, discord, steam, avatar_url, followers_count, following_count')
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

export async function deleteAvatar(userId: string) {
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();

  if (profileError || !profileData) {
    throw new Error('NOT_FOUND:Perfil do usuário não encontrado.');
  }

  if (profileData.avatar_url) {
    const oldFileName = profileData.avatar_url.split('/').pop()?.split('?')[0];
    if (oldFileName) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('avatars')
        .remove([`avatars/${oldFileName}`]);
      if (storageError) {
        throw new Error('Falha ao remover o arquivo do storage:');
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
    throw new Error(`Erro ao limpar a URL do avatar no perfil: ${updateError.message}`);
  }

  return { message: 'Avatar removido com sucesso!', avatar_url: data.avatar_url };
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new AppError('BAD_REQUEST', 'Você não pode seguir a si mesmo.');
  }

  const { error } = await supabase.rpc('handle_follow', {
    follower_uuid: followerId,
    following_uuid: followingId,
  });

  if (error) {
    if (error.code === '23505') { 
      throw new AppError('CONFLICT', 'Você já está seguindo este usuário.');
    }
    // Para qualquer outro erro de banco de dados, lançamos um erro genérico
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível completar a ação de seguir.');
  }

  return { message: 'Usuário seguido com sucesso!' };
}

export async function unfollowUser(followerId: string, followingId:string) {
  if (followerId === followingId) {
    throw new AppError('BAD_REQUEST', 'Você não pode deixar de seguir a si mesmo.');
  }

  // A RPC pode ser mais eficiente e lidar com a verificação e exclusão em uma única transação.
  // Isso evita a condição de corrida e reduz as chamadas ao banco de dados.
  const { error } = await supabase.rpc('handle_unfollow', {
    follower_uuid: followerId,
    following_uuid: followingId,
  });

  if (error) {
    // A função RPC pode retornar um código de erro específico se o "follow" não existir
    if (error.message.includes('NOT_FOUND')) {
      throw new AppError('NOT_FOUND', 'Você não está seguindo este usuário.');
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível completar a ação de deixar de seguir.');
  }

  return { message: 'Você deixou de seguir o usuário.' };
}

export async function getFollowStats(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('followers_count, following_count')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Usuário não encontrado.');
  }

  return data;
}

export async function getFollowers(userId: string) {
  // Primeiro, verificamos se o usuário existe para dar uma resposta 404 clara
  const { data: userExists, error: userError } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (userError || !userExists) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado.');
  }
  
  const { data, error } = await supabase
    .from('followers')
    .select('follower:profiles!followers_follower_id_fkey(id, username, avatar_url)')
    .eq('following_id', userId);
  
  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Erro ao buscar seguidores.');
  }

  return data.map(item => item.follower);
}

export async function getFollowing(userId: string) {
  const { data: userExists, error: userError } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (userError || !userExists) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado.');
  }

  const { data, error } = await supabase
    .from('followers')
    .select('following:profiles!followers_following_id_fkey(id, username, avatar_url)')
    .eq('follower_id', userId);

  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Erro ao buscar usuários que você segue.');
  }

  return data.map(item => item.following);
}
