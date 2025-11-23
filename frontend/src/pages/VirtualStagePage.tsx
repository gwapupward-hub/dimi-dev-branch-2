import { useState, useEffect, useRef } from 'react';
import { Beat, Track } from '../backend';
import { Button } from '../components/ui/button';
import { X, Play, Pause, SkipBack, SkipForward, RotateCcw, Maximize2 } from 'lucide-react';
import { useTheme } from 'next-themes';

interface VirtualStagePageProps {
  item: Beat | Track;
  itemType: 'beat' | 'track';
  onClose: () => void;
}

export default function VirtualStagePage({ item, itemType, onClose }: VirtualStagePageProps) {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const audioUrl = 'file' in item ? item.file.getDirectURL() : '';
  const title = 'title' in item ? item.title : 'Untitled';

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    return () => {
      audio.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [audioUrl]);

  useEffect(() => {
    if (isPlaying) {
      drawVisualizer();
    }
  }, [isPlaying]);

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      const isDark = theme === 'dark';
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      
      if (isDark) {
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.9)');
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.7)');
      } else {
        gradient.addColorStop(0, 'rgba(147, 51, 234, 0.9)');
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)');
        gradient.addColorStop(1, 'rgba(219, 39, 119, 0.7)');
      }

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.8;

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        const glowIntensity = dataArray[i] / 255;
        ctx.shadowBlur = 20 * glowIntensity;
        ctx.shadowColor = isDark ? 'rgba(168, 85, 247, 0.8)' : 'rgba(147, 51, 234, 0.8)';

        x += barWidth + 1;
      }

      const avgAmplitude = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const pulseScale = 1 + (avgAmplitude / 255) * 0.3;
      
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(pulseScale, pulseScale);
      ctx.translate(-width / 2, -height / 2);
      ctx.restore();
    };

    draw();
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      audio.play();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const backgroundImage = theme === 'dark' 
    ? '/assets/generated/virtual-stage-bg-dark.dim_1920x1080.png'
    : '/assets/generated/virtual-stage-bg-light.dim_1920x1080.png';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cover bg-center transition-all duration-500"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      <Button
        onClick={onClose}
        size="icon"
        variant="ghost"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </Button>

      <Button
        onClick={toggleFullscreen}
        size="icon"
        variant="ghost"
        className="absolute top-4 left-4 z-10 text-white hover:bg-white/20 transition-colors"
      >
        <Maximize2 className="w-6 h-6" />
      </Button>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-4 space-y-8">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl tracking-tight">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-white/80 drop-shadow-lg">
            {itemType === 'beat' ? 'Beat' : 'Track'} • Virtual Stage
          </p>
        </div>

        <div className="w-full max-w-2xl aspect-video relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm bg-black/30">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-full"
          />
          
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>

        <div className="w-full max-w-2xl space-y-4">
          <div className="relative h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 transition-all duration-100 shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-white/80 font-medium tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={restart}
              size="icon"
              variant="ghost"
              className="w-12 h-12 rounded-full text-white hover:bg-white/20 transition-all hover:scale-110"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl transition-all hover:scale-110 animate-pulse-glow"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white fill-white" />
              ) : (
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white/60 text-sm">
        <p>Virtual Stage Mode • Immersive Audio Experience</p>
      </div>
    </div>
  );
}
