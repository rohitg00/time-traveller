import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { uploadReferenceImage, isSupabaseConfigured } from '../../services/supabase/storageService';
import { authRequired } from '../middlewares/auth.middleware';

const bodySchema = z.object({
  destination: z.string().min(1, "Destination cannot be empty"),
  era: z.string().min(1, "Era is required"),
  style: z.string().default("Photorealistic"),
  referenceImage: z.string().optional(), // Re-enabled with Supabase storage
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
  description: 'Initiates a teleportation sequence to a destination (requires auth)',
  emits: ['generate-image', 'generate-location-details'],
  flows: ['time-traveller-flow'],
  middleware: [authRequired], // Auth required for data isolation
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
    400: z.object({ error: z.string() }),
    // @ts-expect-error Zod schema type strictness - works at runtime
    401: z.object({ error: z.string() })
  }
};

interface TeleportData {
  destination: string;
  era: string;
  style: string;
  referenceImageUrl?: string; // URL instead of base64
  coordinates?: { lat: number; lng: number };
  timestamp: number;
  mapsApiKey: string;
  userId: string; // User who initiated the teleport
}

export const handler: Handlers['InitiateTeleport'] = async (req, { emit, logger, streams, state, traceId }) => {
  try {
    // Get userId from auth middleware
    const userId = req.userId;
    if (!userId) {
      logger.warn('InitiateTeleport: No userId in request');
      return {
        status: 401,
        body: { error: 'Unauthorized - User not authenticated' }
      };
    }

    const { destination, era, style, referenceImage, coordinates } = bodySchema.parse(req.body);
    
    // Include userId in teleportId for easier filtering
    const teleportId = `teleport-${userId}-${Date.now()}`;
    
    logger.info('Initiating teleport sequence', { 
      traceId,
      teleportId, 
      destination, 
      era, 
      style,
      hasReferenceImage: !!referenceImage
    });
    
    // Upload reference image to Supabase if provided
    let referenceImageUrl: string | undefined;
    if (referenceImage && isSupabaseConfigured()) {
      try {
        logger.info('Uploading reference image to Supabase', { teleportId });
        referenceImageUrl = await uploadReferenceImage(teleportId, referenceImage);
        logger.info('Reference image uploaded successfully', { teleportId, referenceImageUrl });
      } catch (uploadError) {
        logger.warn('Failed to upload reference image, continuing without it', { 
          teleportId, 
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        });
      }
    }
    
    // Create initial progress stream entry (small data only - no images)
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'initiating',
      progress: 10,
      timestamp: Date.now()
    });

    // Store teleport request in state (URLs only, no base64)
    const teleportData: TeleportData = {
      destination,
      era,
      style,
      referenceImageUrl, // URL instead of base64
      coordinates,
      timestamp: Date.now(),
      mapsApiKey: process.env.GOOGLE_API_KEY || '',
      userId // Store userId for data isolation
    };
    
    await state.set('teleports', teleportId, teleportData);

    // Also store in user-specific group for easy retrieval
    await state.set(`user-teleports-${userId}`, teleportId, { teleportId, timestamp: Date.now() });

    // Emit events for parallel processing (no large data in emit)
    await emit({
      topic: 'generate-image',
      data: {
        teleportId,
        destination,
        era,
        style,
        coordinates
        // referenceImageUrl is fetched from state
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
