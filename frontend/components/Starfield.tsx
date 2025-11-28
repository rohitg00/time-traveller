import React, { useEffect, useRef } from 'react';

export const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; z: number; size: number }[] = [];
    
    const numStars = 150;
    const speed = 0.8;
    let width = 0;
    let height = 0;
    
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
    };

    const initStars = () => {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * width, // depth
          size: Math.random() * 2 + 0.5
        });
      }
    };

    const update = () => {
        // Smooth mouse follow
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        ctx.fillStyle = '#02040a'; // Match bg-cyber-900
        ctx.fillRect(0, 0, width, height);

        // Draw faint grid
        ctx.strokeStyle = 'rgba(0, 102, 255, 0.03)';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        const offsetX = (mouseX * 0.05) % gridSize;
        const offsetY = (mouseY * 0.05) % gridSize;

        // Vertical lines
        for (let x = offsetX; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        // Horizontal lines
        for (let y = offsetY; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        stars.forEach(star => {
            // Move stars towards viewer
            star.z -= speed;

            // Parallax based on mouse
            const parallaxX = (mouseX - width / 2) * (width / star.z) * 0.02;
            const parallaxY = (mouseY - height / 2) * (width / star.z) * 0.02;

            // Reset if behind camera
            if (star.z <= 0) {
                star.z = width;
                star.x = Math.random() * width - width / 2;
                star.y = Math.random() * height - height / 2;
            }

            const k = 128.0 / star.z;
            const px = star.x * k + width / 2 + parallaxX;
            const py = star.y * k + height / 2 + parallaxY;
            
            if (px >= 0 && px <= width && py >= 0 && py <= height) {
                const size = (1 - star.z / width) * star.size;
                const alpha = (1 - star.z / width) * 0.8;
                
                ctx.beginPath();
                ctx.fillStyle = `rgba(0, 102, 255, ${alpha})`; // Motia Blue
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Star trail effect
                if (star.z < width * 0.3) {
                   ctx.beginPath();
                   ctx.strokeStyle = `rgba(0, 102, 255, ${alpha * 0.5})`;
                   ctx.lineWidth = size * 0.5;
                   ctx.moveTo(px, py);
                   ctx.lineTo(px - (px - width/2) * 0.05, py - (py - height/2) * 0.05);
                   ctx.stroke();
                }
            }
        });

        animationFrameId = requestAnimationFrame(update);
    };

    const handleMouseMove = (e: MouseEvent) => {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    
    resize();
    update();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-[-1] pointer-events-none"
    />
  );
};

