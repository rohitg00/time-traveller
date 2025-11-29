import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import { generateImage } from '../../services/gemini/imageService';
import { uploadGeneratedImage, isSupabaseConfigured } from '../../services/supabase/storageService';

const inputSchema = z.object({
  teleportId: z.string(),
  destination: z.string(),
  era: z.string(),
  style: z.string(),
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
  referenceImageUrl?: string; // URL from Supabase
}

interface ImageData {
  imageUrl: string; // URL instead of base64
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
    
    // Reference image URL from Supabase (if uploaded)
    const referenceImageUrl = teleportData?.referenceImageUrl;
    
    // Fetch reference image from Supabase URL and convert to base64
    let referenceImageBase64: string | undefined;
    if (referenceImageUrl) {
      try {
        logger.info('Fetching reference image from Supabase', { teleportId, referenceImageUrl });
        const response = await fetch(referenceImageUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          referenceImageBase64 = `data:${contentType};base64,${base64}`;
          logger.info('Reference image fetched successfully', { teleportId });
        }
      } catch (fetchError) {
        logger.warn('Failed to fetch reference image, continuing without it', { 
          teleportId, 
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        });
      }
    }

    // Generate the image (returns base64)
    const result = await generateImage(
      destination, 
      era, 
      style, 
      mapsApiKey,
      referenceImageBase64, // Pass the fetched reference image
      coordinates
    );
    
    logger.info('Image generated successfully', { 
      traceId,
      teleportId, 
      usedStreetView: result.usedStreetView,
      hasFallbackMessage: !!result.fallbackMessage 
    });
    
    // Upload generated image to Supabase
    let imageUrl: string;
    if (isSupabaseConfigured()) {
      try {
        logger.info('Uploading generated image to Supabase', { teleportId });
        imageUrl = await uploadGeneratedImage(teleportId, result.imageData);
        logger.info('Generated image uploaded successfully', { teleportId, imageUrl });
      } catch (uploadError) {
        logger.error('Failed to upload generated image', { 
          teleportId, 
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        });
        throw new Error('Failed to store generated image');
      }
    } else {
      // Fallback: store base64 directly (will fail on Motia Cloud due to size limits)
      logger.warn('Supabase not configured, using base64 fallback (may fail on cloud)', { teleportId });
      imageUrl = result.imageData;
    }
    
    // Update stream with image URL (small data)
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'generating-details',
      progress: 60,
      imageUrl, // URL instead of base64
      timestamp: Date.now()
    });

    // Store in state with metadata (URL only)
    const storedImage: ImageData = { 
      imageUrl,
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
