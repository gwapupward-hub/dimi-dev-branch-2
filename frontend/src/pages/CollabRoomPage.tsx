import { useState, useEffect, useRef } from 'react';
import { Beat, UserProfile, CollabRoom, ChatMessage, CollaborativeTrack } from '../backend';
import { 
  useGetRoomSession, 
  useGetRoomMessages, 
  useGetRoomTracks, 
  useSendMessage, 
  useUpdateRoomSession,
  useLeaveCollabRoom,
  useGetUserProfile
} from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { 
  X, 
  Send, 
  Users, 
  Music, 
  MessageSquare, 
  Play, 
  Pause,
  Volume2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Principal } from '@icp-sdk/core/principal';

interface CollabRoomPageProps {
  room: CollabRoom;
  beat: Beat;
  userProfile: UserProfile;
  onClose: () => void;
}

export default function CollabRoomPage({ room, beat, userProfile, onClose }: CollabRoomPageProps) {
  const [message, setMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const { data: roomSession, refetch: refetchSession } = useGetRoomSession(room.id);
  const { data: messages, refetch: refetchMessages } = useGetRoomMessages(room.id);
  const { data: tracks, refetch: refetchTracks } = useGetRoomTracks(room.id);
  const sendMessageMutation = useSendMessage();
  const updateSessionMutation = useUpdateRoomSession();
  const leaveRoomMutation = useLeaveCollabRoom();

  // Periodic polling for real-time sync (every 2.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchSession();
      refetchMessages();
      refetchTracks();
    }, 2500);

    return () => clearInterval(interval);
  }, [refetchSession, refetchMessages, refetchTracks]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio playback management
  useEffect(() => {
    const url = beat.file.getDirectURL();
    if (audioRef.current) {
      audioRef.current.src = url;
    }
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
  }, []);

  const updateTime = () => {
    if (audioRef.current && isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
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

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
    }

    // Sync playback state with room
    try {
      await updateSessionMutation.mutateAsync({
        roomId: room.id,
        timelineState: JSON.stringify({
          isPlaying: !isPlaying,
          currentTime: audioRef.current.currentTime,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to sync playback state:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        roomId: room.id,
        message: message.trim(),
      });
      setMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoomMutation.mutateAsync(room.id);
      toast.success('Left collaboration room');
      onClose();
    } catch (error) {
      toast.error('Failed to leave room');
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="gradient-dimi text-white p-3 sm:p-4 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <img 
                src="/assets/generated/collab-room-icon-transparent.dim_48x48.png" 
                alt="Collab Room" 
                className="h-8 sm:h-10 w-auto flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold truncate">Collab Room</h1>
                <p className="text-white/90 text-xs sm:text-sm truncate">{beat.title}</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Timeline & Tracks Section */}
        <div className="flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-border">
          {/* Participants Bar */}
          <div className="p-3 sm:p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {room.participants.length} {room.participants.length === 1 ? 'Participant' : 'Participants'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {room.participants.slice(0, 5).map((participant, index) => (
                  <ParticipantAvatar key={index} principal={participant} />
                ))}
                {room.participants.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{room.participants.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="p-3 sm:p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                onClick={togglePlay}
                size="lg"
                className="gradient-dimi hover:opacity-90 shadow-glow-blue flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white fill-white" />
                ) : (
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                )}
              </Button>

              <div className="flex-1 space-y-1">
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full gradient-dimi transition-none"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <img 
                  src="/assets/generated/sync-indicator-icon-transparent.dim_24x24.png" 
                  alt="Synced" 
                  className="w-5 h-5 animate-pulse-glow"
                  title="Live sync active"
                />
              </div>
            </div>
          </div>

          {/* Tracks List */}
          <ScrollArea className="flex-1 p-3 sm:p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Collaborative Tracks ({tracks?.length || 0})
                </h3>
              </div>

              {tracks && tracks.length > 0 ? (
                tracks.map((track) => (
                  <TrackItem key={track.id} track={track} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tracks yet. Start recording!</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Leave Room Button */}
          <div className="p-3 sm:p-4 border-t border-border bg-card">
            <Button
              onClick={handleLeaveRoom}
              variant="outline"
              className="w-full"
              disabled={leaveRoomMutation.isPending}
            >
              {leaveRoomMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <img 
                    src="/assets/generated/leave-room-icon-transparent.dim_32x32.png" 
                    alt="Leave" 
                    className="w-4 h-4 mr-2"
                  />
                  Leave Room
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Chat Panel */}
        <div className={`${showChat ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-80 xl:w-96 border-border bg-card`}>
          <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </h3>
            <Button
              onClick={() => setShowChat(false)}
              variant="ghost"
              size="sm"
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-3 sm:p-4">
            <div className="space-y-3">
              {messages && messages.length > 0 ? (
                messages.map((msg, index) => (
                  <ChatMessageItem key={index} message={msg} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 sm:p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="gradient-dimi hover:opacity-90"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Mobile Chat Toggle */}
        {!showChat && (
          <Button
            onClick={() => setShowChat(true)}
            className="lg:hidden fixed bottom-20 right-4 rounded-full w-14 h-14 gradient-dimi shadow-glow-blue"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        )}
      </div>

      <audio ref={audioRef} className="hidden" preload="metadata" />
    </div>
  );
}

// Participant Avatar Component
function ParticipantAvatar({ principal }: { principal: Principal }) {
  const { data: profile } = useGetUserProfile(principal);

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const profilePictureUrl = profile?.profilePicture?.getDirectURL();

  return (
    <div className="relative">
      <Avatar className="w-8 h-8 border-2 border-background">
        {profilePictureUrl ? (
          <AvatarImage src={profilePictureUrl} alt={profile?.name || 'User'} />
        ) : null}
        <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
    </div>
  );
}

// Chat Message Component
function ChatMessageItem({ message }: { message: ChatMessage }) {
  const { data: senderProfile } = useGetUserProfile(message.sender);

  const timestamp = new Date(Number(message.timestamp / BigInt(1000000)));
  const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex gap-2">
      <Avatar className="w-8 h-8 flex-shrink-0">
        {senderProfile?.profilePicture ? (
          <AvatarImage src={senderProfile.profilePicture.getDirectURL()} />
        ) : null}
        <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
          {senderProfile?.name?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium truncate">{senderProfile?.name || 'User'}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{timeString}</span>
        </div>
        <p className="text-sm text-foreground break-words">{message.message}</p>
      </div>
    </div>
  );
}

// Track Item Component
function TrackItem({ track }: { track: CollaborativeTrack }) {
  const { data: participantProfile } = useGetUserProfile(track.participant);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 flex-shrink-0">
            {participantProfile?.profilePicture ? (
              <AvatarImage src={participantProfile.profilePicture.getDirectURL()} />
            ) : null}
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
              {participantProfile?.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {participantProfile?.name || 'User'}'s Track
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(Number(track.createdAt / BigInt(1000000))).toLocaleString()}
            </p>
          </div>
          <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
