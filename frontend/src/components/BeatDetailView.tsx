import { useState, useRef, useEffect } from 'react';
import { Beat } from '../backend';
import { Button } from './ui/button';
import { Play, Pause, X, Mic } from 'lucide-react';
import { Slider } from './ui/slider';
import { useTheme } from 'next-themes';

interface BeatDetailViewProps {
  beat: Beat;
  onClose: () => void;
  onRecordVocals: () => void;
  creatorName?: string;
}

export default function BeatDetailView({ beat, onClose, onRecordVocals, creatorName }: BeatDetailViewProps) {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [beatVolume, setBeatVolume] = useState(70);
  const [beatAudioUrl, setBeatAudioUrl] = useState<string>('');
  const [waveformData, setWaveformData] = useState<number[]>(Array(60).fill(0));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const url = beat.file.getDirectURL();
    setBeatAudioUrl(url);
  }, [beat.file]);

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
  }, [beatAudioUrl]);

  // Initialize audio context for waveform visualization
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Pulse-synced waveform animation
  const updateWaveformVisualization = () => {
    if (!analyserRef.current || !isPlaying) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Sample data for waveform bars
    const bars = 60;
    const step = Math.floor(dataArray.length / bars);
    const newWaveform: number[] = [];
    
    for (let i = 0; i < bars; i++) {
      const value = dataArray[i * step] || 0;
      newWaveform.push((value / 255) * 100);
    }

    setWaveformData(newWaveform);
    animationFrameRef.current = requestAnimationFrame(updateWaveformVisualization);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current && audioContextRef.current) {
      if (!analyserRef.current) {
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }
      animationFrameRef.current = requestAnimationFrame(updateWaveformVisualization);
    } else {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setWaveformData(Array(60).fill(0));
    }

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = percent * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const bgImage = theme === 'dark' 
    ? '/assets/generated/beat-detail-bg-dark.dim_800x600.png'
    : '/assets/generated/beat-detail-bg-light.dim_800x600.png';

  return (
    <div 
      className="fixed inset-0 z-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <header className="gradient-dimi text-white p-4 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/8D5E7AA9-3623-4D63-8316-8056A47D05A9.png" 
                alt="dimi logo" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold">Beat Details</h1>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl space-y-6">
            {/* Beat Info */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-bold">{beat.title}</h2>
              <p className="text-lg text-muted-foreground">
                by {creatorName || 'Unknown Producer'}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <span className="text-sm font-medium">{Number(beat.bpm)} BPM</span>
              </div>
            </div>

            {/* Waveform Visualization */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="h-32 flex items-end justify-center gap-1">
                {waveformData.map((value, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-100 ${
                      isPlaying 
                        ? 'bg-gradient-to-t from-primary via-secondary to-accent' 
                        : 'bg-muted-foreground/30'
                    }`}
                    style={{
                      height: `${Math.max(8, value)}%`,
                      opacity: isPlaying ? 0.7 + (value / 100) * 0.3 : 0.5,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Seek Bar */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div 
                className="relative h-3 bg-muted rounded-full overflow-hidden cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  className="absolute top-0 left-0 h-full gradient-dimi transition-all duration-100"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex justify-center">
              <Button
                onClick={togglePlayback}
                size="lg"
                className="gradient-dimi text-white rounded-full w-20 h-20 shadow-glow-blue"
              >
                {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
              </Button>
            </div>

            {/* Volume Control */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Beat Volume</span>
                <span className="text-sm text-muted-foreground tabular-nums">{beatVolume}%</span>
              </div>
              <Slider
                value={[beatVolume]}
                onValueChange={(v) => {
                  setBeatVolume(v[0]);
                  if (audioRef.current) {
                    audioRef.current.volume = v[0] / 100;
                  }
                }}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Fixed Bottom Bar - Record Vocals Button */}
        <div className="flex-shrink-0 gradient-dimi p-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={onRecordVocals}
              size="lg"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/50 h-14 text-lg font-semibold shadow-lg backdrop-blur-sm"
            >
              <Mic className="w-6 h-6 mr-2" />
              Record Vocals
            </Button>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={beatAudioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="hidden"
        />
      </div>
    </div>
  );
}
