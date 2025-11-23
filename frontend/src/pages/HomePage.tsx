import { UserProfile, AppRole } from '../backend';
import { useGetSharedBeats } from '../hooks/useQueries';
import BeatCard from '../components/BeatCard';
import { Music, Loader2 } from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';

interface HomePageProps {
  userProfile: UserProfile;
}

export default function HomePage({ userProfile }: HomePageProps) {
  const { data: sharedBeats, isLoading } = useGetSharedBeats();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="gradient-dimi text-white p-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/8D5E7AA9-3623-4D63-8316-8056A47D05A9.png" 
                alt="dimi logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold">Discover Beats</h1>
                <p className="text-white/90 text-sm">
                  {userProfile.role === AppRole.Artist ? 'Find your next track' : 'Explore the community'}
                </p>
              </div>
            </div>
            <Music className="w-8 h-8" />
          </div>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-lg mx-auto p-4 pb-20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Loading beats...</p>
            </div>
          ) : sharedBeats && sharedBeats.length > 0 ? (
            <div className="space-y-4">
              {sharedBeats.map((beat) => (
                <BeatCard key={beat.id} beat={beat} userProfile={userProfile} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No beats yet</h3>
              <p className="text-muted-foreground text-sm">
                {userProfile.role === AppRole.Producer
                  ? 'Share your first beat to get started!'
                  : 'Check back soon for new beats from producers.'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

