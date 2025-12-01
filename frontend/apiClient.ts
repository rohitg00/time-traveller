import { Stream } from '@motiadev/stream-client-browser';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

function getAuthToken(): string | null {
  return localStorage.getItem('tt_access_token');
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

let streamInstance: Stream | null = null;
let isConnecting = false;

function getStream(): Stream {
  if (streamInstance) {
    return streamInstance;
  }

  if (isConnecting) {
    throw new Error('Stream connection already in progress');
  }

  try {
    isConnecting = true;
    streamInstance = new Stream(WS_URL);
    return streamInstance;
  } catch (error) {
    streamInstance = null;
    throw error;
  } finally {
    isConnecting = false;
  }
}

export function resetStream(): void {
  if (streamInstance) {
    try {
      streamInstance.close();
    } catch {
    }
    streamInstance = null;
  }
}

export interface ImageConfig {
  aspectRatio: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  imageSize: '1K' | '2K' | '4K';
}

export interface TeleportRequest {
  destination: string;
  era: string;
  style: string;
  referenceImage?: string;
  coordinates?: { lat: number; lng: number };
  imageConfig?: ImageConfig;
}

export interface TeleportResponse {
  teleportId: string;
  status: string;
  message: string;
}

export interface TeleportProgress {
  id: string;
  destination: string;
  era: string;
  style: string;
  status: 'initiating' | 'generating-image' | 'generating-details' | 'synthesizing-audio' | 'completed' | 'error';
  progress: number;
  imageUrl?: string;
  imageData?: string;
  description?: string;
  mapsUri?: string;
  referenceImageUrl?: string;
  usedStreetView?: boolean;
  error?: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  destination: string;
  era: string;
  style: string;
  imageUrl?: string;
  imageData?: string;
  description: string;
  mapsUri?: string;
  referenceImageUrl?: string;
  referenceImage?: string;
  usedStreetView?: boolean;
  timestamp: number;
}

export interface AudioResponse {
  audioData?: string;
  audioUrl?: string;
}

export async function initiateTeleport(request: TeleportRequest): Promise<TeleportResponse> {
  const response = await fetch(`${API_BASE_URL}/teleport`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 401) {
      throw new Error('Please sign in to start a teleport journey');
    }
    throw new Error(error.error || 'Failed to initiate teleport');
  }

  return response.json();
}

export async function getTeleportProgress(teleportId: string): Promise<TeleportProgress> {
  const response = await fetch(`${API_BASE_URL}/teleport/${teleportId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get teleport progress');
  }

  return response.json();
}

export async function getHistory(limit: number = 10): Promise<HistoryItem[]> {
  const token = getAuthToken();
  if (!token) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/history?limit=${limit}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      return [];
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to get history');
  }

  const data = await response.json();
  return data.history;
}

export async function getAudio(teleportId: string): Promise<AudioResponse> {
  const response = await fetch(`${API_BASE_URL}/teleport/${teleportId}/audio`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Audio not yet available');
  }

  return response.json();
}

export async function parseTravelCommand(
  message: string,
  history: string[] = []
): Promise<{
  isJump: boolean;
  reply: string;
  params?: { destination: string; era: string; style: string };
}> {
  const response = await fetch(`${API_BASE_URL}/parse-command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to parse command');
  }

  return response.json();
}

export function subscribeTeleportProgress(
  teleportId: string,
  onUpdate: (progress: TeleportProgress) => void,
  onError?: (error: Error) => void
): () => void {
  let subscription: ReturnType<Stream['subscribeGroup']> | null = null;

  try {
    const stream = getStream();
    
    subscription = stream.subscribeGroup<TeleportProgress>(
      'teleportProgress',
      'active'
    );

    const changeListener = (items: TeleportProgress[] | null) => {
      if (!items) return;
      const progress = items.find(item => item.id === teleportId);
      if (progress) {
        onUpdate(progress);
      }
    };

    subscription.addChangeListener(changeListener as never);

    return () => {
      if (subscription) {
        try {
          subscription.close();
        } catch {
        }
      }
    };
  } catch (error) {
    onError?.(error as Error);
    return () => {};
  }
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  uvIndex?: number;
}

export interface AirQualityData {
  aqi: number;
  category: string;
  dominantPollutant: string;
  healthRecommendation: string;
  color: string;
}

export interface NearbyPlace {
  name: string;
  type: string;
  rating?: number;
  address?: string;
}

export interface LocationEnrichment {
  weather?: WeatherData;
  airQuality?: AirQualityData;
  nearbyPlaces?: NearbyPlace[];
}

export async function getLocationInfo(lat: number, lng: number): Promise<LocationEnrichment> {
  const response = await fetch(`${API_BASE_URL}/location/info?lat=${lat}&lng=${lng}`);

  if (!response.ok) {
    return {};
  }

  return response.json();
}
