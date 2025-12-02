import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Reference image - the girl from the 3x3 grid (use this as primary)
const REFERENCE_IMAGE = path.join(__dirname, '../frontend/assets/3x3-grid.png');

interface ShowcaseImage {
  filename: string;
  prompt: string;
  destination: string;
  style: string;
}

const showcaseImages: ShowcaseImage[] = [
  {
    filename: 'female-tokyo-ramen-night.png',
    destination: 'Tokyo Ramen Shop',
    style: 'Hyper-Candid',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a hyper-realistic candid photograph of THIS EXACT WOMAN (from the 3x3 grid) at a cozy Tokyo ramen shop at night.
She's sitting at the counter with a steaming bowl of tonkotsu ramen in front of her, chopsticks in hand, about to take a bite.
The warm glow of paper lanterns illuminates her face. Steam rises from the bowl.
Background: Traditional Japanese ramen shop interior with wooden counter, menu signs in Japanese, other customers.
Style: Candid smartphone photography, natural warm lighting, 8K resolution, sharp focus on her expression.

CRITICAL REQUIREMENTS:
- Use the EXACT same woman from the 3x3 grid reference image
- Same face shape, eyes, nose, lips, skin tone
- Same black hair (can be styled differently)
- Photorealistic, NOT illustration`
  },
  {
    filename: 'female-seoul-street-food.png',
    destination: 'Seoul Myeongdong',
    style: 'Night Scene',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a vibrant nighttime photograph of THIS EXACT WOMAN at a Seoul street food market in Myeongdong.
She's holding Korean street food (tteokbokki or corn dog) and smiling at the camera.
Neon signs in Korean illuminate the bustling night market behind her.
Background: Colorful food stalls, steam rising, crowds of people, Korean signage.
Style: Vibrant night photography, neon lighting, candid lifestyle shot, high resolution.

CRITICAL: Use the EXACT same woman from the 3x3 grid - same face, eyes, nose, lips, black hair.`
  },
  {
    filename: 'female-paris-cafe.png',
    destination: 'Paris Café',
    style: 'Lifestyle',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a charming lifestyle photograph of THIS EXACT WOMAN at a classic Parisian sidewalk café.
She's seated at a small round table with a croissant and café au lait, looking thoughtfully to the side.
The Eiffel Tower is subtly visible in the background. Morning golden hour light.
Background: Classic French café with wicker chairs, cobblestone street, other café-goers.
Style: Editorial travel photography, soft golden light, dreamy aesthetic.

CRITICAL: Use the EXACT same woman from the 3x3 grid - same face, eyes, nose, lips, black hair.`
  },
  {
    filename: 'female-cyberpunk-tokyo.png',
    destination: 'Neo-Tokyo 2099',
    style: 'Cyberpunk',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a stunning cyberpunk photograph of THIS EXACT WOMAN in a futuristic Neo-Tokyo setting.
She's standing in a neon-lit alley, holographic advertisements floating around her.
Her outfit has subtle futuristic elements but she looks natural and beautiful.
Rain-slicked streets reflect the neon lights in pink, blue, and purple.
Background: Towering buildings with Japanese holographic signs, flying vehicles, cyberpunk atmosphere.
Style: Blade Runner aesthetic, dramatic neon lighting, cinematic composition, 8K detail.

CRITICAL: Use the EXACT same woman from the 3x3 grid - same face, eyes, nose, lips, black hair.`
  },
  {
    filename: 'female-mars-colony.png',
    destination: 'Mars Colony 2150',
    style: 'Sci-Fi',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a stunning sci-fi photograph of THIS EXACT WOMAN inside a Mars colony biodome.
She's wearing a sleek but comfortable space colony outfit, looking out at the Martian landscape through a large window.
Red Martian terrain visible outside, Earth visible as a small dot in the sky.
Background: Futuristic colony interior with plants, advanced technology, other colonists.
Style: Realistic sci-fi, dramatic lighting from the Mars sunset, hopeful atmosphere.

CRITICAL: Use the EXACT same woman from the 3x3 grid - same face, eyes, nose, lips, black hair.`
  },
  {
    filename: 'female-1920s-jazz.png',
    destination: 'Paris 1920s',
    style: '1920s Vintage',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a glamorous 1920s Jazz Age photograph of THIS EXACT WOMAN at a Parisian speakeasy.
She's dressed in an elegant flapper dress with art deco jewelry, holding a champagne coupe.
The scene captures the glamour and excitement of the Roaring Twenties.
Background: Ornate jazz club interior, musicians playing, well-dressed patrons dancing.
Style: Vintage sepia-toned photography with slight film grain, golden lighting, old Hollywood glamour.

CRITICAL: Use the EXACT same woman from the 3x3 grid - same face, eyes, nose, lips. Hair styled for 1920s.`
  },
  {
    filename: 'female-tokyo-city-pop.png',
    destination: 'Tokyo 1980s',
    style: '1980s Retro',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a nostalgic 1980s city pop aesthetic photograph of THIS EXACT WOMAN in retro Tokyo.
She's at a neon-lit arcade or disco, wearing colorful 80s fashion with big earrings.
The scene has that dreamy, nostalgic Japanese city pop album cover vibe.
Background: Neon signs, arcade machines, disco lights, vintage Japanese aesthetic.
Style: Soft focus, warm colors, film grain, that distinctive 80s Japanese photography look.

CRITICAL: Use the EXACT same woman from the 3x3 grid - same face, eyes, nose, lips. Hair styled for 80s.`
  },
  {
    filename: 'female-kyoto-temple.png',
    destination: 'Kyoto Temple',
    style: 'Candid',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a serene candid photograph of THIS EXACT WOMAN at a beautiful Kyoto temple.
She's walking through the temple grounds in casual modern clothes, autumn leaves falling around her.
Golden afternoon light filters through the trees, creating a peaceful atmosphere.
Background: Traditional Japanese temple architecture, stone lanterns, maple trees with red leaves.
Style: Natural candid photography, soft golden hour lighting, peaceful aesthetic.

CRITICAL: Use the EXACT same woman from the 3x3 grid - same face, eyes, nose, lips, black hair.`
  },
  {
    filename: 'female-floating-library.png',
    destination: 'Infinite Library',
    style: 'Surreal',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a surrealist photograph of THIS EXACT WOMAN in an impossible infinite library.
She's sitting on floating stairs, surrounded by endless bookshelves that defy gravity.
Books float gently in the air around her. Soft ethereal lighting creates a dreamlike atmosphere.
Background: MC Escher-inspired impossible architecture, endless books, floating staircases.
Style: Surrealist photography, soft dreamy lighting, magical realism, high detail.

CRITICAL: Use the EXACT same woman from the 3x3 grid - same face, eyes, nose, lips, black hair.`
  },
  {
    filename: 'female-santorini-sunset.png',
    destination: 'Santorini Greece',
    style: 'Travel Editorial',
    prompt: `The reference image shows a 3x3 grid of the SAME woman with black hair making various expressions. Use her EXACT face, features, and appearance.

Create a stunning travel editorial photograph of THIS EXACT WOMAN in Santorini, Greece.
She's standing on a white-washed terrace overlooking the caldera during golden hour sunset.
The famous blue domes of Santorini churches are visible in the background.
Her dress flows gently in the Mediterranean breeze.
Background: White buildings, blue domes, stunning sunset over the Aegean Sea.
Style: High-end travel magazine photography, golden hour lighting, dreamy and aspirational.

CRITICAL: Use the EXACT same woman from the 3x3 grid - same face, eyes, nose, lips, black hair.`
  },
];

async function loadReferenceImage(imagePath: string): Promise<{ data: string; mimeType: string } | null> {
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
    console.log(`   ⚠️ Failed to load reference image: ${error}`);
    return null;
  }
}

async function generateShowcaseImage(config: ShowcaseImage, referenceImage: { data: string; mimeType: string }): Promise<boolean> {
  console.log(`\n📸 Generating: ${config.filename}`);
  console.log(`   📍 ${config.destination} | 🎨 ${config.style}`);
  
  const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];
  
  // Add reference image
  parts.push({
    inlineData: {
      mimeType: referenceImage.mimeType,
      data: referenceImage.data
    }
  });
  
  // Add prompt
  parts.push({ text: config.prompt });
  
  try {
    // Use Gemini 3 Pro (Nano Banana Pro) for highest quality
    console.log(`   🔄 Using gemini-3-pro-image-preview (Nano Banana Pro)...`);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        responseModalities: ['Text', 'Image'],
        imageConfig: {
          aspectRatio: '3:4',
          imageSize: '2K',
        },
      },
    });
    
    // Extract image from response
    const candidates = (response as any).candidates;
    if (!candidates?.[0]?.content?.parts) {
      console.log(`   ❌ No response parts`);
      return false;
    }
    
    for (const part of candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const outputPath = path.join(__dirname, '../frontend/assets/showcase', config.filename);
        const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`   ✅ Saved: ${config.filename}`);
        return true;
      }
    }
    
    console.log(`   ❌ No image in response`);
    return false;
    
  } catch (error: any) {
    console.log(`   ❌ Generation failed: ${error.message?.substring(0, 100)}...`);
    
    // Try fallback model
    try {
      console.log(`   🔄 Trying fallback: gemini-2.5-flash-image...`);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
      });
      
      const fallbackCandidates = (fallbackResponse as any).candidates;
      if (!fallbackCandidates?.[0]?.content?.parts) {
        console.log(`   ❌ No fallback response parts`);
        return false;
      }
      
      for (const part of fallbackCandidates[0].content.parts) {
        if (part.inlineData?.data) {
          const outputPath = path.join(__dirname, '../frontend/assets/showcase', config.filename);
          const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync(outputPath, imageBuffer);
          console.log(`   ✅ Saved (fallback): ${config.filename}`);
          return true;
        }
      }
      
      console.log(`   ❌ No image in fallback response`);
      return false;
    } catch (fallbackError: any) {
      console.log(`   ❌ Fallback also failed: ${fallbackError.message?.substring(0, 80)}...`);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Female Showcase Image Generator');
  console.log('===================================');
  console.log(`Using model: gemini-3-pro-image-preview (Nano Banana Pro)`);
  console.log(`Generating ${showcaseImages.length} images\n`);
  
  // Load reference image - the 3x3 grid girl
  const ref = await loadReferenceImage(REFERENCE_IMAGE);
  
  if (!ref) {
    console.error('❌ Failed to load reference image from 3x3-grid.png');
    process.exit(1);
  }
  
  console.log('✅ Reference image loaded successfully');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const config of showcaseImages) {
    const success = await generateShowcaseImage(config, ref);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Add delay between generations to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n===================================');
  console.log(`✅ Successfully generated: ${successCount}/${showcaseImages.length}`);
  console.log(`❌ Failed: ${failCount}/${showcaseImages.length}`);
  console.log('===================================');
}

main().catch(console.error);

