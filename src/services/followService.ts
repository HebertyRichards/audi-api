import { supabase }from '../config/supabase';
import { AppError } from '../helpers/ApiError';
import dotenv from 'dotenv';

dotenv.config();

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

export async function getUserIdByUsername(username: string): Promise<string> {
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

export async function removeFollower(removerId: string, followerUsername: string) {
  const followerId = await getUserIdByUsername(followerUsername);

  if (removerId === followerId) {
    throw new AppError('BAD_REQUEST', 'Ação inválida.');
  }

  const { error, count } = await supabase
    .from('followers')
    .delete()
    .match({
      follower_id: followerId,
      following_id: removerId,
    });

  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Não foi possível remover o seguidor.');
  }

  if (count === 0) {
    throw new AppError('NOT_FOUND', 'Este usuário não está te seguindo ou a ação não foi permitida.');
  }

  return { message: 'Seguidor removido com sucesso!' };
}
