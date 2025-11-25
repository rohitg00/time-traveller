import { EventNode, EventNodeProps } from 'motia/workbench';
import React from 'react';

export const Node: React.FC<EventNodeProps> = (props) => {
  return (
    <EventNode {...props}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg">
            🎨
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{props.data.name}</span>
            <span className="text-xs text-gray-400">Gemini 3 Pro Vision</span>
          </div>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Generates 2K photorealistic images with Street View context
        </div>
        <div className="flex gap-1 mt-2">
          <span className="px-2 py-0.5 bg-pink-900/30 text-pink-300 text-xs rounded">
            Multi-modal
          </span>
          <span className="px-2 py-0.5 bg-purple-900/30 text-purple-300 text-xs rounded">
            AI Generated
          </span>
        </div>
      </div>
    </EventNode>
  );
};

