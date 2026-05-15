import { getStore } from '../database/db';
import type { ArchiveRow, EventRow } from '../types/domain';

// Event & archive accessors over the local cache.

// `previousForgets` / `newForgets` were added after launch — default them for
// events cached before then so undo can restore the counter safely.
const normalizeEvent = (event: EventRow): EventRow => ({
  ...event,
  previousForgets: event.previousForgets ?? 0,
  newForgets: event.newForgets ?? 0,
});

export const getCurrentHistory = async (
  studentId: string,
  trimester: number,
): Promise<EventRow[]> => {
  const store = await getStore();
  const events = await store.all<EventRow>('events');
  return events
    .filter((event) => event.studentId === studentId && event.trimester === trimester)
    .map(normalizeEvent)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
};

export const getLastActiveEvent = async (studentId: string): Promise<EventRow | null> => {
  const store = await getStore();
  const events = await store.all<EventRow>('events');
  return (
    events
      .filter((event) => event.studentId === studentId && event.cancelled === 0)
      .map(normalizeEvent)
      .sort(
        (a, b) =>
          String(b.createdAt).localeCompare(String(a.createdAt)) ||
          String(b.id).localeCompare(String(a.id)),
      )[0] || null
  );
};

export const getAllEvents = async (): Promise<EventRow[]> => {
  const store = await getStore();
  const events = await store.all<EventRow>('events');
  return events
    .map(normalizeEvent)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
};

export const putEvent = async (event: EventRow): Promise<void> => {
  const store = await getStore();
  await store.put('events', event);
};

export const deleteEvent = async (id: string): Promise<void> => {
  const store = await getStore();
  await store.remove('events', id);
};

export const replaceAllEvents = async (events: EventRow[]): Promise<void> => {
  const store = await getStore();
  await store.replaceAll('events', events);
};

export const getArchives = async (studentId: string): Promise<ArchiveRow[]> => {
  const store = await getStore();
  const archives = await store.all<ArchiveRow>('term_archives');
  return archives
    .filter((archive) => archive.studentId === studentId)
    .sort((a, b) => String(b.archivedAt).localeCompare(String(a.archivedAt)));
};

export const getAllArchives = async (): Promise<ArchiveRow[]> => {
  const store = await getStore();
  const archives = await store.all<ArchiveRow>('term_archives');
  return archives.sort((a, b) => String(a.archivedAt).localeCompare(String(b.archivedAt)));
};

export const putArchive = async (archive: ArchiveRow): Promise<void> => {
  const store = await getStore();
  await store.put('term_archives', archive);
};

export const replaceAllArchives = async (archives: ArchiveRow[]): Promise<void> => {
  const store = await getStore();
  await store.replaceAll('term_archives', archives);
};
