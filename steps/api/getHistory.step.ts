import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { authRequired } from '../middlewares/auth.middleware';
import { getHistory as getHistoryFromSupabase, isSupabaseConfigured } from '../../services/supabase/historyService';

const historyItemSchema = z.object({
  id: z.string(),
  destination: z.string(),
  era: z.string(),
  style: z.string(),
  imageUrl: z.string().optional(),
  description: z.string(),
  mapsUri: z.string().optional(),
  referenceImageUrl: z.string().optional(),
  usedStreetView: z.boolean().optional(),
  timestamp: z.number()
});

export const config: ApiRouteConfig = {
  name: 'GetHistory',
  type: 'api',
  path: '/history',
  method: 'GET',
  description: 'Gets the teleportation history for the authenticated user',
  emits: [],
  flows: ['time-traveller-flow'],
  middleware: [authRequired],
  queryParams: [
    { name: 'limit', description: 'Maximum number of items to return' }
  ],
  responseSchema: {
    // @ts-expect-error Zod schema type strictness
    200: z.object({
      history: z.array(historyItemSchema)
    }),
    // @ts-expect-error Zod schema type strictness
    401: z.object({ error: z.string() })
  }
};

export const handler: Handlers['GetHistory'] = async (req, { logger, traceId }) => {
  try {
    const userId = req.userId;
    if (!userId) {
      logger.warn('GetHistory: No userId in request');
      return {
        status: 401,
        body: { error: 'Unauthorized - User not authenticated' }
      };
    }

    const limit = parseInt(req.queryParams.limit as string) || 100;
    
    logger.info('Fetching teleport history for user', { traceId, userId, limit });
    
    if (!isSupabaseConfigured()) {
      logger.warn('Supabase not configured, returning empty history');
      return {
        status: 200,
        body: { history: [] }
      };
    }

    const history = await getHistoryFromSupabase(userId, limit);
    
    logger.info('History fetched successfully', { 
      traceId, 
      userId, 
      count: history.length 
    });
    
    return {
      status: 200,
      body: { history }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch history', { traceId, error: message });
    return {
      status: 200,
      body: { history: [] }
    };
  }
};
