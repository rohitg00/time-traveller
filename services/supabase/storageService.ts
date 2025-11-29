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
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;
}
