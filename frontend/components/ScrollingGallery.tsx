import React from 'react';

// Selected showcase images (6 curated)
import venetianMasquerade from '../assets/showcase/venetian-masquerade-painting.png';
import veniceCinematicGrid from '../assets/showcase/venice-cinematic-grid.png';
import summerBeachGrid from '../assets/showcase/summer-beach-memory-grid.png';
import parisPhotobook from '../assets/showcase/paris-photobook.png';
import midnightTokyoGrid from '../assets/showcase/midnight-tokyo-hotel-grid.png';
import marsColonyCyberpunk from '../assets/showcase/mars-colony-cyberpunk.png';

// Male showcase images
import maleTokyoRamen from '../assets/showcase/male-tokyo-ramen-night.png';
import maleSeoulStreetFood from '../assets/showcase/male-seoul-street-food.png';
import maleCyberpunkTokyo from '../assets/showcase/male-cyberpunk-tokyo.png';
import maleMarsColony from '../assets/showcase/male-mars-colony.png';
import maleParisCafe from '../assets/showcase/male-paris-cafe.png';
import male1920sJazz from '../assets/showcase/male-1920s-jazz.png';
import maleTokyoCityPop from '../assets/showcase/male-tokyo-city-pop.png';
import maleMidnightHotel from '../assets/showcase/male-midnight-hotel-grid.png';
import maleFloatingLibrary from '../assets/showcase/male-floating-library.png';
import maleAncientSamurai from '../assets/showcase/male-ancient-samurai.png';

// Female showcase images (3x3 grid girl)
import femaleTokyoRamen from '../assets/showcase/female-tokyo-ramen-night.png';
import femaleSeoulStreetFood from '../assets/showcase/female-seoul-street-food.png';
import femaleCyberpunkTokyo from '../assets/showcase/female-cyberpunk-tokyo.png';
import femaleMarsColony from '../assets/showcase/female-mars-colony.png';
import female1920sJazz from '../assets/showcase/female-1920s-jazz.png';
import femaleTokyoCityPop from '../assets/showcase/female-tokyo-city-pop.png';
import femaleKyotoTemple from '../assets/showcase/female-kyoto-temple.png';
import femaleFloatingLibrary from '../assets/showcase/female-floating-library.png';
import femaleSantorini from '../assets/showcase/female-santorini-sunset.png';

interface GalleryImage {
  src: string;
  title: string;
  style: string;
  location: string;
}

// Left gallery: Curated showcase + Male images
const leftGalleryImages: GalleryImage[] = [
  // Curated showcase images
  { src: venetianMasquerade, title: 'Masquerade 🎭', style: 'Oil Painting', location: 'Venice 1700s' },
  { src: veniceCinematicGrid, title: 'Venice Grid', style: 'Cinematic 9-Shot', location: 'Venice' },
  { src: summerBeachGrid, title: '青い夏 Beach', style: 'Cinematic Grid', location: 'Japanese Beach' },
  // Male showcase images
  { src: maleTokyoRamen, title: 'Ramen Night 🍜', style: 'Hyper-Candid', location: 'Tokyo' },
  { src: maleSeoulStreetFood, title: 'Seoul Street 🍻', style: 'Night Scene', location: 'Korea' },
  { src: maleCyberpunkTokyo, title: 'Cyber Future 🤖', style: 'Cyberpunk', location: 'Neo-Tokyo' },
  { src: maleMarsColony, title: 'Mars Explorer 🚀', style: 'Sci-Fi', location: 'Mars 2150' },
  { src: maleParisCafe, title: 'Paris Café ☕', style: 'Lifestyle', location: 'Paris' },
  { src: male1920sJazz, title: 'Jazz Age 🎷', style: '1920s Vintage', location: 'Paris' },
  { src: maleTokyoCityPop, title: 'City Pop 🕺', style: '1980s Retro', location: 'Tokyo' },
  { src: maleMidnightHotel, title: 'Midnight 🌃', style: 'Cinematic Grid', location: 'Tokyo Hotel' },
  { src: maleFloatingLibrary, title: 'Library 📚', style: 'Surreal', location: 'Dreamscape' },
  { src: maleAncientSamurai, title: 'Samurai ⚔️', style: 'Oil Painting', location: 'Feudal Japan' },
];

// Right gallery: Curated showcase + Female images
const rightGalleryImages: GalleryImage[] = [
  // Curated showcase images
  { src: parisPhotobook, title: 'Paris Memories', style: 'Photo Book', location: 'Paris' },
  { src: midnightTokyoGrid, title: '深夜 Midnight', style: 'Cinematic Grid', location: 'Tokyo Hotel' },
  { src: marsColonyCyberpunk, title: 'Mars Colony', style: 'Sci-Fi', location: 'Olympus Mons' },
  // Female showcase images
  { src: femaleTokyoRamen, title: 'Ramen Girl 🍜', style: 'Hyper-Candid', location: 'Tokyo' },
  { src: femaleSeoulStreetFood, title: 'Seoul Night 🌙', style: 'Night Scene', location: 'Korea' },
  { src: femaleCyberpunkTokyo, title: 'Neon Girl 💜', style: 'Cyberpunk', location: 'Neo-Tokyo' },
  { src: femaleMarsColony, title: 'Mars Pioneer 🔴', style: 'Sci-Fi', location: 'Mars 2150' },
  { src: female1920sJazz, title: 'Flapper Girl 💃', style: '1920s Vintage', location: 'Paris' },
  { src: femaleTokyoCityPop, title: '80s Disco 🪩', style: '1980s Retro', location: 'Tokyo' },
  { src: femaleKyotoTemple, title: 'Kyoto Autumn 🍁', style: 'Candid', location: 'Kyoto' },
  { src: femaleFloatingLibrary, title: 'Dream Library ✨', style: 'Surreal', location: 'Dreamscape' },
  { src: femaleSantorini, title: 'Santorini 🇬🇷', style: 'Travel', location: 'Greece' },
];

interface ScrollingGalleryProps {
  side: 'left' | 'right';
}

export const ScrollingGallery: React.FC<ScrollingGalleryProps> = ({ side }) => {
  const images = side === 'left' ? leftGalleryImages : rightGalleryImages;
  const animationClass = side === 'left' ? 'animate-scroll-up' : 'animate-scroll-down';
  
  return (
    <div className="hidden xl:block w-28 2xl:w-36 flex-shrink-0 sticky top-0 h-screen overflow-hidden mx-1 2xl:mx-2">
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-cyber-900 via-cyber-900/90 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-cyber-900 via-cyber-900/90 to-transparent z-10 pointer-events-none"></div>
      
      <div className={`flex flex-col gap-3 pt-16 ${animationClass}`}>
        {[...images, ...images].map((img, index) => (
          <div 
            key={`${side}-${index}`}
            className="group relative w-24 h-32 2xl:w-32 2xl:h-44 mx-auto rounded-lg overflow-hidden border border-cyber-700/30 hover:border-cyber-500 transition-all duration-300 cursor-pointer hover:scale-105 hover:z-20 shadow-md hover:shadow-[0_0_25px_rgba(0,102,255,0.4)] bg-cyber-800/50"
          >
            <img 
              src={img.src} 
              alt={img.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-1.5 left-1.5 right-1.5">
                <p className="text-[8px] 2xl:text-[10px] text-white font-bold truncate leading-tight drop-shadow-lg">{img.title}</p>
                <p className="text-[7px] 2xl:text-[9px] text-cyber-400 truncate font-medium">{img.style}</p>
                <p className="text-[6px] 2xl:text-[8px] text-slate-400 truncate">{img.location}</p>
              </div>
            </div>
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.9)]"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MobileGallery: React.FC = () => {
  const mobileImages = [...leftGalleryImages.slice(0, 6), ...rightGalleryImages.slice(0, 6)];
  
  return (
    <div className="xl:hidden w-full h-24 relative overflow-hidden rounded-lg border border-cyber-800/50 bg-cyber-900/40 mb-4 shrink-0">
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cyber-900 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cyber-900 to-transparent z-10 pointer-events-none"></div>
      
      <div className="flex items-center h-full animate-scroll-left hover:pause-animation w-max">
        {[...mobileImages, ...mobileImages, ...mobileImages].map((img, index) => (
          <div 
            key={`mobile-${index}`}
            className="relative w-16 h-20 mx-1.5 rounded-md overflow-hidden border border-cyber-700/30 shrink-0 shadow-lg"
          >
            <img 
              src={img.src} 
              alt={img.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-100">
              <div className="absolute bottom-1 left-1 right-1">
                <p className="text-[6px] text-white font-bold truncate text-center">{img.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
