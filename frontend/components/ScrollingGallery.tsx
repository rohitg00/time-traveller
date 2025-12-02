import React from 'react';

import neoTokyoCyberpunk from '../assets/showcase/neo-tokyo-2099-cyberpunk.png';
import marsColonyCyberpunk from '../assets/showcase/mars-colony-cyberpunk.png';
import marsColonyDome from '../assets/showcase/mars-colony-dome-2150.png';
import midnightTokyoGrid from '../assets/showcase/midnight-tokyo-hotel-grid.png';
import summerBeachGrid from '../assets/showcase/summer-beach-memory-grid.png';
import veniceCinematicGrid from '../assets/showcase/venice-cinematic-grid.png';
import tokyoRamenNight from '../assets/showcase/tokyo-ramen-night.png';
import seoulPojangmacha from '../assets/showcase/seoul-pojangmacha-night.png';
import kyotoTempleCat from '../assets/showcase/kyoto-temple-cat-candid.png';
import parisCafeTerrace from '../assets/showcase/paris-cafe-terrace-candid.png';
import kyotoDisposable from '../assets/showcase/kyoto-disposable-camera.png';
import venetianMasquerade from '../assets/showcase/venetian-masquerade-painting.png';
import japaneseUkiyoe from '../assets/showcase/japanese-ukiyo-e-modern.png';
import floatingLibrary from '../assets/showcase/floating-library-surreal.png';
import underwaterPalace from '../assets/showcase/underwater-palace-fantasy.png';
import egyptPyramids from '../assets/showcase/egypt-pyramids-oil-painting.png';
import fantasyCastle from '../assets/showcase/fantasy-castle-medieval.png';
import parisJazzAge from '../assets/showcase/paris-1920s-jazz-age.png';
import tokyoCityPop from '../assets/showcase/tokyo-1980s-city-pop.png';
import tokyoLightLeak from '../assets/showcase/tokyo-light-leak-fail.png';
import icelandAurora from '../assets/showcase/iceland-aurora-weather.png';
import hawaiiAerial from '../assets/showcase/hawaii-aerial-falling.png';
import parisPhotobook from '../assets/showcase/paris-photobook.png';
import atlantisSurreal from '../assets/showcase/atlantis-underwater-surreal.png';
import bangkokStreetFood from '../assets/showcase/bangkok-street-food-candid.png';

interface GalleryImage {
  src: string;
  title: string;
  style: string;
  location: string;
}

const leftGalleryImages: GalleryImage[] = [
  { src: neoTokyoCyberpunk, title: 'Neo-Tokyo 2099', style: 'Cyberpunk', location: 'Future Tokyo' },
  { src: marsColonyCyberpunk, title: 'Mars Colony', style: 'Sci-Fi', location: 'Olympus Mons' },
  { src: midnightTokyoGrid, title: '深夜 Midnight', style: 'Cinematic Grid', location: 'Tokyo Hotel' },
  { src: summerBeachGrid, title: '青い夏 Beach', style: 'Cinematic Grid', location: 'Japanese Beach' },
  { src: tokyoRamenNight, title: 'Ramen Night', style: 'Hyper-Candid', location: 'Tokyo Izakaya' },
  { src: seoulPojangmacha, title: 'Pojangmacha', style: 'Night Scene', location: 'Seoul Street' },
  { src: venetianMasquerade, title: 'Masquerade Ball', style: 'Oil Painting', location: 'Venice 1700s' },
  { src: japaneseUkiyoe, title: 'Modern Ukiyo-e', style: 'Woodblock Art', location: 'Kyoto' },
  { src: egyptPyramids, title: 'Ancient Egypt', style: 'Oil Painting', location: 'Giza 2500 BC' },
  { src: parisPhotobook, title: 'Paris Memories', style: 'Photo Book', location: 'Paris' },
  { src: bangkokStreetFood, title: 'Street Food', style: 'Candid', location: 'Bangkok' },
  { src: atlantisSurreal, title: 'Lost Atlantis', style: 'Surreal', location: 'Underwater City' },
];

const rightGalleryImages: GalleryImage[] = [
  { src: marsColonyDome, title: 'Mars Biodome', style: 'Sci-Fi', location: 'Mars 2150' },
  { src: veniceCinematicGrid, title: 'Venice Grid', style: 'Cinematic 9-Shot', location: 'Renaissance' },
  { src: kyotoTempleCat, title: 'Temple Cat', style: 'Candid', location: 'Kyoto Shrine' },
  { src: parisCafeTerrace, title: 'Café Terrace', style: 'Lifestyle', location: 'Paris' },
  { src: kyotoDisposable, title: 'Disposable Cam', style: 'Lo-Fi Film', location: 'Fushimi Inari' },
  { src: floatingLibrary, title: 'Infinite Library', style: 'Surreal', location: 'Dreamscape' },
  { src: underwaterPalace, title: 'Mermaid Palace', style: 'Fantasy', location: 'Atlantis' },
  { src: fantasyCastle, title: 'Fantasy Castle', style: 'High Fantasy', location: 'Floating Island' },
  { src: parisJazzAge, title: 'Jazz Age', style: '1920s Vintage', location: 'Paris' },
  { src: tokyoCityPop, title: 'City Pop', style: '1980s Retro', location: 'Tokyo Disco' },
  { src: tokyoLightLeak, title: 'Light Leak', style: 'Retro Fail', location: 'Shibuya' },
  { src: icelandAurora, title: 'Aurora Borealis', style: 'Weather', location: 'Iceland' },
  { src: hawaiiAerial, title: 'Aerial Dive', style: 'Drone View', location: 'Waikiki' },
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
