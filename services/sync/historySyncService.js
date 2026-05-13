import { isSupabaseConfigured, supabase } from '../supabase/supabaseClient';

export const pushHistory = async (user) => {
  if (!isSupabaseConfigured() || !supabase) return { synced: false, reason: 'supabase-not-configured' };
  if (!user) return { synced: false, reason: 'not-authenticated' };
  return { synced: true, pushed: 0 };
};

export const pullHistory = async (user) => {
  if (!isSupabaseConfigured() || !supabase) return { synced: false, reason: 'supabase-not-configured' };
  if (!user) return { synced: false, reason: 'not-authenticated' };
  return { synced: true, pulled: 0 };
};

export const syncHistory = async (user) => {
  const pushed = await pushHistory(user);
  if (!pushed.synced) return pushed;
  const pulled = await pullHistory(user);
  if (!pulled.synced) return pulled;
  return { synced: true, pushed: pushed.pushed, pulled: pulled.pulled };
};
