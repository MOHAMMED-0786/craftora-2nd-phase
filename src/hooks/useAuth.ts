import { useState, useEffect } from 'react';
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
      if (state.user) {
        // Fetch profile from DB
        try {
          const profiles = await blink.db.users.list({
            where: { user_id: state.user.id }
          });
          
          const profile = profiles.length > 0 ? (profiles[0] as unknown as User) : undefined;

          setUser({
            id: state.user.id,
            email: state.user.email || '',
            displayName: state.user.displayName,
            profile
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser({
            id: state.user.id,
            email: state.user.email || '',
            displayName: state.user.displayName,
          });
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(state.isLoading);
      setIsAuthenticated(state.isAuthenticated);
    });

    return unsubscribe;
  }, []);

  const login = () => {
    blink.auth.login(window.location.href);
  };

  const logout = async () => {
    await blink.auth.signOut();
    window.location.href = '/';
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout
  };
}