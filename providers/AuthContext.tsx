import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  getCurrentUser,
  onAuthStateChange,
  signOut as authSignOut
} from '../services/auth/authService';
import type { AuthUser } from '../types/services';

interface AuthContextValue {
  /** The signed-in user, or null when unauthenticated. */
  user: AuthUser | null;
  /** True until the initial session check resolves. */
  checkingSession: boolean;
  /** Imperative setter for screens that complete their own auth flow (login). */
  setUser: (user: AuthUser | null) => void;
  /** Sign out and clear the session. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the authentication session: the initial check, live auth-state changes,
 * and (on web) re-syncing when the user navigates back. Previously this lived
 * as ad-hoc state inside RootNavigator.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    const syncUserFromSession = () =>
      getCurrentUser().then(({ user }) => {
        if (!active) return;
        setUser(user || null);
        setCheckingSession(false);
      });
    syncUserFromSession();
    const subscription = onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    const handleBrowserBack = () => {
      syncUserFromSession();
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('popstate', handleBrowserBack);
    }
    return () => {
      active = false;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('popstate', handleBrowserBack);
      }
      subscription?.unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    await authSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checkingSession, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
