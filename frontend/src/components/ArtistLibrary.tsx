import { useState, useRef } from 'react';
import { useGetMyTracks, useDeleteTrack } from '../hooks/useQueries';
import { Track } from '../backend';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Play, Pause, Trash2, Loader2, Music } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export default function ArtistLibrary() {
  const { data: tracks, isLoading } = useGetMyTracks();
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const deleteTrack = useDeleteTrack();

  const togglePlay = (trackId: string, trackUrl: string) => {
    if (playingTrackId === trackId) {
      audioRefs.current[trackId]?.pause();
      setPlayingTrackId(null);
    } else {
      // Pause any currently playing track
      if (playingTrackId) {
        audioRefs.current[playingTrackId]?.pause();
      }

      // Create or get audio element
      if (!audioRefs.current[trackId]) {
        const audio = new Audio(trackUrl);
        audio.onended = () => setPlayingTrackId(null);
        audioRefs.current[trackId] = audio;
      }

      audioRefs.current[trackId].play();
      setPlayingTrackId(trackId);
    }
  };

  const handleDelete = async () => {
    if (!deletingTrack) return;

    try {
      await deleteTrack.mutateAsync(deletingTrack.id);
      toast.success('Track deleted successfully');
      setDeletingTrack(null);

      // Clean up audio if it was playing
      if (playingTrackId === deletingTrack.id) {
        audioRefs.current[deletingTrack.id]?.pause();
        delete audioRefs.current[deletingTrack.id];
        setPlayingTrackId(null);
      }
    } catch (error) {
      toast.error('Failed to delete track');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">My Tracks</h2>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading tracks...</p>
        </div>
      ) : tracks && tracks.length > 0 ? (
        <div className="space-y-3">
          {tracks.map((track) => {
            const trackUrl = track.file.getDirectURL();
            const isPlaying = playingTrackId === track.id;

            return (
              <Card key={track.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => togglePlay(track.id, trackUrl)}
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{track.title}</h3>
                      <p className="text-sm text-muted-foreground">Beat ID: {track.beatId.slice(0, 12)}...</p>
                    </div>

                    <Button
                      onClick={() => setDeletingTrack(track)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Music className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tracks yet</h3>
          <p className="text-muted-foreground text-sm">
            Browse the home feed and record your first track!
          </p>
        </div>
      )}

      <AlertDialog open={!!deletingTrack} onOpenChange={() => setDeletingTrack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTrack?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
