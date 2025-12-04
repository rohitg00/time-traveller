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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function uploadImage(
  teleportId: string,
  imageType: 'generated' | 'reference',
  base64Data: string,
  maxRetries: number = 3
): Promise<string> {
  const client = getSupabaseClient();
  
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Clean, 'base64');
  const timestamp = Date.now();
  const filename = `${teleportId}/${imageType}-${timestamp}.jpg`;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await client.storage
        .from(BUCKET_NAME)
        .upload(filename, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      const { data: urlData } = client.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filename);
      
      return urlData.publicUrl;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await sleep(delay);
      }
    }
  }
  
  throw new Error(`Failed to upload image after ${maxRetries} attempts: ${lastError?.message}`);
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
  base64Data: string,
  maxRetries: number = 3
): Promise<string> {
  const client = getSupabaseClient();
  
  const buffer = Buffer.from(base64Data, 'base64');
  const timestamp = Date.now();
  const filename = `${teleportId}/audio-${timestamp}.wav`;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await client.storage
        .from(AUDIO_BUCKET_NAME)
        .upload(filename, buffer, {
          contentType: 'audio/wav',
          upsert: true
        });
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
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
        console.warn('Failed to store audio URL in database:', dbError.message);
      }
      
      return audioUrl;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await sleep(delay);
      }
    }
  }
  
  throw new Error(`Failed to upload audio after ${maxRetries} attempts: ${lastError?.message}`);
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
