import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import { generateLocationDetails } from '../../services/gemini/locationService';

const inputSchema = z.object({
  teleportId: z.string(),
  destination: z.string(),
  era: z.string()
});

export const config: EventConfig = {
  name: 'GenerateLocationDetails',
  type: 'event',
  description: 'Generates location description and maps information',
  subscribes: ['generate-location-details'],
  emits: ['location-details-generated', 'synthesize-speech'],
  // @ts-expect-error - Zod schema compatible at runtime, TypeScript strictness issue
  input: inputSchema,
  flows: ['time-traveller-flow']
};

interface LocationDetails {
  description: string;
  mapsUri?: string;
}

type GenerateLocationDetailsInput = z.infer<typeof inputSchema>;

export const handler: Handlers['GenerateLocationDetails'] = async (input, { emit, logger, state, traceId }) => {
  const { teleportId, destination, era } = input as GenerateLocationDetailsInput;
  
  try {
    logger.info('Generating location details', { traceId, teleportId, destination });
    
    const { description, mapsUri } = await generateLocationDetails(destination, era);
    
    logger.info('Location details generated', { traceId, teleportId });
    
    const details: LocationDetails = { description, mapsUri };
    await state.set('teleport-details', teleportId, details);

    await emit({
      topic: 'synthesize-speech',
      data: {
        teleportId,
        text: description
      }
    });

    await emit({
      topic: 'location-details-generated',
      data: { teleportId }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Location details generation failed';
    logger.error('Location details generation failed', { traceId, teleportId, error: message });
  }
};

