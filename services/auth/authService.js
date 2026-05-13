import { isSupabaseConfigured } from '../api/supabaseClient';

export const getAuthStatus = () => ({
  enabled: isSupabaseConfigured(),
  provider: isSupabaseConfigured() ? 'supabase' : 'local-only'
});

export const signInWithGoogle = async () => ({
  user: null,
  error: new Error('Google sign-in is planned but not enabled in the local-only app.')
});

export const signInWithApple = async () => ({
  user: null,
  error: new Error('Apple sign-in is planned but not enabled in the local-only app.')
});

export const signOut = async () => ({ error: null });
