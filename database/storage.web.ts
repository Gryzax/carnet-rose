import localforage from 'localforage';
import type { CacheRow, CacheStore, CacheTable } from '../types/db';

// Web cache backend.
//
// Mirrors storage.native.ts: a write-through cache + outbox. The whole cache is
// a single localforage key holding one array per table — the dataset is tiny
// and this keeps reads/writes a single get/set.

const TABLES: CacheTable[] = ['classes', 'students', 'events', 'term_archives', 'outbox'];

type CacheState = Record<CacheTable, CacheRow[]>;

const store = localforage.createInstance({ name: 'CarnetRose', storeName: 'cache' });
const legacyStore = localforage.createInstance({ name: 'CarnetRose', storeName: 'database' });
const STORAGE_KEY = 'cache:v1';

const emptyState = (): CacheState => ({
  classes: [],
  students: [],
  events: [],
  term_archives: [],
  outbox: []
});

const loadState = async (): Promise<CacheState> => {
  const state = await store.getItem<CacheState>(STORAGE_KEY);
  if (!state) return emptyState();
  // Tolerate older payloads that predate a table.
  return { ...emptyState(), ...state };
};

const saveState = (state: CacheState): Promise<CacheState> => store.setItem(STORAGE_KEY, state);

// Best-effort: drop the pre-refactor offline-first database so it stops
// taking up space. It is no longer readable — the schema changed entirely.
void legacyStore.removeItem('state:v1').catch(() => {});

const cacheStore: CacheStore = {
  async all<T extends CacheRow = CacheRow>(table: CacheTable): Promise<T[]> {
    const state = await loadState();
    return [...(state[table] as T[])];
  },

  async get<T extends CacheRow = CacheRow>(table: CacheTable, id: string): Promise<T | null> {
    const state = await loadState();
    return (state[table] as T[]).find((row) => row.id === id) ?? null;
  },

  async put<T extends CacheRow = CacheRow>(table: CacheTable, row: T): Promise<void> {
    const state = await loadState();
    const rows = state[table] as T[];
    const index = rows.findIndex((existing) => existing.id === row.id);
    if (index >= 0) rows[index] = row;
    else rows.push(row);
    await saveState(state);
  },

  async putMany<T extends CacheRow = CacheRow>(table: CacheTable, rows: T[]): Promise<void> {
    const state = await loadState();
    const current = state[table] as T[];
    for (const row of rows) {
      const index = current.findIndex((existing) => existing.id === row.id);
      if (index >= 0) current[index] = row;
      else current.push(row);
    }
    await saveState(state);
  },

  async remove(table: CacheTable, id: string): Promise<void> {
    const state = await loadState();
    state[table] = (state[table] as CacheRow[]).filter((row) => row.id !== id);
    await saveState(state);
  },

  async replaceAll<T extends CacheRow = CacheRow>(table: CacheTable, rows: T[]): Promise<void> {
    const state = await loadState();
    state[table] = [...rows];
    await saveState(state);
  }
};

export const getStore = async (): Promise<CacheStore> => {
  // Ensure the storage key exists so concurrent first writers don't race.
  const state = await loadState();
  if (TABLES.some((table) => !(table in state))) await saveState(state);
  return cacheStore;
};
