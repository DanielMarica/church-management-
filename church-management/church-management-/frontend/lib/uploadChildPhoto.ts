import { supabase } from '@/lib/supabase';

export async function uploadChildPhoto(
  childId: string,
  file: File
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');

  if (!file.type.startsWith('image/')) throw new Error('Fichier invalide');
  if (file.size > 2 * 1024 * 1024) throw new Error('Maximum 2MB');

  const fileExt = file.name.split('.').pop();
  const filePath = `${childId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('children-photos')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage
    .from('children-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}