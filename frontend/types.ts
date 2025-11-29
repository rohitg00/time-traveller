
export type TeleportState = 'idle' | 'teleporting' | 'arrived' | 'error';

export interface TravelLogItem {
  id: string;
  destination: string;
  era: string;
  style: string;
  timestamp: number;
  imageData: string;
  description: string;
  mapsUri?: string;
  referenceImage?: string;
  usedStreetView?: boolean;
}

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

