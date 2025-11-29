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
  audioData?: string;
  audioUrl?: string;
}

type SynthesizeSpeechInput = z.infer<typeof inputSchema>;

export const handler: Handlers['SynthesizeSpeech'] = async (input, { logger, state, traceId }) => {
  const { teleportId, text } = input as SynthesizeSpeechInput;
  
  try {
    logger.info('Synthesizing speech', { traceId, teleportId });
    
    const audioData = await synthesizeSpeech(text);
    
    logger.info('Speech synthesized successfully', { traceId, teleportId });
    
    if (isSupabaseConfigured()) {
      try {
        logger.info('Uploading audio to Supabase', { teleportId });
        const audioUrl = await uploadAudio(teleportId, audioData);
        logger.info('Audio uploaded successfully', { teleportId, audioUrl });
      } catch (uploadError) {
        logger.warn('Failed to upload audio to Supabase', { 
          teleportId, 
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        });
        try {
          await state.set('teleport-audio', teleportId, { audioData } as AudioData);
        } catch {
          logger.warn('Failed to store audio in state as well', { teleportId });
        }
      }
    } else {
      const audioState: AudioData = { audioData };
      await state.set('teleport-audio', teleportId, audioState);
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Speech synthesis failed';
    logger.error('Speech synthesis failed', { traceId, teleportId, error: message });
  }
};

