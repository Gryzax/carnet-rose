import {
  deleteEvent,
  putArchive,
  putEvent,
  replaceAllArchives,
  replaceAllEvents
} from '../models/historyModel';
import {
  fetchArchives,
  fetchEvents,
  pushArchive,
  pushEvent,
  softDeleteEventRemote
} from '../services/remote/historyRemote';
import { invalidate } from '../lib/queryClient';
import { flushThenPull, pushOrQueue } from './shared';
import type { ArchiveRow, EventRow } from '../types/domain';

// History repository: events and term archives. Write-through to the cache,
// then push-or-queue to Supabase.

export const saveEvent = async (event: EventRow): Promise<void> => {
  await putEvent(event);
  invalidate('events');
  await pushOrQueue('event', 'upsert', event, (ctx) => pushEvent(ctx, event));
};

export const removeEvent = async (id: string): Promise<void> => {
  await deleteEvent(id);
  invalidate('events');
  await pushOrQueue('event', 'delete', { id }, (ctx) => softDeleteEventRemote(ctx, id));
};

export const saveArchive = async (archive: ArchiveRow): Promise<void> => {
  await putArchive(archive);
  invalidate('events');
  await pushOrQueue('archive', 'upsert', archive, (ctx) => pushArchive(ctx, archive));
};

export const refreshHistory = async (): Promise<void> => {
  const events = await flushThenPull(fetchEvents, replaceAllEvents);
  const archives = await flushThenPull(fetchArchives, replaceAllArchives);
  if (events || archives) invalidate('events');
};
