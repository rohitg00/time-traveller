import React, { useRef, useState, useEffect } from 'react';
import { User, Upload, Camera, X, Plus, Users, Star, Package, Circle } from 'lucide-react';
import { ReferenceImage, MAX_REFERENCE_IMAGES, MAX_PERSON_IMAGES } from '../types';

interface MultiImageUploadProps {
  images: ReferenceImage[];
  onImagesChange: (images: ReferenceImage[]) => void;
  isTeleporting: boolean;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ 
  images, 
  onImagesChange, 
  isTeleporting 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeImageType, setActiveImageType] = useState<'person' | 'celebrity' | 'object'>('person');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const personImages = images.filter(img => img.type === 'person' || img.type === 'celebrity');
  const objectImages = images.filter(img => img.type === 'object');

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
    const files = e.target.files;
    if (!files) return;

    const newImages: ReferenceImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      if (images.length + newImages.length >= MAX_REFERENCE_IMAGES) break;
      
      const file = files[i];
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onloadend = async () => {
          const original = reader.result as string;
          const compressed = await compressImage(original);
          newImages.push({
            id: `img-${Date.now()}-${i}`,
            data: compressed,
            type: activeImageType,
            label: activeImageType === 'celebrity' ? 'Celebrity' : activeImageType === 'person' ? 'You' : 'Object'
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    
    onImagesChange([...images, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
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
    if (videoRef.current && images.length < MAX_REFERENCE_IMAGES) {
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
        onImagesChange([...images, {
          id: `img-${Date.now()}`,
          data: dataUrl,
          type: activeImageType,
          label: activeImageType === 'celebrity' ? 'Celebrity' : activeImageType === 'person' ? 'You' : 'Object'
        }]);
        stopCamera();
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

  const getTypeIcon = (type: 'person' | 'celebrity' | 'object') => {
    switch (type) {
      case 'person': return <User className="w-2.5 h-2.5" />;
      case 'celebrity': return <Star className="w-2.5 h-2.5" />;
      case 'object': return <Package className="w-2.5 h-2.5" />;
    }
  };

  const getTypeColor = (type: 'person' | 'celebrity' | 'object') => {
    switch (type) {
      case 'person': return 'border-cyber-500 bg-cyber-500/20';
      case 'celebrity': return 'border-yellow-500 bg-yellow-500/20';
      case 'object': return 'border-purple-500 bg-purple-500/20';
    }
  };

  return (
    <div className="relative">
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
          images.length > 0 
            ? 'border-cyber-500 bg-cyber-500/10 shadow-[0_0_10px_rgba(14,165,233,0.3)]' 
            : 'border-cyber-700 bg-cyber-900 hover:border-cyber-500'
        }`}
        title="Add Reference Images"
      >
        {images.length > 0 ? (
          <>
            <div className="flex -space-x-2">
              {images.slice(0, 3).map((img, i) => (
                <img 
                  key={img.id} 
                  src={img.data} 
                  alt="" 
                  className={`w-6 h-6 rounded-full object-cover border-2 ${getTypeColor(img.type)}`}
                  style={{ zIndex: 3 - i }}
                />
              ))}
              {images.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-cyber-700 border-2 border-cyber-600 flex items-center justify-center text-[8px] text-white font-bold">
                  +{images.length - 3}
                </div>
              )}
            </div>
            <span className="text-[10px] text-cyber-400 font-mono">{images.length}</span>
          </>
        ) : (
          <>
            <Users className="w-4 h-4 text-cyber-500" />
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">ADD PHOTOS</span>
          </>
        )}
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-cyber-900 border border-cyber-600 rounded-lg shadow-xl p-3 z-50 animate-[slideIn_0.2s_ease-out]">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-cyber-800">
            <div>
              <span className="text-xs font-mono font-bold text-cyber-400 uppercase block">Multi-Image Upload</span>
              <span className="text-[9px] text-slate-500">Up to 14 images • 5 people + 6 objects</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Image Type Selector */}
          <div className="flex gap-1 mb-3">
            {(['person', 'celebrity', 'object'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveImageType(type)}
                className={`flex-1 py-1.5 px-2 rounded text-[9px] font-mono uppercase flex items-center justify-center gap-1 transition-all border ${
                  activeImageType === type
                    ? type === 'person' ? 'bg-cyber-500/20 border-cyber-500 text-cyber-400' :
                      type === 'celebrity' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
                      'bg-purple-500/20 border-purple-500 text-purple-400'
                    : 'bg-cyber-800 border-cyber-700 text-slate-500 hover:border-slate-500'
                }`}
              >
                {getTypeIcon(type)}
                {type === 'person' ? 'You' : type === 'celebrity' ? 'Celeb' : 'Object'}
              </button>
            ))}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            multiple
            className="hidden" 
          />

          {isCameraActive ? (
            <div className="relative bg-black rounded overflow-hidden aspect-video mb-3">
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
            <>
              {/* Current Images Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {images.map((img) => (
                    <div key={img.id} className={`relative group aspect-square rounded overflow-hidden border-2 ${getTypeColor(img.type)}`}>
                      <img src={img.data} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(img.id)}
                        className="absolute top-0.5 right-0.5 bg-black/70 text-white p-0.5 rounded-full hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[7px] text-center py-0.5 text-white font-mono">
                        {img.label || img.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTeleporting || images.length >= MAX_REFERENCE_IMAGES}
                  className="py-2 px-3 bg-cyber-800 hover:bg-cyber-700 border border-cyber-600 rounded flex items-center justify-center gap-2 text-xs text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-3 h-3" /> Upload
                </button>
                <button
                  onClick={startCamera}
                  disabled={isTeleporting || images.length >= MAX_REFERENCE_IMAGES}
                  className="py-2 px-3 bg-cyber-800 hover:bg-cyber-700 border border-cyber-600 rounded flex items-center justify-center gap-2 text-xs text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-3 h-3" /> Camera
                </button>
              </div>

              {/* Info Text */}
              <div className="mt-2 text-[8px] text-slate-500 font-mono space-y-0.5">
                <p>📸 <span className="text-cyber-400">You</span>: Your photo to place in the scene</p>
                <p>⭐ <span className="text-yellow-400">Celebrity</span>: Famous person to appear with</p>
                <p>📦 <span className="text-purple-400">Object</span>: Items to include in the image</p>
              </div>
            </>
          )}

          {/* Capacity Indicator */}
          <div className="mt-3 pt-2 border-t border-cyber-800">
            <div className="flex justify-between text-[9px] text-slate-500 font-mono mb-1">
              <span>People: {personImages.length}/{MAX_PERSON_IMAGES}</span>
              <span>Total: {images.length}/{MAX_REFERENCE_IMAGES}</span>
            </div>
            <div className="h-1 bg-cyber-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyber-500 to-purple-500 transition-all"
                style={{ width: `${(images.length / MAX_REFERENCE_IMAGES) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

