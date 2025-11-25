import { ApiNode, ApiNodeProps } from 'motia/workbench';
import React from 'react';

export const Node: React.FC<ApiNodeProps> = (props) => {
  return (
    <ApiNode {...props}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            🚀
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{props.data.name}</span>
            <span className="text-xs text-gray-400">POST /teleport</span>
          </div>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Initiates time travel sequence
        </div>
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded">
            Image Generation
          </span>
          <span className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded">
            Location Details
          </span>
        </div>
      </div>
    </ApiNode>
  );
};

