import { isSupabaseConfigured } from '../api/supabaseClient';

export const syncStudents = async () => {
  if (!isSupabaseConfigured()) return { synced: false, reason: 'local-only' };
  return { synced: false, reason: 'not-implemented' };
};
