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
  imageUrl: string;
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
  referenceImageUrl?: string;
  userId: string;
}

type CompleteTeleportInput = z.infer<typeof inputSchema>;

export const handler: Handlers['CompleteTeleport'] = async (input, { logger, streams, state, traceId }) => {
  const { teleportId } = input as CompleteTeleportInput;
  
  try {
    logger.info('Checking teleport completion status', { traceId, teleportId });
    
    const imageState = await state.get<ImageState>('teleport-images', teleportId);
    const detailsState = await state.get<LocationDetails>('teleport-details', teleportId);
    const teleportData = await state.get<TeleportData>('teleports', teleportId);
    
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

    let finalDescription = detailsState.description;
    if (imageState.fallbackMessage) {
      finalDescription = `[Note: ${imageState.fallbackMessage}]\n\n${detailsState.description}`;
    }

    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination: teleportData.destination,
      era: teleportData.era,
      style: teleportData.style,
      status: 'completed',
      progress: 100,
      imageUrl: imageState.imageUrl,
      description: finalDescription,
      mapsUri: detailsState.mapsUri,
      referenceImageUrl: teleportData.referenceImageUrl,
      usedStreetView: imageState.usedStreetView,
      timestamp: Date.now()
    });

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
