import { supabase } from '../config/supabase';
import { AppError } from '../helpers/ApiError';
import { Category } from '../types/topic';

export async function categoryExists(slug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('categorias')
    .select('slug')
    .eq('slug', slug)
    .single();
  
  return !error && data !== null;
}

export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('slug, name');

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Não foi possível buscar as categorias.');
  }

  return data || [];
}

export async function getTopicsByCategory(categorySlug: string, page: number, limit: number = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { count, error: countError } = await supabase
    .from('topicos')
    .select('*', { count: 'exact', head: true })
    .eq('category', categorySlug);

  if (countError) {
    throw new AppError('DATABASE_ERROR', 'Não foi possível contar os tópicos da categoria.');
  }

  const { data, error } = await supabase
    .from('topicos')
    .select(`
      title, 
      slug, 
      created_in,
      profiles ( username, avatar_url ),
      comentarios ( count )
    `)
    .eq('category', categorySlug)
    .order('created_in', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError('DATABASE_ERROR', 'Não foi possível buscar os tópicos da categoria.');
  }

  if (!data || data.length === 0 && page > 1) {
    throw new AppError('NOT_FOUND', 'Não há mais tópicos para mostrar.');
  }

  return { data: data || [], totalCount: count ?? 0 };
}
