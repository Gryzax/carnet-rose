import * as WebBrowser from 'expo-web-browser';
import { appUrl, isSupabaseConfigured, supabase } from '../supabase/supabaseClient';

export const getAuthStatus = () => ({
  enabled: isSupabaseConfigured(),
  provider: isSupabaseConfigured() ? 'supabase' : 'local-only'
});

const offlineResult = (provider) => ({
  user: null,
  error: new Error(`${provider} n'est pas disponible : Supabase n'est pas configuré.`),
  message: 'Mode local uniquement. Ajoutez les variables Supabase pour activer la connexion.'
});

const signInWithProvider = async (provider, label) => {
  if (!isSupabaseConfigured() || !supabase) return offlineResult(label);

  const redirectTo = appUrl;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });

  if (error) return { user: null, error, message: `Connexion ${label} impossible pour le moment.` };
  if (data?.url) await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  const current = await getCurrentUser();
  return { user: current.user, error: current.error, message: current.user ? 'Connexion réussie.' : `Connexion ${label} lancée.` };
};

export const signInWithGoogle = () => signInWithProvider('google', 'Google');

export const signInWithApple = () => signInWithProvider('apple', 'Apple');

export const signOut = async () => {
  if (!isSupabaseConfigured() || !supabase) return { error: null, message: 'Mode local uniquement.' };
  const { error } = await supabase.auth.signOut();
  return { error, message: error ? 'Déconnexion impossible pour le moment.' : 'Vous êtes déconnecté.' };
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured() || !supabase) return { user: null, error: null };
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
};

export const onAuthStateChange = (callback) => {
  if (!isSupabaseConfigured() || !supabase) {
    callback?.(null, null);
    return { unsubscribe: () => {} };
  }
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback?.(event, session));
  return { unsubscribe: () => data?.subscription?.unsubscribe?.() };
};
