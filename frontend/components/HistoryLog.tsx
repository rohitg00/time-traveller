import React from 'react';
import { TravelLogItem } from '../types';
import { History, ChevronRight } from 'lucide-react';

interface HistoryLogProps {
  history: TravelLogItem[];
  onSelect: (item: TravelLogItem) => void;
  currentId?: string;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history, onSelect, currentId }) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-cyber-800 border border-cyber-700 rounded-xl p-6 shadow-xl flex-1 flex flex-col min-h-[300px]">
      <h3 className="text-sm font-bold text-cyber-400 mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
        <History className="w-4 h-4" /> Jump Log
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`w-full text-left p-3 rounded-lg border transition-all group relative overflow-hidden ${
              currentId === item.id
                ? 'bg-cyber-500/10 border-cyber-500/50'
                : 'bg-cyber-900/50 border-cyber-700/50 hover:bg-cyber-800 hover:border-cyber-600'
            }`}
          >
            <div className="flex justify-between items-start mb-1 relative z-10">
              <span className={`font-bold font-mono text-sm ${currentId === item.id ? 'text-cyber-400' : 'text-slate-200'}`}>
                {item.destination}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            
            <div className="flex justify-between items-end relative z-10">
               <span className="text-xs text-slate-400 font-light">{item.era}</span>
               {currentId !== item.id && (
                 <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyber-400 transform group-hover:translate-x-1 transition-all" />
               )}
            </div>

            {/* Active indicator */}
            {currentId === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyber-500"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};