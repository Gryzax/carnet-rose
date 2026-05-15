import { getCurrentSession, getCurrentUser } from '../auth/authService';
import {
  isSupabaseConfigured,
  supabaseRequest,
  type SupabaseRequestOptions,
} from '../supabase/supabaseClient';
import { reportReachable, reportUnreachable } from '../../net/connectivity';
import type { AuthSession, AuthUser } from '../../types/services';

// Shared plumbing for the remote (Supabase) data layer.
//
// `getRemoteContext` resolves the authenticated user + session needed for every
// request. `remoteRequest` is the thin wrapper the entity modules use: it
// reports network reachability (so the sync manager knows when to drain the
// outbox) and throws on failure, so callers can `try/catch` instead of
// threading `{ data, error }` everywhere.

export interface ReadyRemoteContext {
  ready: true;
  user: AuthUser;
  session: AuthSession;
}

export type RemoteContext =
  | { ready: false; reason: 'not-configured' | 'not-authenticated' }
  | ReadyRemoteContext;

export const getRemoteContext = async (): Promise<RemoteContext> => {
  if (!isSupabaseConfigured()) return { ready: false, reason: 'not-configured' };
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user?.id) return { ready: false, reason: 'not-authenticated' };
  const { session, error: sessionError } = await getCurrentSession();
  if (sessionError || !session?.accessToken) return { ready: false, reason: 'not-authenticated' };
  return { ready: true, user, session };
};

/**
 * Performs a Supabase REST request, returning the parsed body on success.
 * Throws on network failure or API error; updates connectivity state either way.
 */
export const remoteRequest = async <T = unknown>(
  path: string,
  options: SupabaseRequestOptions = {},
): Promise<T | null> => {
  let result;
  try {
    result = await supabaseRequest<T>(path, options);
  } catch (error) {
    // A thrown error here is a network-level failure (fetch rejected).
    reportUnreachable();
    throw error instanceof Error ? error : new Error(String(error));
  }
  // We reached the server, even if it answered with an error.
  reportReachable();
  if (result.error) throw result.error;
  return result.data;
};
