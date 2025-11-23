import { useState, useRef, useEffect } from 'react';
import { Beat, UserProfile, AppRole } from '../backend';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Play, Pause, Mic } from 'lucide-react';
import RecordingDialog from './RecordingDialog';

interface BeatCardProps {
  beat: Beat;
  userProfile: UserProfile;
}

export default function BeatCard({ beat, userProfile }: BeatCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');

  useEffect(() => {
    const url = beat.file.getDirectURL();
    setAudioUrl(url);
  }, [beat.file]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {/* Play Button */}
            <button
              onClick={togglePlay}
              className="flex-shrink-0 w-14 h-14 rounded-full gradient-dimi flex items-center justify-center hover:scale-105 transition-transform shadow-glow-blue"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white fill-white" />
              ) : (
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              )}
            </button>

            {/* Beat Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{beat.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{beat.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Producer: {beat.producer.toString().slice(0, 8)}...
              </p>
            </div>

            {/* Record Button (Artists only) */}
            {userProfile.role === AppRole.Artist && (
              <Button
                onClick={() => setShowRecording(true)}
                size="sm"
                className="flex-shrink-0 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                <Mic className="w-4 h-4 mr-1" />
                Record
              </Button>
            )}
          </div>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
            className="hidden"
          />
        </CardContent>
      </Card>

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

