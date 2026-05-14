import * as SQLite from 'expo-sqlite';
import type { CacheRow, CacheStore, CacheTable } from '../types/db';

// Native cache backend.
//
// The local store is just a write-through cache + outbox now, so every table
// is stored the same trivial way: one SQLite table per cache table, each row a
// (id, data-as-JSON) pair. Filtering/sorting/aggregation happens in JS in the
// model layer — the dataset is small (a few classes, dozens of students), so
// there is nothing to gain from real columns or indexes.

const TABLES: CacheTable[] = ['classes', 'students', 'events', 'term_archives', 'outbox'];

let dbPromise: Promise<SQLite.SQLiteDatabase> | undefined;

const openDb = async (): Promise<SQLite.SQLiteDatabase> => {
  const conn = await SQLite.openDatabaseAsync('carnet_rose.db');
  await conn.execAsync('PRAGMA journal_mode = WAL;');
  for (const table of TABLES) {
    await conn.execAsync(
      `CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);`
    );
  }
  return conn;
};

const getConn = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
};

const store: CacheStore = {
  async all<T extends CacheRow = CacheRow>(table: CacheTable): Promise<T[]> {
    const conn = await getConn();
    const rows = await conn.getAllAsync<{ data: string }>(`SELECT data FROM ${table}`);
    return rows.map((row) => JSON.parse(row.data) as T);
  },

  async get<T extends CacheRow = CacheRow>(table: CacheTable, id: string): Promise<T | null> {
    const conn = await getConn();
    const row = await conn.getFirstAsync<{ data: string }>(
      `SELECT data FROM ${table} WHERE id = ?`,
      id
    );
    return row ? (JSON.parse(row.data) as T) : null;
  },

  async put<T extends CacheRow = CacheRow>(table: CacheTable, row: T): Promise<void> {
    const conn = await getConn();
    await conn.runAsync(
      `INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`,
      row.id,
      JSON.stringify(row)
    );
  },

  async putMany<T extends CacheRow = CacheRow>(table: CacheTable, rows: T[]): Promise<void> {
    const conn = await getConn();
    for (const row of rows) {
      await conn.runAsync(
        `INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`,
        row.id,
        JSON.stringify(row)
      );
    }
  },

  async remove(table: CacheTable, id: string): Promise<void> {
    const conn = await getConn();
    await conn.runAsync(`DELETE FROM ${table} WHERE id = ?`, id);
  },

  async replaceAll<T extends CacheRow = CacheRow>(table: CacheTable, rows: T[]): Promise<void> {
    const conn = await getConn();
    await conn.runAsync(`DELETE FROM ${table}`);
    for (const row of rows) {
      await conn.runAsync(
        `INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`,
        row.id,
        JSON.stringify(row)
      );
    }
  },

  async clear(): Promise<void> {
    const conn = await getConn();
    for (const table of TABLES) {
      await conn.runAsync(`DELETE FROM ${table}`);
    }
  }
};

export const getStore = async (): Promise<CacheStore> => {
  await getConn();
  return store;
};
