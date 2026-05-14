import { flushOutbox } from './flush';
import { onReconnect } from '../net/connectivity';
import { refreshClasses } from '../repositories/classRepository';
import { refreshStudents } from '../repositories/studentRepository';
import { refreshHistory } from '../repositories/historyRepository';

// Orchestrates the offline outbox + cache refresh.
//
// The repositories already flush-then-pull on demand (screen mounts). This adds
// the time-based and connectivity-based triggers so pending writes leave the
// device "ASAP": on app start, the moment the network comes back, and on a slow
// background interval as a safety net.

const SYNC_INTERVAL_MS = 20000;
let started = false;

/** Flush pending writes, then pull every entity from Supabase. */
export const refreshAll = async (): Promise<void> => {
  await flushOutbox();
  await Promise.all([refreshClasses(), refreshStudents(), refreshHistory()]);
};

export const startSyncManager = (): void => {
  if (started) return;
  started = true;

  // Network just came back — drain the queue and re-pull immediately.
  onReconnect(() => {
    refreshAll().catch(() => {});
  });

  // Safety net: keep retrying the outbox on a slow interval.
  setInterval(() => {
    flushOutbox().catch(() => {});
  }, SYNC_INTERVAL_MS);

  // Initial pass on launch.
  refreshAll().catch(() => {});
};
