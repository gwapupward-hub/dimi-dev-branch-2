import { useState, useEffect, useRef } from 'react';

interface ProgressiveVideoProps {
  src: string;
  className?: string;
  placeholderClassName?: string;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
}

export default function ProgressiveVideo({ 
  src, 
  className = '', 
  placeholderClassName = '',
  loop = true,
  muted = true,
  autoPlay = true,
  playsInline = true,
}: ProgressiveVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
    };

    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

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
      
      {/* Actual video with fade-in */}
      <video
        ref={videoRef}
        src={src}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loop={loop}
        muted={muted}
        autoPlay={autoPlay}
        playsInline={playsInline}
        preload="metadata"
      />
    </>
  );
}
