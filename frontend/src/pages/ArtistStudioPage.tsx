import { useState, useRef, useEffect } from 'react';
import { Beat } from '../backend';
import { ExternalBlob } from '../backend';
import { useSaveTrack } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { Slider } from '../components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import {
  Play,
  Pause,
  Square,
  Mic,
  Volume2,
  VolumeX,
  Trash2,
  Save,
  X,
  Loader2,
  Music,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';

interface AudioTrack {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  audioElement: HTMLAudioElement;
  order: number;
}

interface ArtistStudioPageProps {
  beat: Beat;
  onClose: () => void;
}

export default function ArtistStudioPage({ beat, onClose }: ArtistStudioPageProps) {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackTitle, setTrackTitle] = useState('');
  const [beatAudioUrl, setBeatAudioUrl] = useState<string>('');
  const [draggedTrack, setDraggedTrack] = useState<string | null>(null);
  const [dragOverTrack, setDragOverTrack] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const beatAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const saveTrack = useSaveTrack();

  // Load beat audio
  useEffect(() => {
    const url = beat.file.getDirectURL();
    setBeatAudioUrl(url);
  }, [beat.file]);

  // Update duration when beat loads
  useEffect(() => {
    if (beatAudioRef.current) {
      const handleLoadedMetadata = () => {
        if (beatAudioRef.current) {
          setDuration(beatAudioRef.current.duration);
        }
      };
      beatAudioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        beatAudioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [beatAudioUrl]);

  // Frame-perfect playback time sync using requestAnimationFrame
  const updatePlaybackTime = () => {
    if (beatAudioRef.current && isPlaying) {
      setCurrentTime(beatAudioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
    } else {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        addVocalTrack(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-play beat when recording starts
      if (beatAudioRef.current) {
        beatAudioRef.current.currentTime = 0;
        beatAudioRef.current.play();
        setIsPlaying(true);
      }

      // Sync all tracks
      tracks.forEach((track) => {
        if (!track.isMuted) {
          track.audioElement.currentTime = 0;
          track.audioElement.play();
        }
      });

      toast.success('Recording started!');
    } catch (error) {
      toast.error('Failed to access microphone');
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all playback
      if (beatAudioRef.current) {
        beatAudioRef.current.pause();
      }
      tracks.forEach((track) => {
        track.audioElement.pause();
      });
      setIsPlaying(false);

      toast.success('Recording stopped!');
    }
  };

  const addVocalTrack = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    const newTrack: AudioTrack = {
      id: `vocal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Vocal ${tracks.length + 1}`,
      blob,
      url,
      volume: 100,
      isMuted: false,
      isSolo: false,
      audioElement: audio,
      order: tracks.length,
    };

    audio.volume = 1;
    setTracks((prev) => [...prev, newTrack]);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      // Pause all
      if (beatAudioRef.current) {
        beatAudioRef.current.pause();
      }
      tracks.forEach((track) => {
        track.audioElement.pause();
      });
      setIsPlaying(false);
    } else {
      // Play all
      if (beatAudioRef.current) {
        beatAudioRef.current.play();
      }
      
      const hasSolo = tracks.some((t) => t.isSolo);
      tracks.forEach((track) => {
        if (hasSolo) {
          if (track.isSolo) {
            track.audioElement.currentTime = beatAudioRef.current?.currentTime || 0;
            track.audioElement.play();
          }
        } else if (!track.isMuted) {
          track.audioElement.currentTime = beatAudioRef.current?.currentTime || 0;
          track.audioElement.play();
        }
      });
      setIsPlaying(true);
    }
  };

  const handleTrackVolumeChange = (trackId: string, value: number[]) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          track.audioElement.volume = value[0] / 100;
          return { ...track, volume: value[0] };
        }
        return track;
      })
    );
  };

  const toggleMute = (trackId: string) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          const newMuted = !track.isMuted;
          if (isPlaying) {
            if (newMuted) {
              track.audioElement.pause();
            } else {
              track.audioElement.currentTime = beatAudioRef.current?.currentTime || 0;
              track.audioElement.play();
            }
          }
          return { ...track, isMuted: newMuted };
        }
        return track;
      })
    );
  };

  const toggleSolo = (trackId: string) => {
    setTracks((prev) => {
      const newTracks = prev.map((track) => {
        if (track.id === trackId) {
          return { ...track, isSolo: !track.isSolo };
        }
        return track;
      });

      // Update playback based on solo state
      if (isPlaying) {
        const hasSolo = newTracks.some((t) => t.isSolo);
        newTracks.forEach((track) => {
          if (hasSolo) {
            if (track.isSolo) {
              track.audioElement.currentTime = beatAudioRef.current?.currentTime || 0;
              track.audioElement.play();
            } else {
              track.audioElement.pause();
            }
          } else if (!track.isMuted) {
            track.audioElement.currentTime = beatAudioRef.current?.currentTime || 0;
            track.audioElement.play();
          }
        });
      }

      return newTracks;
    });
  };

  const deleteTrack = (trackId: string) => {
    setTracks((prev) => {
      const track = prev.find((t) => t.id === trackId);
      if (track) {
        track.audioElement.pause();
        URL.revokeObjectURL(track.url);
      }
      return prev.filter((t) => t.id !== trackId);
    });
    toast.success('Track deleted');
  };

  // Drag and drop handlers
  const handleDragStart = (trackId: string) => {
    setDraggedTrack(trackId);
  };

  const handleDragOver = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    setDragOverTrack(trackId);
  };

  const handleDragLeave = () => {
    setDragOverTrack(null);
  };

  const handleDrop = (e: React.DragEvent, targetTrackId: string) => {
    e.preventDefault();
    if (!draggedTrack || draggedTrack === targetTrackId) {
      setDraggedTrack(null);
      setDragOverTrack(null);
      return;
    }

    setTracks((prev) => {
      const draggedIndex = prev.findIndex((t) => t.id === draggedTrack);
      const targetIndex = prev.findIndex((t) => t.id === targetTrackId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newTracks = [...prev];
      const [removed] = newTracks.splice(draggedIndex, 1);
      newTracks.splice(targetIndex, 0, removed);

      // Update order
      return newTracks.map((track, index) => ({ ...track, order: index }));
    });

    setDraggedTrack(null);
    setDragOverTrack(null);
  };

  const handleSaveFinalMix = async () => {
    if (!trackTitle.trim()) {
      toast.error('Please provide a title for your track');
      return;
    }

    if (tracks.length === 0) {
      toast.error('Please record at least one vocal track');
      return;
    }

    try {
      // For now, save the first vocal track as the final mix
      // In a real implementation, you would mix all tracks together
      const firstTrack = tracks[0];
      const arrayBuffer = await firstTrack.blob.arrayBuffer();
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
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <header className="gradient-dimi text-white p-3 sm:p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <img 
                src="/assets/8D5E7AA9-3623-4D63-8316-8056A47D05A9.png" 
                alt="dimi logo" 
                className="h-6 sm:h-8 w-auto flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold">Studio</h1>
                <p className="text-white/90 text-xs sm:text-sm truncate">{beat.title}</p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 transition-all duration-200 active:scale-95 flex-shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close Studio</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main Studio Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline with frame-perfect playhead */}
          <div className="border-b border-border bg-card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
              <span className="font-medium tabular-nums">{formatTime(currentTime)}</span>
              <span className="text-muted-foreground tabular-nums">{formatTime(duration)}</span>
            </div>
            <div className="relative h-3 sm:h-2 bg-muted rounded-full overflow-hidden shadow-inner">
              {/* Animated playhead with smooth transition */}
              <div
                className="absolute top-0 left-0 h-full gradient-dimi transition-none"
                style={{ 
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  willChange: 'width'
                }}
              />
              {/* Pulsing glow effect when playing */}
              {isPlaying && (
                <div
                  className="absolute top-0 left-0 h-full gradient-dimi opacity-50 animate-pulse"
                  style={{ 
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                    filter: 'blur(4px)'
                  }}
                />
              )}
            </div>
          </div>

          {/* Tracks */}
          <ScrollArea className="flex-1">
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              {/* Base Beat Track with waveform visual */}
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className={`p-2 rounded-full bg-primary/10 ${isPlaying ? 'animate-pulse-glow' : ''}`}>
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">{beat.title}</p>
                    <p className="text-xs text-muted-foreground">Base Beat</p>
                  </div>
                  {/* Waveform visualization */}
                  <div className="hidden sm:flex items-center space-x-0.5 h-8">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          isPlaying ? 'bg-gradient-to-t from-dimi-blue to-dimi-violet' : 'bg-muted'
                        }`}
                        style={{
                          height: `${20 + Math.random() * 80}%`,
                          opacity: isPlaying ? 0.6 + Math.random() * 0.4 : 0.3,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <audio ref={beatAudioRef} src={beatAudioUrl} className="hidden" />
              </div>

              {/* Vocal Tracks with drag-and-drop */}
              {sortedTracks.map((track) => (
                <div
                  key={track.id}
                  draggable
                  onDragStart={() => handleDragStart(track.id)}
                  onDragOver={(e) => handleDragOver(e, track.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, track.id)}
                  className={`bg-card border rounded-lg p-3 sm:p-4 transition-all duration-200 cursor-move hover:shadow-lg ${
                    track.isSolo 
                      ? 'border-primary shadow-glow-blue ring-2 ring-primary/20' 
                      : dragOverTrack === track.id
                      ? 'border-secondary shadow-glow-violet scale-[1.02]'
                      : 'border-border hover:border-primary/50'
                  } ${draggedTrack === track.id ? 'opacity-50 scale-95' : ''}`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 touch-none" />
                    <div className={`p-2 rounded-full bg-secondary/10 ${isPlaying && !track.isMuted ? 'animate-pulse-glow' : ''}`}>
                      <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-secondary flex-shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm sm:text-base">{track.name}</p>
                      <p className="text-xs text-muted-foreground">Vocal Track</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => deleteTrack(track.id)}
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 active:scale-90"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Track</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Waveform visualization for vocal track */}
                  <div className="flex items-center space-x-0.5 h-12 sm:h-16 mb-3 px-2">
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-150 ${
                          isPlaying && !track.isMuted
                            ? 'bg-gradient-to-t from-secondary to-primary'
                            : track.isMuted
                            ? 'bg-muted/50'
                            : 'bg-muted'
                        }`}
                        style={{
                          height: `${30 + Math.random() * 70}%`,
                          opacity: isPlaying && !track.isMuted ? 0.7 + Math.random() * 0.3 : 0.4,
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => toggleMute(track.id)}
                            variant={track.isMuted ? 'secondary' : 'outline'}
                            size="sm"
                            className={`flex-shrink-0 transition-all duration-200 active:scale-90 ${
                              track.isMuted ? 'shadow-glow-violet' : ''
                            }`}
                          >
                            {track.isMuted ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{track.isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => toggleSolo(track.id)}
                            variant={track.isSolo ? 'default' : 'outline'}
                            size="sm"
                            className={`flex-shrink-0 transition-all duration-200 active:scale-90 ${
                              track.isSolo ? 'gradient-dimi text-white shadow-glow-blue' : ''
                            }`}
                          >
                            S
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Solo Track</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex-1 flex items-center space-x-2">
                      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1">
                            <Slider
                              value={[track.volume]}
                              onValueChange={(value) => handleTrackVolumeChange(track.id, value)}
                              max={100}
                              step={1}
                              className="flex-1 touch-pan-y"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Volume: {track.volume}%</TooltipContent>
                      </Tooltip>
                      <span className="text-xs text-muted-foreground w-10 text-right flex-shrink-0 tabular-nums">
                        {track.volume}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {tracks.length === 0 && (
                <div className="text-center py-12 sm:py-16 text-muted-foreground">
                  <div className="inline-block p-4 rounded-full bg-muted/50 mb-4">
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12 opacity-50" />
                  </div>
                  <p className="text-sm sm:text-base font-medium">No vocal tracks yet</p>
                  <p className="text-xs sm:text-sm mt-1">Start recording to create your first track!</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Controls */}
          <div className="border-t border-border bg-card p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center justify-center space-x-3 sm:space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={togglePlayback}
                    disabled={isRecording}
                    size="lg"
                    className="gradient-dimi text-white hover:opacity-90 transition-all duration-200 active:scale-95 shadow-glow-blue disabled:opacity-50 disabled:cursor-not-allowed h-12 w-12 sm:h-14 sm:w-14"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
              </Tooltip>

              {!isRecording ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl h-12 sm:h-14 px-4 sm:px-6"
                    >
                      <Mic className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">Record</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Start Recording</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                      className="animate-pulse shadow-lg h-12 sm:h-14 px-4 sm:px-6 transition-all duration-200 active:scale-95"
                    >
                      <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">Stop</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop Recording</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Save Section */}
            {tracks.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="finalTrackTitle" className="text-xs sm:text-sm">Final Track Title</Label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Input
                    id="finalTrackTitle"
                    placeholder="Enter track title"
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    className="flex-1 text-sm sm:text-base h-10 sm:h-11"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleSaveFinalMix}
                        disabled={saveTrack.isPending || !trackTitle.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed h-10 sm:h-11 w-full sm:w-auto"
                      >
                        {saveTrack.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span className="text-sm sm:text-base">Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            <span className="text-sm sm:text-base">Save Track</span>
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save your final mix</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
