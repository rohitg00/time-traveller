import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { getAudioUrl, isSupabaseConfigured } from '../../services/supabase/storageService';

export const config: ApiRouteConfig = {
  name: 'GetAudio',
  type: 'api',
  path: '/teleport/:teleportId/audio',
  method: 'GET',
  description: 'Gets the synthesized audio for a teleportation',
  emits: [],
  flows: ['time-traveller-flow'],
  responseSchema: {
    // @ts-expect-error - Zod schemas compatible at runtime
    200: z.object({
      audioData: z.string().optional(),
      audioUrl: z.string().optional()
    }),
    // @ts-expect-error - Zod schemas compatible at runtime
    404: z.object({ error: z.string() })
  }
};

interface AudioState {
  audioData?: string;
  audioUrl?: string;
}

export const handler: Handlers['GetAudio'] = async (req, { logger, state, traceId }) => {
  const teleportId = req.pathParams.teleportId;
  
  try {
    logger.info('Fetching teleport audio', { traceId, teleportId });
    
    if (isSupabaseConfigured()) {
      const audioUrl = await getAudioUrl(teleportId);
      if (audioUrl) {
        logger.info('Audio URL found in Supabase', { traceId, teleportId });
        return {
          status: 200,
          body: { audioUrl }
        };
      }
    }
    
    const audioState = await state.get<AudioState>('teleport-audio', teleportId);
    
    if (!audioState || (!audioState.audioData && !audioState.audioUrl)) {
      logger.warn('Audio not found', { traceId, teleportId });
      return {
        status: 404,
        body: { error: 'Audio not found or not yet generated' }
      };
    }
    
    return {
      status: 200,
      body: { 
        audioData: audioState.audioData,
        audioUrl: audioState.audioUrl
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audio';
    logger.error('Failed to fetch audio', { traceId, teleportId, error: message });
    return {
      status: 404,
      body: { error: message }
    };
  }
};

