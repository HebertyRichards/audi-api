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
    .insert([{ title, content, author_id, category, slug }])
    .select(`
      id, title, content, author_id, category, slug,
      created:created_in,
      update:updated_in
    `)
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao criar o tópico.');
  }

  return data;
}

export async function createComment(
  content: string,
  author_id: string,
  topic_id: number
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comentarios')
    .insert([{ content, author_id, topic_id }]) 
    .select(`
      id, content, author_id,
      topico_id:topic_id,
      created:created_in
    `)
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao criar o comentário.');
  }

  return data;
}

export async function getTopicWithComments(topicId: number) {
  return getTopicByField('id', topicId);
}

export async function getTopicBySlugWithComments(slug: string) {
  return getTopicByField('slug', slug);
}

export async function deleteTopic(topicId: number, userId: string): Promise<void> {
    const { error, count } = await supabase
      .from('topicos')
      .delete()
      .match({ id: topicId, author_id: userId });
  
    if (error) {
      throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao deletar o tópico.');
    }
  
    if (count === 0) {
      throw new AppError('NOT_FOUND', 'Tópico não encontrado ou você não tem permissão para deletá-lo.');
    }
}

async function getTopicByField(field: 'id' | 'slug', value: number | string) {
  const query = `
    id, title, content, author_id, category, slug,
    created:created_in,
    update:updated_in,
    profiles (username, avatar_url, role),
    comentarios (
      id, content, author_id,
      topico_id:topic_id,
      created:created_in,
      profiles (username, avatar_url, role)
    )
  `;
  const { data, error } = await supabase
    .from('topicos')
    .select(query)
    .eq(field, value)
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao buscar o tópico.');
  }

  if (!data) {
    throw new AppError('NOT_FOUND', 'Tópico não encontrado.');
  }

  return data;
}

export async function updateTopic(
  topicId: number,
  userId: string,
  updates: { title?: string; content?: string }
): Promise<Topic> {
  const { data, error } = await supabase
    .from('topicos')
    .update({ ...updates, updated_in: new Date() })
    .match({ id: topicId, author_id: userId })
    .select(`
      id, title, content, author_id, category, slug,
      created:created_in,
      update:updated_in
    `)
    .single();

  if (error || !data) {
    throw new AppError('UPDATE_ERROR', 'Não foi possível atualizar o tópico. Verifique suas permissões.');
  }

  return data;
}
