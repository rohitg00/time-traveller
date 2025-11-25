import { EventNode, EventNodeProps } from 'motia/workbench';
import React from 'react';

export const Node: React.FC<EventNodeProps> = (props) => {
  return (
    <EventNode {...props}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">
            📍
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{props.data.name}</span>
            <span className="text-xs text-gray-400">Gemini 2.5 Flash + Maps</span>
          </div>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Generates immersive location descriptions with Google Maps grounding
        </div>
        <div className="flex gap-1 mt-2">
          <span className="px-2 py-0.5 bg-green-900/30 text-green-300 text-xs rounded">
            Maps API
          </span>
          <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded">
            Grounding
          </span>
        </div>
      </div>
    </EventNode>
  );
};

