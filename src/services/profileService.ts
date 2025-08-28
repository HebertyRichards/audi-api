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

export async function followUser(followerId: string, followingUsername: string) {
  const followingId = await getUserIdByUsername(followingUsername);
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
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível completar a ação de seguir.');
  }

  return { message: 'Usuário seguido com sucesso!' };
}

export async function unfollowUser(followerId: string, followingUsername: string) {
    const followingId = await getUserIdByUsername(followingUsername);
  if (followerId === followingId) {
    throw new AppError('BAD_REQUEST', 'Você não pode deixar de seguir a si mesmo.');
  }
  const { error } = await supabase.rpc('handle_unfollow', {
    follower_uuid: followerId,
    following_uuid: followingId,
  });

  if (error) {
    if (error.message.includes('NOT_FOUND')) {
      throw new AppError('NOT_FOUND', 'Você não está seguindo este usuário.');
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível completar a ação de deixar de seguir.');
  }

  return { message: 'Você deixou de seguir o usuário.' };
}

export async function getFollowStats(username: string) { 
  const userId = await getUserIdByUsername(username);
  const { data, error } = await supabase
    .from('profiles')
    .select('followers_count, following_count')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Estatísticas para este usuário não foram encontradas.');
  }

  return data;
}

export async function getFollowers(username: string) {
  const userId = await getUserIdByUsername(username);

  const { data, error } = await supabase
    .from('followers')
    .select('follower:profiles!followers_follower_id_fkey(id, username, avatar_url)')
    .eq('following_id', userId);
  
  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Erro ao buscar seguidores.');
  }

  return data.map(item => item.follower);
}

export async function getFollowing(username: string) {
  const userId = await getUserIdByUsername(username);

  const { data, error } = await supabase
    .from('followers')
    .select('following:profiles!followers_following_id_fkey(username, avatar_url)')
    .eq('follower_id', userId);

  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Erro ao buscar usuários que você segue.');
  }

  return data.map(item => item.following);
}

async function getUserIdByUsername(username: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Usuário com este nome não foi encontrado.');
  }
  return data.id;
}

export async function checkFollowingStatus(followerId: string, followingUsername: string): Promise<{ isFollowing: boolean }> {
  const followingId = await getUserIdByUsername(followingUsername);

  const { data, error } = await supabase
    .from('followers')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Erro ao verificar status de seguir.');
  }

  return { isFollowing: !!data }; 
}

export async function getForumStats() {
  const [
    { count: activeMembers, error: membersError },
    { count: totalTopics, error: topicsError },
    { count: totalComments, error: commentsError },
    { data: newestMember, error: newestMemberError },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('topicos').select('*', { count: 'exact', head: true }),
    supabase.from('comentarios').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('username, role')
      .order('joined_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (membersError || topicsError || commentsError || newestMemberError) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Erro ao calcular as estatísticas do fórum.');
  }

  return {
    activeMembers: activeMembers ?? 0,
    totalTopics: totalTopics ?? 0,
    totalPosts: (totalTopics ?? 0) + (totalComments ?? 0),
    newestMember: newestMember,
  };
}

export async function getRecentPosts() {
  const { data, error } = await supabase.rpc('get_recent_posts');

  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Erro ao buscar as publicações recentes.');
  }

  return data;
}
