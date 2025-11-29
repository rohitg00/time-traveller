import React, { useEffect, useRef } from 'react';

interface StarfieldProps {
  weatherCondition?: string;
}

export const Starfield: React.FC<StarfieldProps> = ({ weatherCondition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Keep track of particles across renders
  const starsRef = useRef<any[]>([]);
  const weatherParticlesRef = useRef<any[]>([]);

  // Determine weather mode from description string
  const getMode = (condition?: string) => {
    if (!condition) return 'clear';
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'rain';
    if (c.includes('snow') || c.includes('blizzard') || c.includes('sleet')) return 'snow';
    if (c.includes('cloud') || c.includes('overcast') || c.includes('fog') || c.includes('mist')) return 'cloudy';
    if (c.includes('thunder') || c.includes('storm')) return 'storm';
    return 'clear';
  };

  const mode = getMode(weatherCondition);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let lightningTimer = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
      initWeatherParticles();
    };

    const initStars = () => {
      starsRef.current = [];
      for (let i = 0; i < 150; i++) {
        starsRef.current.push({
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * width,
          size: Math.random() * 2 + 0.5,
          speed: 0.8
        });
      }
    };

    const initWeatherParticles = () => {
      weatherParticlesRef.current = [];
      let numParticles = 0;
      
      if (mode === 'rain' || mode === 'storm') numParticles = 800;
      else if (mode === 'snow') numParticles = 400;
      else if (mode === 'cloudy') numParticles = 15; // Fewer, larger, subtle clouds

      for (let i = 0; i < numParticles; i++) {
        if (mode === 'rain' || mode === 'storm') {
          weatherParticlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            size: Math.random() * 2 + 10,
            speed: Math.random() * 15 + 10,
            opacity: Math.random() * 0.5 + 0.1
          });
        } else if (mode === 'snow') {
          weatherParticlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 2 + 1,
            opacity: Math.random() * 0.8 + 0.2
          });
        } else if (mode === 'cloudy') {
          weatherParticlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 400 + 200, // Very large clouds
            speed: Math.random() * 0.2 + 0.05,
            opacity: Math.random() * 0.1 + 0.02 // Extremely subtle
          });
        }
      }
    };

    const drawStars = () => {
      // Grid
      ctx.strokeStyle = 'rgba(0, 102, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      const offsetX = (mouseX * 0.05) % gridSize;
      const offsetY = (mouseY * 0.05) % gridSize;
      for (let x = offsetX; x < width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = offsetY; y < height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

      // Stars
      starsRef.current.forEach(p => {
        p.z -= p.speed;
        const parallaxX = (mouseX - width / 2) * (width / p.z) * 0.02;
        const parallaxY = (mouseY - height / 2) * (width / p.z) * 0.02;

        if (p.z <= 0) {
          p.z = width;
          p.x = Math.random() * width - width / 2;
          p.y = Math.random() * height - height / 2;
        }

        const k = 128.0 / p.z;
        const px = p.x * k + width / 2 + parallaxX;
        const py = p.y * k + height / 2 + parallaxY;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const size = (1 - p.z / width) * p.size;
          const alpha = (1 - p.z / width) * 0.8;
          
          ctx.beginPath();
          ctx.fillStyle = `rgba(0, 102, 255, ${alpha})`;
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
          
          if (p.z < width * 0.3) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(0, 102, 255, ${alpha * 0.5})`;
              ctx.lineWidth = size * 0.5;
              ctx.moveTo(px, py);
              ctx.lineTo(px - (px - width/2) * 0.05, py - (py - height/2) * 0.05);
              ctx.stroke();
          }
        }
      });
    };

    const drawWeather = () => {
      weatherParticlesRef.current.forEach(p => {
        if (mode === 'rain' || mode === 'storm') {
          p.y += p.speed;
          if (p.y > height) { p.y = -p.size; p.x = Math.random() * width; }
          ctx.beginPath();
          ctx.strokeStyle = `rgba(100, 150, 255, ${p.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.stroke();
        } else if (mode === 'snow') {
          p.y += p.speed;
          p.x += Math.sin(p.y * 0.01) * 0.5;
          if (p.y > height) { p.y = -p.size; p.x = Math.random() * width; }
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (mode === 'cloudy') {
          p.x -= p.speed;
          if (p.x < -p.size) { p.x = width + p.size; }
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          gradient.addColorStop(0, `rgba(150, 170, 200, ${p.opacity})`); // Subtle blue-grey
          gradient.addColorStop(1, 'rgba(150, 170, 200, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
      });

      if (mode === 'storm') {
         if (Math.random() < 0.005) lightningTimer = 5;
         if (lightningTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${lightningTimer * 0.1})`;
            ctx.fillRect(0, 0, width, height);
            lightningTimer--;
         }
      }
    };

    const update = () => {
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Base background
      ctx.fillStyle = '#02040a'; 
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Stars (Always visible background layer)
      drawStars();

      // 2. Draw Weather (Overlay layer)
      drawWeather();

      animationFrameId = requestAnimationFrame(update);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    
    resize(); // Initializes stars and weather
    update();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode]); // Re-init weather when mode changes (stars persist logic handled in init)

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-[-1] pointer-events-none"
    />
  );
};
