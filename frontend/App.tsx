
import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { TeleportState, TravelLogItem } from './types';
import * as api from './apiClient';
import { decodeAudioData, decodeBase64 } from './audioUtils';
import { ControlPanel } from './components/ControlPanel';
import { ViewScreen } from './components/ViewScreen';
import { HistoryLog } from './components/HistoryLog';
import { Header } from './components/Header';
import { Starfield } from './components/Starfield';
import { AuthBanner } from './components/AuthBanner';
import { GuidedTour } from './components/GuidedTour';
import { TermsModal } from './components/TermsModal';
import { ScrollingGallery, MobileGallery } from './components/ScrollingGallery';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertCircle, Lock, Zap, Shield } from 'lucide-react';

// Main app content that uses auth
const AppContent: React.FC = () => {
  const { user, loading: authLoading, isAuthConfigured } = useAuth();
  const [teleportState, setTeleportState] = useState<TeleportState>('idle');
  const [currentLocation, setCurrentLocation] = useState<TravelLogItem | null>(null);
  const [history, setHistory] = useState<TravelLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [weatherCondition, setWeatherCondition] = useState<string | undefined>(undefined);
  const [showTour, setShowTour] = useState<boolean>(false);
  const [showTerms, setShowTerms] = useState<boolean>(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('time-traveller-tour-completed');
    if (!hasSeenTour && !authLoading && (user || !isAuthConfigured)) {
      setTimeout(() => setShowTour(true), 1000);
    }
  }, [authLoading, user, isAuthConfigured]);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('time-traveller-tour-completed', 'true');
  };

  useEffect(() => {
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

  useEffect(() => {
    const loadHistory = async () => {
      if (authLoading) return;
      
      if (user && isAuthConfigured) {
        try {
          const serverHistory = await api.getHistory(10);
          const formattedHistory: TravelLogItem[] = serverHistory.map(item => ({
            ...item,
            imageData: item.imageUrl || item.imageData || '', // Handle both URL and base64
            referenceImage: item.referenceImageUrl || item.referenceImage,
          }));
          setHistory(formattedHistory);
        } catch {
          loadLocalHistory();
        }
      } else {
        loadLocalHistory();
      }
    };

    const loadLocalHistory = () => {
      try {
        const savedHistory = localStorage.getItem('time-traveller-history');
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory) as TravelLogItem[];
          setHistory(parsed.slice(0, 10));
        }
      } catch {
      }
    };

    loadHistory();
  }, [user, authLoading, isAuthConfigured]);

  useEffect(() => {
    if (user && isAuthConfigured) return;
    
    if (history.length > 0) {
      try {
        const historyToSave = history.map(item => ({
          ...item,
          referenceImage: undefined
        }));
        localStorage.setItem('time-traveller-history', JSON.stringify(historyToSave));
      } catch {
      }
    }
  }, [history, user, isAuthConfigured]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        const success = await window.aistudio.openSelectKey();
        setHasApiKey(true);
        setError(null);
      } catch {
      }
    }
  };

  const handleTeleport = async (destination: string, era: string, style: string, referenceImage?: string, coordinates?: { lat: number, lng: number }, imageConfig?: { aspectRatio: string, imageSize: string }) => {
    setTeleportState('teleporting');
    setError(null);
    setIsAudioPlaying(false);
    
    if (audioSource) {
      try {
        audioSource.stop();
      } catch {
        // Ignore if already stopped
      }
      setAudioSource(null);
    }
    if (audioContext && audioContext.state === 'running') {
      audioContext.close();
      setAudioContext(null);
    }

    try {
      const response = await api.initiateTeleport({
        destination,
        era,
        style,
        referenceImage,
        coordinates,
        imageConfig: imageConfig as api.ImageConfig
      });

      const teleportId = response.teleportId;

      const unsubscribe = api.subscribeTeleportProgress(
        teleportId,
        (progress) => {
          const imageSource = progress.imageUrl || progress.imageData;
          if (progress.status === 'completed' && imageSource && progress.description) {
            const newItem: TravelLogItem = {
              id: progress.id,
              destination: progress.destination,
              era: progress.era,
              style: progress.style,
              timestamp: progress.timestamp,
              imageData: imageSource,
              description: progress.description,
              mapsUri: progress.mapsUri,
              referenceImage: progress.referenceImageUrl || referenceImage,
              usedStreetView: progress.usedStreetView,
            };

            setCurrentLocation(newItem);
            setHistory(prev => [newItem, ...prev].slice(0, 10));
            setTeleportState('arrived');
            unsubscribe();
          } else if (progress.status === 'error') {
            setError(progress.error || "Teleportation malfunction.");
            setTeleportState('error');
            unsubscribe();
          }
        },
        () => {
          pollTeleportProgress(teleportId, referenceImage);
        }
      );

      setTimeout(() => {
        if (teleportState === 'teleporting') {
          pollTeleportProgress(teleportId, referenceImage);
        }
      }, 3000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      
      if (message.includes('sign in')) {
        setError(message);
        setTeleportState('error');
        return;
      }
      
      if (message.includes('403') || message.includes('Permission denied') || message.includes('not found')) {
         setHasApiKey(false);
         setError("Authorization Link Severed. Please reconnect ID key.");
      } else {
         setError(message || "Teleportation malfunction. Coordinates invalid.");
      }
      setTeleportState('error');
    }
  };

  const pollTeleportProgress = async (teleportId: string, referenceImage?: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const progress = await api.getTeleportProgress(teleportId);
        const imageSource = progress.imageUrl || progress.imageData;
        if (progress.status === 'completed' && imageSource && progress.description) {
          const newItem: TravelLogItem = {
            id: progress.id,
            destination: progress.destination,
            era: progress.era,
            style: progress.style,
            timestamp: progress.timestamp,
            imageData: imageSource,
            description: progress.description,
            mapsUri: progress.mapsUri,
            referenceImage: progress.referenceImageUrl || referenceImage,
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
    if (isAudioPlaying) return;

    try {
      setIsAudioPlaying(true);
      const audioResponse = await api.getAudio(currentLocation.id);
      
      if (audioResponse.audioUrl) {
        const audioArrayBuffer = await fetch(audioResponse.audioUrl).then(r => r.arrayBuffer());
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);
        
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
          setAudioSource(null);
        };
        setAudioSource(source);
        source.start();
        return;
      }
      
      if (audioResponse.audioData) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);
        
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
          setAudioSource(null);
        };
        setAudioSource(source);
        source.start();
        return;
      }
      
      throw new Error('No audio data available');

    } catch (err) {
      setIsAudioPlaying(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        setError("Audio not yet ready. Please wait a moment and try again.");
      } else {
        setError("Audio synthesis subsystem failure or not yet ready.");
      }
    }
  };

  const handleStopAudio = () => {
    if (audioSource) {
      try {
        audioSource.stop();
      } catch {
      }
      setAudioSource(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setIsAudioPlaying(false);
  };

  const handleSelectFromHistory = (item: TravelLogItem) => {
    setCurrentLocation(item);
    setTeleportState('arrived');
    handleStopAudio();
  };

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
      
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden min-h-0">
        <ScrollingGallery side="left" />
        
        <main className="flex-1 overflow-y-auto px-3 py-4 md:p-6 lg:p-8">
          <MobileGallery />
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
            <div className="w-full lg:w-1/3 xl:w-2/5 flex flex-col gap-4 lg:gap-6 order-2 lg:order-1 lg:max-h-[calc(100vh-120px)] lg:overflow-hidden">
              <ControlPanel 
                onTeleport={handleTeleport} 
                isTeleporting={teleportState === 'teleporting'} 
                onWeatherUpdate={setWeatherCondition}
              />
              <div className="flex-1 min-h-0 overflow-hidden">
                <HistoryLog 
                  history={history} 
                  onSelect={handleSelectFromHistory} 
                  currentId={currentLocation?.id}
                />
              </div>
            </div>

            <div className="w-full lg:w-2/3 xl:w-3/5 flex flex-col order-1 lg:order-2 mb-4 lg:mb-0">
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
                onStopAudio={handleStopAudio}
                isAudioPlaying={isAudioPlaying}
              />
            </div>
          </div>
        </main>
        
        <ScrollingGallery side="right" />
      </div>
      
      <footer className="p-4 text-center text-xs text-slate-600 font-mono z-10 relative">
        <button 
          onClick={() => setShowTerms(true)}
          className="hover:text-cyber-400 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <Shield className="w-3 h-3" />
          TERMS & PRIVACY PROTOCOL
        </button>
      </footer>

      {showTour && <GuidedTour onComplete={handleTourComplete} />}
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Analytics />
    </AuthProvider>
  );
};

export default App;
