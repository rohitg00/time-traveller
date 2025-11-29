import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import { synthesizeSpeech } from '../../services/gemini/ttsService';
import { uploadAudio, isSupabaseConfigured } from '../../services/supabase/storageService';

const inputSchema = z.object({
  teleportId: z.string(),
  text: z.string()
});

export const config: EventConfig = {
  name: 'SynthesizeSpeech',
  type: 'event',
  description: 'Synthesizes speech from text using Gemini TTS',
  subscribes: ['synthesize-speech'],
  emits: [],
  // @ts-expect-error - Zod schema compatible at runtime, TypeScript strictness issue
  input: inputSchema,
  flows: ['time-traveller-flow']
};

interface AudioData {
  audioData?: string; // base64 for local dev
  audioUrl?: string;  // URL from Supabase for production
}

type SynthesizeSpeechInput = z.infer<typeof inputSchema>;

export const handler: Handlers['SynthesizeSpeech'] = async (input, { logger, state, traceId }) => {
  const { teleportId, text } = input as SynthesizeSpeechInput;
  
  try {
    logger.info('Synthesizing speech', { traceId, teleportId });
    
    // Generate audio from text
    const audioData = await synthesizeSpeech(text);
    
    logger.info('Speech synthesized successfully', { traceId, teleportId });
    
    // Upload to Supabase if configured (production), otherwise store in state (local dev)
    let audioState: AudioData;
    
    if (isSupabaseConfigured()) {
      try {
        logger.info('Uploading audio to Supabase', { teleportId });
        const audioUrl = await uploadAudio(teleportId, audioData);
        audioState = { audioUrl };
        logger.info('Audio uploaded successfully', { teleportId, audioUrl });
      } catch (uploadError) {
        logger.warn('Failed to upload audio to Supabase, storing in state', { 
          teleportId, 
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        });
        // Fallback to state storage (may fail due to size limits)
        audioState = { audioData };
      }
    } else {
      // Local development - store in state
      audioState = { audioData };
    }
    
    await state.set('teleport-audio', teleportId, audioState);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Speech synthesis failed';
    logger.error('Speech synthesis failed', { traceId, teleportId, error: message });
    // Non-critical error, don't fail the teleport
  }
};

