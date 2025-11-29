import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { authRequired } from '../middlewares/auth.middleware';

const historyItemSchema = z.object({
  id: z.string(),
  destination: z.string(),
  era: z.string(),
  style: z.string(),
  imageUrl: z.string().optional(), // URL from Supabase
  imageData: z.string().optional(), // Fallback for backwards compatibility
  description: z.string(),
  mapsUri: z.string().optional(),
  referenceImageUrl: z.string().optional(), // URL from Supabase
  referenceImage: z.string().optional(), // Fallback for backwards compatibility
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
  middleware: [authRequired], // Auth required - only show user's own data
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

interface HistoryItem {
  id: string;
  destination: string;
  era: string;
  style: string;
  imageUrl?: string; // URL from Supabase
  imageData?: string; // Fallback for backwards compatibility
  description: string;
  mapsUri?: string;
  referenceImageUrl?: string; // URL from Supabase
  referenceImage?: string; // Fallback for backwards compatibility
  usedStreetView?: boolean;
  timestamp: number;
  userId?: string; // Added for filtering
}

export const handler: Handlers['GetHistory'] = async (req, { logger, state, traceId }) => {
  try {
    // Get userId from auth middleware
    const userId = req.userId;
    if (!userId) {
      logger.warn('GetHistory: No userId in request');
      return {
        status: 401,
        body: { error: 'Unauthorized - User not authenticated' }
      };
    }

    const limit = parseInt(req.queryParams.limit as string) || 10;
    
    logger.info('Fetching teleport history for user', { traceId, userId, limit });
    
    // Get user-specific history items
    const userHistoryGroup = `teleport-history-${userId}`;
    const history = await state.getGroup<HistoryItem>(userHistoryGroup);
    
    // Sort by timestamp (most recent first) and limit
    const sortedHistory = history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    logger.info('History fetched successfully', { 
      traceId, 
      userId, 
      count: sortedHistory.length 
    });
    
    return {
      status: 200,
      body: { history: sortedHistory }
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
