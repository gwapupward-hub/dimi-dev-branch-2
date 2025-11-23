import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Start fade-in animation immediately
    const fadeInTimer = setTimeout(() => {
      setFadeIn(true);
    }, 100);

    // Complete splash screen after 3 seconds (2s fade-in + 1s display)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center gradient-dimi-dark overflow-hidden">
      <div
        className={`transition-opacity duration-[2000ms] ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <img
          src="/assets/aHR0cHM6Ly9hc3NldHMuZ3Jvay5jb20vdXNlcnMvNzZjMGU0ZWYtMDRmNS00Zjc4LWJmMGEtNGVhZmUzMDUzNmVhL2dlbmVyYXRlZC8zY2I1NmZjNC00NmZmLTQ0ZDMtYmFlOC03NDY2MjE1NjA4ZjUvZ2VuZXJhdGVkX3ZpZGVvX2hkLm1wNA==.gif"
          alt="dimi animated logo"
          className="max-w-[80vw] max-h-[80vh] w-auto h-auto object-contain"
        />
      </div>
    </div>
  );
}

