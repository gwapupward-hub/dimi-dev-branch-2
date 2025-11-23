import { useState, useRef, useEffect } from 'react';
import { Beat } from '../backend';
import { ExternalBlob } from '../backend';
import { useSaveTrack } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mic, Square, Play, Pause, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RecordingDialogProps {
  beat: Beat;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecordingDialog({ beat, isOpen, onClose }: RecordingDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isPlayingBeat, setIsPlayingBeat] = useState(false);
  const [trackTitle, setTrackTitle] = useState('');
  const [beatAudioUrl, setBeatAudioUrl] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const beatAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);

  const saveTrack = useSaveTrack();

  useEffect(() => {
    const url = beat.file.getDirectURL();
    setBeatAudioUrl(url);
  }, [beat.file]);

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
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-play beat when recording starts
      if (beatAudioRef.current) {
        beatAudioRef.current.currentTime = 0;
        beatAudioRef.current.play();
        setIsPlayingBeat(true);
      }

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

      // Stop beat playback
      if (beatAudioRef.current) {
        beatAudioRef.current.pause();
        setIsPlayingBeat(false);
      }

      toast.success('Recording stopped!');
    }
  };

  const toggleBeatPlayback = () => {
    if (!beatAudioRef.current) return;

    if (isPlayingBeat) {
      beatAudioRef.current.pause();
    } else {
      beatAudioRef.current.play();
    }
    setIsPlayingBeat(!isPlayingBeat);
  };

  const toggleRecordingPlayback = () => {
    if (!recordingAudioRef.current || !recordedBlob) return;

    if (isPlayingRecording) {
      recordingAudioRef.current.pause();
    } else {
      recordingAudioRef.current.play();
    }
    setIsPlayingRecording(!isPlayingRecording);
  };

  const handleSave = async () => {
    if (!recordedBlob || !trackTitle.trim()) {
      toast.error('Please provide a title for your track');
      return;
    }

    try {
      const arrayBuffer = await recordedBlob.arrayBuffer();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Vocals</DialogTitle>
          <DialogDescription>Record your vocals over "{beat.title}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Beat Playback */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Beat: {beat.title}</span>
              <Button
                onClick={toggleBeatPlayback}
                size="sm"
                variant="outline"
                disabled={isRecording}
              >
                {isPlayingBeat ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
            <audio
              ref={beatAudioRef}
              src={beatAudioUrl}
              onEnded={() => setIsPlayingBeat(false)}
              className="hidden"
            />
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center">
            {!isRecording && !recordedBlob && (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="animate-pulse"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {/* Recorded Audio Playback */}
          {recordedBlob && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Your Recording</span>
                  <Button onClick={toggleRecordingPlayback} size="sm" variant="outline">
                    {isPlayingRecording ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <audio
                  ref={recordingAudioRef}
                  src={URL.createObjectURL(recordedBlob)}
                  onEnded={() => setIsPlayingRecording(false)}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackTitle">Track Title</Label>
                <Input
                  id="trackTitle"
                  placeholder="Enter track title"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={saveTrack.isPending || !trackTitle.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {saveTrack.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Track
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setRecordedBlob(null);
                    setTrackTitle('');
                  }}
                  variant="outline"
                >
                  Re-record
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
