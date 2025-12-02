/**
 * Time Traveller Male Showcase Image Generator
 * Uses Rohit Ghumare's reference images from Supabase to generate male showcase images
 * Usage: GEMINI_API_KEY=your_key npx tsx scripts/generateMaleShowcase.ts
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  console.log('Usage: GEMINI_API_KEY=your_key npx tsx scripts/generateMaleShowcase.ts');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, '../frontend/assets/showcase');

// Rohit Ghumare's reference images from Supabase
const REFERENCE_IMAGES = {
  shibuya1: 'https://lbqobnxmewwmeqdodger.supabase.co/storage/v1/object/public/time-traveller-images/teleport-907e526a-0cf1-4d06-bb8d-fa1894f98094-1764593060893/reference-1764593060893.jpg',
  shibuya2: 'https://lbqobnxmewwmeqdodger.supabase.co/storage/v1/object/public/time-traveller-images/teleport-907e526a-0cf1-4d06-bb8d-fa1894f98094-1764592937389/reference-1764592937389.jpg',
  shibuya3: 'https://lbqobnxmewwmeqdodger.supabase.co/storage/v1/object/public/time-traveller-images/teleport-907e526a-0cf1-4d06-bb8d-fa1894f98094-1764592740964/reference-1764592740964.jpg',
  tokyo1: 'https://lbqobnxmewwmeqdodger.supabase.co/storage/v1/object/public/time-traveller-images/teleport-907e526a-0cf1-4d06-bb8d-fa1894f98094-1764592653451/reference-1764592653452.jpg',
  tokyo2: 'https://lbqobnxmewwmeqdodger.supabase.co/storage/v1/object/public/time-traveller-images/teleport-907e526a-0cf1-4d06-bb8d-fa1894f98094-1764592455033/reference-1764592455034.jpg',
  seattle: 'https://lbqobnxmewwmeqdodger.supabase.co/storage/v1/object/public/time-traveller-images/teleport-907e526a-0cf1-4d06-bb8d-fa1894f98094-1764412210031/reference-1764412210031.jpg',
  mumbai1: 'https://lbqobnxmewwmeqdodger.supabase.co/storage/v1/object/public/time-traveller-images/teleport-907e526a-0cf1-4d06-bb8d-fa1894f98094-1764615934487/reference-1764615934487.jpg',
  mumbai2: 'https://lbqobnxmewwmeqdodger.supabase.co/storage/v1/object/public/time-traveller-images/teleport-907e526a-0cf1-4d06-bb8d-fa1894f98094-1764615837722/reference-1764615837723.jpg',
};

const maleShowcaseImages = [
  {
    filename: 'male-tokyo-ramen-night.png',
    referenceUrl: REFERENCE_IMAGES.shibuya1,
    prompt: `Using this reference photo of the man, create a hyper-realistic candid photo of him enjoying ramen at a tiny Tokyo ramen shop at night. He's sitting at the counter, chopsticks in hand, steam rising from the bowl. Warm yellow lighting from paper lanterns, Japanese characters on the wall menu. He's looking at the camera with a genuine smile. Authentic izakaya atmosphere with other diners visible. 8K resolution, candid smartphone photography aesthetic, sharp focus on eyes. Keep the same person's face and features from the reference.`,
  },
  {
    filename: 'male-seoul-street-food.png',
    referenceUrl: REFERENCE_IMAGES.shibuya2,
    prompt: `Using this reference photo of the man, create a hyper-realistic candid photo of him at a Seoul pojangmacha (street tent bar) at night. He's holding soju and eating Korean BBQ. Red and orange tent lighting, steam from cooking, other customers chatting. He looks back over his shoulder at the camera with a relaxed expression. Authentic Korean street food atmosphere. 8K resolution, raw candid style. Keep the same person's face and features.`,
  },
  {
    filename: 'male-cyberpunk-tokyo.png',
    referenceUrl: REFERENCE_IMAGES.tokyo1,
    prompt: `Using this reference photo of the man, create a hyper-realistic cyberpunk image of him in Neo-Tokyo 2099. He's wearing a sleek cyber-enhanced jacket with LED accents. Massive holographic advertisements, flying cars, neon-lit skyscrapers. Rain-slicked streets reflecting neon lights. He's looking at the camera with a confident expression. Blade Runner meets Ghost in the Shell aesthetic. 8K resolution, cinematic. Keep the same person's face.`,
  },
  {
    filename: 'male-mars-colony.png',
    referenceUrl: REFERENCE_IMAGES.seattle,
    prompt: `Using this reference photo of the man, create a photorealistic image of him inside a Mars colony biodome in 2150. Red Martian landscape visible through the dome. Futuristic botanical gardens, hydroponic farms. He's wearing a sleek Mars Corporation jumpsuit, helmet under arm. Looking at camera with wonder and determination. Terraforming equipment visible. 8K resolution. Keep the same person's face.`,
  },
  {
    filename: 'male-paris-cafe.png',
    referenceUrl: REFERENCE_IMAGES.shibuya3,
    prompt: `Using this reference photo of the man, create a hyper-realistic candid photo of him at a Parisian café terrace. He's wearing a casual but stylish outfit, enjoying a coffee. Eiffel Tower visible in the background. Classic bistro chairs, croissant on the table. Golden hour lighting. 8K resolution, lifestyle photography. Keep the same person's face and features.`,
  },
  {
    filename: 'male-1920s-jazz.png',
    referenceUrl: REFERENCE_IMAGES.mumbai1,
    prompt: `Using this reference photo of the man, create a vintage-style photo of him in 1920s Paris during the Jazz Age. He's wearing a sharp suit with art deco accessories at a smoky jazz club. Sepia tones, film grain, soft focus. Other patrons in the background. Authentic 1920s atmosphere with period-accurate details. Gatsby-era elegance. Keep the same person's face.`,
  },
  {
    filename: 'male-tokyo-city-pop.png',
    referenceUrl: REFERENCE_IMAGES.tokyo2,
    prompt: `Using this reference photo of the man, create a retro 1980s Japanese City Pop aesthetic image. He's in 80s fashion (oversized blazer, cool accessories) at a Tokyo disco. Neon lights, mirror ball, pastel colors. VHS quality grain, soft glow. Other dancers in the background. Authentic 80s Japanese bubble era aesthetic. Nostalgic, dreamy. Keep the same person's face.`,
  },
  {
    filename: 'male-midnight-hotel-grid.png',
    referenceUrl: REFERENCE_IMAGES.mumbai2,
    prompt: `Using this reference photo of the man, create a sophisticated 3x3 cinematic contact sheet grid titled "深夜 MIDNIGHT" featuring him in a luxury Tokyo hotel room at night.

Row 1: 
1. Looking out floor-to-ceiling window at Tokyo skyline, holding whiskey glass
2. Adjusting tie in mirror, city lights reflected
3. Walking down a long hotel corridor

Row 2:
4. Lounging on velvet sofa, relaxed pose
5. Close-up sipping from crystal glass
6. Extreme close-up of hand holding glass

Row 3:
7. Silhouette against window, city lights creating halo
8. Extreme close-up of eyes with city lights reflected
9. Watch on nightstand with bokeh lights

Same person throughout, moody blue and gold lighting. Japanese title typography at bottom. Keep the same person's face from reference.`,
  },
  {
    filename: 'male-floating-library.png',
    referenceUrl: REFERENCE_IMAGES.shibuya1,
    prompt: `Using this reference photo of the man, create a surrealist image of him in an infinite floating library. Books and bookshelves floating in impossible orientations, defying gravity. He's sitting on a floating armchair reading, surrounded by glowing orbs of light. MC Escher meets Studio Ghibli aesthetic. Dreamlike atmosphere, impossible architecture. 8K resolution. Keep the same person's face.`,
  },
  {
    filename: 'male-ancient-samurai.png',
    referenceUrl: REFERENCE_IMAGES.tokyo1,
    prompt: `Using this reference photo of the man, create an oil painting style image of him as a samurai warrior in feudal Japan. He's wearing traditional samurai armor, standing in a cherry blossom garden. Mount Fuji in the background. Classical oil painting technique with rich colors, visible brushstrokes. Museum-quality painting aesthetic. Keep the same person's face but in the painting style.`,
  },
];

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    console.log(`   📥 Fetching reference from Supabase...`);
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`   ⚠️ Failed to fetch: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return { data: base64, mimeType: contentType };
  } catch (error) {
    console.log(`   ⚠️ Failed to fetch reference image: ${error}`);
    return null;
  }
}

async function generateImage(config: typeof maleShowcaseImages[0]): Promise<string | null> {
  console.log(`\n🎨 Generating: ${config.filename}`);
  
  try {
    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
    
    // Fetch reference image from Supabase
    const refImage = await fetchImageAsBase64(config.referenceUrl);
    if (refImage) {
      parts.push({
        inlineData: {
          data: refImage.data,
          mimeType: refImage.mimeType
        }
      });
      console.log(`   📷 Reference image loaded`);
    } else {
      console.log(`   ⚠️ No reference image, skipping...`);
      return null;
    }
    
    parts.push({ text: config.prompt });

    let response;
    
    try {
      // Primary: Gemini 3 Pro (Nano Banana Pro) - highest quality
      console.log(`   🔄 Using gemini-3-pro-image-preview (Nano Banana Pro)...`);
      response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: {
          responseModalities: ['Text', 'Image'],
          imageConfig: {
            aspectRatio: '16:9',
            imageSize: '2K',
          },
        },
      });
    } catch (proError: any) {
      console.log(`   ⚠️ Pro model failed: ${proError.message?.substring(0, 80)}...`);
      try {
        // Fallback: Gemini 2.5 Flash (Nano Banana)
        console.log(`   🔄 Fallback to gemini-2.5-flash-image...`);
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
        });
      } catch (flashError: any) {
        console.log(`   ❌ Fallback also failed: ${flashError.message?.substring(0, 80)}...`);
        return null;
      }
    }

    const candidates = (response as any).candidates;
    if (!candidates?.[0]?.content?.parts) {
      console.log(`   ⚠️ No response parts`);
      return null;
    }

    for (const part of candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const imageData = part.inlineData.data;
        const filePath = path.join(OUTPUT_DIR, config.filename);
        
        if (!fs.existsSync(OUTPUT_DIR)) {
          fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        
        fs.writeFileSync(filePath, Buffer.from(imageData, 'base64'));
        console.log(`   ✅ Saved: ${config.filename}`);
        return filePath;
      }
    }
    
    for (const part of candidates[0].content.parts) {
      if (part.text) {
        console.log(`   📝 Model response: ${part.text.substring(0, 100)}...`);
      }
    }
    
    console.log(`   ⚠️ No image data found`);
    return null;
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message || error}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Male Showcase Image Generator');
  console.log('=================================');
  console.log('Using Rohit Ghumare\'s reference images from Supabase');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`📷 Images to generate: ${maleShowcaseImages.length}\n`);
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const results: { success: string[]; failed: string[] } = { success: [], failed: [] };
  
  for (let i = 0; i < maleShowcaseImages.length; i++) {
    const config = maleShowcaseImages[i];
    console.log(`\n[${i + 1}/${maleShowcaseImages.length}]`);
    
    const result = await generateImage(config);
    if (result) {
      results.success.push(config.filename);
    } else {
      results.failed.push(config.filename);
    }
    
    if (i < maleShowcaseImages.length - 1) {
      console.log('   ⏳ Waiting 5s to avoid rate limits...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('\n=================================');
  console.log(`📊 Complete! ✅ ${results.success.length}/${maleShowcaseImages.length} | ❌ ${results.failed.length}`);
  
  if (results.success.length > 0) {
    console.log('\n✅ Generated:');
    results.success.forEach(f => console.log(`   - ${f}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed:');
    results.failed.forEach(f => console.log(`   - ${f}`));
  }
}

main().catch(console.error);

