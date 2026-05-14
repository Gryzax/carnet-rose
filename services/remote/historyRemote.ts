import { remoteRequest, type ReadyRemoteContext } from './context';
import { nowIso } from '../../utils/date';
import type { ArchiveRow, EventRow } from '../../types/domain';

// Remote (Supabase) data source for events and term archives.
//
// Counter snapshots (previous/new ticks & crosses) and the cancelled flag live
// in the Supabase `payload` jsonb column; the archive's owning student id rides
// in the archive payload as `studentLocalId`.

interface SupabaseEvent {
  local_id: string;
  student_local_id: string | null;
  event_type: string;
  reason: string | null;
  term: number | null;
  payload: {
    previousTicks?: number;
    previousCrosses?: number;
    newTicks?: number;
    newCrosses?: number;
    previousForgets?: number;
    newForgets?: number;
    cancelled?: 0 | 1;
  } | null;
  occurred_at: string;
  deleted_at: string | null;
}

interface SupabaseArchive {
  local_id: string;
  term: number;
  total_merits: number | null;
  total_detentions: number | null;
  total_ticks: number | null;
  total_crosses: number | null;
  payload: { studentLocalId?: string | null } | null;
  archived_at: string;
  deleted_at: string | null;
}

export const mapEventToSupabase = (event: EventRow, userId: string) => ({
  user_id: userId,
  local_id: event.id,
  student_local_id: event.studentId || null,
  event_type: event.type,
  reason: event.reason || null,
  term: event.trimester || 1,
  payload: {
    previousTicks: event.previousTicks,
    previousCrosses: event.previousCrosses,
    newTicks: event.newTicks,
    newCrosses: event.newCrosses,
    previousForgets: event.previousForgets,
    newForgets: event.newForgets,
    cancelled: event.cancelled || 0
  },
  occurred_at: event.createdAt,
  created_at: event.createdAt,
  updated_at: nowIso(),
  deleted_at: null
});

export const mapEventFromSupabase = (row: SupabaseEvent): EventRow => {
  const payload = row.payload || {};
  return {
    id: row.local_id,
    studentId: row.student_local_id || '',
    // Tolerate the pre-refactor French value 'croix'.
    type: row.event_type === 'tick' ? 'tick' : row.event_type === 'forgot' ? 'forgot' : 'cross',
    reason: row.reason ?? null,
    trimester: row.term || 1,
    createdAt: row.occurred_at,
    previousTicks: payload.previousTicks || 0,
    previousCrosses: payload.previousCrosses || 0,
    newTicks: payload.newTicks || 0,
    newCrosses: payload.newCrosses || 0,
    previousForgets: payload.previousForgets || 0,
    newForgets: payload.newForgets || 0,
    cancelled: payload.cancelled ? 1 : 0
  };
};

export const mapArchiveToSupabase = (archive: ArchiveRow, userId: string) => ({
  user_id: userId,
  local_id: archive.id,
  term: archive.trimester || 1,
  total_students: 1,
  total_merits: archive.merits || 0,
  total_detentions: archive.detentions || 0,
  total_ticks: archive.totalTicks || 0,
  total_crosses: archive.totalCrosses || 0,
  payload: { studentLocalId: archive.studentId || null },
  archived_at: archive.archivedAt,
  created_at: archive.archivedAt,
  updated_at: nowIso(),
  deleted_at: null
});

export const mapArchiveFromSupabase = (row: SupabaseArchive): ArchiveRow => ({
  id: row.local_id,
  studentId: row.payload?.studentLocalId || '',
  trimester: row.term || 1,
  merits: row.total_merits || 0,
  detentions: row.total_detentions || 0,
  totalTicks: row.total_ticks || 0,
  totalCrosses: row.total_crosses || 0,
  archivedAt: row.archived_at
});

export const fetchEvents = async (ctx: ReadyRemoteContext): Promise<EventRow[]> => {
  const rows = await remoteRequest<SupabaseEvent[]>(
    `/rest/v1/events?user_id=eq.${encodeURIComponent(ctx.user.id)}&deleted_at=is.null&select=local_id,student_local_id,event_type,reason,term,payload,occurred_at,deleted_at`,
    { accessToken: ctx.session.accessToken }
  );
  return (rows || []).map(mapEventFromSupabase);
};

export const fetchArchives = async (ctx: ReadyRemoteContext): Promise<ArchiveRow[]> => {
  const rows = await remoteRequest<SupabaseArchive[]>(
    `/rest/v1/term_archives?user_id=eq.${encodeURIComponent(ctx.user.id)}&deleted_at=is.null&select=local_id,term,total_merits,total_detentions,total_ticks,total_crosses,payload,archived_at,deleted_at`,
    { accessToken: ctx.session.accessToken }
  );
  return (rows || []).map(mapArchiveFromSupabase);
};

export const pushEvent = async (ctx: ReadyRemoteContext, event: EventRow): Promise<void> => {
  await remoteRequest('/rest/v1/events?on_conflict=user_id,local_id', {
    method: 'POST',
    accessToken: ctx.session.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(mapEventToSupabase(event, ctx.user.id))
  });
};

export const softDeleteEventRemote = async (
  ctx: ReadyRemoteContext,
  eventId: string
): Promise<void> => {
  await remoteRequest(
    `/rest/v1/events?user_id=eq.${encodeURIComponent(ctx.user.id)}&local_id=eq.${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      accessToken: ctx.session.accessToken,
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ deleted_at: nowIso(), updated_at: nowIso() })
    }
  );
};

export const pushArchive = async (ctx: ReadyRemoteContext, archive: ArchiveRow): Promise<void> => {
  await remoteRequest('/rest/v1/term_archives?on_conflict=user_id,local_id', {
    method: 'POST',
    accessToken: ctx.session.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(mapArchiveToSupabase(archive, ctx.user.id))
  });
};
