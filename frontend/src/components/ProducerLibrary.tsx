import { useState } from 'react';
import { useGetMyBeats, useUploadBeat, useEditBeat, useDeleteBeat, useShareBeat, useUnshareBeat } from '../hooks/useQueries';
import { Beat } from '../backend';
import { ExternalBlob } from '../backend';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Plus, Upload, Edit, Trash2, Share2, EyeOff, Loader2, Music } from 'lucide-react';
import UploadBeatDialog from './UploadBeatDialog';
import EditBeatDialog from './EditBeatDialog';
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
import { Badge } from './ui/badge';

export default function ProducerLibrary() {
  const { data: beats, isLoading } = useGetMyBeats();
  const [showUpload, setShowUpload] = useState(false);
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [deletingBeat, setDeletingBeat] = useState<Beat | null>(null);

  const shareBeat = useShareBeat();
  const unshareBeat = useUnshareBeat();
  const deleteBeat = useDeleteBeat();

  const handleShare = async (beatId: string) => {
    try {
      await shareBeat.mutateAsync(beatId);
      toast.success('Beat shared to home feed!');
    } catch (error) {
      toast.error('Failed to share beat');
    }
  };

  const handleUnshare = async (beatId: string) => {
    try {
      await unshareBeat.mutateAsync(beatId);
      toast.success('Beat removed from home feed');
    } catch (error) {
      toast.error('Failed to unshare beat');
    }
  };

  const handleDelete = async () => {
    if (!deletingBeat) return;

    try {
      await deleteBeat.mutateAsync(deletingBeat.id);
      toast.success('Beat deleted successfully');
      setDeletingBeat(null);
    } catch (error) {
      toast.error('Failed to delete beat');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">My Beats</h2>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Beat
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading beats...</p>
        </div>
      ) : beats && beats.length > 0 ? (
        <div className="space-y-3">
          {beats.map((beat) => (
            <Card key={beat.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold truncate">{beat.title}</h3>
                      {beat.isShared && (
                        <Badge variant="secondary" className="text-xs">
                          Shared
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{beat.description}</p>
                  </div>

                  <div className="flex items-center space-x-1 ml-2">
                    {beat.isShared ? (
                      <Button
                        onClick={() => handleUnshare(beat.id)}
                        size="sm"
                        variant="ghost"
                        disabled={unshareBeat.isPending}
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleShare(beat.id)}
                        size="sm"
                        variant="ghost"
                        disabled={shareBeat.isPending}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => setEditingBeat(beat)}
                      size="sm"
                      variant="ghost"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setDeletingBeat(beat)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Music className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No beats yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Upload your first beat to get started!
          </p>
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Beat
          </Button>
        </div>
      )}

      {showUpload && (
        <UploadBeatDialog isOpen={showUpload} onClose={() => setShowUpload(false)} />
      )}

      {editingBeat && (
        <EditBeatDialog
          beat={editingBeat}
          isOpen={!!editingBeat}
          onClose={() => setEditingBeat(null)}
        />
      )}

      <AlertDialog open={!!deletingBeat} onOpenChange={() => setDeletingBeat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Beat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBeat?.title}"? This action cannot be undone.
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
