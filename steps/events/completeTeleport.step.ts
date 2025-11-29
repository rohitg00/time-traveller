import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import { saveHistory, isSupabaseConfigured } from '../../services/supabase/historyService';

const inputSchema = z.object({
  teleportId: z.string()
});

export const config: EventConfig = {
  name: 'CompleteTeleport',
  type: 'event',
  description: 'Completes the teleportation sequence when both image and details are ready',
  subscribes: ['image-generated', 'location-details-generated'],
  emits: [],
  input: inputSchema,
  flows: ['time-traveller-flow']
};

interface ImageState {
  imageUrl: string; // URL from Supabase instead of base64
  usedStreetView: boolean;
  fallbackMessage?: string;
}

interface LocationDetails {
  description: string;
  mapsUri?: string;
}

interface TeleportData {
  destination: string;
  era: string;
  style: string;
  referenceImageUrl?: string; // URL from Supabase
  userId: string; // User who initiated the teleport
}

type CompleteTeleportInput = z.infer<typeof inputSchema>;

export const handler: Handlers['CompleteTeleport'] = async (input, { logger, streams, state, traceId }) => {
  const { teleportId } = input as CompleteTeleportInput;
  
  try {
    logger.info('Checking teleport completion status', { traceId, teleportId });
    
    // Get all required data from state
    const imageState = await state.get<ImageState>('teleport-images', teleportId);
    const detailsState = await state.get<LocationDetails>('teleport-details', teleportId);
    const teleportData = await state.get<TeleportData>('teleports', teleportId);
    
    // Only complete if both image and details are ready
    if (!imageState || !detailsState || !teleportData) {
      logger.info('Waiting for remaining data', { 
        traceId,
        teleportId,
        hasImage: !!imageState,
        hasDetails: !!detailsState,
        hasData: !!teleportData
      });
      return;
    }

    logger.info('All data ready, completing teleport', { 
      traceId,
      teleportId,
      usedStreetView: imageState.usedStreetView 
    });

    // Build final description - prepend note if street view wasn't available
    let finalDescription = detailsState.description;
    if (imageState.fallbackMessage) {
      finalDescription = `[Note: ${imageState.fallbackMessage}]\n\n${detailsState.description}`;
    }

    // Update final stream state to completed (URLs only - no large data)
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination: teleportData.destination,
      era: teleportData.era,
      style: teleportData.style,
      status: 'completed',
      progress: 100,
      imageUrl: imageState.imageUrl, // URL instead of base64
      description: finalDescription,
      mapsUri: detailsState.mapsUri,
      referenceImageUrl: teleportData.referenceImageUrl, // URL instead of base64
      usedStreetView: imageState.usedStreetView,
      timestamp: Date.now()
    });

    // Store in Supabase for persistent history (more reliable than Motia state)
    const userId = teleportData.userId;
    if (userId && isSupabaseConfigured()) {
      try {
        await saveHistory({
          id: teleportId,
          user_id: userId,
          destination: teleportData.destination,
          era: teleportData.era,
          style: teleportData.style,
          image_url: imageState.imageUrl,
          description: finalDescription,
          maps_uri: detailsState.mapsUri,
          reference_image_url: teleportData.referenceImageUrl,
          used_street_view: imageState.usedStreetView,
        });
        logger.info('History stored in Supabase for user', { teleportId, userId });
      } catch (historyError) {
        logger.warn('Failed to store history in Supabase', { 
          teleportId, 
          userId,
          error: historyError instanceof Error ? historyError.message : 'Unknown error'
        });
      }
    } else {
      logger.warn('No userId or Supabase not configured, history not stored', { teleportId });
    }
    
    logger.info('Teleport completed successfully', { traceId, teleportId });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Teleport completion failed';
    logger.error('Teleport completion failed', { traceId, teleportId, error: message });
    
    // Update stream with error status
    const teleportData = await state.get<TeleportData>('teleports', teleportId);
    if (teleportData) {
      await streams.teleportProgress.set('active', teleportId, {
        id: teleportId,
        destination: teleportData.destination,
        era: teleportData.era,
        style: teleportData.style,
        status: 'error',
        progress: 0,
        error: message,
        timestamp: Date.now()
      });
    }
  }
};
