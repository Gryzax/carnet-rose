import {
  bumpAttempts,
  listOutbox,
  outboxSize,
  removeEntry,
  type OutboxEntry,
} from '../database/outbox';
import { getRemoteContext, type ReadyRemoteContext } from '../services/remote/context';
import { isOnline } from '../net/connectivity';
import { pushClass, softDeleteClassRemote } from '../services/remote/classRemote';
import { pushStudent, softDeleteStudentRemote } from '../services/remote/studentRemote';
import { pushArchive, pushEvent, softDeleteEventRemote } from '../services/remote/historyRemote';
import type { ArchiveRow, ClassRow, EventRow, StudentRow } from '../types/domain';

// Drains the offline outbox to Supabase.
//
// Entries are replayed oldest-first. The first failure aborts the run (the
// network is most likely gone again) and leaves the rest queued; the sync
// manager retries later. `flushOutbox` is single-flight: concurrent callers
// share one in-progress run.

const dispatch = async (ctx: ReadyRemoteContext, entry: OutboxEntry): Promise<void> => {
  const { entity, op, payload } = entry;
  if (entity === 'class') {
    return op === 'delete'
      ? softDeleteClassRemote(ctx, payload.id)
      : pushClass(ctx, payload as unknown as ClassRow);
  }
  if (entity === 'student') {
    return op === 'delete'
      ? softDeleteStudentRemote(ctx, payload.id)
      : pushStudent(ctx, payload as unknown as StudentRow);
  }
  if (entity === 'event') {
    return op === 'delete'
      ? softDeleteEventRemote(ctx, payload.id)
      : pushEvent(ctx, payload as unknown as EventRow);
  }
  // archive — only ever upserted.
  return pushArchive(ctx, payload as unknown as ArchiveRow);
};

let inFlight: Promise<number> | null = null;

const drain = async (): Promise<number> => {
  if (!isOnline()) return outboxSize();
  const ctx = await getRemoteContext();
  if (!ctx.ready) return outboxSize();

  const entries = await listOutbox();
  for (const entry of entries) {
    try {
      await dispatch(ctx, entry);
      await removeEntry(entry.id);
    } catch {
      await bumpAttempts(entry.id);
      break;
    }
  }
  return outboxSize();
};

/**
 * Pushes every pending mutation. Resolves to the number of entries still
 * queued afterwards (0 means the local cache is fully in sync with Supabase).
 */
export const flushOutbox = async (): Promise<number> => {
  if (inFlight) return inFlight;
  inFlight = drain();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
};
