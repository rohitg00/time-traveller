
import React, { useState, useRef, useEffect } from 'react';
import { LocationStyle } from '../types';
import { Send, MapPin, Clock, Palette, Camera, Upload, X, User, Circle, Terminal, Globe, Sliders } from 'lucide-react';
import { MapSelector } from './MapSelector';
import * as api from '../apiClient';

interface ControlPanelProps {
  onTeleport: (dest: string, era: string, style: string, referenceImage?: string, coordinates?: { lat: number, lng: number }) => void;
  isTeleporting: boolean;
}

type Tab = 'manual' | 'terminal' | 'map';

export const ControlPanel: React.FC<ControlPanelProps> = ({ onTeleport, isTeleporting }) => {
  const [activeTab, setActiveTab] = useState<Tab>('manual');
  
  // Manual State
  const [destination, setDestination] = useState('');
  const [era, setEra] = useState('');
  const [style, setStyle] = useState<string>(LocationStyle.REALISTIC);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Terminal State
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Time Traveller NavSystem v9.2 online. Awaiting command.' }
  ]);
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    
    let targetEra = era;
    
    // Auto-fill Era if missing (common when using Map tab)
    if (!targetEra.trim()) {
       targetEra = "Present Day";
       setEra("Present Day");
    }

    if (destination && targetEra && !isTeleporting) {
      // Determine if we should use the map coordinates
      let coordsToUse = undefined;
      
      const coordString = selectedCoords ? `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}` : '';
      
      // Prioritize selected coordinates if we are on the map tab OR if the input matches the selected coords
      if ((activeTab === 'map' && selectedCoords) || (destination === coordString && selectedCoords)) {
        coordsToUse = selectedCoords;
      } else {
        // Try to parse manually entered coordinates
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
        // Auto-populate manual fields for visibility
        setDestination(result.params.destination);
        setEra(result.params.era);
        
        // Trigger teleport
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

  // Compress image to reduce size (max 800px width, 0.7 quality)
  const compressImage = (dataUrl: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const original = reader.result as string;
        // Compress the image to reduce payload size
        const compressed = await compressImage(original);
        console.log(`Image compressed: ${(original.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
        setUserImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      // Capture at a reasonable size (max 800px)
      const maxWidth = 800;
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        // Use lower quality for smaller file size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        console.log(`Camera capture size: ${(dataUrl.length / 1024).toFixed(0)}KB`);
        setUserImage(dataUrl);
        stopCamera();
      }
    }
  };

  const clearImage = () => {
    setUserImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  const styles = Object.values(LocationStyle);
  const isSubmitDisabled = isTeleporting || !destination.trim();

  return (
    <div className="bg-cyber-800 border border-cyber-700 rounded-xl shadow-xl relative overflow-hidden group flex flex-col h-[500px] md:h-[600px]">
      {/* Decorative scanline */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-500 to-transparent opacity-30"></div>

      {/* Tabs */}
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
          
          {/* MANUAL TAB */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              
              {/* Destination Input */}
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

              {/* Era Input */}
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

              {/* Traveler Identity (Image Upload / Camera) */}
              <div className="space-y-2">
                <label className="text-xs text-cyber-400 font-mono uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3 h-3" /> Traveler Identity
                </label>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {isCameraActive ? (
                  <div className="relative bg-black rounded-lg overflow-hidden border border-cyber-500">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover transform scale-x-[-1]" />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                      <button type="button" onClick={capturePhoto} className="p-2 bg-white rounded-full text-black hover:bg-gray-200 shadow-lg z-10">
                        <Circle className="w-6 h-6 fill-current" />
                      </button>
                      <button type="button" onClick={stopCamera} className="p-2 bg-red-500/80 rounded-full text-white hover:bg-red-600 shadow-lg z-10">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : !userImage ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={triggerFileUpload}
                      disabled={isTeleporting}
                      className="flex-1 py-3 px-4 bg-cyber-900 border border-dashed border-cyber-600 rounded-lg hover:border-cyber-400 hover:bg-cyber-800 transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-white"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-xs md:text-sm font-mono">UPLOAD</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={isTeleporting}
                      className="flex-1 py-3 px-4 bg-cyber-900 border border-dashed border-cyber-600 rounded-lg hover:border-cyber-400 hover:bg-cyber-800 transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-white"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-xs md:text-sm font-mono">CAMERA</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative group/image">
                    <div className="w-full h-32 bg-black rounded-lg overflow-hidden border border-cyber-500/50 relative">
                      <img src={userImage} alt="Traveler" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                          <span className="text-xs font-mono text-cyber-300">● IDENTITY VERIFIED</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Style Selector */}
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

          {/* TERMINAL TAB */}
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

          {/* MAP TAB */}
          {activeTab === 'map' && (
            <div className="h-full w-full flex flex-col relative">
               <div className="flex-1 w-full rounded-lg overflow-hidden border border-cyber-700 relative bg-black min-h-[300px]">
                  <MapSelector onSelect={handleMapSelect} />
               </div>
               
               <div className="mt-4 flex flex-col gap-2 shrink-0">
                  <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <span className="text-cyber-500">⚠ WARNING:</span> Orbital targeting system active.
                  </p>
                  
                  <div className="flex gap-2 items-stretch">
                     {/* Mini Era Input for Map Mode */}
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

      {/* Fixed Submit Button Footer - Always visible */}
      {(activeTab === 'manual' || activeTab === 'map') && (
        <div className="shrink-0 p-4 pt-2 border-t border-cyber-700/50 bg-cyber-800">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`w-full relative group overflow-hidden rounded-lg p-4 font-bold tracking-wider transition-all ${
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
