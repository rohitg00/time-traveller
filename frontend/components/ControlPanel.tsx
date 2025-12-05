
import React, { useState, useRef, useEffect } from 'react';
import { LocationStyle, ImageConfig, AspectRatio, ImageSize, ASPECT_RATIO_OPTIONS, IMAGE_SIZE_OPTIONS, DEFAULT_IMAGE_CONFIG, ReferenceImage } from '../types';
import { Send, MapPin, Clock, Palette, Camera, Upload, X, User, Circle, Terminal, Globe, Sliders, Image, Maximize2, Settings2 } from 'lucide-react';
import { MapSelector } from './MapSelector';
import { LocationInfo } from './LocationInfo';
import { MultiImageUpload } from './MultiImageUpload';
import * as api from '../apiClient';

const getStyleDescription = (style: string): string => {
  const descriptions: Record<string, string> = {
    [LocationStyle.REALISTIC]: 'High-fidelity photorealistic rendering',
    [LocationStyle.CYBERPUNK]: 'Neon-lit futuristic sci-fi aesthetic',
    [LocationStyle.VINTAGE]: 'Classic film grain and warm tones',
    [LocationStyle.PAINTING]: 'Artistic oil painting style',
    [LocationStyle.SURREAL]: 'Dreamlike surrealist imagery',
    [LocationStyle.DISPOSABLE]: 'Low-quality disposable camera look with imperfections',
    [LocationStyle.PHOTOBOOK]: 'Beautiful photo book layout with elegant typography',
    [LocationStyle.AERIAL]: 'Drone/aerial view looking down from the sky',
    [LocationStyle.CINEMATIC_GRID]: '9-shot cinematic contact sheet with multiple angles',
    [LocationStyle.PHOTO_GRID_3X3]: '3×3 grid with same pose, 9 different camera angles',
    [LocationStyle.CCTV]: 'CCTV surveillance camera style with noise',
    [LocationStyle.WEATHER_REALTIME]: 'Matches real-time local weather and time of day',
    [LocationStyle.LIGHT_LEAK]: 'Retro failed photo with light leaks and blur',
    [LocationStyle.HYPER_CANDID]: 'Ultra-realistic candid street photography, 8K raw style',
    [LocationStyle.PHOTO_RESTORATION]: 'Restore & enhance old/damaged photos to 16K quality',
    [LocationStyle.PIXAR_3D]: 'Pixar-style 3D cartoon portrait with expressive characters',
  };
  return descriptions[style] || style;
};

interface ControlPanelProps {
  onTeleport: (dest: string, era: string, style: string, referenceImage?: string, coordinates?: { lat: number, lng: number }, imageConfig?: ImageConfig, referenceImages?: ReferenceImage[]) => void;
  isTeleporting: boolean;
  onWeatherUpdate?: (condition: string) => void;
}

type Tab = 'manual' | 'terminal' | 'map';

export const ControlPanel: React.FC<ControlPanelProps> = ({ onTeleport, isTeleporting, onWeatherUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('manual');
  
  const [destination, setDestination] = useState('');
  const [era, setEra] = useState('');
  const [style, setStyle] = useState<string>(LocationStyle.REALISTIC);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Time Traveller NavSystem v9.2 online. Awaiting command.' }
  ]);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [imageConfig, setImageConfig] = useState<ImageConfig>(DEFAULT_IMAGE_CONFIG);
  const [showImageSettings, setShowImageSettings] = useState(true);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);

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

      // Use multi-image array for reference images
      const imagesToUse = referenceImages.length > 0 ? referenceImages : undefined;
      onTeleport(destination, targetEra, style, undefined, coordsToUse, imageConfig, imagesToUse);
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
        onTeleport(result.params.destination, result.params.era, result.params.style, undefined, undefined, undefined, referenceImages.length > 0 ? referenceImages : undefined);
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
                <div className="max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyber-700 scrollbar-track-transparent pr-1">
                  <div className="grid grid-cols-2 gap-2">
                    {styles.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStyle(s)}
                        disabled={isTeleporting}
                        className={`px-3 py-2 rounded-md text-[9px] uppercase font-mono text-left transition-all border truncate ${
                          style === s
                            ? 'bg-cyber-500/20 border-cyber-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                            : 'bg-cyber-900 border-cyber-700 text-slate-400 hover:border-slate-500'
                        }`}
                        title={getStyleDescription(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 font-mono">Hover for style details</p>
              </div>

              {/* Image Configuration */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowImageSettings(!showImageSettings)}
                  className="w-full flex items-center justify-between text-xs text-cyber-400 font-mono uppercase tracking-wider hover:text-cyber-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-3 h-3" /> Image Settings
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {imageConfig.aspectRatio} • {imageConfig.imageSize}
                  </span>
                </button>
                
                {showImageSettings && (
                  <div className="bg-cyber-900/50 border border-cyber-700 rounded-lg p-3 space-y-3 animate-[slideIn_0.2s_ease-out]">
                    {/* Aspect Ratio */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-mono uppercase flex items-center gap-1">
                        <Maximize2 className="w-2.5 h-2.5" /> Aspect Ratio
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {ASPECT_RATIO_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setImageConfig(prev => ({ ...prev, aspectRatio: option.value }))}
                            disabled={isTeleporting}
                            className={`px-2 py-1.5 rounded text-[8px] font-mono transition-all border ${
                              imageConfig.aspectRatio === option.value
                                ? 'bg-cyber-500/20 border-cyber-500 text-white'
                                : 'bg-cyber-900 border-cyber-800 text-slate-500 hover:border-cyber-600'
                            }`}
                            title={option.description}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Size */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-mono uppercase flex items-center gap-1">
                        <Image className="w-2.5 h-2.5" /> Resolution
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {IMAGE_SIZE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setImageConfig(prev => ({ ...prev, imageSize: option.value }))}
                            disabled={isTeleporting}
                            className={`px-2 py-2 rounded text-[9px] font-mono transition-all border flex flex-col items-center ${
                              imageConfig.imageSize === option.value
                                ? 'bg-cyber-500/20 border-cyber-500 text-white'
                                : 'bg-cyber-900 border-cyber-800 text-slate-500 hover:border-cyber-600'
                            }`}
                            title={option.description}
                          >
                            <span className="font-bold">{option.label}</span>
                            <span className="text-[7px] opacity-60">{option.resolution}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[8px] text-slate-600 font-mono">
                        {imageConfig.imageSize === '4K' ? '⚠️ 4K may take longer to generate' : 
                         imageConfig.imageSize === '1K' ? '⚡ Fast generation' : 
                         '✨ Recommended for quality/speed balance'}
                      </p>
                    </div>
                  </div>
                )}
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
        <div className="shrink-0 p-4 pt-2 border-t border-cyber-700/50 bg-cyber-800 flex gap-2 items-center">
          <div className="shrink-0">
            <MultiImageUpload
              images={referenceImages}
              onImagesChange={setReferenceImages}
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
