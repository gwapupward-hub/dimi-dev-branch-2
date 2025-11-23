import { useState, useRef, useEffect } from 'react';
import { Beat } from '../backend';
import { ExternalBlob } from '../backend';
import { useSaveTrack } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Save, 
  X, 
  Volume2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Music2,
  Headphones,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface RecordingTake {
  id: string;
  blob: Blob;
  url: string;
  timestamp: number;
  duration: number;
}

interface FullScreenRecordingStudioProps {
  beat: Beat;
  onClose: () => void;
}

type RecordingScreen = 'main' | 'recording' | 'review' | 'save';

export default function FullScreenRecordingStudio({ beat, onClose }: FullScreenRecordingStudioProps) {
  const { theme } = useTheme();
  const [screen, setScreen] = useState<RecordingScreen>('main');
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [takes, setTakes] = useState<RecordingTake[]>([]);
  const [currentTakeIndex, setCurrentTakeIndex] = useState<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackDescription, setTrackDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [beatAudioUrl, setBeatAudioUrl] = useState<string>('');
  const [showHeadphoneOverlay, setShowHeadphoneOverlay] = useState(false);
  const [showClippingWarning, setShowClippingWarning] = useState(false);
  
  // Volume controls
  const [beatVolume, setBeatVolume] = useState(70);
  const [monitorVolume, setMonitorVolume] = useState(80);
  
  // Recording settings
  const [enableMetronome, setEnableMetronome] = useState(false);
  
  // Audio monitoring
  const [inputLevel, setInputLevel] = useState(0);
  const [isClipping, setIsClipping] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(Array(40).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const beatAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewBeatAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewVocalAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const countdownIntervalRef = useRef<number | undefined>(undefined);
  const recordingTimerRef = useRef<number | undefined>(undefined);

  const saveTrack = useSaveTrack();

  useEffect(() => {
    const url = beat.file.getDirectURL();
    setBeatAudioUrl(url);
  }, [beat.file]);

  // Check if this is the first recording (show headphone overlay)
  useEffect(() => {
    const hasSeenHeadphoneOverlay = localStorage.getItem('dimi-seen-headphone-overlay');
    if (!hasSeenHeadphoneOverlay) {
      setShowHeadphoneOverlay(true);
    }
  }, []);

  // Initialize audio context for monitoring
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
      latencyHint: 'interactive',
      sampleRate: 48000,
    });

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Real-time volume meter and waveform visualization
  const updateAudioVisualization = () => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);

    // Calculate RMS level for volume meter
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const level = Math.min(100, rms * 200);
    setInputLevel(level);

    // Detect clipping (>-1 dB threshold)
    const isClippingNow = level > 95;
    if (isClippingNow && !isClipping) {
      setIsClipping(true);
      setShowClippingWarning(true);
      
      // Haptic feedback on clipping
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Hide clipping warning after 300ms
      setTimeout(() => {
        setShowClippingWarning(false);
      }, 300);
    } else if (!isClippingNow && isClipping) {
      setIsClipping(false);
    }

    // Update waveform data (scrolling effect)
    setWaveformData(prev => {
      const newData = [...prev.slice(1), level];
      return newData;
    });

    animationFrameRef.current = requestAnimationFrame(updateAudioVisualization);
  };

  useEffect(() => {
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioVisualization);
    } else {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setInputLevel(0);
      setIsClipping(false);
    }

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current !== undefined) {
        clearInterval(recordingTimerRef.current);
      }
    }

    return () => {
      if (recordingTimerRef.current !== undefined) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Metronome click sound
  const playMetronomeClick = (isDownbeat: boolean = false) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = isDownbeat ? 1200 : 800;
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  };

  const startCountdown = async () => {
    setIsPreparing(true);
    const bpm = Number(beat.bpm) || 120;
    const beatDuration = 60 / bpm;
    const totalBeats = 4; // 1 bar = 4 beats

    let currentBeat = 0;
    setCountdown(totalBeats);

    countdownIntervalRef.current = window.setInterval(() => {
      currentBeat++;
      setCountdown(totalBeats - currentBeat);

      if (enableMetronome) {
        playMetronomeClick(currentBeat % 4 === 1);
      }

      if (currentBeat >= totalBeats) {
        if (countdownIntervalRef.current !== undefined) {
          clearInterval(countdownIntervalRef.current);
        }
        setIsPreparing(false);
        setCountdown(0);
        startActualRecording();
      }
    }, beatDuration * 1000);
  };

  const startActualRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: 48000,
        } 
      });

      micStreamRef.current = stream;

      // Setup audio monitoring with low latency
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.3;
        
        // Create monitoring path (headphone monitoring)
        const monitorGain = audioContextRef.current.createGain();
        monitorGain.gain.value = monitorVolume / 100;
        
        source.connect(analyserRef.current);
        source.connect(monitorGain);
        monitorGain.connect(audioContextRef.current.destination);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        addTake(blob);
        stream.getTracks().forEach((track) => track.stop());
        
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      setScreen('recording');

      // Start beat playback synchronized
      if (beatAudioRef.current) {
        beatAudioRef.current.currentTime = 0;
        beatAudioRef.current.volume = beatVolume / 100;
        beatAudioRef.current.play();
      }

      // Haptic feedback on recording start
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }

      toast.success('Recording started!');
    } catch (error) {
      toast.error('Failed to access microphone');
      console.error(error);
      setIsPreparing(false);
      setIsRecording(false);
      setScreen('main');
    }
  };

  const startRecording = async () => {
    if (enableMetronome) {
      await startCountdown();
    } else {
      await startActualRecording();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop beat playback
      if (beatAudioRef.current) {
        beatAudioRef.current.pause();
      }

      // Haptic feedback on recording stop
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }

      toast.success('Recording stopped!');
    }
  };

  const addTake = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const newTake: RecordingTake = {
      id: `take_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      blob,
      url,
      timestamp: Date.now(),
      duration: recordingTime,
    };

    setTakes(prev => [...prev, newTake]);
    setCurrentTakeIndex(takes.length);
    setScreen('review');
    toast.success(`Take ${takes.length + 1} saved!`);
  };

  const deleteTake = (takeId: string) => {
    setTakes(prev => {
      const take = prev.find(t => t.id === takeId);
      if (take) {
        URL.revokeObjectURL(take.url);
      }
      return prev.filter(t => t.id !== takeId);
    });
    
    if (currentTakeIndex !== null && currentTakeIndex >= takes.length - 1) {
      setCurrentTakeIndex(takes.length > 1 ? takes.length - 2 : null);
    }
    
    toast.success('Take deleted');
  };

  const playPreview = () => {
    if (currentTakeIndex === null || !takes[currentTakeIndex]) return;

    const currentTake = takes[currentTakeIndex];
    
    if (previewVocalAudioRef.current) {
      previewVocalAudioRef.current.src = currentTake.url;
      previewVocalAudioRef.current.volume = 1;
      previewVocalAudioRef.current.play();
      setIsPlayingPreview(true);
    }

    if (previewBeatAudioRef.current) {
      previewBeatAudioRef.current.currentTime = 0;
      previewBeatAudioRef.current.volume = beatVolume / 100;
      previewBeatAudioRef.current.play();
    }
  };

  const stopPreview = () => {
    if (previewVocalAudioRef.current) {
      previewVocalAudioRef.current.pause();
      previewVocalAudioRef.current.currentTime = 0;
    }
    if (previewBeatAudioRef.current) {
      previewBeatAudioRef.current.pause();
      previewBeatAudioRef.current.currentTime = 0;
    }
    setIsPlayingPreview(false);
  };

  const navigateTake = (direction: 'prev' | 'next') => {
    if (currentTakeIndex === null) return;

    if (direction === 'prev' && currentTakeIndex > 0) {
      setCurrentTakeIndex(currentTakeIndex - 1);
    } else if (direction === 'next' && currentTakeIndex < takes.length - 1) {
      setCurrentTakeIndex(currentTakeIndex + 1);
    }

    stopPreview();
  };

  const handleSaveClick = () => {
    setScreen('save');
  };

  const handleSave = async () => {
    if (currentTakeIndex === null || !takes[currentTakeIndex] || !trackTitle.trim()) {
      toast.error('Please provide a title for your track');
      return;
    }

    try {
      const currentTake = takes[currentTakeIndex];
      const arrayBuffer = await currentTake.blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const externalBlob = ExternalBlob.fromBytes(uint8Array);

      const trackId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await saveTrack.mutateAsync({
        id: trackId,
        title: trackTitle.trim(),
        beatId: beat.id,
        file: externalBlob,
      });

      toast.success('Track saved successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to save track');
      console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeColor = (level: number) => {
    if (level > 85) return 'bg-red-500';
    if (level > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const bgImage = theme === 'dark' 
    ? '/assets/generated/fullscreen-recording-bg-dark.dim_1920x1080.png'
    : '/assets/generated/fullscreen-recording-bg-light.dim_1920x1080.png';

  const isDoneDisabled = recordingTime < 5;

  return (
    <div 
      className="fixed inset-0 z-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Headphone Recommendation Overlay */}
        {showHeadphoneOverlay && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border-2 border-primary rounded-lg p-8 max-w-md text-center space-y-4">
              <div className="flex justify-center">
                <Headphones className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Use Headphones</h3>
              <p className="text-muted-foreground">
                For the best recording experience, we recommend using headphones to prevent audio feedback and monitor your vocals clearly.
              </p>
              <Button
                onClick={() => {
                  setShowHeadphoneOverlay(false);
                  localStorage.setItem('dimi-seen-headphone-overlay', 'true');
                }}
                className="w-full gradient-dimi text-white"
              >
                Got it!
              </Button>
            </div>
          </div>
        )}

        {/* Clipping Warning Overlay */}
        {showClippingWarning && (
          <div className="absolute inset-0 z-40 bg-red-500/30 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-pulse">
            <div className="text-center space-y-2">
              <AlertTriangle className="w-24 h-24 text-white mx-auto" />
              <p className="text-4xl font-bold text-white">TOO LOUD</p>
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {isPreparing && countdown > 0 && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div 
              className="w-48 h-48 rounded-full flex items-center justify-center text-8xl font-bold gradient-dimi text-white shadow-glow-blue animate-pulse"
            >
              {countdown}
            </div>
          </div>
        )}

        {/* Header / Status Bar */}
        <header className="gradient-dimi text-white p-4 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/8D5E7AA9-3623-4D63-8316-8056A47D05A9.png" 
                alt="dimi logo" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold">Recording Studio</h1>
                <p className="text-white/90 text-sm truncate max-w-xs">{beat.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {screen === 'recording' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-lg font-mono tabular-nums">{formatTime(recordingTime)}</span>
                  </div>
                  <div className="text-sm">
                    Take {takes.length + 1}
                  </div>
                </>
              )}
              {screen === 'main' && enableMetronome && (
                <div className="flex items-center gap-2">
                  <img 
                    src="/assets/generated/metronome-icon-transparent.dim_48x48.png" 
                    alt="Metronome" 
                    className="w-5 h-5"
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 space-y-6">
            {/* Main Recording Screen */}
            {screen === 'main' && (
              <>
                {/* Circular Volume Meter */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className={getVolumeColor(inputLevel)}
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - inputLevel / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Mic className="w-12 h-12 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Live Waveform Visualization */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <Label className="text-sm mb-3 block">Live Input</Label>
                  <div className="relative h-32 bg-muted rounded-lg overflow-hidden">
                    {/* Dimmed beat waveform reference */}
                    <div className="absolute inset-0 flex items-center gap-1 p-4 opacity-30">
                      {Array(40).fill(0).map((_, i) => (
                        <div
                          key={`beat-${i}`}
                          className="flex-1 bg-muted-foreground rounded-full"
                          style={{ height: `${30 + Math.sin(i * 0.5) * 20}%` }}
                        />
                      ))}
                    </div>
                    {/* Live vocal waveform */}
                    <div className="absolute inset-0 flex items-center gap-1 p-4">
                      {waveformData.map((value, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full bg-gradient-to-t from-primary to-secondary"
                          style={{
                            height: `${Math.max(4, value)}%`,
                            opacity: 0.8,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Volume Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="flex items-center gap-2">
                        <Music2 className="w-4 h-4" />
                        Beat Volume
                      </Label>
                      <span className="text-sm text-muted-foreground tabular-nums">{beatVolume}%</span>
                    </div>
                    <Slider
                      value={[beatVolume]}
                      onValueChange={(v) => setBeatVolume(v[0])}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Monitor Volume
                      </Label>
                      <span className="text-sm text-muted-foreground tabular-nums">{monitorVolume}%</span>
                    </div>
                    <Slider
                      value={[monitorVolume]}
                      onValueChange={(v) => setMonitorVolume(v[0])}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                {/* Metronome Toggle */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metronome" className="flex items-center gap-2">
                      <img 
                        src="/assets/generated/metronome-icon-transparent.dim_48x48.png" 
                        alt="Metronome" 
                        className="w-5 h-5"
                      />
                      Metronome (3-2-1 Countdown)
                    </Label>
                    <Switch
                      id="metronome"
                      checked={enableMetronome}
                      onCheckedChange={setEnableMetronome}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Recording In Progress Screen */}
            {screen === 'recording' && (
              <>
                {/* Pulsing REC Indicator */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-3 px-6 py-3 bg-red-500 rounded-full animate-pulse">
                    <div className="w-4 h-4 rounded-full bg-white" />
                    <span className="text-white font-bold text-xl">REC</span>
                  </div>
                </div>

                {/* Live Waveform with Amplitude */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center gap-1 p-4">
                      {waveformData.map((value, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full bg-gradient-to-t from-red-500 via-orange-500 to-yellow-500"
                          style={{
                            height: `${Math.max(8, value)}%`,
                            opacity: 0.9,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Circular Volume Meter */}
                <div className="flex justify-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className={getVolumeColor(inputLevel)}
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - inputLevel / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold tabular-nums">{Math.round(inputLevel)}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Post-Recording Review Carousel */}
            {screen === 'review' && (
              <>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold mb-4 text-lg">Review Your Takes</h3>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => navigateTake('prev')}
                      disabled={currentTakeIndex === null || currentTakeIndex === 0}
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex-1 bg-muted rounded-lg p-8 text-center space-y-4">
                      {currentTakeIndex !== null && takes[currentTakeIndex] && (
                        <>
                          <div className="space-y-2">
                            <p className="text-2xl font-bold">
                              Take {currentTakeIndex + 1} of {takes.length}
                            </p>
                            <p className="text-muted-foreground">
                              Duration: {formatTime(takes[currentTakeIndex].duration)}
                            </p>
                          </div>

                          {/* Waveform Thumbnail */}
                          <div className="h-20 bg-background rounded-lg flex items-end justify-center gap-1 p-2">
                            {Array(30).fill(0).map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-primary to-secondary rounded-full"
                                style={{ height: `${30 + Math.random() * 60}%` }}
                              />
                            ))}
                          </div>

                          <div className="flex justify-center gap-3">
                            <Button
                              onClick={isPlayingPreview ? stopPreview : playPreview}
                              size="lg"
                              className="gradient-dimi text-white"
                            >
                              {isPlayingPreview ? (
                                <>
                                  <Pause className="w-5 h-5 mr-2" />
                                  Stop
                                </>
                              ) : (
                                <>
                                  <Play className="w-5 h-5 mr-2" />
                                  Play Preview
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => deleteTake(takes[currentTakeIndex].id)}
                              variant="destructive"
                              size="lg"
                            >
                              <Trash2 className="w-5 h-5 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      onClick={() => navigateTake('next')}
                      disabled={currentTakeIndex === null || currentTakeIndex === takes.length - 1}
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Save Track Modal */}
            {screen === 'save' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <h3 className="text-2xl font-bold">Save Your Track</h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="trackTitle">Track Title *</Label>
                      <Input
                        id="trackTitle"
                        placeholder="Enter track title"
                        value={trackTitle}
                        onChange={(e) => setTrackTitle(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="trackDescription">Description (Optional)</Label>
                      <Textarea
                        id="trackDescription"
                        placeholder="Add a description..."
                        value={trackDescription}
                        onChange={(e) => setTrackDescription(e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Privacy</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {isPrivate ? 'Only you can see this track' : 'Send to producer for collaboration'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm ${isPrivate ? 'font-semibold' : 'text-muted-foreground'}`}>
                            Private
                          </span>
                          <Switch
                            checked={!isPrivate}
                            onCheckedChange={(checked) => setIsPrivate(!checked)}
                          />
                          <span className={`text-sm ${!isPrivate ? 'font-semibold' : 'text-muted-foreground'}`}>
                            Send to Producer
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setScreen('review')}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saveTrack.isPending || !trackTitle.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      {saveTrack.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save Track
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Controls */}
        <div className="flex-shrink-0 bg-card border-t border-border p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-center gap-3">
            {screen === 'main' && (
              <>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8"
                  disabled={isPreparing}
                >
                  {isPreparing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Record
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="px-8"
                  disabled
                >
                  Done
                </Button>
              </>
            )}

            {screen === 'recording' && (
              <Button
                onClick={stopRecording}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white px-12 h-16 text-lg"
              >
                <Square className="w-6 h-6 mr-2 fill-current" />
                STOP
              </Button>
            )}

            {screen === 'review' && (
              <>
                <Button
                  onClick={() => setScreen('main')}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  Record Again
                </Button>
                <Button
                  onClick={handleSaveClick}
                  size="lg"
                  className="gradient-dimi text-white px-8"
                  disabled={currentTakeIndex === null || takes.length === 0}
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Track
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Hidden audio elements */}
        <audio ref={beatAudioRef} src={beatAudioUrl} className="hidden" loop />
        <audio ref={previewBeatAudioRef} src={beatAudioUrl} className="hidden" />
        <audio 
          ref={previewVocalAudioRef} 
          className="hidden"
          onEnded={() => {
            setIsPlayingPreview(false);
            if (previewBeatAudioRef.current) {
              previewBeatAudioRef.current.pause();
              previewBeatAudioRef.current.currentTime = 0;
            }
          }}
        />
      </div>
    </div>
  );
}
