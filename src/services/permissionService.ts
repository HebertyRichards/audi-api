import { supabase } from '../config/supabase';
import { AppError } from '../helpers/ApiError';

export async function checkTopicCreationPermission(
  author_id: string,
  category: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_create_topic', {
    p_user_id: author_id,
    p_category_slug: category,
  });

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao verificar a permissão para criar tópico.');
  }

  return data;
}

export async function checkCommentCreationPermission(
  author_id: string,
  topic_id: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_create_comment', {
    p_user_id: author_id,
    p_topic_id: topic_id,
  });

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao verificar a permissão para criar comentário.');
  }

  return data;
}
