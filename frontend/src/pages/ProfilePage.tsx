import { UserProfile, AppRole } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LogOut, Music, Mic } from 'lucide-react';
import ProducerLibrary from '../components/ProducerLibrary';
import ArtistLibrary from '../components/ArtistLibrary';
import { ScrollArea } from '../components/ui/scroll-area';

interface ProfilePageProps {
  userProfile: UserProfile;
}

export default function ProfilePage({ userProfile }: ProfilePageProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="gradient-dimi text-white p-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/assets/8D5E7AA9-3623-4D63-8316-8056A47D05A9.png" 
                alt="dimi logo" 
                className="h-8 w-auto"
              />
              <h1 className="text-2xl font-bold">Profile</h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {userProfile.role === AppRole.Producer ? (
                <Music className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{userProfile.name}</h2>
              <Badge variant="secondary" className="mt-1 bg-white/20 text-white border-white/30">
                {userProfile.role === AppRole.Producer ? 'Producer' : 'Artist'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-lg mx-auto p-4 pb-20">
          {userProfile.role === AppRole.Producer ? (
            <ProducerLibrary />
          ) : (
            <ArtistLibrary />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

