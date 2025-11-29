import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client from environment variables
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

/**
 * Uploads a base64 image to Supabase Storage and returns the public URL
 */
export async function uploadImage(
  teleportId: string,
  imageType: 'generated' | 'reference',
  base64Data: string
): Promise<string> {
  const client = getSupabaseClient();
  
  // Remove data URL prefix if present
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert base64 to buffer
  const buffer = Buffer.from(base64Clean, 'base64');
  
  // Generate unique filename
  const timestamp = Date.now();
  const filename = `${teleportId}/${imageType}-${timestamp}.jpg`;
  
  // Upload to Supabase Storage
  const { error } = await client.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: true
    });
  
  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);
  
  return urlData.publicUrl;
}

/**
 * Uploads a reference image and returns the public URL
 */
export async function uploadReferenceImage(
  teleportId: string,
  base64Data: string
): Promise<string> {
  return uploadImage(teleportId, 'reference', base64Data);
}

/**
 * Uploads a generated image and returns the public URL
 */
export async function uploadGeneratedImage(
  teleportId: string,
  base64Data: string
): Promise<string> {
  return uploadImage(teleportId, 'generated', base64Data);
}

/**
 * Deletes all images for a teleport session
 */
export async function deleteImages(teleportId: string): Promise<void> {
  const client = getSupabaseClient();
  
  // List all files in the teleport folder
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

/**
 * Uploads a base64 audio file to Supabase Storage and returns the public URL
 * Also stores the URL in the teleport_audio table for reliable retrieval
 */
export async function uploadAudio(
  teleportId: string,
  base64Data: string
): Promise<string> {
  const client = getSupabaseClient();
  
  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Generate unique filename
  const timestamp = Date.now();
  const filename = `${teleportId}/audio-${timestamp}.wav`;
  
  // Upload to Supabase Storage
  const { error } = await client.storage
    .from(AUDIO_BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: 'audio/wav',
      upsert: true
    });
  
  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = client.storage
    .from(AUDIO_BUCKET_NAME)
    .getPublicUrl(filename);
  
  const audioUrl = urlData.publicUrl;
  
  // Store URL in database for reliable retrieval
  const { error: dbError } = await client
    .from('teleport_audio')
    .upsert({
      teleport_id: teleportId,
      audio_url: audioUrl
    });
  
  if (dbError) {
    // Log but don't fail - audio is still uploaded
    console.warn('Failed to store audio URL in database:', dbError.message);
  }
  
  return audioUrl;
}

/**
 * Gets the audio URL for a teleport from the database
 */
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

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;
}
