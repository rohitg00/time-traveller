import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import { generateImage } from '../../services/gemini/imageService';

const inputSchema = z.object({
  teleportId: z.string(),
  destination: z.string(),
  era: z.string(),
  style: z.string(),
  // NOTE: referenceImage removed due to Motia Cloud state size limits
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

export const config: EventConfig = {
  name: 'GenerateImage',
  type: 'event',
  description: 'Generates an AI image for the teleportation destination',
  subscribes: ['generate-image'],
  emits: ['image-generated'],
  // @ts-expect-error - Zod schema compatible at runtime, TypeScript strictness issue
  input: inputSchema,
  flows: ['time-traveller-flow']
};

interface TeleportData {
  destination: string;
  era: string;
  style: string;
  mapsApiKey: string;
  // NOTE: referenceImage is no longer stored in state due to Motia Cloud size limits
}

interface ImageData {
  imageData: string;
  usedStreetView: boolean;
  fallbackMessage?: string;
}

type GenerateImageInput = z.infer<typeof inputSchema>;

export const handler: Handlers['GenerateImage'] = async (input, { emit, logger, streams, state, traceId }) => {
  const { teleportId, destination, era, style, coordinates } = input as GenerateImageInput;
  
  try {
    logger.info('Starting image generation', { traceId, teleportId, destination });
    
    // Update progress
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'generating-image',
      progress: 30,
      timestamp: Date.now()
    });

    // Retrieve data from state
    const teleportData = await state.get<TeleportData>('teleports', teleportId);
    const mapsApiKey = teleportData?.mapsApiKey || process.env.GOOGLE_API_KEY || '';
    
    // NOTE: referenceImage feature is disabled for Motia Cloud due to state size limits
    // The AI will generate images based on location data only (no user photo overlay)
    // referenceImage is kept client-side only for display purposes

    // Generate the image
    const result = await generateImage(
      destination, 
      era, 
      style, 
      mapsApiKey,
      undefined, // referenceImage disabled for cloud deployment
      coordinates
    );
    
    logger.info('Image generated successfully', { 
      traceId,
      teleportId, 
      usedStreetView: result.usedStreetView,
      hasFallbackMessage: !!result.fallbackMessage 
    });
    
    // Update stream with image data and any fallback message
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'generating-details',
      progress: 60,
      imageData: result.imageData,
      timestamp: Date.now()
    });

    // Store in state with metadata
    const storedImage: ImageData = { 
      imageData: result.imageData,
      usedStreetView: result.usedStreetView,
      fallbackMessage: result.fallbackMessage
    };
    await state.set('teleport-images', teleportId, storedImage);

    // Emit events for completion check
    await emit({
      topic: 'image-generated',
      data: { teleportId }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed';
    logger.error('Image generation failed', { traceId, teleportId, error: message });
    
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'error',
      progress: 0,
      error: message,
      timestamp: Date.now()
    });
  }
};

