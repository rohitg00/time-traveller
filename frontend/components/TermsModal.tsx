import React from 'react';
import { X, Shield, Clock, Database, Crown } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative max-w-2xl w-full bg-cyber-900 border border-cyber-700 rounded-2xl shadow-[0_0_100px_rgba(14,165,233,0.2)] overflow-hidden animate-[fadeIn_0.2s_ease-out] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-cyber-800 bg-cyber-900/50">
          <h2 className="text-xl font-bold text-white font-mono tracking-wide flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyber-500" />
            TERMS & PRIVACY PROTOCOL
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-cyber-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto text-slate-300 space-y-6 text-sm leading-relaxed">
          
          <section>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-base">
              <Database className="w-4 h-4 text-cyber-400" />
              Data Storage & Retention
            </h3>
            <p className="mb-3">
              Time Traveller uses secure storage protocols to save your generated images, audio logs, and travel history. 
              To maintain system efficiency and privacy:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-cyber-300">Free Tier Retention:</strong> All travel data (images, audio, logs) for free users is stored for a maximum of <strong className="text-white">3 days</strong>.
              </li>
              <li>
                After this period, data is automatically purged from our quantum archives to free up storage sectors.
              </li>
              <li>
                We recommend downloading any important visual records to your local device immediately after your journey.
              </li>
            </ul>
          </section>

          <div className="h-px bg-cyber-800/50" />

          <section>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-base">
              <Crown className="w-4 h-4 text-yellow-400" />
              Time Traveller PRO (Coming Soon)
            </h3>
            <div className="bg-gradient-to-r from-cyber-900 to-cyber-800 border border-cyber-700 p-4 rounded-xl">
              <p className="mb-2">
                Upgrade your clearance level to access extended features:
              </p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-cyber-500" />
                  <span>Unlimited history retention (Lifetime Storage)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-cyber-500" />
                  <span>Higher resolution rendering (16K Upscaling)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-cyber-500" />
                  <span>Priority queue for image generation</span>
                </li>
              </ul>
            </div>
          </section>

          <div className="h-px bg-cyber-800/50" />

          <section>
            <h3 className="text-white font-bold mb-3 text-base">Privacy Commitment</h3>
            <p>
              We do not sell your personal data or travel logs to third-party timelines. 
              Your uploaded reference photos are processed solely for the purpose of generating your requested visualization 
              and are not used for training public AI models without your explicit consent.
            </p>
          </section>

        </div>

        <div className="p-6 border-t border-cyber-800 bg-cyber-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cyber-500 hover:bg-cyber-400 text-black font-bold font-mono rounded-lg transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)]"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
};

