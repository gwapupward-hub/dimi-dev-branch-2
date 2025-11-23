import { useState } from 'react';
import { UserProfile, Beat, CollabRoom } from '../backend';
import { 
  useGetActiveCollabRooms, 
  useGetMyCollabRooms, 
  useCreateCollabRoom, 
  useJoinCollabRoom,
  useGetSharedBeats
} from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  X, 
  Plus, 
  Users, 
  Music, 
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface CollabRoomsListPageProps {
  userProfile: UserProfile;
  onOpenRoom: (room: CollabRoom, beat: Beat) => void;
  onClose: () => void;
}

export default function CollabRoomsListPage({ userProfile, onOpenRoom, onClose }: CollabRoomsListPageProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedBeatId, setSelectedBeatId] = useState<string>('');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');

  const { data: activeRooms, isLoading: loadingActive } = useGetActiveCollabRooms();
  const { data: myRooms, isLoading: loadingMy } = useGetMyCollabRooms();
  const { data: sharedBeats } = useGetSharedBeats();
  const createRoomMutation = useCreateCollabRoom();
  const joinRoomMutation = useJoinCollabRoom();

  const handleCreateRoom = async () => {
    if (!selectedBeatId) {
      toast.error('Please select a beat');
      return;
    }

    try {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await createRoomMutation.mutateAsync({ id: roomId, beatId: selectedBeatId });
      
      const beat = sharedBeats?.find(b => b.id === selectedBeatId);
      const room = myRooms?.find(r => r.id === roomId);
      
      if (beat && room) {
        toast.success('Collab room created!');
        setCreateDialogOpen(false);
        onOpenRoom(room, beat);
      }
    } catch (error) {
      toast.error('Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!roomIdToJoin.trim()) {
      toast.error('Please enter a room ID');
      return;
    }

    try {
      await joinRoomMutation.mutateAsync(roomIdToJoin.trim());
      
      const room = activeRooms?.find(r => r.id === roomIdToJoin.trim());
      const beat = sharedBeats?.find(b => b.id === room?.beatId);
      
      if (beat && room) {
        toast.success('Joined collab room!');
        setJoinDialogOpen(false);
        onOpenRoom(room, beat);
      }
    } catch (error) {
      toast.error('Failed to join room');
    }
  };

  const handleOpenRoom = (room: CollabRoom) => {
    const beat = sharedBeats?.find(b => b.id === room.beatId);
    if (beat) {
      onOpenRoom(room, beat);
    } else {
      toast.error('Beat not found');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="gradient-dimi text-white p-3 sm:p-4 shadow-lg flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <img 
                src="/assets/generated/collab-room-icon-transparent.dim_48x48.png" 
                alt="Collab Rooms" 
                className="h-8 sm:h-10 w-auto"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Collab Rooms</h1>
                <p className="text-white/90 text-xs sm:text-sm">Create or join collaborative sessions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-dimi hover:opacity-90 shadow-glow-blue h-auto py-4">
                  <div className="flex flex-col items-center gap-2">
                    <img 
                      src="/assets/generated/create-room-icon-transparent.dim_40x40.png" 
                      alt="Create" 
                      className="w-8 h-8"
                    />
                    <span className="text-sm font-medium">Create Room</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collab Room</DialogTitle>
                  <DialogDescription>
                    Choose a beat to collaborate on with other users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="beat-select">Select Beat</Label>
                    <Select value={selectedBeatId} onValueChange={setSelectedBeatId}>
                      <SelectTrigger id="beat-select">
                        <SelectValue placeholder="Choose a beat..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sharedBeats && sharedBeats.length > 0 ? (
                          sharedBeats.map((beat) => (
                            <SelectItem key={beat.id} value={beat.id}>
                              {beat.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No beats available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={!selectedBeatId || createRoomMutation.isPending}
                    className="w-full gradient-dimi hover:opacity-90"
                  >
                    {createRoomMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Room
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto py-4 border-2">
                  <div className="flex flex-col items-center gap-2">
                    <img 
                      src="/assets/generated/join-room-icon-transparent.dim_40x40.png" 
                      alt="Join" 
                      className="w-8 h-8"
                    />
                    <span className="text-sm font-medium">Join Room</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Collab Room</DialogTitle>
                  <DialogDescription>
                    Enter the room ID to join an existing collaboration
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-id">Room ID</Label>
                    <Input
                      id="room-id"
                      value={roomIdToJoin}
                      onChange={(e) => setRoomIdToJoin(e.target.value)}
                      placeholder="Enter room ID..."
                    />
                  </div>
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!roomIdToJoin.trim() || joinRoomMutation.isPending}
                    className="w-full gradient-dimi hover:opacity-90"
                  >
                    {joinRoomMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Room'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rooms List */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active Rooms</TabsTrigger>
              <TabsTrigger value="my">My Rooms</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              {loadingActive ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : activeRooms && activeRooms.length > 0 ? (
                <div className="space-y-3">
                  {activeRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      beat={sharedBeats?.find(b => b.id === room.beatId)}
                      onOpen={() => handleOpenRoom(room)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No active rooms</h3>
                  <p className="text-muted-foreground text-sm">
                    Create a new room to start collaborating!
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="my" className="mt-4">
              {loadingMy ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : myRooms && myRooms.length > 0 ? (
                <div className="space-y-3">
                  {myRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      beat={sharedBeats?.find(b => b.id === room.beatId)}
                      onOpen={() => handleOpenRoom(room)}
                      isOwner
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Create your first collab room to get started!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Room Card Component
function RoomCard({ 
  room, 
  beat, 
  onOpen, 
  isOwner = false 
}: { 
  room: CollabRoom; 
  beat?: Beat; 
  onOpen: () => void;
  isOwner?: boolean;
}) {
  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    toast.success('Room ID copied to clipboard!');
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onOpen}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate">
              {beat?.title || 'Unknown Beat'}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Room ID: {room.id.slice(0, 12)}...
            </p>
          </div>
          {isOwner && (
            <Badge variant="secondary" className="ml-2 flex-shrink-0">
              Owner
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{room.participants.length} active</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                copyRoomId();
              }}
              variant="outline"
              size="sm"
            >
              Copy ID
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              size="sm"
              className="gradient-dimi hover:opacity-90"
            >
              Join
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
