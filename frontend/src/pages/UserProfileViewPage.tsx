import { Beat, AppRole } from '../backend';
import { useGetUserProfile, useGetSharedBeats } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, Music, Loader2 } from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card, CardContent } from '../components/ui/card';
import type { Principal } from '@icp-sdk/core/principal';

interface UserProfileViewPageProps {
  userPrincipal: Principal;
  onBack: () => void;
}

export default function UserProfileViewPage({ userPrincipal, onBack }: UserProfileViewPageProps) {
  const { data: userProfile, isLoading: profileLoading } = useGetUserProfile(userPrincipal);
  const { data: allSharedBeats } = useGetSharedBeats();

  // Filter beats by this user
  const userBeats = allSharedBeats?.filter(
    (beat: Beat) => beat.producer.toString() === userPrincipal.toString()
  ) || [];

  if (profileLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="gradient-dimi text-white p-4 shadow-lg">
          <div className="max-w-lg mx-auto flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20 mr-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">User Profile</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2 mx-auto" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col h-full">
        <header className="gradient-dimi text-white p-4 shadow-lg">
          <div className="max-w-lg mx-auto flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20 mr-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">User Profile</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  const profilePictureUrl = userProfile.profilePicture
    ? userProfile.profilePicture.getDirectURL()
    : '/assets/generated/default-profile-picture.dim_200x200.png';

  const backgroundPhotoUrl = userProfile.backgroundPhoto
    ? userProfile.backgroundPhoto.getDirectURL()
    : '/assets/generated/default-background-banner.dim_800x400.png';

  const initials = userProfile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="gradient-dimi text-white p-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20 mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">User Profile</h1>
        </div>
      </header>

      {/* Background Banner with Profile Info */}
      <div className="relative">
        {/* Background Photo */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={backgroundPhotoUrl}
            alt="Profile background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        </div>

        {/* Profile Info Overlay */}
        <div className="relative px-4 pb-4 -mt-16">
          <div className="flex items-end space-x-4">
            {/* Profile Picture */}
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
              <AvatarImage src={profilePictureUrl} alt={userProfile.name} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-bold text-foreground">{userProfile.name}</h2>
              <Badge variant="secondary" className="mt-1">
                {userProfile.role === AppRole.Producer ? 'Producer' : 'Artist'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-lg mx-auto p-4 pb-20">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Shared Beats
              <span className="text-sm text-muted-foreground font-normal">
                ({userBeats.length})
              </span>
            </h3>
          </div>

          {userBeats.length > 0 ? (
            <div className="space-y-3">
              {userBeats.map((beat: Beat) => (
                <Card key={beat.id} className="overflow-hidden border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg gradient-dimi flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{beat.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {beat.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-sm">
                No shared beats yet
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
