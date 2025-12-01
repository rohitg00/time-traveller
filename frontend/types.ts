
export type TeleportState = 'idle' | 'teleporting' | 'arrived' | 'error';

// Image configuration options based on Gemini API capabilities
// https://ai.google.dev/gemini-api/docs/image-generation
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';

export interface ImageConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

export const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string; description: string }[] = [
  { value: '1:1', label: '1:1', description: 'Square - Perfect for social media posts' },
  { value: '16:9', label: '16:9', description: 'Widescreen - Cinematic, desktop wallpapers' },
  { value: '9:16', label: '9:16', description: 'Portrait - Mobile wallpapers, stories' },
  { value: '4:3', label: '4:3', description: 'Classic - Traditional photo format' },
  { value: '3:4', label: '3:4', description: 'Portrait Classic - Vertical photos' },
  { value: '3:2', label: '3:2', description: 'DSLR Standard - Professional photography' },
  { value: '2:3', label: '2:3', description: 'Portrait DSLR - Vertical professional' },
  { value: '21:9', label: '21:9', description: 'Ultra-wide - Panoramic cinematic' },
  { value: '4:5', label: '4:5', description: 'Instagram Portrait - Social media optimized' },
  { value: '5:4', label: '5:4', description: 'Large Format - Traditional large prints' },
];

export const IMAGE_SIZE_OPTIONS: { value: ImageSize; label: string; description: string; resolution: string }[] = [
  { value: '1K', label: '1K', description: 'Fast - Good for previews', resolution: '~1024px' },
  { value: '2K', label: '2K', description: 'Balanced - High quality (Default)', resolution: '~2048px' },
  { value: '4K', label: '4K', description: 'Maximum - Ultra HD (Slower)', resolution: '~4096px' },
];

export const DEFAULT_IMAGE_CONFIG: ImageConfig = {
  aspectRatio: '16:9',
  imageSize: '2K',
};

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
  DISPOSABLE = 'Disposable Camera',
  PHOTOBOOK = 'Photo Book',
  AERIAL = 'Aerial/Drone View',
  CINEMATIC_GRID = 'Cinematic 9-Shot Grid',
  CCTV = 'CCTV Surveillance',
  WEATHER_REALTIME = 'Real-time Weather',
  LIGHT_LEAK = 'Light Leak/Retro Fail',
  HYPER_CANDID = 'Hyper-Realistic Candid',
}

