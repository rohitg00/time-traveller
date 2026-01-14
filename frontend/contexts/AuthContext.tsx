import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging to help diagnose initialization issues
console.log('[AuthContext] Initializing Supabase client...', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl,
});

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  });
  console.log('[AuthContext] ✅ Supabase client created successfully');

  // Expose to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).supabase = supabase;
    console.log('[AuthContext] ✅ Supabase client exposed to window.supabase');
  }
} else {
  console.error('[AuthContext] ❌ Supabase client NOT created - missing environment variables!', {
    VITE_SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING',
  });
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AppUser | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthConfigured = !!(supabaseUrl && supabaseAnonKey);

  const exchangeToken = async (supabaseToken: string): Promise<{ accessToken: string; user: AppUser } | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authToken: supabaseToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token exchange failed');
      }

      return await response.json();
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessTokenInUrl = hashParams.get('access_token');
    
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
        if (error) {
          if (error.message.includes('code') && error.message.includes('verifier')) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              setSession(sessionData.session);
              setSupabaseUser(sessionData.session.user ?? null);
              const result = await exchangeToken(sessionData.session.access_token);
              if (result) {
                setAccessToken(result.accessToken);
                setUser(result.user);
                localStorage.setItem('tt_access_token', result.accessToken);
                localStorage.setItem('tt_user', JSON.stringify(result.user));
              }
            }
            setLoading(false);
            return;
          }
          setError(error.message);
          setLoading(false);
          return;
        }
        
        if (data.session) {
          setSession(data.session);
          setSupabaseUser(data.session.user ?? null);
          
          const result = await exchangeToken(data.session.access_token);
          if (result) {
            setAccessToken(result.accessToken);
            setUser(result.user);
            localStorage.setItem('tt_access_token', result.accessToken);
            localStorage.setItem('tt_user', JSON.stringify(result.user));
          }
        }
        
        setLoading(false);
      });
      return;
    }
    
    if (accessTokenInUrl) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setSupabaseUser(initialSession?.user ?? null);

      if (initialSession?.access_token) {
        const result = await exchangeToken(initialSession.access_token);
        if (result) {
          setAccessToken(result.accessToken);
          setUser(result.user);
          localStorage.setItem('tt_access_token', result.accessToken);
          localStorage.setItem('tt_user', JSON.stringify(result.user));
        }
        } else {
        const storedToken = localStorage.getItem('tt_access_token');
        const storedUser = localStorage.getItem('tt_user');
        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      }

      setLoading(false);
    });

    let isSigningIn = false;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' && newSession?.access_token) {
        isSigningIn = true;
        setSession(newSession);
        setSupabaseUser(newSession?.user ?? null);
        
        const result = await exchangeToken(newSession.access_token);
        if (result) {
          setAccessToken(result.accessToken);
          setUser(result.user);
          localStorage.setItem('tt_access_token', result.accessToken);
          localStorage.setItem('tt_user', JSON.stringify(result.user));
          setLoading(false);
        }
        
        setTimeout(() => { isSigningIn = false; }, 2000);
      } else if (event === 'SIGNED_OUT') {
        if (isSigningIn) return;
        setSession(null);
        setSupabaseUser(null);
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('tt_access_token');
        localStorage.removeItem('tt_user');
      } else if (event === 'INITIAL_SESSION') {
        setSession(newSession);
        setSupabaseUser(newSession?.user ?? null);
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
        setSupabaseUser(newSession?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      setError('Authentication not configured');
      return;
    }

    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: false,
      },
    });

    if (signInError) {
      setError(signInError.message);
    }
  };

  const signInWithGitHub = async () => {
    if (!supabase) {
      setError('Authentication not configured');
      return;
    }

    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: false,
      },
    });

    if (signInError) {
      setError(signInError.message);
    }
  };

  const signOut = async () => {
    if (!supabase) return;

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    } else {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('tt_access_token');
      localStorage.removeItem('tt_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        accessToken,
        loading,
        error,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
        isAuthConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
