import { supabase } from '../config/supabase';
import { AppError } from '../helpers/ApiError';
import { Topic, Comment } from '../types/topic';

function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, ''); 
  return `${slug}-${Math.floor(Math.random() * 10000)}`;
}

export async function createTopic(
  title: string,
  content: string,
  author_id: string,
  category: string
): Promise<Topic> {
  const slug = generateSlug(title);
  const { data, error } = await supabase
    .from('topicos')
    .insert([{ title: title, content: content, author_id, category, slug }])
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao criar o tópico.');
  }

  return data;
}

export async function createComment(
  content: string,
  author_id: string,
  topico_id: number
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comentarios')
    .insert([{ content: content, author_id, topico_id }])
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao criar o comentário.');
  }

  return data;
}

export async function getTopicWithComments(topicId: number) {
  const { data, error } = await supabase
    .from('topicos')
    .select(`*,profiles (username, avatar_url, role), comentarios (*,profiles (username, avatar_url, role))`)
    .eq('id', topicId)
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao buscar o tópico.');
  }

  if (!data) {
    throw new AppError('NOT_FOUND', 'Tópico não encontrado.');
  }

  return data;
}

export async function getTopicBySlugWithComments(slug: string) {
  const { data, error } = await supabase
    .from('topicos')
    .select(`*,profiles (username, avatar_url, role), comentarios (*,profiles (username, avatar_url, role))`)
    .eq('slug', slug)
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao buscar o tópico.');
  }

  if (!data) {
    throw new AppError('NOT_FOUND', 'Tópico não encontrado.');
  }

  return data;
}
