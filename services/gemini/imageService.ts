import { GoogleGenAI } from "@google/genai";

// Helper to get a fresh instance with the latest key
export const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to fetch Google Street View Static Image
export async function getStreetViewImage(lat: number, lng: number, mapsApiKey: string): Promise<{data: string, mimeType: string} | null> {
  const url = `https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${lat},${lng}&fov=90&heading=0&pitch=0&key=${mapsApiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch street view");
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    // Use Node.js Buffer instead of browser FileReader
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return { data: base64, mimeType: contentType };
  } catch (error) {
    console.warn("Could not retrieve street view data:", error);
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

export async function generateImage(
  destination: string, 
  era: string, 
  style: string, 
  mapsApiKey: string,
  referenceImage?: string,
  coordinates?: { lat: number, lng: number }
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
  
  // 1. Try to fetch Street View context if coordinates exist
  const hasCoordinates = coordinates || destination.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
  
  if (coordinates) {
    streetViewData = await getStreetViewImage(coordinates.lat, coordinates.lng, mapsApiKey);
  } else {
    // Try to parse coordinates from destination string if it looks like lat/lng
    const coordMatch = destination.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      streetViewData = await getStreetViewImage(parseFloat(coordMatch[1]), parseFloat(coordMatch[3]), mapsApiKey);
    }
  }

  // Track if street view was used and provide fallback message if not
  if (streetViewData) {
    usedStreetView = true;
  } else if (hasCoordinates) {
    // User provided coordinates but no street view available
    fallbackMessage = "Street View unavailable for exact coordinates. Generating AI visualization based on location description and nearby landmarks.";
    console.log(fallbackMessage);
  }

  // 2. Build the Multi-modal prompt
  let promptText = "";

  // CASE A: We have a Street View Image (Context)
  if (streetViewData) {
    parts.push({
      inlineData: {
        mimeType: streetViewData.mimeType,
        data: streetViewData.data
      }
    });
    promptText += `The first image provided is the REFERENCE LOCATION (real-world street view). `;
  }

  // CASE B: We have a User Image (Subject)
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

  // Construct instruction
  promptText += `\n\nGenerate a photorealistic, ${style} image of `;
  
  if (streetViewData && referenceImage) {
    promptText += `the TRAVELER visiting the REFERENCE LOCATION. 
    IMPORTANT INSTRUCTIONS FOR MODEL (Gemini 3 Pro):
    1. Base Scene: Use the geometry, buildings, and perspective from the REFERENCE LOCATION image perfectly.
    2. Character Insertion: Place the TRAVELER into this scene naturally. Scale them correctly to the street. Match lighting, shadows, and color grading of the location.
    3. Era Transformation: Modify the environment details to match the ${era} era (e.g. vintage cars for past, holograms for future), but keep the street layout recognizable.
    4. Output: A high-fidelity, 2K resolution cohesive photograph.`;
  } else if (streetViewData) {
    promptText += `this location transformed into the ${era} era. 
    Keep the street layout and buildings recognizable from the image, but change details to match the time period. High fidelity output.`;
  } else if (referenceImage) {
    promptText += `the person in the image visiting ${destination} during the ${era} era. 
    Place them in a highly detailed environment matching the destination description.`;
  } else {
    promptText += `${destination} during the ${era} era. Focus on environment, atmosphere, and high resolution details.`;
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

  // Attempt 1: High Quality (Gemini 3 Pro - Nano Banana Pro)
  try {
    console.log(`Engaging Gemini 3 Pro (Nano Banana Pro) with ${parts.length} inputs...`);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K"
        },
        tools: !streetViewData ? [{ googleSearch: {} }] : undefined,
      },
    });

    const data = extractImage(response);
    if (data) {
      console.log("Gemini 3 Pro generation successful.");
      return { imageData: data, usedStreetView, fallbackMessage };
    }
  } catch (error) {
    console.warn("Gemini 3 Pro (Primary) failed.", error);
  }

  // Attempt 2: Fallback (Gemini 2.5 Flash Image)
  try {
    console.log("Engaging Fallback: Gemini 2.5 Flash Image...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      },
    });

    const data = extractImage(response);
    if (data) {
      return { imageData: data, usedStreetView, fallbackMessage };
    }
  } catch (error) {
    console.error("Fallback image generation failed:", error);
  }

  throw new Error("Visual sensors failed to render destination. Both Primary and Auxiliary cores failed.");
}

