export { appUrl, getSupabaseStatus, isSupabaseConfigured, supabase, supabaseAnonKey, supabaseUrl } from '../supabase/supabaseClient';

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '../supabase/supabaseClient';

export const supabaseRequest = async (path, options = {}) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) return { data: null, error: new Error(data?.message || 'Supabase request failed.') };
  return { data, error: null };
};
