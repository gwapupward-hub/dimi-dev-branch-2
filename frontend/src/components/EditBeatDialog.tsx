import { useState } from 'react';
import { Beat } from '../backend';
import { useEditBeat } from '../hooks/useQueries';
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
import { Textarea } from './ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditBeatDialogProps {
  beat: Beat;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditBeatDialog({ beat, isOpen, onClose }: EditBeatDialogProps) {
  const [title, setTitle] = useState(beat.title);
  const [description, setDescription] = useState(beat.description);

  const editBeat = useEditBeat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await editBeat.mutateAsync({
        id: beat.id,
        title: title.trim(),
        description: description.trim(),
      });

      toast.success('Beat updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update beat');
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Beat</DialogTitle>
          <DialogDescription>Update your beat information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter beat title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your beat"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={editBeat.isPending || !title.trim() || !description.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {editBeat.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
