/**
 * API Client for Time Traveller Motia Backend
 * All API calls to the Motia backend should go through this client
 */
import { Stream } from '@motiadev/stream-client-browser';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

/**
 * Get the auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('tt_access_token');
}

/**
 * Get headers with auth token if available
 */
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

// Lazy singleton stream connection
let streamInstance: Stream | null = null;
let isConnecting = false;

function getStream(): Stream {
  // Return existing connection if available
  if (streamInstance) {
    return streamInstance;
  }

  // Prevent multiple simultaneous connection attempts
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

// Reset stream connection (for reconnection scenarios)
export function resetStream(): void {
  if (streamInstance) {
    try {
      streamInstance.close();
    } catch {
      // Ignore errors during close
    }
    streamInstance = null;
  }
}

export interface TeleportRequest {
  destination: string;
  era: string;
  style: string;
  referenceImage?: string; // Re-enabled - will be uploaded to Supabase
  coordinates?: { lat: number; lng: number };
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
  imageUrl?: string; // URL from Supabase instead of base64
  imageData?: string; // Fallback for local dev (base64)
  description?: string;
  mapsUri?: string;
  referenceImageUrl?: string; // URL from Supabase
  usedStreetView?: boolean;
  error?: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  destination: string;
  era: string;
  style: string;
  imageUrl?: string; // URL from Supabase
  imageData?: string; // Fallback for local dev (base64)
  description: string;
  mapsUri?: string;
  referenceImageUrl?: string; // URL from Supabase
  referenceImage?: string; // Client-side only (local storage)
  usedStreetView?: boolean;
  timestamp: number;
}

export interface AudioResponse {
  audioData?: string; // base64 for local dev
  audioUrl?: string;  // URL from Supabase for production
}

/**
 * Initiates a new teleportation sequence
 * Requires authentication for data isolation
 */
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

/**
 * Gets the current progress of a teleportation
 * Can be polled or used with streams
 */
export async function getTeleportProgress(teleportId: string): Promise<TeleportProgress> {
  const response = await fetch(`${API_BASE_URL}/teleport/${teleportId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get teleport progress');
  }

  return response.json();
}

/**
 * Gets the teleportation history for the authenticated user
 * Requires authentication - returns only user's own data
 */
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

/**
 * Gets the synthesized audio for a teleportation
 */
export async function getAudio(teleportId: string): Promise<AudioResponse> {
  const response = await fetch(`${API_BASE_URL}/teleport/${teleportId}/audio`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Audio not yet available');
  }

  return response.json();
}

/**
 * Parses a natural language travel command
 */
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

/**
 * Subscribes to teleport progress using Motia's stream client
 * Returns cleanup function to unsubscribe
 * Falls back to polling if stream connection fails
 */
export function subscribeTeleportProgress(
  teleportId: string,
  onUpdate: (progress: TeleportProgress) => void,
  onError?: (error: Error) => void
): () => void {
  let subscription: ReturnType<Stream['subscribeGroup']> | null = null;

  try {
    const stream = getStream();
    
    // Subscribe to the 'active' group in the teleportProgress stream
    subscription = stream.subscribeGroup<TeleportProgress>(
      'teleportProgress',  // stream name
      'active'             // groupId where teleports are stored
    );

    // Listen for changes and filter for our specific teleportId
    const changeListener = (items: TeleportProgress[] | null) => {
      if (!items) return;
      const progress = items.find(item => item.id === teleportId);
      if (progress) {
        onUpdate(progress);
      }
    };

    subscription.addChangeListener(changeListener as never);

    // Return cleanup function
    return () => {
      if (subscription) {
        try {
          subscription.close();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  } catch (error) {
    onError?.(error as Error);
    return () => {};
  }
}

// Location Enrichment Types
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

/**
 * Gets weather, air quality, and nearby places for a location
 */
export async function getLocationInfo(lat: number, lng: number): Promise<LocationEnrichment> {
  const response = await fetch(`${API_BASE_URL}/location/info?lat=${lat}&lng=${lng}`);

  if (!response.ok) {
    return {};
  }

  return response.json();
}
