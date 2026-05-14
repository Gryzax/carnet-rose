import { Linking, Platform } from 'react-native';
import { getSupabaseAuthUrl, isSupabaseConfigured, supabaseRequest } from '../supabase/supabaseClient';

let currentUser = null;
const listeners = new Set();
const SESSION_KEY = 'carnet-rose.supabase-session';
const unavailableMessage = 'La connexion n\u2019est pas encore configur\u00e9e. Veuillez contacter l\u2019administrateur.';

const getAppUrl = () => process.env.EXPO_PUBLIC_APP_URL || 'https://gryzax.github.io/carnet-rose/';

const getStoredSession = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const storeSession = (session) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return;
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
};

const extractWebSession = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const hash = window.location.hash?.replace(/^#/, '');
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (!accessToken) return null;
  const session = {
    accessToken,
    refreshToken: params.get('refresh_token'),
    expiresAt: params.get('expires_at')
  };
  storeSession(session);
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return session;
};

const emitAuthChange = () => {
  listeners.forEach((callback) => callback('AUTH_STATE_CHANGED', currentUser ? { user: currentUser } : null));
};

const loadUserFromSession = async (session) => {
  if (!session?.accessToken) return { user: null, error: null };
  const { data, error } = await supabaseRequest('/auth/v1/user', { accessToken: session.accessToken });
  if (error) return { user: null, error };
  currentUser = data;
  emitAuthChange();
  return { user: currentUser, error: null };
};

const signInWithProvider = async (provider) => {
  if (!isSupabaseConfigured()) {
    return { user: null, error: new Error(unavailableMessage), message: unavailableMessage };
  }

  const redirectTo = getAppUrl();
  const authUrl = getSupabaseAuthUrl(provider, redirectTo);
  try {
    await Linking.openURL(authUrl);
    return { user: null, error: null, message: 'Redirection vers Supabase en cours.' };
  } catch (error) {
    return { user: null, error, message: "Impossible d'ouvrir la page de connexion Supabase." };
  }
};

export const getAuthStatus = () => {
  const enabled = isSupabaseConfigured();
  return {
    enabled,
    provider: enabled ? 'supabase' : 'unconfigured'
  };
};

export const signInWithGoogle = async () => signInWithProvider('google');

export const signInWithApple = async () => signInWithProvider('apple');

export const getCurrentUser = async () => {
  if (currentUser) return { user: currentUser, error: null };
  if (!isSupabaseConfigured()) return { user: null, error: null };
  return loadUserFromSession(extractWebSession() || getStoredSession());
};

export const getCurrentSession = async () => {
  const session = extractWebSession() || getStoredSession();
  if (!session?.accessToken) return { session: null, error: null };
  if (!currentUser) {
    const { error } = await loadUserFromSession(session);
    if (error) return { session: null, error };
  }
  return { session, error: null };
};

export const onAuthStateChange = (callback) => {
  listeners.add(callback);
  return { unsubscribe: () => listeners.delete(callback) };
};

export const signOut = async () => {
  currentUser = null;
  storeSession(null);
  emitAuthChange();
  return { error: null };
};
