import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  rootMargin?: string;
  threshold?: number;
}

/**
 * OptimizedImage - Lazy loading image component with blur-up effect
 * 
 * Features:
 * - IntersectionObserver-based lazy loading
 * - Blur placeholder while loading
 * - Smooth fade-in transition
 * - Only loads when near viewport
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  rootMargin = '200px', // Start loading 200px before visible
  threshold = 0.01
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${placeholderClassName}`}>
      {/* Skeleton/placeholder */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-cyber-800 to-cyber-900 transition-opacity duration-500 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-700/30 to-transparent animate-[shimmer_2s_infinite]" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.2) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
      </div>

      {/* Actual image - only load when in view */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-cyber-900/80">
          <span className="text-cyber-500 text-xs font-mono">IMG ERROR</span>
        </div>
      )}
    </div>
  );
};

/**
 * ImagePreloader - Preloads critical images in the background
 * Usage: <ImagePreloader srcs={['/img1.png', '/img2.png']} />
 */
export const ImagePreloader: React.FC<{ srcs: string[] }> = ({ srcs }) => {
  useEffect(() => {
    // Use requestIdleCallback to preload during idle time
    const preload = () => {
      srcs.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload, { timeout: 5000 });
    } else {
      // Fallback for Safari
      setTimeout(preload, 2000);
    }
  }, [srcs]);

  return null;
};
