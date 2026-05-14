import { remoteRequest, type ReadyRemoteContext } from './context';
import { nowIso } from '../../utils/date';
import type { ClassRow } from '../../types/domain';

// Remote (Supabase) data source for classes.
//
// The client-generated UUID is sent as `local_id`; rows are keyed by
// (user_id, local_id), which is also how a row maps back to its domain id.

interface SupabaseClass {
  local_id: string;
  name: string;
  created_at: string | null;
  last_used_at: string | null;
  deleted_at: string | null;
}

export const mapClassToSupabase = (classRow: ClassRow, userId: string) => ({
  user_id: userId,
  local_id: classRow.id,
  name: classRow.name,
  created_at: classRow.createdAt || nowIso(),
  last_used_at: classRow.lastUsedAt || classRow.createdAt || null,
  updated_at: nowIso(),
  deleted_at: null
});

export const mapClassFromSupabase = (row: SupabaseClass): ClassRow => ({
  id: row.local_id,
  name: row.name,
  createdAt: row.created_at || nowIso(),
  lastUsedAt: row.last_used_at || row.created_at || null
});

export const fetchClasses = async (ctx: ReadyRemoteContext): Promise<ClassRow[]> => {
  const rows = await remoteRequest<SupabaseClass[]>(
    `/rest/v1/classes?user_id=eq.${encodeURIComponent(ctx.user.id)}&deleted_at=is.null&select=local_id,name,created_at,last_used_at,deleted_at`,
    { accessToken: ctx.session.accessToken }
  );
  return (rows || []).map(mapClassFromSupabase);
};

export const pushClass = async (ctx: ReadyRemoteContext, classRow: ClassRow): Promise<void> => {
  await remoteRequest('/rest/v1/classes?on_conflict=user_id,local_id', {
    method: 'POST',
    accessToken: ctx.session.accessToken,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(mapClassToSupabase(classRow, ctx.user.id))
  });
};

export const softDeleteClassRemote = async (
  ctx: ReadyRemoteContext,
  classId: string
): Promise<void> => {
  await remoteRequest(
    `/rest/v1/classes?user_id=eq.${encodeURIComponent(ctx.user.id)}&local_id=eq.${encodeURIComponent(classId)}`,
    {
      method: 'PATCH',
      accessToken: ctx.session.accessToken,
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ deleted_at: nowIso(), updated_at: nowIso() })
    }
  );
};
