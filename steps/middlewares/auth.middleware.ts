/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user info to request
 * Based on ChessArena.ai implementation: https://github.com/MotiaDev/chessarena-ai
 */

import { ApiMiddleware, ApiResponse } from 'motia';
import { verifyAccessToken, TokenData } from '../../services/supabase/authService';

// Extend the request type to include tokenInfo
declare module 'motia' {
  interface ApiRequest {
    tokenInfo?: TokenData;
    userId?: string;
  }
}

interface AuthOptions {
  required: boolean;
}

/**
 * Auth middleware factory
 * @param options - { required: boolean } - If true, returns 401 for missing/invalid tokens
 */
export const auth = ({ required }: AuthOptions): ApiMiddleware => {
  const authMiddleware: ApiMiddleware = async (req, ctx, next): Promise<ApiResponse<number, unknown>> => {
    ctx.logger.info('Auth middleware: Validating bearer token');

    // Get authorization header (case-insensitive)
    const authHeader = (req.headers['authorization'] ?? req.headers['Authorization']) as string | undefined;

    // No auth header
    if (!authHeader) {
      if (required) {
        ctx.logger.warn('Auth middleware: No authorization header found (required)');
        return {
          status: 401,
          body: { error: 'Unauthorized - No authorization header' },
        };
      } else {
        ctx.logger.info('Auth middleware: No authorization header (optional, continuing)');
        return next();
      }
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      ctx.logger.warn('Auth middleware: Invalid authorization header format');
      return {
        status: 401,
        body: { error: 'Unauthorized - Invalid authorization format' },
      };
    }

    const token = parts[1];

    try {
      const tokenData = verifyAccessToken(token);

      if (!tokenData) {
        ctx.logger.warn('Auth middleware: Invalid or expired token');
        return {
          status: 401,
          body: { error: 'Unauthorized - Invalid or expired token' },
        };
      }

      // Attach token data to request
      req.tokenInfo = tokenData;
      req.userId = tokenData.sub;

      ctx.logger.info('Auth middleware: Token validated successfully', { 
        userId: tokenData.sub,
        email: tokenData.email 
      });

      return next();
    } catch (error: any) {
      ctx.logger.error('Auth middleware: Token verification error', { error: error.message });
      return {
        status: 401,
        body: { error: 'Unauthorized' },
      };
    }
  };

  return authMiddleware;
};

/**
 * Pre-configured middleware for required auth
 */
export const authRequired = auth({ required: true });

/**
 * Pre-configured middleware for optional auth
 */
export const authOptional = auth({ required: false });

