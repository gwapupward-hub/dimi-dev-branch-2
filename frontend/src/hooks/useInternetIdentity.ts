import { AuthClient } from '@dfinity/auth-client';
import { createContext, useContext, useEffect, useState } from 'react';

interface InternetIdentityContextType {
  authClient: AuthClient | null;
  isAuthenticated: boolean;
  principal: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const InternetIdentityContext = createContext<InternetIdentityContextType | null>(null);

export const useInternetIdentity = () => {
  const context = useContext(InternetIdentityContext);
  if (!context) {
    throw new Error('useInternetIdentity must be used within InternetIdentityProvider');
  }
  return context;
};

export const InternetIdentityProvider = ({ children }: { children: React.ReactNode }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      const authenticated = await client.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const identity = client.getIdentity();
        setPrincipal(identity.getPrincipal().toText());
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (!authClient) return;

    try {
      setLoading(true);
      await authClient.login({
        identityProvider: process.env.DFX_NETWORK === 'ic'
          ? 'https://identity.ic0.app'
          : `http://localhost:8000?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`,
        onSuccess: () => {
          const identity = authClient.getIdentity();
          setPrincipal(identity.getPrincipal().toText());
          setIsAuthenticated(true);
          setLoading(false);
        },
        onError: (error) => {
          console.error('Login failed:', error);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!authClient) return;

    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setPrincipal(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <InternetIdentityContext.Provider
      value={{
        authClient,
        isAuthenticated,
        principal,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </InternetIdentityContext.Provider>
  );
};
