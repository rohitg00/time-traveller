import React from 'react';
import { Zap, Map, Cpu, Server, Github } from 'lucide-react';
import { AuthButton } from './AuthButton';

export const Header: React.FC = () => {
  return (
    <header className="bg-cyber-800/80 backdrop-blur-md border-b border-cyber-700 sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo and Title - Responsive */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 group cursor-pointer select-none min-w-0 flex-shrink-0">
          {/* Icon - smaller on mobile */}
          <div className="relative flex-shrink-0">
             <div className="absolute inset-0 bg-cyber-500/30 blur-lg rounded-full animate-pulse-fast"></div>
             <div className="relative p-1.5 sm:p-2 md:p-2.5 bg-black/80 rounded-lg sm:rounded-xl border border-cyber-500/50 group-hover:border-cyber-400 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.5)] transition-all duration-300 transform group-hover:scale-105">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-cyber-500 group-hover:text-white transition-colors" />
             </div>
          </div>
          
          {/* Title - compact responsive text */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight text-white font-mono italic transform -skew-x-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
              <span className="hidden sm:inline">TIME </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 via-cyan-300 to-cyber-accent">
                <span className="hidden sm:inline">TRAVELLER</span>
                <span className="sm:hidden">TT</span>
              </span>
            </h1>
            {/* Subtitle - hidden on mobile */}
            <div className="hidden md:flex items-center gap-1 mt-0.5">
              <p className="text-[8px] lg:text-[9px] text-cyber-400/80 tracking-[0.1em] font-mono uppercase font-medium truncate">
                Visit Any Place • Any Era
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-shrink-0">
            {/* Tech Stack Indicators - Only on extra large screens (1280px+) */}
            <div className="hidden 2xl:flex items-center gap-4">
               <div className="flex flex-col items-end gap-1">
                 <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">System Integrity</div>
                 <div className="flex gap-1">
                    <div className="w-16 h-1 bg-cyber-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-cyber-500 animate-scan"></div>
                    </div>
                    <div className="w-2 h-1 bg-green-500 rounded-full animate-pulse"></div>
                 </div>
               </div>
               
               <div className="h-8 w-[1px] bg-cyber-700/50 mx-2"></div>
    
               <a
                 href="https://ai.google.dev/gemini-api/docs/image-generation"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="hover:underline"
               >
                 <TechBadge
                   icon={<Cpu className="w-3 h-3" />}
                   label="GEMINI 3 BANANA PRO"
                   color="text-purple-400"
                   glow="shadow-[0_0_10px_rgba(192,132,252,0.3)]"
                 />
               </a>
               <a
                 href="https://developers.google.com/maps/documentation#maps-documentation"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="hover:underline"
               >
                 <TechBadge
                   icon={<Map className="w-3 h-3" />}
                   label="STREET VIEW API"
                   color="text-yellow-400"
                   glow="shadow-[0_0_10px_rgba(250,204,21,0.3)]"
                 />
               </a>
               <a
                 href="https://www.motia.dev"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="hover:underline"
               >
                <TechBadge
                  icon={<Server className="w-3 h-3" />}
                  label="MOTIA Backend Framework"
                  color="text-cyber-500"
                  glow="shadow-[0_0_10px_rgba(0,102,255,0.4)]"
                />
               </a>
            </div>

            {/* GitHub Link - Always visible on all screens */}
            <a 
              href="https://github.com/rohitg00/time-traveller" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 md:gap-2 text-slate-400 hover:text-white transition-all hover:scale-105 group/gh"
              title="View Source on GitHub - Open Source"
            >
              <div className="p-1.5 md:p-2 bg-cyber-900/50 rounded-md md:rounded-lg border border-cyber-700 group-hover/gh:border-cyber-500/50 group-hover/gh:bg-cyber-800 transition-all">
                <Github className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="hidden sm:inline text-[10px] sm:text-xs font-mono font-bold tracking-wider">OPEN SOURCE</span>
            </a>

            {/* Auth Button */}
            <AuthButton />
        </div>
      </div>
    </header>
  );
};

const TechBadge: React.FC<{icon: React.ReactNode, label: string, color: string, glow: string}> = ({ icon, label, color, glow }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm font-mono text-[10px] tracking-wider hover:bg-white/5 transition-all cursor-help group ${glow}`}>
    <span className={`${color} group-hover:scale-110 transition-transform`}>{icon}</span>
    <span className="text-slate-400 font-bold group-hover:text-white transition-colors">{label}</span>
  </div>
);
