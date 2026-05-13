import { isSupabaseConfigured, supabase } from '../supabase/supabaseClient';

export const pushStudents = async (user) => {
  if (!isSupabaseConfigured() || !supabase) return { synced: false, reason: 'supabase-not-configured' };
  if (!user) return { synced: false, reason: 'not-authenticated' };
  return { synced: true, pushed: 0 };
};

export const pullStudents = async (user) => {
  if (!isSupabaseConfigured() || !supabase) return { synced: false, reason: 'supabase-not-configured' };
  if (!user) return { synced: false, reason: 'not-authenticated' };
  return { synced: true, pulled: 0 };
};

export const syncStudents = async (user) => {
  const pushed = await pushStudents(user);
  if (!pushed.synced) return pushed;
  const pulled = await pullStudents(user);
  if (!pulled.synced) return pulled;
  return { synced: true, pushed: pushed.pushed, pulled: pulled.pulled };
};
