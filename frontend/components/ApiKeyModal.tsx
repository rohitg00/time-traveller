import React, { useState } from 'react';
import { X, Key, Sparkles, Map, ExternalLink, Check, AlertTriangle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKeys: (geminiKey: string, mapsKey: string) => void;
  generationsUsed: number;
  maxFreeGenerations: number;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSaveKeys,
  generationsUsed,
  maxFreeGenerations 
}) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [mapsKey, setMapsKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showMapsKey, setShowMapsKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (geminiKey.trim()) {
      onSaveKeys(geminiKey.trim(), mapsKey.trim());
      onClose();
    }
  };

  const remainingGenerations = Math.max(0, maxFreeGenerations - generationsUsed);
  const hasReachedLimit = remainingGenerations === 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-cyber-900 border border-cyber-500/50 rounded-2xl shadow-[0_0_60px_rgba(0,102,255,0.3)]">
        {!hasReachedLimit && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 md:p-8">
          {hasReachedLimit ? (
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/50">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-mono">FREE LIMIT REACHED</h2>
              <p className="text-slate-400">
                You've used all <span className="text-cyber-400 font-bold">{maxFreeGenerations}</span> free generations.
                Add your own API keys to continue time traveling!
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-cyber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyber-500/50">
                <Key className="w-8 h-8 text-cyber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-mono">USE YOUR OWN API KEYS</h2>
              <p className="text-slate-400">
                <span className="text-cyber-400 font-bold">{remainingGenerations}</span> free generations remaining.
                Add your own keys for unlimited access!
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Gemini API Key Section */}
            <div className="bg-cyber-800/50 rounded-xl p-5 border border-cyber-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Gemini API Key</h3>
                  <p className="text-xs text-slate-500">Required for AI image generation</p>
                </div>
              </div>

              <div className="relative mb-3">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 bg-cyber-900 border border-cyber-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyber-500 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  {showGeminiKey ? 'Hide' : 'Show'}
                </button>
              </div>

              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-cyber-400 hover:text-cyber-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Get your free Gemini API key
              </a>

              <div className="mt-3 p-3 bg-cyber-900/50 rounded-lg border border-cyber-700/30">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-cyber-400 font-bold">How to get:</span> Visit Google AI Studio → Click "Get API key" → Create a new key or use existing one. 
                  Supports <span className="text-purple-400">Gemini 2.5 Flash</span> (Nano Banana) & <span className="text-purple-400">Gemini 3 Pro</span> (Nano Banana Pro).
                </p>
              </div>
            </div>

            {/* Google Maps API Key Section */}
            <div className="bg-cyber-800/50 rounded-xl p-5 border border-cyber-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Map className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Google Maps API Key</h3>
                  <p className="text-xs text-slate-500">Optional - for Street View integration</p>
                </div>
              </div>

              <div className="relative mb-3">
                <input
                  type={showMapsKey ? 'text' : 'password'}
                  value={mapsKey}
                  onChange={(e) => setMapsKey(e.target.value)}
                  placeholder="AIzaSy... (optional)"
                  className="w-full px-4 py-3 bg-cyber-900 border border-cyber-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyber-500 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowMapsKey(!showMapsKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  {showMapsKey ? 'Hide' : 'Show'}
                </button>
              </div>

              <a
                href="https://developers.google.com/maps/documentation/javascript/get-api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Get Google Maps API key
              </a>

              <div className="mt-3 p-3 bg-cyber-900/50 rounded-lg border border-cyber-700/30">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-green-400 font-bold">How to get:</span> Go to Google Cloud Console → Enable Maps JavaScript API & Street View API → Create credentials → Copy API key.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!hasReachedLimit && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-cyber-700 text-slate-300 rounded-lg hover:bg-cyber-800 transition-colors font-mono"
                >
                  MAYBE LATER
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!geminiKey.trim()}
                className={`${hasReachedLimit ? 'w-full' : 'flex-1'} py-3 px-4 bg-cyber-500 hover:bg-cyber-400 disabled:bg-cyber-500/30 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors font-mono flex items-center justify-center gap-2`}
              >
                <Check className="w-4 h-4" />
                {hasReachedLimit ? 'ADD KEY TO CONTINUE' : 'SAVE & UNLOCK'}
              </button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-gradient-to-r from-cyber-500/10 to-purple-500/10 rounded-lg border border-cyber-500/30">
              <p className="text-xs text-slate-300 leading-relaxed text-center">
                🔒 Your API keys are stored locally in your browser and never sent to our servers.
                <br />
                <span className="text-slate-500">Keys are only used for direct API calls to Google services.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

