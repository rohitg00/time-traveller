import React from 'react';
import { TravelLogItem, getImageSrc } from '../types';
import { History, ChevronRight, Database, Clock, MapPin } from 'lucide-react';

interface HistoryLogProps {
  history: TravelLogItem[];
  onSelect: (item: TravelLogItem) => void;
  currentId?: string;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history, onSelect, currentId }) => {
  if (history.length === 0) {
      return (
        <div className="bg-cyber-800/50 border border-cyber-700/50 rounded-xl p-6 shadow-xl flex-1 flex flex-col min-h-[300px] backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                <div className="p-4 rounded-full bg-cyber-900/50 border border-cyber-700/30">
                    <Database className="w-6 h-6 opacity-50" />
                </div>
                <p className="font-mono text-xs uppercase tracking-widest">Temporal Database Empty</p>
            </div>
        </div>
      );
  }

  return (
    <div className="bg-cyber-800/80 border border-cyber-700 rounded-xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] flex-1 flex flex-col min-h-[250px] md:min-h-[300px] backdrop-blur-md relative overflow-hidden">
      {/* Decorative header line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-500/50 to-transparent"></div>
      
      <h3 className="text-xs font-bold text-cyber-500 mb-4 font-mono uppercase tracking-[0.2em] flex items-center gap-2">
        <History className="w-4 h-4" /> Temporal Archives
        <span className="ml-auto text-[10px] text-slate-500">{history.length} RECORDS</span>
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {history.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-300 group relative overflow-hidden animate-[slideIn_0.3s_ease-out_both] ${
              currentId === item.id
                ? 'bg-cyber-500/10 border-cyber-500 shadow-[0_0_15px_rgba(0,102,255,0.15)]'
                : 'bg-black/40 border-cyber-700/50 hover:bg-cyber-900/80 hover:border-cyber-500/50 hover:translate-x-1'
            }`}
          >
            {/* Background Grid Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-[size:10px_10px] bg-[linear-gradient(to_right,#0ea5e9_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e9_1px,transparent_1px)] pointer-events-none"></div>
            
            <div className="flex gap-3">
                {/* Mini Thumbnail */}
                <div className={`w-12 h-12 rounded border overflow-hidden shrink-0 ${currentId === item.id ? 'border-cyber-500' : 'border-cyber-700 group-hover:border-cyber-500/50'}`}>
                    {item.imageData ? (
                        <img src={getImageSrc(item.imageData)} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                        <div className="w-full h-full bg-cyber-900 flex items-center justify-center">
                            <div className="w-1 h-1 bg-cyber-500 rounded-full animate-ping"></div>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 relative z-10">
                    <span className={`font-bold font-mono text-xs truncate pr-2 ${currentId === item.id ? 'text-cyber-400' : 'text-slate-200 group-hover:text-white'}`}>
                        {item.destination}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono shrink-0 bg-black/50 px-1.5 py-0.5 rounded border border-cyber-900">
                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    </div>
                    
                    <div className="flex justify-between items-end relative z-10">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 opacity-50" /> {item.era}
                            </span>
                            <span className="text-[9px] text-cyber-600 uppercase tracking-wider">{item.style}</span>
                        </div>
                        
                        {currentId !== item.id && (
                            <ChevronRight className="w-3 h-3 text-cyber-700 group-hover:text-cyber-400 transform group-hover:translate-x-1 transition-all" />
                        )}
                        {currentId === item.id && (
                            <div className="flex gap-0.5 items-end">
                                <div className="w-0.5 h-1 bg-cyber-500 animate-[pulse_1s_ease-in-out_infinite]"></div>
                                <div className="w-0.5 h-2 bg-cyber-500 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                                <div className="w-0.5 h-1.5 bg-cyber-500 animate-[pulse_0.8s_ease-in-out_infinite]"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Active indicator bar */}
            {currentId === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyber-500 shadow-[0_0_10px_rgba(0,102,255,0.8)]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
