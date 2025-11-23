import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AppRole } from '../backend';
import { Music, Mic } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetupPage() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppRole | null>(null);
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim(), role });
      toast.success('Profile created successfully!');
    } catch (error) {
      toast.error('Failed to create profile');
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gradient-dimi p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/assets/8D5E7AA9-3623-4D63-8316-8056A47D05A9.png" 
              alt="dimi logo" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to dimi</h1>
          <p className="text-white/90">Let's set up your profile</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white font-medium">
              Your Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-white font-medium">Choose Your Role</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole(AppRole.Producer)}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                  role === AppRole.Producer
                    ? 'bg-white/30 border-white shadow-lg'
                    : 'bg-white/10 border-white/30 hover:bg-white/20'
                }`}
              >
                <Music className="w-8 h-8 text-white mb-2" />
                <span className="text-white font-semibold">Producer</span>
                <span className="text-white/70 text-xs mt-1">Upload beats</span>
              </button>

              <button
                type="button"
                onClick={() => setRole(AppRole.Artist)}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                  role === AppRole.Artist
                    ? 'bg-white/30 border-white shadow-lg'
                    : 'bg-white/10 border-white/30 hover:bg-white/20'
                }`}
              >
                <Mic className="w-8 h-8 text-white mb-2" />
                <span className="text-white font-semibold">Artist</span>
                <span className="text-white/70 text-xs mt-1">Record vocals</span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={saveProfile.isPending || !name.trim() || !role}
            className="w-full bg-white text-dimi-blue hover:bg-white/90 font-semibold h-11"
          >
            {saveProfile.isPending ? 'Creating Profile...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}

