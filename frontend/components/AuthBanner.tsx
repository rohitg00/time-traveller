/**
 * Auth Banner Component
 * Shows a prominent sign-in prompt for unauthenticated users
 */

import React from 'react';
import { LogIn, Shield, Lock, Github, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AuthBanner: React.FC = () => {
  const { user, loading, signInWithGoogle, signInWithGitHub, isAuthConfigured } = useAuth();

  // Don't show if user is logged in
  if (user || loading) {
    return null;
  }

  // If auth is not configured, show a dev mode notice
  if (!isAuthConfigured) {
    return (
      <div className="bg-amber-900/30 border-b border-amber-500/30 px-4 py-2">
        <div className="container mx-auto flex items-center justify-center gap-2 text-amber-200 text-sm">
          <Shield className="w-4 h-4" />
          <span className="font-mono">DEV MODE: Auth not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-y-auto">
      <div className="w-full max-w-[95%] sm:max-w-md md:max-w-lg">
        {/* Main Sign-In Card */}
        <div className="bg-cyber-800/80 backdrop-blur-xl border border-cyber-500/50 rounded-xl sm:rounded-2xl shadow-[0_0_30px_rgba(0,102,255,0.15)] sm:shadow-[0_0_60px_rgba(0,102,255,0.2)] p-5 sm:p-6 md:p-8 lg:p-10 text-center relative overflow-hidden">
          {/* Background decorations - hidden on very small screens */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyber-500/5 via-transparent to-cyber-accent/5 pointer-events-none" />
          <div className="hidden sm:block absolute top-0 left-0 w-24 md:w-32 h-24 md:h-32 bg-cyber-500/10 rounded-full blur-3xl" />
          <div className="hidden sm:block absolute bottom-0 right-0 w-28 md:w-40 h-28 md:h-40 bg-cyber-accent/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            {/* Icon - smaller on mobile */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-cyber-500/20 to-cyber-accent/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 md:mb-6 border border-cyber-500/50 shadow-[0_0_20px_rgba(0,102,255,0.2)] sm:shadow-[0_0_30px_rgba(0,102,255,0.3)]">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-cyber-400" />
            </div>

            {/* Title - responsive text sizes */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 font-mono tracking-tight">
              TEMPORAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 to-cyber-accent">ACCESS</span>
            </h2>
            
            {/* Subtitle - responsive text */}
            <p className="text-slate-400 mb-5 sm:mb-6 md:mb-8 text-sm sm:text-base md:text-lg px-2">
              Sign in to unlock your personal time travel portal
            </p>

            {/* Features - stack on mobile, side by side on larger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-5 sm:mb-6 md:mb-8">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-300 bg-cyber-900/50 rounded-lg px-3 py-2 border border-cyber-700/50">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyber-400 flex-shrink-0" />
                <span>Private journey history</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-300 bg-cyber-900/50 rounded-lg px-3 py-2 border border-cyber-700/50">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                <span>Secure cloud storage</span>
              </div>
            </div>

            {/* Sign-in Buttons - responsive padding and text */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 md:py-4 bg-white hover:bg-gray-50 text-gray-800 rounded-lg sm:rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] hover:scale-[1.02] font-semibold text-sm sm:text-base"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
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
                <span className="hidden xs:inline">Continue with </span>Google
              </button>

              <button
                onClick={signInWithGitHub}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 md:py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg sm:rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] hover:scale-[1.02] font-semibold text-sm sm:text-base border border-gray-700"
              >
                <Github className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden xs:inline">Continue with </span>GitHub
              </button>
            </div>

            {/* Divider - smaller on mobile */}
            <div className="flex items-center gap-3 sm:gap-4 my-4 sm:my-5 md:my-6">
              <div className="flex-1 h-px bg-cyber-700/50" />
              <span className="text-[10px] sm:text-xs text-slate-500 font-mono">SECURE AUTH</span>
              <div className="flex-1 h-px bg-cyber-700/50" />
            </div>

            {/* Footer - smaller text on mobile */}
            <p className="text-[10px] sm:text-xs text-slate-500 px-2">
              Your data is encrypted and only accessible by you.<br className="hidden sm:inline" />
              <span className="sm:hidden"> </span>Powered by <span className="text-cyber-400">Supabase Auth</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Auth Required Modal
 * Shows when user tries to perform an action that requires authentication
 */
export const AuthRequiredModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  action?: string;
}> = ({ isOpen, onClose, action = 'continue' }) => {
  const { signInWithGoogle, signInWithGitHub } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-cyber-800 border border-cyber-500 rounded-2xl shadow-[0_0_50px_rgba(0,102,255,0.3)] p-8 max-w-md w-full animate-[slideIn_0.3s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-cyber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyber-500/50">
            <LogIn className="w-8 h-8 text-cyber-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 font-mono">
            AUTHENTICATION REQUIRED
          </h2>
          <p className="text-slate-400 mb-6">
            Sign in to {action} and keep your time travel journeys private and secure.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                signInWithGoogle();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg transition-all font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => {
                signInWithGitHub();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all font-medium border border-gray-700"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            By signing in, you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  );
};

