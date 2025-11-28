import React from 'react';
import { TeleportState, TravelLogItem } from '../types';
import { Volume2, Loader2, VolumeX, Map, ExternalLink, Scan, Sparkles, Camera, AlertTriangle } from 'lucide-react';

interface ViewScreenProps {
  state: TeleportState;
  location: TravelLogItem | null;
  onPlayAudio: () => void;
  isAudioPlaying: boolean;
}

export const ViewScreen: React.FC<ViewScreenProps> = ({ state, location, onPlayAudio, isAudioPlaying }) => {
  if (state === 'idle') {
    return (
      <div className="flex-1 bg-black rounded-xl border border-cyber-700 flex items-center justify-center min-h-[300px] md:min-h-[400px] lg:min-h-[600px] relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Dynamic Perspective Grid */}
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

        {/* Central HUD */}
        <div className="relative z-10 text-center p-10">
          <div className="w-64 h-64 mx-auto relative flex items-center justify-center mb-8">
             {/* Outer Rings */}
             <div className="absolute inset-0 border border-cyber-900/50 rounded-full"></div>
             <div className="absolute inset-0 border-t-2 border-cyber-500 rounded-full animate-[spin_4s_linear_infinite]"></div>
             <div className="absolute inset-4 border-b-2 border-cyber-700 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
             <div className="absolute inset-0 rounded-full border border-cyber-500/20 scale-110 animate-pulse"></div>
             
             {/* Core */}
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
        
        {/* HUD Corner Elements */}
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
    return (
      <div className="flex-1 bg-black rounded-xl border border-cyber-500 shadow-[0_0_50px_rgba(14,165,233,0.3)] flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] lg:min-h-[600px] relative overflow-hidden">
        {/* Hyperspace Effect */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent animate-pulse"></div>
           {/* Simulated stars streaming */}
           <div className="w-[1px] h-[1px] bg-white shadow-[0_0_100px_2px_white] animate-[ping_0.2s_linear_infinite]"></div>
        </div>
        
        <div className="z-10 text-center relative bg-black/40 backdrop-blur-sm p-8 rounded-2xl border border-cyber-500/30">
          <div className="relative mb-6 inline-block">
             <Loader2 className="w-16 h-16 text-cyber-400 animate-spin" />
             <div className="absolute inset-0 w-16 h-16 border-t-4 border-cyber-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyber-400 tracking-widest font-mono animate-pulse mb-2">
            TRAVERSING SPACETIME
          </h2>
          <div className="h-1 w-48 bg-cyber-900 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-cyber-500 animate-[scan_1s_linear_infinite]"></div>
          </div>
          <p className="text-cyber-400 mt-3 font-mono text-xs uppercase tracking-widest">Reconstructing molecular data...</p>
        </div>
      </div>
    );
  }

  if (state === 'arrived' && location) {
    return (
      <div className="flex flex-col gap-6 animate-[fadeIn_0.8s_ease-out]">
        
        {/* Main Viewport */}
        <div className="relative rounded-xl overflow-hidden border border-cyber-600 shadow-[0_0_40px_rgba(0,0,0,0.6)] group bg-black aspect-video ring-1 ring-cyber-500/50">
          
          <img 
            src={`data:image/jpeg;base64,${location.imageData}`} 
            alt={`${location.destination} in ${location.era}`}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          
          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] opacity-30"></div>
          <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20"></div>

          {/* Top HUD Bar */}
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
                {/* Image Source Indicator */}
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

          {/* Reference Image Inset (if exists) */}
          {location.referenceImage && (
            <div className="absolute bottom-4 left-4 w-24 h-24 rounded border border-cyber-500/50 overflow-hidden bg-black shadow-lg group/ref">
               <img src={location.referenceImage} className="w-full h-full object-cover opacity-70 group-hover/ref:opacity-100 transition-opacity" alt="Reference" />
               <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-white font-mono py-0.5">REFERENCE</div>
            </div>
          )}

          {/* Bottom Actions */}
          {location.mapsUri && (
            <div className="absolute bottom-4 right-4 pointer-events-auto">
              <a 
                href={location.mapsUri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-cyber-900/90 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-cyber-500/50 hover:bg-cyber-500 hover:text-black hover:shadow-[0_0_20px_rgba(14,165,233,0.6)] transition-all font-mono text-xs font-bold group/btn tracking-wide"
              >
                <Map className="w-3 h-3" />
                <span>OPEN STREET VIEW</span>
                <ExternalLink className="w-3 h-3 opacity-50 group-hover/btn:opacity-100" />
              </a>
            </div>
          )}

          {/* Center Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
             <div className="w-64 h-[1px] bg-white/50"></div>
             <div className="h-64 w-[1px] bg-white/50 absolute"></div>
             <div className="w-20 h-20 border border-white/30 rounded-full absolute"></div>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="bg-cyber-800/60 border border-cyber-700 rounded-xl p-6 relative backdrop-blur-sm shadow-lg">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-500 to-transparent opacity-50"></div>
          
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-3 font-mono tracking-wide">
               <Scan className="w-5 h-5 text-cyber-500" />
               ENVIRONMENTAL ANALYSIS
             </h3>
             <button
               onClick={onPlayAudio}
               disabled={isAudioPlaying}
               className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                 isAudioPlaying 
                   ? 'bg-cyber-500 text-black shadow-[0_0_15px_rgba(14,165,233,0.6)] animate-pulse'
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

          {/* Street View Unavailable Notice */}
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
