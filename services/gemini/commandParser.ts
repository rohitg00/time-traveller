import { Type } from "@google/genai";
import { getAI } from './imageService';

export async function parseTravelCommand(
  message: string, 
  history: string[]
): Promise<{ 
  isJump: boolean; 
  reply: string; 
  params?: { destination: string, era: string, style: string } 
}> {
  const ai = getAI();
  
  const prompt = `
    You are the navigation AI for Time Traveller.
    User Message: "${message}"
    
    If the user wants to travel/teleport/go somewhere, extract the destination, era, and style.
    If the era is not specified, infer a likely one or use 'Present Day'.
    If the style is not specified, default to 'Photorealistic'.
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isJump: { type: Type.BOOLEAN, description: "True if user wants to travel/teleport." },
            reply: { type: Type.STRING, description: "A short, robotic, sci-fi confirmation message or a conversational reply if not jumping." },
            destination: { type: Type.STRING },
            era: { type: Type.STRING },
            style: { type: Type.STRING, description: "One of: Photorealistic, Cyberpunk/Sci-Fi, Vintage Film, Oil Painting, Surrealist Dream" },
          },
          required: ["isJump", "reply"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      isJump: result.isJump,
      reply: result.reply,
      params: result.isJump ? {
        destination: result.destination || "Unknown",
        era: result.era || "Present Day",
        style: result.style || "Photorealistic"
      } : undefined
    };

  } catch {
    return { isJump: false, reply: "Command signal interrupted. Please retry." };
  }
}

