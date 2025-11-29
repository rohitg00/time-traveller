
import React, { useState, useRef, useEffect } from 'react';
import { LocationStyle } from '../types';
import { Send, MapPin, Clock, Palette, Camera, Upload, X, User, Circle, Terminal, Globe, Sliders } from 'lucide-react';
import { MapSelector } from './MapSelector';
import { LocationInfo } from './LocationInfo';
import { TravelerIdentity } from './TravelerIdentity';
import * as api from '../apiClient';

interface ControlPanelProps {
  onTeleport: (dest: string, era: string, style: string, referenceImage?: string, coordinates?: { lat: number, lng: number }) => void;
  isTeleporting: boolean;
  onWeatherUpdate?: (condition: string) => void;
}

type Tab = 'manual' | 'terminal' | 'map';

export const ControlPanel: React.FC<ControlPanelProps> = ({ onTeleport, isTeleporting, onWeatherUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('manual');
  
  const [destination, setDestination] = useState('');
  const [era, setEra] = useState('');
  const [style, setStyle] = useState<string>(LocationStyle.REALISTIC);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Time Traveller NavSystem v9.2 online. Awaiting command.' }
  ]);
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    
    let targetEra = era;
    
    if (!targetEra.trim()) {
       targetEra = "Present Day";
       setEra("Present Day");
    }

    if (destination && targetEra && !isTeleporting) {
      let coordsToUse = undefined;
      const coordString = selectedCoords ? `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}` : '';
      
      if ((activeTab === 'map' && selectedCoords) || (destination === coordString && selectedCoords)) {
        coordsToUse = selectedCoords;
      } else {
        const coordMatch = destination.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
        if (coordMatch) {
          coordsToUse = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[3]) };
        }
      }

      onTeleport(destination, targetEra, style, userImage || undefined, coordsToUse);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessingChat || isTeleporting) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsProcessingChat(true);

    try {
      const history = chatLog.map(c => c.text);
      const result = await api.parseTravelCommand(userMsg, history);
      
      setChatLog(prev => [...prev, { role: 'ai', text: result.reply }]);

      if (result.isJump && result.params) {
        setDestination(result.params.destination);
        setEra(result.params.era);
        onTeleport(result.params.destination, result.params.era, result.params.style, userImage || undefined);
      }
    } catch (e) {
      setChatLog(prev => [...prev, { role: 'ai', text: 'Error processing navigational data.' }]);
    } finally {
      setIsProcessingChat(false);
    }
  };

  const handleMapSelect = (coords: { lat: number; lng: number }) => {
    setSelectedCoords(coords);
    setDestination(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
  };

  const styles = Object.values(LocationStyle);
  const isSubmitDisabled = isTeleporting || !destination.trim();

  return (
    <div className="bg-cyber-800 border border-cyber-700 rounded-xl shadow-xl relative overflow-hidden group flex flex-col h-[500px] md:h-[600px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-500 to-transparent opacity-30"></div>

      <div className="flex border-b border-cyber-700 bg-cyber-900/50 shrink-0">
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'manual' ? 'bg-cyber-800 text-cyber-400 border-b-2 border-cyber-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Sliders className="w-4 h-4" /> MANUAL
        </button>
        <button 
          onClick={() => setActiveTab('terminal')}
          className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'terminal' ? 'bg-cyber-800 text-cyber-400 border-b-2 border-cyber-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Terminal className="w-4 h-4" /> TERMINAL
        </button>
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'map' ? 'bg-cyber-800 text-cyber-400 border-b-2 border-cyber-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Globe className="w-4 h-4" /> ORBITAL
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin relative">
        <div className="p-6 pb-0 flex flex-col h-full">
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-cyber-400 font-mono uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Target Coordinates
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Kyoto, Mars Colony, Times Square"
                  className="w-full bg-cyber-900 border border-cyber-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500 outline-none transition-all font-mono"
                  required
                  disabled={isTeleporting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-cyber-400 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Temporal Epoch
                </label>
                <input
                  type="text"
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  placeholder="e.g. 2050, 1920s, Present Day"
                  className="w-full bg-cyber-900 border border-cyber-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500 outline-none transition-all font-mono"
                  required
                  disabled={isTeleporting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-cyber-400 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Visual Renderer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {styles.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      disabled={isTeleporting}
                      className={`px-3 py-2 rounded-md text-[10px] uppercase font-mono text-left transition-all border truncate ${
                        style === s
                          ? 'bg-cyber-500/20 border-cyber-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                          : 'bg-cyber-900 border-cyber-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'terminal' && (
             <div className="h-full flex flex-col">
                <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-xs md:text-sm overflow-y-auto border border-cyber-800 space-y-3 mb-4">
                   {chatLog.map((msg, i) => (
                     <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <span className={`inline-block px-3 py-2 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-cyber-900 border border-cyber-700 text-white' 
                            : 'text-cyber-400 font-bold'
                        }`}>
                           {msg.role === 'ai' && <span className="mr-2 opacity-50">&gt;</span>}
                           {msg.text}
                        </span>
                     </div>
                   ))}
                   {isProcessingChat && (
                     <div className="text-left text-cyber-500 animate-pulse">
                       &gt; Analyzing request<span className="animate-pulse">_</span>
                     </div>
                   )}
                   <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleChatSubmit} className="relative shrink-0">
                   <input 
                     type="text" 
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     placeholder="Enter jump command (e.g. 'Take me to Paris, 1920')"
                     className="w-full bg-cyber-900 border border-cyber-700 rounded-lg pl-4 pr-12 py-3 text-white font-mono focus:border-cyber-500 outline-none"
                     disabled={isProcessingChat || isTeleporting}
                   />
                   <button 
                     type="submit"
                     disabled={!chatInput.trim() || isProcessingChat}
                     className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-cyber-500 hover:text-cyber-300 disabled:opacity-50"
                   >
                     <Send className="w-4 h-4" />
                   </button>
                </form>
             </div>
          )}

          {activeTab === 'map' && (
            <div className="h-full w-full flex flex-col relative">
               <div className="flex-1 w-full rounded-lg overflow-hidden border border-cyber-700 relative bg-black min-h-[250px]">
                  <MapSelector onSelect={handleMapSelect} />
               </div>
               
               {selectedCoords && (
                 <div className="mt-3 shrink-0 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyber-700 scrollbar-track-transparent">
                   <LocationInfo coordinates={selectedCoords} onWeatherUpdate={onWeatherUpdate} />
                 </div>
               )}
               
               <div className="mt-3 flex flex-col gap-2 shrink-0">
                  <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <span className="text-cyber-500">⚠ WARNING:</span> Orbital targeting system active.
                  </p>
                  
                  <div className="flex gap-2 items-stretch">
                     <div className="relative flex-1">
                        <Clock className="w-3 h-3 text-cyber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          value={era} 
                          onChange={(e) => setEra(e.target.value)}
                          placeholder="Era (e.g. Present Day)" 
                          className="w-full h-full bg-cyber-900 border border-cyber-700 rounded pl-8 pr-2 text-xs text-white placeholder-slate-600 focus:border-cyber-500 outline-none"
                        />
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {(activeTab === 'manual' || activeTab === 'map' || activeTab === 'terminal') && (
        <div className="shrink-0 p-4 pt-2 border-t border-cyber-700/50 bg-cyber-800 flex gap-3 items-center">
          <div className="shrink-0">
             <TravelerIdentity 
               userImage={userImage} 
               onImageChange={setUserImage} 
               isTeleporting={isTeleporting} 
             />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`flex-1 relative group overflow-hidden rounded-lg p-4 font-bold tracking-wider transition-all ${
              isSubmitDisabled
                ? 'bg-cyber-900 border border-cyber-800 text-slate-600 cursor-not-allowed'
                : 'bg-cyber-500 hover:bg-cyber-400 text-black shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.6)] cursor-pointer'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isTeleporting ? (
                <>
                  <LoaderIcon />
                  INITIATING JUMP...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> {activeTab === 'map' && selectedCoords ? 'JUMP TO COORDS' : 'ENGAGE TELEPORT'}
                </>
              )}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

const LoaderIcon = () => (
  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
