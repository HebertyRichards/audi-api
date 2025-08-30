import { supabase } from "../config/supabase";
import { getUserIdByUsername } from "./followService";
import { getForumStats } from "./forumService";
import { AppError } from '../helpers/ApiError';
import dotenv from 'dotenv';

dotenv.config();

export async function getUserStats(username: string) {
    const userId = await getUserIdByUsername(username);
  
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('joined_at, mensagens_count, followers_count, last_login')
      .eq('id', userId)
      .single();
  
    if (profileError || !profile) {
      throw new AppError('NOT_FOUND', 'Perfil não encontrado.');
    }
  
    const { data: lastTopic, error: topicsError } = await supabase
      .from('topicos')
      .select('created_in')
      .eq('author_id', userId)
      .order('created_in', { ascending: false })
      .limit(1);
  
    if (topicsError) {
      throw new AppError('DATABASE_ERROR', 'Erro ao buscar tópicos do usuário.');
    }
  
    const { data: lastComment, error: commentsError } = await supabase
      .from('comentarios')
      .select('created_in')
      .eq('author_id', userId)
      .order('created_in', { ascending: false })
      .limit(1);
  
    if (commentsError) {
      throw new AppError('DATABASE_ERROR', 'Erro ao buscar comentários do usuário.');
    }
  
    const { count: topicsCount, error: countError } = await supabase
      .from('topicos')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId);
    
    if (countError) {
      throw new AppError('DATABASE_ERROR', 'Erro ao contar tópicos do usuário.');
    }
  
    const { totalTopics, totalPosts } = await getForumStats();
    const memberSince = new Date(profile.joined_at);
    const daysAsMember = (new Date().getTime() - memberSince.getTime()) / (1000 * 3600 * 24);
  
    const topicsPerDay = daysAsMember > 0 ? ((topicsCount ?? 0) / daysAsMember).toFixed(2) : 0;
    const topicsPercentage = totalTopics > 0 ? (((topicsCount ?? 0) / totalTopics) * 100).toFixed(2) : 0;
    const lastTopicDate = lastTopic && lastTopic.length > 0 ? lastTopic[0].created_in : null;
  
    const messagesCount = profile.mensagens_count;
    const messagesPerDay = daysAsMember > 0 ? (messagesCount / daysAsMember).toFixed(2) : 0;
    const messagesPercentage = totalPosts > 0 ? ((messagesCount / totalPosts) * 100).toFixed(2) : 0;
  
    const lastCommentDate = lastComment && lastComment.length > 0 ? lastComment[0].created_in : null;
    const lastPostDate = lastTopicDate && lastCommentDate ? new Date(Math.max(new Date(lastTopicDate).getTime(), new Date(lastCommentDate).getTime())) : lastTopicDate || lastCommentDate;
  
    return {
      topicsCount: topicsCount ?? 0,
      topicsPerDay,
      topicsPercentage,
      lastTopicDate,
      messagesCount,
      messagesPerDay,
      messagesPercentage,
      lastPostDate,
      followersCount: profile.followers_count,
      memberSince: profile.joined_at,
      lastLogin: profile.last_login,
    };
  }

  export async function getTopicsByAuthor(username: string) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();
  
    if (profileError || !profile) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado para buscar os tópicos.');
    }
  
    const authorId = profile.id;

    const { data, error } = await supabase
      .from('topicos')
      .select(`
        id, 
        title, 
        slug, 
        created_in,
        profiles ( username, avatar_url ),
        comentarios ( count )
      `)
      .eq('author_id', authorId)
      .order('created_in', { ascending: false });
  
    if (error) {
      console.error("Supabase error getting topics:", error);
      throw new AppError('DATABASE_ERROR', 'Não foi possível buscar os tópicos do usuário.');
    }
  
    return data || [];
  }
  