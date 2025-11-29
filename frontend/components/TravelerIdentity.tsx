import React, { useRef, useState, useEffect } from 'react';
import { User, Upload, Camera, X, Circle } from 'lucide-react';

interface TravelerIdentityProps {
  userImage: string | null;
  onImageChange: (image: string | null) => void;
  isTeleporting: boolean;
}

export const TravelerIdentity: React.FC<TravelerIdentityProps> = ({ userImage, onImageChange, isTeleporting }) => {
  // Open by default if no image is selected
  const [isOpen, setIsOpen] = useState(!userImage);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Compress image utility
  const compressImage = (dataUrl: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
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
        const compressed = await compressImage(original);
        onImageChange(compressed);
        setIsOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch {
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        onImageChange(dataUrl);
        stopCamera();
        setIsOpen(false);
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  return (
    <div className="relative">
      {/* Identity Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center ${
          userImage 
            ? 'border-cyber-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]' 
            : 'border-cyber-700 bg-cyber-900 hover:border-cyber-500'
        }`}
        title="Traveler Identity"
      >
        {userImage ? (
          <img src={userImage} alt="User" className="w-full h-full object-cover" />
        ) : (
          <User className="w-5 h-5 text-cyber-500" />
        )}
        {/* Status Indicator */}
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-cyber-800 ${
          userImage ? 'bg-green-500' : 'bg-slate-500'
        }`}></div>
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-cyber-900 border border-cyber-600 rounded-lg shadow-xl p-3 z-50 animate-[slideIn_0.2s_ease-out]">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-cyber-800">
            <span className="text-xs font-mono font-bold text-cyber-400 uppercase">Identify Verification</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          {isCameraActive ? (
            <div className="relative bg-black rounded overflow-hidden aspect-video mb-2">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2">
                <button onClick={capturePhoto} className="p-1.5 bg-white rounded-full text-black hover:bg-gray-200">
                  <Circle className="w-5 h-5 fill-current" />
                </button>
                <button onClick={stopCamera} className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {userImage && (
                <div className="relative group mb-2">
                  <img src={userImage} alt="Preview" className="w-full h-24 object-cover rounded border border-cyber-500/30" />
                  <button 
                    onClick={() => onImageChange(null)}
                    className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTeleporting}
                  className="py-2 px-3 bg-cyber-800 hover:bg-cyber-700 border border-cyber-600 rounded flex items-center justify-center gap-2 text-xs text-slate-300"
                >
                  <Upload className="w-3 h-3" /> Upload
                </button>
                <button
                  onClick={startCamera}
                  disabled={isTeleporting}
                  className="py-2 px-3 bg-cyber-800 hover:bg-cyber-700 border border-cyber-600 rounded flex items-center justify-center gap-2 text-xs text-slate-300"
                >
                  <Camera className="w-3 h-3" /> Camera
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

