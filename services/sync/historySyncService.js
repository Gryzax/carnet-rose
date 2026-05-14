import { getAllArchives, getAllEvents } from '../../models/historyModel';
import { supabaseRequest } from '../supabase/supabaseClient';

export const mapEventToSupabase = (event, userId) => ({
  user_id: userId,
  local_id: String(event.id),
  student_local_id: event.eleveId == null ? null : String(event.eleveId),
  event_type: event.type,
  reason: event.raison || null,
  term: event.trimestre || 1,
  payload: {
    previousTicks: event.previousTicks,
    previousCroix: event.previousCroix,
    newTicks: event.newTicks,
    newCroix: event.newCroix,
    annule: event.annule || 0
  },
  occurred_at: event.creeLe,
  created_at: event.creeLe,
  updated_at: new Date().toISOString(),
  deleted_at: null
});

export const mapArchiveToSupabase = (archive, userId) => ({
  user_id: userId,
  local_id: String(archive.id),
  term: archive.trimestre || 1,
  total_students: 1,
  total_merits: archive.merites || 0,
  total_detentions: archive.retenues || 0,
  total_ticks: archive.totalTicks || 0,
  total_crosses: archive.totalCroix || 0,
  payload: {
    studentLocalId: archive.eleveId == null ? null : String(archive.eleveId)
  },
  archived_at: archive.archiveLe,
  created_at: archive.archiveLe,
  updated_at: new Date().toISOString(),
  deleted_at: null
});

export const upsertEvent = async ({ event, user, session }) => {
  if (!event || !user?.id || !session?.accessToken) return { synced: false, reason: 'not-authenticated' };
  return supabaseRequest('/rest/v1/events?on_conflict=user_id,local_id', {
    method: 'POST',
    accessToken: session.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(mapEventToSupabase(event, user.id))
  });
};

export const upsertTermArchive = async ({ archive, user, session }) => {
  if (!archive || !user?.id || !session?.accessToken) return { synced: false, reason: 'not-authenticated' };
  return supabaseRequest('/rest/v1/term_archives?on_conflict=user_id,local_id', {
    method: 'POST',
    accessToken: session.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(mapArchiveToSupabase(archive, user.id))
  });
};

export const syncHistory = async ({ user, session } = {}) => {
  if (!user?.id || !session?.accessToken) return { synced: false, reason: 'not-authenticated' };
  const events = await getAllEvents();
  const archives = await getAllArchives();
  const results = [];
  for (const event of events) results.push(await upsertEvent({ event, user, session }));
  for (const archive of archives) results.push(await upsertTermArchive({ archive, user, session }));
  const error = results.find((result) => result?.error)?.error || null;
  return { synced: !error, events: events.length, archives: archives.length, error };
};
