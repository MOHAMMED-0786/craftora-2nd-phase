import { useState, useEffect, useCallback } from 'react';
import { blink } from '@/lib/blink';
import { User } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  profile?: User;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      if (state.isLoading) {
        setIsLoading(true);
        return;
      }

      if (state.user && state.isAuthenticated) {
        try {
          const profiles = await blink.db.users.list({
            where: { userId: state.user.id }
          });

          const profile = profiles.length > 0 ? (profiles[0] as unknown as User) : undefined;

          setUser({
            id: state.user.id,
            email: state.user.email || '',
            displayName: state.user.displayName,
            profile
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser({
            id: state.user.id,
            email: state.user.email || '',
            displayName: state.user.displayName,
          });
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback((redirectPath?: string) => {
    const origin = window.location.origin;
    const redirectUrl = redirectPath ? `${origin}${redirectPath}` : `${origin}/auth`;
    blink.auth.login(redirectUrl);
  }, []);

  const logout = useCallback(async () => {
    try {
      await blink.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout
  };
}
