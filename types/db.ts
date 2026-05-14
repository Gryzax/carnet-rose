// Local cache surface, shared by the native (expo-sqlite) and web
// (localforage) backends.
//
// Since the refactor to Supabase-first, the local store is no longer the
// source of truth: it is a write-through cache plus an offline outbox. It only
// needs to store and retrieve whole rows keyed by their (UUID) id — all
// filtering, sorting and aggregation happens in JS in the model layer, which
// keeps both backends tiny and identical in behaviour.

export type CacheTable =
  | 'classes'
  | 'students'
  | 'events'
  | 'term_archives'
  | 'outbox';

export interface CacheRow {
  id: string;
}

export interface CacheStore {
  /** Every row in a table. */
  all<T extends CacheRow = CacheRow>(table: CacheTable): Promise<T[]>;
  /** A single row by id, or null. */
  get<T extends CacheRow = CacheRow>(table: CacheTable, id: string): Promise<T | null>;
  /** Insert or replace a single row (by id). */
  put<T extends CacheRow = CacheRow>(table: CacheTable, row: T): Promise<void>;
  /** Insert or replace many rows (by id). */
  putMany<T extends CacheRow = CacheRow>(table: CacheTable, rows: T[]): Promise<void>;
  /** Remove a single row by id. No-op if absent. */
  remove(table: CacheTable, id: string): Promise<void>;
  /** Replace the entire contents of a table — used when pulling from Supabase. */
  replaceAll<T extends CacheRow = CacheRow>(table: CacheTable, rows: T[]): Promise<void>;
}
