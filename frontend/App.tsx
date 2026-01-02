
import React, { useState, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { TeleportState, TravelLogItem, ReferenceImage } from './types';
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
import { ApiKeyModal } from './components/ApiKeyModal';
import { ScrollingGallery, MobileGallery } from './components/ScrollingGallery';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertCircle, Lock, Zap, Shield, Key } from 'lucide-react';

const MAX_FREE_GENERATIONS = 5;
const STORAGE_KEY_GENERATIONS = 'time-traveller-generations-used';
const STORAGE_KEY_USER_GEMINI = 'time-traveller-user-gemini-key';
const STORAGE_KEY_USER_MAPS = 'time-traveller-user-maps-key';

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
  
  // Ref to track teleporting state for closures (avoids stale closure bug)
  const isTeleportingRef = useRef(false);
  
  // Real-time progress tracking from Motia streams
  const [teleportProgress, setTeleportProgress] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [generationsUsed, setGenerationsUsed] = useState<number>(0);
  const [userGeminiKey, setUserGeminiKey] = useState<string>('');
  const [userMapsKey, setUserMapsKey] = useState<string>('');

  useEffect(() => {
    const savedGenerations = localStorage.getItem(STORAGE_KEY_GENERATIONS);
    if (savedGenerations) {
      setGenerationsUsed(parseInt(savedGenerations, 10) || 0);
    }
    const savedGeminiKey = localStorage.getItem(STORAGE_KEY_USER_GEMINI);
    if (savedGeminiKey) {
      setUserGeminiKey(savedGeminiKey);
    }
    const savedMapsKey = localStorage.getItem(STORAGE_KEY_USER_MAPS);
    if (savedMapsKey) {
      setUserMapsKey(savedMapsKey);
    }
  }, []);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('time-traveller-tour-completed');
    if (!hasSeenTour && !authLoading && (user || !isAuthConfigured)) {
      setTimeout(() => setShowTour(true), 1000);
    }
  }, [authLoading, user, isAuthConfigured]);

  const hasUserKeys = userGeminiKey.length > 0;
  const remainingFreeGenerations = Math.max(0, MAX_FREE_GENERATIONS - generationsUsed);
  const canGenerate = hasUserKeys || remainingFreeGenerations > 0;

  const handleSaveApiKeys = (geminiKey: string, mapsKey: string) => {
    setUserGeminiKey(geminiKey);
    setUserMapsKey(mapsKey);
    localStorage.setItem(STORAGE_KEY_USER_GEMINI, geminiKey);
    if (mapsKey) {
      localStorage.setItem(STORAGE_KEY_USER_MAPS, mapsKey);
    }
  };

  const incrementGenerationCount = () => {
    if (!hasUserKeys) {
      const newCount = generationsUsed + 1;
      setGenerationsUsed(newCount);
      localStorage.setItem(STORAGE_KEY_GENERATIONS, newCount.toString());
    }
  };

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
          const serverHistory = await api.getHistory();
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
          setHistory(parsed);
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

  const handleTeleport = async (destination: string, era: string, style: string, referenceImage?: string, coordinates?: { lat: number, lng: number }, imageConfig?: { aspectRatio: string, imageSize: string }, referenceImages?: ReferenceImage[]) => {
    if (!canGenerate) {
      setShowApiKeyModal(true);
      return;
    }

    setTeleportState('teleporting');
    isTeleportingRef.current = true;
    setTeleportProgress(0);
    setProgressStatus('Initiating temporal jump...');
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
        referenceImages: referenceImages?.map(img => ({
          id: img.id,
          data: img.data,
          type: img.type,
          label: img.label
        })),
        coordinates,
        imageConfig: imageConfig as api.ImageConfig,
        userGeminiKey: userGeminiKey || undefined,
        userMapsKey: userMapsKey || undefined,
      });

      const teleportId = response.teleportId;
      let hasCompleted = false;
      
      // Mark as completed to prevent duplicate state updates
      const markComplete = () => {
        hasCompleted = true;
        isTeleportingRef.current = false;
      };

      const unsubscribe = api.subscribeTeleportProgress(
        teleportId,
        (progress) => {
          if (hasCompleted) return;
          
          // Update real-time progress from Motia stream (only if valid, -1 means keep existing)
          if (typeof progress.progress === 'number' && progress.progress >= 0) {
            setTeleportProgress(progress.progress);
          }
          // Only update status if we have valid progress (not -1 which means "keep existing")
          if (progress.status && progress.progress >= 0) {
            // Map status to user-friendly message
            const statusMessages: Record<string, string> = {
              'pending': 'Preparing temporal jump...',
              'initiated': 'Initiating temporal coordinates...',
              'generating-image': 'Calibrating quantum flux...',
              'rendering-image': 'Rendering spacetime image...',
              'uploading-image': 'Storing visual data...',
              'image-generated': 'Image captured successfully...',
              'generating-details': 'Analyzing location data...',
              'synthesizing-speech': 'Generating audio narration...',
              'completed': 'Teleportation complete!',
            };
            setProgressStatus(statusMessages[progress.status] || progress.status);
          }
          
          const imageSource = progress.imageUrl || progress.imageData;
          if (progress.status === 'completed' && imageSource && progress.description) {
            markComplete();
            setTeleportProgress(100);
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
            setHistory(prev => [newItem, ...prev]);
            setTeleportState('arrived');
            incrementGenerationCount();
            unsubscribe();
          } else if (progress.status === 'error') {
            markComplete();
            setError(progress.error || "Teleportation malfunction.");
            setTeleportState('error');
            unsubscribe();
          }
        },
        () => {
          // SSE error - fallback to polling
          if (!hasCompleted) {
            pollTeleportProgress(teleportId, referenceImage);
          }
        }
      );

      // Fallback: Start polling after 3s if SSE hasn't delivered updates
      // Uses ref to avoid stale closure bug
      setTimeout(() => {
        if (isTeleportingRef.current && !hasCompleted) {
          console.log('[Teleport] SSE fallback - starting polling');
          pollTeleportProgress(teleportId, referenceImage);
        }
      }, 3000);
      
      // Hard timeout: If still loading after 90s, show error
      setTimeout(() => {
        if (isTeleportingRef.current && !hasCompleted) {
          markComplete();
          setError("Generation timeout. The image may still be processing - check your history in a moment.");
          setTeleportState('error');
          unsubscribe();
        }
      }, 90000);

    } catch (err: unknown) {
      isTeleportingRef.current = false;
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
    // Skip if already completed (prevents duplicate processing)
    if (!isTeleportingRef.current) return;
    
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      // Check if already completed before each poll
      if (!isTeleportingRef.current) return;
      
      try {
        const progress = await api.getTeleportProgress(teleportId);
        
        // Debug: Log what we're receiving (expand nested object)
        console.log('[Poll] Progress response:', JSON.stringify({ 
          status: progress.status, 
          progress: progress.progress,
          hasImage: !!(progress.imageUrl || progress.imageData)
        }));
        
        // Update progress from polling response (only if valid, -1 means keep existing)
        if (typeof progress.progress === 'number' && progress.progress >= 0) {
          setTeleportProgress((prev) => {
            console.log(`[Poll] Progress: ${prev} -> ${progress.progress}`);
            return progress.progress;
          });
        }
        // Only update status if we have valid progress (not -1 which means "keep existing")
        if (progress.status && progress.progress >= 0) {
          const statusMessages: Record<string, string> = {
            'pending': 'Preparing temporal jump...',
            'initiated': 'Initiating temporal coordinates...',
            'generating-image': 'Calibrating quantum flux...',
            'rendering-image': 'Rendering spacetime image...',
            'uploading-image': 'Storing visual data...',
            'image-generated': 'Image captured successfully...',
            'generating-details': 'Analyzing location data...',
            'synthesizing-speech': 'Generating audio narration...',
            'completed': 'Teleportation complete!',
          };
          setProgressStatus(statusMessages[progress.status] || progress.status);
        }
        
        const imageSource = progress.imageUrl || progress.imageData;
        if (progress.status === 'completed' && imageSource && progress.description) {
          isTeleportingRef.current = false;
          setTeleportProgress(100);
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
          setHistory(prev => [newItem, ...prev]);
          setTeleportState('arrived');
          incrementGenerationCount();
          return;
        } else if (progress.status === 'error') {
          isTeleportingRef.current = false;
          setError(progress.error || "Teleportation malfunction.");
          setTeleportState('error');
          return;
        }

        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          isTeleportingRef.current = false;
          setError("Teleportation timeout. Please try again.");
          setTeleportState('error');
        }
      } catch (err: unknown) {
        isTeleportingRef.current = false;
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
                To access <b>Gemini 3 Pro</b> AI time travel, you must verify your identity with a secure API Key.
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
                progress={teleportProgress}
                progressStatus={progressStatus}
              />
            </div>
          </div>
        </main>
        
        <ScrollingGallery side="right" />
      </div>
      
      <footer className="p-4 text-xs text-slate-600 font-mono z-10 relative">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left side - spacer for balance */}
          <div className="hidden sm:block w-32"></div>
          
          {/* Center - main footer links */}
          <div className="flex items-center justify-center gap-4 flex-wrap flex-1">
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className={`hover:text-cyber-400 transition-colors flex items-center gap-1.5 ${hasUserKeys ? 'text-green-500' : remainingFreeGenerations === 0 ? 'text-red-400 animate-pulse' : remainingFreeGenerations <= 2 ? 'text-amber-400' : ''}`}
            >
              <Key className="w-3 h-3" />
              {hasUserKeys ? 'USING YOUR API KEYS' : remainingFreeGenerations === 0 ? '⚠️ ADD API KEY' : `${remainingFreeGenerations} FREE LEFT`}
            </button>
            <span className="text-slate-700">|</span>
            <button 
              onClick={() => setShowTerms(true)}
              className="hover:text-cyber-400 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3 h-3" />
              TERMS & PRIVACY
            </button>
          </div>
          
          {/* Right side - Powered by Motia */}
          <a 
            href="https://github.com/motiadev/motia" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-500 hover:text-cyber-400 transition-colors group"
          >
            <Zap className="w-3 h-3 group-hover:text-yellow-400 transition-colors" />
            <span>Powered by <span className="font-semibold">Motia</span></span>
          </a>
        </div>
      </footer>

      {showTour && <GuidedTour onComplete={handleTourComplete} />}
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)}
        onSaveKeys={handleSaveApiKeys}
        generationsUsed={generationsUsed}
        maxFreeGenerations={MAX_FREE_GENERATIONS}
      />
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
