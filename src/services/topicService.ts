import { supabaseAdmin as supabase } from '../config/supabase';
import { AppError } from '../helpers/ApiError';
import { Topic, Comment } from '../types/topic';
import * as categoryService from './categoryService';
import * as uploadService from './uploadService'

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
  category: string,
  images?: string[]
): Promise<Topic> {
  const isValidCategory = await categoryService.categoryExists(category);
  if (!isValidCategory) {
    throw new AppError('VALIDATION_ERROR', `A categoria '${category}' não é válida.`);
  }

  const { data: canCreate, error: rpcError } = await supabase.rpc('can_create_topic', {
    p_user_id: author_id,
    p_category_slug: category,
  });

  if (rpcError) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao verificar as permissões.');
  }
  if (!canCreate) {
    throw new AppError('FORBIDDEN_ERROR', 'Você não tem permissão para criar tópicos nesta categoria.');
  }

  const slug = generateSlug(title);
  const { data: topicData, error: topicError } = await supabase
    .from('topicos')
    .insert([{ title, content, author_id, category, slug }])
    .select()
    .single();

  if (topicError || !topicData) {
    throw new AppError('DATABASE_ERROR', 'Erro ao criar tópico.');
  }

  if (images && images.length > 0) {
    const imagesToInsert = images.map(url => ({
      url,
      topic_id: topicData.id,
      author_id,
    }));
    const { error: imageError } = await supabase.from('imagens').insert(imagesToInsert);
    if (imageError) {
      throw new AppError('DATABASE_ERROR', 'Erro ao salvar imagens do tópico.');
    }
  }

  return topicData;
}

export async function createComment(
  content: string,
  author_id: string,
  topic_id: number,
  images?: string[]
): Promise<Comment> {
  const { data: canComment, error: rpcError } = await supabase.rpc('can_create_comment', {
    p_user_id: author_id,
    p_topic_id: topic_id
  });

  if (rpcError) {
      throw new AppError('DATABASE_ERROR', 'Erro ao verificar permissões de comentário.');
  }
  if (!canComment) {
      throw new AppError('FORBIDDEN_ERROR', 'Você não tem permissão para comentar neste tópico.');
  }

  const { data: commentData, error: commentError } = await supabase
    .from('comentarios')
    .insert([{ content, author_id, topic_id }])
    .select()
    .single();

  if (commentError || !commentData) {
    throw new AppError('DATABASE_ERROR', 'Erro ao criar comentário.');
  }

  if (images && images.length > 0) {
    const imagesToInsert = images.map(url => ({
      url,
      comment_id: commentData.id,
      author_id,
    }));
    const { error: imageError } = await supabase.from('imagens').insert(imagesToInsert);
    if (imageError) {
      throw new AppError('DATABASE_ERROR', 'Erro ao salvar imagens do comentário.');
    }
  }

  const { data: fullComment, error: fetchError } = await supabase
    .from('comentarios')
    .select(`*, profiles (username, avatar_url, role), imagens(id, url)`)
    .eq('id', commentData.id)
    .single();

  if (fetchError || !fullComment) {
    throw new AppError('DATABASE_ERROR', 'Erro ao buscar dados completos do comentário.');
  }
  
  return fullComment;
}

export async function getTopicWithComments(topicId: number) {
    return getTopicByField('id', topicId);
}

export async function getTopicBySlugWithComments(slug: string) {
    return getTopicByField('slug', slug);
}

export async function deleteTopic(topicId: number, userId: string): Promise<void> {
  const { data: images, error: imageError } = await supabase
    .from('imagens')
    .select('url')
    .eq('topic_id', topicId);

  if (imageError) {
      throw new AppError('DATABASE_ERROR', 'Falha ao buscar imagens do tópico para deletar.');
  }

  if (images && images.length > 0) {
      const deletePromises = images.map(image => uploadService.deleteFile(image.url));
      await Promise.all(deletePromises);
  }

  const { error } = await supabase
    .from('topicos')
    .delete()
    .match({ id: topicId, author_id: userId });

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao deletar o tópico.');
  }
}

export async function deleteComment(commentId: number, userId: string): Promise<void> {
  const { data: images, error: imageError } = await supabase
      .from('imagens')
      .select('url')
      .eq('comment_id', commentId);

  if (imageError) {
      throw new AppError('DATABASE_ERROR', 'Falha ao buscar imagens do comentário para deletar.');
  }

  if (images && images.length > 0) {
      const deletePromises = images.map(image => uploadService.deleteFile(image.url));
      await Promise.all(deletePromises);
  }

  const { error } = await supabase
  .from('comentarios')
  .delete()
  .match({ id: commentId, author_id: userId });

if (error) {
  throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao deletar o comentário.');
}
}

async function getTopicByField(field: 'id' | 'slug', value: number | string): Promise<Topic> {
  const query = `
    title, content, author_id, category, slug, created_in, updated_in,
    profiles (username, avatar_url, role),
    imagens (id, url),
    comentarios (id, content, author_id, topic_id, created_in, profiles (username, avatar_url, role))
  `;

  const { data, error } = await supabase
    .from('topicos')
    .select(query)
    .eq(field, value)
    .order('created_in', { foreignTable: 'comentarios', ascending: true })
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Ocorreu um erro ao buscar o tópico no banco de dados.');
  }

  if (!data) {
    throw new AppError('NOT_FOUND', 'Tópico não encontrado.');
  }

  return data as unknown as Topic;
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
    .select()
    .single();

  if (error || !data) {
    throw new AppError('UPDATE_ERROR', 'Não foi possível atualizar o tópico.');
  }
  return data;
}

export async function updateComment(commentId: number, userId:string, content: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comentarios')
    .update({ content: content, updated_in: new Date() }) 
    .match({ id: commentId, author_id: userId }) 
    .select(`*, profiles (username, avatar_url, role), imagens(id, url)`)
    .single(); 

  if (error || !data) {
    throw new AppError('UPDATE_ERROR', 'Não foi possível atualizar o comentário.');
  }

  return data;
}
