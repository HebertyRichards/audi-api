
import { supabase } from "../config/supabase";
import { AppError } from "../helpers/ApiError";
import dotenv from "dotenv"

dotenv.config();
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
