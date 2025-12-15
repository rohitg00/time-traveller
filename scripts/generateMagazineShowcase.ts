/**
 * Time Traveller Magazine Cover Showcase Image Generator
 * Generates 9:16 Magazine Cover style images for Male and Female models
 * Usage: GEMINI_API_KEY=your_key npx tsx scripts/generateMagazineShowcase.ts
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  console.log('Usage: GEMINI_API_KEY=your_key npx tsx scripts/generateMagazineShowcase.ts');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, '../frontend/assets/showcase');
const ASSETS_DIR = path.join(__dirname, '../frontend/assets');

// Reference Images
const FEMALE_REF_PATH = path.join(ASSETS_DIR, '3x3-grid.png');
// Using one of the male references from Supabase (Shibuya 1)
const MALE_REF_URL = 'https://lbqobnxmewwmeqdodger.supabase.co/storage/v1/object/public/time-traveller-images/teleport-907e526a-0cf1-4d06-bb8d-fa1894f98094-1764593060893/reference-1764593060893.jpg';

const showcaseImages = [
  {
    filename: 'female-magazine-cover.png',
    type: 'female',
    destination: 'Santorini, Greece',
    coords: '36.4618° N, 25.3753° E',
    prompt: `Create a stunning, high-end travel magazine cover in 9:16 vertical format.
    
    Subject: The woman from the reference image.
    Location: Santorini, Greece (White buildings, blue domes, Aegean sea background).
    
    COMPOSITION & LAYOUT:
    - Format: Classic glossy magazine cover layout.
    - Title: Include a large, elegant magazine title at the top (e.g., "GREECE", "ISLAND LIFE").
    - Action: She is sightseeing, looking elegant and relaxed, enjoying the view.
    - Text Overlay: Add stylish editorial headlines like "Summer Escape" or "The Santorini Guide".
    
    AESTHETIC:
    - Lighting: Golden hour, warm and inviting.
    - Style: Luxury travel photography, "Condé Nast Traveler" quality.
    
    CRITICAL: 
    - Use the EXACT face/appearance of the woman in the reference.
    - NEGATIVE: Do NOT include raw GPS coordinate numbers (e.g., "36.46° N").
    - No ugly UI elements.`
  },
  {
    filename: 'male-magazine-cover.png',
    type: 'male',
    destination: 'Kyoto, Japan',
    coords: '34.9949° N, 135.7850° E',
    prompt: `Create a stunning, high-end travel magazine cover in 9:16 vertical format.
    
    Subject: The man from the reference image.
    Location: Kiyomizu-dera Temple, Kyoto (Wooden terrace, autumn leaves, city view).
    
    COMPOSITION & LAYOUT:
    - Format: Classic glossy magazine cover layout.
    - Title: Include a large, elegant magazine title at the top (e.g., "KYOTO", "JAPAN TRAVEL").
    - Action: He is sightseeing, looking contemplative and stylish.
    - Text Overlay: Add stylish editorial headlines like "Autumn in Kyoto" or "Temple Guide".
    
    AESTHETIC:
    - Lighting: Soft, diffused daylight, vibrant autumn colors.
    - Style: Luxury travel photography, "National Geographic" quality.
    
    CRITICAL: 
    - Use the EXACT face/appearance of the man in the reference.
    - NEGATIVE: Do NOT include raw GPS coordinate numbers.
    - No ugly UI elements.`
  }
];

async function loadLocalImage(imagePath: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    if (!fs.existsSync(imagePath)) {
      console.log(`   ⚠️ Reference image not found: ${imagePath}`);
      return null;
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    return { data: base64, mimeType };
  } catch (error) {
    console.log(`   ⚠️ Failed to load local reference: ${error}`);
    return null;
  }
}

async function fetchRemoteImage(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return { data: base64, mimeType: contentType };
  } catch (error) {
    console.log(`   ⚠️ Failed to fetch remote reference: ${error}`);
    return null;
  }
}

async function generateImage(config: typeof showcaseImages[0]): Promise<boolean> {
  console.log(`\n📸 Generating: ${config.filename} (${config.destination})`);
  
  // Load appropriate reference image
  let refImage;
  if (config.type === 'female') {
    refImage = await loadLocalImage(FEMALE_REF_PATH);
  } else {
    refImage = await fetchRemoteImage(MALE_REF_URL);
  }
  
  if (!refImage) {
    console.error(`   ❌ Failed to load reference image for ${config.type}`);
    return false;
  }

  const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];
  
  // Add reference image
  parts.push({
    inlineData: {
      mimeType: refImage.mimeType,
      data: refImage.data
    }
  });
  
  // Add prompt
  parts.push({ text: config.prompt });

  try {
    console.log(`   🔄 Using gemini-3-pro-image-preview (Nano Banana Pro)...`);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        responseModalities: ['Text', 'Image'],
        imageConfig: {
          aspectRatio: '9:16', // Critical for this feature
          imageSize: '2K',
        },
      },
    });

    const candidates = (response as any).candidates;
    if (!candidates?.[0]?.content?.parts) {
      console.log(`   ❌ No response parts`);
      return false;
    }

    for (const part of candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const outputPath = path.join(OUTPUT_DIR, config.filename);
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`   ✅ Saved: ${config.filename}`);
        return true;
      }
    }
    
    console.log(`   ❌ No image in response`);
    return false;

  } catch (error: any) {
    console.log(`   ❌ Generation failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Magazine Cover Showcase Generator');
  console.log('====================================');
  
  let successCount = 0;
  
  for (const config of showcaseImages) {
    const success = await generateImage(config);
    if (success) successCount++;
    
    if (config !== showcaseImages[showcaseImages.length - 1]) {
        console.log('   ⏳ Waiting 3s...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n====================================');
  console.log(`✅ Completed: ${successCount}/${showcaseImages.length}`);
}

main().catch(console.error);
