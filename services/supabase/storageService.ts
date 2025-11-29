import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables are required');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

const BUCKET_NAME = 'time-traveller-images';
const AUDIO_BUCKET_NAME = 'time-traveller-audio';

export async function uploadImage(
  teleportId: string,
  imageType: 'generated' | 'reference',
  base64Data: string
): Promise<string> {
  const client = getSupabaseClient();
  
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Clean, 'base64');
  const timestamp = Date.now();
  const filename = `${teleportId}/${imageType}-${timestamp}.jpg`;
  
  const { error } = await client.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: true
    });
  
  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  const { data: urlData } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);
  
  return urlData.publicUrl;
}

export async function uploadReferenceImage(
  teleportId: string,
  base64Data: string
): Promise<string> {
  return uploadImage(teleportId, 'reference', base64Data);
}

export async function uploadGeneratedImage(
  teleportId: string,
  base64Data: string
): Promise<string> {
  return uploadImage(teleportId, 'generated', base64Data);
}

export async function deleteImages(teleportId: string): Promise<void> {
  const client = getSupabaseClient();
  
  const { data: files, error: listError } = await client.storage
    .from(BUCKET_NAME)
    .list(teleportId);
  
  if (listError || !files || files.length === 0) {
    return;
  }
  
  const filePaths = files.map(f => `${teleportId}/${f.name}`);
  
  await client.storage
    .from(BUCKET_NAME)
    .remove(filePaths);
}

export async function uploadAudio(
  teleportId: string,
  base64Data: string
): Promise<string> {
  const client = getSupabaseClient();
  
  const buffer = Buffer.from(base64Data, 'base64');
  const timestamp = Date.now();
  const filename = `${teleportId}/audio-${timestamp}.wav`;
  
  const { error } = await client.storage
    .from(AUDIO_BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: 'audio/wav',
      upsert: true
    });
  
  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }
  
  const { data: urlData } = client.storage
    .from(AUDIO_BUCKET_NAME)
    .getPublicUrl(filename);
  
  const audioUrl = urlData.publicUrl;
  
  const { error: dbError } = await client
    .from('teleport_audio')
    .upsert({
      teleport_id: teleportId,
      audio_url: audioUrl
    });
  
  if (dbError) {
  }
  
  return audioUrl;
}

export async function getAudioUrl(teleportId: string): Promise<string | null> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('teleport_audio')
    .select('audio_url')
    .eq('teleport_id', teleportId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.audio_url;
}

export function isSupabaseConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;
}
