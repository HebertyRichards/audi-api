import { supabase } from '../config/supabase';
import { AppError } from '../helpers/ApiError';
import { Topic, Comment } from '../types/topic';
import * as categoryService from './categoryService';

function generateSlug(title: string): string {
  const slugBase = title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, ''); 
  return `${slugBase}-${Date.now()}`; 
}

export async function createTopic(
  title: string,
  content: string,
  author_id: string,
  category: string 
): Promise<Topic> {
  const isValidCategory = await categoryService.categoryExists(category);
  if (!isValidCategory) {
    throw new AppError('VALIDATION_ERROR', `A categoria '${category}' não é válida.`);
  }

  const slug = generateSlug(title);
  const { data, error } = await supabase
    .from('topicos')
    .insert([{ title, content, author_id, category, slug }])
    .select(`id, title, content, author_id, category, slug, created_in, updated_in`)
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
    .select(`*, profiles (username, avatar_url, role)`)
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

export async function deleteComment(commentId: number, userId: string): Promise<void> {
  const { error } = await supabase
    .from('comentarios')
    .delete()
    .match({ id: commentId, author_id: userId });

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao deletar o comentário.');
  }
}

async function getTopicByField(field: 'id' | 'slug', value: number | string) {
  const query = `
    id, title, content, author_id, category, slug, created_in, updated_in,
    profiles (username, avatar_url, role),
    comentarios (id, content, author_id, topic_id, created_in, profiles (username, avatar_url, role))`;
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
      id, title, content, author_id, category, slug, created_in, updated_in`)
    .single();

  if (error || !data) {
    throw new AppError('UPDATE_ERROR', 'Não foi possível atualizar o tópico. Verifique suas permissões.');
  }

  return data;
}

export async function updateComment(commentId: number, userId:string, content: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comentarios')
    .update({ content: content, updated_in: new Date() }) 
    .match({ id: commentId, author_id: userId }) 
    .select(`*, profiles (username, avatar_url, role)`)
    .single(); 

  if (error || !data) {
    console.error('Erro ao atualizar comentário:', error);
    throw new AppError('UPDATE_ERROR', 'Não foi possível atualizar o comentário. Verifique suas permissões ou se o comentário existe.');
  }

  return data;
}
