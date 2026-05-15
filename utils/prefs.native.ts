import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | undefined;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('carnet_rose_prefs.db');
    await db.execAsync('CREATE TABLE IF NOT EXISTS prefs (k TEXT PRIMARY KEY NOT NULL, v TEXT);');
  }
  return db;
};

export const getPref = async (key: string): Promise<string | null> => {
  const conn = await getDb();
  const row = await conn.getFirstAsync<{ v: string | null }>(
    'SELECT v FROM prefs WHERE k = ?',
    key,
  );
  return row ? row.v : null;
};

export const setPref = async (key: string, value: string): Promise<void> => {
  const conn = await getDb();
  await conn.runAsync('INSERT OR REPLACE INTO prefs (k, v) VALUES (?, ?)', key, value);
};
