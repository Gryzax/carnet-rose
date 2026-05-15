// Shared shapes for the Supabase / auth / sync layer.

export interface SupabaseResult<T = unknown> {
  data: T | null;
  error: Error | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | number | null;
}

export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthResult {
  user: AuthUser | null;
  error: Error | null;
  /** i18n key for a user-facing status/error message; the UI translates it. */
  messageKey?: string;
}

export interface SessionResult {
  session: AuthSession | null;
  error: Error | null;
}

export interface SyncContext {
  ready: boolean;
  reason?: string;
  user?: AuthUser | null;
  session?: AuthSession | null;
  error?: unknown;
}

export interface SyncOutcome {
  synced: boolean;
  reason?: string;
  error?: unknown;
  [key: string]: unknown;
}
