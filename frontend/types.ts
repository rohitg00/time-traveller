
export type TeleportState = 'idle' | 'teleporting' | 'arrived' | 'error';

export interface TravelLogItem {
  id: string;
  destination: string;
  era: string;
  style: string;
  timestamp: number;
  imageData: string; // URL from Supabase or Base64 (fallback)
  description: string;
  mapsUri?: string; // Link to Google Maps/Street View
  referenceImage?: string; // URL from Supabase or Base64 (user photo)
  usedStreetView?: boolean; // Whether Street View imagery was used
}

/**
 * Helper to get proper image source (handles both URLs and base64)
 */
export function getImageSrc(imageData: string | undefined): string {
  if (!imageData) return '';
  if (imageData.startsWith('http')) return imageData;
  if (imageData.startsWith('data:')) return imageData;
  return `data:image/jpeg;base64,${imageData}`;
}

export interface TeleportResult {
  imageData: string;
  description: string;
  mapsUri?: string;
  usedStreetView?: boolean;
}

export enum LocationStyle {
  REALISTIC = 'Photorealistic',
  CYBERPUNK = 'Cyberpunk/Sci-Fi',
  VINTAGE = 'Vintage Film',
  PAINTING = 'Oil Painting',
  SURREAL = 'Surrealist Dream',
}

