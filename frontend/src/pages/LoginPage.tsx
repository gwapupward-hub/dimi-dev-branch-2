import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '../components/ui/button';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gradient-dimi p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/assets/8D5E7AA9-3623-4D63-8316-8056A47D05A9.png" 
              alt="dimi logo" 
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">dimi</h1>
          <p className="text-white/90 text-lg">Connect producers and artists</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <p className="text-white/90 mb-6">
            Sign in to start creating music, sharing beats, or recording vocals.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full bg-white text-dimi-blue hover:bg-white/90 font-semibold text-lg h-12"
          >
            {isLoggingIn ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>

        <p className="text-white/70 text-sm mt-8">
          Secure authentication powered by Internet Identity
        </p>
      </div>
    </div>
  );
}

