
import React, { useState, useEffect } from 'react';
import { TeleportState, TravelLogItem } from './types';
import * as api from './apiClient';
import { decodeAudioData, decodeBase64 } from './audioUtils';
import { ControlPanel } from './components/ControlPanel';
import { ViewScreen } from './components/ViewScreen';
import { HistoryLog } from './components/HistoryLog';
import { Header } from './components/Header';
import { Starfield } from './components/Starfield';
import { AuthBanner } from './components/AuthBanner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertCircle, Lock, Zap } from 'lucide-react';

// Main app content that uses auth
const AppContent: React.FC = () => {
  const { user, loading: authLoading, isAuthConfigured } = useAuth();
  const [teleportState, setTeleportState] = useState<TeleportState>('idle');
  const [currentLocation, setCurrentLocation] = useState<TravelLogItem | null>(null);
  const [history, setHistory] = useState<TravelLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [weatherCondition, setWeatherCondition] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check for API Key selection on load
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // Fallback for dev environments without the wrapper
        setHasApiKey(true); 
      }
    };
    checkKey();
  }, []);

  // Load history - from server if authenticated, from localStorage if not
  useEffect(() => {
    const loadHistory = async () => {
      if (authLoading) return; // Wait for auth to load
      
      if (user && isAuthConfigured) {
        // Authenticated: load from server (user-specific data)
        try {
          const serverHistory = await api.getHistory(10);
          // Convert server format to local format
          const formattedHistory: TravelLogItem[] = serverHistory.map(item => ({
            ...item,
            imageData: item.imageUrl || item.imageData || '', // Handle both URL and base64
            referenceImage: item.referenceImageUrl || item.referenceImage,
          }));
          setHistory(formattedHistory);
        } catch {
          // Fallback to localStorage
          loadLocalHistory();
        }
      } else {
        // Not authenticated: use localStorage
        loadLocalHistory();
      }
    };

    const loadLocalHistory = () => {
      try {
        const savedHistory = localStorage.getItem('time-traveller-history');
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory) as TravelLogItem[];
          setHistory(parsed.slice(0, 10)); // Keep last 10 items
        }
      } catch {
        // Failed to load from localStorage
      }
    };

    loadHistory();
  }, [user, authLoading, isAuthConfigured]);

  // Save history to localStorage whenever it changes (only if not authenticated)
  useEffect(() => {
    // If authenticated, history is stored on server
    if (user && isAuthConfigured) return;
    
    if (history.length > 0) {
      try {
        // Don't store referenceImage in localStorage to save space
        const historyToSave = history.map(item => ({
          ...item,
          referenceImage: undefined // Remove large reference images
        }));
        localStorage.setItem('time-traveller-history', JSON.stringify(historyToSave));
      } catch {
        // Failed to save to localStorage
      }
    }
  }, [history, user, isAuthConfigured]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        const success = await window.aistudio.openSelectKey();
        // Assume success if no error thrown, or check return if supported
        setHasApiKey(true);
        setError(null);
      } catch {
        // Key selection cancelled or failed
      }
    }
  };

  const handleTeleport = async (destination: string, era: string, style: string, referenceImage?: string, coordinates?: { lat: number, lng: number }) => {
    setTeleportState('teleporting');
    setError(null);
    setIsAudioPlaying(false);
    
    // Stop any playing audio
    if (audioContext && audioContext.state === 'running') {
      audioContext.close();
      setAudioContext(null);
    }

    try {
      // Initiate teleport via Motia API
      // referenceImage is now sent and uploaded to Supabase on the backend
      const response = await api.initiateTeleport({
        destination,
        era,
        style,
        referenceImage, // Re-enabled - uploaded to Supabase
        coordinates
      });

      const teleportId = response.teleportId;

      // Subscribe to real-time progress updates via Motia streams
      const unsubscribe = api.subscribeTeleportProgress(
        teleportId,
        (progress) => {
          // Update UI based on progress
          // Handle both imageUrl (Supabase) and imageData (fallback) 
          const imageSource = progress.imageUrl || progress.imageData;
          if (progress.status === 'completed' && imageSource && progress.description) {
            const newItem: TravelLogItem = {
              id: progress.id,
              destination: progress.destination,
              era: progress.era,
              style: progress.style,
              timestamp: progress.timestamp,
              imageData: imageSource, // URL or base64
              description: progress.description,
              mapsUri: progress.mapsUri,
              referenceImage: progress.referenceImageUrl || referenceImage, // URL from Supabase or local
              usedStreetView: progress.usedStreetView,
            };

            setCurrentLocation(newItem);
            setHistory(prev => [newItem, ...prev].slice(0, 10));
            setTeleportState('arrived');
            
            // Cleanup stream subscription
            unsubscribe();
          } else if (progress.status === 'error') {
            setError(progress.error || "Teleportation malfunction.");
            setTeleportState('error');
            unsubscribe();
          }
        },
        () => {
          // Fallback to polling if stream fails
          pollTeleportProgress(teleportId, referenceImage);
        }
      );

      // Also start polling as backup (stream may take a moment to connect)
      setTimeout(() => {
        if (teleportState === 'teleporting') {
          pollTeleportProgress(teleportId, referenceImage);
        }
      }, 3000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      
      // Handle auth errors
      if (message.includes('sign in')) {
        setError(message);
        setTeleportState('error');
        return;
      }
      
      // If unauthorized, it might be the key. Prompt to re-select.
      if (message.includes('403') || message.includes('Permission denied') || message.includes('not found')) {
         setHasApiKey(false);
         setError("Authorization Link Severed. Please reconnect ID key.");
      } else {
         setError(message || "Teleportation malfunction. Coordinates invalid.");
      }
      setTeleportState('error');
    }
  };

  // Poll for teleport progress
  const pollTeleportProgress = async (teleportId: string, referenceImage?: string) => {
    const maxAttempts = 60; // 60 seconds max (image generation can take time)
    let attempts = 0;

    const poll = async () => {
      try {
        const progress = await api.getTeleportProgress(teleportId);
        
        // Handle both imageUrl (Supabase) and imageData (fallback)
        const imageSource = progress.imageUrl || progress.imageData;
        if (progress.status === 'completed' && imageSource && progress.description) {
          const newItem: TravelLogItem = {
            id: progress.id,
            destination: progress.destination,
            era: progress.era,
            style: progress.style,
            timestamp: progress.timestamp,
            imageData: imageSource, // URL or base64
            description: progress.description,
            mapsUri: progress.mapsUri,
            referenceImage: progress.referenceImageUrl || referenceImage, // URL from Supabase or local
            usedStreetView: progress.usedStreetView,
          };

          setCurrentLocation(newItem);
          setHistory(prev => [newItem, ...prev].slice(0, 10));
          setTeleportState('arrived');
          return;
        } else if (progress.status === 'error') {
          setError(progress.error || "Teleportation malfunction.");
          setTeleportState('error');
          return;
        }

        // Continue polling
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setError("Teleportation timeout. Please try again.");
          setTeleportState('error');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setTeleportState('error');
      }
    };

    poll();
  };

  const handlePlayAudio = async () => {
    if (!currentLocation?.id) return;
    if (isAudioPlaying) return; // Prevent double play

    try {
      setIsAudioPlaying(true);
      
      // Get audio from Motia backend
      const audioResponse = await api.getAudio(currentLocation.id);
      
      // Handle URL-based audio (from Supabase)
      if (audioResponse.audioUrl) {
        // Fetch the audio as array buffer for AudioContext decoding
        const audioArrayBuffer = await fetch(audioResponse.audioUrl).then(r => r.arrayBuffer());
        
        // Gemini TTS returns raw PCM at 24kHz - need to decode with AudioContext
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);
        
        // Decode the audio data
        const audioBuffer = await decodeAudioData(
          new Uint8Array(audioArrayBuffer),
          ctx,
          24000,
          1
        );

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setIsAudioPlaying(false);
        };
        source.start();
        return;
      }
      
      // Handle base64 audio (local dev)
      if (audioResponse.audioData) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);
        
        // Decode and play audio
        const audioBuffer = await decodeAudioData(
          decodeBase64(audioResponse.audioData),
          ctx,
          24000,
          1
        );

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setIsAudioPlaying(false);
        };
        source.start();
        return;
      }
      
      throw new Error('No audio data available');

    } catch (err) {
      setIsAudioPlaying(false);
      // Show more specific error message for debugging
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        setError("Audio not yet ready. Please wait a moment and try again.");
      } else {
        setError("Audio synthesis subsystem failure or not yet ready.");
      }
    }
  };

  const handleSelectFromHistory = (item: TravelLogItem) => {
    setCurrentLocation(item);
    setTeleportState('arrived');
    setIsAudioPlaying(false);
     if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
  };

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen text-slate-200 flex flex-col font-sans selection:bg-cyber-500 selection:text-white relative overflow-x-hidden">
        <Starfield weatherCondition={weatherCondition} />
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyber-500/30 border-t-cyber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-mono">INITIALIZING TEMPORAL SYSTEMS...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show auth banner if auth is configured but user is not signed in
  if (isAuthConfigured && !user) {
    return (
      <div className="min-h-screen text-slate-200 flex flex-col font-sans selection:bg-cyber-500 selection:text-white relative overflow-x-hidden">
        <Starfield weatherCondition={weatherCondition} />
        <Header />
        <AuthBanner />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 flex flex-col font-sans selection:bg-cyber-500 selection:text-white relative overflow-x-hidden">
      <Starfield weatherCondition={weatherCondition} />
      
      {/* API Key Modal Overlay (for AI Studio wrapper) */}
      {!hasApiKey && (
        <div className="fixed inset-0 z-[100] bg-cyber-900/95 backdrop-blur-md flex items-center justify-center p-4">
           <div className="max-w-md w-full bg-cyber-800 border border-cyber-500 rounded-2xl shadow-[0_0_50px_rgba(14,165,233,0.2)] p-8 text-center">
              <div className="w-16 h-16 bg-cyber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyber-500/50">
                <Lock className="w-8 h-8 text-cyber-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-mono">SECURITY CLEARANCE REQUIRED</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                To access the <b>Gemini 3 Pro</b> temporal displacement engine, you must verify your identity with a secure API Key.
              </p>
              
              <button 
                onClick={handleSelectKey}
                className="w-full py-4 bg-cyber-500 hover:bg-cyber-400 text-black font-bold tracking-wider rounded-lg transition-all shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.6)] flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                CONNECT ACCESS KEY
              </button>
              
              <p className="mt-6 text-xs text-slate-500">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:text-cyber-400 underline">
                  View protocol documentation
                </a>
              </p>
           </div>
        </div>
      )}

      <Header />
      
      <main className="flex-1 container mx-auto px-3 py-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 lg:gap-6">
        
        {/* Left Panel: Controls & History */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 lg:gap-6 order-2 lg:order-1">
          <ControlPanel 
            onTeleport={handleTeleport} 
            isTeleporting={teleportState === 'teleporting'} 
            onWeatherUpdate={setWeatherCondition}
          />
          <HistoryLog 
            history={history} 
            onSelect={handleSelectFromHistory} 
            currentId={currentLocation?.id}
          />
        </div>

        {/* Right Panel: Visualizer */}
        <div className="w-full lg:w-2/3 flex flex-col order-1 lg:order-2 mb-4 lg:mb-0">
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200 animate-pulse">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <ViewScreen 
            state={teleportState} 
            location={currentLocation}
            onPlayAudio={handlePlayAudio}
            isAudioPlaying={isAudioPlaying}
          />
        </div>

      </main>
    </div>
  );
};

// Wrapper component that provides auth context
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
