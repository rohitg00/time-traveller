// Optional file for future expansion, currently logic is in App.tsx
// Keeping structure clean if we want to refactor later.
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="min-h-screen bg-cyber-900 text-white">{children}</div>;
};