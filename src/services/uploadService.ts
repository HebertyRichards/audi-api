import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../helpers/ApiError';

export async function uploadFile(file: Express.Multer.File): Promise<string> {
  if (!file) {
    throw new AppError('VALIDATION_ERROR', 'Nenhum ficheiro fornecido para upload.');
  }

  const filePath = `public/${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('images')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new AppError('STORAGE_ERROR', 'Falha ao fazer upload do ficheiro.');
  }

  const { data } = supabaseAdmin.storage
    .from('images')
    .getPublicUrl(filePath);

  if (!data || !data.publicUrl) {
    throw new AppError('STORAGE_ERROR', 'Não foi possível obter a URL pública do ficheiro.');
  }

  return data.publicUrl;
}
