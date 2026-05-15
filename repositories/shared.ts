import { enqueue, type OutboxEntity, type OutboxOp } from '../database/outbox';
import { getRemoteContext, type ReadyRemoteContext } from '../services/remote/context';
import { isOnline } from '../net/connectivity';
import { flushOutbox } from '../sync/flush';

// Shared write/refresh helpers for the per-entity repositories.

type Payload = { id: string };

/**
 * Push a mutation to Supabase now, or queue it in the outbox if we're offline,
 * unauthenticated, or the push fails. The cache has already been updated by the
 * caller, so the UI is correct either way — this only governs the remote side.
 */
export const pushOrQueue = async (
  entity: OutboxEntity,
  op: OutboxOp,
  payload: Payload,
  push: (ctx: ReadyRemoteContext) => Promise<void>,
): Promise<void> => {
  if (isOnline()) {
    const ctx = await getRemoteContext();
    if (ctx.ready) {
      try {
        await push(ctx);
        return;
      } catch {
        // Fall through to queueing — most likely the network dropped.
      }
    }
  }
  await enqueue(entity, op, payload);
};

/**
 * Refresh a table from Supabase: first flush any pending writes, then — only if
 * the outbox is now empty — pull the authoritative rows and replace the cache.
 *
 * Skipping the pull while the outbox is non-empty is deliberate: a `replaceAll`
 * would otherwise wipe locally-created rows that haven't been pushed yet.
 * Returns true if the cache was refreshed from the server.
 */
export const flushThenPull = async <T>(
  fetch: (ctx: ReadyRemoteContext) => Promise<T[]>,
  replaceAll: (rows: T[]) => Promise<void>,
): Promise<boolean> => {
  const remaining = await flushOutbox();
  if (remaining > 0) return false;
  const ctx = await getRemoteContext();
  if (!ctx.ready) return false;
  try {
    const rows = await fetch(ctx);
    await replaceAll(rows);
    return true;
  } catch {
    return false;
  }
};
