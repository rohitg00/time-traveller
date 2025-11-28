import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

const bodySchema = z.object({
  destination: z.string().min(1, "Destination cannot be empty"),
  era: z.string().min(1, "Era is required"),
  style: z.string().default("Photorealistic"),
  // NOTE: referenceImage removed due to Motia Cloud state size limits
  // User photos are kept client-side only for display
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

export const config: ApiRouteConfig = {
  name: 'InitiateTeleport',
  type: 'api',
  path: '/teleport',
  method: 'POST',
  description: 'Initiates a teleportation sequence to a destination',
  emits: ['generate-image', 'generate-location-details'],
  flows: ['time-traveller-flow'],
  // @ts-expect-error Zod schema type strictness - works at runtime
  bodySchema,
  responseSchema: {
    // @ts-expect-error Zod schema type strictness - works at runtime
    201: z.object({
      teleportId: z.string(),
      status: z.string(),
      message: z.string()
    }),
    // @ts-expect-error Zod schema type strictness - works at runtime
    400: z.object({ error: z.string() })
  }
};

interface TeleportData {
  destination: string;
  era: string;
  style: string;
  // NOTE: referenceImage removed due to Motia Cloud state size limits
  coordinates?: { lat: number; lng: number };
  timestamp: number;
  mapsApiKey: string;
}

export const handler: Handlers['InitiateTeleport'] = async (req, { emit, logger, streams, state, traceId }) => {
  try {
    const { destination, era, style, coordinates } = bodySchema.parse(req.body);
    
    const teleportId = `teleport-${Date.now()}`;
    
    logger.info('Initiating teleport sequence', { 
      traceId,
      teleportId, 
      destination, 
      era, 
      style 
    });
    
    // Create initial progress stream entry
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'initiating',
      progress: 10,
      timestamp: Date.now()
    });

    // Store teleport request in state for event handlers to access
    // NOTE: referenceImage is NOT stored in state due to Motia Cloud size limits
    // The reference image is only used client-side for display
    const teleportData: TeleportData = {
      destination,
      era,
      style,
      // referenceImage excluded - too large for Motia state storage
      coordinates,
      timestamp: Date.now(),
      mapsApiKey: process.env.GOOGLE_API_KEY || ''
    };
    
    await state.set('teleports', teleportId, teleportData);

    // Emit events for parallel processing
    await emit({
      topic: 'generate-image',
      data: {
        teleportId,
        destination,
        era,
        style,
        // referenceImage removed to avoid E2BIG error, fetched from state
        coordinates
      }
    });

    await emit({
      topic: 'generate-location-details',
      data: {
        teleportId,
        destination,
        era
      }
    });
    
    logger.info('Teleport sequence initiated successfully', { traceId, teleportId });

    return {
      status: 201,
      body: { 
        teleportId,
        status: 'initiated',
        message: 'Teleport sequence initiated. Monitor progress via stream.'
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initiate teleport';
    logger.error('Teleport initiation failed', { traceId, error: message });
    return {
      status: 400,
      body: { error: message }
    };
  }
};

