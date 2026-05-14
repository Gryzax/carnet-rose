import type { SupabaseResult } from '../../types/services';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

export const getSupabaseUrl = (): string => supabaseUrl.replace(/\/$/, '');

export const getSupabaseAnonKey = (): string => supabaseAnonKey;

export const isSupabaseConfigured = (): boolean => Boolean(getSupabaseUrl() && supabaseAnonKey);

export const getSupabaseAuthUrl = (provider: string, redirectTo: string): string | null => {
  if (!isSupabaseConfigured()) return null;
  const params = new URLSearchParams({
    provider,
    redirect_to: redirectTo
  });
  return `${getSupabaseUrl()}/auth/v1/authorize?${params.toString()}`;
};

export interface SupabaseRequestOptions extends RequestInit {
  accessToken?: string;
}

export const supabaseRequest = async <T = unknown>(
  path: string,
  options: SupabaseRequestOptions = {}
): Promise<SupabaseResult<T>> => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const { accessToken, headers, ...rest } = options;
  const response = await fetch(`${getSupabaseUrl()}${path}`, {
    ...rest,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
      'Content-Type': 'application/json',
      ...((headers as Record<string, string>) || {})
    }
  });

  const data = (await response.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!response.ok) {
    return { data: null, error: new Error(data?.message || 'Supabase request failed.') };
  }
  return { data, error: null };
};
