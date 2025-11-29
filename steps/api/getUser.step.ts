/**
 * Get User API Step
 * Returns the current authenticated user's data
 */

import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { authRequired } from '../middlewares/auth.middleware';

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  avatarUrl: z.string().optional(),
});

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'GetUser',
  description: 'Get current authenticated user',
  path: '/user',
  method: 'GET',
  virtualSubscribes: [],
  emits: [],
  flows: ['time-traveller-flow'],
  middleware: [authRequired],
  responseSchema: {
    // @ts-expect-error Zod schema type strictness
    200: z.object({
      user: userSchema,
    }),
    // @ts-expect-error Zod schema type strictness
    401: z.object({ error: z.string() }),
    // @ts-expect-error Zod schema type strictness
    404: z.object({ error: z.string() }),
    // @ts-expect-error Zod schema type strictness
    500: z.object({ error: z.string() }),
  },
};

export const handler: Handlers['GetUser'] = async (req, { logger, state }) => {
  const userId = req.userId;

  if (!userId) {
    logger.warn('GetUser: No userId in request');
    return {
      status: 401,
      body: { error: 'Unauthorized' },
    };
  }

  logger.info('GetUser: Fetching user data', { userId });

  try {
    // Get user from state
    const user = await state.get<{
      id: string;
      email: string;
      name: string;
      avatarUrl?: string;
    }>('users', userId);

    if (!user) {
      logger.warn('GetUser: User not found in state', { userId });
      return {
        status: 404,
        body: { error: 'User not found' },
      };
    }

    return {
      status: 200,
      body: { user },
    };
  } catch (error: any) {
    logger.error('GetUser: Error fetching user', { error: error.message });
    return {
      status: 500,
      body: { error: 'Failed to get user data' },
    };
  }
};

