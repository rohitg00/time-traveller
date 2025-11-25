import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

const historyItemSchema = z.object({
  id: z.string(),
  destination: z.string(),
  era: z.string(),
  style: z.string(),
  imageData: z.string(),
  description: z.string(),
  mapsUri: z.string().optional(),
  referenceImage: z.string().optional(),
  timestamp: z.number()
});

export const config: ApiRouteConfig = {
  name: 'GetHistory',
  type: 'api',
  path: '/history',
  method: 'GET',
  description: 'Gets the teleportation history',
  emits: [],
  flows: ['time-traveller-flow'],
  queryParams: [
    { name: 'limit', description: 'Maximum number of items to return' }
  ],
  responseSchema: {
    200: z.object({
      history: z.array(historyItemSchema)
    })
  }
};

interface HistoryItem {
  id: string;
  destination: string;
  era: string;
  style: string;
  imageData: string;
  description: string;
  mapsUri?: string;
  referenceImage?: string;
  timestamp: number;
}

export const handler: Handlers['GetHistory'] = async (req, { logger, state, traceId }) => {
  try {
    const limit = parseInt(req.queryParams.limit as string) || 10;
    
    logger.info('Fetching teleport history', { traceId, limit });
    
    // Get all history items
    const history = await state.getGroup<HistoryItem>('teleport-history');
    
    // Sort by timestamp (most recent first) and limit
    const sortedHistory = history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
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

