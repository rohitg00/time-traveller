import React from 'react';
import { Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-cyber-800/80 backdrop-blur-md border-b border-cyber-700 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="p-2 bg-cyber-500/10 rounded-lg border border-cyber-500/30 group-hover:border-cyber-500 group-hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all duration-300">
            <Zap className="w-6 h-6 text-cyber-500 group-hover:text-cyan-300 transition-colors" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-white font-mono">
              CHRONO<span className="text-cyber-500">PORT</span>
            </h1>
            <p className="text-xs text-cyber-400 tracking-widest font-mono uppercase opacity-70">
              Virtual Displacement System
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm font-mono text-slate-400">
           <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              SYSTEM ONLINE
           </span>
           <span className="opacity-50">|</span>
           <span>GEMINI CORE: ACTIVE</span>
        </div>
      </div>
    </header>
  );
};