import { getAI } from './imageService';

export async function generateLocationDetails(destination: string, era: string): Promise<{description: string, mapsUri?: string}> {
  const ai = getAI();
  const prompt = `You are a virtual travel guide. 
  Find the real world location for ${destination} if it exists on Earth.
  Describe the experience of arriving at ${destination} in the ${era} era.
  Focus on sensory details: what does the user see, hear, and smell?
  Keep it immersive, evocative, and concise (under 100 words).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    const description = response.text || "No description available.";
    
    // Extract Maps URI from grounding metadata
    let mapsUri: string | undefined;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks && groundingChunks.length > 0) {
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          mapsUri = chunk.web.uri;
          break;
        }
        if (chunk.maps?.uri) {
          mapsUri = chunk.maps.uri;
          break;
        }
      }
    }

    return { description, mapsUri };
  } catch {
    return { description: "Data link to destination history corrupted. Visuals only." };
  }
}

