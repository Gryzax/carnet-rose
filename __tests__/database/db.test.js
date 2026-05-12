jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

import { migrate, seedDemo } from '../../database/db';

const createMockDb = (count = 0) => ({
  sql: [],
  runs: [],
  execAsync: jest.fn(function (sql) { this.sql.push(sql); return Promise.resolve(); }),
  getFirstAsync: jest.fn(() => Promise.resolve({ count })),
  runAsync: jest.fn(function (...args) { this.runs.push(args); return Promise.resolve({ lastInsertRowId: this.runs.length }); })
});

test('création des tables et migrations', async () => {
  const db = createMockDb();
  await migrate(db);
  expect(db.execAsync).toHaveBeenCalled();
  expect(db.sql.join(' ')).toContain('CREATE TABLE IF NOT EXISTS classes');
  expect(db.sql.join(' ')).toContain('archive_trimestre');
});

test('CRUD classes via seed demo', async () => {
  const db = createMockDb();
  await seedDemo(db);
  expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO classes'), '6e Rose');
  expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO classes'), '5e Pivoine');
});

test('CRUD élèves via seed demo', async () => {
  const db = createMockDb();
  await seedDemo(db);
  expect(db.runs.filter((r) => String(r[0]).includes('INSERT INTO eleves'))).toHaveLength(10);
});

test('persistance des données: seed ignoré si données présentes', async () => {
  const db = createMockDb(1);
  await seedDemo(db);
  expect(db.runAsync).not.toHaveBeenCalled();
});

test('seed demo charge deux classes et dix élèves', async () => {
  const db = createMockDb();
  await seedDemo(db);
  expect(db.runs).toHaveLength(12);
});
