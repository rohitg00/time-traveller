/**
 * Authentication Button Component
 * Shows sign in/out buttons and user info
 */

import React, { useState } from 'react';
import { LogIn, LogOut, ChevronDown, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import defaultAvatar from '../assets/default-avatar.svg';

export const AuthButton: React.FC = () => {
  const { user, loading, error, signInWithGoogle, signInWithGitHub, signOut, isAuthConfigured } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSignInOptions, setShowSignInOptions] = useState(false);

  // Don't show anything if auth is not configured
  if (!isAuthConfigured) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-cyber-900 border border-cyber-700 rounded-lg">
        <div className="w-4 h-4 border-2 border-cyber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-mono">AUTH</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 bg-cyber-900 border border-cyber-700 rounded-lg hover:border-cyber-500 transition-colors"
        >
          <img 
            src={user.avatarUrl || defaultAvatar} 
            alt={user.name} 
            className="w-6 h-6 rounded-full border border-cyber-500 bg-cyber-700"
          />
          <span className="text-sm text-white font-medium hidden sm:inline max-w-[100px] truncate">
            {user.name}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)} 
            />
            <div className="absolute right-0 mt-2 w-56 bg-cyber-800 border border-cyber-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-cyber-700">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  signOut();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-cyber-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowSignInOptions(!showSignInOptions)}
        className="flex items-center gap-2 px-4 py-2 bg-cyber-500 hover:bg-cyber-400 text-black font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(0,102,255,0.3)]"
      >
        <LogIn className="w-4 h-4" />
        <span className="text-sm">Sign In</span>
      </button>

      {showSignInOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSignInOptions(false)} 
          />
          <div className="absolute right-0 mt-2 w-56 bg-cyber-800 border border-cyber-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-cyber-700">
              <p className="text-sm font-medium text-white">Sign in to save your journeys</p>
              <p className="text-xs text-slate-400 mt-1">Your data will be private and secure</p>
            </div>
            
            <div className="p-2 space-y-2">
              <button
                onClick={() => {
                  signInWithGoogle();
                  setShowSignInOptions(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Continue with Google</span>
              </button>

              <button
                onClick={() => {
                  signInWithGitHub();
                  setShowSignInOptions(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">Continue with GitHub</span>
              </button>
            </div>

            {error && (
              <div className="p-2 mx-2 mb-2 bg-red-900/30 border border-red-500/50 rounded text-xs text-red-300">
                {error}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

