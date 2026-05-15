import { Linking, Platform } from 'react-native';
import {
  getSupabaseAuthUrl,
  isSupabaseConfigured,
  supabaseRequest,
} from '../supabase/supabaseClient';
import type { AuthResult, AuthSession, AuthUser, SessionResult } from '../../types/services';

export type AuthChangeCallback = (event: string, payload: { user: AuthUser } | null) => void;

let currentUser: AuthUser | null = null;
const listeners = new Set<AuthChangeCallback>();
const SESSION_KEY = 'carnet-rose.supabase-session';

const DEFAULT_APP_URL = 'https://gryzax.github.io/carnet-rose/';

// Loopback hosts never leave the developer's machine, so an http redirect to
// them carries no token-leak risk and is the only way to test auth in dev.
const isLoopbackHost = (host: string): boolean =>
  host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

// The OAuth redirect target carries the returned token, so it must be a
// trusted https URL (or an http loopback for local dev). A misconfigured env
// var falls back to the known-good URL.
const getAppUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_APP_URL;
  if (!configured) return DEFAULT_APP_URL;
  try {
    const url = new URL(configured);
    if (url.protocol === 'https:') return configured;
    if (url.protocol === 'http:' && isLoopbackHost(url.hostname)) return configured;
    return DEFAULT_APP_URL;
  } catch {
    return DEFAULT_APP_URL;
  }
};

const isSessionValid = (session: AuthSession | null | undefined): boolean => {
  if (!session?.accessToken) return false;
  // expiresAt is a unix timestamp in seconds (Supabase). Treat missing as valid
  // for backward compatibility, but reject anything we know to be expired.
  if (session.expiresAt == null) return true;
  const expiresAtMs = Number(session.expiresAt) * 1000;
  if (!Number.isFinite(expiresAtMs)) return true;
  return expiresAtMs > Date.now();
};

const getStoredSession = (): AuthSession | null => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!isSessionValid(session)) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

const storeSession = (session: AuthSession | null): void => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return;
  if (session) {
    // Never persist the refresh token: localStorage is readable by any script
    // on the page, and a leaked refresh token is a long-lived account takeover.
    const { refreshToken, ...persistable } = session;
    void refreshToken;
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(persistable));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
};

// Holds an OAuth error returned in the redirect hash (e.g. provider disabled,
// redirect_to not allowed) so the login screen can show it instead of silently
// bouncing the user back to the login page.
let pendingAuthError: string | null = null;

export const consumePendingAuthError = (): string | null => {
  const error = pendingAuthError;
  pendingAuthError = null;
  return error;
};

const extractWebSession = (): AuthSession | null => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const hash = window.location.hash?.replace(/^#/, '');
  if (!hash) return null;
  // Strip the token-bearing fragment from the URL as the very first action,
  // before parsing, so it cannot leak into history/analytics/crash reporters.
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search,
  );
  const params = new URLSearchParams(hash);
  const errorDescription = params.get('error_description') || params.get('error');
  if (errorDescription) {
    pendingAuthError = errorDescription;
    return null;
  }
  const accessToken = params.get('access_token');
  if (!accessToken) return null;
  const session: AuthSession = {
    accessToken,
    refreshToken: params.get('refresh_token'),
    expiresAt: params.get('expires_at'),
  };
  if (!isSessionValid(session)) return null;
  storeSession(session);
  return session;
};

// Clear any token (or error) fragment from the URL eagerly on module load, so
// the window of exposure is as small as possible even before auth screens mount.
if (
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  /(access_token|error)=/.test(window.location.hash || '')
) {
  extractWebSession();
}

const emitAuthChange = (): void => {
  listeners.forEach((callback) =>
    callback('AUTH_STATE_CHANGED', currentUser ? { user: currentUser } : null),
  );
};

const loadUserFromSession = async (session: AuthSession | null): Promise<AuthResult> => {
  if (!session?.accessToken) return { user: null, error: null };
  const { data, error } = await supabaseRequest<AuthUser>('/auth/v1/user', {
    accessToken: session.accessToken,
  });
  if (error) {
    // The token was refused (expired/revoked/invalid). Drop it so the next
    // load starts clean instead of retrying the dead token on every reload.
    currentUser = null;
    storeSession(null);
    return { user: null, error };
  }
  currentUser = data;
  emitAuthChange();
  return { user: currentUser, error: null };
};

const signInWithProvider = async (provider: string): Promise<AuthResult> => {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: new Error('Sign-in is not configured.'),
      messageKey: 'unavailableMessage',
    };
  }

  const redirectTo = getAppUrl();
  const authUrl = getSupabaseAuthUrl(provider, redirectTo);
  try {
    if (authUrl) {
      // On web, navigate the current tab: Linking.openURL falls back to
      // window.open (a new tab), but the OAuth redirect carries the token
      // back in the URL hash and extractWebSession only sees it in the tab
      // that started the flow. A same-tab redirect keeps that loop intact.
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.assign(authUrl);
      } else {
        await Linking.openURL(authUrl);
      }
    }
    return { user: null, error: null, messageKey: 'redirectInProgress' };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error(String(error)),
      messageKey: 'signInPageError',
    };
  }
};

export const getAuthStatus = (): { enabled: boolean; provider: string } => {
  const enabled = isSupabaseConfigured();
  return {
    enabled,
    provider: enabled ? 'supabase' : 'unconfigured',
  };
};

export const signInWithGoogle = async (): Promise<AuthResult> => signInWithProvider('google');

export const signInWithApple = async (): Promise<AuthResult> => signInWithProvider('apple');

export const getCurrentUser = async (): Promise<AuthResult> => {
  if (currentUser) return { user: currentUser, error: null };
  if (!isSupabaseConfigured()) return { user: null, error: null };
  return loadUserFromSession(extractWebSession() || getStoredSession());
};

export const getCurrentSession = async (): Promise<SessionResult> => {
  const session = extractWebSession() || getStoredSession();
  if (!session?.accessToken) return { session: null, error: null };
  if (!currentUser) {
    const { error } = await loadUserFromSession(session);
    if (error) return { session: null, error };
  }
  return { session, error: null };
};

export const onAuthStateChange = (callback: AuthChangeCallback): { unsubscribe: () => void } => {
  listeners.add(callback);
  return { unsubscribe: () => listeners.delete(callback) };
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  currentUser = null;
  storeSession(null);
  emitAuthChange();
  return { error: null };
};

// Permanently deletes the signed-in user. The `delete_account` RPC is a
// security-definer function on Supabase that removes the row from
// `auth.users`; the schema's ON DELETE CASCADE clears all the user's data.
// On success we sign out locally so the app drops to the login screen.
export const deleteAccount = async (): Promise<{ error: Error | null }> => {
  const session = extractWebSession() || getStoredSession();
  if (!session?.accessToken) {
    // No remote session to delete — just clear local state.
    await signOut();
    return { error: null };
  }
  const { error } = await supabaseRequest('/rest/v1/rpc/delete_account', {
    method: 'POST',
    accessToken: session.accessToken,
    body: JSON.stringify({}),
  });
  if (error) return { error };
  await signOut();
  return { error: null };
};
