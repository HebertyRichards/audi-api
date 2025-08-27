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

