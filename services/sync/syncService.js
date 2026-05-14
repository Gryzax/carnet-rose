import { getCurrentSession, getCurrentUser } from '../auth/authService';
import { isSupabaseConfigured, supabaseRequest } from '../supabase/supabaseClient';
import { syncClasses } from './classSyncService';
import { syncHistory } from './historySyncService';
import { syncStudents } from './studentSyncService';

let lastSyncAt = null;

export const getLastSyncAt = () => lastSyncAt;

export const getSyncContext = async () => {
  if (!isSupabaseConfigured()) return { ready: false, reason: 'not-configured' };
  const { user, error: userError } = await getCurrentUser();
  if (userError || !user?.id) return { ready: false, reason: 'not-authenticated', error: userError || null };
  const { session, error: sessionError } = await getCurrentSession();
  if (sessionError || !session?.accessToken) return { ready: false, reason: 'not-authenticated', user, error: sessionError || null };
  return { ready: true, user, session };
};

export const updateSyncState = async ({ user, session }) => {
  const syncedAt = new Date().toISOString();
  const result = await supabaseRequest('/rest/v1/sync_state?on_conflict=user_id,local_id', {
    method: 'POST',
    accessToken: session.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      user_id: user.id,
      local_id: 'default',
      entity_name: 'all',
      last_pushed_at: syncedAt,
      last_used_at: syncedAt,
      updated_at: syncedAt,
      deleted_at: null
    })
  });
  if (!result.error) lastSyncAt = syncedAt;
  return result;
};

export const pushLocalChanges = async () => {
  const context = await getSyncContext();
  if (!context.ready) return { synced: false, reason: context.reason, error: context.error || null };

  const classes = await syncClasses(context);
  if (classes.error) return { synced: false, error: classes.error };
  const students = await syncStudents(context);
  if (students.error) return { synced: false, error: students.error };
  const history = await syncHistory(context);
  if (history.error) return { synced: false, error: history.error };
  const syncState = await updateSyncState(context);
  if (syncState.error) return { synced: false, error: syncState.error };

  return { synced: true, classes, students, history, lastSyncAt };
};

export const syncAll = async () => pushLocalChanges();

export const runBackgroundSync = async (callback) => {
  try {
    const context = await getSyncContext();
    if (!context.ready) return { synced: false, reason: context.reason };
    const result = await callback(context);
    return { synced: !result?.error, error: result?.error || null };
  } catch (error) {
    return { synced: false, error };
  }
};
