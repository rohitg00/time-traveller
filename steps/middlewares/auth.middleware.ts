import { ApiMiddleware, ApiResponse } from 'motia';
import { verifyAccessToken, TokenData } from '../../services/supabase/authService';

declare module 'motia' {
  interface ApiRequest {
    tokenInfo?: TokenData;
    userId?: string;
  }
}

interface AuthOptions {
  required: boolean;
}

export const auth = ({ required }: AuthOptions): ApiMiddleware => {
  const authMiddleware: ApiMiddleware = async (req, ctx, next): Promise<ApiResponse<number, unknown>> => {
    ctx.logger.info('Auth middleware: Validating bearer token');

    const authHeader = (req.headers['authorization'] ?? req.headers['Authorization']) as string | undefined;

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

export const authRequired = auth({ required: true });

export const authOptional = auth({ required: false });

