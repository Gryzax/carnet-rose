const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const getSupabaseUrl = () => supabaseUrl.replace(/\/$/, '');

export const getSupabaseAnonKey = () => supabaseAnonKey;

export const isSupabaseConfigured = () => Boolean(getSupabaseUrl() && supabaseAnonKey);

export const getSupabaseAuthUrl = (provider, redirectTo) => {
  if (!isSupabaseConfigured()) return null;
  const params = new URLSearchParams({
    provider,
    redirect_to: redirectTo
  });
  return `${getSupabaseUrl()}/auth/v1/authorize?${params.toString()}`;
};

export const supabaseRequest = async (path, options = {}) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const response = await fetch(`${getSupabaseUrl()}${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${options.accessToken || supabaseAnonKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) return { data: null, error: new Error(data?.message || 'Supabase request failed.') };
  return { data, error: null };
};
