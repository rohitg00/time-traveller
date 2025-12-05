import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

export const config: ApiRouteConfig = {
  name: 'GetTeleportProgress',
  type: 'api',
  path: '/teleport/:teleportId',
  method: 'GET',
  description: 'Gets the current progress of a teleportation',
  emits: [],
  flows: ['time-traveller-flow'],
  responseSchema: {
    200: z.object({
      id: z.string(),
      destination: z.string(),
      era: z.string(),
      style: z.string(),
      status: z.string(),
      progress: z.number(),
      imageData: z.string().optional(),
      description: z.string().optional(),
      mapsUri: z.string().optional(),
      error: z.string().optional(),
      timestamp: z.number()
    }),
    404: z.object({ error: z.string() })
  }
};

export const handler: Handlers['GetTeleportProgress'] = async (req, { logger, streams, traceId }) => {
  const teleportId = req.pathParams.teleportId;
  
  try {
    logger.info('Fetching teleport progress', { traceId, teleportId });
    
    const progress = await streams.teleportProgress.get('active', teleportId);
    
    if (!progress) {
      logger.warn('Teleport progress not found in stream', { traceId, teleportId });
      return {
        status: 404,
        body: { error: 'Teleport not found' }
      };
    }
    
    logger.info('Teleport progress found', { 
      traceId, 
      teleportId, 
      status: progress.status,
      progressValue: progress.progress
    });
    
    return {
      status: 200,
      body: progress  // Stream data is directly on the object
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch progress';
    logger.error('Failed to fetch teleport progress', { traceId, teleportId, error: message });
    return {
      status: 404,
      body: { error: message }
    };
  }
};

