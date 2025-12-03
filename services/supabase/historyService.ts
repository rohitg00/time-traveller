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

export interface HistoryItem {
  id: string;
  user_id: string;
  destination: string;
  era: string;
  style: string;
  image_url?: string;
  description?: string;
  maps_uri?: string;
  reference_image_url?: string;
  used_street_view?: boolean;
  created_at?: string;
}

export interface HistoryItemResponse {
  id: string;
  destination: string;
  era: string;
  style: string;
  imageUrl?: string;
  description: string;
  mapsUri?: string;
  referenceImageUrl?: string;
  usedStreetView?: boolean;
  timestamp: number;
}

export async function saveHistory(item: HistoryItem): Promise<void> {
  const client = getSupabaseClient();
  
  const { error } = await client
    .from('teleport_history')
    .upsert({
      id: item.id,
      user_id: item.user_id,
      destination: item.destination,
      era: item.era,
      style: item.style,
      image_url: item.image_url,
      description: item.description,
      maps_uri: item.maps_uri,
      reference_image_url: item.reference_image_url,
      used_street_view: item.used_street_view,
    });
  
  if (error) {
    throw new Error(`Failed to save history: ${error.message}`);
  }
}

export async function getHistory(userId: string, limit: number = 100): Promise<HistoryItemResponse[]> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('teleport_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to get history: ${error.message}`);
  }
  
  return (data || []).map((item: HistoryItem) => ({
    id: item.id,
    destination: item.destination,
    era: item.era,
    style: item.style,
    imageUrl: item.image_url,
    description: item.description || '',
    mapsUri: item.maps_uri,
    referenceImageUrl: item.reference_image_url,
    usedStreetView: item.used_street_view,
    timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
  }));
}

export async function deleteHistoryItem(id: string, userId: string): Promise<void> {
  const client = getSupabaseClient();
  
  const { error } = await client
    .from('teleport_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) {
    throw new Error(`Failed to delete history item: ${error.message}`);
  }
}

export function isSupabaseConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;
}

