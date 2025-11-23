import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { useState } from 'react';
import { Home, User } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

type Page = 'home' | 'profile';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const isAuthenticated = !!identity;

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show profile setup if authenticated but no profile
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
  if (showProfileSetup) {
    return <ProfileSetupPage />;
  }

  // Show loading while checking profile
  if (profileLoading || !isFetched) {
    return (
      <div className="flex h-screen items-center justify-center gradient-dimi">
        <div className="text-center">
          <div className="mb-4">
            <img 
              src="/assets/8D5E7AA9-3623-4D63-8316-8056A47D05A9.png" 
              alt="dimi logo" 
              className="h-16 w-auto mx-auto animate-pulse-glow"
            />
          </div>
          <p className="text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-hidden">
        {currentPage === 'home' && <HomePage userProfile={userProfile!} />}
        {currentPage === 'profile' && <ProfilePage userProfile={userProfile!} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-border bg-card">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          <button
            onClick={() => setCurrentPage('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              currentPage === 'home' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setCurrentPage('profile')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              currentPage === 'profile' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <User className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      <Toaster />
    </div>
  );
}

