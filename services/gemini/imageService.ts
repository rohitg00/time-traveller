import { GoogleGenAI } from "@google/genai";

export const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getStreetViewImage(lat: number, lng: number, mapsApiKey: string): Promise<{data: string, mimeType: string} | null> {
  const url = `https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${lat},${lng}&fov=90&heading=0&pitch=0&key=${mapsApiKey}`;
  
  try {
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
  
  const hasCoordinates = coordinates || destination.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
  
  if (coordinates) {
    streetViewData = await getStreetViewImage(coordinates.lat, coordinates.lng, mapsApiKey);
  } else {
    const coordMatch = destination.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      streetViewData = await getStreetViewImage(parseFloat(coordMatch[1]), parseFloat(coordMatch[3]), mapsApiKey);
    }
  }

  if (streetViewData) {
    usedStreetView = true;
  } else if (hasCoordinates) {
    fallbackMessage = "Street View unavailable for exact coordinates. Generating AI visualization based on location description and nearby landmarks.";
  }

  let promptText = "";

  if (streetViewData) {
    parts.push({
      inlineData: {
        mimeType: streetViewData.mimeType,
        data: streetViewData.data
      }
    });
    promptText += `The first image provided is the REFERENCE LOCATION (real-world street view). `;
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

  try {
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
      return { imageData: data, usedStreetView, fallbackMessage };
    }
  } catch {
  }

  try {
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
  } catch {
  }

  throw new Error("Visual sensors failed to render destination. Both Primary and Auxiliary cores failed.");
}

