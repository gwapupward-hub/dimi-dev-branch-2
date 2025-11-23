import { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

export default function ProgressiveImage({ 
  src, 
  alt, 
  className = '', 
  placeholderClassName = '' 
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setCurrentSrc('');

    // Create a new image to preload
    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      // Small delay for smooth transition
      setTimeout(() => setIsLoaded(true), 50);
    };

    img.onerror = () => {
      // If image fails to load, still show something
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <>
      {/* Placeholder with blur effect */}
      {!isLoaded && (
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/60 animate-pulse ${placeholderClassName}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>
      )}
      
      {/* Actual image with fade-in */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />
      )}
    </>
  );
}
