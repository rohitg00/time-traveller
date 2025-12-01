import { GoogleGenAI } from "@google/genai";

export const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function reverseGeocode(lat: number, lng: number, mapsApiKey: string): Promise<string | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsApiKey}&result_type=point_of_interest|establishment|premise`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.length > 0) {
      return data.results[0].formatted_address || data.results[0].name;
    }
    
    const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsApiKey}`;
    const fallbackResponse = await fetch(fallbackUrl);
    const fallbackData = await fallbackResponse.json();
    
    if (fallbackData.status === 'OK' && fallbackData.results?.length > 0) {
      return fallbackData.results[0].formatted_address;
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function getStreetViewImage(lat: number, lng: number, mapsApiKey: string): Promise<{data: string, mimeType: string} | null> {
  try {
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=100&key=${mapsApiKey}`;
    const metaResponse = await fetch(metadataUrl);
    const metadata = await metaResponse.json();
    
    if (metadata.status !== 'OK') {
      return null;
    }
    
    const actualLat = metadata.location?.lat || lat;
    const actualLng = metadata.location?.lng || lng;
    
    const url = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${actualLat},${actualLng}&fov=100&radius=50&source=outdoor&key=${mapsApiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch street view");
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return { data: base64, mimeType: contentType };
  } catch {
    return null;
  }
}

function getMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

export interface ImageGenerationResult {
  imageData: string;
  usedStreetView: boolean;
  fallbackMessage?: string;
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';

export interface ImageConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

function getStylePromptEnhancement(style: string, destination: string, coordinates?: { lat: number, lng: number }): string {
  const coordStr = coordinates ? `latitude ${coordinates.lat}, longitude ${coordinates.lng}` : destination;
  
  const stylePrompts: Record<string, string> = {
    'Disposable Camera': `A single everyday photo taken with a low-quality disposable camera. A crappy photo taken by a tourist. The image should have slight blur, imperfect exposure, warm color cast, and that authentic amateur snapshot feeling.`,
    
    'Photo Book': `Create a single beautiful editorial travel photograph in the style of a luxury Japanese photo book or magazine. The image should have a soft, dreamy aesthetic with warm golden light, slight overexposure, and gentle film-like tones. Compose the shot elegantly like a professional travel editorial - the subject touring ${coordStr} in a candid, natural moment. Add subtle film grain and that nostalgic summer feeling. In the bottom corner, overlay elegant minimal typography showing the location name.`,
    
    'Aerial/Drone View': `Create an aerial photography image from a drone perspective high above ${coordStr}. The camera angle should be looking down at approximately 45-60 degrees, showing the landscape, buildings, and surroundings from a bird's eye view.`,
    
    'Cinematic 9-Shot Grid': `Analyze the overall composition of the input image, and identify all major subjects depicted (one person, a couple/group, vehicles, specific objects, etc.) along with their spatial relationships and interactions.
Generate a 3×3 grid in the format of a "cinematic contact sheet" featuring 9 different camera shots of the same subject in the same environment.
Adapt standard film shot types to suit the content (e.g., for groups, frame everyone within the shot; for objects, capture the whole thing, etc.).

Row 1 (Establishing the situation / Establishing):
1. Extreme Long Shot (ELS): A composition where the subject appears small within a vast environment.
2. Long Shot (LS): The entire subject (person/group) is captured from top to bottom (head to feet).
3. Medium Long Shot (American / 3/4): For people, frame from the knees up; for objects, use a 3/4 angle.

Row 2 (Core coverage):
4. Medium Shot (MS): Frame from the waist up. Capture movement or interactions.
5. Medium Close-Up (MCU): Frame from the chest up. Capture the subject more intimately.
6. Close-Up (CU): Tightly frame the face (or the object's "front").

Row 3 (Details and angles):
7. Extreme Close-Up (ECU): Shoot important details like eyes, hands, logos, textures, etc., with extreme closeness.
8. Low Angle Shot (Worm's Eye): An angle looking up from the ground (conveying power/heroic impression).
9. High Angle Shot (Bird's Eye): An angle looking down from above.

Maintain strict consistency: Use the same person/object, same clothing, same lighting across all 9 panels. Also realistically vary the depth of field (stronger blur in close-ups). A professional 3×3 cinematic contact sheet.`,
    
    'CCTV Surveillance': `Generate an image in the style of a high-angle CCTV surveillance camera at ${coordStr}. Include subtle white frame detection boxes around faces. Add realistic security camera noise, slight distortion, and that characteristic washed-out look. The perspective should be from a corner ceiling mount looking down.`,
    
    'Real-time Weather': `Create an image located at ${coordStr} that matches the atmosphere of the current local time and the real-time weather. In the lower left corner of the photo, use elegant typography to write the current latitude and longitude, location information, and weather icon, and add a sentence of English location introduction copy.`,
    
    'Light Leak/Retro Fail': `Create a deliberately "failed" vintage photograph with artistic imperfections. Include dramatic light leaks bleeding across the frame, motion blur from camera shake, out-of-focus areas, improper exposure, coarse film grain, and color bleeding. The image should feel like a recovered fragment from old film - technically flawed but atmospherically compelling.`,
    
    'Hyper-Realistic Candid': `Create a hyper-realistic candid lifestyle photograph at ${coordStr}. 
Technical specs: Candid smartphone photography aesthetic, natural daylight with soft shadows, sharp focus on eyes and expression, 8K resolution, raw style.
Subject treatment: If a person is provided, capture them in a natural, unposed moment - perhaps looking back over their shoulder, interacting with the environment, or in mid-action. Focus on authentic expressions and body language.
Environment: Integrate the subject naturally into the location's environment with realistic props and context.
Style: The image should feel like a genuine moment captured by a skilled street photographer - charming, raw, youthful, and candid. Natural skin texture with soft glow, no heavy makeup or artificial posing.
Negative: Avoid stiff poses, fake smiles, distorted features, blur, or low resolution.`,
  };
  
  return stylePrompts[style] || '';
}

export async function generateImage(
  destination: string, 
  era: string, 
  style: string, 
  mapsApiKey: string,
  referenceImage?: string,
  coordinates?: { lat: number, lng: number },
  imageConfig?: ImageConfig
): Promise<ImageGenerationResult> {
  const ai = getAI();
  
  interface ContentPart {
    inlineData?: {
      mimeType: string;
      data: string;
    };
    text?: string;
  }
  
  const parts: ContentPart[] = [];
  
  let streetViewData: {data: string, mimeType: string} | null = null;
  let usedStreetView = false;
  let fallbackMessage: string | undefined;
  let locationName: string | null = null;
  
  const hasCoordinates = coordinates || destination.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
  
  if (coordinates) {
    [streetViewData, locationName] = await Promise.all([
      getStreetViewImage(coordinates.lat, coordinates.lng, mapsApiKey),
      reverseGeocode(coordinates.lat, coordinates.lng, mapsApiKey)
    ]);
  } else {
    const coordMatch = destination.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      [streetViewData, locationName] = await Promise.all([
        getStreetViewImage(lat, lng, mapsApiKey),
        reverseGeocode(lat, lng, mapsApiKey)
      ]);
    }
  }

  if (streetViewData) {
    usedStreetView = true;
  } else if (hasCoordinates) {
    fallbackMessage = "Street View unavailable for exact coordinates. Generating AI visualization based on location description and nearby landmarks.";
  }
  
  const effectiveDestination = locationName || destination;

  let promptText = "";
  const styleEnhancement = getStylePromptEnhancement(style, effectiveDestination, coordinates);
  const isSpecialStyle = styleEnhancement.length > 0;
  
  if (locationName && coordinates) {
    promptText += `TARGET LOCATION: "${locationName}" at coordinates ${coordinates.lat}, ${coordinates.lng}. `;
  }

  if (streetViewData) {
    parts.push({
      inlineData: {
        mimeType: streetViewData.mimeType,
        data: streetViewData.data
      }
    });
    promptText += `The first image provided is a REFERENCE LOCATION from Street View near the coordinates. `;
    if (coordinates) {
      promptText += `The exact coordinates are ${coordinates.lat}, ${coordinates.lng}. `;
      promptText += `IMPORTANT: Use Google Search to identify what famous landmark or location exists at these coordinates, and ensure the generated image accurately represents that specific location (not just the street view angle). `;
    }
  }

  if (referenceImage) {
    const userMimeType = getMimeTypeFromDataUrl(referenceImage);
    const userBase64 = referenceImage.split(',')[1] || referenceImage;
    
    parts.push({
      inlineData: {
        mimeType: userMimeType,
        data: userBase64
      }
    });
    promptText += `The ${streetViewData ? 'second' : 'first'} image provided is the TRAVELER (user). `;
  }

  if (isSpecialStyle) {
    promptText += `\n\n${styleEnhancement}\n\n`;
    promptText += `Location: ${effectiveDestination}. Time Period: ${era}. `;
    if (referenceImage) {
      promptText += `Use the TRAVELER's appearance and blend them naturally into the scene. `;
    }
  } else {
    promptText += `\n\nGenerate a photorealistic, ${style} image of `;
    
    if (streetViewData && referenceImage) {
      promptText += `the TRAVELER visiting ${effectiveDestination}. 
      IMPORTANT INSTRUCTIONS FOR MODEL (Gemini 3 Pro):
      1. Base Scene: The REFERENCE LOCATION image shows the area, but generate the ICONIC view of ${effectiveDestination} that people would recognize.
      2. Character Insertion: Place the TRAVELER into this scene naturally. Scale them correctly to the environment. Match lighting, shadows, and color grading.
      3. Era Transformation: Modify the environment details to match the ${era} era (e.g. vintage cars for past, holograms for future), but keep the location recognizable.
      4. Output: A high-fidelity, 2K resolution cohesive photograph showing the famous/iconic view of this location.`;
    } else if (streetViewData) {
      promptText += `${effectiveDestination} transformed into the ${era} era. 
      Generate the ICONIC recognizable view of this location, not just the street view angle. High fidelity output.`;
    } else if (referenceImage) {
      promptText += `the person in the image visiting ${effectiveDestination} during the ${era} era. 
      Place them in a highly detailed environment matching the destination description. Show the iconic view.`;
    } else {
      promptText += `${effectiveDestination} during the ${era} era. Focus on the ICONIC recognizable view, environment, atmosphere, and high resolution details.`;
    }
  }

  parts.push({ text: promptText });

  const extractImage = (response: unknown): string | null => {
    const resp = response as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: {
              data?: string;
            };
          }>;
        };
      }>;
    };
    
    for (const part of resp.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
    return null;
  };

  const useGoogleSearch = Boolean(coordinates) || !streetViewData;
  
  // Use provided imageConfig or defaults
  const effectiveConfig: ImageConfig = imageConfig || { aspectRatio: '16:9', imageSize: '2K' };
  
  // Gemini 3 Pro (Nano Banana Pro) supports 1K, 2K, 4K
  // Gemini 2.5 Flash (Nano Banana) only supports 1K (1024px)
  const canUse4K = effectiveConfig.imageSize === '4K' || effectiveConfig.imageSize === '2K';

  try {
    // Try Nano Banana Pro first (supports up to 4K)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: effectiveConfig.aspectRatio,
          imageSize: effectiveConfig.imageSize
        },
        tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
      },
    });

    const data = extractImage(response);
    if (data) {
      return { imageData: data, usedStreetView, fallbackMessage };
    }
  } catch {
  }

  try {
    // Fallback to Nano Banana (only 1K supported)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: effectiveConfig.aspectRatio,
          // Nano Banana only supports 1K resolution
        },
        tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
      },
    });

    const data = extractImage(response);
    if (data) {
      return { imageData: data, usedStreetView, fallbackMessage };
    }
  } catch {
  }

  throw new Error("Visual sensors failed to render destination. Both Primary and Auxiliary cores failed.");
}

