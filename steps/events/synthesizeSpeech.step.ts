import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import { synthesizeSpeech } from '../../services/gemini/ttsService';

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
  audioData: string;
}

type SynthesizeSpeechInput = z.infer<typeof inputSchema>;

export const handler: Handlers['SynthesizeSpeech'] = async (input, { logger, state, traceId }) => {
  const { teleportId, text } = input as SynthesizeSpeechInput;
  
  try {
    logger.info('Synthesizing speech', { traceId, teleportId });
    
    // Generate audio from text
    const audioData = await synthesizeSpeech(text);
    
    logger.info('Speech synthesized successfully', { traceId, teleportId });
    
    // Store in state for later retrieval via GetAudio API
    const audioState: AudioData = { audioData };
    await state.set('teleport-audio', teleportId, audioState);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Speech synthesis failed';
    logger.error('Speech synthesis failed', { traceId, teleportId, error: message });
    // Non-critical error, don't fail the teleport
  }
};

