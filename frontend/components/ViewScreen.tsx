import React from 'react';
import { TeleportState, TravelLogItem } from '../types';
import { Volume2, Loader2, VolumeX, Map, ExternalLink } from 'lucide-react';

interface ViewScreenProps {
  state: TeleportState;
  location: TravelLogItem | null;
  onPlayAudio: () => void;
  isAudioPlaying: boolean;
}

export const ViewScreen: React.FC<ViewScreenProps> = ({ state, location, onPlayAudio, isAudioPlaying }) => {
  if (state === 'idle') {
    return (
      <div className="flex-1 bg-black rounded-xl border-2 border-dashed border-cyber-800 flex items-center justify-center min-h-[400px] lg:min-h-[600px] relative overflow-hidden">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto border border-cyber-800 rounded-full flex items-center justify-center mb-4 animate-[spin_10s_linear_infinite]">
             <div className="w-16 h-16 border border-cyber-700 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-cyber-500 rounded-full animate-pulse"></div>
             </div>
          </div>
          <h3 className="text-xl text-slate-500 font-mono tracking-widest">VIEWPORT OFFLINE</h3>
          <p className="text-slate-600 mt-2 text-sm">Awaiting coordinates for transmission</p>
        </div>
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
    );
  }

  if (state === 'teleporting') {
    return (
      <div className="flex-1 bg-black rounded-xl border border-cyber-500 shadow-[0_0_30px_rgba(14,165,233,0.2)] flex flex-col items-center justify-center min-h-[400px] lg:min-h-[600px] relative overflow-hidden">
        {/* Warp speed effect (CSS based) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-50">
           <div className="w-[200%] h-[200%] bg-[radial-gradient(circle,transparent_20%,#0ea5e9_120%)] animate-pulse"></div>
        </div>
        <div className="z-10 text-center">
          <Loader2 className="w-16 h-16 text-cyber-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white tracking-widest font-mono animate-pulse">TRAVERSING SPACETIME</h2>
          <p className="text-cyber-400 mt-2 font-mono text-sm">Generating molecular reconstruction...</p>
        </div>
      </div>
    );
  }

  if (state === 'arrived' && location) {
    return (
      <div className="flex flex-col gap-4 animate-[fadeIn_0.5s_ease-out]">
        
        {/* Main Viewport */}
        <div className="relative rounded-xl overflow-hidden border border-cyber-700 shadow-2xl group bg-black aspect-video">
          
          <img 
            src={`data:image/jpeg;base64,${location.imageData}`} 
            alt={`${location.destination} in ${location.era}`}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Stats */}
          <div className="absolute top-4 left-4 flex flex-col gap-1">
            <span className="bg-black/60 backdrop-blur-sm text-cyber-500 text-xs px-2 py-1 rounded border border-cyber-500/30 font-mono">
              LOC: {location.destination.toUpperCase()}
            </span>
            <span className="bg-black/60 backdrop-blur-sm text-cyber-400 text-xs px-2 py-1 rounded border border-cyber-500/30 font-mono">
              ERA: {location.era.toUpperCase()}
            </span>
          </div>

          {/* Maps Link Overlay */}
          {location.mapsUri && (
            <div className="absolute bottom-4 right-4">
              <a 
                href={location.mapsUri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-lg border border-cyber-500/50 hover:bg-cyber-500 hover:text-black transition-all font-mono text-xs group/btn"
              >
                <Map className="w-3 h-3" />
                <span>STREET VIEW UPLINK</span>
                <ExternalLink className="w-3 h-3 opacity-50 group-hover/btn:opacity-100" />
              </a>
            </div>
          )}

          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] opacity-20"></div>
        </div>

        {/* Description Panel */}
        <div className="bg-cyber-800/50 border border-cyber-700 rounded-xl p-6 relative">
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <span className="w-1.5 h-6 bg-cyber-500 rounded-sm"></span>
               ENVIRONMENTAL ANALYSIS
             </h3>
             <button
               onClick={onPlayAudio}
               disabled={isAudioPlaying}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                 isAudioPlaying 
                   ? 'bg-cyber-500 text-black shadow-[0_0_15px_rgba(14,165,233,0.6)] animate-pulse'
                   : 'bg-cyber-900 border border-cyber-600 text-cyber-400 hover:border-cyber-400 hover:text-white'
               }`}
             >
               {isAudioPlaying ? (
                 <><VolumeX className="w-3 h-3" /> Transmitting...</>
               ) : (
                 <><Volume2 className="w-3 h-3" /> Audio Guide</>
               )}
             </button>
          </div>
          
          <p className="text-slate-300 leading-relaxed font-light tracking-wide text-sm md:text-base border-l-2 border-cyber-500/20 pl-4 italic">
            "{location.description}"
          </p>

          <div className="mt-4 flex items-center justify-end gap-2 text-xs font-mono text-slate-500">
             <span>RENDER STYLE: {location.style}</span>
             <span>ID: {location.id.slice(-6)}</span>
             {location.mapsUri && <span className="text-green-500 ml-2">● GEO-LOCK ACTIVE</span>}
          </div>
        </div>
      </div>
    );
  }

  // Error state handled in parent, default fallback
  return null;
};