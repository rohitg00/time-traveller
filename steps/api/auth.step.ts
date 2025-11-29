/**
 * Authentication API Step
 * Exchanges Supabase auth token for app JWT
 * Based on ChessArena.ai implementation: https://github.com/MotiaDev/chessarena-ai
 */

import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { 
  verifySupabaseToken, 
  createAccessToken, 
  User 
} from '../../services/supabase/authService';

// User schema for response
const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  avatarUrl: z.string().optional(),
});

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Auth',
  description: 'Exchange Supabase auth token for app JWT',
  path: '/auth',
  method: 'POST',
  virtualSubscribes: [],
  emits: [],
  flows: ['time-traveller-flow'],
  bodySchema: z.object({
    authToken: z.string().min(1, 'Auth token is required'),
  }),
  responseSchema: {
    // @ts-expect-error Zod schema type strictness
    200: z.object({
      accessToken: z.string(),
      user: userSchema,
    }),
    // @ts-expect-error Zod schema type strictness
    401: z.object({ error: z.string() }),
    // @ts-expect-error Zod schema type strictness
    500: z.object({ error: z.string() }),
  },
};

export const handler: Handlers['Auth'] = async (req, { logger, state }) => {
  logger.info('Auth: Token exchange request received');

  try {
    const { authToken } = req.body;

    // Verify the Supabase token
    const user = await verifySupabaseToken(authToken);

    if (!user) {
      logger.warn('Auth: Invalid Supabase token');
      return {
        status: 401,
        body: { error: 'Invalid or expired authentication token' },
      };
    }

    logger.info('Auth: User verified', { userId: user.id, email: user.email });

    // Store user in state for future reference
    await state.set('users', user.id, user);

    // Create app JWT
    const accessToken = createAccessToken(user.id, user.email, user.name);

    logger.info('Auth: Token exchange successful', { userId: user.id });

    return {
      status: 200,
      body: { 
        accessToken, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        }
      },
    };
  } catch (error: any) {
    logger.error('Auth: Token exchange failed', { error: error.message, stack: error.stack });
    return {
      status: 500,
      body: { error: 'Authentication failed' },
    };
  }
};

