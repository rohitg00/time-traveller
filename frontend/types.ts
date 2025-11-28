
export type TeleportState = 'idle' | 'teleporting' | 'arrived' | 'error';

export interface TravelLogItem {
  id: string;
  destination: string;
  era: string;
  style: string;
  timestamp: number;
  imageData: string; // Base64
  description: string;
  mapsUri?: string; // Link to Google Maps/Street View
  referenceImage?: string; // The user photo used for this generation
  usedStreetView?: boolean; // Whether Street View imagery was used
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

