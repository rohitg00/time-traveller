import React, { useState, useEffect, useRef } from 'react';
import { TeleportState, TravelLogItem, getImageSrc } from '../types';
import { Volume2, Loader2, VolumeX, Map, ExternalLink, Scan, Sparkles, Camera, AlertTriangle, Download } from 'lucide-react';

interface ViewScreenProps {
  state: TeleportState;
  location: TravelLogItem | null;
  onPlayAudio: () => void;
  onStopAudio: () => void;
  isAudioPlaying: boolean;
  progress?: number;
  progressStatus?: string;
}

// Inspirational travel quotes that cycle during loading
const travelQuotes = [
  '"The world is a book, and those who do not travel read only one page." — Saint Augustine',
  '"Not all those who wander are lost." — J.R.R. Tolkien',
  '"Travel is fatal to prejudice, bigotry, and narrow-mindedness." — Mark Twain',
  '"The journey of a thousand miles begins with a single step." — Lao Tzu',
  '"Adventure is worthwhile in itself." — Amelia Earhart',
  '"To travel is to live." — Hans Christian Andersen',
  '"Life is either a daring adventure or nothing at all." — Helen Keller',
  '"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes." — Marcel Proust',
  '"Travel makes one modest. You see what a tiny place you occupy in the world." — Gustave Flaubert',
  '"We travel not to escape life, but for life not to escape us." — Anonymous',
];

// Status messages mapped to actual backend status
const statusMessages: Record<string, string> = {
  'initiated': 'Initializing temporal coordinates...',
  'generating-image': 'Activating visual sensors...',
  'rendering-image': 'Rendering destination imagery...',
  'uploading-image': 'Storing visual data in archives...',
  'generating-details': 'Analyzing environmental data...',
  'synthesizing-speech': 'Generating audio narration...',
  'completing': 'Finalizing spacetime jump...',
  'complete': 'Arrival confirmed!',
  'error': 'Temporal disruption detected...',
};

export const ViewScreen: React.FC<ViewScreenProps> = ({ state, location, onPlayAudio, onStopAudio, isAudioPlaying, progress = 0, progressStatus }) => {
  // Animated progress that follows backend progress smoothly
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const targetProgressRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Smoothly animate towards the actual backend progress
  useEffect(() => {
    if (state === 'teleporting') {
      // Set target from backend progress (ensure minimum of 5%)
      targetProgressRef.current = Math.max(5, progress);
      
      const animate = () => {
        setAnimatedProgress(prev => {
          const target = targetProgressRef.current;
          const diff = target - prev;
          
          // Smooth interpolation towards target
          if (Math.abs(diff) < 0.5) {
            return target;
          }
          // Move 5% of the remaining distance per frame for smooth animation
          return prev + diff * 0.05;
        });
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      setAnimatedProgress(0);
    }
  }, [state]);

  // Update target when backend progress changes
  useEffect(() => {
    targetProgressRef.current = Math.max(5, progress);
    if (progress >= 100) {
      setAnimatedProgress(100);
    }
  }, [progress]);

  // Cycle through travel quotes
  useEffect(() => {
    if (state === 'teleporting') {
      // Set random initial quote
      setQuoteIndex(Math.floor(Math.random() * travelQuotes.length));
      
      const interval = setInterval(() => {
        setQuoteIndex(prev => (prev + 1) % travelQuotes.length);
      }, 5000); // Change quote every 5 seconds
      return () => clearInterval(interval);
    }
  }, [state]);
  const handleDownloadImage = async () => {
    if (!location?.imageData) return;
    
    try {
      const imageUrl = getImageSrc(location.imageData);
      
      if (imageUrl.startsWith('http')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `time-traveller-${location.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${location.era.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `time-traveller-${location.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${location.era.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
    }
  };
  if (state === 'idle') {
    return (
      <div className="flex-1 bg-black rounded-xl border border-cyber-700 flex items-center justify-center min-h-[300px] md:min-h-[400px] lg:min-h-[600px] relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 opacity-20" 
             style={{
               backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.3) 1px, transparent 1px)',
               backgroundSize: '50px 50px',
               transform: 'perspective(500px) rotateX(60deg) translateY(0)',
               transformOrigin: 'bottom',
               animation: 'grid-move 20s linear infinite'
             }}>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none"></div>

        <div className="relative z-10 text-center p-10">
          <div className="w-64 h-64 mx-auto relative flex items-center justify-center mb-8">
             <div className="absolute inset-0 border border-cyber-900/50 rounded-full"></div>
             <div className="absolute inset-0 border-t-2 border-cyber-500 rounded-full animate-[spin_4s_linear_infinite]"></div>
             <div className="absolute inset-4 border-b-2 border-cyber-700 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
             <div className="absolute inset-0 rounded-full border border-cyber-500/20 scale-110 animate-pulse"></div>
             
             <div className="w-40 h-40 bg-cyber-900/20 rounded-full backdrop-blur-sm flex items-center justify-center border border-cyber-500/30 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
                <div className="relative">
                   <div className="w-3 h-3 bg-cyber-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(14,165,233,1)]"></div>
                   <div className="absolute inset-0 w-3 h-3 bg-cyber-500 rounded-full animate-ping opacity-75"></div>
                </div>
             </div>
          </div>
          <h3 className="text-3xl text-white font-mono font-bold tracking-[0.3em] mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">SYSTEM STANDBY</h3>
          <p className="text-cyber-400 text-xs font-mono tracking-[0.2em] uppercase bg-cyber-900/50 py-1 px-3 rounded inline-block border border-cyber-500/30">
            Awaiting Spacetime Coordinates
          </p>
        </div>
        
        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyber-500 opacity-60"></div>
        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyber-500 opacity-60"></div>
        <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-cyber-500 opacity-60"></div>
        <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-cyber-500 opacity-60"></div>
        
        <div className="absolute top-8 left-16 text-[10px] text-cyber-600 font-mono">SYS.VER.2.0.5</div>
        <div className="absolute bottom-8 right-16 text-[10px] text-cyber-600 font-mono animate-pulse">● CONNECTION STABLE</div>
      </div>
    );
  }

  if (state === 'teleporting') {
    const displayProgress = Math.max(5, Math.min(animatedProgress, 100)); // Use animated progress
    // Get status message from backend status or use a default
    const statusKey = progressStatus?.toLowerCase().replace(/\s+/g, '-') || 'initiated';
    const currentStatus = statusMessages[statusKey] || progressStatus || 'Processing temporal data...';
    const currentQuote = travelQuotes[quoteIndex];
    
    return (
      <div className="flex-1 bg-black rounded-xl border border-cyber-500 shadow-[0_0_50px_rgba(14,165,233,0.3)] flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] lg:min-h-[600px] relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyber-500/20 via-transparent to-transparent animate-pulse"></div>
           <div className="w-[1px] h-[1px] bg-white shadow-[0_0_100px_2px_white] animate-[ping_0.2s_linear_infinite]"></div>
        </div>
        
        {/* Scanning lines effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(14,165,233,0.03)_2px,rgba(14,165,233,0.03)_4px)]"></div>
          <div 
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-400 to-transparent opacity-60"
            style={{ 
              animation: 'scan-line 3s linear infinite'
            }}
          ></div>
        </div>
        
        <div className="z-10 text-center relative bg-black/60 backdrop-blur-md p-8 rounded-2xl border border-cyber-500/50 shadow-[0_0_30px_rgba(14,165,233,0.2)] max-w-md w-full mx-4">
          {/* Spinner with progress ring */}
          <div className="relative mb-6 inline-block">
            <svg className="w-24 h-24 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="rgba(14,165,233,0.15)"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - displayProgress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="50%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 to-cyan-300 font-mono tabular-nums">
                {Math.round(displayProgress)}%
              </span>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyber-300 to-cyber-400 tracking-widest font-mono mb-4">
            TRAVERSING SPACETIME
          </h2>
          
          {/* Smooth progress bar - no dots */}
          <div className="relative mb-4">
            <div className="h-3 bg-cyber-900/80 rounded-full overflow-hidden border border-cyber-700/50">
              <div 
                className="h-full bg-gradient-to-r from-cyber-600 via-cyber-400 to-purple-500 rounded-full relative"
                style={{ 
                  width: `${displayProgress}%`,
                  transition: 'width 0.3s ease-out'
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                {/* Glow at the tip */}
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white/60 to-transparent rounded-full"></div>
              </div>
            </div>
            
          </div>
          
          {/* Status text */}
          <p className="text-cyber-400 font-mono text-sm uppercase tracking-widest mb-4 transition-opacity duration-500">
            {currentStatus}
          </p>
          
          {/* Inspirational quote */}
          <div className="min-h-[3rem] px-4">
            <p className="text-slate-400 text-xs italic transition-all duration-700 ease-in-out opacity-80">
              {currentQuote}
            </p>
          </div>
          
          {/* Live indicator */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            <span className="text-green-400 text-[10px] font-mono tracking-wider">LIVE STREAM ACTIVE</span>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'arrived' && location) {
    return (
      <div className="flex flex-col gap-6 animate-[fadeIn_0.8s_ease-out]">
        <div className="relative rounded-xl overflow-hidden border border-cyber-600 shadow-[0_0_40px_rgba(0,0,0,0.6)] group bg-black aspect-video ring-1 ring-cyber-500/50">
          <img 
            src={getImageSrc(location.imageData)} 
            alt={`${location.destination} in ${location.era}`}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />

          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                 <span className="text-white font-mono text-sm font-bold tracking-wider uppercase text-shadow-sm">
                   {location.destination}
            </span>
               </div>
               <div className="text-cyber-400 font-mono text-xs tracking-widest uppercase pl-4 border-l border-cyber-500/50">
                 EPOCH: {location.era}
               </div>
             </div>
             
             <div className="flex gap-2">
                {location.usedStreetView === false && (
                  <div className="bg-amber-900/80 backdrop-blur border border-amber-500/50 px-2 py-1 rounded text-[10px] font-mono text-amber-300 flex items-center gap-1" title="Street View unavailable for this location - AI visualization generated">
                    <Sparkles className="w-3 h-3" />
                    AI GENERATED
                  </div>
                )}
                {location.usedStreetView === true && (
                  <div className="bg-green-900/80 backdrop-blur border border-green-500/50 px-2 py-1 rounded text-[10px] font-mono text-green-300 flex items-center gap-1" title="Based on Google Street View imagery">
                    <Camera className="w-3 h-3" />
                    STREET VIEW
                  </div>
                )}
                <div className="bg-black/50 backdrop-blur border border-cyber-500/30 px-2 py-1 rounded text-[10px] font-mono text-cyber-300">
                  IMG.RES.8K
                </div>
             </div>
          </div>

          {location.referenceImage && (
            <div className="absolute bottom-4 left-4 w-24 h-24 rounded border border-cyber-500/50 overflow-hidden bg-black shadow-lg group/ref">
               <img src={getImageSrc(location.referenceImage)} className="w-full h-full object-cover opacity-70 group-hover/ref:opacity-100 transition-opacity" alt="Reference" />
               <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-white font-mono py-0.5">REFERENCE</div>
            </div>
          )}

          <div className="absolute bottom-4 right-4 pointer-events-auto flex gap-2">
            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-2 bg-cyber-900/90 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-cyber-500/50 hover:bg-cyber-500 hover:text-black hover:shadow-[0_0_20px_rgba(14,165,233,0.6)] transition-all font-mono text-xs font-bold group/btn tracking-wide"
              title="Download image"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">DOWNLOAD</span>
            </button>
            
            {location.mapsUri && (
              <a 
                href={location.mapsUri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-cyber-900/90 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-cyber-500/50 hover:bg-cyber-500 hover:text-black hover:shadow-[0_0_20px_rgba(14,165,233,0.6)] transition-all font-mono text-xs font-bold group/btn tracking-wide"
              >
                <Map className="w-3 h-3" />
                <span className="hidden sm:inline">OPEN STREET VIEW</span>
                <ExternalLink className="w-3 h-3 opacity-50 group-hover/btn:opacity-100" />
              </a>
            )}
          </div>

        </div>

        <div className="bg-cyber-800/60 border border-cyber-700 rounded-xl p-6 relative backdrop-blur-sm shadow-lg">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-500 to-transparent opacity-50"></div>
          
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-3 font-mono tracking-wide">
               <Scan className="w-5 h-5 text-cyber-500" />
               ENVIRONMENTAL ANALYSIS
             </h3>
            <button 
               onClick={isAudioPlaying ? onStopAudio : onPlayAudio}
               className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                 isAudioPlaying 
                   ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] hover:bg-red-500'
                   : 'bg-black/50 border border-cyber-600 text-cyber-400 hover:border-cyber-400 hover:text-white hover:bg-cyber-900'
               }`}
             >
               {isAudioPlaying ? (
                 <><VolumeX className="w-4 h-4" /> ABORT AUDIO STREAM</>
               ) : (
                 <><Volume2 className="w-4 h-4" /> PLAY AUDIO GUIDE</>
               )}
             </button>
          </div>
          
          <div className="relative pl-6 border-l-2 border-cyber-500/30">
            <p className="text-slate-300 leading-relaxed font-light tracking-wide text-sm md:text-base italic">
            "{location.description}"
          </p>
            <div className="absolute top-0 left-[-5px] w-2 h-2 bg-cyber-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.8)]"></div>
            <div className="absolute bottom-0 left-[-5px] w-2 h-2 bg-cyber-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.8)]"></div>
          </div>

          {location.usedStreetView === false && (
            <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-200/80">
                <span className="font-bold text-amber-300">Street View Unavailable:</span> Google Street View does not have imagery for this exact location. 
                This visualization was generated using AI based on location data and nearby landmarks.
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-cyber-700/50 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500 uppercase tracking-wider">
             <div className="flex gap-4">
                <span><span className="text-cyber-600">RENDER:</span> {location.style}</span>
                <span><span className="text-cyber-600">ID:</span> {location.id.slice(-6)}</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-green-400">Live Data Stream Active</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state handled in parent, default fallback
  return null;
};
