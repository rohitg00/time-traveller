/**
 * API Client for Time Traveller Motia Backend
 * All API calls to the Motia backend should go through this client
 */
import { Stream } from '@motiadev/stream-client-browser';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

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
    console.log('[Stream] Initializing connection to:', WS_URL);
    
    // Initialize stream connection (callback handled internally)
    streamInstance = new Stream(WS_URL);
    
    console.log('[Stream] WebSocket connection initialized');
    return streamInstance;
  } catch (error) {
    console.warn('[Stream] Failed to initialize:', error);
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
      console.log('[Stream] Connection closed');
    } catch (e) {
      // Ignore errors during close
    }
    streamInstance = null;
  }
}

export interface TeleportRequest {
  destination: string;
  era: string;
  style: string;
  // NOTE: referenceImage is NOT sent to backend due to Motia Cloud state size limits
  // The reference image is kept client-side only for display in the history
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
  imageData?: string;
  description?: string;
  mapsUri?: string;
  usedStreetView?: boolean;
  error?: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  destination: string;
  era: string;
  style: string;
  imageData: string;
  description: string;
  mapsUri?: string;
  referenceImage?: string;
  usedStreetView?: boolean;
  timestamp: number;
}

export interface AudioResponse {
  audioData: string;
}

/**
 * Initiates a new teleportation sequence
 */
export async function initiateTeleport(request: TeleportRequest): Promise<TeleportResponse> {
  const response = await fetch(`${API_BASE_URL}/teleport`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
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
 * Gets the teleportation history
 */
export async function getHistory(limit: number = 10): Promise<HistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/history?limit=${limit}`);

  if (!response.ok) {
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
        console.log('[Stream] Progress update received:', progress.status, progress.progress + '%');
        onUpdate(progress);
      }
    };

    subscription.addChangeListener(changeListener as never);

    console.log('[Stream] Subscribed to teleport:', teleportId);

    // Return cleanup function
    return () => {
      if (subscription) {
        try {
          subscription.close();
          console.log('[Stream] Unsubscribed from teleport:', teleportId);
        } catch (e) {
          // Ignore cleanup errors - connection might already be closed
        }
      }
    };
  } catch (error) {
    console.warn('[Stream] WebSocket unavailable, falling back to polling:', error);
    // Notify caller to use polling fallback
    onError?.(error as Error);
    // Return no-op cleanup
    return () => {};
  }
}

