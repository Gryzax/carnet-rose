import { isSupabaseConfigured } from '../supabase/supabaseClient';

let currentUser = null;
const listeners = new Set();

const unavailableMessage = 'La connexion n\u2019est pas encore configur\u00e9e. Veuillez contacter l\u2019administrateur.';

const emitAuthChange = () => {
  listeners.forEach((callback) => callback('AUTH_STATE_CHANGED', currentUser ? { user: currentUser } : null));
};

export const getAuthStatus = () => {
  const enabled = isSupabaseConfigured();
  return {
    enabled,
    provider: enabled ? 'supabase' : 'unconfigured'
  };
};

export const signInWithGoogle = async () => ({
  user: null,
  error: new Error(isSupabaseConfigured() ? 'Connexion Google a configurer dans Supabase.' : unavailableMessage),
  message: isSupabaseConfigured() ? 'Connexion Google a configurer dans Supabase.' : unavailableMessage
});

export const signInWithApple = async () => ({
  user: null,
  error: new Error(isSupabaseConfigured() ? 'Connexion Apple a configurer dans Supabase.' : unavailableMessage),
  message: isSupabaseConfigured() ? 'Connexion Apple a configurer dans Supabase.' : unavailableMessage
});

export const getCurrentUser = async () => ({ user: currentUser, error: null });

export const onAuthStateChange = (callback) => {
  listeners.add(callback);
  return { unsubscribe: () => listeners.delete(callback) };
};

export const signOut = async () => {
  currentUser = null;
  emitAuthChange();
  return { error: null };
};
