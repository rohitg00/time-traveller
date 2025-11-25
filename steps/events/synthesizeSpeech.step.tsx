import { EventNode, EventNodeProps } from 'motia/workbench';
import React from 'react';

export const Node: React.FC<EventNodeProps> = (props) => {
  return (
    <EventNode {...props}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg">
            🔊
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{props.data.name}</span>
            <span className="text-xs text-gray-400">Gemini TTS (Fenrir)</span>
          </div>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Synthesizes natural speech narration from location description
        </div>
        <div className="flex gap-1 mt-2">
          <span className="px-2 py-0.5 bg-orange-900/30 text-orange-300 text-xs rounded">
            Text-to-Speech
          </span>
          <span className="px-2 py-0.5 bg-red-900/30 text-red-300 text-xs rounded">
            24kHz Audio
          </span>
        </div>
      </div>
    </EventNode>
  );
};

