import { isSupabaseConfigured } from '../api/supabaseClient';

export const syncClasses = async () => {
  if (!isSupabaseConfigured()) return { synced: false, reason: 'local-only' };
  return { synced: false, reason: 'not-implemented' };
};
