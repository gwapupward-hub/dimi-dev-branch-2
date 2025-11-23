import { useState, useRef, useEffect } from 'react';
import { Beat, UserProfile, AppRole } from '../backend';
import { Button } from './ui/button';
import { Play, Pause, X, ChevronLeft, ChevronRight, Mic, User } from 'lucide-react';
import RecordingDialog from './RecordingDialog';
import { useGetUserProfile } from '../hooks/useQueries';
import type { Principal } from '@icp-sdk/core/principal';
import { useTheme } from 'next-themes';
import ProgressiveImage from './ProgressiveImage';

interface IsolatedPlayerViewProps {
  beat: Beat;
  userProfile: UserProfile;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onOpenStudio?: (beat: Beat) => void;
  onViewUserProfile?: (principal: Principal) => void;
  currentIndex: number;
  totalBeats: number;
}

export default function IsolatedPlayerView({
  beat,
  userProfile,
  onClose,
  onNavigate,
  onOpenStudio,
  onViewUserProfile,
  currentIndex,
  totalBeats,
}: IsolatedPlayerViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showRecording, setShowRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const lastTapRef = useRef<number>(0);

  const { data: creatorProfile } = useGetUserProfile(beat.producer);
  const { resolvedTheme } = useTheme();

  // Determine current theme (dark or light)
  const currentTheme = resolvedTheme || 'dark';
  const isDarkMode = currentTheme === 'dark';

  useEffect(() => {
    const url = beat.file.getDirectURL();
    setAudioUrl(url);
  }, [beat.file]);

  // Reset playback when beat changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [beat.id]);

  useEffect(() => {
    if (audioRef.current) {
      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      };
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const updateTime = () => {
    if (audioRef.current && isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const seekToTime = (time: number) => {
    if (!audioRef.current || duration <= 0) return;

    const clampedTime = Math.max(0, Math.min(time, duration));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = percent * duration;
    seekToTime(newTime);
  };

  const handleRecordClick = () => {
    if (onOpenStudio) {
      onOpenStudio(beat);
    } else {
      setShowRecording(true);
    }
  };

  const handleViewProfile = () => {
    if (onViewUserProfile) {
      onViewUserProfile(beat.producer);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle back button with single/double tap
  const handleBackClick = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap - navigate to previous beat
      onNavigate('prev');
      lastTapRef.current = 0;
    } else {
      // Single tap - rewind to beginning
      seekToTime(0);
      lastTapRef.current = now;
    }
  };

  // Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Check if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - previous beat
        onNavigate('prev');
      } else {
        // Swipe left - next beat
        onNavigate('next');
      }
    }
  };

  const mediaUrl = beat.mediaAttachment?.getDirectURL();
  const hasMediaAttachment = !!beat.mediaAttachment;

  // Theme-aware background gradient for the page
  const pageBackgroundClass = isDarkMode
    ? 'bg-gradient-to-br from-slate-900 via-violet-950 to-blue-950'
    : 'bg-gradient-to-br from-blue-50 via-violet-50 to-slate-100';

  return (
    <>
      <div
        ref={containerRef}
        className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative transition-colors duration-500 ${pageBackgroundClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Beat Counter */}
        <div className="absolute top-4 left-4 text-white/80 text-sm z-10">
          {currentIndex + 1} / {totalBeats}
        </div>

        {/* Main Player Container */}
        <div className="w-full max-w-md flex flex-col items-center space-y-6 animate-in fade-in duration-300">
          {/* Cover Art with Progressive Loading or Default GIF */}
          <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl bg-black/30 backdrop-blur-sm relative">
            {hasMediaAttachment ? (
              <ProgressiveImage
                src={mediaUrl!}
                alt={beat.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="/assets/IMG_0623.gif"
                alt="Default beat animation"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>

          {/* Beat Info */}
          <div className="text-center space-y-2 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white truncate max-w-full">
              {beat.title}
            </h2>
            <p className="text-white/80 text-sm sm:text-base truncate">{beat.description}</p>
            <button
              onClick={handleViewProfile}
              className="flex items-center justify-center gap-2 text-white/90 hover:text-white transition-colors mx-auto"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">
                {creatorProfile ? creatorProfile.name : 'Loading...'}
              </span>
            </button>
          </div>

          {/* Waveform Timeline */}
          <div className="w-full space-y-2 px-4">
            <div
              className="relative h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer backdrop-blur-sm"
              onClick={handleTimelineClick}
            >
              <div
                className="absolute top-0 left-0 h-full bg-white transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-white/70 text-xs tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            {/* Previous Button (with single/double tap) */}
            <Button
              onClick={handleBackClick}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full transition-all hover:scale-105"
              title="Single tap: rewind | Double tap: previous"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-2xl"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 sm:w-10 sm:h-10 text-primary fill-primary" />
              ) : (
                <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary fill-primary ml-1" />
              )}
            </button>

            {/* Next Button */}
            <Button
              onClick={() => onNavigate('next')}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full transition-all hover:scale-105"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>

          {/* Record Button (Artists only) */}
          {userProfile.role === AppRole.Artist && (
            <Button
              onClick={handleRecordClick}
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30"
            >
              <Mic className="w-4 h-4 mr-2" />
              Record Vocals
            </Button>
          )}

          {/* Swipe Hint */}
          <p className="text-white/50 text-xs text-center">
            Swipe left or right to navigate • Tap back once to rewind, twice for previous
          </p>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          className="hidden"
          preload="metadata"
        />
      </div>

      {showRecording && (
        <RecordingDialog
          beat={beat}
          isOpen={showRecording}
          onClose={() => setShowRecording(false)}
        />
      )}
    </>
  );
}
