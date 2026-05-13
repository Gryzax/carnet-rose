import { Platform } from 'react-native';
import { isSupabaseConfigured } from '../api/supabaseClient';

let localModeEnabled = false;
let currentUser = null;
const listeners = new Set();
const LOCAL_MODE_KEY = 'carnet-rose.local-mode';

const readLocalMode = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return false;
  return window.localStorage.getItem(LOCAL_MODE_KEY) === 'true';
};

const writeLocalMode = (enabled) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return;
  if (enabled) window.localStorage.setItem(LOCAL_MODE_KEY, 'true');
  else window.localStorage.removeItem(LOCAL_MODE_KEY);
};

localModeEnabled = readLocalMode();

const emitAuthChange = () => {
  listeners.forEach((callback) => callback('AUTH_STATE_CHANGED', currentUser ? { user: currentUser } : null));
};

export const getAuthStatus = () => {
  const enabled = isSupabaseConfigured();
  return {
    enabled,
    provider: enabled ? 'supabase' : 'local-only',
    localModeEnabled
  };
};

export const signInWithGoogle = async () => ({
  user: null,
  error: new Error(isSupabaseConfigured() ? 'Connexion Google a configurer dans Supabase.' : "Supabase n'est pas encore configure."),
  message: isSupabaseConfigured() ? 'Connexion Google a configurer dans Supabase.' : 'Mode local disponible.'
});

export const signInWithApple = async () => ({
  user: null,
  error: new Error(isSupabaseConfigured() ? 'Connexion Apple a configurer dans Supabase.' : "Supabase n'est pas encore configure."),
  message: isSupabaseConfigured() ? 'Connexion Apple a configurer dans Supabase.' : 'Mode local disponible.'
});

export const enableLocalMode = async () => {
  localModeEnabled = true;
  writeLocalMode(true);
  emitAuthChange();
  return { localModeEnabled: true, error: null };
};

export const disableLocalMode = async () => {
  localModeEnabled = false;
  writeLocalMode(false);
  emitAuthChange();
  return { localModeEnabled: false, error: null };
};

export const isLocalModeEnabled = () => localModeEnabled;

export const getCurrentUser = async () => ({ user: currentUser, error: null });

export const onAuthStateChange = (callback) => {
  listeners.add(callback);
  return { unsubscribe: () => listeners.delete(callback) };
};

export const signOut = async () => {
  currentUser = null;
  localModeEnabled = false;
  writeLocalMode(false);
  emitAuthChange();
  return { error: null };
};
