/**
 * Supabase Authentication Service
 * Based on ChessArena.ai implementation: https://github.com/MotiaDev/chessarena-ai
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase admin client (uses service role key for server-side operations)
 */
function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required for auth');
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return supabaseAdmin;
}

/**
 * User data structure
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Token data embedded in JWT
 */
export interface TokenData {
  sub: string; // User ID
  email?: string;
  name?: string;
}

/**
 * Verify a Supabase auth token and return user data
 */
export async function verifySupabaseToken(authToken: string): Promise<User | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(authToken);
    
    if (error || !data.user) {
      return null;
    }
    
    const user = data.user;
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture
    };
  } catch {
    return null;
  }
}

/**
 * Create a JWT access token for the user
 */
export function createAccessToken(userId: string, email?: string, name?: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiration = process.env.JWT_EXPIRATION || '30d';
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  const tokenData: TokenData = { 
    sub: userId,
    email,
    name
  };
  
  return jwt.sign(tokenData, jwtSecret, { expiresIn: jwtExpiration as any });
}

/**
 * Verify a JWT access token and return token data
 */
export function verifyAccessToken(token: string): TokenData | null {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret) as TokenData;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if auth is properly configured
 */
export function isAuthConfigured(): boolean {
  return !!(
    process.env.SUPABASE_URL && 
    process.env.SUPABASE_SERVICE_ROLE_KEY && 
    process.env.JWT_SECRET
  );
}

