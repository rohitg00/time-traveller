/**
 * Time Traveller Showcase Image Generator
 * Uses Gemini (Nano Banana) for high-quality image generation
 * Usage: GEMINI_API_KEY=your_key npx tsx scripts/generateShowcaseImages.ts
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  console.log('Usage: GEMINI_API_KEY=your_key npx tsx scripts/generateShowcaseImages.ts');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const ASSETS_DIR = path.join(__dirname, '../frontend/assets');
const OUTPUT_DIR = path.join(__dirname, '../frontend/assets/showcase');

const referenceImages = {
  bangkokNightMarket: path.join(ASSETS_DIR, 'bangkok-night-market.png'),
  candidCatPatio: path.join(ASSETS_DIR, 'candid-cat-patio.png'),
  celebrityBackstage: path.join(ASSETS_DIR, 'celebrity-backstage-selfie.png'),
  intoxicatedGrid: path.join(ASSETS_DIR, 'intoxicated-wine-night-grid.png'),
  koreanFashion: path.join(ASSETS_DIR, 'korean-fashion-portrait.png'),
  seoulBakery: path.join(ASSETS_DIR, 'seoul-bakery-candid.png'),
  blueSummer: path.join(ASSETS_DIR, 'blue-summer-photobook.png'),
  dramaticPortrait: path.join(ASSETS_DIR, 'dramatic-portrait-dark.png'),
  frenchBathroom: path.join(ASSETS_DIR, 'french-bathroom-vintage.png'),
  parisBakery: path.join(ASSETS_DIR, 'paris-bakery-macarons.png'),
};

const showcaseImages = [
  {
    filename: 'tokyo-ramen-night.png',
    referenceImage: referenceImages.bangkokNightMarket,
    prompt: `Create a hyper-realistic candid photo of a young Asian woman enjoying ramen at a tiny Tokyo ramen shop at night. She's sitting at the counter, chopsticks in hand, steam rising from the bowl. Warm yellow lighting from paper lanterns, Japanese characters on the wall menu. The woman is looking at the camera with a genuine smile, mid-bite. Authentic izakaya atmosphere with other diners visible. 8K resolution, candid smartphone photography aesthetic, sharp focus on eyes.`,
  },
  {
    filename: 'seoul-pojangmacha-night.png',
    referenceImage: referenceImages.bangkokNightMarket,
    prompt: `A hyper-realistic candid photo of a young Korean woman at a Seoul pojangmacha (street tent bar) at night. She's holding soju and eating tteokbokki. Red and orange tent lighting, steam from cooking, other customers chatting. The woman looks back over her shoulder at the camera with a playful tipsy expression. Authentic Korean street food atmosphere. 8K resolution, raw candid style.`,
  },
  {
    filename: 'kyoto-temple-cat-candid.png',
    referenceImage: referenceImages.candidCatPatio,
    prompt: `A hyper-realistic candid photo of a young Asian woman in a casual outfit crouched down petting a temple cat at a traditional Kyoto shrine. High angle shot looking down. She's looking up at the camera with a mischievous doe-eyed gaze and suppressed smile. Wooden temple architecture, stone lanterns, autumn leaves. Natural daylight, soft shadows. 8K resolution, candid smartphone aesthetic.`,
  },
  {
    filename: 'paris-cafe-terrace-candid.png',
    referenceImage: referenceImages.candidCatPatio,
    prompt: `A hyper-realistic candid photo of a young woman at a Parisian café terrace, crouched down to pet a French bulldog. She's wearing a chic Parisian outfit, looking back at the camera with a charming smile. Eiffel Tower visible in the background. Classic bistro chairs, coffee cup on the table. Golden hour lighting. 8K resolution, lifestyle photography.`,
  },
  {
    filename: 'tokyo-fashion-week-backstage.png',
    referenceImage: referenceImages.celebrityBackstage,
    prompt: `A hyper-realistic backstage selfie at Tokyo Fashion Week. A group of 5 diverse models and designers crowded together for a selfie. Mix of Japanese and international faces. Backstage chaos visible - clothing racks, makeup stations, water bottles. Flash photography aesthetic, slightly overexposed. Everyone is smiling or making cool expressions. Authentic backstage energy. 8K resolution.`,
  },
  {
    filename: 'coachella-vip-tent-selfie.png',
    referenceImage: referenceImages.celebrityBackstage,
    prompt: `A hyper-realistic VIP tent selfie at Coachella music festival. A group of 4-5 friends in festival outfits crowded together. Flower crowns, boho fashion, glitter makeup. Festival lights and stage visible through the tent. Golden hour desert lighting. Everyone is laughing and having fun. Candid flash selfie aesthetic. 8K resolution.`,
  },
  {
    filename: 'midnight-tokyo-hotel-grid.png',
    referenceImage: referenceImages.intoxicatedGrid,
    prompt: `Create a sophisticated 3x3 cinematic contact sheet grid titled "深夜 MIDNIGHT" featuring a young Asian woman in a black silk robe in a luxury Tokyo hotel room at night.

Row 1: 
1. Looking out floor-to-ceiling window at Tokyo skyline, holding whiskey glass
2. Applying lipstick in mirror, city lights reflected
3. Walking down a long hotel corridor barefoot

Row 2:
4. Lounging on velvet sofa, legs crossed elegantly
5. Close-up sipping from crystal glass, eyes closed
6. Extreme close-up of manicured hand holding glass

Row 3:
7. Silhouette against window, city lights creating halo
8. Extreme close-up of eyes with city lights reflected
9. Pearl earrings on nightstand with bokeh lights

Same person, same outfit, same moody blue and gold lighting throughout. Japanese title typography at bottom. Professional cinematic color grading.`,
  },
  {
    filename: 'summer-beach-memory-grid.png',
    referenceImage: referenceImages.intoxicatedGrid,
    prompt: `Create a nostalgic 3x3 cinematic contact sheet grid titled "青い夏 BLUE SUMMER" featuring a young woman at a Japanese beach during golden hour.

Row 1:
1. Extreme long shot - tiny figure on vast empty beach, waves
2. Long shot - full body in white summer dress, wind in hair
3. Medium shot - holding vintage camera, laughing

Row 2:
4. Medium shot - eating shaved ice at beach hut
5. Close-up - sun-kissed face, eyes squinting in sunlight
6. Close-up - bare feet in sand, waves touching toes

Row 3:
7. Extreme close-up - water droplets on skin
8. Low angle - looking up at her against blue sky
9. High angle - her shadow on sand with seashells

Same person, same outfit, warm golden hour lighting. Japanese title typography. Film grain, nostalgic summer feeling.`,
  },
  {
    filename: 'neo-tokyo-2099-cyberpunk.png',
    referenceImage: referenceImages.dramaticPortrait,
    prompt: `A hyper-realistic cyberpunk image of a young woman in Neo-Tokyo 2099. She's wearing a sleek cyber-enhanced outfit with LED accents. Massive holographic advertisements, flying cars, neon-lit skyscrapers. Rain-slicked streets reflecting neon lights. She's looking at the camera with cybernetic eye implants glowing. Blade Runner meets Ghost in the Shell aesthetic. 8K resolution, cinematic.`,
  },
  {
    filename: 'mars-colony-dome-2150.png',
    referenceImage: referenceImages.dramaticPortrait,
    prompt: `A photorealistic image of a young woman inside a Mars colony biodome in 2150. Red Martian landscape visible through the dome. Futuristic botanical gardens, hydroponic farms, other colonists walking. She's wearing a sleek Mars Corporation jumpsuit, helmet under arm. Looking at camera with wonder and determination. Terraforming equipment visible. 8K resolution.`,
  },
  {
    filename: 'venetian-masquerade-painting.png',
    referenceImage: referenceImages.blueSummer,
    prompt: `An oil painting style image of a young woman at a Venetian masquerade ball in the 1700s. She's wearing an elaborate baroque gown and ornate Venetian mask. Grand ballroom with chandeliers, other masked dancers, candlelight. Classical oil painting technique with rich colors, visible brushstrokes. Museum-quality Renaissance painting aesthetic.`,
  },
  {
    filename: 'japanese-ukiyo-e-modern.png',
    referenceImage: referenceImages.koreanFashion,
    prompt: `A modern take on Japanese ukiyo-e woodblock print style. A young woman in traditional kimono at a cherry blossom viewing party. Mount Fuji in background, floating petals. Bold outlines, flat colors, decorative patterns. Mix of traditional ukiyo-e and contemporary illustration. Artistic, stylized, beautiful composition.`,
  },
  {
    filename: 'floating-library-surreal.png',
    referenceImage: referenceImages.dramaticPortrait,
    prompt: `A surrealist image of a young woman in an infinite floating library. Books and bookshelves floating in impossible orientations, defying gravity. She's sitting on a floating armchair reading, surrounded by glowing orbs of light. MC Escher meets Studio Ghibli aesthetic. Dreamlike atmosphere, impossible architecture. 8K resolution.`,
  },
  {
    filename: 'underwater-palace-fantasy.png',
    referenceImage: referenceImages.blueSummer,
    prompt: `A fantasy image of a young woman as a mermaid princess in an underwater crystal palace. Bioluminescent sea creatures, coral architecture, sunbeams filtering through water. She has an iridescent tail and crown of pearls. Ancient Greek columns covered in coral. Magical, ethereal atmosphere. 8K resolution.`,
  },
  {
    filename: 'paris-1920s-jazz-age.png',
    referenceImage: referenceImages.frenchBathroom,
    prompt: `A vintage-style photo of a young woman in 1920s Paris during the Jazz Age. She's wearing a flapper dress with art deco jewelry at a smoky jazz club. Sepia tones, film grain, soft focus. Other patrons dancing the Charleston. Authentic 1920s atmosphere with period-accurate details. Gatsby-era elegance.`,
  },
  {
    filename: 'tokyo-1980s-city-pop.png',
    referenceImage: referenceImages.koreanFashion,
    prompt: `A retro 1980s Japanese City Pop aesthetic image. A young woman in 80s fashion (oversized blazer, big earrings) at a Tokyo disco. Neon lights, mirror ball, pastel colors. VHS quality grain, soft glow. Other dancers in the background. Authentic 80s Japanese bubble era aesthetic. Nostalgic, dreamy.`,
  },
];

async function loadImageAsBase64(imagePath: string): Promise<{ data: string; mimeType: string } | null> {
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

async function generateImage(config: typeof showcaseImages[0]): Promise<string | null> {
  console.log(`\n🎨 Generating: ${config.filename}`);
  
  try {
    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
    
    if (config.referenceImage) {
      const refImage = await loadImageAsBase64(config.referenceImage);
      if (refImage) {
        parts.push({
          inlineData: {
            data: refImage.data,
            mimeType: refImage.mimeType
          }
        });
        console.log(`   📷 Using reference: ${path.basename(config.referenceImage)}`);
      }
    }
    
    parts.push({ text: config.prompt });

    let response;
    
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
      });
    } catch (flashError: any) {
      console.log(`   ⚠️ Flash model failed: ${flashError.message?.substring(0, 80)}...`);
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
              imageSize: "2K"
            },
          },
        });
      } catch (proError: any) {
        console.log(`   ❌ Pro model also failed: ${proError.message?.substring(0, 80)}...`);
        return null;
      }
    }

    const candidates = (response as any).candidates;
    if (!candidates?.[0]?.content?.parts) {
      console.log(`   ⚠️ No response parts for ${config.filename}`);
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
    
    console.log(`   ⚠️ No image data found for ${config.filename}`);
    return null;
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message || error}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Time Traveller Showcase Image Generator');
  console.log('==========================================');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`📷 Images: ${showcaseImages.length}\n`);
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const results: { success: string[]; failed: string[] } = { success: [], failed: [] };
  
  for (let i = 0; i < showcaseImages.length; i++) {
    const config = showcaseImages[i];
    console.log(`\n[${i + 1}/${showcaseImages.length}]`);
    
    const result = await generateImage(config);
    if (result) {
      results.success.push(config.filename);
    } else {
      results.failed.push(config.filename);
    }
    
    if (i < showcaseImages.length - 1) {
      console.log('   ⏳ Waiting 3s...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n==========================================');
  console.log(`📊 Complete! ✅ ${results.success.length}/${showcaseImages.length} | ❌ ${results.failed.length}`);
  
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
