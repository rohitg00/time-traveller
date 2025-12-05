import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import { generateImage } from '../../services/gemini/imageService';
import { uploadGeneratedImage, isSupabaseConfigured } from '../../services/supabase/storageService';

const imageConfigSchema = z.object({
  aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).default('16:9'),
  imageSize: z.enum(['1K', '2K', '4K']).default('2K')
});

// Multi-image support for Gemini 3 Pro (up to 14 images)
const referenceImageSchema = z.object({
  id: z.string(),
  data: z.string(),
  type: z.enum(['person', 'celebrity', 'object']),
  label: z.string().optional()
});

const inputSchema = z.object({
  teleportId: z.string(),
  destination: z.string(),
  era: z.string(),
  style: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  referenceImages: z.array(referenceImageSchema).optional(),
  imageConfig: imageConfigSchema.optional(),
  userGeminiKey: z.string().optional(),
  userMapsKey: z.string().optional()
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

interface ImageConfig {
  aspectRatio: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  imageSize: '1K' | '2K' | '4K';
}

interface ReferenceImageData {
  id: string;
  data: string;
  type: 'person' | 'celebrity' | 'object';
  label?: string;
}

interface TeleportData {
  destination: string;
  era: string;
  style: string;
  mapsApiKey: string;
  geminiApiKey?: string;
  referenceImageUrl?: string;
  referenceImages?: ReferenceImageData[];
  imageConfig?: ImageConfig;
}

interface ImageData {
  imageUrl: string;
  usedStreetView: boolean;
  fallbackMessage?: string;
}

type GenerateImageInput = z.infer<typeof inputSchema>;

export const handler: Handlers['GenerateImage'] = async (input, { emit, logger, streams, state, traceId }) => {
  const { teleportId, destination, era, style, coordinates, referenceImages, imageConfig, userGeminiKey, userMapsKey } = input as GenerateImageInput;
  
  try {
    logger.info('Starting image generation', { 
      traceId, 
      teleportId, 
      destination, 
      hasUserKeys: !!userGeminiKey,
      multiImageCount: referenceImages?.length || 0,
      referenceImageTypes: referenceImages?.map(img => img.type) || [],
      hasReferenceImageData: referenceImages?.map(img => !!img.data && img.data.length > 100) || []
    });
    
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'generating-image',
      progress: 30,
      timestamp: Date.now()
    });

    const teleportData = await state.get<TeleportData>('teleports', teleportId);
    const mapsApiKey = userMapsKey || teleportData?.mapsApiKey || process.env.GOOGLE_API_KEY || '';
    const geminiApiKey = userGeminiKey || teleportData?.geminiApiKey || process.env.GEMINI_API_KEY || '';

    const referenceImageUrl = teleportData?.referenceImageUrl;
    
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

    // Use imageConfig from input or fallback to teleportData or defaults
    const effectiveImageConfig = imageConfig || teleportData?.imageConfig || { aspectRatio: '16:9' as const, imageSize: '2K' as const };
    
    // Prepare multiple reference images if available
    const multipleImages = referenceImages || teleportData?.referenceImages;
    
    logger.info('Preparing to generate image', {
      traceId,
      teleportId,
      hasMultipleImages: !!multipleImages && multipleImages.length > 0,
      multipleImagesCount: multipleImages?.length || 0,
      hasReferenceImageBase64: !!referenceImageBase64
    });
    
    // Update progress: Starting AI generation
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'rendering-image',
      progress: 40,
      timestamp: Date.now()
    });
    
    const result = await generateImage(
      destination, 
      era, 
      style, 
      mapsApiKey,
      referenceImageBase64,
      coordinates,
      effectiveImageConfig,
      geminiApiKey,
      multipleImages
    );
    
    logger.info('Image generated successfully', { 
      traceId,
      teleportId, 
      usedStreetView: result.usedStreetView,
      hasFallbackMessage: !!result.fallbackMessage 
    });
    
    // Update progress: Image rendered, now uploading
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'uploading-image',
      progress: 50,
      timestamp: Date.now()
    });
    
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
      logger.warn('Supabase not configured, using base64 fallback (may fail on cloud)', { teleportId });
      imageUrl = result.imageData;
    }
    
    await streams.teleportProgress.set('active', teleportId, {
      id: teleportId,
      destination,
      era,
      style,
      status: 'generating-details',
      progress: 60,
      imageUrl,
      timestamp: Date.now()
    });

    const storedImage: ImageData = { 
      imageUrl,
      usedStreetView: result.usedStreetView,
      fallbackMessage: result.fallbackMessage
    };
    await state.set('teleport-images', teleportId, storedImage);

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
