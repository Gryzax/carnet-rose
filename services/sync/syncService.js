import { getCurrentUser } from '../auth/authService';
import { isSupabaseConfigured } from '../supabase/supabaseClient';
import { syncClasses } from './classSyncService';
import { syncHistory } from './historySyncService';
import { syncStudents } from './studentSyncService';

let lastSyncAt = null;

export const getLastSyncAt = () => lastSyncAt;

export const pushLocalChanges = async (user) => {
  const classResult = await syncClasses(user);
  if (!classResult.synced) return classResult;
  const studentResult = await syncStudents(user);
  if (!studentResult.synced) return studentResult;
  const historyResult = await syncHistory(user);
  if (!historyResult.synced) return historyResult;
  return { synced: true };
};

export const pullRemoteChanges = async (user) => {
  if (!user) return { synced: false, reason: 'not-authenticated' };
  return { synced: true };
};

export const syncAll = async () => {
  if (!isSupabaseConfigured()) return { synced: false, reason: 'supabase-not-configured', message: 'Mode local uniquement.' };

  const { user, error } = await getCurrentUser();
  if (error) return { synced: false, reason: 'auth-error', error, message: 'Connexion impossible pour le moment.' };
  if (!user) return { synced: false, reason: 'not-authenticated', message: 'Connectez-vous pour activer la sauvegarde en ligne.' };

  try {
    const pushed = await pushLocalChanges(user);
    if (!pushed.synced) return pushed;
    const pulled = await pullRemoteChanges(user);
    if (!pulled.synced) return pulled;
    lastSyncAt = new Date().toISOString();
    return { synced: true, lastSyncAt, message: 'Synchronisation terminée.' };
  } catch (error) {
    return { synced: false, reason: 'sync-error', error, message: 'Synchronisation impossible. Les données locales sont conservées.' };
  }
};
