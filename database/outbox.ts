import { getStore } from './db';
import { uuid } from '../utils/uuid';
import { nowIso } from '../utils/date';
import type { CacheRow } from '../types/db';

// Offline outbox.
//
// Every write the app makes is applied to the cache immediately, then either
// pushed to Supabase (online) or appended here (offline / push failed). The
// sync manager drains this queue ASAP once the network is back.

export type OutboxEntity = 'class' | 'student' | 'event' | 'archive';
export type OutboxOp = 'upsert' | 'delete';

export interface OutboxEntry extends CacheRow {
  id: string;
  entity: OutboxEntity;
  op: OutboxOp;
  /** Full domain row for `upsert`; `{ id }` for `delete`. */
  payload: { id: string };
  createdAt: string;
  attempts: number;
}

const byCreatedAt = (a: OutboxEntry, b: OutboxEntry): number =>
  a.createdAt.localeCompare(b.createdAt);

/** Pending entries, oldest first. */
export const listOutbox = async (): Promise<OutboxEntry[]> => {
  const store = await getStore();
  const entries = await store.all<OutboxEntry>('outbox');
  return entries.sort(byCreatedAt);
};

export const outboxSize = async (): Promise<number> => (await listOutbox()).length;

/**
 * Append a pending mutation. Coalesces with what is already queued for the same
 * row so a long offline session doesn't replay a hundred redundant upserts:
 *  - a new upsert replaces any earlier queued upsert for that row;
 *  - a delete drops every earlier queued mutation for that row (and, if the row
 *    was only ever created offline, cancels itself out entirely).
 */
export const enqueue = async (
  entity: OutboxEntity,
  op: OutboxOp,
  payload: { id: string }
): Promise<void> => {
  const store = await getStore();
  const existing = await store.all<OutboxEntry>('outbox');
  const sameRow = existing.filter(
    (entry) => entry.entity === entity && entry.payload.id === payload.id
  );

  for (const stale of sameRow) await store.remove('outbox', stale.id);

  if (op === 'delete' && sameRow.some((entry) => entry.op === 'upsert')) {
    const everSynced = sameRow.every((entry) => entry.op !== 'upsert' || entry.attempts > 0);
    // Created and deleted while offline and never pushed: nothing to send.
    if (!everSynced) return;
  }

  const entry: OutboxEntry = {
    id: uuid(),
    entity,
    op,
    payload,
    createdAt: nowIso(),
    attempts: 0
  };
  await store.put('outbox', entry);
};

export const removeEntry = async (id: string): Promise<void> => {
  const store = await getStore();
  await store.remove('outbox', id);
};

export const bumpAttempts = async (id: string): Promise<void> => {
  const store = await getStore();
  const entry = await store.get<OutboxEntry>('outbox', id);
  if (entry) await store.put('outbox', { ...entry, attempts: entry.attempts + 1 });
};
